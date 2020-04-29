var mizar = new Mizar({
  canvas: "MizarCanvas",
  planetContext: {
    coordinateSystem: {
      geoideName: Mizar.CRS.WGS84,
      projectionName: Mizar.PROJECTION.Mercator
    },
    navigation: {
      inertia: true,
      mouse: {
        zoomOnDblClick: true,
        zoomOptions: {
          distance: 1000000
        }
      }
    },
    lighting: false,
    tileErrorTreshold: 3
  }
});

mizar.createStats({ element: "fps", verbose: false });

mizar.addLayer({
  name: "Blue Marble",
  type: Mizar.LAYER.WMS,
  baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
  background: true,
  visible: true
});

mizar.addLayer(
  {
    type: Mizar.LAYER.WCSElevation,
    name: "Elevation",
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_SRTM",
    coverage: "SRTM",
    version: "1.0.0",
    minElevation: -32000,
    scale: 2
  },
  function (layerID) {
    mizar.setBaseElevationByID(layerID);
  }
);

mizar.addLayer(
  {
    type: Mizar.LAYER.TileWireframe,
    outline: true,
    visible: true
  },
  function (wireFrameID) {
    var wireframeLayer = mizar.getLayerByID(wireFrameID);
    $("#wireframeVisibility").change(function () {
      var isOn = $(this).is(":checked");
      wireframeLayer.setVisible(isOn);
    });
  }
);

mizar.addLayer(
  {
    type: Mizar.LAYER.GeoJSON,
    visible: true
  },
  function (layerID) {
    var styleN = mizar.UtilityFactory.create(Mizar.UTILITY.CreateStyle, {
      label: "NORTH",
      pointMaxSize: 4000
    });

    var styleS = mizar.UtilityFactory.create(Mizar.UTILITY.CreateStyle, {
      label: "SOUTH",
      pointMaxSize: 4000
    });

    var layer = mizar.getLayerByID(layerID);
    layer.addFeature({
      geometry: {
        type: "Point",
        coordinates: [0, 45]
      },
      properties: {
        style: styleN
      }
    });
    layer.addFeature({
      geometry: {
        type: "Point",
        coordinates: [0, -45]
      },
      properties: {
        style: styleS
      }
    });
  }
);

var featureCollection = null;
var afterLoadVector = function (data) {
  console.log("Hello JC!!!");
  featureCollection = data;
};

// Add some vector layer
mizar.addLayer(
  {
    type: Mizar.LAYER.GeoJSON,
    style: mizar.UtilityFactory.create(Mizar.UTILITY.CreateStyle, {
      fillColor: [1, 1, 1, 1],
      strokeColor: [0.3, 0.3, 0.3, 1],
      fill: false
    }),
    url: "data/land.json",
    callback: afterLoadVector,
    visible: true
  },
  function (layerID) {
    var vectorLayer = mizar.getLayerByID(layerID);
    $("#selectProjection").change(function () {
      // Reset vector layer features
      vectorLayer.removeAllFeatures();

      var coordinateSystem = $(this).val();
      mizar.setCrs({
        geoideName: Mizar.CRS.WGS84,
        projectionName: coordinateSystem
      });

      vectorLayer.addFeatureCollection(featureCollection);
    });

    $("#vectorVisibility").change(function () {
      var isOn = $(this).is(":checked");
      vectorLayer.setVisible(isOn);
    });
  }
);

var cvs = document.getElementById("MizarCanvas");

// Test to check inverse transformation for each coordinate system
cvs.onclick = function (event) {
  var lonlat = mizar.getActivatedContext().getLonLatFromPixel(event.layerX, event.layerY);
  if (lonlat) {
    var pixel = mizar.getActivatedContext().getPixelFromLonLat(lonlat[0], lonlat[1]);
  }
};
