// Create Mizar instance
var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        type:"Planet",
        coordinateSystem: { geoideName: Mizar.CRS.WGS84 }
    }
});

// create a Bing server and set it as background
mizar.addLayer({
    type: Mizar.LAYER.Bing,
    imageSet: "AerialWithLabels",
    key: "Ar7-_U1iwNtChqq64tAQsOfO8G7FwF3DabvgkQ1rziC4Z9zzaKZlRDWJTKTOPBPV"
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
});

// create a WMS on the Bing layer, by default visible with an opacity of 70%
mizar.addLayer({
    type: Mizar.LAYER.WMS,
    "name": "Blue Marble",
    "baseUrl": "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
    visible: true,
    opacity: 70
});

// create an empty layer, by default visible
mizar.addLayer({
    type: Mizar.LAYER.GeoJSON,
    visible: true
}, function (layerID) {
    // get the empty layer
    var layer = mizar.getLayerByID(layerID);

    // add this polygon the empyt layer
    // no need to define CRS, by defaut EPSG:4326 (Earth)
    var feature = {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [[[79.34, 70.2],
            [360 - 278.72, 70.06],
            [79.47, 67.02],
            [77.79, 63.52],
            [76.52, 60.4],
            [75.18, 60.52],
            [76.3, 63.64],
            [77.78, 67.15],
            [79.34, 70.2]]]
        }
    };
    layer.addFeature(feature);

    // add a
    $.ajax({
        url: "data/error.geojson",
        dataType: "json",
        success: function (data) {
            layer.addFeatureCollection(data);
        }
    });

    $.ajax({
        url: "data/europe.json",
        success: function (data) {
            layer.addFeatureCollection(data);
        }
    });

    $.ajax({
        url: "data/multiPolygon.json",
        success: function (data) {
            layer.addFeatureCollection(data);
        }
    });

    $('#MizarCanvas').keypress(function (event) {
        var key = String.fromCharCode(event.which);
        if (key == 'v') {
            layer.setVisible(!layer.isVisible());
        }
        else if (key == 'a') {
            layer.setOpacity(layer.getOpacity() - 0.1);
        }
        else if (key == 'e') {
            layer.setOpacity(layer.getOpacity() + 0.1);
        }
    });
});
