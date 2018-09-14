        // Create Mizar
        var mizar = new Mizar({
            // the canvas ID where Mizar is inserted
            canvas: "MizarCanvas",
            // define a planet context
            planetContext: {
                // the CRS of the Earth
                coordinateSystem: {
                    "geoideName": Mizar.CRS.WGS84
                }
            }
        });


        // Add a WMS layer as background
        mizar.addLayer({
            type: Mizar.LAYER.WMS,
            name: "Blue Marble",
            baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
            background: true
        });
