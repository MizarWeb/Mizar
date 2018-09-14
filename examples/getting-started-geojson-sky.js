// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    configuration: {
        positionTracker: {
            element: "myPosTracker"
        }
    },
    skyContext: {
        coordinateSystem: { geoideName: Mizar.CRS.Equatorial },
        compass: "compassDiv"
    }
});

mizar.createStats({ element: 'fps', verbose: false });

mizar.addLayer({
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/DSS/DSSColor"
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
});

mizar.addLayer({
    type: Mizar.LAYER.GeoJSON,
    name: "Euclid",
    url: "data/Euclid.json",
    visible: true
});