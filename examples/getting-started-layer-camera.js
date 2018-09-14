var mizar = new Mizar({
    canvas: "MizarCanvas",
    planetContext: {
        coordinateSystem: {
            geoideName: Mizar.CRS.WGS84
        }
    }
});

mizar.addLayer({
    name: "Blue Marble",
    type: Mizar.LAYER.WMS,
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",    
    background: true,
    visible:true
});

var layerMontpellier;
mizar.addLayer({
    name: "Montpellier",
    type: Mizar.LAYER.WMS,
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_PALAVAS",
    layers: "S2_PALAVAS",
    transparent: true
}, function(layerID){
    layerMontpellier = mizar.getLayerByID(layerID);
});  

var layerEurope;
mizar.addLayer({
    name: "Europe",
    type: Mizar.LAYER.GeoJSON
}, function (layerID) {
    // get the empty layer
    layerEurope = mizar.getLayerByID(layerID);        

    $.ajax({
        url: "data/europe.json",
        success: function (data) {
            layerEurope.addFeatureCollection(data);
        }
    });

});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_BACKGROUND_CHANGED, function(layer){
    document.getElementById("message").innerHTML="background has changed: "+layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_BACKGROUND_ADDED, function(layer){
    document.getElementById("message").innerHTML="background has been added: "+layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_ADDED, function(layer){
    document.getElementById("message").innerHTML="added layer: "+layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_REMOVED, function(layer){
    document.getElementById("message").innerHTML="removed layer: "+layer.name;
});


$("#montpellier").change(function () {
    var montpellier = $(this).val();
    var checked = document.getElementById('montpellier').checked;
    if (layerMontpellier) {
        layerMontpellier.setVisible(checked);
    }
});

$("#europe").change(function () {
    var europe = $(this).val();
    var checked = document.getElementById('europe').checked;
    if (layerEurope) {
        layerEurope.setVisible(checked);
    } 
});
