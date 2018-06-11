define(["jquery","underscore-min", "../Utils/Utils", "xmltojson", "../Layer/LayerFactory"],
    function ($, _, Utils, XmlToJson, LayerFactory, WCS) {

        var WCSServer = function (proxyUse, proxyUrl, options) {
            if (options.getCapabilities) {
                options.baseUrl = Utils.computeBaseUrlFromCapabilities(options.getCapabilities, ["service", "request", "version"]);
            } else if (options.baseUrl) {
                options.getCapabilities = WCSServer.getCapabilitiesFromBaseURL(options.baseUrl, options);
            } else {
                throw new ReferenceError('No URL to access to the server is defined', 'WCSServer.js');
            }
            options.describeCoverage = WCSServer.describeCoverageFromBaseURL(options.baseUrl, options);
            this.proxyUse = proxyUse;
            this.proxyUrl = proxyUrl;
            this.options = options;
        };

        function _mustBeSkipped(layersFromConf, currentLayer) {
            return layersFromConf.length !== 0 && !_.contains(layersFromConf, currentLayer.name._text);
        }

        function _bbox(jsonBbox) {
            var pos = jsonBbox.pos;
            var pos1 = pos[0]._text.split(" ");
            var pos2 = pos[1]._text.split(" ");
            return [parseFloat(pos1[0]), parseFloat(pos1[1]), parseFloat(pos2[0]), parseFloat(pos2[1])];
        }


        function _computeCenterBbox(bbox) {
            var center;
            if(bbox == null) {
                center = [0,0];
            } else {
                var centerLong = 0.5 * (bbox[0]+bbox[2]);
                var centerLat = 0.5 * (bbox[1]+bbox[3]);
                var deltaLong = bbox[2]-bbox[0];
                if(deltaLong > 180) {
                    deltaLong = 180;
                }
                var deltaLat = bbox[3]-bbox[1];
                var delta = (deltaLong > deltaLat) ? deltaLat : deltaLong;
                var distance = Math.abs(delta) * 3000000 / 180;
                center = [centerLong, centerLat, distance];
            }
            return center;
        }

        function _timeVal(lonlat) {
            var values;
            if (lonlat.timePosition == null) {
                values = null;
            } else {
                var timeArr = [];
                var time = lonlat.timePosition;
                for (var i=0;i<time.length;i++) {
                    timeArr.push(time[i]._text);
                }
                values = timeArr.join(",");
            }
            return values;
        }

        WCSServer.prototype.getMetadata = function (callback, fallback) {
            var self = this;
            Utils.requestUrl(Utils.proxify(this.options.getCapabilities, {"use" : this.proxyUse, "url" : this.proxyUrl}), 'text', {},
                function (response) {
                    var myOptions = {
                        mergeCDATA: true,
                        xmlns: false,
                        attrsAsObject: false,
                        childrenAsArray: false
                    };
                    var metadata = XmlToJson.parseString(response, myOptions);
                    callback(self.options, metadata);
                },
                function (e) {
                    if (fallback) {
                        e.setLayerDescription(self.options);
                        fallback(e);
                    }
                }
            );
        };

        WCSServer.prototype.getCoverage = function (callback, fallback) {
            var self = this;
            Utils.requestUrl(Utils.proxify(this.options.describeCoverage, {"use" : this.proxyUse, "url" : this.proxyUrl}), 'text', {},
                function (response) {
                    var myOptions = {
                        mergeCDATA: true,
                        xmlns: false,
                        attrsAsObject: false,
                        childrenAsArray: false
                    };
                    var metadata = XmlToJson.parseString(response, myOptions);
                    callback(self.options, metadata);
                },
                function (e) {
                    if (fallback) {
                        e.setLayerDescription(self.options);
                        fallback(e);
                    }
                }
            );
        };


        WCSServer.prototype.createLayers = function (callback, fallback) {
            this.getMetadata(function (layerDescription, metadata) {
                var layersFromConf = layerDescription.hasOwnProperty('layers') ? layerDescription.layers.trim().split(/\s*,\s*/) : [];
                var jsonLayers = [];
                var contentMetadata = metadata.WCS_Capabilities.ContentMetadata;
                if(Array.isArray(contentMetadata.CoverageOfferingBrief)) {
                    jsonLayers = contentMetadata.CoverageOfferingBrief;
                } else {
                    jsonLayers.push(contentMetadata);
                }
                var layers = [];
                for (var i = 0; i < jsonLayers.length; i++) {
                    var jsonLayer = jsonLayers[i].CoverageOfferingBrief;
                    if (_mustBeSkipped.call(this, layersFromConf, jsonLayer)) {
                        continue;
                    }
                    var attribution;
                    if (layerDescription.attribution) {
                        attribution = layerDescription.attribution;
                    } else {
                        attribution = null;
                    }

                    var copyrightURL = null;

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
                        "initialRa":center[0],
                        "initialDec":center[1],
                        "initialFov":center[2],
                        "bbox": bbox
                    };
                    var timeValue = _timeVal.call(this, jsonLayer.lonLatEnvelope);
                    layerDesc.dimension = {};
                    if(timeValue != null) {
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

                    if(layerDesc.dimension.time && layerDesc.dimension.time.value != null) {
                        layerDesc.time = layerDesc.dimension.time.value.split(",")[0];
                    }
                    var layer = LayerFactory.create(layerDesc);
                    layers.push(layer);
                }
                callback(layers);
            }, fallback);
        };


        WCSServer.getCapabilitiesFromBaseURL = function (baseUrl, options) {
            var getCapabilitiesUrl = baseUrl;
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WCS");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "version", options.hasOwnProperty('version') ? options.version : '1.0.0');
            return getCapabilitiesUrl;
        };

        WCSServer.describeCoverageFromBaseURL = function(baseUrl, options) {
            var describeCoverageUrl = baseUrl;
            describeCoverageUrl = Utils.addParameterTo(describeCoverageUrl, "service", "WCS");
            describeCoverageUrl = Utils.addParameterTo(describeCoverageUrl, "request", "describeCoverage");
            describeCoverageUrl = Utils.addParameterTo(describeCoverageUrl, "version", options.hasOwnProperty('version') ? options.version : '1.0.0');
            return describeCoverageUrl;
        };

        return WCSServer;
    });