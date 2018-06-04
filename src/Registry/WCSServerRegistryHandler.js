define(['underscore-min','../Utils/Utils', './AbstractRegistryHandler', '../Utils/Constants', "./WCSServer"], function(_,Utils, AbstractRegistryHandler, Constants, WCSServer){

    var WCSServerRegistryHandler = function(layers, mizarConfiguration, pendingLayers){
        AbstractRegistryHandler.prototype.constructor.call();
        this.pendingLayers = pendingLayers;
        this.proxyUse = mizarConfiguration.proxyUse;
        this.proxyUrl = mizarConfiguration.proxyUrl;
        this.layers = layers;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRegistryHandler, WCSServerRegistryHandler);

    /**************************************************************************************************************/

    /**
     * Moves an elements of the array to another index
     * @param {[]} array array
     * @param {number} from index where the element to move is located
     * @param {number} to index where the element must be gone.
     * @private
     */
    function _moveArrayEltFromTo(array, from, to) {
        var extracted = array.splice(from, 1)[0];
        array.splice(to, 0, extracted);
    }

    /**
     * Moves the TileWireFrame after WCS.
     * The TileWireFrame must be loaded after the WCS because the WCS is part of the 3D model. When the 3D
     * model is created, the TileWireFrame is placed on it
     * @param layers list of layers to load
     * @private
     */
    function _moveTileWireFrameAfterWCS(layers) {
        var i;
        var isFound = false;
        for(i=0; i<layers.length; i++) {
            var layer = layers[i];
            if (layer.getName() === Constants.LAYER.TileWireframe) {
                isFound = true;
                break;
            }
        }
        if(isFound) {
            _moveArrayEltFromTo(layers, i, layers.length-1);
        }
    }

    WCSServerRegistryHandler.prototype.handleRequest = function(layerDescription, callback, fallback){
        try {
            if(layerDescription.type === Constants.LAYER.WCSElevation) {
                var wcsServer = new WCSServer(this.proxyUse, this.proxyUrl, layerDescription);
                var self = this;
                wcsServer.createLayers(function(layers) {
                    _moveTileWireFrameAfterWCS(this.layers);
                    self._handlePendingLayers(self.pendingLayers, layers);
                    callback(layers);
                }, fallback);
            } else {
                this.next.handleRequest(layerDescription, callback, fallback);
            }
        } catch(e) {
            if (fallback) {
                fallback(e);
            } else {
                console.error(e);
            }
        }
    };

    return WCSServerRegistryHandler;

});