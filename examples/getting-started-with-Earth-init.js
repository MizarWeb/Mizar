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

mizar.addLayer({
    "name": "Blue Marble",
    "type": "WMS",
    "baseUrl": "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
    "visible": true,
    "background": true
});