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
        this.buckets = [];
    };

    /**************************************************************************************************************/

    PolyLineRenderer.prototype.generateLevelZero = function(tile) {
        // do nothing
    };

    /**************************************************************************************************************/

    var MainRenderable = function(bucket, rc) {
        this.bucket = bucket;

        this.renderable = new Renderable(bucket);
        this.clippedRenderable = new Renderable(bucket);

        this.vertexShader = `
        attribute vec3 vertex;
        uniform mat4 uModelViewProjMatrix;
        void main() {
        	gl_Position = uModelViewProjMatrix * vec4(vertex, 1.0);
        }
        `;

        this.fragmentShader = `
        precision lowp float;
        uniform vec4 uColor;
        void main() {
        	gl_FragColor = uColor;
        }
        `;

        this.clippedVertexShader = `
        attribute vec3 aVertex;
        uniform mat4 uModelViewProjMatrix;
        uniform mat4 uModelViewMatrix;

        uniform vec3 uClipPlane;
        uniform vec3 uClipNormal;

        varying float vClipDistance;

        void main() {
            gl_Position = uModelViewProjMatrix * vec4(aVertex, 1.0);

            //vec3 p = vec3(uModelViewMatrix * vec4(aVertex, 1.0));
            //vec3 c = vec3(uModelViewMatrix * vec4(uClipPlane.xyz, 1.0));
            //vec3 n = vec3(uModelViewMatrix * vec4(uClipPlane.w, 0, 0, 0));

            vec3 p = aVertex;
            vec3 c = uClipPlane;
            vec3 n = uClipNormal;

            vec3 a = normalize(p - c);
            n = normalize(n);

            vClipDistance = dot(a, n);
        }`;

        this.clippedFragmentShader = `
        precision lowp float;
        uniform vec4 uColor;

        varying float vClipDistance;

        void main() {
            if (vClipDistance < 0.0) discard;

            gl_FragColor = uColor;
        }
        `;

        this.program = new Program(rc);
        this.program.createFromSource(this.vertexShader, this.fragmentShader);

        this.clippedProgram = new Program(rc);
        this.clippedProgram.createFromSource(this.clippedVertexShader, this.clippedFragmentShader);

        this.matrix = mat4.create();

        this.leftClipPlane = vec3.create();
        this.leftClipNormal = vec3.create();

        this.rightClipPlane = vec3.create();
        this.rightClipNormal = vec3.create();
    };

    /**************************************************************************************************************/

    MainRenderable.prototype.renderDefault = function(rc, mvpMatrix, color) {
        const gl = rc.gl;

        this.program.apply();

        gl.uniformMatrix4fv(
            this.program.uniforms.uModelViewProjMatrix,
            false,
            mvpMatrix
        );
        gl.uniform4f(
            this.program.uniforms.uColor,
            color[0],
            color[1],
            color[2],
            color[3]
        );

        this.renderable.bindBuffers(rc);

        // Setup attributes
        gl.vertexAttribPointer(
            this.program.attributes.aVertex,
            3,
            gl.FLOAT,
            false,
            12,
            0
        );

        for (var line of this.renderable.lines) {
            // Draw
            gl.drawElements(
                gl.LINE_STRIP,
                line.indexCount,
                gl.UNSIGNED_INT,
                line.startIndex * 4 // * sizeof(int)
            );
        }
    };

    /**************************************************************************************************************/

    MainRenderable.prototype.renderClipped = function(rc, mvpMatrix, color) {
        const gl = rc.gl;

        this.clippedProgram.apply();

        const modelViewMatrix = mat4.create();

        mat4.multiply(
            rc.viewMatrix,
            this.matrix,
            modelViewMatrix
        );

        gl.uniformMatrix4fv(
            this.clippedProgram.uniforms.uModelViewProjMatrix,
            false,
            mvpMatrix
        );

        gl.uniformMatrix4fv(
            this.clippedProgram.uniforms.uModelViewMatrix,
            false,
            modelViewMatrix
        );

        gl.uniform4f(
            this.clippedProgram.uniforms.uColor,
            color[0],
            color[1],
            color[2],
            color[3]
        );

        this.clippedRenderable.bindBuffers(rc);

        // Setup attributes
        gl.vertexAttribPointer(
            this.clippedProgram.attributes.aVertex,
            3,
            gl.FLOAT,
            false,
            12,
            0
        );

        gl.uniform3f(
            this.clippedProgram.uniforms.uClipPlane,
            this.rightClipPlane[0],
            this.rightClipPlane[1],
            this.rightClipPlane[2]
        );

        gl.uniform3f(
            this.clippedProgram.uniforms.uClipNormal,
            this.rightClipNormal[0],
            this.rightClipNormal[1],
            this.rightClipNormal[2]
        );

        var line;
        for (line of this.clippedRenderable.lines) {
            // Draw
            gl.drawElements(
                gl.LINE_STRIP,
                line.indexCount,
                gl.UNSIGNED_INT,
                line.startIndex * 4 // * sizeof(int)
            );
        }

        gl.uniform3f(
            this.clippedProgram.uniforms.uClipPlane,
            this.leftClipPlane[0],
            this.leftClipPlane[1],
            this.leftClipPlane[2]
        );

        gl.uniform3f(
            this.clippedProgram.uniforms.uClipNormal,
            this.leftClipNormal[0],
            this.leftClipNormal[1],
            this.leftClipNormal[2]
        );

        for (line of this.clippedRenderable.clippedLines) {
            // Draw
            gl.drawElements(
                gl.LINE_STRIP,
                line.indexCount,
                gl.UNSIGNED_INT,
                line.startIndex * 4 // * sizeof(int)
            );
        }
    };

    /**************************************************************************************************************/

    MainRenderable.prototype.render = function(rc, viewProjMatrix) {
        const gl = rc.gl;

        const layer = this.bucket.layer;
        const style = this.bucket.style;

        const modelViewProjMatrix = mat4.create();

        mat4.multiply(
            viewProjMatrix,
            this.matrix,
            modelViewProjMatrix
        );

        const color = style.strokeColor.slice(0);
        color[3] *= layer.getOpacity();

        gl.lineWidth(style.strokeWidth);
        this.renderDefault(rc, modelViewProjMatrix, color);
        this.renderClipped(rc, modelViewProjMatrix, color);
    };

    /**************************************************************************************************************/

    var Renderable = function(bucket) {
        this.bucket = bucket;

        this.vertices = [];
        this.indices = [];
        this.dirty = false;
        this.ibo = null;
        this.vbo = null;

        this.lines = [];
        this.clippedLines = [];
    };

    /**************************************************************************************************************/

    Renderable.prototype._clamp = function(x, a, b) {
        return Math.max(a, Math.min(x, b));
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
        const subdivisionCount = this._clamp(Math.floor(d / subdivisionLength), 1, maxSubdivisionCount);
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
    };

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
    };

    /**************************************************************************************************************/

    const _fixPoles = function(lines) {
        for (var line of lines) {
            for (var i = 0; i < line.length; ++i) {
                const curr = line[i];
                if (curr[1] === 90.0 || curr[1] === -90) {
                    if (i > 0 && i < line.length - 1) {
                        // General case
                        const prev = line[i-1];
                        const next = line[i+1];

                        if (prev[0] === curr[0]) {
                            line.splice(i + 1, 0, [next[0], curr[1], curr[2]]);
                            ++i;
                        } else if (next[0] === curr[0]) {
                            line.splice(i, 0, [prev[0], curr[1], curr[2]]);
                            ++i;
                        } else {
                            line.splice(i, 0, [prev[0], curr[1], curr[2]]);
                            ++i;
                            line.splice(i + 1, 0, [next[0], curr[1], curr[2]]);
                            ++i;
                        }
                    }
                    // edges
                    else if (i > 0) {
                        const prev = line[i-1];
                        if (prev[0] !== curr[0]) {
                            line.splice(i, 0, [prev[0], curr[1], curr[2]]);
                            ++i;
                        }
                    } else if (i < line.length - 1) {
                        const next = line[i+1];
                        if (next[0] !== curr[0]) {
                            line.splice(i + 1, 0, [next[0], curr[1], curr[2]]);
                            ++i;
                        }
                    }
                }
            }
        }
    };

    /**************************************************************************************************************/

    const _detectDiscontinuities = function(lines, normalLines, clippedLines) {
        for (var line of lines) {
            var continuous = true;
            for (var i = 0; continuous && i < line.length - 1; ++i) {
                const x0 = Math.min(line[i][0], line[i+1][0]);
                const x1 = Math.max(line[i][0], line[i+1][0]);

                if (x0 < 0 && x1 > 0) {
                    const d1 = x1 - x0;
                    const d2 = (360 + x0) - x1;

                    if (d2 < d1) {
                        continuous = false;
                    }
                }
            }

            if (continuous) {
                normalLines.push(line);
            } else {
                clippedLines.push(line);
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Add a geometry to the renderable
     * Vertex buffer : geometry
     * Index buffer : lines
     * @function build
     * @memberof Renderable.prototype
     * @param geometry
     */
    MainRenderable.prototype.build = function(geometry) {
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

        var origin = vec3.create();
        cs.get3DFromWorld(convertedCoord, origin); // Correction : add [0]

        mat4.identity(this.matrix);
        mat4.translate(this.matrix, origin);

        const leftPlane = [-180, 0, 0];
        const leftNormal = [1, 0, 0];
        cs.get3DFromWorldInCrs(leftPlane, crsName, this.leftClipPlane);
        cs.get3DFromWorldInCrs(leftNormal, crsName, this.leftClipNormal);

        const rightPlane = [180, 0, 0];
        const rightNormal = [-1, 0, 0];
        cs.get3DFromWorldInCrs(rightPlane, crsName, this.rightClipPlane);
        cs.get3DFromWorldInCrs(rightNormal, crsName, this.rightClipNormal);

        // Check if some lines are going through the poles
        // In this case, we want to duplicate the points that do not have the same x coordinate.
        _fixPoles(lines);

        var normalLines = [];
        var clippedLines = [];

        if (cs.flat === true) {
            _detectDiscontinuities(lines, normalLines, clippedLines);
        } else {
            normalLines = lines.slice(0);
        }

        this.renderable.build(normalLines, cs, crsName, origin);
        this.clippedRenderable.buildClipped(clippedLines, cs, crsName, origin);

        return true;
    };

    /**************************************************************************************************************/

    Renderable.prototype.build = function(lines, cs, crsName, origin) {
        var lastIndex = 0;
        var pos3d = vec3.create();

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
    };

    /**************************************************************************************************************/

    Renderable.prototype.buildClipped = function(lines, cs, crsName, origin) {
        var lastIndex = 0;
        var pos3d = vec3.create();
        var i;

        for (var line of lines) {
            var lineInfos = {
                startIndex: lastIndex,
                indexCount: -1
            };

            const line1 = [];
            const line2 = [];

            for (i = 0; i < line.length; ++i) {
                const x = line[i][0];
                const x1 = x >= 0 ? x : x + 360;
                const x2 = x <= 0 ? x : x - 360;

                line1.push([x1, line[i][1], line[i][2]]);
                line2.push([x2, line[i][1], line[i][2]]);
            }

            // First, subdivide the line
            const finalLine1 = this._subdivideLine(line1, crsName);
            var coords;

            for (coords of finalLine1) {
                cs.get3DFromWorldInCrs(coords, crsName, pos3d);
                for (i = 0; i < 3; ++i) this.vertices.push(pos3d[i] - origin[i]);
                this.indices.push(lastIndex++);
            }

            lineInfos.indexCount = lastIndex - lineInfos.startIndex;
            this.lines.push(lineInfos);

            lineInfos = {
                startIndex: lastIndex,
                indexCount: -1,
            };

            const finalLine2 = this._subdivideLine(line2, crsName);
            for (coords of finalLine2) {
                cs.get3DFromWorldInCrs(coords, crsName, pos3d);
                for (i = 0; i < 3; ++i) this.vertices.push(pos3d[i] - origin[i]);
                this.indices.push(lastIndex++);
            }

            lineInfos.indexCount = lastIndex - lineInfos.startIndex;
            this.clippedLines.push(lineInfos);
        }

        this.dirty = true;
    };

    /**************************************************************************************************************/

    Renderable.prototype.dispose = function(rc) {
        if (!rc) return;

        const gl = rc.gl;

        if (this.ibo) gl.deleteBuffer(this.ibo);
        if (this.vbo) gl.deleteBuffer(this.vbo);

        this.ibo = null;
        this.vbo = null;
    };

    /**************************************************************************************************************/

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
    };

    /**************************************************************************************************************/

    /**
     @name Bucket
     @class
         Bucket constructor for RasterOverlay
     @param layer
     @constructor
    */
    var Bucket = function(layer, style, rc) {
        this.layer = layer;
        this.renderer = null;
        this.style = new FeatureStyle(style);
        this.mainRenderable = new MainRenderable(this, rc);
        this.id = -1;
    };

    /**************************************************************************************************************/

    PolyLineRenderer.prototype.addGeometry = function(layer, geometry, style) {
        var bucket = new Bucket(layer, style, this.globe.renderContext);
        bucket.renderer = this;
        bucket.id = this.globe.getRendererManager().bucketId++;
        bucket.mainRenderable.build(geometry);

        geometry._bucket = bucket;

        this.buckets.push(bucket);
    };

    /**************************************************************************************************************/

    PolyLineRenderer.prototype.removeGeometry = function(layer, geometry) {
        var bucket = layer._bucket;
        if (bucket.mainRenderable) {
            // Cleanup opengl resources
            bucket.mainRenderable.dispose();
            bucket.mainRenderable = null;
        }
    };

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
        const rc = this.globe.renderContext;
        const gl = rc.gl;

        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthFunc(gl.LEQUAL);

        // Compute the viewProj matrix
        var viewProjMatrix = mat4.create();
        mat4.multiply(
            rc.projectionMatrix,
            rc.viewMatrix,
            viewProjMatrix
        );

        for (var n = start; n < end; n++) {
            var renderable = renderables[n];
            renderable.render(rc, viewProjMatrix);
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
        return new Bucket(layer, style);
    };

    /**************************************************************************************************************/

    // Register the renderer
    RendererManager.factory.push(function(globe) {
        return new PolyLineRenderer(globe);
    });
});
