var mizar = new Mizar({
    canvas: "MizarCanvas",
    skyContext: {
        coordinateSystem: { geoideName: Mizar.CRS.Equatorial }
    }
});

mizar.addLayer({
    name: "IRIS",
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/IRISColor",
    background:true
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_BACKGROUND_CHANGED, function(layer){
    document.getElementById("message").innerHTML="background has changed: "+layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_BACKGROUND_ADDED, function(layer){
    document.getElementById("message").innerHTML="background has been added: "+layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_ADDITIONAL_ADDED, function(layer){
    document.getElementById("message").innerHTML="added layer: "+layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_REMOVED, function(layer){
    document.getElementById("message").innerHTML="removed layer: "+layer.name;
});


$("#DSS").change(function () {
    var DSS = $(this).val();
    var checked = document.getElementById('DSS').checked;
    if (checked) {
        mizar.addLayer({
            name:"DSS",
            type: Mizar.LAYER.Hips,
            baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
            visible: true
        });       
    } else {
        layer = mizar.getLayerByName(DSS);    
        mizar.removeLayer(layer.ID);        
    }
});

