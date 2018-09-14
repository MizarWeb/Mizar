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
    if (checked) {
        mizar.addLayer({
            name: "Montpellier",
            type: Mizar.LAYER.WMS,
            baseUrl: "http://80.158.6.138/mapserv?map=WMS_PALAVAS",
            layers: "S2_PALAVAS",
            transparent: true,
            visible:true
        });       
    } else {
        var layer = mizar.getLayerByName("Montpellier");    
        mizar.removeLayer(layer.ID);        
    }
});

$("#europe").change(function () {
    var europe = $(this).val();
    var checked = document.getElementById('europe').checked;
    if (checked) {
        mizar.addLayer({
            name: "Europe",
            type: Mizar.LAYER.GeoJSON,
            visible: true
        }, function (layerID) {
            // get the empty layer
            var layer = mizar.getLayerByID(layerID);        
        
            $.ajax({
                url: "data/europe.json",
                success: function (data) {
                    layer.addFeatureCollection(data);
                }
            });

        });        
    } else {
        layer = mizar.getLayerByName("Europe");    
        mizar.removeLayer(layer.ID);     
    }
});

$('#MizarCanvas').keypress(function (event) {
    var layer = mizar.getLayerByName("Montpellier");
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
