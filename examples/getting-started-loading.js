// Create Mizar instance
var mizar = new Mizar({
  canvas: "MizarCanvas",
  // initialize a planet context
  planetContext: {
    coordinateSystem: { geoideName: Mizar.CRS.WGS84 }
  },
  // initialize a sky context
  skyContext: {
    coordinateSystem: { geoideName: Mizar.CRS.Equatorial }
  }
});

// Select the planet context to work on it
mizar.setActivatedContext("Planet");
// Add a WMS layer on the planet
mizar.addLayer(
  {
    name: "Blue Marble",
    type: "WMS",
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
    background: true
  },
  function (layerID) {
    // wait 5s
    sleepFor(5000);
    function sleepFor(sleepDuration) {
      var now = new Date().getTime();
      while (new Date().getTime() < now + sleepDuration) {
        /* do nothing */
      }
    }
  }
);

// subscribe to baseLayersReady to display the sky only when the Earth is ready.
mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.BASE_LAYERS_READY, function () {
  // hide the spinner
  var loaderDiv = document.getElementById("loader");
  loaderDiv.style.display = "none";

  // show the canvas
  var mizarDiv = document.getElementById("MizarCanvas");
  mizarDiv.style.display = "block";

  // show the logo
  var logoDiv = document.getElementById("logo");
  logoDiv.style.display = "block";

  mizar.setActivatedContext("Sky");

  // Add a Hips layer on the sky as background
  mizar.addLayer({
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
    background: true
  });
});

// subscribe to baseLayersError to get the loading error.
mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.BASE_LAYERS_ERROR, function () {
  // Planet cannot be loaded, hide it and loads the sky
  mizar.getPlanetContext().disable();
  mizar.getSkyContext().enable();
});
