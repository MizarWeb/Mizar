// Create Mizar instance
var mizar = new Mizar({
    canvas: "MizarCanvas",
    configuration: {
        positionTracker: {
            position: "bottom"
        }
    },
    planetContext: {
        coordinateSystem: { geoideName: Mizar.CRS.WGS84 }
    },
    skyContext: {
        coordinateSystem: { geoideName: Mizar.CRS.Equatorial }
    }
});

mizar.setActivatedContext("Sky");
mizar.addLayer({
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
    visible: true
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
    //mizar.disable();
});

mizar.setActivatedContext("Planet");
mizar.addLayer({
    "name": "Blue Marble",
    "type": "WMS",
    "baseUrl": "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
    "visible": true,
    "background": true
});
// subscribe to baseLayersReady to show the context andn the animation.
mizar.getActivatedContext().subscribe("baseLayersReady", function () {
    // Planet layers are ready, we can show the sky background
    mizar.getSkyContext().enable();
    mizar.setActivatedContext("Planet");
    // init the navigation
    var nav = mizar.getActivatedContext().getNavigation();
    nav.zoomTo([0, 0], { fov: nav.getFov() });
});
