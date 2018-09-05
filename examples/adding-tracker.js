// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    configuration: {
        positionTracker: {
            element: "myPosTracker"
        },
        elevationTracker: {
            element: "myElevTracker"
        }
    },
    planetContext: {
        coordinateSystem: { geoideName: Mizar.CRS.WGS84 },
        lighting: false,
        tileErrorTreshold: 3,
        continuousRendering: true
    }
});

mizar.addLayer({
    type: Mizar.LAYER.WMS,
    name: "Blue Marble",
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
    visible: true
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
});

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
