// Create Mizar
var mizar = new Mizar({
  canvas: "MizarCanvas",
  skyContext: {
    coordinateSystem: { geoideName: Mizar.CRS.Equatorial },
    compass: "compassDiv"
  }
});

mizar.addLayer({
  type: Mizar.LAYER.Hips,
  baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
  background: true
});
