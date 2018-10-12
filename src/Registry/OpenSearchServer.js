define([
    "jquery",
    "underscore-min",
    "../Utils/Utils",
    "xmltojson",
    "../Layer/LayerFactory",
    "../Layer/OpenSearch/OpenSearchUtils",
    "../Layer/OpenSearch/OpenSearchForm"
], function($, _, Utils, XmlToJson, LayerFactory, OpenSearchUtils, OpenSearchForm) {

    /**
     * @class
     * Creates an instance of WMS server
     * A WMS server exposes a set of {@link OpenSearchLayer open search} layers.
     * @param {Options} options Options
     * @param {string} [options.baseUrl] Base URL of the getCapabilities
     * @param {string} [options.getCapabilities] GetCapabilities
     * @memberof module:Registry
     * @constructor
     */
    var OpenSearchServer = function(options) {
        if (options.baseUrl && options.baseUrl.indexOf("describe.xml")!== -1) {
            options.getCapabilities = options.baseUrl;
            options.baseUrl = undefined;
        }

        if(options.getCapabilities && options.getCapabilities.indexOf("describe.xml") === -1) {
            options.baseUrl = options.getCapabilities;
            options.getCapabilities = undefined;
        }

        if (options.getCapabilities) {
            options.baseUrl = options.getCapabilities.replace("/describe.xml","");
        } else if (options.baseUrl) {
            options.getCapabilities = OpenSearchServer.getCapabilitiesFromBaseURl(options.baseUrl);
        } else {
            throw new ReferenceError(
                "No URL to access to the server is defined",
                "OpenSearchServer.js"
            );
        }
        this.options = options;
    };

    /**
     * Create layer
     * @param {*} layerDescription
     * @param {*} jsonLayer
     * @function _createLayer
     * @memberof OpenSearchServer#
     * @private
     */
    function _createLayer(layerDescription, openSearchRoot) {
        var layerDesc = Object.assign({}, layerDescription, {});
        layerDesc.name = layerDescription.name || OpenSearchUtils.getValue(openSearchRoot, "ShortName");
        layerDesc.description = layerDescription.description || OpenSearchUtils.getValue(openSearchRoot, "Description");
        layerDesc.attribution = layerDescription.attribution || OpenSearchUtils.getValue(openSearchRoot, "Attribution");

        layerDesc.properties = {};
        layerDesc.properties.longName = OpenSearchUtils.getValue(openSearchRoot, "LongName");
        layerDesc.properties.syndicationRight = OpenSearchUtils.getValue(openSearchRoot, "SyndicationRight");
        layerDesc.properties.developper = OpenSearchUtils.getValue(openSearchRoot, "Developper");

        var urls = openSearchRoot.Url;
        layerDesc.services = {};
        layerDesc.services.queryForm = new OpenSearchForm(urls, "application/json");
        OpenSearchUtils.initNavigationValues(
            layerDesc.services.queryForm
        );

        return LayerFactory.create(layerDesc);
    }    

    /**
     * Create WMS layers from WMS capabilities
     * @param {serverLayerCallback} callback
     * @param {serverLayerFallback} fallback
     * @function createLayers
     * @memberof OpenSearchServer#
     */

    OpenSearchServer.prototype.createLayers = function(callback, fallback) {
        this.getMetadata(function(layerDescription, metadata) {
            var layers = [];
            var jsonLayer = metadata.OpenSearchDescription;
            var layer = _createLayer(
                layerDescription,
                jsonLayer
            );
            layers.push(layer);
            callback(layers);
        }, fallback);
    };    

    OpenSearchServer.prototype.getMetadata = function(callback, fallback) {
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
     * Returns the capabilities
     * @param {string} baseUrl GetCapabilities URL
     * @function getCapabilitiesFromBaseURL
     * @memberof OpenSearchServer#
     * @returns {string} describeCoverage URL
     */
    OpenSearchServer.getCapabilitiesFromBaseURl = function(baseUrl) {
        var getCapabilitiesUrl = baseUrl;
        var idxSlash = getCapabilitiesUrl.lastIndexOf("/");
        if (idxSlash != getCapabilitiesUrl.length-1) {
            getCapabilitiesUrl = getCapabilitiesUrl + "/";
        }
        getCapabilitiesUrl = getCapabilitiesUrl + "describe.xml";
        return getCapabilitiesUrl;
    };

    return OpenSearchServer;
});