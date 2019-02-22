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
    "./VectorRenderer",
    "./Program",
    "./FeatureStyle",
    "./RendererManager",
    "../Utils/Constants",
    "../Utils/Proxy"
], function(
    Utils,
    VectorRenderer,
    Program,
    FeatureStyle,
    RendererManager,
    Constants,
    Proxy
) {
    /**************************************************************************************************************/

    /**
         @name PointSpriteRenderer
         @class
             PointSpriteRenderer constructor
         @param {AbstractGlobe} globe AbstractGlobe
         @augments VectorRenderer
         @constructor
         */
    var PointSpriteRenderer = function(globe) {
        VectorRenderer.prototype.constructor.call(this, globe);

        // For stats
        this.numberOfRenderPoints = 0;

        var vertexShader = `
        attribute vec3 vertex;
        uniform mat4 viewProjectionMatrix;
        uniform float pointSize;
        void main(void)
        {
            gl_Position = viewProjectionMatrix * vec4(vertex,1.0);
            gl_PointSize = pointSize;
        }`;

        var fragmentShader = `
        precision lowp float;
        uniform sampler2D texture;
        uniform float alpha;
        uniform vec3 color;

        void main(void)
        {
            vec4 textureColor = texture2D(texture, gl_PointCoord);
            gl_FragColor = vec4(textureColor.rgb * color, textureColor.a * alpha);
            if (gl_FragColor.a <= 0.0) discard;
            //gl_FragColor = vec4(1.0);
        }`;

        var meterSizeVertexShader = `
        attribute vec3 vertex;
        uniform mat4 viewMatrix;
        uniform mat4 viewProjectionMatrix;
        uniform vec3 billboardPos;
        uniform vec2 billboardSize;

        varying vec2 texcoords;

        void main() {
            vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
            vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
            vec3 x = camRight * vertex.x * billboardSize.x;
            vec3 y = camUp * vertex.y * billboardSize.y;
            vec3 pos = billboardPos + x + y;

            gl_Position = viewProjectionMatrix * vec4(pos, 1.0);
            texcoords = vec2(vertex.x + 0.5, 1.0 - vertex.y);
        }`;

        var meterSizeFragmentShader = `
        precision lowp float;

        uniform sampler2D texture;
        uniform float alpha;
        uniform vec3 color;

        varying vec2 texcoords;

        void main(void)
        {
            vec4 textureColor = texture2D(texture, texcoords);
            gl_FragColor = vec4(textureColor.rgb * color, textureColor.a * alpha);
            if (gl_FragColor.a <= 0.0) discard;
        }`;

        this.program = new Program(globe.renderContext);
        this.program.createFromSource(vertexShader, fragmentShader);

        this.meterSizeProgram = new Program(globe.renderContext);
        this.meterSizeProgram.createFromSource(meterSizeVertexShader, meterSizeFragmentShader);

        this.defaultTexture = null;

        const vertices = new Float32Array([
            -0.5, 0.0, 0.0,
            0.5, 0.0, 0.0,
            0.5, 1.0, 0.0,
            -0.5, 1.0, 0.0,
        ]);

        var gl = globe.tileManager.renderContext.gl;
        this.rectVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rectVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    };

    Utils.inherits(VectorRenderer, PointSpriteRenderer);

    /**************************************************************************************************************/

    /**
         @name Renderable
         @class
             Renderable constructor for PointSprite
         @param {Bucket} bucket Bucket
         @constructor
         */
    var Renderable = function(bucket) {
        this.bucket = bucket;
        this.geometry2vb = {};
        this.vertices = [];
        this.geometries = [];
        this.vertexBuffer = null;
        this.vertexBufferDirty = false;
    };

    /**************************************************************************************************************/

    /**
     * Add a geometry to the renderable
     * @function add
     * @memberof Renderable.prototype
     * @param geometry
     * @return {Boolean} If the geometry has been successfully added to the renderable
     */
    Renderable.prototype.add = function(geometry, stockGeometry) {
        this.geometry2vb[geometry.gid] = this.vertices.length;
        // TODO: Find a better way to access to coordinate system
        var globe = this.bucket.renderer.globe;
        var crs = globe.getCoordinateSystem();

        if (this.bucket.style.useMeterSize) {
            const elevation = crs.getElevation(globe, geometry) + 200;
            const pt = crs.get3DFromWorldInCrs(
                [geometry.coordinates[0], geometry.coordinates[1], elevation],
                geometry.crs.properties.name
            );
            this.vertices.push(pt[0], pt[1], pt[2]);
        } else if (this.bucket.style.useDegreeSize) {
            const pt = crs.get3DFromWorldInCrs(
                geometry.coordinates,
                geometry.crs.properties.name
            );
            this.vertices.push(pt[0], pt[1], pt[2]);
        } else {
            var pt = crs.get3DFromWorldInCrs(
                geometry.coordinates,
                geometry.crs.properties.name
            );
            var realPlanetRadius = crs.getGeoide().getRealPlanetRadius();
            var scale = this.bucket.renderer.globe.isSky()
                ? 0.95
                : 1.0 +
                (crs.getElevation(globe, geometry) + 200) / realPlanetRadius;
            //TODO Instead of 0.95, it should be 0.9995. But with this value, the point is dislayed
            //TODO after order > 5. With order<=5, the image need more control points. Without these
            //TODO control point, the image does not fit perfectly the sphere and the point is behind the image
            this.vertices.push(scale * pt[0], scale * pt[1], scale * pt[2]);
            this.vertexBufferDirty = true;
        }
        if (stockGeometry !== false) {
            this.geometries.push(geometry);
        }
        return true;
    };

    /**************************************************************************************************************/

    /**
     * Update all elevations for each render
     * @function updateElevations
     * @memberof Renderable.prototype
     */
    Renderable.prototype.updateElevations = function() {
        this.vertices = [];
        for (var i = 0; i < this.geometries.length; i++) {
            this.add(this.geometries[i], false);
        }
    };

    /**************************************************************************************************************/

    /**
     * Remove a geometry from the renderable
     * @function remove
     * @memberof Renderable.prototype
     * @param geometry
     */
    Renderable.prototype.remove = function(geometry) {
        if (this.geometry2vb.hasOwnProperty(geometry.gid)) {
            var vbIndex = this.geometry2vb[geometry.gid];
            delete this.geometry2vb[geometry.gid];
            this.vertices.splice(vbIndex, 3);
            this.vertexBufferDirty = true;

            // Update render data for all other geometries
            for (var g in this.geometry2vb) {
                if (g) {
                    if (this.geometry2vb[g] > vbIndex) {
                        this.geometry2vb[g] -= 3;
                    }
                }
            }
        }
        return this.vertices.length;
    };

    /**************************************************************************************************************/

    /**
     * Dispose the renderable
     * @function dispose
     * @memberof Renderable.prototype
     * @param renderContext
     */
    Renderable.prototype.dispose = function(renderContext) {
        if (this.vertexBuffer) {
            renderContext.gl.deleteBuffer(this.vertexBuffer);
        }
    };

    /**************************************************************************************************************/

    /**
     * Build a default texture
     * @function _buildDefaultTexture
     * @memberof PointSpriteRenderer.prototype
     * @param {Bucket} bucket Bucket
     * @private
     */
    PointSpriteRenderer.prototype._buildDefaultTexture = function(bucket) {
        if (!this.defaultTexture) {
            var gl = this.globe.renderContext.gl;
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
     * @memberof PointSpriteRenderer.prototype
     * @param {Bucket} bucket Bucket
     * @param image
     * @private
     */
    PointSpriteRenderer.prototype._buildTextureFromImage = function(
        bucket,
        image
    ) {
        bucket.texture = this.globe.renderContext.createNonPowerOfTwoTextureFromImage(
            image
        );
        bucket.textureWidth = image.width;
        bucket.textureHeight = image.height;
    };

    /**************************************************************************************************************/

    /**
     * Check if renderer is applicable
     * @function canApply
     * @memberof PointSpriteRenderer.prototype
     * @param type
     * @param style
     * @return {Boolean} Is applicable ?
     */
    PointSpriteRenderer.prototype.canApply = function(type, style) {
        return type === Constants.GEOMETRY.Point && !style.label;
    };

    /**************************************************************************************************************/

    /**
         @name Bucket
         @class
             Bucket constructor for PointSpriteRenderer
         @param layer
         @param style
         @constructor
         */

    var Bucket = function(layer, style) {
        this.layer = layer;
        this.style = new FeatureStyle(style);
        this.texture = null;
        this.renderer = null;
    };

    /**************************************************************************************************************/

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
     * Check if a bucket is compatible
     * @function isCompatible
     * @memberof Bucket.prototype
     * @param style
     * @return {Boolean} Is compatible ?
     */
    Bucket.prototype.isCompatible = function(style) {
        if (
            this.style.iconUrl === style.iconUrl &&
            this.style.icon === style.icon &&
            this.style.fillColor[0] === style.fillColor[0] &&
            this.style.fillColor[1] === style.fillColor[1] &&
            this.style.fillColor[2] === style.fillColor[2]
        ) {
            return true;
        }

        return false;
    };

    /**************************************************************************************************************/

    /**
     * Create bucket to render a point
     * @function createBucket
     * @memberof PointSpriteRenderer.prototype
     * @param layer
     * @param style
     * @return {Bucket} Bucket
     */
    PointSpriteRenderer.prototype.createBucket = function(layer, style) {
        var gl = this.globe.renderContext.gl;
        gl.createBuffer();

        // Create a bucket
        var bucket = new Bucket(layer, style);
        bucket.renderer = this;

        // Initialize bucket : create the texture
        if (style.iconUrl) {
            var image = new Image();
            image.crossOrigin = "";
            var self = this;
            image.onload = function() {
                self._buildTextureFromImage(bucket, image);
                self.globe.renderContext.requestFrame();
            };
            image.onerror = function() {
                self._buildDefaultTexture(bucket);
            };
            image.src = Proxy.proxify(style.iconUrl);
        } else if (style.icon) {
            this._buildTextureFromImage(bucket, style.icon);
        } else {
            this._buildDefaultTexture(bucket);
        }

        return bucket;
    };

    /**************************************************************************************************************/

    /**
     * Render
     * @function render
     * @memberof PointSpriteRenderer.prototype
     * @param renderables
     * @param {Integer} start Start index
     * @param {Integer} end End index
     */
    PointSpriteRenderer.prototype.render = function(renderables, start, end) {
        var renderContext = this.globe.renderContext;
        var gl = renderContext.gl;

        // Setup states
        //gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // The shader only needs the viewProjection matrix, use GlobWeb.modelViewMatrix as a temporary storage
        mat4.multiply(
            renderContext.projectionMatrix,
            renderContext.viewMatrix,
            renderContext.modelViewMatrix
        );

        var program;

        // Render each renderables
        var currentBucket = null;
        for (var n = start; n < end; n++) {
            var renderable = renderables[n];
            renderable.updateElevations();
            var bucket = renderable.bucket;

            if (currentBucket !== bucket) {
                // Setup program
                program = (bucket.style.useMeterSize || bucket.style.useDegreeSize) ? this.meterSizeProgram : this.program;
                program.apply();

                gl.uniformMatrix4fv(
                    program.uniforms.viewProjectionMatrix,
                    false,
                    renderContext.modelViewMatrix
                );
                gl.uniform1i(program.uniforms.texture, 0);

                gl.uniform1f(
                    program.uniforms.alpha,
                    bucket.layer.getOpacity()
                );
                var color = bucket.style.getFillColor();
                gl.uniform3f(
                    program.uniforms.color,
                    color[0],
                    color[1],
                    color[2]
                );

                if (bucket.style.useMeterSize) {
                    const scaleRadius = this.globe.getCoordinateSystem().getGeoide().getHeightScale();
                    const w = bucket.style.meterSize[0] * scaleRadius;
                    const h = bucket.style.meterSize[1] * scaleRadius;
                    gl.uniform2f(program.uniforms.billboardSize, w, h);
                    gl.uniformMatrix4fv(program.uniforms.viewMatrix, false, renderContext.viewMatrix);
                } else if (bucket.style.useDegreeSize) {
                    const scaleRadius = this.globe.getCoordinateSystem().getGeoide().getHeightScale();
                    const thetaToDist = 2.0 * Math.PI * scaleRadius / 360.0;
                    const w = bucket.style.degreeSize[0] * thetaToDist;
                    const h = bucket.style.degreeSize[1] * thetaToDist;
                    gl.uniform2f(program.uniforms.billboardSize, w, h);
                    gl.uniformMatrix4fv(program.uniforms.viewMatrix, false, renderContext.viewMatrix);
                } else {
                    gl.uniform1f(
                        program.uniforms.pointSize,
                        bucket.textureWidth
                    );
                }

                // Bind point texture
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, bucket.texture);

                currentBucket = bucket;
            }

            if (bucket.style.useMeterSize || bucket.style.useDegreeSize) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.rectVertexBuffer);
                gl.vertexAttribPointer(program.attributes.vertex, 3, gl.FLOAT, false, 0, 0);

                for (var i = 0; i < renderable.vertices.length; i += 3) {
                    const x = renderable.vertices[i];
                    const y = renderable.vertices[i + 1];
                    const z = renderable.vertices[i + 2];

                    gl.uniform3f(program.uniforms.billboardPos, x, y, z);
                    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
                }
            } else {
                if (!renderable.vertexBuffer) {
                    renderable.vertexBuffer = gl.createBuffer();
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, renderable.vertexBuffer);
                gl.vertexAttribPointer(
                    program.attributes.vertex,
                    3,
                    gl.FLOAT,
                    false,
                    0,
                    0
                );

                if (renderable.vertexBufferDirty) {
                    gl.bufferData(
                        gl.ARRAY_BUFFER,
                        new Float32Array(renderable.vertices),
                        gl.STATIC_DRAW
                    );
                    renderable.vertexBufferDirty = false;
                }

                gl.drawArrays(gl.POINTS, 0, renderable.vertices.length / 3);
            }
        }

        //gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
    };

    /**************************************************************************************************************/

    // Register the renderer
    RendererManager.factory.push(function(globe) {
        return new PointSpriteRenderer(globe);
    });
    return PointSpriteRenderer;
});
