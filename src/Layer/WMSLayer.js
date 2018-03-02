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

define(['../Utils/Utils', './AbstractRasterLayer', '../Utils/Constants', '../Tiling/GeoTiling'],
    function (Utils, AbstractRasterLayer, Constants, GeoTiling) {


        /**
         * Configuration parameters to query a Web Map Service (WMS)
         * @typedef {AbstractRasterLayer.configuration} AbstractRasterLayer.wms_configuration
         * @property {int} [tilePixelSize = 256] - tile in pixels
         * @property {int} [numberOfLevels = 21] - number of levels
         * @property {string} [version = "1.1.1"] - WMS version
         * @property {string} [transparent]
         * @property {string} [time] - Time dimension
         * @property {string} [format = "image/jpeg"] - output image format
         * @property {string} layers - names of the layer
         * @property {string} [styles] - Styled Layers Descriptor for each layer
         */

        /**
         * @name WMSLayer
         * @class
         *    Creates a layer for imagery data using WMS (Web Map Service) protocol
         *    based on a GeoTiling(4, 2) with a pixelSize = 256 by default.<br/>
         *    WMS provides a standard interface for requesting a geospatial map image.
         *    The standard guarantees that these images can all be overlaid on one another.
         *    <br/><br/>
         *    Example of a WMS request<br/>
         *    <code>
         *        http://example.com/wms?request=GetMap&service=WMS&version=1.1.1&layers=MyLayer
         *        &styles=population&srs=EPSG:4326&bbox=-145.15104058007,21.731919794922,-57.154894212888,58.961058642578&
         *        &width=780&height=330&format=image/png
         *    </code>
         *
         * @augments AbstractRasterLayer
         * @param {AbstractRasterLayer.wms_configuration} options - WMS Configuration
         * @constructor
         * @memberOf module:Layer
         * @see {@link http://www.opengeospatial.org/standards/wms WMS} standard
         */
        var WMSLayer = function (options) {

            options.tilePixelSize = options.tilePixelSize || 256;
            options.tiling = new GeoTiling(4, 2);
            options.numberOfLevels = options.numberOfLevels || 21;

            this.restrictTo = options.restrictTo;

            _computeBaseUrlAndCapabilities.call(this, options);

            AbstractRasterLayer.prototype.constructor.call(this, Constants.LAYER.WMS, options);

            if (options.byPass === true) {
                this.getMapBaseUrl = _queryImage.call(this, this.getBaseUrl(), this.tilePixelSize, this.tilePixelSize, options);
            } else {
                this.loadGetCapabilities(this.manageCapabilities, this.getGetCapabilitiesUrl(), this);
            }
            this.layers = options.layers;


        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractRasterLayer, WMSLayer);

        /**************************************************************************************************************/

        function _computeBaseUrlAndCapabilities(options) {
            if(options.getCapabilities) {
                options.baseUrl = Utils.computeBaseUrlFromCapabilities(options.getCapabilities,["service","request","version"]);
            } else if(options.baseUrl) {
                options.getCapabilities = _computeCapabilitiesFromBaseUrl.call(this, options.baseUrl, options);
            } else {
                throw new ReferenceError('No URL to access to the WMS server is defined', 'WMSLayer.js');
            }
        }

        function _computeCapabilitiesFromBaseUrl(baseUrl, options) {
            var getCapabilitiesUrl = baseUrl;
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WMS");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "version", options.hasOwnProperty('version') ? options.version : '1.1.1');
            return getCapabilitiesUrl;
        }

        function _queryImage(baseUrl, xTilePixelSize, yTilePixelSize, options) {
            // Build the base GetMap URL
            var url = baseUrl;
            url = Utils.addParameterTo(url, "service", "wms");
            url = Utils.addParameterTo(url, "version", options.hasOwnProperty('version') ? options.version : '1.1.1');
            url = Utils.addParameterTo(url, "request", "getMap");
            url = Utils.addParameterTo(url, "layers", options.layers);
            url = Utils.addParameterTo(url, "styles", options.hasOwnProperty('styles') ? options.styles : "");
            url = Utils.addParameterTo(url, "format", options.hasOwnProperty('format') ? options.format : 'image/jpeg');

            if (options.hasOwnProperty('transparent')) {
                url = Utils.addParameterTo(url, "transparent", options.transparent);
            }
            url = Utils.addParameterTo(url, "width", xTilePixelSize);
            url = Utils.addParameterTo(url, "height", yTilePixelSize);

            if (options.hasOwnProperty('time')) {
                url = Utils.addParameterTo(url, "time", options.time);
            }

            return url;
        }

        function _parseAbstract(layer, globalLayer) {
            var result;
            if (layer.hasOwnProperty('Abstract')) {
                result = layer.Abstract._text;
            } else if (globalLayer.hasOwnProperty('Abstract')) {
                result = globalLayer.Abstract._text;
            } else {
                result = null;
            }
            return result;
        }

        function _parseTitle(layer, globalLayer) {
            var result;
            if (layer.hasOwnProperty('Title')) {
                result = layer.Title._text;
            } else if (globalLayer.hasOwnProperty('Title')) {
                result = globalLayer.Title._text;
            } else {
                result = null;
            }
            return result;
        }

        function _parseAttributionTitle(layer, globalLayer) {
            var result;
            if (layer.hasOwnProperty('Attribution') && layer.Attribution.hasOwnProperty('Title')) {
                result = layer.Attribution.Title._text;
            } else if (globalLayer.hasOwnProperty('Attribution') && globalLayer.Attribution.hasOwnProperty('Title')) {
                result = globalLayer.Attribution.Title._text;
            } else {
                result = null;
            }
            return result;
        }

        function _parseAttributionOnline(layer, globalLayer) {
            var result;
            if (layer.hasOwnProperty('Attribution') && layer.Attribution.hasOwnProperty('OnlineResource')) {
                result = layer.Attribution.OnlineResource._attrhref._value;
            } else if (globalLayer.hasOwnProperty('Attribution') && globalLayer.Attribution.hasOwnProperty('OnlineResource')) {
                result = globalLayer.Attribution.OnlineResource._attrhref._value;
            } else {
                result = null;
            }
            return result;
        }

        function _parseLogo(layer, globalLayer) {
            var result;
            if (layer.hasOwnProperty('Attribution') && layer.Attribution.hasOwnProperty('LogoURL')) {
                result = layer.Attribution.LogoURL.OnlineResource._attrhref._value;
            } else if (globalLayer.hasOwnProperty('Attribution') && globalLayer.Attribution.hasOwnProperty('LogoURL')) {
                result = globalLayer.Attribution.LogoURL.OnlineResource._attrhref._value;
            } else {
                result = null;
            }
            return result;
        }


        function _parseMetadata(sourceObject, layer, globalLayer, options) {
            var logo = _parseLogo.call(this, layer, globalLayer);
            var logoSrc;
            if(logo == null) {
                logoSrc="";
            } else {
                logoSrc = "<img src=\""+logo+"\" width=50px> ";
            }
            sourceObject.name = options.name || _parseTitle.call(this, layer, globalLayer);
            sourceObject.attribution = options.attribution || _parseAttributionTitle.call(this, layer, globalLayer);
            if(options.attribution == null && sourceObject.attribution != null) {
                sourceObject.attribution = logoSrc+sourceObject.attribution;
            }
            sourceObject.copyrightUrl = options.copyrightUrl || _parseAttributionOnline.call(this, layer, globalLayer);
            sourceObject.description = options.description || _parseAbstract.call(this, layer, globalLayer);
        }

        function _tileIsIntersectedFootprint(tile, footprint) {
            var isIntersect;
            if (footprint != null) {
                // check if tile is inside restrict zone
                isIntersect = Utils.boundsIntersects(tile, footprint);
            } else {
                isIntersect = true;
            }
            return isIntersect;
        }


        /**
         * Returns the list of layers to load
         * @function getLisLayersToLoad
         * @memberOf WMSLayer#
         * @param {Json} foundLayers
         * @param {Array/String} searchLayers
         * @return {Array} Array of layers name
         */
        WMSLayer.prototype.getListLayersToLoad = function (foundLayers, searchLayers, onlyFirst) {
            // Trivial case : no layers specified, so need to load all
            var isLoadAll = ( (searchLayers === "") || (searchLayers === null) || (typeof searchLayers === "undefined"));
            var isOnlyFirst = ( (onlyFirst !== null) && (typeof onlyFirst !== "undefined") && (onlyFirst === true));

            if (isLoadAll === false) {
                // Get array of layers search
                var arrSearchLayers = searchLayers.split(",");
            }

            if (typeof foundLayers.length === "undefined") {
                // If we found only one element, set it into array
                foundLayers = [foundLayers];
            }

            var toLoadLayers = [];
            for (var i = 0; i < foundLayers.length; i++) {
                var foundName = foundLayers[i].Name["_text"];
                if (isLoadAll === true) {
                    toLoadLayers.push(foundName);
                } else {
                    for (var j = 0; j < arrSearchLayers.length; j++) {
                        if (foundName === arrSearchLayers[j]) {
                            toLoadLayers.push(foundName);
                        }
                    }
                }
            }

            if ((onlyFirst) && (toLoadLayers.length > 1)) {
                toLoadLayers = [toLoadLayers[0]];
            }
            return toLoadLayers;
        };

        /**************************************************************************************************************/

        /**
         * When getCapabilities is loading, manage it
         * @function manageCapabilities
         * @memberof WMSLayer#
         * @param json Json object
         * @param sourceObject Object where data is stored
         * @private
         */

        WMSLayer.prototype.manageCapabilities = function (json, sourceObject) {
            var jsRoot = json.WMT_MS_Capabilities;
            var jsCapability = jsRoot.Capability;
            var jsLayers = jsCapability.Layer.Layer;
            var toLoadLayers = sourceObject.getListLayersToLoad(jsLayers, sourceObject.options.layers, sourceObject.options.onlyFirst);
            if (toLoadLayers.length === 1) {
                // only one layer to load !
                _parseMetadata.call(this, sourceObject, jsLayers, jsCapability.Layer, sourceObject.options);
                sourceObject.options.layers = toLoadLayers[0];
                sourceObject.getMapBaseUrl = _queryImage.call(this, sourceObject.baseUrl, sourceObject.tilePixelSize, sourceObject.tilePixelSize, sourceObject.options);
                sourceObject.getCapabilitiesEnabled = false;
            } else {
                // More than one layer, duplicate config
                for (var i = 0; i < toLoadLayers.length; i++) {
                    var layerName = toLoadLayers[i];
                    var newConfig = Object.assign({}, sourceObject.options);
                    _parseMetadata.call(this, newConfig, jsLayers[i], jsCapability.Layer, sourceObject.options);
                    newConfig.layers = layerName;
                    newConfig.byPass = true;
                    sourceObject.multiLayers.push(newConfig);
                }
            }
            if ((sourceObject.callbackContext !== null) && (typeof sourceObject.callbackContext !== "undefined")) {
                sourceObject.callbackContext.addLayerFromObject(sourceObject, sourceObject.options);
            }
        };

        /**
         * Returns the url for the given tile
         * @function getUrl
         * @memberOf WMSLayer#
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        WMSLayer.prototype.getUrl = function (tile) {
            // Just add the bounding box to the GetMap URL
            var bound = tile.bound;

            var url;
            // we cannot reject the request to the server when the layer is defined as background otherwise there is
            // no image to show and Mizar is waiting for an image
            if(this.isBackground() || _tileIsIntersectedFootprint(bound, this.restrictTo)) {
                var bbox = bound.west + "," + bound.south + "," + bound.east + "," + bound.north;
                url = this.getMapBaseUrl;
                url = Utils.addParameterTo(url, "srs", tile.config.srs);
                url = Utils.addParameterTo(url, "bbox", bbox);
                url = this.proxify(url);
            } else {
                url = null;
            }

            return url;
        };

        /**************************************************************************************************************/

        return WMSLayer;

    });
