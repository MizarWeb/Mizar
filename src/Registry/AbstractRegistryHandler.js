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
import LayerFactory from "../Layer/LayerFactory";
import Constants from "../Utils/Constants";
import ErrorDialog from "../Gui/dialog/ErrorDialog";
/**
 * @name AbstractRegistryHandler
 * @class
 *  Abstract Registry Handler
 * @param {object} options
 * @implements {RegistryHandler}
 */

var AbstractRegistryHandler = function () {
  this.next = {
    handleRequest: function (layerDescription, callback, fallback) {
      ErrorDialog.open(Constants.LEVEL.DEBUG, "AbstractRegistryHandler.js", "All strategies exhausted.");
    }
  };
};

/**
 * @function setNext
 * @memberof AbstractRegistryHandler#
 */
AbstractRegistryHandler.prototype.setNext = function (next) {
  this.next = next;
  return next;
};

/**
 * @function handleRequest
 * @memberof AbstractRegistryHandler#
 */

AbstractRegistryHandler.prototype.handleRequest = function (layerDescription, callback, fallback) {};

/**
 * Handles pending layers.
 * @function _handlePendingLayers
 * @memberof AbstractRegistryHandler#
 * @param {Layer[]} pendingLayers Pending layers
 * @param {Layer[]} List pf layers
 */

AbstractRegistryHandler.prototype._handlePendingLayers = function (pendingLayers, layers) {
  //TODO : I loose the callback of pendingLayers
  for (var i = 0; i < layers.length && pendingLayers.length !== 0; i++) {
    var layer = layers[i];
    if (pendingLayers.length != 0 && layer.isBackground()) {
      var j = pendingLayers.length;
      while (j > 0) {
        j--;
        var pendingLayerDescription = pendingLayers[j];
        try {
          layers.push(LayerFactory.create(pendingLayerDescription));
          pendingLayers.splice(j, 1);
        } catch (RangeError) {
          ErrorDialog.open(Constants.LEVEL.DEBUG, "Failed to create layer", RangeError.message);
        }
      }
      break;
    }
  }
};

export default AbstractRegistryHandler;
