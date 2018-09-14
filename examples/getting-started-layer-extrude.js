var mizar = new Mizar({
    canvas: "GlobWebCanvas",
    planetContext: {
        coordinateSystem: {
            geoideName: Mizar.CRS.WGS84
        },
        lighting: false,
        tileErrorTreshold: 3,
        continuousRendering: true
    }
});

mizar.createStats({ element: 'fps', verbose: false });


var afterVectorLoad = function () {
    // Generate random country indices
    var countriesToExtrude = [];
    var nbCountries = 177;
    for (var i = 0; i < 15; i++) {
        countriesToExtrude.push(Math.floor(Math.random() * nbCountries));
    }

    var animation = mizar.AnimationFactory.create(
        Mizar.ANIMATION.Segmented,
        {
            "duration": 1000,
            "valueSetter": function (value) {
                for (var i = 0; i < countriesToExtrude.length; i++) {
                    // Extract feature for the given country
                    var feature = vectorLayer.features[countriesToExtrude[i]];
                    var featureStyle = feature.properties.style;
                    if (!featureStyle) {
                        featureStyle = mizar.UtilityFactory.create(Mizar.UTILITY.CreateStyle, vectorLayer.style);
                        vectorLayer.modifyFeatureStyle(feature, featureStyle);
                    }
                    featureStyle.setExtrusionScale(value);
                }
                // Uncomment to extrude all !
                //vectorLayer.style.extrusionScale = value;
            }
        });
    animation.addSegment(
        0.0, extrusionScale,
        1.0, 2,
        function (t, a, b) {
            return mizar.UtilityFactory.create(Mizar.UTILITY.Numeric).lerp(t, a, b);
        }
    );
    mizar.getActivatedContext().addAnimation(animation);

    // Start animation 2s after
    setTimeout(function () {
        animation.start();
    }, 2000);
};

var extrude = mizar.getCrs().getGeoide().getRealPlanetRadius() / 10.0;
var extrusionScale = 0.21;
console.log("extrude", extrude);
console.log("extrusionScale", extrusionScale);


var vectorLayer;
mizar.addLayer({
    type: Mizar.LAYER.GeoJSON,
    name: "land",
    style: mizar.UtilityFactory.create(Mizar.UTILITY.CreateStyle, {
        extrude: extrude, // Extrude max value
        extrusionScale: extrusionScale,
        //                            strokeColor : [1.0, 0.0, 0.0, 1.0],
        //                            fillColor : [1.0, 0.0, 0.0, 1.0],
        fillColor: [1., 1., 1., 1.],
        strokeColor: [0, 0, 0, 1],
        fill: true // If true, it does not work
    }),
    url: "data/land.json",
    visible: true,
    callback: afterVectorLoad
}, function (layerID) {
    vectorLayer = mizar.getLayerByID(layerID);
});


