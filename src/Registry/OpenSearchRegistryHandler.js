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
import Utils from "../Utils/Utils";
import AbstractRegistryHandler from "./AbstractRegistryHandler";
import Constants from "../Utils/Constants";
import ErrorDialog from "../Gui/dialog/ErrorDialog";
import OpenSearchServer from "./OpenSearchServer";

/**
 * @class
 * Creates an OpenSearch handler to create {@link OpenSearchServer OpenSearch layers}
 * @param {*} pendingLayers
 * @augments AbstractRegistryHandler
 * @memberof module:Registry
 * @constructor
 * @see {@link WMSServer}
 */
var OpenSearchRegistryHandler = function (pendingLayers) {
  AbstractRegistryHandler.prototype.constructor.call(this);
  this.pendingLayers = pendingLayers;
};

/**************************************************************************************************************/

Utils.inherits(AbstractRegistryHandler, OpenSearchRegistryHandler);

/**************************************************************************************************************/

/**
 * @function handleRequest
 * @memberof OpenSearchRegistryHandler#
 */

OpenSearchRegistryHandler.prototype.handleRequest = function (layerDescription, callback, fallback) {
  try {
    if (layerDescription.type === Constants.LAYER.OpenSearch) {
      var openSearchServer = new OpenSearchServer(layerDescription);
      var self = this;
      openSearchServer.createLayers(function (layers) {
        //TODO : I loose the callback of pendingLayers
        self._handlePendingLayers(self.pendingLayers, layers);
        callback(layers);
      }, fallback);
    } else {
      this.next.handleRequest(layerDescription, callback, fallback);
    }
  } catch (e) {
    if (fallback) {
      fallback(e);
    } else {
      ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRegistryHandler.js", e);
    }
  }
};

export default OpenSearchRegistryHandler;
