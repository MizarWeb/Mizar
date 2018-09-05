// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas"
});
mizar.createContext(Mizar.CONTEXT.Planet, {
    coordinateSystem: {
        geoideName: Mizar.CRS.Mars_2000
    }
});
mizar.createStats({ element: 'fps', verbose: false });

mizar.addLayer({
    type: Mizar.LAYER.WMS,
    name: "viking",
    baseUrl: "http://idoc-wmsmars.ias.u-psud.fr/cgi-bin/mapserv?map=/home/cnes/mars/mars.map",
    layers: "viking"
}, function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
});

mizar.addLayer({
    type: Mizar.LAYER.WCSElevation,
    name: "marsElevation",
    baseUrl: "http://idoc-wcsmars.ias.u-psud.fr/wcsmap",
    coverage: "MARSTOPO_16",
    minElevation: -32000,
    version: "1.0.0",
    scale: 2
}, function (layerID) {
    mizar.setBaseElevationByID(layerID);
});

mizar.addLayer({
    type: Mizar.LAYER.GeoJSON,
    name: "LandingSite",
    url: "./data/landingSite.json",
    icon: "./resources/images/star.png",
    visible: true
});