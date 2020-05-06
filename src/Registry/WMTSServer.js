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
import _ from "underscore";
import Utils from "../Utils/Utils";
import XmlToJson from "xmltojson";
import WMTSMetadata from "./WMTSMetadata";
import LayerFactory from "../Layer/LayerFactory";
/**
 * @class
 * Creates an instance of WMTS server
 * A WMTS server exposes a set of {@link WMTSLayer WMTS} layers.
 * @param {Options} options Options
 * @param {string} [options.baseUrl] Base URL of the getCapabilities
 * @param {string} [options.getCapabilities] GetCapabilities
 * @memberof module:Registry
 */
var WMTSServer = function (options) {
  if (options.getCapabilities) {
    options.baseUrl = Utils.computeBaseUrlFromCapabilities(options.getCapabilities, ["service", "request", "version"]);
  } else if (options.baseUrl) {
    options.getCapabilities = WMTSServer.getCapabilitiesFromBaseURl(options.baseUrl, options);
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
 * @memberof WMTSServer#
 * @private
 */

function _mustBeSkipped(layersFromConf, currentLayer) {
  return (
    (layersFromConf.length !== 0 && !_.contains(layersFromConf, currentLayer.identifier)) ||
    !_.contains(currentLayer.tileMatrixSetLink, "WGS84")
  );
}

/**
 * Returns the metadata
 * @param {metadata~requestCallback} callback
 * @param {serverLayerFallback} fallback
 * @function getMetadata
 * @memberof WMTSServer#
 */

WMTSServer.prototype.getMetadata = function (callback, fallback) {
  const self = this;
  Utils.requestUrl(
    this.options.getCapabilities,
    "text",
    "application/xml",
    {},
    function (response) {
      const myOptions = {
        mergeCDATA: true,
        xmlns: false,
        attrsAsObject: false,
        childrenAsArray: false
      };
      const result = XmlToJson.parseString(response, myOptions);
      const metadata = new WMTSMetadata(result);
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
 * Create WMS layers from WMS capabilities
 * @param {serverLayerCallback} callback
 * @param {serverLayerFallback} fallback
 * @function createLayers
 * @memberof WMTSServer#
 */

WMTSServer.prototype.createLayers = function (callback, fallback) {
  this.getMetadata(function (layerDescription, metadata) {
    const layersFromConf = layerDescription.hasOwnProperty("layers")
      ? layerDescription.layers.trim().split(/\s*,\s*/)
      : [];
    const jsonLayers = metadata.contents;
    const layers = [];
    for (let i = 0; i < jsonLayers.layers.length; i++) {
      const jsonLayer = jsonLayers.layers[i];
      if (_mustBeSkipped.call(this, layersFromConf, jsonLayer)) {
        continue;
      }
      var attribution;
      if (layerDescription.attribution) {
        attribution = layerDescription.attribution;
      } else {
        attribution = null;
      }

      const copyrightURL = null;

      const layerDesc = Object.assign({}, layerDescription, {});
      layerDesc.name = layerDescription.name || jsonLayer.identifier;
      layerDesc.format = layerDescription.format || "image/png";
      layerDesc.layers = jsonLayer.title;
      layerDesc.description =
        layerDescription.description || jsonLayer.abstract != null ? jsonLayer.abstract : jsonLayers.abstract;
      layerDesc.attribution = attribution;
      layerDesc.copyrightUrl = copyrightURL;

      const layer = LayerFactory.create(layerDesc);
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
 * @memberof WMTServer#
 * @returns {string} describeCoverage URL
 */

WMTSServer.getCapabilitiesFromBaseURl = function (baseUrl, options) {
  let getCapabilitiesUrl = baseUrl;
  getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WMTS");
  getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
  getCapabilitiesUrl = Utils.addParameterTo(
    getCapabilitiesUrl,
    "version",
    options.hasOwnProperty("version") ? options.version : "1.0.0"
  );
  return getCapabilitiesUrl;
};

export default WMTSServer;
