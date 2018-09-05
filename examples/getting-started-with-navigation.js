// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        coordinateSystem: { geoideName: Mizar.CRS.WGS84 },
        navigation: {
            //longitude, latitude, distance from surface in meter
            initTarget: [1.433, 43.600, 300000],
            // Enable inertia
            inertia: true
        }
    }
});

mizar.addLayer({
    "name": "Blue Marble",
    "type": "WMS",
    "baseUrl": "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE"
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
});