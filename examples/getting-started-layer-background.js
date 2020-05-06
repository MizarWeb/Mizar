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
  visible: true
});

mizar.addLayer({
  name: "Bing",
  type: Mizar.LAYER.Bing,
  imageSet: "AerialWithLabels",
  key: "Ar7-_U1iwNtChqq64tAQsOfO8G7FwF3DabvgkQ1rziC4Z9zzaKZlRDWJTKTOPBPV"
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_BACKGROUND_CHANGED, function (layer) {
  document.getElementById("message").innerHTML = "background has changed: " + layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_BACKGROUND_ADDED, function (layer) {
  document.getElementById("message").innerHTML = "background has been added: " + layer.name;
});

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_ADDED, function (layer) {
  document.getElementById("message").innerHTML = "added layer: " + layer.name;
});

$("#selectedEarth").change(function () {
  var earth = $(this).val();
  mizar.setBackgroundLayer(earth);
});
