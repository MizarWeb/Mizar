var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        coordinateSystem: {
            geoideName: Mizar.CRS.WGS84
        },
        continuousRendering: true
    }
});

mizar.addLayer({
    type: Mizar.LAYER.Bing,
    imageSet: "AerialWithLabels",
    key: "Ar7-_U1iwNtChqq64tAQsOfO8G7FwF3DabvgkQ1rziC4Z9zzaKZlRDWJTKTOPBPV"
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
});

var feature1 = {
    type: "Feature",
    geometry: {
        type: "Polygon",
        coordinates: [[[179.34, 70.2],
        [-178.72, 70.06],
        [179.47, 67.02],
        [177.79, 63.52],
        [176.52, 60.4],
        [175.18, 60.52],
        [176.3, 63.64],
        [177.78, 67.15],
        [179.34, 70.2]]]
    }
};

var feature2 = {
    type: "Feature",
    geometry: {
        type: "Polygon",
        coordinates: [[
            [0.0, 70.0],
            [20.0, 70.0],
            [40.0, 70.0],
            [60.0, 70.0],
            [80.0, 70.0],
            [100.0, 70.0],
            [120.0, 70.0],
            [140.0, 70.0],
            [160.0, 70.0],
            [180.0, 70.0],
            [-180.0, 70.0],
            [-160.0, 70.0],
            [-140.0, 70.0],
            [-120.0, 70.0],
            [-100.0, 70.0],
            [-80.0, 70.0],
            [-60.0, 70.0],
            [-40.0, 70.0],
            [-20.0, 70.0],
            [0.0, 70.0]
        ]]
    }
};

var feature3 = {
    type: "Feature",
    geometry: {
        type: "Polygon",
        coordinates: [[
            [125.0, 50.0],
            [134.0, 60.0],
            [-170.0, 60.0],
            [-90.0, 60.0],
            [4.0, 60.0],
            [90.0, 50.0],
            [125.0, 50.0]]]
    }
};

mizar.addLayer({
    type: Mizar.LAYER.GeoJSON,
    visible: true
}, function (layerGeoJson1ID) {
    var layerGeoJSON1 = mizar.getLayerByID(layerGeoJson1ID);
    layerGeoJSON1.addFeature(feature1);
});

mizar.addLayer({
    type: Mizar.LAYER.GeoJSON,
    visible: true
}, function (layerGeoJson2ID) {
    var layerGeoJSON2 = mizar.getLayerByID(layerGeoJson2ID);
    layerGeoJSON2.addFeature(feature2);
});

mizar.addLayer({
    type: Mizar.LAYER.GeoJSON,
    visible: true
}, function (layerGeoJson3ID) {
    var layerGeoJSON3 = mizar.getLayerByID(layerGeoJson3ID);
    layerGeoJSON3.addFeature(feature3);
});