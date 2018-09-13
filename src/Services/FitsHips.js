define(['../Utils/Constants'], function(Constants) {
    var mizarAPI;   

    /**
     * Creates a fits layer
     * @param {Layer} layer
     * @fires Globe#backgroundLayer:changed
     */
    function _createFitsLayer(layer) {
        var isCreated;
        try {
            var selectedLayer = {
                name: layer.getName(),
                type: layer.getType(),
                format: "fits",
                hipsMetadata: layer.getHipsMetadata()
            };
            var fitsLayer = mizarAPI.LayerFactory.create(selectedLayer);
            fitsLayer.ID = layer.getID();
            if (layer.isBackground()) {
                mizarAPI
                    .getActivatedContext()
                    ._getGlobe()
                    .setBaseImagery(fitsLayer);
            } else {
                mizarAPI
                    .getActivatedContext()
                    ._getGlobe()
                    .addLayer(fitsLayer);
            }
            fitsLayer.setVisible(true);
            isCreated = true;
            mizarAPI
                .getActivatedContext()
                .publish(Constants.EVENT_MSG.LAYER_BACKGROUND_CHANGED, fitsLayer);
        } catch (e) {
            isCreated = false;
        }
        return isCreated;
    }

    function _removeFitsLayer(ID) {
        var isRemoved;
        var layer = mizarAPI.getActivatedContext().getLayerByID(ID);
        if (layer && layer.getFormat() !== "fits") {
            mizarAPI
                .getActivatedContext()
                ._getGlobe()
                .setBaseImagery(layer);
            isRemoved = true;
        } else {
            isRemoved = false;
        }
        return isRemoved;
    }

    return {
        init: function(m, options) {
            mizarAPI = m;
        },

        createFitsLayer: _createFitsLayer,
        removeFitsLayer: _removeFitsLayer
    };
});
