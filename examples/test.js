// Create Mizar
var mizar = new Mizar({
  // canvas ID where Mizar is inserted
  canvas: "MizarCanvas",
  // create a sky context
  skyContext: {
    // Equtorial CRS
    coordinateSystem: { geoideName: Mizar.CRS.Equatorial }
  }
});

// Create a HIPS layer
mizar.addLayer({
  // the type of layer
  type: Mizar.LAYER.Hips,
  // the URL to access to data
  baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
  // set the layer as background
  background: true
});

mizar.addLayer({
  // the type of layer
  type: Mizar.LAYER.HipsCat,
  // the URL to access to data
  baseUrl: "http://axel.u-strasbg.fr/HiPSCatService/I/337/gaia",
  visible: true
});
