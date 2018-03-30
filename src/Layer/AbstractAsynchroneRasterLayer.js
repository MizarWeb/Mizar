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
         * @name AbstractAsynchroneRasterLayer
         * @class
         *    Creates a layer for managing the GetCapability and retreive automatically layers
         * @augments AbstractRasterLayer
         * @param {AbstractRasterLayer.wms_configuration} options - Asynchrone layer configuration
         * @constructor
         * @memberOf module:Layer
         */
        var AbstractAsynchroneRasterLayer = function (type,options) {
            this.areLayersLoaded = false;
            this.type = type;

            this.restrictTo = options.restrictTo;
            this._computeBaseUrlAndCapabilities(options);

            if (typeof options.asynchroneCallback !== "undefined") {
                this.asynchroneCallback = options.asynchroneCallback;
            }

            this.internalAsynchroneCallback = function (object) {
                for (var i=0;i<object.layersID.length;i++) {
                    console.log("   asynchrone loaded : "+object.layersID[i]);
                }
            }

            if (options.type === "AsynchroneWMS") {
                typeLayer = Constants.LAYER.WMS;
            } else if (options.type === "AsynchroneWMTS") {
                typeLayer = Constants.LAYER.WMTS;
            } else {
                throw new ReferenceError("Layer type not recognized : "+options.type,"AbstractAsynchroneRasterLayer.js");
            }

            this.multiLayers = [];
            this.loadedLayers = [];
            this.layers = options.layers;

            AbstractRasterLayer.prototype.constructor.call(this, typeLayer, options);

            // If the layer is eligible to GetCapabilities and no layers are provided,
            // this array is filled with a config by layer to load
            // After loading, each config is loaded in a layer object, bypassing GetCapabilities

            return this.ID;
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractRasterLayer, AbstractAsynchroneRasterLayer);

        /**************************************************************************************************************/

        function _computeCapabilitiesFromBaseUrl(baseUrl, options) {
            var getCapabilitiesUrl = baseUrl;
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WMS");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "version", options.hasOwnProperty('version') ? options.version : '1.1.1');
            return getCapabilitiesUrl;
        }

        /**************************************************************************************************************/

        AbstractAsynchroneRasterLayer.prototype._computeBaseUrlAndCapabilities = function(options) {
            if(options.getCapabilities) {
                options.baseUrl = Utils.computeBaseUrlFromCapabilities(options.getCapabilities,["service","request","version"]);
            } else if(options.baseUrl) {
                options.getCapabilities = _computeCapabilitiesFromBaseUrl.call(this, options.baseUrl, options);
            } else {
                throw new ReferenceError('No URL to access to the server is defined', 'WMSLayer.js');
            }
        }

        /**
         * Returns the list of layers to load
         * @function getLisLayersToLoad
         * @memberOf #AbstractAsynchroneRasterLayer
         * @param {Json} foundLayers
         * @param {Array/String} searchLayers
         * @return {Array} Array of layers name
         */
        AbstractAsynchroneRasterLayer.prototype.getListLayersToLoad = function (foundLayers, searchLayers, onlyFirst) {
            // Trivial case : no layers specified, so need to load all
            var isLoadAll = ( (searchLayers === "") || (searchLayers === null) || (typeof searchLayers === "undefined"));
            var isOnlyFirst = ( (onlyFirst !== null) && (typeof onlyFirst !== "undefined") && (onlyFirst === true));
            var arrSearchLayers = null;

            if (isLoadAll === false) {
                // Get array of layers search
                arrSearchLayers = searchLayers.split(",");
            }

            if (typeof foundLayers.length === "undefined") {
                // If we found only one element, set it into array
                foundLayers = [foundLayers];
            }

            var toLoadLayers = [];
            for (var i = 0; i < foundLayers.length; i++) {
                var foundName = foundLayers[i].Name._text;
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

        return AbstractAsynchroneRasterLayer;

    });
