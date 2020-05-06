// Create Mizar instance
var mizar = new Mizar({
  canvas: "MizarCanvas",
  planetContext: {
    type: "Planet",
    coordinateSystem: { geoideName: Mizar.CRS.WGS84 }
  }
});

/**
 * Distance ground - camera
 * @param {float} distance distance in meter
 * @return {float} formatted distance in meter or km
 */
function displayDistance(distance) {
  var value;
  if (distance >= 10000) {
    distance = distance / 1000;
    value = distance.toFixed(2) + "km";
  } else {
    value = distance + "m";
  }
  return value;
}

/**
 * Subscribes to Changed distance to remove/add blue marble
 */
mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE, function (distance) {
  var distanceAction = 75000;
  document.getElementById("distance").innerHTML = displayDistance(distance);
  var ctx = mizar.getActivatedContext();
  var layer = ctx.getLayerByName("Blue Marble");
  if (distance < distanceAction && layer != null) {
    layer.setVisible(false);
  } else if (distance >= distanceAction && layer != null) {
    layer.setVisible(true);
  }
});

/**
 * Subscribe when blue marble is loading
 */
mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_START_LOAD, function (layer) {
  if (layer.name === "Blue Marble") {
    var loaderDiv = document.getElementById("loader");
    loaderDiv.style.display = "block";
  }
});

/**
 * Subscribe when blue marble stops to load
 */
mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.LAYER_END_LOAD, function (layer) {
  if (layer.name === "Blue Marble") {
    var loaderDiv = document.getElementById("loader");
    loaderDiv.style.display = "none";
  }
});

// create a Bing layer as background
mizar.addLayer(
  {
    type: Mizar.LAYER.Bing,
    imageSet: "AerialWithLabels",
    key: "Ar7-_U1iwNtChqq64tAQsOfO8G7FwF3DabvgkQ1rziC4Z9zzaKZlRDWJTKTOPBPV"
  },
  function (layerID) {
    mizar.setBackgroundLayerByID(layerID);
  }
);

// create a WMS on Blue Marble, by default visible with an opacity of 70%
mizar.addLayer({
  type: Mizar.LAYER.WMS,
  name: "Blue Marble",
  baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
  visible: true,
  opacity: 70
});
