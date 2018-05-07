define(["underscore-min",'../Layer/LayerFactory'], function(_, LayerFactory) {

    var AbstractRegistryHandler = function(){
        this.next = {
            handleRequest: function(layerDescription, callback, fallback){
                console.log('All strategies exhausted.');
            }
        }

    } ;

    AbstractRegistryHandler.prototype.setNext = function(next){
        this.next = next;
        return next;
    };

    AbstractRegistryHandler.prototype.handleRequest = function(layerDescription, callback, fallback){};

    AbstractRegistryHandler.prototype._handlePendingLayers = function(pendingLayers, layers) {
        var isFound = false;
        for (var i=0; i<layers.length && !isFound; i++) {
            var layer = layers[i];
            if(pendingLayers.length != 0 && layer.isBackground() && layer.isVisible()) {
                for(var j=0; j<pendingLayers.length; j++) {
                    var pendingLayerDescription = pendingLayers[j];
                    isFound = true;
                    try {
                        layers.push(LayerFactory.create(pendingLayerDescription));
                    } catch(RangeError) {
                    }
                }
            }
        }
        if(isFound) {
            pendingLayers = [];
        }
    };

    return AbstractRegistryHandler;
});