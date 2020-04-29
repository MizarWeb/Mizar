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
import AbstractRegistryHandler from "./AbstractRegistryHandler";
import Constants from "../Utils/Constants";
import WCSServer from "./WCSServer";
import ErrorDialog from "../Gui/dialog/ErrorDialog";
/**
 * @class
 * Creates a WCS Server Handler
 * @param {*} layers
 * @param {*} pendingLayers
 * @augments AbstractRegistryHandler
 * @memberof module:Registry
 * @constructor
 */
var WCSServerRegistryHandler = function (layers, pendingLayers) {
  AbstractRegistryHandler.prototype.constructor.call();
  this.layers = layers;
  this.pendingLayers = pendingLayers;
};

/**************************************************************************************************************/

Utils.inherits(AbstractRegistryHandler, WCSServerRegistryHandler);

/**************************************************************************************************************/

/**
 * Destroys the TileWireFrame if it exists and returns its layer description.
 * @param layers list of layers to load
 * @function _destroyTileWireFrame
 * @memberof WCSServerRegistryHandler#
 * @private
 */
function _destroyTileWireFrame(layers) {
  var i, layerDescription;
  var isFound = false;
  for (i = 0; i < layers.length; i++) {
    var layer = layers[i];
    if (layer.getType() === Constants.LAYER.TileWireframe) {
      isFound = true;
      break;
    }
  }
  if (isFound) {
    var layerToRemove = layers[i];
    layerDescription = layerToRemove.options;
    layerToRemove._detach();
    layers.splice(i, 1);
  }
  return layerDescription;
}

/**
 * Moves the TileWireFrameLayer to render at this end.
 * @param layers layers to render
 * @param AbstractRegistryHandler Registry
 * @param callback callback
 * @param fallback fallback
 * @function _moveTileWireFrameLayer
 * @memberof WCSServerRegistryHandler#
 * @private
 */
function _moveTileWireFrameLayer(layers, AbstractRegistryHandler, callback, fallback) {
  var layerDescription = _destroyTileWireFrame(layers);
  if (layerDescription) {
    AbstractRegistryHandler.next.handleRequest(layerDescription, callback, fallback);
  }
}

/**
 * @function handleRequest
 * @memberof WCSServerRegistryHandler#
 */

WCSServerRegistryHandler.prototype.handleRequest = function (layerDescription, callback, fallback) {
  try {
    if (layerDescription.type === Constants.LAYER.WCSElevation) {
      var wcsServer = new WCSServer(layerDescription);
      var self = this;
      wcsServer.createLayers(function (layers) {
        //TODO : I loose the callback of pendingLayers
        self._handlePendingLayers(self.pendingLayers, layers);
        callback(layers);
        _moveTileWireFrameLayer(self.layers, self, callback, fallback);
      }, fallback);
    } else {
      this.next.handleRequest(layerDescription, callback, fallback);
    }
  } catch (e) {
    if (fallback) {
      fallback(e);
    } else {
      ErrorDialog.open(Constants.LEVEL.DEBUG, e);
    }
  }
};

export default WCSServerRegistryHandler;
