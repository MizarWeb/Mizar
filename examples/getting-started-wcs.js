// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        coordinateSystem: { geoideName: Mizar.CRS.WGS84 }
    }
});

// create the widget to display the Fps and insert the contain in <div id="fps" .../>
mizar.createStats({
    element: 'fps',
    verbose: false
});

// add a WMS layer
mizar.addLayer({
    type: Mizar.LAYER.WMS,
    name: "Blue Marble",
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
    visible: true
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
});

// add an elevation and increase the height by a 4 factor
mizar.addLayer({
    type: Mizar.LAYER.WCSElevation,
    name: 'Elevation',
    baseUrl: 'http://80.158.6.138/mapserv?map=WMS_SRTM',
    coverage: 'SRTM',
    version: '1.0.0',
    minElevation: -32000,
    scale: 2,
    visible: true
}, function (layerID) {
    mizar.setBaseElevationByID(layerID);
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.BASE_LAYERS_READY, function () {
    // Get the navigation object
    var nav = mizar.getActivatedContext().getNavigation();
    // move to (longitude, latitude, distance in meter)
    nav.zoomTo([1.433, 42.900, 30000], {
        duration: 1000,
        callback: function () {
            //zoom
            nav.zoom(0, 0.01);
            //rotate the camera
            nav.rotate(0, 10000)
        }
    });
});
