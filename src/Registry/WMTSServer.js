define(["underscore-min", "../Utils/Utils", "xmltojson", "./WMTSMetadata", "../Layer/LayerFactory"],
    function (_, Utils, XmlToJson, WMTSMetadata, LayerFactory) {

        var WMTSServer = function (proxyUse, proxyUrl, options) {
            if (options.getCapabilities) {
                options.baseUrl = Utils.computeBaseUrlFromCapabilities(options.getCapabilities, ["service", "request", "version"]);
            } else if (options.baseUrl) {
                options.getCapabilities = WMTSServer.getCapabilitiesFromBaseURl(options.baseUrl, options);
            } else {
                throw new ReferenceError('No URL to access to the server is defined', 'WMSLayer.js');
            }
            this.proxyUse = proxyUse;
            this.proxyUrl = proxyUrl;
            this.options = options;
        };

        function _mustBeSkipped(layersFromConf, currentLayer) {
            return (layersFromConf.length !== 0 && !_.contains(layersFromConf, currentLayer.identifier)) || !_.contains(currentLayer.tileMatrixSetLink, "WGS84");
        }

        WMTSServer.prototype.getMetadata = function (callback, fallback) {
            var self = this;
            Utils.requestUrl(Utils.proxify(this.options.getCapabilities, {"use" : this.proxyUse, "url" : this.proxyUrl}), 'text', {},
                function (response) {
                    var myOptions = {
                        mergeCDATA: true,
                        xmlns: false,
                        attrsAsObject: false,
                        childrenAsArray: false
                    };
                    var result = XmlToJson.parseString(response, myOptions);
                    var metadata = new WMTSMetadata(result);
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


        WMTSServer.prototype.createLayers = function (callback, fallback) {
            this.getMetadata(function (layerDescription, metadata) {
                var layersFromConf = layerDescription.hasOwnProperty('layers') ? layerDescription.layers.trim().split(/\s*,\s*/) : [];
                var jsonLayers = metadata.contents;
                var layers = [];
                for (var i = 0; i < jsonLayers.layers.length; i++) {
                    var jsonLayer = jsonLayers.layers[i];
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
                    layerDesc.name = layerDescription.name || jsonLayer.identifier;
                    layerDesc.format = layerDescription.format || "image/png";
                    layerDesc.layers =  jsonLayer.title;
                    layerDesc.description = layerDescription.description || (jsonLayer.abstract != null) ? jsonLayer.abstract : jsonLayers.abstract;
                    layerDesc.attribution = attribution;
                    layerDesc.copyrightUrl = copyrightURL;

                    var layer = LayerFactory.create(layerDesc);
                    layers.push(layer);
                }
                callback(layers);
            }, fallback);
        };


        WMTSServer.getCapabilitiesFromBaseURl = function (baseUrl, options) {
            var getCapabilitiesUrl = baseUrl;
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WMTS");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "version", options.hasOwnProperty('version') ? options.version : '1.0.0');
            return getCapabilitiesUrl;
        };

        return WMTSServer;

    });