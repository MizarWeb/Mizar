var cvs = document.getElementById("2d");
var ctx = cvs.getContext("2d");
ctx.shadowColor = '#000';
ctx.shadowOffsetX = 1;
ctx.shadowOffsetY = 1;
ctx.shadowBlur = 2;
ctx.fillStyle = '#fff';
ctx.font = 'bold 20px sans-serif';
ctx.textBaseline = 'top';
ctx.fillText('HTML5 is cool!', 1, 1);

var mizar = new Mizar({
    canvas: "MizarCanvas",
    configuration: {
        attributionHandler: {
            element: "myGlobeAttributions"
        }
    },
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


var style = mizar.UtilityFactory.create(Mizar.UTILITY.CreateStyle);
style.iconUrl = null;
style.label = "POI";
style.pointMaxSize = 4000;

mizar.addLayer({
    type: Mizar.LAYER.GeoJSON,
    style: style,
    visible: true
}, function (layerID) {
    var layer = mizar.getLayerByID(layerID);
    var canvas = document.getElementById("MizarCanvas");
    var poi;
    canvas.onclick = function (event) {
        if (poi)
            layer.removeFeature(poi);

        var pos = mizar.getRenderContext().getXYRelativeToCanvas(event);
        var lonlat = mizar.getActivatedContext().getLonLatFromPixel(pos[0], pos[1]);

        if (lonlat) {
            poi = {
                geometry: {
                    type: "Point",
                    coordinates: lonlat
                }
            };
            layer.addFeature(poi);
        }
    };

});