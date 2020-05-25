/*******************************************************************************
 * Copyright 2017-2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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
define([
    "underscore",
    "../Utils/Utils",
    "xmltojson",
    "../Layer/LayerFactory"
], function(_, Utils, XmlToJson, LayerFactory) {
    /**
     * @class
     * Creates an instance of WCS server
     * A WCS server exposes a set of {@link WCSElevationLayer WCS} layers.
     * @param {Options} options Options
     * @param {string} [options.baseUrl] Base URL of the getCapabilities
     * @param {string} [options.getCapabilities] GetCapabilities
     * @constructor
     * @memberof module:Registry
     */
    var WCSServer = function(options) {
        if (options.getCapabilities) {
            options.baseUrl = Utils.computeBaseUrlFromCapabilities(
                options.getCapabilities,
                ["service", "request", "version"]
            );
        } else if (options.baseUrl) {
            options.getCapabilities = WCSServer.getCapabilitiesFromBaseURL(
                options.baseUrl,
                options
            );
        } else {
            throw new ReferenceError(
                "No URL to access to the server is defined",
                "WCSServer.js"
            );
        }
        options.describeCoverage = WCSServer.describeCoverageFromBaseURL(options.baseUrl, options);
        this.options = options;
    };

    /**
     * Skip when the current layer is not included in the list of defined layers (layersFromConf)
     * @param {string[]} layersFromConf List of user-defined layer
     * @param {string} currentLayer
     * @returns {boolean} true wen the currentLayer is not included in the list of user-defined layers otherwise false
     * @function _mustBeSkipped
     * @memberof WCSServer#
     * @private
     */
    function _mustBeSkipped(layersFromConf, currentLayer) {
        return (
            layersFromConf.length !== 0 &&
            !_.contains(layersFromConf, currentLayer.name._text)
        );
    }

    /**
     * Converts a bbox string to an array of float.
     * @param {string[]} jsonBbox. bbox as string. First element is the lower left corner. 2nd element is the upper right corner
     * @returns {bbox_type} bbox as an array
     * @function _bbox
     * @memberof WCSServer#
     * @private
     */
    function _bbox(jsonBbox) {
        var pos = jsonBbox.pos;
        var pos1 = pos[0]._text.split(" ");
        var pos2 = pos[1]._text.split(" ");
        return [
            parseFloat(pos1[0]),
            parseFloat(pos1[1]),
            parseFloat(pos2[0]),
            parseFloat(pos2[1])
        ];
    }

    /**
     * @typedef bbox_type
     * @type {array}
     * @property {string} 0 longitude in degee of the lower left corner.
     * @property {string} 1 latitude in degee of the lower left corner.
     * @property {string} 2 longitude in degee of the upper right corner.
     * @property {string} 3 latitude in degee of the upper right corner.
     */

    /**
     * @typedef center_type
     * @type {array}
     * @property {string} 0 longitude in degee.
     * @property {string} 1 latitude in degee.
     * @property {string} 2 distance from ground in meter.
     */

    /**
     * Computes the bbox center.
     * if bbox is null then center is defined as [0,0, 100000]
     * @param {bbox_type|null} bbox
     * @returns {center_type} the central position of the camera and the distance from which the bbox is embedded
     * @function _computeCenterBbox
     * @memberof WCSServer#
     * @private
     */
    function _computeCenterBbox(bbox) {
        var center;
        if (bbox == null) {
            center = [0, 0, 100000];
        } else {
            var centerLong = 0.5 * (bbox[0] + bbox[2]);
            var centerLat = 0.5 * (bbox[1] + bbox[3]);
            var deltaLong = bbox[2] - bbox[0];
            if (deltaLong > 180) {
                deltaLong = 180;
            }
            var deltaLat = bbox[3] - bbox[1];
            var delta = deltaLong > deltaLat ? deltaLat : deltaLong;
            var distance = (Math.abs(delta) * 3000000) / 180;
            center = [centerLong, centerLat, distance];
        }
        return center;
    }

    /**
     * Returns the time values seprated with a comma.
     * @param {*} lonlat
     * @returns {string} time seprated by a value
     * @function _timeVal
     * @memberof WCSServer#
     * @private
     */
    function _timeVal(lonlat) {
        var values;
        if (lonlat.timePosition == null) {
            values = null;
        } else {
            var timeArr = [];
            var time = lonlat.timePosition;
            for (var i = 0; i < time.length; i++) {
                timeArr.push(time[i]._text);
            }
            values = timeArr.join(",");
        }
        return values;
    }

    /**
     * Returns the metadata
     * @param {metadata~requestCallback} callback
     * @param {serverLayerFallback} fallback
     * @function getMetadata
     * @memberof WCSServer#
     */

    WCSServer.prototype.getMetadata = function(callback, fallback) {
        var self = this;
        Utils.requestUrl(
            this.options.getCapabilities,
            "text",
            "application/xml",
            {},
            function(response) {
                var myOptions = {
                    mergeCDATA: true,
                    xmlns: false,
                    attrsAsObject: false,
                    childrenAsArray: false
                };
                var metadata = XmlToJson.parseString(response, myOptions);
                callback(self.options, metadata);
            },
            function(e) {
                if (fallback) {
                    e.setLayerDescription(self.options);
                    fallback(e);
                }
            }
        );
    };

    /**
     * Returns the coverage
     * @param {*} callback
     * @param {*} fallback
     * @function getCoverage
     * @memberof WCSServer#
     */

    WCSServer.prototype.getCoverage = function(callback, fallback) {
        var self = this;
        Utils.requestUrl(
            this.options.describeCoverage,
            "text",
            "application/xml",
            {},
            function(response) {
                var myOptions = {
                    mergeCDATA: true,
                    xmlns: false,
                    attrsAsObject: false,
                    childrenAsArray: false
                };
                var metadata = XmlToJson.parseString(response, myOptions);
                callback(self.options, metadata);
            },
            function(e) {
                if (fallback) {
                    e.setLayerDescription(self.options);
                    fallback(e);
                }
            }
        );
    };

    /**
     * This callback creates the layers from the WCS capabilities.
     * @callback metadata~requestCallback
     * @param {string} layerDescription layerDescription
     * @param {string} metadata WCS capabiilties
     */

    /**
     * Create WCS layers from WCS capabilities
     * @param {serverLayerCallback} callback
     * @param {serverLayerFallback} fallback
     * @function createLayers
     * @memberof WCSServer#
     */
    WCSServer.prototype.createLayers = function(callback, fallback) {
        this.getMetadata(function(layerDescription, metadata) {
            // extracts layers from layer description if set
            var layersFromConf = layerDescription.hasOwnProperty("layers")
                ? layerDescription.layers.trim().split(/\s*,\s*/)
                : [];

            // retrieves the list of layers from capabilities
            var jsonLayers = [];
            var contentMetadata = metadata.WCS_Capabilities.ContentMetadata;
            if (Array.isArray(contentMetadata.CoverageOfferingBrief)) {
                jsonLayers = contentMetadata.CoverageOfferingBrief;
            } else {
                jsonLayers.push(contentMetadata);
            }

            // iter on each layer
            var layers = [];
            for (var i = 0; i < jsonLayers.length; i++) {
                // get a layer
                var jsonLayer = jsonLayers[i].CoverageOfferingBrief;
                if (_mustBeSkipped.call(this, layersFromConf, jsonLayer)) {
                    continue;
                }

                // get attribution
                var attribution;
                if (layerDescription.attribution) {
                    attribution = layerDescription.attribution;
                } else {
                    attribution = null;
                }

                // no copyright information from WCS capabilities
                var copyrightURL = null;

                // clone the layerDescription and fill it
                var layerDesc = Object.assign({}, layerDescription, {});
                layerDesc.name = layerDescription.name || jsonLayer.label._text;
                layerDesc.format = layerDescription.format;
                layerDesc.layers = jsonLayer.name._text;
                layerDesc.description = layerDescription.description;
                layerDesc.attribution = attribution;
                layerDesc.copyrightUrl = copyrightURL;
                var bbox = _bbox.call(this, jsonLayer.lonLatEnvelope);
                var center = _computeCenterBbox.call(this, bbox);
                layerDesc.properties = {
                    initialRa: center[0],
                    initialDec: center[1],
                    initialFov: center[2],
                    bbox: bbox
                };

                // extract time capabilities and fillt the layer description
                var timeValue = _timeVal.call(this, jsonLayer.lonLatEnvelope);
                layerDesc.dimension = {};
                if (timeValue != null) {
                    layerDesc.dimension.time = {
                        units: "ISO8601",
                        unitSymbol: null,
                        default: null,
                        multipleValues: null,
                        nearestValue: null,
                        current: null,
                        value: timeValue
                    };
                }

                layerDesc.metadataAPI = jsonLayer;

                // get the first value of the time range
                if (
                    layerDesc.dimension.time &&
                    layerDesc.dimension.time.value != null
                ) {
                    layerDesc.time = layerDesc.dimension.time.value.split(
                        ","
                    )[0];
                }

                // create the layer
                var layer = LayerFactory.create(layerDesc);
                layers.push(layer);
            }
            callback(layers);
        }, fallback);
    };

    /**
     * Returns the capabilities
     * @param {string} baseUrl GetCapabilities URL
     * @param {Object} options
     * @param {string} [options.version = 1.0.0] WCS version
     * @function getCapabilitiesFromBaseURL
     * @memberof WCSServer#
     * @returns {string} describeCoverage URL
     */
    WCSServer.getCapabilitiesFromBaseURL = function(baseUrl, options) {
        var getCapabilitiesUrl = baseUrl;
        getCapabilitiesUrl = Utils.addParameterTo(
            getCapabilitiesUrl,
            "service",
            "WCS"
        );
        getCapabilitiesUrl = Utils.addParameterTo(
            getCapabilitiesUrl,
            "request",
            "getCapabilities"
        );
        getCapabilitiesUrl = Utils.addParameterTo(
            getCapabilitiesUrl,
            "version",
            options.hasOwnProperty("version") ? options.version : "1.0.0"
        );
        return getCapabilitiesUrl;
    };

    /**
     * Describes the coverage
     * @param {string} baseUrl describeCoverage URL
     * @param {Object} options Options
     * @param {string} [options.version = 1.0.0] WCS version
     * @function describeCoverageFromBaseURL
     * @memberof WCSServer#
     * @returns {string} describeCoverage URL
     */
    WCSServer.describeCoverageFromBaseURL = function(baseUrl, options) {
        var describeCoverageUrl = baseUrl;
        describeCoverageUrl = Utils.addParameterTo(
            describeCoverageUrl,
            "service",
            "WCS"
        );
        describeCoverageUrl = Utils.addParameterTo(
            describeCoverageUrl,
            "request",
            "describeCoverage"
        );
        describeCoverageUrl = Utils.addParameterTo(
            describeCoverageUrl,
            "version",
            options.hasOwnProperty("version") ? options.version : "1.0.0"
        );
        return describeCoverageUrl;
    };

    return WCSServer;
});
