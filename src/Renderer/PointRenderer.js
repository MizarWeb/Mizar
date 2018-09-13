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
    "./VectorRenderer",
    "./RendererManager",
    "./FeatureStyle",
    "./Program",
    "./GeoBound"
], function(
    Utils,
    Constants,
    VectorRenderer,
    RendererManager,
    FeatureStyle,
    Program,
    GeoBound
) {
    /**************************************************************************************************************/

    /**
         Basic module to generate texture from text
         */
    var Text = (function() {
        var fontSize = 18;
        var margin = 1;
        var canvas2d = null;

        var initialize = function() {
            canvas2d = document.createElement("canvas");
            canvas2d.width = 512;
            canvas2d.height = fontSize + 2 * margin;
        };

        var generateImageData = function(text, textColor) {
            if (!canvas2d) {
                initialize();
            }

            var fillColor = textColor;
            if (!fillColor) {
                fillColor = "#fff";
            } else {
                if (fillColor instanceof Array) {
                    fillColor = FeatureStyle.fromColorToString(textColor);
                }
            }

            var ctx = canvas2d.getContext("2d");
            ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
            ctx.fillStyle = fillColor;
            ctx.font = fontSize + "px sans-serif";
            ctx.textBaseline = "top";
            ctx.shadowColor = "#000";
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.shadowBlur = 2;
            ctx.fillText(text, margin, margin);
            //ctx.lineWidth = 1.0;
            //ctx.strokeText(text, margin, margin);

            var metrics = ctx.measureText(text);
            return ctx.getImageData(
                0,
                0,
                Math.floor(metrics.width) + 2 * margin,
                canvas2d.height
            );
        };

        return { generateImageData: generateImageData };
    })();

    /**************************************************************************************************************/

    /**
         @name PointRenderer
         @class
             POI Renderer constructor
         @param {AbstractGlobe} globe AbstractGlobe
         @augments VectorRenderer
         @constructor
         */
    var PointRenderer = function(globe) {
        VectorRenderer.prototype.constructor.call(this, globe);

        // Store object for rendering
        this.renderContext = globe.tileManager.renderContext;
        this.tileConfig = globe.tileManager.tileConfig;

        // For stats
        this.numberOfRenderPoints = 0;

        var vertexShader =
            "attribute vec3 vertex; // vertex have z = 0, spans in x,y from -0.5 to 0.5 \n";
        vertexShader += "uniform mat4 viewProjectionMatrix; \n";
        vertexShader += "uniform vec3 poiPosition; // world position \n";
        vertexShader += "uniform vec2 poiScale; // x,y scale \n";
        vertexShader += "uniform vec2 tst; \n";
        vertexShader += "\n";
        vertexShader += "varying vec2 texCoord; \n";
        vertexShader += "\n";
        vertexShader += "void main(void)  \n";
        vertexShader += "{ \n";
        vertexShader +=
            "	// Generate texture coordinates, input vertex goes from -0.5 to 0.5 (on x,y) \n";
        vertexShader += "	texCoord = vertex.xy + vec2(0.5) + tst; \n";
        vertexShader += "	// Invert y \n";
        vertexShader += "	texCoord.y = 1.0 - texCoord.y; \n";
        vertexShader += "	\n";
        vertexShader += "	// Compute poi position in clip coordinate \n";
        vertexShader +=
            "	gl_Position = viewProjectionMatrix * vec4(poiPosition, 1.0); \n";
        vertexShader +=
            "	gl_Position.xy += vertex.xy * gl_Position.w * poiScale; \n";
        vertexShader += "} \n";

        var fragmentShader = "precision lowp float; \n";
        fragmentShader += "varying vec2 texCoord; \n";
        fragmentShader += "uniform sampler2D texture; \n";
        fragmentShader += "uniform float alpha; \n";
        fragmentShader += "uniform vec3 color; \n";
        fragmentShader += "\n";
        fragmentShader += "void main(void) \n";
        fragmentShader += "{ \n";
        fragmentShader +=
            "	vec4 textureColor = texture2D(texture, texCoord); \n";
        fragmentShader +=
            "	gl_FragColor = vec4(textureColor.rgb * color, textureColor.a * alpha); \n";
        fragmentShader += "	if (gl_FragColor.a <= 0.0) discard; \n";
        fragmentShader += "} \n";

        this.program = new Program(this.renderContext);
        this.program.createFromSource(vertexShader, fragmentShader);

        var vertices = new Float32Array([
            -0.5,
            -0.5,
            0.0,
            0.5,
            -0.5,
            0.0,
            0.5,
            0.5,
            0.0,
            -0.5,
            0.5,
            0.0
        ]);

        var gl = this.renderContext.gl;
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this.defaultTexture = null;
    };

    Utils.inherits(VectorRenderer, PointRenderer);

    /**************************************************************************************************************/

    /**
     * Build a default texture
     * @function _buildDefaultTexture
     * @memberof PointRenderer.prototype
     * @param {Bucket} bucket Bucket
     * @private
     */
    PointRenderer.prototype._buildDefaultTexture = function(bucket) {
        if (!this.defaultTexture) {
            var gl = this.renderContext.gl;
            this.defaultTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture);
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
        }

        bucket.texture = this.defaultTexture;
        bucket.textureWidth = 10;
        bucket.textureHeight = 10;
    };

    /**************************************************************************************************************/
    /**
     * Build a texture from an image and store in a bucket
     * @function _buildTextureFromImage
     * @memberof PointRenderer.prototype
     * @param {Bucket} bucket Bucket
     * @param image
     * @private
     */
    PointRenderer.prototype._buildTextureFromImage = function(bucket, image) {
        bucket.texture = this.renderContext.createNonPowerOfTwoTextureFromImage(
            image
        );
        bucket.textureWidth = image.width;
        bucket.textureHeight = image.height;
    };

    /**************************************************************************************************************/

    /**
         @name PointRenderable
         @class
             Renderable constructor for Point
         @param {Bucket} bucket Bucket
         @constructor
         */
    var PointRenderable = function(bucket) {
        this.bucket = bucket;
        this.points = [];
        this.geometries = [];
    };

    /**************************************************************************************************************/

    /**
     * Add a geometry to the renderable
     * @function add
     * @memberof PointRenderable.prototype
     * @param geometry
     * @return {Boolean} If the geometry has been successfully added to the renderable
     */
    PointRenderable.prototype.add = function(geometry) {
        // TODO: Find a better way to access to coordinate system
        var coordinateSystem = this.bucket.layer
            .getGlobe()
            .getCoordinateSystem();
        var posGeo = geometry.coordinates;

        posGeo = coordinateSystem.convert(
            posGeo,
            geometry.crs.properties.name,
            coordinateSystem.getGeoideName()
        );

        var csBound = new GeoBound(
            coordinateSystem.getGeoBound().getWest(),
            coordinateSystem.getGeoBound().getSouth(),
            coordinateSystem.getGeoBound().getEast(),
            coordinateSystem.getGeoBound().getNorth()
        );

        if (csBound.isPointInside(posGeo)) {
            var pos3d = coordinateSystem.get3DFromWorld(posGeo);
            var vertical = coordinateSystem.getVerticalAt3D(pos3d);

            this.points.push({
                pos3d: pos3d,
                vertical: vertical,
                geometry: geometry
            });

            return true;
        } else {
            return false;
        }
    };

    /**************************************************************************************************************/

    /**
     * Remove a geometry from the renderable
     * @function remove
     * @memberof PointRenderable.prototype
     * @param geometry
     * @return {Integer} Number of points after remove
     */
    PointRenderable.prototype.remove = function(geometry) {
        for (var j = 0; j < this.points.length; j++) {
            if (this.points[j].geometry === geometry) {
                this.points.splice(j, 1);
                return this.points.length;
            }
        }
        return this.points.length;
    };

    /**************************************************************************************************************/

    /**
     * Dispose the renderable
     * @function dispose
     * @memberof PointRenderable.prototype
     * @param renderContext
     */
    PointRenderable.prototype.dispose = function(renderContext) {
        // Nothing to do
    };

    /**************************************************************************************************************/

    /**
         @name PointBucket
         @class
             Bucket constructor for PointRenderer
         @param layer
         @param style
         @constructor
         */
    var PointBucket = function(layer, style) {
        this.layer = layer;
        this.style = new FeatureStyle(style);
        this.renderer = null;
        this.texture = null;
    };

    /**************************************************************************************************************/

    /**
     * Create a renderable for this bucket
     * @function createRenderable
     * @memberof PointBucket.prototype
     * @return {PointRenderable} Renderable
     */
    PointBucket.prototype.createRenderable = function() {
        return new PointRenderable(this);
    };

    /**************************************************************************************************************/

    /**
     * Check if a bucket is compatible
     * @function isCompatible
     * @memberof PointBucket.prototype
     * @param style
     * @return {Boolean} Is compatible ?
     */
    PointBucket.prototype.isCompatible = function(style) {
        return (
            this.style.iconUrl === style.iconUrl &&
            this.style.icon === style.icon &&
            this.style.label === style.label
        );
    };

    /**************************************************************************************************************/

    /**
     * Create bucket to render a point
     * @function createBucket
     * @memberof PointRenderer.prototype
     * @param layer
     * @param style
     * @return {PointBucket} Bucket
     */
    PointRenderer.prototype.createBucket = function(layer, style) {
        // Create a bucket
        var bucket = new PointBucket(layer, style);

        // Initialize bucket : create the texture
        if (style.label) {
            var imageData = Text.generateImageData(
                style.label,
                style.textColor
            );
            this._buildTextureFromImage(bucket, imageData);
        } else if (style.iconUrl) {
            var image = new Image();
            image.crossOrigin = "";
            var self = this;
            image.onload = function() {
                self._buildTextureFromImage(bucket, image);
                self.renderContext.requestFrame();
            };
            image.onerror = function() {
                self._buildDefaultTexture(bucket);
            };
            image.src = style.iconUrl;
        } else if (style.icon) {
            this._buildTextureFromImage(bucket, style.icon);
        } else {
            this._buildDefaultTexture(bucket);
        }

        return bucket;
    };

    /**************************************************************************************************************/

    /**
     * Render all the POIs
     * @function render
     * @memberof PointRenderer.prototype
     * @param renderables
     * @param {Integer} start Start index
     * @param {Integer} end End index
     */
    PointRenderer.prototype.render = function(renderables, start, end) {
        this.numberOfRenderPoints = 0;

        var renderContext = this.renderContext;
        var gl = this.renderContext.gl;

        // TODO
        //var level = renderContext.renderers[0].tileManager.visibleTiles[0].level;
        //if(level < 5) {
        //    return;
        //}
        // end todo

        // Setup states
        // gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Setup program
        this.program.apply();

        // The shader only needs the viewProjection matrix, use modelViewMatrix as a temporary storage
        mat4.multiply(
            renderContext.projectionMatrix,
            renderContext.viewMatrix,
            renderContext.modelViewMatrix
        );
        gl.uniformMatrix4fv(
            this.program.uniforms.viewProjectionMatrix,
            false,
            renderContext.modelViewMatrix
        );
        gl.uniform1i(this.program.uniforms.texture, 0);

        // Compute eye direction from inverse view matrix
        mat4.inverse(renderContext.viewMatrix, renderContext.modelViewMatrix);
        var camZ = [
            renderContext.modelViewMatrix[8],
            renderContext.modelViewMatrix[9],
            renderContext.modelViewMatrix[10]
        ];
        vec3.normalize(camZ);
        vec3.scale(camZ, this.tileConfig.cullSign, camZ);

        // Compute pixel size vector to offset the points from the earth
        var pixelSizeVector = renderContext.computePixelSizeVector();

        // Warning : use quoted strings to access properties of the attributes, to work correclty in advanced mode with closure compiler
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(
            this.program.attributes.vertex,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        var scale;
        var currentBucket = null;
        for (var n = start; n < end; n++) {
            var renderable = renderables[n];
            var bucket = renderable.bucket;

            if (renderable.points.length === 0) {
                continue;
            }

            if (bucket !== currentBucket) {
                // Bind point texture
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, bucket.texture);

                // 2.0 * because normalized device coordinates goes from -1 to 1
                scale = [
                    (2.0 * bucket.textureWidth) / renderContext.canvas.width,
                    (2.0 * bucket.textureHeight) / renderContext.canvas.height
                ];
                gl.uniform2fv(this.program.uniforms.poiScale, scale);
                gl.uniform2fv(this.program.uniforms.tst, [
                    0.5 / bucket.textureWidth,
                    0.5 / bucket.textureHeight
                ]);
            }

            for (var i = 0; i < renderable.points.length; i++) {
                // Poi culling
                var worldPoi = renderable.points[i].pos3d;
                var poiVec = renderable.points[i].vertical;
                scale =
                    bucket.textureHeight *
                    (pixelSizeVector[0] * worldPoi[0] +
                        pixelSizeVector[1] * worldPoi[1] +
                        pixelSizeVector[2] * worldPoi[2] +
                        pixelSizeVector[3]);
                scale *= this.tileConfig.cullSign;
                var scaleInKm =
                    (scale /
                        this.globe
                            .getCoordinateSystem()
                            .getGeoide()
                            .getHeightScale()) *
                    0.001;
                if (scaleInKm > bucket.style.pointMaxSize) {
                    continue;
                }

                if (
                    vec3.dot(poiVec, camZ) > 0 &&
                    renderContext.worldFrustum.containsSphere(
                        worldPoi,
                        scale
                    ) >= 0
                ) {
                    var x = poiVec[0] * scale + worldPoi[0];
                    var y = poiVec[1] * scale + worldPoi[1];
                    var z = poiVec[2] * scale + worldPoi[2];

                    gl.uniform3f(this.program.uniforms.poiPosition, x, y, z);
                    gl.uniform1f(
                        this.program.uniforms.alpha,
                        bucket.layer.getOpacity()
                    );
                    var color = bucket.style.getFillColor();
                    gl.uniform3f(
                        this.program.uniforms.color,
                        color[0],
                        color[1],
                        color[2]
                    );

                    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

                    this.numberOfRenderPoints++;
                }
            }
        }

        //    gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
    };

    /**************************************************************************************************************/

    /**
     * Check if renderer is applicable
     * @function canApply
     * @memberof PointRenderer.prototype
     * @param type
     * @param style
     * @return {Boolean} Can apply ?
     */
    PointRenderer.prototype.canApply = function(type, style) {
        return type === Constants.GEOMETRY.Point && style.iconUrl === null;
    };

    /**************************************************************************************************************/

    // Register the renderer
    RendererManager.factory.push(function(globe) {
        return new PointRenderer(globe);
    });

    return PointRenderer;
});
