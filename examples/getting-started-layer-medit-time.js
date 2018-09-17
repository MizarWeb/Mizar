
        // Create Mizar
        var mizar = new Mizar({
            // the canvas ID where Mizar is inserted
            canvas: "MizarCanvas",
            configuration: {
                attributionHandler: {
                    element: "myGlobeAttributions"
                }
            },            
            // define a planet context
            planetContext: {
                // the CRS of the Earth
                coordinateSystem: {
                    "geoideName": Mizar.CRS.WGS84
                }
            }
        });

        function selectedDate() {
            document.getElementById('calendar').style.display="none";
            var year = document.getElementById('year');
            var yearTxt = year.value;
            var month = document.getElementById('month');
            var monthTxt = month.value; 
            var day = document.getElementById('day');
            var dayTxt = day.value;                        
            var dateStr = yearTxt+"-"+monthTxt+"-"+dayTxt;
            var date = new Date(dateStr);
            var ctx = mizar.getActivatedContext();
            ctx.setTime(date);
            var details = {
                date: date,
                display: dateStr,
                period: {
                    from:date,
                    to:date
                }
            };            
            ctx.publish(
                Mizar.EVENT_MSG.GLOBAL_TIME_CHANGED,
                details
            ); 
            ctx.publish(
                Mizar.EVENT_MSG.GLOBAL_TIME_SET,
                details.date
            );                         
        };

        mizar.getActivatedContext().subscribe(Mizar.EVENT_MSG.GLOBAL_TIME_SET,function(ctx) {
            if( ctx.mode) {
                document.getElementById('calendar').style.display="block";   
            } else {
                document.getElementById('calendar').style.display="none";   
            }                   
        })

        // Add a WMS layer as background
        mizar.addLayer({
            type: Mizar.LAYER.WMS,
            name: "Blue Marble",
            baseUrl: "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
            background: true
        });

        mizar.addLayer({
            type: Mizar.LAYER.WMS,
            name: "Medit",
            baseUrl: "http://80.158.6.138/mapserv?map=WMS_MEDIT",
            layers: "Mediterranean",
            autoFillTimeTravel : true,
            transparent:true
        }, function(layerID) {
            var layer = mizar.getLayerByID(layerID);
            layer.setVisible(true);
        });        