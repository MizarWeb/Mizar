        /**
         * Get the value of the selected time and apply it to atmoshpere layer
         * @param {int} val hour [0-24] of the current date
         */
        function sliderChange(val) {
            var today = new Date();
            var day = today.getUTCDate();
            var month = today.getUTCMonth();
            var year = today.getUTCFullYear();
            var dateStr = day+"/"+month+"/"+year;
            document.getElementById('timeVal').innerHTML = dateStr+"  "+val+"h";
            var atmLayer = mizar.getLayerByName("Atmosphere");
            atmLayer.setParameter("time",getDate(today, val));            
        }

        /**
         * Set the hour from slideChange
         * @param {Date} date 
         * @param {int} hours 
         */
        function getDate(date, hours) {
            date.setHours(hours);
            return date;
        }

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

        // Add atmosphere layer
        mizar.addLayer({
            type: Mizar.LAYER.Atmosphere,
            exposure: 2.0,
            wavelength: [0.650,0.570,0.475],
            kr: 0.0025,
            km:0.0015,
            sunBrightness : 15.0,
            name: "Atmosphere",
            visible: true
        }, function(layerID){
            var atmLayer = mizar.getLayerByID(layerID);           
            atmLayer.setParameter("time",getDate(new Date(), 0));
        });