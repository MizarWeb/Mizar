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
    "../Utils/Constants"
], function(Utils, AbstractRegistryHandler, Constants) {

    /**
     * Creates a pending layer handler
     * @param {*} pendingLayers 
     * @param {*} layers 
     * @constructor
     * @augments AbstractRegistryHandler
     * @memberof module:Registry
     * @constructor
     */
    var PendingLayersRegistryHandler = function(pendingLayers, layers) {
        AbstractRegistryHandler.prototype.constructor.call();
        this.layers = layers;
        this.pendingLayers = pendingLayers;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRegistryHandler, PendingLayersRegistryHandler);

    /**************************************************************************************************************/

    /**
     * Check whether a layerbackground is already loaded.
     * @returns {boolean} true when the layer background is already defined otherwise false
     * @function hasLayerBackground
     * @memberof PendingLayersRegistryHandler#
     */
    PendingLayersRegistryHandler.prototype.hasLayerBackground = function() {
        var hasBackground = false;
        for (var i = 0; i < this.layers.length; i++) {
            var layer = this.layers[i];
            if (layer.isBackground()) {
                hasBackground = true;
                break;
            }
        }
        return hasBackground;
    };

    /**
     * @function handleRequest
     * @memberof PendingLayersRegistryHandler#     
     */     
    PendingLayersRegistryHandler.prototype.handleRequest = function(
        layerDescription,
        callback,
        fallback
    ) {
        if (
            (layerDescription.type === Constants.LAYER.Atmosphere ||
                layerDescription.type === Constants.LAYER.TileWireframe) &&
            !this.hasLayerBackground()
        ) {
            this.pendingLayers.push(layerDescription);
        } else {
            this.next.handleRequest(layerDescription, callback, fallback);
        }
    };

    return PendingLayersRegistryHandler;
});
