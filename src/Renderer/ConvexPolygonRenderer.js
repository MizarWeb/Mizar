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
    "../Utils/Utils",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog",
    "./VectorRenderer",
    "./Program",
    "./FeatureStyle",
    "./RendererManager",
    "../Tiling/Triangulator",
    "../Utils/Proxy",
    "./glMatrix"
], function(
    Utils,
    Constants,
    ErrorDialog,
    VectorRenderer,
    Program,
    FeatureStyle,
    RendererManager,
    Proxy,
    Triangulator
) {
    /**
         @name Bucket
         @class
          Bucket constructor for ConvexPolygonRenderer
         @param layer
         @param style
         @constructor
         */
    var Bucket = function(layer, style) {
        this.layer = layer;
        this.style = new FeatureStyle(style);
        this.texture = null;
        this.polygonProgram = null;
        this.renderer = null;
        this.mainRenderable = null;
    };

    /**
     * Check if a bucket is compatible
     * @function isCompatible
     * @memberof Bucket.prototype
     * @param style
     * @return {boolean} Is compatible ?
     */
    Bucket.prototype.isCompatible = function(style) {
        if (
            this.style.strokeColor[0] === style.strokeColor[0] &&
            this.style.strokeColor[1] === style.strokeColor[1] &&
            this.style.strokeColor[2] === style.strokeColor[2] &&
            this.style.fill === style.fill &&
            this.style.fillTexture === style.fillTexture &&
            this.style.fillTextureUrl === style.fillTextureUrl &&
            this.style.fillShader === style.fillShader
        ) {
            return true;
        }
        return false;
    };

    /**************************************************************************************************************/

    /**
          @name Renderable
          @class
            Renderable constructor
            Attach to a bucket
          @param {Bucket} bucket Bucket
          @constructor
         */
    var Renderable = function(bucket) {
        this.bucket = bucket;
        this.geometry2vb = {};
        this.vertices = [];
        this.lineIndices = [];
        this.triangleIndices = [];
        this.vertexBuffer = null;
        this.lineIndexBuffer = null;
        this.triangleIndexBuffer = null;
        this.bufferDirty = false;
        this.triBufferDirty = false;
        this.tcoords = [];
    };

    /**************************************************************************************************************/

    /**
     * Add the geometry to the renderable
     * @function add
     * @memberof Renderable.prototype
     * @return if the geometry has been successfully added to the renderable
     */
    Renderable.prototype.add = function(geometry) {
        var rings = [];
        var geometryCrs = "Equatorial";//geometry.crs.properties.name;
        var i, r, pt;
        if (geometry.type === Constants.GEOMETRY.MultiPolygon) {
            for (i = 0; i < geometry.coordinates.length; i++) {
                rings.push(geometry.coordinates[i][0]);
            }
        } else if (geometry.type === Constants.GEOMETRY.LineString) {
            rings.push(geometry.coordinates);
        } else if (geometry.type === Constants.GEOMETRY.MultiLineString) {
            for (i = 0; i < geometry.coordinates.length; i++) {
                rings.push(geometry.coordinates[i]);
            }
        } else {
            rings.push(geometry.coordinates[0]);
        }

        for (r = 0; r < rings.length; r++) {
            var coords = rings[r];
            // var coords = geometry['coordinates'][0];
            //var numPoints = coords.length-1;
            var numPoints = coords.length;

            // Store information for the geometry in the buffers used for rendering
            var data = {
                vertexStart: this.vertices.length,
                vertexCount: 3 * numPoints,
                lineIndexStart: this.lineIndices.length,
                lineIndexCount: 2 * numPoints,
                triIndexStart: 0,
                triIndexCount: 0
            };

            var coordinateSystem = this.bucket.renderer.globe.getCoordinateSystem();
            // Compute texture coordinates if defined
            if (geometry._imageCoordinates) {
                data.tcoordsStart = this.tcoords.length;
                data.tcoordsCount = 2 * numPoints;

                // Initialize variables used for texture coordinates computation
                var p0 = coordinateSystem.get3DFromWorldInCrs(
                    geometry._imageCoordinates[0][0],
                    geometryCrs
                ); // origin
                var p1 = coordinateSystem.get3DFromWorldInCrs(
                    geometry._imageCoordinates[0][1],
                    geometryCrs
                );
                var p3 = coordinateSystem.get3DFromWorldInCrs(
                    geometry._imageCoordinates[0][3],
                    geometryCrs
                );
                var v01 = [];
                vec3.subtract(p1, p0, v01); // U-axis
                var v03 = [];
                vec3.subtract(p3, p0, v03); // V-axis
                var squaredU = vec3.length(v01) * vec3.length(v01);
                var squaredV = vec3.length(v03) * vec3.length(v03);

                for (i = 0; i < numPoints; i++) {
                    pt = coordinateSystem.get3DFromWorldInCrs(
                        coords[i],
                        geometryCrs
                    );
                    var v0P = [];
                    vec3.subtract(pt, p0, v0P);

                    var uDotProduct = vec3.dot(v0P, v01);
                    var vDotProduct = vec3.dot(v0P, v03);
                    var u = uDotProduct / squaredU;
                    var v = vDotProduct / squaredV;
                    this.tcoords.push(u);
                    this.tcoords.push(v);
                }
            }

            // Compute vertices and indices and store them in the buffers
            var startIndex = this.vertices.length / 3;
            for (i = 0; i < numPoints; i++) {
                pt = coordinateSystem.get3DFromWorldInCrs(
                    coords[i],
                    geometryCrs
                );
                this.vertices.push(pt[0], pt[1], pt[2]);

                if (
                    (geometry.type === Constants.GEOMETRY.MultiLineString ||
                        geometry.type === Constants.GEOMETRY.LineString) &&
                    i === numPoints - 1
                ) {
                    break;
                }
                this.lineIndices.push(
                    startIndex + i,
                    startIndex + ((i + 1) % numPoints)
                );
            }

            // If fill, build the triangle indices
            if (this.bucket.style.fill) {
                data.triIndexStart = this.triangleIndices.length;
                data.triIndexCount = 3 * (numPoints - 2);

                var triangleIndices = Triangulator.process(coords);
                if (triangleIndices !== null) {
                    this.triangleIndices = triangleIndices;
                } else {
                    // HACK for not trivial polygons
                    for (i = 0; i < numPoints - 2; i++) {
                        this.triangleIndices.push(
                            startIndex,
                            startIndex + i + 1,
                            startIndex + i + 2
                        );
                    }
                }
            }

            if (this.geometry2vb[geometry.gid]) {
                this.geometry2vb[geometry.gid].vertexCount += data.vertexCount;
                this.geometry2vb[geometry.gid].lineIndexCount +=
                    data.lineIndexCount;
                this.geometry2vb[geometry.gid].triIndexCount +=
                    data.triIndexCount;
            } else {
                this.geometry2vb[geometry.gid] = data;
            }

            this.bufferDirty = true;
            this.triBufferDirty = true;
        }

        return true;
    };

    /**************************************************************************************************************/

    /**
     * Remove the geometry from the renderable
     * @function remove
     * @memberof Renderable.prototype
     * @param geometry
     */
    Renderable.prototype.remove = function(geometry) {
        var i;
        if (this.geometry2vb.hasOwnProperty(geometry.gid)) {
            // retreive the render data for the geometry
            var data = this.geometry2vb[geometry.gid];
            delete this.geometry2vb[geometry.gid];

            // Remove geometry vertex
            this.vertices.splice(data.vertexStart, data.vertexCount);

            // Update indices after vertex removal
            for (
                i = data.lineIndexStart + data.lineIndexCount;
                i < this.lineIndices.length;
                i++
            ) {
                this.lineIndices[i] -= data.vertexCount / 3;
            }
            for (
                i = data.triIndexStart + data.triIndexCount;
                i < this.triangleIndices.length;
                i++
            ) {
                this.triangleIndices[i] -= data.vertexCount / 3;
            }

            this.lineIndices.splice(data.lineIndexStart, data.lineIndexCount);
            this.triangleIndices.splice(data.triIndexStart, data.triIndexCount);
            if (data.tcoordsStart >= 0) {
                this.tcoords.splice(data.tcoordsStart, data.tcoordsCount);
            }

            // Update render data for all other geometries
            for (var g in this.geometry2vb) {
                if (g) {
                    var d = this.geometry2vb[g];
                    if (d.vertexStart > data.vertexStart) {
                        d.vertexStart -= data.vertexCount;
                        d.lineIndexStart -= data.lineIndexCount;
                        d.triIndexStart -= data.triIndexCount;
                        if (d.tcoordsStart >= 0) {
                            d.tcoordsStart -= data.tcoordsCount;
                        }
                    }
                }
            }

            this.bufferDirty = true;
            this.triBufferDirty = true;
        }
        return this.vertices.length;
    };

    /**************************************************************************************************************/

    /**
     * Dispose the renderable : remove all buffers
     * @function dispose
     * @memberof Renderable.prototype
     * @param renderContext
     */
    Renderable.prototype.dispose = function(renderContext) {
        if (this.vertexBuffer) {
            renderContext.gl.deleteBuffer(this.vertexBuffer);
        }
        if (this.lineIndexBuffer) {
            renderContext.gl.deleteBuffer(this.lineIndexBuffer);
        }
        if (this.triangleIndexBuffer) {
            renderContext.gl.deleteBuffer(this.triangleIndexBuffer);
        }
        if (this.tcoordBuffer) {
            renderContext.gl.deleteBuffer(this.tcoordBuffer);
        }
    };

    /**
     * Create a renderable for this bucket
     * @function createRenderable
     * @memberof Bucket.prototype
     * @return {Renderable} Renderable
     */
    Bucket.prototype.createRenderable = function() {
        return new Renderable(this);
    };

    /**************************************************************************************************************/

    /**
          @name ConvexPolygonRenderer
          @class
            ConvexPolygonRenderer  constructor
          @augments VectorRenderer
          @param {AbstractGlobe} globe AbstractGlobe
          @constructor
          */
    var ConvexPolygonRenderer = function(globe) {
        VectorRenderer.prototype.constructor.call(this, globe);
        this.maxTilePerGeometry = 2;

        // Store object for rendering
        this.renderContext = globe.tileManager.renderContext;
        this.tileConfig = globe.tileManager.tileConfig;

        this.programs = [];

        this.basicVertexShader = "attribute vec3 vertex;\n";
        this.basicVertexShader += "uniform mat4 viewProjectionMatrix;\n";
        this.basicVertexShader += "    \n";
        this.basicVertexShader += "    void main(void)\n";
        this.basicVertexShader += "    {\n";
        this.basicVertexShader +=
            "        gl_Position = viewProjectionMatrix * vec4(vertex, 1.0);\n";
        this.basicVertexShader += "    }\n";

        this.basicFragmentShader = "precision lowp float; \n";
        this.basicFragmentShader += "    uniform vec4 color; \n";
        this.basicFragmentShader += "    \n";
        this.basicFragmentShader += "    void main(void) \n";
        this.basicFragmentShader += "    { \n";
        this.basicFragmentShader += "        gl_FragColor = color; \n";
        this.basicFragmentShader += "    } \n";

        this.texVertexShader = "attribute vec3 vertex;\n";
        this.texVertexShader += "    attribute vec2 tcoord;\n";
        this.texVertexShader += "    uniform mat4 viewProjectionMatrix;\n";
        this.texVertexShader += "    \n";
        this.texVertexShader += "    varying vec2 vTextureCoord;\n";
        this.texVertexShader += "    \n";
        this.texVertexShader += "    void main(void) \n";
        this.texVertexShader += "    {\n";
        this.texVertexShader += "        vTextureCoord = tcoord;\n";
        this.texVertexShader +=
            "        vTextureCoord.y = 1.0 - vTextureCoord.y; \n";
        this.texVertexShader +=
            "        gl_Position = viewProjectionMatrix * vec4(vertex, 1.0);\n";
        this.texVertexShader += "    }\n";

        this.texFragmentShader = "precision lowp float; \n";
        this.texFragmentShader += "    uniform vec4 color;\n";
        this.texFragmentShader += "    varying vec2 vTextureCoord;\n";
        this.texFragmentShader += "    uniform sampler2D texture; \n";
        this.texFragmentShader += "    void main(void)\n";
        this.texFragmentShader += "    {\n";
        this.texFragmentShader +=
            "        gl_FragColor = texture2D(texture, vTextureCoord) * color;\n";
        this.texFragmentShader += "    }\n";

        this.basicFillShader = {
            vertexCode: this.basicVertexShader,
            fragmentCode: this.basicFragmentShader,
            updateUniforms: null
        };

        this.texFillShader = {
            vertexCode: this.texVertexShader,
            fragmentCode: this.texFragmentShader,
            updateUniforms: null
        };

        this.basicProgram = this.createProgram(this.basicFillShader);
        this.texProgram = this.createProgram(this.texFillShader);

        var gl = this.renderContext.gl;
        // Parameters used to implement ONE shader for color xor texture rendering
        this.whiteTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.whiteTexture);
        var whitePixel = new Uint8Array([255, 255, 255, 255]);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            whitePixel
        );

        // Shared buffer
        // Create texCoord buffer
        this.tcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tcoordBuffer);

        var textureCoords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0];

        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(textureCoords),
            gl.STATIC_DRAW
        );
        this.tcoordBuffer.itemSize = 2;
        this.tcoordBuffer.numItems = 5;
    };

    Utils.inherits(VectorRenderer, ConvexPolygonRenderer);

    /**************************************************************************************************************/

    /**
     * Check if renderer is applicable
     * @function canApply
     * @memberof ConvexPolygonRenderer.prototype
     * @param type
     * @param style
     * @return {boolean} Is applicable ?
     */
    ConvexPolygonRenderer.prototype.canApply = function(type, style) {
        if (!this.globe.isSky()) {
            return false;
        }

        return (
            type === Constants.GEOMETRY.Polygon ||
            type === Constants.GEOMETRY.MultiPolygon ||
            type === Constants.GEOMETRY.LineString ||
            type === Constants.GEOMETRY.MultiLineString
        );
    };

    /**************************************************************************************************************/

    /**
     * Create program from fillShader object
     * @function createProgram
     * @memberof ConvexPolygonRenderer.prototype
     * @param fillShader
     * @return {Program} Program
     */
    ConvexPolygonRenderer.prototype.createProgram = function(fillShader) {
        var program = new Program(this.renderContext);
        program.createFromSource(
            fillShader.vertexCode,
            fillShader.fragmentCode
        );

        // Add program
        program.id = this.programs.length;
        this.programs.push({
            fillShader: fillShader,
            program: program
        });
        return program;
    };

    /**************************************************************************************************************/

    /**
     * Get program if known by renderer, create otherwise
     * @function getProgram
     * @memberof ConvexPolygonRenderer.prototype
     * @param fillShader
     * @return {Program} Program
     */
    ConvexPolygonRenderer.prototype.getProgram = function(fillShader) {
        var program;

        for (var id = 0; id < this.programs.length; id++) {
            if (this.programs[id].fillShader === fillShader) {
                program = this.programs[id].program;
            }
        }

        if (!program) {
            program = this.createProgram(fillShader);
        }
        return program;
    };

    /**************************************************************************************************************/

    /**
     * Create bucket to render a polygon
     * @function createBucket
     * @memberof ConvexPolygonRenderer.prototype
     * @param layer
     * @param style
     * @return {Bucket} Bucket
     */
    ConvexPolygonRenderer.prototype.createBucket = function(layer, style) {
        var gl = this.renderContext.gl;
        var vb = gl.createBuffer();
        // Create a bucket
        var bucket = new Bucket(layer, style);

        // Create texture
        var self = this;
        if (style.fill) {
            var hasTexture = false;
            if (style.fillTextureUrl) {
                var image = new Image();
                image.crossOrigin = "";
                image.onload = function() {
                    bucket.texture = self.renderContext.createNonPowerOfTwoTextureFromImage(
                        image,
                        layer.invertY
                    );
                };

                image.onerror = function(event) {
                    ErrorDialog.open(Constants.LEVEL.WARNING, "Cannot load " + image.src);
                };

                image.src = Proxy.proxify(style.fillTextureUrl);
                hasTexture = true;
            } else if (style.fillTexture) {
                bucket.texture = style.fillTexture;
                hasTexture = true;
            }

            if (style.fillShader && style.fillShader.fragmentCode) {
                // User defined texture program
                if (!style.fillShader.vertexCode) {
                    style.fillShader.vertexCode = this.texVertexShader;
                }
                if (!style.fillShader.vertexCode) {
                    style.fillShader.fragmentCode = this.texFragmentShader;
                }

                bucket.polygonProgram = this.getProgram(style.fillShader);
            } else {
                // Default program
                bucket.polygonProgram = hasTexture
                    ? this.texProgram
                    : this.basicProgram;
            }
        }

        return bucket;
    };

    /**************************************************************************************************************/

    /**
     * Render all the POIs
     * @function render
     * @memberof ConvexPolygonRenderer.prototype
     * @param renderables
     * @param {Integer} start Start index
     * @param {Integer} end End index
     */
    ConvexPolygonRenderer.prototype.render = function(renderables, start, end) {
        var renderContext = this.renderContext;
        var gl = this.renderContext.gl;

        // Setup states
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Setup the basic program
        this.basicProgram.apply();
        mat4.multiply(
            renderContext.projectionMatrix,
            renderContext.viewMatrix,
            renderContext.modelViewMatrix
        );
        gl.uniformMatrix4fv(
            this.basicProgram.uniforms.viewProjectionMatrix,
            false,
            renderContext.modelViewMatrix
        );

        // Render each renderables
        var currentBucket = null;
        for (var n = start; n < end; n++) {
            var renderable = renderables[n];
            var bucket = renderable.bucket;

            // Set the color
            var color = bucket.style.getStrokeColor();
            gl.uniform4f(
                this.basicProgram.uniforms.color,
                color[0],
                color[1],
                color[2],
                color[3] * bucket.layer.getOpacity()
            );

            // Update vertex buffer
            if (!renderable.vertexBuffer) {
                renderable.vertexBuffer = gl.createBuffer();
                renderable.lineIndexBuffer = gl.createBuffer();
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, renderable.vertexBuffer);
            gl.vertexAttribPointer(
                this.basicProgram.attributes.vertex,
                3,
                gl.FLOAT,
                false,
                0,
                0
            );

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderable.lineIndexBuffer);

            if (renderable.bufferDirty) {
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array(renderable.vertices),
                    gl.STATIC_DRAW
                );
                gl.bufferData(
                    gl.ELEMENT_ARRAY_BUFFER,
                    new Uint16Array(renderable.lineIndices),
                    gl.STATIC_DRAW
                );
                renderable.bufferDirty = false;
            }

            gl.drawElements(
                gl.LINES,
                renderable.lineIndices.length,
                gl.UNSIGNED_SHORT,
                0
            );

            if (bucket.polygonProgram) {
                var program = bucket.polygonProgram;

                program.apply();
                gl.uniformMatrix4fv(
                    program.uniforms.viewProjectionMatrix,
                    false,
                    renderContext.modelViewMatrix
                );

                gl.uniform1i(program.uniforms.texture, 0);
                if (renderable.tcoords.length > 0) {
                    // Use tcoord buffer defined by _imageCoordinates
                    if (!renderable.tcoordBuffer) {
                        renderable.tcoordBuffer = gl.createBuffer();
                        gl.bindBuffer(gl.ARRAY_BUFFER, renderable.tcoordBuffer);

                        gl.bufferData(
                            gl.ARRAY_BUFFER,
                            new Float32Array(renderable.tcoords),
                            gl.STATIC_DRAW
                        );
                        renderable.tcoordBuffer.itemSize = 2;
                        renderable.tcoordBuffer.numItems =
                            renderable.tcoords.length / 2;
                    }

                    gl.bindBuffer(gl.ARRAY_BUFFER, renderable.tcoordBuffer);
                } else {
                    // Use default tcoord buffer
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.tcoordBuffer);
                }
                gl.vertexAttribPointer(
                    program.attributes.tcoord,
                    2,
                    gl.FLOAT,
                    false,
                    0,
                    0
                );

                gl.bindBuffer(gl.ARRAY_BUFFER, renderable.vertexBuffer);
                gl.vertexAttribPointer(
                    program.attributes.vertex,
                    3,
                    gl.FLOAT,
                    false,
                    0,
                    0
                );

                if (
                    bucket.style.fillShader &&
                    bucket.style.fillShader.updateUniforms
                ) {
                    bucket.style.fillShader.updateUniforms(
                        gl,
                        renderable.bucket,
                        program
                    );
                }

                if (!renderable.triangleIndexBuffer) {
                    renderable.triangleIndexBuffer = gl.createBuffer();
                }
                gl.bindBuffer(
                    gl.ELEMENT_ARRAY_BUFFER,
                    renderable.triangleIndexBuffer
                );
                if (renderable.triBufferDirty) {
                    gl.bufferData(
                        gl.ELEMENT_ARRAY_BUFFER,
                        new Uint16Array(renderable.triangleIndices),
                        gl.STATIC_DRAW
                    );
                    renderable.triBufferDirty = false;
                }
                // Add texture
                gl.activeTexture(gl.TEXTURE0);
                if (renderable.bucket.texture) {
                    gl.bindTexture(gl.TEXTURE_2D, renderable.bucket.texture); // use texture of renderable
                    gl.uniform4f(
                        program.uniforms.color,
                        1.0,
                        1.0,
                        1.0,
                        color[3] * bucket.layer.getOpacity()
                    ); // use whiteColor
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, this.whiteTexture); // use white texture
                    color = renderable.bucket.style.fillColor;
                    gl.uniform4f(
                        program.uniforms.color,
                        color[0],
                        color[1],
                        color[2],
                        color[3] * bucket.layer.getOpacity()
                    );
                }

                gl.drawElements(
                    gl.TRIANGLES,
                    renderable.triangleIndices.length,
                    gl.UNSIGNED_SHORT,
                    0
                );

                this.basicProgram.apply();
            }
        }

        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
    };

    /**************************************************************************************************************/

    RendererManager.factory.push(function(globe) {
        return new ConvexPolygonRenderer(globe);
    });

    return ConvexPolygonRenderer;
});
