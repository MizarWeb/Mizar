

// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        "type": "Planet",
        "name": "Earth",
        "coordinateSystem": {
            "geoideName": Mizar.CRS.Mars_2000
        }
    }    
});

// mizar.createContext(Mizar.CONTEXT.Planet, {
//     coordinateSystem: {
//         geoideName: Mizar.CRS.Mars_2000
//     }
// });

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_BACKGROUND_CHANGED, function(layer){
    document.getElementById("message").innerHTML="background has changed: "+layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_BACKGROUND_ADDED, function(layer){
    document.getElementById("message").innerHTML="background has been added: "+layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_ADDITIONAL_ADDED, function(layer){
    elt = document.getElementById("layers").innerHTML + "<div>";
    elt = elt + '<input type="checkbox" id="'+layer.ID+'" name="layer" value="'+layer.ID+'" onclick="toggle(\''+layer.ID+'\');"/>';
    elt = elt + '<label for="'+layer.ID+'">'+layer.name+'</label>';
    elt = elt +"</div>";    
    document.getElementById("layers").innerHTML = elt;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_REMOVED, function(layer){
    document.getElementById("message").innerHTML="removed layer: "+layer.name;
});


mizar.createStats({ element: 'fps', verbose: false });

mizar.addLayer({
    type: Mizar.LAYER.WMS,
    name: "viking",
    baseUrl: "http://idoc-wmsmars.ias.u-psud.fr/cgi-bin/mapserv?map=/home/cnes/mars/mars.map",
    layers: "viking",
    visible: true,
    background:true
});

mizar.addLayer({
    type: Mizar.LAYER.WMS,
    baseUrl: "http://idoc-wmsmars.ias.u-psud.fr/cgi-bin/mapserv?map=/home/cnes/mars/mars.map"
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
    icon: "./resources/images/star.png"
});

function toggle(layerID) {
    var layer = mizar.getLayerByID(layerID);
    var checked = document.getElementById(layerID).checked
    layer.setVisible(checked);
}