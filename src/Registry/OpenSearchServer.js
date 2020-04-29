import Utils from "../Utils/Utils";
import XmlToJson from "xmltojson";
import LayerFactory from "../Layer/LayerFactory";
import OpenSearchUtils from "../Layer/OpenSearch/OpenSearchUtils";
import OpenSearchForm from "../Layer/OpenSearch/OpenSearchForm";

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
var OpenSearchServer = function (options) {
  // when url contains .xml, it means that the XML descriptor is there
  if (options.baseUrl && options.baseUrl.indexOf(".xml") !== -1) {
    options.getCapabilities = options.baseUrl;
  }

  if (!options.getCapabilities) {
    throw new ReferenceError("No URL to access to the server is defined", "OpenSearchServer.js");
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
  OpenSearchUtils.initNavigationValues(layerDesc.services.queryForm);

  return LayerFactory.create(layerDesc);
}

/**
 * Create WMS layers from WMS capabilities
 * @param {serverLayerCallback} callback
 * @param {serverLayerFallback} fallback
 * @function createLayers
 * @memberof OpenSearchServer#
 */

OpenSearchServer.prototype.createLayers = function (callback, fallback) {
  this.getMetadata(function (layerDescription, metadata) {
    var layers = [];
    var jsonLayer = metadata.OpenSearchDescription;
    var layer = _createLayer(layerDescription, jsonLayer);
    layers.push(layer);
    callback(layers);
  }, fallback);
};

OpenSearchServer.prototype.getMetadata = function (callback, fallback) {
  var self = this;
  Utils.requestUrl(
    this.options.getCapabilities,
    "text",
    "application/xml",
    {},
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

export default OpenSearchServer;
