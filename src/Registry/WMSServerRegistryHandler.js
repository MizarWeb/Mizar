define([
    "../Utils/Utils",
    "./AbstractRegistryHandler",
    "../Utils/Constants",
    "./WMSServer"
], function(Utils, AbstractRegistryHandler, Constants, WMSServer) {
    var WMSServerRegistryHandler = function(mizarConfiguration, pendingLayers) {
        AbstractRegistryHandler.prototype.constructor.call();
        this.pendingLayers = pendingLayers;
        this.proxyUse = mizarConfiguration.proxyUse;
        this.proxyUrl = mizarConfiguration.proxyUrl;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRegistryHandler, WMSServerRegistryHandler);

    /**************************************************************************************************************/

    WMSServerRegistryHandler.prototype.handleRequest = function(
        layerDescription,
        callback,
        fallback
    ) {
        try {
            if (layerDescription.type === Constants.LAYER.WMS) {
                var wmsServer = new WMSServer(
                    this.proxyUse,
                    this.proxyUrl,
                    layerDescription
                );
                var self = this;
                wmsServer.createLayers(function(layers) {
                    self._handlePendingLayers(self.pendingLayers, layers);
                    callback(layers);
                }, fallback);
            } else {
                this.next.handleRequest(layerDescription, callback, fallback);
            }
        } catch (e) {
            if (fallback) {
                fallback(e);
            } else {
                console.error(e);
            }
        }
    };

    return WMSServerRegistryHandler;
});
