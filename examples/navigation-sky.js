// create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    skyContext: {
        coordinateSystem: { geoideName: Mizar.CRS.Mars_2000 }
    }
});

mizar.addLayer({
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/DSS/DSSColor"
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
});

var nav = mizar.getActivatedContext().getNavigation();
nav.zoomTo([-160, 80], {
    callback: function () {
        nav.zoomTo([10, 80]);
    }
});           
