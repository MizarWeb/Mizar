define(['../Utils/Utils', './AbstractRegistryHandler', '../Utils/Constants', "./WCSServer"], function(Utils, AbstractRegistryHandler, Constants, WCSServer){

    var WCSServerRegistryHandler = function(mizarConfiguration, pendingLayers){
        AbstractRegistryHandler.prototype.constructor.call();
        this.pendingLayers = pendingLayers;
        this.proxyUse = mizarConfiguration.proxyUse;
        this.proxyUrl = mizarConfiguration.proxyUrl;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRegistryHandler, WCSServerRegistryHandler);

    /**************************************************************************************************************/

    WCSServerRegistryHandler.prototype.handleRequest = function(layerDescription, callback, fallback){
        try {
            if(layerDescription.type === Constants.LAYER.WCSElevation) {
                var wcsServer = new WCSServer(this.proxyUse, this.proxyUrl, layerDescription);
                var self = this;
                wcsServer.createLayers(function(layers) {
                    self._handlePendingLayers(self.pendingLayers, layers);
                    callback(layers);
                });
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