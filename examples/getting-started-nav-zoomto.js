// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        "type": "Planet",
        "name": "Earth",
        "coordinateSystem": {
            "geoideName": Mizar.CRS.WGS84
        }
    }
});

// Add a WMS layer
mizar.addLayer({
    type: Mizar.LAYER.WMS,
    "name": "Blue Marble",
    "baseUrl": "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE"
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);

    // get the navigation object
    var nav = mizar.getActivatedContext().getNavigation();

    // first zoom
    nav.zoomTo([-160, 80], {
        // second zoom in the callback
        callback: function () {
            nav.zoomTo([10, 80]);
        }
    });
});            
