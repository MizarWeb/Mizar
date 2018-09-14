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

//  Select the sky context to work on it
mizar.setActivatedContext("Sky");

// Add a Hips layer on the sky as background
mizar.addLayer({
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
    background:true
});

// Select the planet context to work on it
mizar.setActivatedContext("Planet");
// Add a WMS layer on the planet
mizar.addLayer({
    "name": "Blue Marble",
    "type": "WMS",
    "baseUrl": "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
    "background": true
});

// subscribe to baseLayersReady to display the Earth only when the sky is ready.
mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.BASE_LAYERS_READY, function () {

    // Planet is loaded, now we can play with it to display/hide it when a key is hit.
    document.getElementById("playWithIt").innerHTML="Hit a key to show/hide the Earth."
    window.onkeypress = function (event) {
        if (mizar.getPlanetContext().isEnabled()) {
            mizar.getPlanetContext().disable();
        } else {
            mizar.getPlanetContext().enable();
        }
    }
});

// subscribe to baseLayersError to get the loading error.
mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.BASE_LAYERS_ERROR, function () {
    // Planet cannot be loaded, hide it and loads the sky
    mizar.getPlanetContext().disable();
    mizar.getSkyContext().enable();
});
