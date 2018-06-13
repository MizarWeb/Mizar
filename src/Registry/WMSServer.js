define(["jquery","underscore-min", "../Utils/Utils", "xmltojson", "../Layer/LayerFactory", "wms-capabilities"],
    function ($, _, Utils, XmlToJson, LayerFactory, WMSCapabilities) {

        var WMSServer = function (proxyUse, proxyUrl, options) {
            if (options.getCapabilities) {
                options.baseUrl = Utils.computeBaseUrlFromCapabilities(options.getCapabilities, ["service", "request", "version"]);
            } else if (options.baseUrl) {
                options.getCapabilities = WMSServer.getCapabilitiesFromBaseURl(options.baseUrl, options);
            } else {
                throw new ReferenceError('No URL to access to the server is defined', 'WMSLayer.js');
            }
            this.proxyUse = proxyUse;
            this.proxyUrl = proxyUrl;
            this.options = options;
        };

        function _mustBeSkipped(layersFromConf, currentLayerName) {
            return layersFromConf.length !== 0 && !_.contains(layersFromConf, currentLayerName);
        }

        function _hasGroup(jsonLayer) {
            return Array.isArray(jsonLayer.Layer);
        }


        function _computeAttribution(layerDescription, jsonLayers, jsonLayer) {
            var attribution, logo, title;
            if (layerDescription.attribution) {
                attribution = layerDescription.attribution;
            } else if (jsonLayer.Attribution != null) {
                logo = jsonLayer.Attribution.LogoURL != null ? "<img src='" + jsonLayer.Attribution.LogoURL.OnlineResource + "' height='25px'/> " : "";
                title = jsonLayer.Attribution.Title != null ? jsonLayer.Attribution.Title : "";
                attribution = logo + title;
            } else if (jsonLayers.Attribution != null) {
                logo = jsonLayers.Attribution.LogoURL != null ? "<img src='" + jsonLayers.Attribution.LogoURL.OnlineResource + "' height='25px'/> " : "";
                title = jsonLayers.Attribution.Title != null ? jsonLayers.Attribution.Title : "";
                attribution = logo + title;
            } else {
                attribution = null;
            }
            return attribution;
        }

        function _computeCopyrightURL(layerDescription, jsonLayers, jsonLayer) {
            var copyrightURL;
            if (layerDescription.copyrightUrl) {
                copyrightURL = layerDescription.copyrightUrl;
            } else if (jsonLayer.Attribution != null) {
                copyrightURL = jsonLayer.Attribution.OnlineResource != null ? jsonLayer.Attribution.OnlineResource : "";
            } else if (jsonLayers.Attribution != null) {
                copyrightURL = jsonLayers.Attribution.OnlineResource != null ? jsonLayers.Attribution.OnlineResource : "";
            } else {
                copyrightURL = "";
            }
            return copyrightURL;
        }

        function _computeCenterBbox(bbox) {
            var centerLong = 0.5 * (bbox[0]+bbox[2]);
            var centerLat = 0.5 * (bbox[1]+bbox[3]);
            var deltaLong = bbox[2]-bbox[0];
            if(deltaLong > 180) {
                deltaLong = 180;
            }
            var deltaLat = bbox[3]-bbox[1];
            var delta = (deltaLong > deltaLat) ? deltaLat : deltaLong;
            return [centerLong, centerLat];
        }

        function _bbox(jsonLayer) {
            var bbox = jsonLayer.EX_GeographicBoundingBox;
            var result;
            if(bbox == null) {
                result = [-180, -90, 180, 90];
            } else {
                var long1 = bbox[0] > 180 ? bbox[0] - 360 : bbox[0];
                var long2 = bbox[2] > 180 ? bbox[2] - 360 : bbox[2];
                result = [long1, bbox[1], long2, bbox[3]];
            }
            return result;
        }

        function _bboxGroup(jsonLayer) {
            var result;
            if (_hasGroup.call(this, jsonLayer)) {
                var layer, layerBbox;
                var minLong = 180, maxLong=-180, minLat=90, maxLat=-90;
                for (var i=0;i<jsonLayer.Layer.length; i++) {
                    layer = jsonLayer.Layer[i];
                    layerBbox = _bbox.call(this, layer);
                    minLong = Math.min(minLong, layerBbox[0]);
                    minLat = Math.min(minLat, layerBbox[1]);
                    maxLong = Math.max(maxLong, layerBbox[2]);
                    maxLat = Math.max(maxLat, layerBbox[3]);
                }
                result = [ minLong, minLat, maxLong, maxLat ];
            } else {
                result = _bbox.call(this, jsonLayer);
            }
            return result;
        }


        WMSServer.prototype.getMetadata = function (callback, fallback) {
            var self = this;
            Utils.requestUrl(Utils.proxify(this.options.getCapabilities, {"use" : this.proxyUse, "url" : this.proxyUrl} ), 'text', {},
                function (response) {
                    var metadata = new WMSCapabilities().parse(response);
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

        function _parseDimension(dimension) {
            if(dimension == null) {
                return null;
            }
            var dim = {};
            for(var i=0; i<dimension.length; i++) {
                var currentDim = dimension[i];
                var myDim = {
                    units:currentDim.units,
                    unitSymbol:currentDim.unitSymbol,
                    default:currentDim.default,
                    multipleValues:currentDim.multipleValues,
                    nearestValue:currentDim.nearestValue,
                    value:currentDim.values
                };
                dim[currentDim.name] = myDim;
            }
            return dim;
        }

        function _createLayer(layerDescription, jsonLayers, jsonLayer) {
            var attribution = [];
            if (_hasGroup.call(this, jsonLayer)) {
                for (var i=0;i<jsonLayer.Layer.length; i++) {
                    var layer = jsonLayer.Layer[i];
                    attribution.push(_computeAttribution.call(this, layerDescription, jsonLayers, layer));
                }
            } else {
                attribution.push(_computeAttribution.call(this, layerDescription, jsonLayers, jsonLayer));
            }
            var copyrightURL = _computeCopyrightURL.call(this, layerDescription, jsonLayers, jsonLayer);
            var bbox = _bboxGroup.call(this, jsonLayer);
            var center = _computeCenterBbox.call(this, bbox);
            var layerDesc = Object.assign({}, layerDescription, {});
            layerDesc.name = layerDescription.name || jsonLayer.Title;
            layerDesc.format = layerDescription.format || "image/png";
            layerDesc.layers =  jsonLayer.Name;
            layerDesc.description = layerDescription.description || (jsonLayer.Abstract != null) ? jsonLayer.Abstract : jsonLayers.Abstract;
            layerDesc.attribution = attribution.join('<br/>');
            layerDesc.copyrightUrl = copyrightURL;
            layerDesc.autoFillTimeTravel = layerDescription.autoFillTimeTravel;
            layerDesc.properties = {
                "initialRa":center[0],
                "initialDec":center[1],
                "bbox":bbox
            };
            layerDesc.dimension = _parseDimension.call(this, jsonLayer.Dimension);
            layerDesc.metadataAPI = jsonLayer;

            return LayerFactory.create(layerDesc);
        }

        function _createLayers(layerDescription, layersFromConf, jsonLayers) {
            var layers = [];
            for (var i = 0; i < jsonLayers.Layer.length; i++) {
                var jsonLayer = jsonLayers.Layer[i];
                if(jsonLayer.Layer != null) {
                    layers = layers.concat(_createLayers(layerDescription, layersFromConf, jsonLayer));
                }
                if (_mustBeSkipped.call(this, layersFromConf, jsonLayer.Name)) {
                        continue;
                }
                layers.push(_createLayer.call(this, layerDescription, jsonLayers, jsonLayer));
            }
            return layers;
        }

        WMSServer.prototype.createLayers = function (callback, fallback) {
            this.getMetadata(function (layerDescription, metadata) {
                var layersFromConf = layerDescription.hasOwnProperty('layers') ? layerDescription.layers.trim().split(/\s*,\s*/) : [];
                var jsonLayers = metadata.Capability.Layer;
                var layers = _createLayers(layerDescription, layersFromConf, jsonLayers);
                callback(layers);
            }, fallback);
        };


        WMSServer.getCapabilitiesFromBaseURl = function (baseUrl, options) {
            var getCapabilitiesUrl = baseUrl;
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WMS");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "version", options.hasOwnProperty('version') ? options.version : '1.3.0');
            return getCapabilitiesUrl;
        };

        return WMSServer;

    });