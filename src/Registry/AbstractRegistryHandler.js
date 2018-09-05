define(["underscore-min", "../Layer/LayerFactory"], function(_, LayerFactory) {
    var AbstractRegistryHandler = function() {
        this.next = {
            handleRequest: function(layerDescription, callback, fallback) {
                console.log("All strategies exhausted.");
            }
        };
    };

    AbstractRegistryHandler.prototype.setNext = function(next) {
        this.next = next;
        return next;
    };

    AbstractRegistryHandler.prototype.handleRequest = function(
        layerDescription,
        callback,
        fallback
    ) {};

    AbstractRegistryHandler.prototype._handlePendingLayers = function(
        pendingLayers,
        layers
    ) {
        for (var i = 0; i < layers.length && pendingLayers.length !== 0; i++) {
            var layer = layers[i];
            if (
                pendingLayers.length != 0 &&
                layer.isBackground() &&
                layer.isVisible()
            ) {
                var j = pendingLayers.length;
                while (j > 0) {
                    j--;
                    var pendingLayerDescription = pendingLayers[j];
                    try {
                        layers.push(
                            LayerFactory.create(pendingLayerDescription)
                        );
                        pendingLayers.splice(j, 1);
                    } catch (RangeError) {}
                }
            }
        }
    };

    return AbstractRegistryHandler;
});
