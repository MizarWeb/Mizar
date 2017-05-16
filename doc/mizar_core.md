# MIZAR
*Use of core API*

# 1. Introduction

This document is designed for developers who wants to integrate the core api of Mizar in their web page.

This core API provides functionnalities needed to :
- display gis and astronomy data
- navigate through them
- connect to main interoperability gis & astronomy protocols

The core API is a **Javascript** API.


# 2. Embedding in a web page

*Integration of Mizar core api script in HEADER*

```javascript
<script type="text/javascript" src="Mizar.min.js"></script>
```


*Declaration of Mizar canvas in BODY*

```javascript
<canvas
  id="MizarCanvas"
  style="border: none; margin: 0; padding: 0;"
  width="1000"
  height="1000">
</canvas>
```

*If you want to display running information like fps,etc.*

```javascript
<div id="fps"></div>
```

# 3. Javascript API

## 3.1. Creating a basic Mizar instance

The only require element in Mizar constructor is the name of the canvas element.

```javascript
var mizar = new Mizar({
    canvas :"MizarCanvas"
  });
```

**Important :**
Mizar's objects can be created through dedicated constructors, reachables from the mizar object.


### 3.2. Create a context

#### 3.2.1. Planet context

The *ContextFactory* is used to create various context (Planet or Sky). See parameters in the api documentation.


```javascript
var planetContext =  mizar.ContextFactory.create(
    mizar.CONTEXT.Planet,
    {mode:"3d"});
```

:fireworks: The created context is immediately associated to the Mizar object.


The planet context can be directly set creating the mizar object, with the syntax :
```javascript
var mizar = new Mizar({
    canvas :"MizarCanvas",
    planetContext : {
      mode:"3d"
    }
});
```

#### 3.2.1. 2D Planet context

The projection is defined in planet context parameters.

```javascript
var mizar = new Mizar({
  canvas:"MizarCanvas",
  planetContext : {
    mode:"2d",
    lighting: false,
    projection: "Mercator",
    navigation: {
      mouse: {
        zoomOnDblClick: true
      }
    }
  }
});
```

#### 3.2.1. Sky context

```javascript
var skyContext = mizar.ContextFactory.create(
    mizar.CONTEXT.Sky
);
```

### 3.3 Add a Layer

Through the LayerFactory, you can create many kinds of layers :

- **OpenSearch layer**<br/>
Must be used if you want to display overlays with a number of records > 10000. The openSearch layer allows clients to search data on the server according to Healpix index and order numbers.

- **GeoJson layer (Vector)**<br/>
Must be used if you want to load the whole file in memory to display overlay. Since it's loaded in memory, there could be some performance issues when the number of loaded features is more than 10000.

- **Sky layer**<br/>Must be used to display only images on sky context :
  - Hips
  - HipsFits
  - Moc

- **Grid coordinates (CoordinateGrid)**<br/>
Currently there are two coordinate systems supported : Equatorial & Galactic.

- **Planet layers**<br/>
Layers which used to represent planet raster data, based on ogc  services, or data providers :
  - WMS
  - WMTS
  - WMS elevation
  - WCS elevation
  - TileWireframe
  - Planet
  - Ground overlay
  - Atmosphere
  - Bing
  - Osm

Adding WMS layer
```javascript
var bmLayer = mizar.LayerFactory.create(
    mizar.LAYER.WMS,
    {
      baseUrl : "http://demonstrator.telespazio.com/wmspub",
      layers  : "BlueMarble,esat"
    });
mizar.setPlanetBaseImagery( bmLayer );
```

Adding elevation
```javascript
var elevationLayer = mizar.LayerFactory.create(
  mizar.LAYER.WCSElevation,
  {
    baseUrl:"http://demonstrator.telespazio.com/wcspub",
    coverage: "GTOPO",
    version: "1.0.0"
  });
mizar.setBaseElevation( elevationLayer );
```

### 3.4. Navigation

#### 3.4.1. Zoom to a given location on planet

To zoom to a given location with Mizar, use the following method

```javascript
mizar.planetContext.zoomTo(geoPos,distance,duration, tilt,callback);
```
- **geoPos** Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
- **distance** Final zooming distance in meters (Int)
- **duration** Duration of animation in milliseconds (Int)
- **tilt** Defines the tilt in the end of animation (Int)
- **callback** Callback on the end of animation (Function)

#### 3.4.2 Rotate planet

```javascript
mizar.planetContext.rotate(dx,dy);
```
 - **dx** Window delta x (Int)
 - **dy** Window delta y (Int)

#### 3.4.3 Zoom to a given location on sky
 ```javascript
mizar.skyContext.zoomTo(geoPos,fov,duration,callback);
```
- **geoPos** Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
- **fov** Final zooming fov in degrees
- **duration** Duration of animation in milliseconds
- **callback** Callback on the end of animation
