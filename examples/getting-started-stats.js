// Create Mizar
var mizar = new Mizar({
    canvas: "MizarCanvas",
    configuration: {
        attributionHandler: {
            element: "myGlobeAttributions"
        },
        positionTracker: {
            element: "myPosTracker"
        }
    },    
    skyContext: {
        coordinateSystem: { geoideName: Mizar.CRS.Equatorial },
        compass: "compassDiv"
    }
});

mizar.createStats({ element: 'fps', verbose: false });

mizar.addLayer({
    type: Mizar.LAYER.Hips,
    baseUrl: "http://alasky.unistra.fr/DSS/DSSColor",
    background: true
});