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

/**
 * This package allow to call a registry of layers so that to create {@link Layer layers} from this registry. For this,
 * a set of handler is defined according to a chain of responsibility pattern.
 * <ul>
 *     <li>{@link module:Registry.LayerRegistryHandler LayerRegistryHandler}: Creates a simple {@link Layer} from {@link LayerFactory}</li>
 *     <li>{@link module:Registry.PendingLayersRegistryHandler PendingLayersRegistryHandler} : Create a pool of pending layer description.
 * In some cases, layer must declare in a certain order. To avoid an error, some layers has set as pending the time to have the required layer</li>
 *     <li>{@link module:Registry.WCSServerRegistryHandler WCSServerRegistryHandler} : Creates {@link WCSElevationLayer WCS layers} from {@link WCSServer}</li>
 *     <li>{@link module:Registry.WMSServerRegistryHandler WMSServerRegistryHandler} : Creates {@link WMSLayer WMS layers} from {@link WMSServer}</li>
 *     <li>{@link module:Registry.WMTSServerRegistryHandler WMTSServerRegistryHandler} : Creates {@link WMTSLayer WMTS layers} from {@link WMTSServer}</li>
 * </ul>
 *
 * The client can handle all this classes by the use of its {@link Registry interface}.
 *
 * @module Registry
 * @implements {RegistryHandler}
 */
import Utils from "../Utils/Utils";
import AbstractRegistryHandler from "./AbstractRegistryHandler";
import LayerFactory from "../Layer/LayerFactory";
import Constants from "../Utils/Constants";
import ErrorDialog from "../Gui/dialog/ErrorDialog";
/**
 * @class
 * This handler processes the layerdescription as a simple {@link LayerFactory}
 * @param {string[]} pendingLayers List of pending layer description
 * @augments AbstractRegistryHandler
 * @constructor
 * @memberof module:Registry
 */
var LayerRegistryHandler = function (pendingLayers) {
  AbstractRegistryHandler.prototype.constructor.call();
  this.pendingLayers = pendingLayers;
};

/**************************************************************************************************************/

Utils.inherits(AbstractRegistryHandler, LayerRegistryHandler);

/**************************************************************************************************************/

/**
 * @function handleRequest
 * @memberof LayerRegistryHandler#
 */

LayerRegistryHandler.prototype.handleRequest = function (layerDescription, callback, fallback) {
  var layers = [];
  try {
    var layer = LayerFactory.create(layerDescription);
    layers.push(layer);
    this._handlePendingLayers(this.pendingLayers, layers);
    callback(layers);
  } catch (e) {
    if (e instanceof RangeError && this.next != null) {
      this.next.handleRequest(layerDescription, callback, fallback);
    } else if (fallback) {
      fallback(e);
    } else {
      ErrorDialog.open(Constants.LEVEL.DEBUG, "Unknown error in LayerRegistryHanlder", e);
    }
  }
};

export default LayerRegistryHandler;
