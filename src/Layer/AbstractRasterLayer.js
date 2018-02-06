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
         */
        var AbstractRasterLayer = function (type, options) {
            AbstractLayer.prototype.constructor.call(this, type, options);

            // Base properties
            this.tilePixelSize = options.tilePixelSize;
            this.tiling = options.tiling;
            this.numberOfLevels = options.numberOfLevels;
            this.geoBound = options.geoBound || null;
            this.coordinates = options.coordinates || null;
            this.zIndex = options.zIndex || 0;
            this.crossOrigin = options.crossOrigin || 'anonymous';
            this.baseUrlRaw = options.baseUrl;

            // Get capabilities url (without proxy)
            this.getCapabilitiesRaw = options.getCapabilities;
            // Get map url (without proxy)
            this.getMapRaw = this.baseUrlRaw;

            // Init cache if defined
            if (options.cache) {
                options.cache.layer = this;
                this.cache = new Cache(options.cache);
            }

            // Internal
            this._overlay = true;
            this._ready = true; // Ready is use by TileManager

            this.baseUrl = this.proxify(this.baseUrlRaw);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractLayer, AbstractRasterLayer);

        /**************************************************************************************************************/

        /**
         * Add parameter to
         * @function addParameterTo
         * @memberOf AbstractRasterLayer#
         * @param {String} url - parameter url
         * @param {String} name - parameter name
         * @param {String} value - parameter value
         * @return {String} url updated
         */
        AbstractRasterLayer.prototype.addParameterTo = function (url,name,value) {
            var separator = "&";
            if ((typeof url !== "string") || (url.indexOf('?', 0) === -1)) {
              separator = "?";
            }
            return url + separator + name + "=" + value;
        };

        /**************************************************************************************************************/

        /**
         * Add parameter to getCapabilities url
         * @function addGetCapabilitiesParameter
         * @memberOf AbstractRasterLayer#
         * @param {String} name - parameter name
         * @param {String} value - parameter value
         */
        AbstractRasterLayer.prototype.addGetCapabilitiesParameter = function (name,value) {
            this.getCapabilitiesRaw = this.addParameterTo(this.getCapabilitiesRaw,name,value);
        };

        /**************************************************************************************************************/

        /**
         * Get getCapabilities url
         * @function getGetCapabilitiesUrl
         * @memberOf AbstractRasterLayer#
         * @return {String} url
         */
        AbstractRasterLayer.prototype.getGetCapabilitiesUrl = function () {
            this.getCapabilities = this.proxify(this.getCapabilitiesRaw);
            return this.getCapabilities;
        };

        /**
         * Add parameter to getMap url
         * @function addGetMapParameter
         * @memberOf AbstractRasterLayer#
         * @param {String} name - parameter name
         * @param {String} value - parameter value
         */
        AbstractRasterLayer.prototype.addGetMapParameter = function (name,value) {
          this.getMapRaw = this.addParameterTo(this.getMapRaw,name,value);
        };

        /**************************************************************************************************************/

        /**
         * Get getMap url
         * @function getGetMapUrl
         * @memberOf AbstractRasterLayer#
         * @return {String} url
         */
        AbstractRasterLayer.prototype.getGetMapUrl = function () {
            this.getMap = this.proxify(this.getMapRaw);
            return this.getMap;
        };

        /**************************************************************************************************************/
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
                this.id = 0;
            }

            AbstractLayer.prototype._attach.call(this, g);
            if (this._overlay) {
                // Create the renderer if needed
                if (!g.rasterOverlayRenderer) {
                    var renderer = new RasterOverlayRenderer(g);
                    g.vectorRendererManager.renderers.push(renderer);
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
            if (this._overlay && this.globe.rasterOverlayRenderer) {
                this.globe.rasterOverlayRenderer.removeOverlay(this);
            }

            AbstractLayer.prototype._detach.call(this);
        };

        /**************************************************************************************************************/

        return AbstractRasterLayer;

    });
