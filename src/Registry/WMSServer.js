define(["underscore-min", "../Utils/Utils", "xmltojson", "./WMSMetadata", "../Layer/LayerFactory"],
    function (_, Utils, XmlToJson, WMSMetadata, LayerFactory) {

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


        function _computeAttribution(layerDescription, jsonLayers, jsonLayer) {
            var attribution;
            if (layerDescription.attribution) {
                attribution = layerDescription.attribution;
            } else if (Object.keys(jsonLayer.getAttribution()).length !== 0) {
                var logo = jsonLayer.getAttribution()['Logo'] != null ? "<img src='" + jsonLayer.getAttribution()['Logo'] + "' height='25px'/> " : "";
                var title = jsonLayer.getAttribution()['Title'] != null ? jsonLayer.getAttribution()['Title'] : "";
                attribution = logo + title;
            } else if (Object.keys(jsonLayers.getAttribution()).length !== 0) {
                var logo = jsonLayers.getAttribution()['Logo'] != null ? "<img src='" + jsonLayers.getAttribution()['Logo'] + "' height='25px'/> " : "";
                var title = jsonLayers.getAttribution()['Title'] != null ? jsonLayers.getAttribution()['Title'] : "";
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
            } else if (Object.keys(jsonLayer.getAttribution()).length !== 0) {
                copyrightURL = jsonLayer.getAttribution()['OnlineResource'] !== null ? jsonLayer.getAttribution()['OnlineResource'] : "";
            } else if (Object.keys(jsonLayers.getAttribution()).length !== 0) {
                copyrightURL = jsonLayers.getAttribution()['OnlineResource'] !== null ? jsonLayers.getAttribution()['OnlineResource'] : "";
            } else {
                copyrightURL = "";
            }
            return copyrightURL;
        }

        function _computeCenterBbox(jsonLayer) {
            var bbox = jsonLayer.getGeoBbox();
            var center;
            if(bbox == null) {
                center = [0,0];
            } else {
                var centerLong = 0.5 * (bbox[0]+bbox[1]);
                var centerLat = 0.5 * (bbox[2]+bbox[3]);
                var deltaLong = bbox[1]-bbox[0];
                if(deltaLong > 180) {
                    deltaLong = 180;
                }
                var deltaLat = bbox[3]-bbox[2];
                var delta = (deltaLong > deltaLat) ? deltaLat : deltaLong;
                var distance = Math.abs(delta) * 3000000 / 180;
                center = [centerLong, centerLat, distance];
            }
            return center;
        }

        function _bbox(jsonLayer) {
            var bbox = jsonLayer.getGeoBbox();
            var result;
            if(bbox == null) {
                result = [-180, 180, -90, 90];
            } else {
                result = bbox;
            }
            return result;
        }


        WMSServer.prototype.getMetadata = function (callback, fallback) {
            var self = this;
            Utils.requestUrl(Utils.proxify(this.options.getCapabilities, {"use" : this.proxyUse, "url" : this.proxyUrl} ), 'text', {},
                function (response) {
                    var myOptions = {
                        mergeCDATA: true,
                        xmlns: false,
                        attrsAsObject: false,
                        childrenAsArray: false
                    };
                    var result = XmlToJson.parseString(response, myOptions);
                    var metadata = new WMSMetadata(result);
                    callback(self.options, metadata);
                },
                function (request, status, error, options) {
                    console.error("Unknow server " + options.baseUrl);
                    if (fallback) {
                        fallback(request, status, error, options);
                    }
                }
            );
        };

        WMSServer.prototype.createLayers = function (callback, fallback) {
            this.getMetadata(function (layerDescription, metadata) {
                var layersFromConf = layerDescription.hasOwnProperty('layers') ? layerDescription.layers.split(',') : [];
                var jsonLayers = metadata.getCapability().getLayer();
                var layers = [];
                for (var i = 0; i < jsonLayers.getLayer().length; i++) {
                    var jsonLayer = jsonLayers.getLayer()[i];
                    if (_mustBeSkipped.call(this, layersFromConf, jsonLayer.name)) {
                        continue;
                    }

                    var attribution = _computeAttribution.call(this, layerDescription, jsonLayers, jsonLayer);
                    var copyrightURL = _computeCopyrightURL.call(this, layerDescription, jsonLayers, jsonLayer);
                    var center = _computeCenterBbox.call(this, jsonLayer);
                    var layerDesc = Object.assign({}, layerDescription, {});
                    layerDesc.name = layerDescription.name || jsonLayer.getTitle();
                    layerDesc.format = layerDescription.format || "image/png";
                    layerDesc.layers = layerDescription.layers || jsonLayer.getName();
                    layerDesc.description = layerDescription.description || (jsonLayer.getAbstract() != null) ? jsonLayer.getAbstract() : jsonLayers.getAbstract();
                    layerDesc.attribution = attribution;
                    layerDesc.copyrightUrl = copyrightURL;
                    layerDesc.properties = {
                        "initialRa":center[0],
                        "initialDec":center[1],
                        "initialFov":center[2],
                        "bbox":_bbox.call(this, jsonLayer)
                    };

                    var layer = LayerFactory.create(layerDesc);
                    layers.push(layer);
                }
                callback(layers);
            }, fallback)
        };


        WMSServer.getCapabilitiesFromBaseURl = function (baseUrl, options) {
            var getCapabilitiesUrl = baseUrl;
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WMS");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "version", options.hasOwnProperty('version') ? options.version : '1.1.1');
            return getCapabilitiesUrl;
        };

        return WMSServer;

    });