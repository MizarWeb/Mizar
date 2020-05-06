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
// import $ from "jquery";
import _ from "underscore";
import Utils from "../Utils/Utils";
import LayerFactory from "../Layer/LayerFactory";
import WMSCapabilities from "wms-capabilities";
/**
 * @class
 * Creates an instance of WMS server
 * A WMS server exposes a set of {@link WMSLayer WMS} layers.
 * @param {Options} options Options
 * @param {string} [options.baseUrl] Base URL of the getCapabilities
 * @param {string} [options.getCapabilities] GetCapabilities
 * @memberof module:Registry
 * @constructor
 */
var WMSServer = function (options) {
  if (options.getCapabilities) {
    options.baseUrl = Utils.computeBaseUrlFromCapabilities(options.getCapabilities, ["service", "request", "version"]);
  } else if (options.baseUrl) {
    options.getCapabilities = WMSServer.getCapabilitiesFromBaseURl(options.baseUrl, options);
  } else {
    throw new ReferenceError("WMSLayer.js: No URL to access to the server is defined");
  }
  this.options = options;
};

/**
 * Skip when the current layer is not included in the list of defined layers (layersFromConf)
 * @param {string[]} layersFromConf List of user-defined layer
 * @param {string} currentLayer
 * @returns {boolean} true wen the currentLayer is not included in the list of user-defined layers otherwise false
 * @function _mustBeSkipped
 * @memberof WMSServer#
 * @private
 */

function _mustBeSkipped(layersFromConf, currentLayerName) {
  return layersFromConf.length !== 0 && !_.contains(layersFromConf, currentLayerName);
}

/**
 * Capabilities has a group ?
 * @param {string} jsonLayer layer
 * @returns  {boolean} true when layers are grouped otherwise false
 * @function _hasGroup
 * @memberof WMSServer#
 * @private
 */
function _hasGroup(jsonLayer) {
  return Array.isArray(jsonLayer.Layer);
}

/**
 * Computes attribution from capabilities
 * @param {string} layerDescription User-defined layer description
 * @param {string} jsonLayers Metadata on the layers
 * @param {string} jsonLayer layer description from capabilities
 * @function _computeAttribution
 * @memberof WMSServer#
 * @private
 */
function _computeAttribution(layerDescription, jsonLayers, jsonLayer) {
  let attribution, logo, title;
  if (layerDescription.attribution) {
    attribution = layerDescription.attribution;
  } else if (jsonLayer.Attribution != null) {
    logo =
      jsonLayer.Attribution.LogoURL != null
        ? "<img src='" + jsonLayer.Attribution.LogoURL.OnlineResource + "' height='25px'/> "
        : "";
    title = jsonLayer.Attribution.Title != null ? jsonLayer.Attribution.Title : "";
    attribution = logo + title;
  } else if (jsonLayers.Attribution != null) {
    logo =
      jsonLayers.Attribution.LogoURL != null
        ? "<img src='" + jsonLayers.Attribution.LogoURL.OnlineResource + "' height='25px'/> "
        : "";
    title = jsonLayers.Attribution.Title != null ? jsonLayers.Attribution.Title : "";
    attribution = logo + title;
  } else {
    attribution = null;
  }
  return attribution;
}

/**
 * Computes copyright
 * @param {string} layerDescription User-defined layer description
 * @param {string} jsonLayers Metadata on the layers
 * @param {string} jsonLayer layer description from capabilities
 * @function _computeCopyrightURL
 * @memberof WMSServer#
 * @private
 */
function _computeCopyrightURL(layerDescription, jsonLayers, jsonLayer) {
  let copyrightURL;
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

/**
 * Computes the bbox center.
 * if bbox is null then center is defined as [0,0, 100000]
 * @param {bbox_type|null} bbox
 * @returns {center_type} the central position of the camera and the distance from which the bbox is embedded
 * @function _computeCenterBbox
 * @memberof WMSServer#
 * @private
 */
function _computeCenterBbox(bbox) {
  const centerLong = 0.5 * (bbox[0] + bbox[2]);
  const centerLat = 0.5 * (bbox[1] + bbox[3]);
  return [centerLong, centerLat];
}

/**
 * Converts a bbox string to an array of float.
 * @param {string[]} jsonBbox. bbox as string. First element is the lower left corner. 2nd element is the upper right corner
 * @returns {bbox_type} bbox as an array
 * @function _bbox
 * @memberof WMSServer#
 * @private
 */

function _bbox(jsonLayer) {
  const bbox = jsonLayer.EX_GeographicBoundingBox;
  let result;
  if (bbox == null) {
    result = [-180, -90, 180, 90];
  } else {
    const long1 = bbox[0] > 180 ? bbox[0] - 360 : bbox[0];
    const long2 = bbox[2] > 180 ? bbox[2] - 360 : bbox[2];
    result = [long1, bbox[1], long2, bbox[3]];
  }
  return result;
}

/**
 * Boox for grouped layer
 * @param {string} jsonLayer layer from capabilities
 * @returns  {bbox_type} bbox as an array
 * @function _bboxGroup
 * @memberof WMSServer#
 * @private
 */
function _bboxGroup(jsonLayer) {
  let result;
  if (_hasGroup.call(this, jsonLayer)) {
    let layer, layerBbox;
    let minLong = 180,
      maxLong = -180,
      minLat = 90,
      maxLat = -90;
    for (let i = 0; i < jsonLayer.Layer.length; i++) {
      layer = jsonLayer.Layer[i];
      layerBbox = _bbox.call(this, layer);
      minLong = Math.min(minLong, layerBbox[0]);
      minLat = Math.min(minLat, layerBbox[1]);
      maxLong = Math.max(maxLong, layerBbox[2]);
      maxLat = Math.max(maxLat, layerBbox[3]);
    }
    result = [minLong, minLat, maxLong, maxLat];
  } else {
    result = _bbox.call(this, jsonLayer);
  }
  return result;
}

/**
 * Returns the metadata
 * @param {metadata~requestCallback} callback
 * @param {serverLayerFallback} fallback
 * @function getMetadata
 * @memberof WMSServer#
 */

WMSServer.prototype.getMetadata = function (callback, fallback) {
  const self = this;
  Utils.requestUrl(
    this.options.getCapabilities,
    "text",
    "application/xml",
    {},
    function (response) {
      const metadata = new WMSCapabilities().parse(response);
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

/**
 * The dimension.
 * @typedef {Object} dimension_type
 * @property {string} units - Units of the dimension.
 * @property {string} unitSymbol - Unit symbol.
 * @property {string} default - default value.
 * @property {string} multipleValues - multiples values.
 * @property {string} nearestValue - nearest vlaue.
 * @property {string} value - value.
 */

/**
 * Parses the dimension from capabilities
 * @param {Array.<dimension_type>} dimension
 * @returns {{}} a hash of name => dimension
 * @function _parseDimension
 * @memberof WMSServer#
 * @private
 */
function _parseDimension(dimension) {
  if (dimension == null) {
    return null;
  }
  const dim = {};
  for (let i = 0; i < dimension.length; i++) {
    const currentDim = dimension[i];
    const myDim = {
      units: currentDim.units,
      unitSymbol: currentDim.unitSymbol,
      default: currentDim.default,
      multipleValues: currentDim.multipleValues,
      nearestValue: currentDim.nearestValue,
      value: currentDim.values
    };
    dim[currentDim.name] = myDim;
  }
  return dim;
}

/**
 * Create a layer
 * @param {*} layerDescription
 * @param {*} jsonLayers
 * @param {*} jsonLayer
 * @returns {Layer} the layer
 * @function _createLayer
 * @memberof WMSServer#
 * @private
 */
function _createLayer(layerDescription, jsonLayers, jsonLayer) {
  const attribution = [];
  if (_hasGroup.call(this, jsonLayer)) {
    for (let i = 0; i < jsonLayer.Layer.length; i++) {
      const layer = jsonLayer.Layer[i];
      attribution.push(_computeAttribution.call(this, layerDescription, jsonLayers, layer));
    }
  } else {
    attribution.push(_computeAttribution.call(this, layerDescription, jsonLayers, jsonLayer));
  }
  const copyrightURL = _computeCopyrightURL.call(this, layerDescription, jsonLayers, jsonLayer);
  const bbox = _bboxGroup.call(this, jsonLayer);
  const center = _computeCenterBbox.call(this, bbox);
  const layerDesc = Object.assign({}, layerDescription, {});

  layerDesc.name = layerDescription.name || jsonLayer.Title;
  layerDesc.format = layerDescription.format || "image/png";
  layerDesc.layers = jsonLayer.Name;
  layerDesc.description =
    layerDescription.description || jsonLayer.Abstract != null ? jsonLayer.Abstract : jsonLayers.Abstract;
  layerDesc.attribution = attribution.join("<br/>");
  layerDesc.copyrightUrl = copyrightURL;
  layerDesc.autoFillTimeTravel = layerDescription.autoFillTimeTravel;
  layerDesc.properties = {
    initialRa: center[0],
    initialDec: center[1],
    bbox: bbox
  };
  layerDesc.dimension = _parseDimension.call(this, jsonLayer.Dimension);
  layerDesc.metadataAPI = jsonLayer;

  return LayerFactory.create(layerDesc);
}

/**
 * Create layers
 * @param {*} layerDescription
 * @param {*} layersFromConf
 * @param {*} jsonLayers
 * @function _createLayers
 * @memberof WMSServer#
 * @private
 */
function _createLayers(layerDescription, layersFromConf, jsonLayers) {
  let layers = [];
  for (let i = 0; i < jsonLayers.Layer.length; i++) {
    const jsonLayer = jsonLayers.Layer[i];
    if (jsonLayer.Layer != null) {
      layers = layers.concat(_createLayers(layerDescription, layersFromConf, jsonLayer));
    }
    if (_mustBeSkipped.call(this, layersFromConf, jsonLayer.Name)) {
      continue;
    }
    layers.push(_createLayer.call(this, layerDescription, jsonLayers, jsonLayer));
  }
  return layers;
}

/**
 * Create WMS layers from WMS capabilities
 * @param {serverLayerCallback} callback
 * @param {serverLayerFallback} fallback
 * @function createLayers
 * @memberof WMSServer#
 */

WMSServer.prototype.createLayers = function (callback, fallback) {
  this.getMetadata(function (layerDescription, metadata) {
    const layersFromConf = layerDescription.hasOwnProperty("layers")
      ? layerDescription.layers.trim().split(/\s*,\s*/)
      : [];
    const jsonLayers = metadata.Capability.Layer;
    const layers = _createLayers(layerDescription, layersFromConf, jsonLayers);
    callback(layers);
  }, fallback);
};

WMSServer.getXmlFeatureToJson = function (xmlString) {
  const featureResponse = xmlString.trim();
  const responseFeature = Utils.xml2json(featureResponse, "");
  const result = {};
  for (const elt in responseFeature) {
    if (elt.includes("_layer")) {
      const layer = responseFeature[elt];
      const name = layer["gml:name"];
      const layerName = elt.replace("_layer", "");
      const featureInLayerName = elt.replace("_layer", "_feature");
      const featureInLayer = layer[featureInLayerName];
      delete featureInLayer["gml:boundedBy"];
      featureInLayer.description = name;
      result[layerName] = featureInLayer;
    }
  }
  const feature = {
    properties: {}
  };
  feature.properties = result;
  feature.properties.title = "Layer Information";
  return feature;
};

WMSServer.getFeatureInfo = function (baseUrl, bbox, layers, options) {
  options = options || {};
  let url = baseUrl;
  url = Utils.addParameterTo(url, "service", "wms");
  url = Utils.addParameterTo(url, "version", "1.3.0");
  url = Utils.addParameterTo(url, "request", "GetFeatureInfo");

  if (options.styles) {
    url = Utils.addParameterTo(url, "styles", options.styles);
  } else {
    url = Utils.addParameterTo(url, "styles", "");
  }

  if (options.styles) {
    url = Utils.addParameterTo(url, "crs", options.crs);
  } else {
    url = Utils.addParameterTo(url, "crs", "CRS:84");
  }

  url = Utils.addParameterTo(url, "layers", layers.join());

  if (options.query_layers) {
    url = Utils.addParameterTo(url, "query_layers", options.query_layers.join());
  } else {
    url = Utils.addParameterTo(url, "query_layers", layers.join());
  }

  if (options.time) {
    url = Utils.addParameterTo(url, "time", options.time);
  }

  if (options.width) {
    url = Utils.addParameterTo(url, "width", options.width);
  } else {
    url = Utils.addParameterTo(url, "width", 3);
  }

  if (options.height) {
    url = Utils.addParameterTo(url, "height", options.height);
  } else {
    url = Utils.addParameterTo(url, "height", 3);
  }

  if (options.x) {
    url = Utils.addParameterTo(url, "x", options.x);
  } else {
    url = Utils.addParameterTo(url, "x", 1);
  }

  if (options.y) {
    url = Utils.addParameterTo(url, "y", options.y);
  } else {
    url = Utils.addParameterTo(url, "y", 1);
  }

  if (options.format) {
    url = Utils.addParameterTo(url, "info_format", options.format);
  } else {
    url = Utils.addParameterTo(url, "info_format", "application/vnd.ogc.gml");
  }

  url = Utils.addParameterTo(url, "bbox", bbox[0] + "," + bbox[1] + "," + bbox[2] + "," + bbox[3]);

  return url;
};

/**
 * Returns the capabilities
 * @param {string} baseUrl GetCapabilities URL
 * @param {Object} options
 * @param {string} [options.version = 1.0.0] WCS version
 * @function getCapabilitiesFromBaseURL
 * @memberof WMSServer#
 * @returns {string} describeCoverage URL
 */
WMSServer.getCapabilitiesFromBaseURl = function (baseUrl, options) {
  let getCapabilitiesUrl = baseUrl;
  getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WMS");
  getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
  getCapabilitiesUrl = Utils.addParameterTo(
    getCapabilitiesUrl,
    "version",
    options.hasOwnProperty("version") ? options.version : "1.3.0"
  );
  return getCapabilitiesUrl;
};

export default WMSServer;
