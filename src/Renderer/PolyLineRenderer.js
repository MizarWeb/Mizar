/*******************************************************************************
 * Copyright 2017, 2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
 *
 * This file is part of MIZAR.
 *
 * MIZAR is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MIZAR is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

define([
    "../Utils/Constants",
    "../Utils/Utils",
    "./VectorRenderer",
    "./RendererManager",
    "./FeatureStyle",
    "./Program",
    "./BatchRenderable",
    "./GeoBound"
], function(
    Constants,
    Utils,
    VectorRenderer,
    RendererManager,
    FeatureStyle,
    Program,
    BatchRenderable,
    GeoBound
) {
    /**************************************************************************************************************/
    /**
     @name PolyLineRenderer
     @class
         Basic renderer for polylines
     @param {AbstractGlobe} globe AbstractGlobe
     @augments VectorRenderer
     @constructor
     */
    var PolyLineRenderer = function(globe) {
        this.globe = globe;
        this.renderContext = globe.renderContext;

        this.vertexShader = "attribute vec3 vertex;\n";
        this.vertexShader += "uniform mat4 mvp;\n";
        this.vertexShader += "void main(void) \n";
        this.vertexShader += "{\n";
        this.vertexShader += "	gl_Position = mvp * vec4(vertex, 1.0);\n";
        this.vertexShader += "}\n";

        this.fragmentShader = "precision lowp float; \n";
        this.fragmentShader += "uniform vec4 u_color;\n";
        this.fragmentShader += "void main(void)\n";
        this.fragmentShader += "{\n";
        this.fragmentShader += "	gl_FragColor = u_color;\n";
        this.fragmentShader += "}\n";

        this.program = new Program(globe.renderContext);
        this.program.createFromSource(this.vertexShader, this.fragmentShader);

        this.buckets = [];
    };

    /**************************************************************************************************************/

    PolyLineRenderer.prototype.generateLevelZero = function(tile) {
        // do nothing
    }

    /**************************************************************************************************************/

    var Renderable = function(bucket) {
        this.bucket = bucket;

        this.vertices = [];
        this.indices = [];
        this.dirty = false;
        this.ibo = null;
        this.vbo = null;

        this.matrix = mat4.create();
    };


    /**************************************************************************************************************/

    Renderable.prototype._subdivideSegment = function(p0, p1, crsName) {
        const globe = this.bucket.renderer.globe;
        const cs = globe.getCoordinateSystem();
        const scale = cs.getGeoide().getHeightScale();
        const subdivisionLength = globe.getSubdivisionLength() * scale;
        const maxSubdivisionCount = globe.getMaxSubdivisionCount();

        var p0in3d = vec3.create(); cs.get3DFromWorldInCrs(p0, crsName, p0in3d);
        var p1in3d = vec3.create(); cs.get3DFromWorldInCrs(p1, crsName, p1in3d);

        const d = vec3.dist(p0in3d, p1in3d);
        const subdivisionCount = Math.min(Math.floor(d / subdivisionLength), maxSubdivisionCount);
        const alt0 = p0[2];
        const alt1 = p1[2];

        const result = [];
        const step = 1.0 / subdivisionCount;
        for (var i = 0; i <= subdivisionCount; ++i) {
            const t = i * step;

            var p = vec3.create(); vec3.lerp(p0in3d, p1in3d, t, p);
            var pInGeo = vec3.create(); cs.getWorldFrom3D(p, pInGeo);
            pInGeo[2] = (1 - t) * alt0 + t * alt1;
            result.push(pInGeo);
        }

        return result;
    }

    /**************************************************************************************************************/

    /**
     * Subdivide a line to follow planet curvature
     */
    Renderable.prototype._subdivideLine = function(line, crsName) {
        var result = [];

        for (var i = 0; i < line.length - 1; ++i) {
            result = result.concat(this._subdivideSegment(line[i], line[i + 1], crsName));
        }

        return result;
    }

    /**************************************************************************************************************/

    /**
     * Add a geometry to the renderbale
     * Vertex buffer : geometry|extrude
     * Index buffer : geometry triangles|extrude triangles|lines
     * Normal buffer : normals.xyz, extrude value as w
     * @function build
     * @memberof PolyLineRenderable.prototype
     * @param geometry
     */
    Renderable.prototype.build = function(geometry) {
        var renderer = this.bucket.renderer;
        var style = this.bucket.style;
        var cs = renderer.globe.getCoordinateSystem();

        var lines;
        if (geometry.type === Constants.GEOMETRY.MultiLineString ||
            Array.isArray(geometry.coordinates[0][0])) {
            lines = geometry.coordinates;
        } else {
            lines = [geometry.coordinates];
        }

        var geometryBound = new GeoBound();
        var csBound = new GeoBound(
            cs.getGeoBound().getWest(),
            cs.getGeoBound().getSouth(),
            cs.getGeoBound().getEast(),
            cs.getGeoBound().getNorth()
        );
        var crsName = "CRS:84";
        if (typeof geometry.crs !== "undefined") {
            crsName = geometry.crs.properties.name;
        }
        var originPoint = lines[0][0].slice(0);
        originPoint[2] = 0.0;

        var convertedCoord = geometryBound.computeFromCoordinatesInCrsTo(
            originPoint,
            crsName,
            cs
        );

        var pos3d = vec3.create();
        var origin = vec3.create();
        cs.get3DFromWorld(convertedCoord, origin); // Correction : add [0]

        mat4.identity(this.matrix);
        mat4.translate(this.matrix, origin);

        var lastIndex = 0;
        this.lines = [];

        for (var line of lines) {
            var lineInfos = {
                startIndex: lastIndex,
                indexCount: -1
            };

            // First, subdivide the line
            const finalLine = this._subdivideLine(line, crsName);

            for (var coords of finalLine) {
                cs.get3DFromWorldInCrs(coords, crsName, pos3d);
                for (var i = 0; i < 3; ++i) this.vertices.push(pos3d[i] - origin[i]);
                this.indices.push(lastIndex++);
            }

            lineInfos.indexCount = lastIndex - lineInfos.startIndex;
            this.lines.push(lineInfos);
        }

        this.dirty = true;
        return true;
    };

    Renderable.prototype.dispose = function(rc) {
        if (!rc) return;

        const gl = rc.gl;

        if (this.ibo) gl.deleteBuffer(this.ibo);
        if (this.vbo) gl.deleteBuffer(this.vbo);

        this.ibo = null;
        this.vbo = null;
    }

    Renderable.prototype.bindBuffers = function(rc) {
        if (!rc) return;
        const gl = rc.gl;

        if (this.dirty) {
            this.dispose(rc);

            this.vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

            this.ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);
            this.dirty = false;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    }

    /**************************************************************************************************************/

    /**
     @name Bucket
     @class
         Bucket constructor for RasterOverlay
     @param layer
     @constructor
    */
    var Bucket = function(layer, style) {
        this.layer = layer;
        this.renderer = null;
        this.style = new FeatureStyle(style);
        this.mainRenderable = new Renderable(this);
        this.id = -1;
    };

    /**************************************************************************************************************/

    PolyLineRenderer.prototype.addGeometry = function(layer, geometry, style) {
        var bucket = new Bucket(layer, style);
        bucket.renderer = this;
        bucket.id = this.globe.getRendererManager().bucketId++;
        bucket.mainRenderable.build(geometry);

        geometry._bucket = bucket;

        this.buckets.push(bucket);
    }

    /**************************************************************************************************************/

    PolyLineRenderer.prototype.removeGeometry = function(layer, geometry) {
        var bucket = geometry._bucket;
        if (bucket.mainRenderable) {
            // Cleanup opengl resources
            bucket.mainRenderable.dispose();
            bucket.mainRenderable = null;
        }
    }

    /**************************************************************************************************************/

    /**
     *    Render all the lines
     * @function render
     * @memberof PolyLineRenderer.prototype
     * @param renderables
     * @param {Integer} start Start index
     * @param {Integer} end End index
     */
    PolyLineRenderer.prototype.render = function(renderables, start, end) {
        var renderContext = this.globe.renderContext;
        var gl = renderContext.gl;

        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthFunc(gl.LEQUAL);

        this.program.apply();

        // Compute the viewProj matrix
        var viewProjMatrix = mat4.create();
        mat4.multiply(
            renderContext.projectionMatrix,
            renderContext.viewMatrix,
            viewProjMatrix
        );

        var modelViewProjMatrix = mat4.create();
        for (var n = start; n < end; n++) {
            var renderable = renderables[n];
            var style = renderable.bucket.style;

            mat4.multiply(
                viewProjMatrix,
                renderable.matrix,
                modelViewProjMatrix
            );
            gl.uniformMatrix4fv(
                this.program.uniforms.mvp,
                false,
                modelViewProjMatrix
            );
            gl.uniform4f(
                this.program.uniforms.u_color,
                style.strokeColor[0],
                style.strokeColor[1],
                style.strokeColor[2],
                style.strokeColor[3] * renderable.bucket.layer.getOpacity()
            ); // use strokeColor

            renderable.bindBuffers(renderContext);
            gl.lineWidth(style.strokeWidth);

            // Setup attributes
            gl.vertexAttribPointer(
                this.program.attributes.vertex,
                3,
                gl.FLOAT,
                false,
                12,
                0
            );

            for (var line of renderable.lines) {
                // Draw
                gl.drawElements(
                    gl.LINE_STRIP,
                    line.indexCount,
                    gl.UNSIGNED_INT,
                    line.startIndex * 4 // * sizeof(int)
                );
            }
        }

        // Revert line width
        gl.lineWidth(1.0);

        //gl.enable(gl.DEPTH_TEST);
        //gl.disable(gl.POLYGON_OFFSET_FILL);
        gl.depthFunc(gl.LESS);
        gl.disable(gl.BLEND);
    };

    /**************************************************************************************************************/

    /**
     * Check if renderer is applicable
     * @function canApply
     * @memberof PolyLineRenderer.prototype
     * @param type
     * @param style
     * @return {Boolean} Can apply ?
     */
    PolyLineRenderer.prototype.canApply = function(type, style) {
        if (style.onTerrain === undefined || style.onTerrain === true) {
            return false;
        }

        return (
            type === Constants.GEOMETRY.LineString ||
            type === Constants.GEOMETRY.MultiLineString);
    };

    /**************************************************************************************************************/

    /**
     * Create a bucket
     * @function createBucket
     * @memberof PolyLineRenderer.prototype
     * @param layer
     * @param style
     * @return {PolyLineBucket} Bucket
     */
    PolyLineRenderer.prototype.createBucket = function(layer, style) {
        return new PolyLineBucket(layer, style);
    };

    /**************************************************************************************************************/

    // Register the renderer
    RendererManager.factory.push(function(globe) {
        return new PolyLineRenderer(globe);
    });
});
