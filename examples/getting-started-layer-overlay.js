var mizar = new Mizar({
  canvas: "MizarCanvas",
  planetContext: {
    coordinateSystem: { geoideName: Mizar.CRS.WGS84 }
  }
});

mizar.createStats({ element: "fps", verbose: false });

mizar.addLayer({
  type: Mizar.LAYER.WMS,
  name: "Blue Marble",
  baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
  visible: true,
  background: true
});

mizar.addLayer({
  type: Mizar.LAYER.GroundOverlay,
  image: "data/mizar.jpg",
  quad: [
    [-1, 45],
    [-2, 46],
    [0, 48],
    [1, 47]
  ],
  opacity: 50,
  flipY: false
});

mizar.addLayer({
  type: Mizar.LAYER.GroundOverlay,
  image: "data/mizar.jpg",
  quad: [
    [10, 40],
    [18, 40],
    [15, 48],
    [10, 45]
  ]
});
