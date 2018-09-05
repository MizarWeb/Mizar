// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        "type": "Planet",
        "name": "Earth",
        "coordinateSystem": {
            "geoideName": Mizar.CRS.WGS84
        }
    }
});

// Add a WMS layer
mizar.addLayer({
    type: Mizar.LAYER.WMS,
    name: "Blue Marble",
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
    background: true,
    visible:true
});
