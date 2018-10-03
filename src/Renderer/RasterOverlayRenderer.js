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
    "./Program",
    "../Tiling/Tile",
    "../Utils/ImageRequest",
    "./RendererTileData",
    "../Utils/Constants"
], function(Program, Tile, ImageRequest, RendererTileData, Constants) {
    /**************************************************************************************************************/

    /**
         @name RasterOverlayRenderer
         @class
             RasterOverlayRenderer constructor
         @param {AbstractGlobe} globe AbstractGLobe
         @constructor
         */

    var RasterOverlayRenderer = function(globe) {
        this.vertexShader = "attribute vec3 vertex;\n";
        this.vertexShader += "attribute vec2 tcoord;\n";
        this.vertexShader += "uniform mat4 modelViewMatrix;\n";
        this.vertexShader += "uniform mat4 projectionMatrix;\n";
        this.vertexShader += "uniform vec4 textureTransform; \n";
        this.vertexShader += "varying vec2 texCoord;\n";
        this.vertexShader += "void main(void) \n";
        this.vertexShader += "{\n";
        this.vertexShader +=
            "	gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex, 1.0);\n";
        this.vertexShader +=
            "	texCoord = tcoord * textureTransform.xy + textureTransform.zw;\n";
        this.vertexShader += "}\n";

        this.fragmentShader = "precision lowp float;\n";
        this.fragmentShader += "varying vec2 texCoord;\n";
        this.fragmentShader += "uniform sampler2D overlayTexture;\n";
        this.fragmentShader += "uniform float opacity; \n";
        this.fragmentShader += "uniform vec3 levelColRow;\n";
        this.fragmentShader += "void main(void)\n";
        this.fragmentShader += "{\n";
        this.fragmentShader +=
            "	gl_FragColor.rgba = texture2D(overlayTexture, texCoord.xy); \n";
        this.fragmentShader += "	gl_FragColor.a *= opacity; \n";
        // this.fragmentShader += "    gl_FragColor.rgb = levelColRow / vec3(16.0);\n";
        // this.fragmentShader += "    gl_FragColor.a = min(gl_FragColor.a + 0.8, 1.0);\n";
        this.fragmentShader += "}\n";

        this.lerpFragmentShader =
            `precision lowp float;

            varying vec2 texCoord;
            uniform sampler2D fromOverlayTexture;
            uniform sampler2D toOverlayTexture;
            uniform float time;
            uniform float totalTime;
            uniform float opacity;

            void main() {
                vec4 fromColor = texture2D(fromOverlayTexture, texCoord.xy);
                vec4 toColor = texture2D(toOverlayTexture, texCoord.xy);
                gl_FragColor = mix(fromColor, toColor, time / totalTime);
                gl_FragColor.a *= opacity;
                // gl_FragColor.rgba = vec4(0, 1, 0, opacity);
            }`;

        this.rendererManager = globe.getRendererManager();
        this.tileManager = globe.tileManager;

        this.programs = [];
        this.program = this.createProgram({
            vertexCode: this.vertexShader,
            fragmentCode: this.fragmentShader,
            updateUniforms: null
        });

        this.lerpProgram = this.createProgram({
            vertexCode: this.vertexShader,
            fragmentCode: this.lerpFragmentShader,
            updateUniforms: null
        });

        this.buckets = [];
        this.imageRequests = [];
        this.frameNumber = 0;


        this.oldRenderables = {};

        var self = this;
        for (var i = 0; i < 4; i++) {
            var imageRequest = new ImageRequest({
                successCallback: function() {
                    if (this.renderable) {
                        if (this.renderable.bucket.layer.handleImage) {
                            this.renderable.bucket.layer.handleImage(this);
                        }

                        this.renderable.ownTexture = self.tileManager.tilePool.createGLTexture(
                            this.image
                        );
                        this.renderable.texture = this.renderable.ownTexture;
                        this.renderable.uvScale = 1.0;
                        this.renderable.uTrans = 0.0;
                        this.renderable.vTrans = 0.0;
                        this.renderable.updateChildrenTexture();
                        this.renderable.onRequestFinished(true);

                        const { level, x, y } = this.renderable.tile;
                        try {
                            const oldRenderable = self.oldRenderables[level][x][y];
                            if (oldRenderable && oldRenderable.ownTexture) {
                                this.renderable.oldRenderable = oldRenderable;
                                this.renderable.needsLerp = true;
                                this.renderable.time = 0.0;
                            }
                        } catch (error) {
                            // Nothing to do
                        }

                        this.renderable = null;
                        self.tileManager.renderContext.requestFrame();
                    }
                },
                failCallback: function() {
                    if (this.renderable) {
                        this.renderable.onRequestFinished(true);
                        this.renderable = null;
                    }
                },
                abortCallback: function() {
                    //console.log("Raster overlay request abort.");
                    if (this.renderable) {
                        this.renderable.onRequestFinished(false);
                        this.renderable = null;
                    }
                }
            });

            this.imageRequests.push(imageRequest);
        }
    };

    /**************************************************************************************************************/

    /**
         @name RasterOverlayRenderable
         @class
             Create a renderable for the overlay.
         There is one renderable per overlay and per tile.
         @param {Bucket} bucket Bucket
         @constructor
         */
    var RasterOverlayRenderable = function(bucket) {
        this.bucket = bucket;
        this.bucket.renderables.push(this);
        this.ownTexture = null;
        this.texture = null;
        this.oldRenderable = null;
        this.needsLerp = false;
        this.time = 0.0;
        this.request = null;
        this.requestFinished = false;
        this.tile = null;
        this.uvScale = 1.0;
        this.uTrans = 0.0;
        this.vTrans = 0.0;
    };

    /**************************************************************************************************************/

    /**
     * Called when a request is started
     * @function onRequestStarted
     * @memberof RasterOverlayRenderable.prototype
     * @param {string}request Request
     * @fires Context#startLoad
     */
    RasterOverlayRenderable.prototype.onRequestStarted = function(request) {
        this.request = request;
        this.requestFinished = false;
        var layer = this.bucket.layer;
        if (layer._numRequests === 0) {
            layer.globe.publishEvent(
                Constants.EVENT_MSG.LAYER_START_LOAD,
                layer
            );
        }
        layer._numRequests++;
    };

    /**************************************************************************************************************/

    /**
     * Called when a request is finished
     * @function onRequestFinished
     * @memberof RasterOverlayRenderable.prototype
     * @param completed
     * @fires Context#endLoad
     */
    RasterOverlayRenderable.prototype.onRequestFinished = function(completed) {
        this.request = null;
        this.requestFinished = completed;
        var layer = this.bucket.layer;
        layer._numRequests--;
        if (layer.getGlobe() && layer._numRequests === 0) {
            layer
                .getGlobe()
                .publishEvent(Constants.EVENT_MSG.LAYER_END_LOAD, layer);
        }
    };

    /**************************************************************************************************************/

    /**
     * Initialize a child renderable
     * @function initChild
     * @memberof RasterOverlayRenderable.prototype
     * @param i
     * @param j
     * @param childTile
     */
    RasterOverlayRenderable.prototype.initChild = function(i, j, childTile) {
        // Request finished and no texture  : no init needed for children
        /*	// TODO : does not work because sometimes level 0 cannot be loaded
             if (this.requestFinished && !this.ownTexture)
             return null;*/

        var renderable = this.bucket.createRenderable();
        renderable.tile = childTile;
        if (this.texture) {
            renderable.texture = this.texture;
            renderable.uvScale = this.uvScale;
            renderable.uTrans = this.uTrans;
            renderable.vTrans = this.vTrans;
        }

        return renderable;
    };

    /**************************************************************************************************************/

    /**
     * Generate child renderable
     * @function generateChild
     * @memberof RasterOverlayRenderable.prototype
     * @param {Tile} tile Tile
     */
    RasterOverlayRenderable.prototype.generateChild = function(tile) {
        // Request finished and no texture  : no generate needed for children
        /*	// TODO : does not work because sometimes level 0 cannot be loaded
             if (this.requestFinished && !this.ownTexture)
             return;*/

        var r = this.bucket.renderer;
        r.addOverlayToTile(tile, this.bucket, this);
    };

    /**************************************************************************************************************/

    /**
     * Update the children texture
     * @function updateChildrenTexture
     * @memberof RasterOverlayRenderable.prototype
     */
    RasterOverlayRenderable.prototype.updateChildrenTexture = function() {
        if (this.tile.children) {
            for (var i = 0; i < 4; i++) {
                var rd = this.tile.children[i].extension.renderer;
                if (rd) {
                    var cr = rd.getRenderable(this.bucket);
                    if (cr && !cr.ownTexture) {
                        cr.updateTextureFromParent(this);
                        cr.updateChildrenTexture();
                    }
                }
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Update texture from its parent
     * @function updateTextureFromParent
     * @memberof RasterOverlayRenderable.prototype
     * @param parent
     */
    RasterOverlayRenderable.prototype.updateTextureFromParent = function(
        parent
    ) {
        if (this.tile.state === Tile.State.LOADED) {
            this.texture = parent.texture;
            this.uvScale = parent.uvScale * 0.5;
            this.uTrans = parent.uTrans;
            this.vTrans = parent.vTrans;

            this.uTrans += this.tile.parentIndex & 1 ? this.uvScale : 0;
            this.vTrans += this.tile.parentIndex & 2 ? this.uvScale : 0;
        } else {
            this.texture = parent.texture;
            this.uvScale = parent.uvScale;
            this.uTrans = parent.uTrans;
            this.vTrans = parent.vTrans;
        }
    };

    /**************************************************************************************************************/

    /**
         * Traverse renderable : add it to renderables list if there is a texture
         Request the texture
         * @function traverse
         * @memberof RasterOverlayRenderable.prototype
         * @param manager
         * @param {Tile} tile Tile
         * @param {Boolean} isLeaf
         */
    RasterOverlayRenderable.prototype.traverse = function(
        manager,
        tile,
        isLeaf
    ) {
        if (isLeaf && this.texture) {
            manager.renderables.push(this);
        } else if (isLeaf) {
            const oldRenderables = this.bucket.renderer.oldRenderables;
            try {
                const oldRenderable = oldRenderables[tile.level][tile.x][tile.y];
                if (oldRenderable && oldRenderable.ownTexture) {
                    const renderable = Object.assign({}, this);
                    renderable.texture = oldRenderable.ownTexture;
                    manager.renderables.push(renderable);
                }
            } catch (error) {
                // do nothing
            }
        }

        if (!this.requestFinished && this.tile.state === Tile.State.LOADED) {
            this.bucket.renderer.requestOverlayTextureForTile(this);
        }
    };

    /**************************************************************************************************************/

    /**
     * Dispose the renderable
     * @function dispose
     * @memberof RasterOverlayRenderable.prototype
     * @param renderContext
     * @param tilePool
     */
    RasterOverlayRenderable.prototype.dispose = function(
        renderContext,
        tilePool
    ) {
        if (this.ownTexture) {
            tilePool.disposeGLTexture(this.ownTexture);
            this.ownTexture = null;
        }
    };

    /**************************************************************************************************************/

    /**
         @name Bucket
         @class
             Bucket constructor for RasterOverlay
         @param layer
         @constructor
         */
    var Bucket = function(layer) {
        this.layer = layer;
        this.renderer = null;
        this.style = layer.style;
        this.renderables = [];
    };

    /**************************************************************************************************************/

    /**
     * Create a renderable for this bucket
     * @function createRenderable
     * @memberof Bucket.prototype
     * @return {RasterOverlayRenderable} Renderable
     */
    Bucket.prototype.createRenderable = function() {
        return new RasterOverlayRenderable(this);
    };

    /**************************************************************************************************************/

    /**
     * Add an overlay into the renderer.
     * The overlay is added to all loaded tiles.
     * @function addOverlay
     * @memberof RasterOverlayRenderer.prototype
     * @param overlay
     */
    RasterOverlayRenderer.prototype.addOverlay = function(overlay) {
        // Initialize num requests to 0
        overlay._numRequests = 0;

        var bucket = new Bucket(overlay);
        bucket.renderer = this;
        bucket.id = this.rendererManager.bucketId++;
        this.buckets.push(bucket);

        overlay._bucket = bucket;

        for (var i = 0; i < this.tileManager.level0Tiles.length; i++) {
            var tile = this.tileManager.level0Tiles[i];
            if (tile.state === Tile.State.LOADED) {
                this.addOverlayToTile(tile, bucket);
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Remove an overlay
     * The overlay is removed from all loaded tiles.
     * @function removeOverlay
     * @memberof RasterOverlayRenderer.prototype
     * @param overlay
     */
    RasterOverlayRenderer.prototype.removeOverlay = function(overlay, noDispose) {
        var index = this.buckets.indexOf(overlay._bucket);
        this.buckets.splice(index, 1);

        var rc = this.tileManager.renderContext;
        var tp = this.tileManager.tilePool;
        this.tileManager.visitTiles(function(tile) {
            var rs = tile.extension.renderer;
            var renderable = rs ? rs.getRenderable(overlay._bucket) : null;
            if (renderable) {
                // Remove the renderable
                var index = rs.renderables.indexOf(renderable);
                rs.renderables.splice(index, 1);

                if (!noDispose) {
                    // Dispose its data
                    renderable.dispose(rc, tp);
                }

                // Remove tile data if not needed anymore
                if (rs.renderables.length === 0) {
                    delete tile.extension.renderer;
                }
            }
        });
    };

    /**************************************************************************************************************/

    RasterOverlayRenderer.prototype.updateOverlay = function(overlay) {
        var oldBucket = overlay._bucket;

        var rc = this.tileManager.renderContext;
        var tp = this.tileManager.tilePool;
        for (var level in this.oldRenderables) {
            for (var x in this.oldRenderables[level]) {
                for (var y in this.oldRenderables[level][x]) {
                    const renderable = this.oldRenderables[level][x][y];
                    renderable.dispose(rc, tp);
                }
            }
        }

        this.oldRenderables = {};
        if (oldBucket) {
            for (var j = 0; j < oldBucket.renderables.length; ++j) {
                const renderable = oldBucket.renderables[j];
                if (renderable.ownTexture) {
                    const { level, x, y } = renderable.tile;
                    if (!this.oldRenderables[level]) this.oldRenderables[level] = {};
                    if (!this.oldRenderables[level][x]) this.oldRenderables[level][x] = {};
                    this.oldRenderables[level][x][y] = renderable;
                }
            }
        }

        this.removeOverlay(overlay, true);
        this.addOverlay(overlay);
    };

    /**************************************************************************************************************/

    /**
     * Add an overlay into a tile.
     * Create tile data if needed, and create the renderable for the overlay.
     * @function addOverlayToTile
     * @memberof RasterOverlayRenderer.prototype
     * @param tile
     * @param bucket
     * @param parentRenderable
     */
    RasterOverlayRenderer.prototype.addOverlayToTile = function(
        tile,
        bucket,
        parentRenderable
    ) {
        if (!this.overlayIntersects(tile.geoBound, bucket.layer)) {
            return;
        }

        if (!tile.extension.renderer) {
            tile.extension.renderer = new RendererTileData(
                this.rendererManager
            );
        }

        var renderable = bucket.createRenderable();
        renderable.tile = tile;
        tile.extension.renderer.renderables.push(renderable);

        if (parentRenderable && parentRenderable.texture) {
            renderable.updateTextureFromParent(parentRenderable);
        }

        if (tile.children) {
            // Add the overlay to loaded children
            for (var i = 0; i < 4; i++) {
                if (tile.children[i].state === Tile.State.LOADED) {
                    this.addOverlayToTile(tile.children[i], bucket, renderable);
                }
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Create an interpolated for polygon clipping
     */
    var _createInterpolatedVertex = function(t, p1, p2) {
        return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
    };

    /**************************************************************************************************************/

    /**
     * Clip polygon to a side (used by bound-overlay intersection)
     * @function clipPolygonToSide
     * @memberof RasterOverlayRenderer.prototype
     * @param coord
     * @param sign
     * @param value
     * @param polygon
     */
    RasterOverlayRenderer.prototype.clipPolygonToSide = function(
        coord,
        sign,
        value,
        polygon
    ) {
        var clippedPolygon = [];
        var t, newPoint;
        // iterate through vertices
        for (var i = 0; i < polygon.length; i++) {
            var p1 = polygon[i];
            var p2 = polygon[(i + 1) % polygon.length];
            var val1 = p1[coord];
            var val2 = p2[coord];

            // test containement
            var firstInside = (val1 - value) * sign >= 0.0;
            var secondInside = (val2 - value) * sign >= 0.0;

            // output vertices for inside polygon
            if (!firstInside && secondInside) {
                t = (value - val1) / (val2 - val1);
                newPoint = _createInterpolatedVertex(t, p1, p2);
                clippedPolygon.push(newPoint);
                clippedPolygon.push(p2);
            } else if (firstInside && secondInside) {
                clippedPolygon.push(p2);
            } else if (firstInside && !secondInside) {
                t = (value - val1) / (val2 - val1);
                newPoint = _createInterpolatedVertex(t, p1, p2);
                clippedPolygon.push(newPoint);
            }
        }

        return clippedPolygon;
    };

    /**************************************************************************************************************/

    /**
     * Check the intersection between a geo bound and an overlay
     * @function overlayIntersects
     * @memberof RasterOverlayRenderer.prototype
     * @param bound
     * @param overlay
     * @return {Boolean} Is intersects ?
     */
    RasterOverlayRenderer.prototype.overlayIntersects = function(
        bound,
        overlay
    ) {
        if (overlay.coordinates) {
            var c;
            c = this.clipPolygonToSide(0, 1, bound.west, overlay.coordinates);
            c = this.clipPolygonToSide(0, -1, bound.east, c);
            c = this.clipPolygonToSide(1, 1, bound.south, c);
            c = this.clipPolygonToSide(1, -1, bound.north, c);
            return c.length > 0;
        } else if (overlay.geoBound) {
            return overlay.geoBound.intersects(bound);
        }

        // No geobound or coordinates : always return true
        return true;
    };

    /**************************************************************************************************************/

    /**
     * Generate Raster overlay data on the tile.
     * The method is called by TileManager when a new tile has been generated.
     * @function generateLevelZero
     * @memberof RasterOverlayRenderer.prototype
     * @param {Tile} tile Tile
     */
    RasterOverlayRenderer.prototype.generateLevelZero = function(tile) {
        // Traverse all overlays
        for (var i = 0; i < this.buckets.length; i++) {
            this.addOverlayToTile(tile, this.buckets[i]);
        }
    };

    /**************************************************************************************************************/

    /**
     * Request the overlay texture for a tile
     * @function requestOverlayTextureForTile
     * @memberof RasterOverlayRenderer.prototype
     * @param renderable
     */
    RasterOverlayRenderer.prototype.requestOverlayTextureForTile = function(
        renderable
    ) {
        if (!renderable.request) {
            var imageRequest;
            for (var i = 0; i < this.imageRequests.length; i++) {
                if (!this.imageRequests[i].renderable) {
                    imageRequest = this.imageRequests[i];
                    break;
                }
            }

            if (imageRequest) {
                var url = renderable.bucket.layer.getUrl(renderable.tile);
                if (url !== null) {
                    renderable.onRequestStarted(imageRequest);
                    imageRequest.renderable = renderable;
                    imageRequest.frameNumber = this.frameNumber;
                    imageRequest.send(
                        renderable.bucket.layer.getUrl(renderable.tile),
                        renderable.bucket.layer.crossOrigin
                    );
                }
            }
        } else {
            renderable.request.frameNumber = this.frameNumber;
        }
    };

    /**************************************************************************************************************/

    /**
     * Create program from customShader object
     * @function createProgram
     * @memberof RasterOverlayRenderer.prototype
     * @param customShader
     * @return {Program} Program
     */
    RasterOverlayRenderer.prototype.createProgram = function(customShader) {
        var program = new Program(this.tileManager.renderContext);
        program.createFromSource(this.vertexShader, customShader.fragmentCode);

        // Add program
        program.id = this.programs.length;
        this.programs.push({
            fragmentCode: customShader.fragmentCode,
            program: program
        });
        return program;
    };

    /**************************************************************************************************************/

    /**
     * Get program if known by renderer, create otherwise
     * @function getProgram
     * @memberof RasterOverlayRenderer.prototype
     * @param customShader
     * @return {Program} Program
     */
    RasterOverlayRenderer.prototype.getProgram = function(customShader) {
        var program;

        for (var id = 0; id < this.programs.length; id++) {
            if (this.programs[id].fragmentCode === customShader.fragmentCode) {
                program = this.programs[id].program;
            }
        }

        if (!program) {
            program = this.createProgram(customShader);
        }
        return program;
    };

    /**************************************************************************************************************/

    /**
     *    Render the raster overlays for the given tiles
     * @function render
     * @memberof RasterOverlayRenderer.prototype
     * @param renderables
     * @param {Integer} start Start index
     * @param {Integer} end End index
     */
    RasterOverlayRenderer.prototype.render = function(renderables, start, end) {
        var rc = this.tileManager.renderContext;
        var gl = rc.gl;

        // Update gl states
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthFunc(gl.LEQUAL);

        var modelViewMatrix = mat4.create();

        var currentTile = null;
        var currentIB = null;
        var currentProgram = null;

        for (var n = start; n < end; n++) {
            var renderable = renderables[n];
            var bucket = renderable.bucket;
            var layer = bucket.layer;

            var updateUniforms;
            var program;
            if (layer.customShader) {
                program = this.getProgram(layer.customShader);
                updateUniforms = layer.customShader.updateUniforms;
            } else if (renderable.needsLerp) {
                program = this.getProgram({
                    vertexCode: this.vertexShader,
                    fragmentCode: this.lerpFragmentShader,
                    updateUniforms: null
                });
            } else {
                program = this.getProgram({
                    vertexCode: this.vertexShader,
                    fragmentCode: this.fragmentShader,
                    updateUniforms: null
                });
            }

            // Apply program if changed
            if (program !== currentProgram) {
                currentProgram = program;
                program.apply();

                gl.uniformMatrix4fv(
                    program.uniforms.projectionMatrix,
                    false,
                    rc.projectionMatrix
                );

                if (renderable.needsLerp) {
                    gl.uniform1i(program.uniforms.fromOverlayTexture, 0);
                    gl.uniform1i(program.uniforms.toOverlayTexture, 1);
                } else {
                    gl.uniform1i(program.uniforms.overlayTexture, 0);
                }

                // Bind tcoord buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, this.tileManager.tcoordBuffer);
                gl.vertexAttribPointer(
                    program.attributes.tcoord,
                    2,
                    gl.FLOAT,
                    false,
                    0,
                    0
                );
            }

            if (updateUniforms) {
                updateUniforms(gl, program);
            }

            // Bind the vertex buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, renderable.tile.vertexBuffer);
            gl.vertexAttribPointer(
                program.attributes.vertex,
                3,
                gl.FLOAT,
                false,
                4 * renderable.tile.config.vertexSize,
                0
            );

            // Bind the index buffer only if different (index buffer is shared between tiles)
            var indexBuffer =
                renderable.tile.state === Tile.State.LOADED
                    ? this.tileManager.tileIndexBuffer.getSolid()
                    : this.tileManager.tileIndexBuffer.getSubSolid(
                        renderable.tile.parentIndex
                    );
            if (currentIB !== indexBuffer) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                currentIB = indexBuffer;
            }

            // Bind the tile tile matrix
            mat4.multiply(
                rc.viewMatrix,
                renderable.tile.matrix,
                modelViewMatrix
            );
            gl.uniformMatrix4fv(
                program.uniforms.modelViewMatrix,
                false,
                modelViewMatrix
            );

            gl.uniform1f(program.uniforms.opacity, layer.getOpacity());
            gl.uniform4f(
                program.uniforms.textureTransform,
                renderable.uvScale,
                renderable.uvScale,
                renderable.uTrans,
                renderable.vTrans
            );

            gl.uniform3f(
                program.uniforms.levelColRow,
                renderable.tile.level,
                renderable.tile.x,
                renderable.tile.y
            );

            if (renderable.needsLerp) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, renderable.oldRenderable.texture);

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, renderable.texture);

                gl.uniform1f(program.uniforms.time, renderable.time);
                gl.uniform1f(program.uniforms.totalTime, 500);
            } else {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, renderable.texture || renderable.oldRenderable.texture);
            }

            if (renderable.needsLerp) {
                renderable.time += rc.deltaTime;
                if (renderable.time > 500) {
                    renderable.needsLerp = false;
                    renderable.oldRenderable = null;
                }
            }

            // Finally draw the tiles
            gl.drawElements(
                gl.TRIANGLES,
                currentIB.numIndices,
                gl.UNSIGNED_SHORT,
                0
            );
        }

        // reset gl states
        gl.disable(gl.BLEND);
        //gl.disable(gl.POLYGON_OFFSET_FILL);
        gl.depthFunc(gl.LESS);
    };

    /**************************************************************************************************************/

    /**
     * Check if renderer is applicable
     * @function canApply
     * @memberof RasterOverlayRenderer.prototype
     * @param type
     * @param style
     * @return {Boolean} Can apply ?
     */
    RasterOverlayRenderer.prototype.canApply = function(type, style) {
        return false;
    };

    /**************************************************************************************************************/

    return RasterOverlayRenderer;
});
