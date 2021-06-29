const mizar = new Mizar({
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

let layerMontpellier;
mizar.addLayer(
  {
    name: "Montpellier",
    type: Mizar.LAYER.WMS,
    baseUrl: "http://80.158.6.138/mapserv?map=WMS_PALAVAS",
    layers: "S2_PALAVAS",
    transparent: true
  },
  function (layerID) {
    layerMontpellier = mizar.getLayerByID(layerID);
  }
);

let layerEurope;
mizar.addLayer(
  {
    name: "Europe",
    type: Mizar.LAYER.GeoJSON
  },
  function (layerID) {
    // get the empty layer
    layerEurope = mizar.getLayerByID(layerID);

    $.ajax({
      url: "data/europe.json",
      success: function (data) {
        layerEurope.addFeatureCollection(data);
      }
    });
  }
);

$("#montpellier").change(function () {
  const montpellier = $(this).val();
  const checked = document.getElementById("montpellier").checked;
  if (layerMontpellier) {
    layerMontpellier.setVisible(checked);
  }
});

$("#europe").change(function () {
  const europe = $(this).val();
  const checked = document.getElementById("europe").checked;
  if (layerEurope) {
    layerEurope.setVisible(checked);
  }
});
