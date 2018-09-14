// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        coordinateSystem: {
            geoideName: Mizar.CRS.WGS84
        }
    }
});

mizar.addLayer({
    type: Mizar.LAYER.WMS,
    name: "Blue Marble",
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE"
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
    scale: 2
}, function (layerID) {
    mizar.setBaseElevationByID(layerID);
});

mizar.addLayer({
    type: Mizar.LAYER.GeoJSON,
    visible: true
}, function (vectorLayerID) {
    var vectorLayer = mizar.getLayerByID(vectorLayerID);
    var startPoint, endPoint;
    var started = false;
    var activated = false;

    var feature = {
        id: '0',
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: []
        }
    };

    // Update the feature used to represent the rectangle
    function updateFeature(pt1, pt2) {
        var minX = Math.min(pt1[0], pt2[0]);
        var maxX = Math.max(pt1[0], pt2[0]);
        var minY = Math.min(pt1[1], pt2[1]);
        var maxY = Math.max(pt1[1], pt2[1]);

        feature.bbox = [minX, minY, maxX, maxY];
        feature.geometry.coordinates = [[[minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY]
        ]];
        vectorLayer.removeFeature(feature);
        vectorLayer.addFeature(feature);
    }

    // Called when left mouse button is pressed : start drawing the rectangle
    function onMouseDown(event) {
        if (activated && event.button == 0) {
            startPoint = mizar.getActivatedContext().getLonLatFromPixel(event.clientX, event.clientY);
            updateFeature(startPoint, startPoint);
            started = true;
        }
    }

    // Called when mouse is moved  : update the rectangle
    function onMouseMove(event) {
        if (started && event.button == 0) {
            var endPoint = mizar.getActivatedContext().getLonLatFromPixel(event.clientX, event.clientY);
            updateFeature(startPoint, endPoint);
        }
    }

    // Called when left mouse button is release  : end drawing the rectangle
    function onMouseUp(event) {
        if (started && event.button == 0) {
            var endPoint = mizar.getActivatedContext().getLonLatFromPixel(event.clientX, event.clientY);
            updateFeature(startPoint, endPoint);
            started = false;
        }
    }

    $('#MizarCanvas').mousedown(onMouseDown);
    $('#MizarCanvas').mousemove(onMouseMove);
    $('#MizarCanvas').mouseup(onMouseUp);

    $('#MizarCanvas').keypress(function () {


        if (activated) {
            mizar.getActivatedContext().getNavigation().start();
        }
        else {
            mizar.getActivatedContext().getNavigation().stop();
            feature = {
                id: '0',
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: []
                }
            };
        }
        activated = !activated;
    });
});
