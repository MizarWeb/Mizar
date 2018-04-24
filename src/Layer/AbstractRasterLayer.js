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

define(['../Utils/Utils', './AbstractLayer', '../Renderer/RasterOverlayRenderer', '../Utils/Cache'],
    function (Utils, AbstractLayer, RasterOverlayRenderer, Cache) {

        /**
         * AbstractRasterLayer configuration
         * @typedef {AbstractLayer.configuration} AbstractRasterLayer.configuration
         * @property {int} tilePixelSize - the image size of a tile in pixels
         * @property tiling - Tiling
         * @property {int} numberOfLevels - number of levels in the pyramidal tiles
         * @property [geoBound=null] - geography boundary
         * @property [coordinates=null]
         * @property {int} [zIndex=0]
         * @property {string} [crossOrigin="anonymous"]
         * @property {string} baseUrl
         * @property cache
         */

        /**
         * @name AbstractRasterLayer
         * @class
         *     Base class for raster layer
         * @augments AbstractLayer
         * @param {LAYER} type - the type of the layer
         * @param {AbstractRasterLayer.configuration} options -Configuration properties for the AbstractRasterLayer.
         * @constructor
         * @implements {RasterLayer}
         */
        var AbstractRasterLayer = function (type, options) {
            AbstractLayer.prototype.constructor.call(this, type, options);

            // Base properties
            this.tilePixelSize = options.tilePixelSize;
            this.tiling = options.tiling;
            this.numberOfLevels = options.numberOfLevels || 21;
            this.minLevel = options.minLevel;
            this.maxLevel = options.maxLevel;
            this.geoBound = options.geoBound || null;
            this.coordinates = options.coordinates || null;
            this.zIndex = options.zIndex || 0;
            this.crossOrigin = options.crossOrigin || 'anonymous';


            // Init cache if defined
            if (options.cache) {
                options.cache.layer = this;
                this.cache = new Cache(options.cache);
            }

            // Internal
            this._overlay = true;
            this._ready = true; // Ready is use by TileManager

        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractLayer, AbstractRasterLayer);

        /**************************************************************************************************************/

        /**
         * Returns the URL to query the raster.
         * @param {Tile} tile for which the URL is created
         * @returns {string} the URL
         */
        AbstractRasterLayer.prototype.getUrl = function(tile) {
            throw new SyntaxError("getUrl() not implemented","AbstractRasterLayer.js");
        };


        /**
         * Returns the proxified Url when the tile level is between [minLevel, maxLevel]
         * @param url url
         * @returns {Boolean} the proxified Url when the tile level is between [minLevel, maxLevel]
         */
        AbstractRasterLayer.prototype.proxify = function(url, level) {
            var proxifyUrl;
            if(this.isBetweenMinMaxLevel(level)) {
                proxifyUrl = AbstractLayer.prototype.proxify.call(this, url);
            } else {
                proxifyUrl = null;
            }
            return proxifyUrl;
        };

        /**
         * Returns True when the tile is defined between [minLevel,maxLevel] otherwise False.
         * @param level level of the tile
         * @returns {Boolean} True when the tile level is defined between [minLevel,maxLevel] otherwise False.
         */
        AbstractRasterLayer.prototype.isBetweenMinMaxLevel = function(level) {
            var isInside;
            if(this.minLevel != null && this.maxLevel != null) {
                isInside = this.minLevel <= level && level <= this.maxLevel;
            } else if(this.minLevel != null) {
                isInside = level >= this.minLevel;
            } else if(this.maxLevel != null) {
                isInside = level <= this.maxLevel;
            } else {
                isInside = true;
            }

            return isInside;
        };

        /**
         * Attach the raster layer to the planet
         * @function _attach
         * @memberOf AbstractRasterLayer#
         * @param {Globe} g - globe
         * @private
         */
        AbstractRasterLayer.prototype._attach = function (g) {
            if (!this._overlay) {
                // Override id of background layer because of unicity of background not overlayed layer
                //TODO : check if it is still needed
                this.id = 0;
            }

            AbstractLayer.prototype._attach.call(this, g);
            if (this._overlay) {
                // Create the renderer if needed
                if (!g.rasterOverlayRenderer) {
                    var renderer = new RasterOverlayRenderer(g);
                    g.getVectorRendererManager().renderers.push(renderer);
                    g.rasterOverlayRenderer = renderer;
                }
                g.rasterOverlayRenderer.addOverlay(this);
            }
        };

        /**************************************************************************************************************/

        /**
         * Detach the raster layer from the planet
         * @function _detach
         * @memberOf AbstractRasterLayer
         * @private
         */
        AbstractRasterLayer.prototype._detach = function () {
            // Remove raster from overlay renderer if needed
            if (this._overlay && this.getGlobe().rasterOverlayRenderer) {
                this.getGlobe().rasterOverlayRenderer.removeOverlay(this);
            }

            AbstractLayer.prototype._detach.call(this);
        };

        /**
         * @function forceRefresh
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.forceRefresh = function () {
            return;
            
            var tiles = this.getGlobe().tileManager.visibleTiles;

            for (var i=0;i<tiles.length;i++) {
                var renderables = tiles[i].extension.renderer.renderables;
                for (var renderableIdx=0 ; renderableIdx < renderables.length ; renderableIdx++) {
                    var renderable = renderables[renderableIdx];
                    if (renderable.bucket.layer.name === "Palavas") {
                        //var imgs = renderable.bucket.renderer.imageRequests;
                        //for (var imgIdx=0; imgIdx < imgs.length; imgIdx++) {
                        //    delete imgs[imgIdx].renderable;
                        //}
        
                        //renderable.dispose(rc,tp);
        
                        //renderable.bucket.renderer.requestOverlayTextureForTile(renderable);
        
                        //Works but good be much better
                        //renderable.bucket.renderer.removeOverlay(this);
                        //renderable.bucket.renderer.addOverlay(this);
                        renderable.bucket.renderer.updateOverlay(this);
                    }
                }


                //tiles[i].state = 0;
            }




            this.getGlobe().refresh();
        };

        /**************************************************************************************************************/

        return AbstractRasterLayer;

    });
