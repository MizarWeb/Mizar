define(['underscore-min','../Utils/Utils', './AbstractRegistryHandler', '../Utils/Constants', "./WCSServer"], function(_,Utils, AbstractRegistryHandler, Constants, WCSServer){

    var WCSServerRegistryHandler = function(globe, layers, mizarConfiguration, pendingLayers){
        AbstractRegistryHandler.prototype.constructor.call();
        this.pendingLayers = pendingLayers;
        this.proxyUse = mizarConfiguration.proxyUse;
        this.proxyUrl = mizarConfiguration.proxyUrl;
        this.layers = layers;
        this.globe = globe;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRegistryHandler, WCSServerRegistryHandler);

    /**************************************************************************************************************/

    /**
     * Detach and attach the TileWireFrame after WCS.
     * The TileWireFrame must be loaded after the WCS because the WCS is part of the 3D model.
     * @param layers list of layers to load
     * @private
     */
    function _updateTileWireFrame(globe, layers) {
        var i;
        var isFound = false;
        var layer;
        for(i=0; i<layers.length; i++) {
            layer = layers[i];
            if (layer.getName() === Constants.LAYER.TileWireframe) {
                isFound = true;
                break;
            }
        }
        if(isFound) {
            layer._detach();
            layer.program = null;
            layer.indexBuffer = null;
            layer.globe = null;
            layer.subIndexBuffer = [null, null, null, null];
            layer._attach(globe);
        }
    }

    WCSServerRegistryHandler.prototype.handleRequest = function(layerDescription, callback, fallback){
        try {
            if(layerDescription.type === Constants.LAYER.WCSElevation) {
                var wcsServer = new WCSServer(this.proxyUse, this.proxyUrl, layerDescription);
                var self = this;
                wcsServer.createLayers(function(layers) {
                    _updateTileWireFrame(this.globe, self.layers);
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