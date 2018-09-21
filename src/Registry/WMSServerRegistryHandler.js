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
define([
    "../Utils/Utils",
    "./AbstractRegistryHandler",
    "../Utils/Constants",
    "./WMSServer"
], function(Utils, AbstractRegistryHandler, Constants, WMSServer) {

    /**
     * @class
     * Creates a WMS handler to create {@link WMSLayer WMS layers}
     * @param {*} mizarConfiguration 
     * @param {*} pendingLayers 
     * @augments AbstractRegistryHandler
     * @memberof module:Registry
     * @constructor
     * @see {@link WMSServer}
     */
    var WMSServerRegistryHandler = function(mizarConfiguration, pendingLayers) {
        AbstractRegistryHandler.prototype.constructor.call();
        this.pendingLayers = pendingLayers;
        this.proxyUse = mizarConfiguration.proxyUse;
        this.proxyUrl = mizarConfiguration.proxyUrl;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRegistryHandler, WMSServerRegistryHandler);

    /**************************************************************************************************************/

    /**
     * @function handleRequest
     * @memberof WMSServerRegistryHandler#
     */    
    WMSServerRegistryHandler.prototype.handleRequest = function(
        layerDescription,
        callback,
        fallback
    ) {
        try {
            if (layerDescription.type === Constants.LAYER.WMS) {
                var wmsServer = new WMSServer(
                    this.proxyUse,
                    this.proxyUrl,
                    layerDescription
                );
                var self = this;
                wmsServer.createLayers(function(layers) {
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
                console.error(e);
            }
        }
    };

    return WMSServerRegistryHandler;
});
