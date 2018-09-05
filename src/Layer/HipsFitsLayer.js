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

define(['../Utils/Constants', '../Utils/Utils', '../Utils/Constants', '../Tiling/HEALPixTiling', './AbstractHipsLayer', '../Renderer/DynamicImage', './FitsLoader', 'gzip', '../Utils/ImageRequest', './FitsRequest'],
    function (Contants, Utils, Constants, HEALPixTiling, AbstractHipsLayer, DynamicImage, FitsLoader, gZip, ImageRequest) {

        /**************************************************************************************************************/

        /**
         * HipsFits configuration
         * @typedef {AbstractHipsLayer.configuration} AbstractHipsLayer.hipsFits_configuration
         * @property {Function} onready - Callback function
         */
        
        /**
         * @name HipsFitsLayer
         * @class
         * This layer draws an Hips Fits Image
         * @augments AbstractHipsLayer
         * @param {Object} hipsMetadata - HIPS Metadata
         * @param {AbstractHipsLayer.hipsFits_configuration} options - HipsFits configuration
         * @memberOf module:Layer
         * @see {@link http://www.ivoa.net/documents/HiPS/20170406/index.html Hips standard}
         */
        var HipsFitsLayer = function (hipsMetadata, options) {
            AbstractHipsLayer.prototype.constructor.call(this, hipsMetadata, options);

            this._ready = false;
            this.fitsSupported = true;

            // allsky
            this.levelZeroImage = null;

            // TODO use DynamicImage shaders by unifying shader programs between TileManager and ConvexPolygonRenderer
            //		* inverse Y coordinates, some var names refactor..
            this.rawFragShader = "precision lowp float; \n";
            this.rawFragShader += "varying vec2 texCoord;\n";
            this.rawFragShader += "uniform sampler2D colorTexture; \n";
            this.rawFragShader += "uniform float opacity; \n";
            this.rawFragShader += "uniform float inversed; \n";
            this.rawFragShader += "bool isnan(float val) {\n";
            this.rawFragShader += "		return (val <= 0.0 || 0.0 <= val) ? ((val == 5e-324) ? true : false) : true;\n";
            this.rawFragShader += "}\n";
            this.rawFragShader += "void main(void)\n";
            this.rawFragShader += "{\n";
            this.rawFragShader += "	vec4 color = texture2D(colorTexture, vec2(texCoord.x, (inversed == 1.) ? 1.0 - texCoord.y : texCoord.y));\n";
            this.rawFragShader += "	gl_FragColor = vec4(color.r,color.g,color.b, color.a*opacity);\n";
            this.rawFragShader += "	if (isnan( (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b) / 3. ) )\n";
            this.rawFragShader += "	{\n";
            this.rawFragShader += "		gl_FragColor.a = 0.;\n";
            this.rawFragShader += "	}\n";
            this.rawFragShader += "}\n";

            this.colormapFragShader = "precision lowp float; \n";
            this.colormapFragShader += "varying vec2 texCoord;\n";
            this.colormapFragShader += "uniform sampler2D colorTexture; \n";
            this.colormapFragShader += "uniform sampler2D colormap; \n";
            this.colormapFragShader += "uniform float min; \n";
            this.colormapFragShader += "uniform float max; \n";
            this.colormapFragShader += "uniform float opacity; \n";
            this.colormapFragShader += "bool isnan(float val) {\n";
            this.colormapFragShader += "	return (val <= 0.0 || 0.0 <= val) ? false : true;\n";
            this.colormapFragShader += "}\n";
            this.colormapFragShader += "void main(void)\n";
            this.colormapFragShader += "{\n";
            this.colormapFragShader += "	float i = texture2D(colorTexture,vec2(texCoord.x, 1.0 - texCoord.y)).r;\n";
            this.colormapFragShader += "	float d = clamp( ( i - min ) / (max - min), 0.0, 1.0 );\n";
            this.colormapFragShader += "	vec4 cmValue = texture2D(colormap, vec2(d,0.));\n";
            this.colormapFragShader += "	gl_FragColor = vec4(cmValue.r,cmValue.g,cmValue.b, cmValue.a*opacity);\n";
            this.colormapFragShader += "	if (isnan( i ) )\n";
            this.colormapFragShader += "	{\n";
            this.colormapFragShader += "		 gl_FragColor.a = 0.;\n";
            this.colormapFragShader += "	}\n";
            this.colormapFragShader += "}\n";

            var self = this;

            this.customShader = {
                fragmentCode: this.rawFragShader,
                updateUniforms: function (gl, program) {
                    // Level zero image is required to init uniforms
                    gl.uniform1f(program.uniforms.inversed, self.inversed);
                    if (self.levelZeroImage) {
                        gl.uniform1f(program.uniforms.max, self.levelZeroImage.tmax);
                        gl.uniform1f(program.uniforms.min, self.levelZeroImage.tmin);

                        gl.activeTexture(gl.TEXTURE1);
                        gl.bindTexture(gl.TEXTURE_2D, self.levelZeroImage.colormapTex);
                        gl.uniform1i(program.uniforms.colormap, 1);
                        gl.uniform1f(program.uniforms.opacity, self.getOpacity());
                    }
                }
            };

            // Request for level zero image
            this.imageRequest = new ImageRequest({
                successCallback: function () {
                    var data, res;
                    self._ready = true;

                    if (self.format === "fits") {
                        // Unzip if g-zipped
                        try {
                            data = new Uint8Array(self.imageRequest.image);
                            res = gZip.unzip(data);
                            self.imageRequest.image = new Uint8Array(res).buffer;
                        }
                        catch (err) {
                            if (err !== 'Not a GZIP file') {
                                // G-zip error
                                console.error(err);
                                this.failCallback();
                                return;
                            } else {
                                // Image isn't g-zipped, handle image as fits
                                console.log("not gzipped");
                                data = null;
                            }
                        }

                        self.handleImage(self.imageRequest);
                        var fitsData = self.imageRequest.image;
                        if (self.globe) {
                            // Create level zero image
                            var gl = self.globe.getRenderContext().gl;
                            self.levelZeroImage = new DynamicImage(self.globe.getRenderContext(), fitsData.typedArray, gl.LUMINANCE, gl.FLOAT, fitsData.width, fitsData.height);
                            self.getLevelZeroTexture = function () {
                                return self.levelZeroImage.texture;
                            };
                        }
                    }
                    else {
                        self.levelZeroImage = this.image;
                        self.getLevelZeroTexture = null;
                    }

                    // Call callback if set
                    if (options.onready && options.onready instanceof Function) {
                        options.onready(self);
                    }

                    // Request a frame
                    if (self.globe) {
                        self.globe.getRenderContext().requestFrame();
                    }
                },
                /**
                 * @fires Context#baseLayersError
                 */
                failCallback: function () {
                    if (self.globe) {
                        self.globe.publishEvent(Constants.EVENT_MSG.BASE_LAYERS_ERROR, self);
                        self._ready = false;
                    }
                },
                abortCallback: function (iq) {
                    self._ready = false;
                }
            });
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractHipsLayer, HipsFitsLayer);

        /**************************************************************************************************************/

        /**
         * Attach the Hips Fits layer to the globe
         * @function _attach
         * @memberof HipsFitsLayer.prototype
         * @param {AbstractGlobe} g Globe to attach
         * @private
         */
        HipsFitsLayer.prototype._attach = function (g) {
            AbstractHipsLayer.prototype._attach.call(this, g);

            // Enable float texture extension to have higher luminance range
            var gl = this.getGlobe().getRenderContext().gl;

            this.requestLevelZeroImage();
            var ext = gl.getExtension("OES_texture_float");

            if (!ext) {
                // TODO
                console.error("no OES_texture_float");
                this.fitsSupported = false;
                //return;
            }
        };

        /**************************************************************************************************************/

        /**
         * Detach the Hips Fits layer from the globe
         * @function _detach
         * @memberof HipsFitsLayer#
         * @private
         */
        HipsFitsLayer.prototype._detach = function () {
            // Abort image request if in progress
            if (!this._ready) {
                this.imageRequest.abort();
            }
            this._ready = false;
            this.disposeResources();

            AbstractHipsLayer.prototype._detach.call(this);

        };

        /**************************************************************************************************************/

        /**
         * Get url from a given tile
         * @function getUrl
         * @memberof HipsFitsLayer#
         * @param {Tile} tile Tile object
         */
        HipsFitsLayer.prototype.getUrl = function (tile) {
            var url = this.baseUrl;

            url += "/Norder";
            url += tile.order;

            url += "/Dir";
            url += Math.floor(tile.pixelIndex / 10000.0) * 10000.0;

            url += "/Npix";
            url += tile.pixelIndex;
            url += "." + this.format;

            return this.proxify(url);
        };

        /**************************************************************************************************************/

        /**
         * Extracts fits data from levelZeroImage.pixels to fitsPixel according to pixel index
         * @function extractFitsData
         * @memberof HipsFitsLayer#
         * @param pi Pixel index
         * @param fitsPixel Resulting typed vector containing fits data
         * @param sx X-offset of fitsPixel
         * @param sy Y-offset of fitsPixel
         */
        HipsFitsLayer.prototype.extractFitsData = function (pi, fitsPixel, sx, sy) {
            var size = 64;
            var height = this.levelZeroImage.height;
            var width = this.levelZeroImage.width;
            var pixels = this.levelZeroImage.pixels;

            var startIndex = size * width * ( 28 - Math.floor(pi / 27) ) + ( pi % 27 ) * size;

            // Extract fits data
            var typedLine;
            for (var i = 0; i < size; i++) {
                typedLine = pixels.subarray(startIndex + i * width, startIndex + i * width + size);
                fitsPixel.set(typedLine, sy + i * 128 + sx);
            }
        };

        /**************************************************************************************************************/

        /**
         * Generates the level0 texture for the tiles
         * @function generateLevel0Textures
         * @memberof HipsFitsLayer#
         * @param tiles
         * @param tilePool
         */
        HipsFitsLayer.prototype.generateLevel0Textures = function (tiles, tilePool) {
            var fitsPixel;
            var pi, sx, sy;
            var i, tile;
            var imgData;
            if (this.format !== "fits") {
                // Create a canvas to build the texture
                var canvas = document.createElement("canvas");
                canvas.width = 128;
                canvas.height = 128;
                var context = canvas.getContext("2d");

                for (i = 0; i < tiles.length; i++) {
                    tile = tiles[i];

                    // Top left
                    pi = tile.pixelIndex * 4;
                    sx = ( pi % 27) * 64;
                    sy = ( Math.floor(pi / 27) ) * 64;
                    context.drawImage(this.levelZeroImage, sx, sy, 64, 64, 0, 0, 64, 64);

                    // Top right
                    pi = tile.pixelIndex * 4 + 2;
                    sx = ( pi % 27) * 64;
                    sy = ( Math.floor(pi / 27) ) * 64;
                    context.drawImage(this.levelZeroImage, sx, sy, 64, 64, 64, 0, 64, 64);

                    // Bottom left
                    pi = tile.pixelIndex * 4 + 1;
                    sx = ( pi % 27) * 64;
                    sy = ( Math.floor(pi / 27) ) * 64;
                    context.drawImage(this.levelZeroImage, sx, sy, 64, 64, 0, 64, 64, 64);

                    // Bottom right
                    pi = tile.pixelIndex * 4 + 3;
                    sx = ( pi % 27) * 64;
                    sy = ( Math.floor(pi / 27) ) * 64;
                    context.drawImage(this.levelZeroImage, sx, sy, 64, 64, 64, 64, 64, 64);

                    imgData = context.getImageData(0, 0, 128, 128);
                    imgData.dataType = 'byte';

                    tile.texture = tilePool.createGLTexture(imgData);
                    tile.imageSize = 128;
                }
            }
            else {
                for (i = 0; i < tiles.length; i++) {
                    tile = tiles[i];
                    fitsPixel = new Float32Array(128 * 128);

                    // Top left
                    pi = tile.pixelIndex * 4;
                    this.extractFitsData(pi, fitsPixel, 0, 128 * 64);

                    // Top right
                    pi = tile.pixelIndex * 4 + 2;
                    this.extractFitsData(pi, fitsPixel, 64, 128 * 64);

                    // Bottom left
                    pi = tile.pixelIndex * 4 + 1;
                    this.extractFitsData(pi, fitsPixel, 0, 0);

                    // Bottom right
                    pi = tile.pixelIndex * 4 + 3;
                    this.extractFitsData(pi, fitsPixel, 64, 0);

                    imgData = {
                        typedArray: fitsPixel,
                        width: 128,
                        height: 128,
                        dataType: 'float'
                    };

                    tile.texture = tilePool.createGLTexture(imgData);
                    tile.imageSize = 128;
                }
            }
        };

        /**************************************************************************************************************/

        /**
         * Handles the fits image.
         * @function handleImage
         * @memberof HipsFitsLayer#
         * @param imgRequest
         */
        HipsFitsLayer.prototype.handleImage = function (imgRequest) {
            if (!(imgRequest.image instanceof Image)) {
                var fits = FitsLoader.parseFits(imgRequest.image);
                var fitsData = fits.getHDU().data;
                var bpe = fitsData.arrayType.BYTES_PER_ELEMENT;
                var float32array, float64array;
                var i;
                if (fitsData.arrayType.name === "Float64Array") {
                    float64array = new Float64Array(fitsData.view.buffer, fitsData.begin, fitsData.length / bpe); // bpe = 8
                    float32array = new Float32Array(fitsData.length / bpe);
                    // Create Float32Array from Float64Array
                    for (i = 0; i < float64array.length; i++) {
                        float32array[i] = float64array[i];
                    }
                }
                else {
                    float32array = new Float32Array(fitsData.view.buffer, fitsData.begin, fitsData.length / bpe); // with gl.FLOAT, bpe = 4
                }

                // // Handle different types/formats.. just in case.
                // var dataType;
                // var typedArray;
                // var gl = this.globe.getRenderContext().gl;
                // var glType;
                // if ( fitsData.arrayType.name == "Float32Array" )
                // {
                // 	typedArray = new Float32Array( fitsData.view.buffer, fitsData.begin, fitsData.length/fitsData.arrayType.BYTES_PER_ELEMENT );
                // 	dataType = "float";
                // 	glType = gl.FLOAT;
                // 	glFormat = gl.LUMINANCE;
                // }
                // else if ( fitsData.arrayType.name == "Uint8Array" )
                // {
                // 	typedArray = new Uint8Array( fitsData.view.buffer, fitsData.begin, fitsData.length/fitsData.arrayType.BYTES_PER_ELEMENT )
                // 	dataType = "int";
                // 	glType = gl.UNSIGNED_BYTE;
                // 	glFormat = gl.LUMINANCE;
                // }

                imgRequest.image = {
                    typedArray: float32array,
                    width: fitsData.width,
                    height: fitsData.height,
                    dataType: "float"
                };

            }
        };

        /**************************************************************************************************************/

        /**
         * Requests level zero image
         * @function requestLevelZeroImage
         * @memberof HipsFitsLayer#
         */
        HipsFitsLayer.prototype.requestLevelZeroImage = function () {
            // Set dataType always to jpg if fits isn't supported by graphic card
            if (!this.fitsSupported) {
                this.format = 'jpg';
            }

            // Revert to raw rendering
            this.customShader.fragmentCode = this.rawFragShader;
            if (this.format === "fits") {
                this.inversed = 1.0;
            }
            else {
                this.inversed = 0.0;
            }

            var url = this.baseUrl + "/Norder3/Allsky." + this.format;
            this.imageRequest.send(url);
        };

        /**************************************************************************************************************/

        /**
         * Disposes the allocated resources
         * @function disposeResources
         * @memberof HipsFitsLayer#
         */
        HipsFitsLayer.prototype.disposeResources = function () {
            // Dispose level zero image & texture
            if (this.levelZeroImage && this.levelZeroImage.dispose) {
                this.levelZeroImage.dispose();
            }
            if (this.levelZeroTexture) {
                this.getGlobe().getRenderContext().gl.deleteTexture(this.levelZeroTexture);
            }

            this.levelZeroImage = null;
            this.levelZeroTexture = null;
        };

        /**************************************************************************************************************/

        /**
         *    Sets the format
         *    (currently never used)
         *    TODO: store basic format(could be 'png' or 'jpg'), to be
         *    able to revert from fits
         * @function setFormat
         * @memberof HipsFitsLayer#
         * @param {String} format Format
         */
        HipsFitsLayer.prototype.setFormat = function (format) {
            this.format = (isFits) ? 'fits' : 'jpg';
        };

        /**************************************************************************************************************/

        return HipsFitsLayer;

    });
