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
  background: true
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

mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_REMOVED, function (layer) {
  document.getElementById("message").innerHTML = "removed layer: " + layer.name;
});

$("#DSS").change(function () {
  var DSS = $(this).val();
  var checked = document.getElementById("DSS").checked;
  if (checked) {
    mizar.addLayer(
      {
        name: "DSS",
        type: Mizar.LAYER.Hips,
        baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
        visible: true
      },
      function (layerID) {
        //var layer = mizar.getLayerByID(layerID);
        //layer._ready = true;
        //mizar.getActivatedContext().globe.tileManagers[layer.tiling.coordinateSystem.getGeoideName()].setImageryProvider(layer);
      }
    );
  } else {
    layer = mizar.getLayerByName(DSS);
    mizar.removeLayer(layer.ID);
  }
});

$("#2MASS").change(function () {
  var MASS = $(this).val();
  var checked = document.getElementById("2MASS").checked;
  if (checked) {
    mizar.addLayer({
      name: "2MASS",
      type: Mizar.LAYER.Hips,
      baseUrl: "http://alasky.u-strasbg.fr/2MASS/H/",
      visible: true,
      transparent: true,
      opacity: 0.5
    });
  } else {
    layer = mizar.getLayerByName(MASS);
    mizar.removeLayer(layer.ID);
  }
});
