define([
    "../Utils/Utils",
    "./AbstractRegistryHandler",
    "../Layer/LayerFactory"
], function(Utils, AbstractRegistryHandler, LayerFactory) {
    var LayerRegistryHandler = function(pendingLayers) {
        AbstractRegistryHandler.prototype.constructor.call();
        this.pendingLayers = pendingLayers;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRegistryHandler, LayerRegistryHandler);

    /**************************************************************************************************************/

    LayerRegistryHandler.prototype.handleRequest = function(
        layerDescription,
        callback,
        fallback
    ) {
        var layers = [];
        try {
            var layer = LayerFactory.create(layerDescription);
            layers.push(layer);
            this._handlePendingLayers(this.pendingLayers, layers);
            callback(layers);
        } catch (e) {
            if (e instanceof RangeError) {
                this.next.handleRequest(layerDescription, callback, fallback);
            } else if (fallback) {
                fallback(e);
            } else {
                console.error(e);
            }
        }
    };

    return LayerRegistryHandler;
});
