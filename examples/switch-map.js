var mode = "equatorial";

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
        continuousRendering: true
    }
});

mizar.createStats({ element: 'fps', verbose: false });

var dssLayerID

mizar.addLayer({
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
    baseLevel: 3,
    numberOfLevels: 1
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
    dssLayerID = layerID;
});

var irisLayerID
mizar.addLayer({
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/IRISColor",
    numberOfLevels: 1
}, function (layerID) {
    irisLayerID = layerID;
});

window.onkeypress = function (event) {
    if (mode === "equatorial") {
        mizar.setBackgroundLayerByID(irisLayerID);
        mode = "galactic";
    } else {
        mizar.setBackgroundLayerByID(dssLayerID);
        mode = "equatorial";
    }
    //mizar.getActivatedContext().getTileManager().setFreeze(!mizar.getActivatedContext().getTileManager().getFreeze());
}
