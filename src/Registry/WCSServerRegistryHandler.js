define(['underscore-min','../Utils/Utils', './AbstractRegistryHandler', '../Utils/Constants', "./WCSServer"], function(_,Utils, AbstractRegistryHandler, Constants, WCSServer){

    var WCSServerRegistryHandler = function(layers, mizarConfiguration, pendingLayers){
        AbstractRegistryHandler.prototype.constructor.call();
        this.layers = layers;
        this.pendingLayers = pendingLayers;
        this.proxyUse = mizarConfiguration.proxyUse;
        this.proxyUrl = mizarConfiguration.proxyUrl;
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
     * Destroys the TileWireFrame if it exists and returns its layer description.
     * @param layers list of layers to load
     * @private
     */
    function _destroyTileWireFrame(layers) {
        var i, layerDescription;
        var isFound = false;
        for(i=0; i<layers.length; i++) {
            var layer = layers[i];
            if (layer.getType() === Constants.LAYER.TileWireframe) {
                isFound = true;
                break;
            }
        }
        if(isFound) {
            var layerToRemove = layers[i];
            layerDescription = layerToRemove.options;
            layerToRemove._detach();
            layers.splice(i, 1);
        }
        return layerDescription;
    }

    /**
     * Moves the TileWireFrameLayer to render at this end.
     * @param layers layers to render
     * @param AbstractRegistryHandler Registry
     * @param callback callback
     * @param fallback fallback
     * @private
     */
    function _moveTileWireFrameLayer(layers, AbstractRegistryHandler, callback, fallback) {
        var layerDescription = _destroyTileWireFrame(layers);
        if(layerDescription) {
            AbstractRegistryHandler.next.handleRequest(layerDescription, callback, fallback);
        }
    }

    WCSServerRegistryHandler.prototype.handleRequest = function(layerDescription, callback, fallback){
        try {
            if(layerDescription.type === Constants.LAYER.WCSElevation) {
                var wcsServer = new WCSServer(this.proxyUse, this.proxyUrl, layerDescription);
                var self = this;
                wcsServer.createLayers(function(layers) {
                    self._handlePendingLayers(self.pendingLayers, layers);
                    callback(layers);
                    _moveTileWireFrameLayer(self.layers, self, callback, fallback);
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