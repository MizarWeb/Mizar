define(['../Utils/Utils', './AbstractRegistryHandler', '../Utils/Constants', "./WMTSServer"], function(Utils, AbstractRegistryHandler, Constants, WMTSServer){

    var WMTSServerRegistryHandler = function(mizarConfiguration, pendingLayers){
        AbstractRegistryHandler.prototype.constructor.call();
        this.pendingLayers = pendingLayers;
        this.proxyUse = mizarConfiguration.proxyUse;
        this.proxyUrl = mizarConfiguration.proxyUrl;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRegistryHandler, WMTSServerRegistryHandler);

    /**************************************************************************************************************/

    WMTSServerRegistryHandler.prototype.handleRequest = function(layerDescription, callback, fallback){
        try {
            if(layerDescription.type === Constants.LAYER.WMTS) {
                var wmtsServer = new WMTSServer(this.proxyUse, this.proxyUrl, layerDescription);
                var self = this;
                wmtsServer.createLayers(function(layers) {
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

    return WMTSServerRegistryHandler;
});