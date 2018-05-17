var context = {
    "layers": [
       {
            "type": "WCSElevation",
            "name": "Elevation",
            "baseUrl": "http://80.158.6.138/mapserv?map=WMS_SRTM",
            "coverage": "SRTM",
            "version": "1.0.0",
            "minElevation": -32000,
            "scale": 50
        },
        {
            "name": "Blue Marble",
            "type": "WMS",
            "baseUrl": "http://80.158.6.138/mapserv?map=WMS_BLUEMARBLE",
            "visible": true,
            "background": true
        },
        /*{
            "name": "Niger",
            "type": "WMS",
            "baseUrl": "http://80.158.6.138/mapserv?map=WMS_NIGER",
            "layers": "NIGER_SCENE",
            "visible": true,
            "background": false,
            "transparent":true,
            "format":"image/png"
        },*/
        {
            "category": 'POYANG',
            "type": 'WMS',
            "baseUrl": 'http://80.158.6.138/mapserv?map=WMS_POYANG',
            "visible": true,
            "background": false,
            "transparent": true,
            "format": 'image/png',
            "layers": 'SPOT4,SPOT5,LANDSAT2000',
            "autoFillTimeTravel" : true
        },
        {
            "category": 'POYANG',
            "type": 'WMS',
            "baseUrl": 'http://80.158.6.138/mapserv?map=WMS_POYANG',
            "visible": true,
            "background": false,
            "transparent": true,
            "format": 'image/png',
            "layers": 'SUBMERSION',
            "zIndex": 11,
            "autoFillTimeTravel" : true
        },
        {
            "name": "Palavas_Fond",
            "type": "WMS",
            "baseUrl": "http://80.158.6.138/mapserv?map=WMS_PALAVAS",
            "layers": "S2_PALAVAS",
            "visible": true,
            "background": false,
            "transparent":true,
            "format":"image/png"
        },
        {
            "name": "Palavas",
            "type": "WMS",
            "baseUrl": "http://80.158.6.138/mapserv?map=WMS_PALAVAS",
            "layers": "DEM_PALAVAS",
            "visible": true,
            "styles" : "1.5m",
            "background": false,
            "transparent":true,
            "format":"image/png"
        }/*,
       {
            "category": "Other",
            "type": "Atmosphere",
            "exposure": 1.4,
            "wavelength": [ 0.56, 0.66, 0.78 ],
            "name": "Atmosphere",
            "lightDir": [ 0, 1, 0 ],
            "visible": false
        },
        {
            "category": "Other",
            "type": "TileWireframe",
            "name": "Coordinates Grid",
            "outline": true,
            "visible": true
        }*/
    ]};

    var osLayer = {
        "category": "PEPS",
        "type": "OpenSearch",
        "baseUrl": "https://peps.cnes.fr/resto/api/collections/S1/describe.xml",
        "color": "yellow",
        "opacity": 20,
        "visible": true
    };

    var options = {
        "category": "SCO",
        "type": "GeoJSON",
        "pointMaxSize": 40,
        "visible": true,
        "opacity": 100,
        "pickable": true,
    };
    
    var thematics = [
        { "id" : "CLIMATE", "name" : "Climate", "color" : "#008777", "logo" : "images/thematics/CLIMATE.png" },
        { "id" : "WATER", "name" : "Water", "color" : "#0082C2", "logo" : "images/thematics/WATER.png" },
        { "id" : "OCEAN", "name" : "Ocean", "color" : "#004D7E", "logo" : "images/thematics/OCEAN.png" },
        { "id" : "AIR", "name" : "Air", "color" : "#8BB7E2", "logo" : "images/thematics/AIR.png" },
        { "id" : "LAND", "name" : "Land", "color" : "#94C11F", "logo" : "images/thematics/LAND.png" },
        { "id" : "HEALTH", "name" : "Health", "color" : "#009D45", "logo" : "images/thematics/HEALTH.png" },
        { "id" : "DISASTER", "name" : "Natural Disasters", "color" : "#E9483F", "logo" : "images/thematics/DISASTER.png" }
    ];
    var climateData = [
            {
                "thematicId": "WATER",
                "type": "FeatureCollection",
                "features": [
                    {
                        "geometry": { "type": "Point", "coordinates": [116.217 , 29.15] },
                        "type": "Feature",
                        "properties": { "name": "Poyang lake", "title": "Poyang lake", "description": "Poyang lake" }
                    }
                ]
            },
            {
                "thematicId": "HEALTH",
                "type": "FeatureCollection",
                "features": [
                    {
                        "geometry": { "type": "Point", "coordinates": [114.217 , 28.15] },
                        "type": "Feature",
                        "properties": { "name": "Poyang lake", "title": "Poyang lake", "description": "Poyang lake" }
                    }
                ]
            },
            {
                "thematicId": "LAND",
                "type": "FeatureCollection",
                "features": [
                    {
                        "geometry": { "type": "Point", "coordinates": [112.217 , 30.15] },
                        "type": "Feature",
                        "properties": { "name": "Poyang lake", "title": "Poyang lake", "description": "Poyang lake" }
                    }
                ]
            },
            {
                "thematicId": "DISASTER",
                "type": "FeatureCollection",
                "features": [
                    {
                        "geometry": { "type": "Point", "coordinates": [117.217 , 28.15] },
                        "type": "Feature",
                        "properties": { "name": "Poyang lake", "title": "Poyang lake", "description": "Poyang lake" }
                    }
                ]
            }
            
        ];

var mizarConf = {
    canvas:"TO_DEFINE_IN_CODE",
    configuration: {
        "mizarBaseUrl":"localhost/js/MizarWidget/external/Mizar/examples",
        "debug":false,
        "isMobile":false,
        "positionTracker":{position: "bottom"},
        "registry":false,
        "proxyUse":false,
        "proxyUrl":""
    },
    planetContext : {
        "category": "Planets",
        "type": "Planet",
        "name": "Earth",
        "coordinateSystem": {
            "geoideName": "TO_DEFINE_IN_CODE"
        },
        "visible": true
    }
};

var demMontBlanc = {
    "type": "WCSElevation",
    "name": "Elevation Mont Blanc",
    "baseUrl": "http://80.158.6.138/mapserv?map=WMS_MONT_BLANC_ELEV",
    "coverage": "MNT_Mont_Blanc",
    "version": "1.0.0",
    "minElevation": -32000,
    "scale": 50
};
