// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        coordinateSystem: { geoideName: Mizar.CRS.WGS84, projectionName: Mizar.PROJECTION.Plate },
        navigation: {
            initTarget: [1.433, 43.600, 300000],
            inertia: true
        }
    }
});


mizar.addLayer({
    name: "Blue Marble",
    type: Mizar.LAYER.WMS,
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE"
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
});
