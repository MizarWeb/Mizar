/*******************************************************************************
 * Copyright 2017 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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

define(['../Utils/Utils', '../Tiling/HEALPixTiling', './AbstractHipsLayer', '../Utils/Constants'],
    function (Utils, HEALPixTiling, AbstractHipsLayer, Constants) {

        /**************************************************************************************************************/

        /**
         * HipsFits configuration
         * @typedef {AbstractHipsLayer.configuration} AbstractHipsLayer.graphic_configuration
         * @property {Function} onready - Callback function
         */

        /**
         * @name HipsGraphicLayer
         * @class
         * This layer draws an Hips Image
         * @augments AbstractHipsLayer
         * @param {HipsMetadata} hipsMetadata
         * @param {AbstractHipsLayer.graphic_configuration} options - HipsGraphic configuration
         * @memberOf module:Layer
         * @see {@link http://www.ivoa.net/documents/HiPS/20170406/index.html Hips standard}
         * @fires Context#baseLayersError
         */
        var HipsGraphicLayer = function (hipsMetadata, options) {
            //options.format = options.format || "jpg";
            AbstractHipsLayer.prototype.constructor.call(this, hipsMetadata, options);

            // allsky
            this.levelZeroImage = new Image();
            var self = this;
            this.levelZeroImage.crossOrigin = '';
            this.levelZeroImage.onload = function () {
                self._ready = true;

                // Call callback if set
                if (options.onready && options.onready instanceof Function) {
                    options.onready(self);
                }

                // Request a frame
                if (self.globe) {
                    self.globe.renderContext.requestFrame();
                }
            };
            this.levelZeroImage.onerror = function (event) {
                var error = self.getHipsMetadata();
                error.message = "Cannot load " + self.levelZeroImage.src;
                self.globe.publishEvent(Constants.EVENT_MSG.BASE_LAYERS_ERROR, error);
                self._ready = false;

                console.log("Cannot load " + self.levelZeroImage.src);
            };

            this._ready = false;
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractHipsLayer, HipsGraphicLayer);

        /**************************************************************************************************************/

        /**
         * Attaches the raster layer to the planet.
         * @function _attach
         * @memberOf HipsGraphicLayer#
         * @param g Globe
         * @private
         */
        HipsGraphicLayer.prototype._attach = function (g) {
            AbstractHipsLayer.prototype._attach.call(this, g);

            // Load level zero image now, only for background
            if (!this._overlay && this.isVisible()) {
                this.levelZeroImage.src = this.proxify(this.baseUrl) + "/Norder3/Allsky." + this.format;
            }
        };

        /**************************************************************************************************************/

        /**
         * Returns an url from a given tile.
         * @function getUrl
         * @memberOf HipsGraphicLayer#
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        HipsGraphicLayer.prototype.getUrl = function (tile) {
            var url = this.proxify(this.baseUrl);

            url += "/Norder";
            url += tile.order;

            url += "/Dir";
            var indexDirectory = Math.floor(tile.pixelIndex / 10000.0) * 10000.0;
            url += indexDirectory;

            url += "/Npix";
            url += tile.pixelIndex;
            url += "." + this.format;

            return url;
        };


        /**************************************************************************************************************/

        /**
         * Generates the level0 texture for the tiles.
         * @function generateLevel0Textures
         * @memberOf HipsGraphicLayer
         * @param {Tile} tiles
         * @param {TilePool} tilePool
         */
        HipsGraphicLayer.prototype.generateLevel0Textures = function (tiles, tilePool) {
            // Create a canvas to build the texture
            var canvas = document.createElement("canvas");
            canvas.width = 128;
            canvas.height = 128;
            var i,pi,sx,sy,tile;
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

                var imgData = context.getImageData(0, 0, 128, 128);
                imgData.dataType = 'byte';

                tile.texture = tilePool.createGLTexture(imgData);
                tile.imageSize = 128;
            }
        };

        /**************************************************************************************************************/

        return HipsGraphicLayer;

    });
