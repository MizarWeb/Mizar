// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    skyContext: {
        coordinateSystem: { geoideName: Mizar.CRS.Equatorial },
        lighting: false,
        tileErrorTreshold: 3,
        continuousRendering: true
    }
});

mizar.addLayer({
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
    background:true
}, function (layerID) {
    //mizar.setBackgroundLayerByID(layerID);
});
