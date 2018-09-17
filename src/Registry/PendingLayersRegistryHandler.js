define([
    "../Utils/Utils",
    "./AbstractRegistryHandler",
    "../Utils/Constants"
], function(Utils, AbstractRegistryHandler, Constants) {
    var PendingLayersRegistryHandler = function(pendingLayers, layers) {
        AbstractRegistryHandler.prototype.constructor.call();
        this.layers = layers;
        this.pendingLayers = pendingLayers;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRegistryHandler, PendingLayersRegistryHandler);

    /**************************************************************************************************************/

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
