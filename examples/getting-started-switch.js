var mode = "equatorial";

// Create Mizar
var mizar = new Mizar({
  canvas: "MizarCanvas",
  configuration: {
    positionTracker: {
      element: "myPosTracker"
    }
  },
  skyContext: {
    coordinateSystem: { geoideName: Mizar.CRS.Equatorial },
    continuousRendering: true
  }
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

$("#2mass").change(function () {
  var mass = $(this).val();
  var checked = document.getElementById("2mass").checked;
  if (checked) {
    mizar.addLayer({
      name: mass,
      type: Mizar.LAYER.Hips,
      baseUrl: "http://alasky.u-strasbg.fr/2MASS/J/",
      visible: true
    });
  } else {
    var layer = mizar.getLayerByName(mass);
    mizar.removeLayer(layer.ID);
  }
});

mizar.createStats({ element: "fps", verbose: false });

var dssLayerID;

mizar.addLayer(
  {
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/DSS/DSSColor"
  },
  function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
    dssLayerID = layerID;
  }
);

var irisLayerID;
mizar.addLayer(
  {
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/IRISColor",
    numberOfLevels: 1
  },
  function (layerID) {
    irisLayerID = layerID;
  }
);

window.onkeypress = function (event) {
  if (mode === "equatorial") {
    mizar.setBackgroundLayerByID(irisLayerID);
    mode = "galactic";
  } else {
    mizar.setBackgroundLayerByID(dssLayerID);
    mode = "equatorial";
  }
  //mizar.getActivatedContext().getTileManager().setFreeze(!mizar.getActivatedContext().getTileManager().getFreeze());
};
