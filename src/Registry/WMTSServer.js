define(["../Utils/Utils", "xmltojson", "../Layer/WMTSMetadata", "../Layer/LayerFactory"],
    function (Utils, XmlToJson, WMTSMetadata, LayerFactory) {

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
                function (request, status, error, options) {
                    console.error("Unknow server " + options.baseUrl);
                    if (fallback) {
                        fallback(request, status, error, options);
                    }
                }
            );
        };

        WMTSServer.prototype.createLayers = function (callback, fallback) {
            this.getMetadata(function (layerDescription, metadata) {
                var jsonLayers = metadata.getCapability().getLayer();
                var layers = [];
                for (var i = 0; i < jsonLayers.getLayer().length; i++) {
                    var jsonLayer = jsonLayers.getLayer()[i];
                    var attribution;
                    if (layerDescription.attribution) {
                        attribution = layerDescription.attribution;
                    } else if (Object.keys(jsonLayer.getAttribution()).length !== 0) {
                        var logo = jsonLayer.getAttribution()['Logo'] !== null ? "<img src='" + jsonLayer.getAttribution()['Logo'] + "' height='25px'/> " : "";
                        var title = jsonLayer.getAttribution()['Title'] !== null ? jsonLayer.getAttribution()['Title'] : "";
                        attribution = logo + title;
                    } else if (Object.keys(jsonLayers.getAttribution()).length !== 0) {
                        var logo = jsonLayers.getAttribution()['Logo'] !== null ? "<img src='" + jsonLayers.getAttribution()['Logo'] + "' height='25px'/> " : "";
                        var title = jsonLayers.getAttribution()['Title'] !== null ? jsonLayers.getAttribution()['Title'] : "";
                        attribution = logo + title;
                    } else {
                        attribution = null;
                    }

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
                    var layerDesc = Object.assign({}, layerDescription, {});
                    layerDesc.name = layerDescription.name || jsonLayer.getTitle();
                    layerDesc.format = layerDescription.format || "image/png";
                    layerDesc.layers = layerDescription.layers || jsonLayer.getName();
                    layerDesc.description = layerDescription.description || (jsonLayer.getAbstract() != null) ? jsonLayer.getAbstract() : jsonLayers.getAbstract();
                    layerDesc.attribution = attribution;
                    layerDesc.copyrightUrl = copyrightURL;

                    var layer = LayerFactory.create(layerDesc);
                    layers.push(layer);
                }
                callback(layers);
            }, fallback)
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