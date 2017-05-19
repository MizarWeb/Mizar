Mizar
=====

Virtual Globe library with WebGL

Mizar is a Javascript library developed by CNES. This library is mainly based on <a href="(https://github.com/TPZF/GlobWeb">GlobWeb library</a>  developed by Telespazio France using the WebGL standard. WebGL allows embedding 3D visualisation in a browser without any plugin and it is supported  on <a href="http://caniuse.com/#feat=webgl">recent versions of Mozilla Firefox and Google Chrome</a>.

This library is designed for developers who wants to integrate the core api of Mizar in their web page.

This core API provides functionnalities needed to :
- display GIS and astronomy data
- navigate through them
- connect to main interoperability OGC and IVOA protocols

The core API is a **Javascript** API.


## Getting started ##
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.


### Using github ###

```
npm install https://github.com/MizarWeb/Mizar.git
```

### Using npm repository ###

```
npm install mizar --only=production
```

## Architecture ##
The {@link Mizar Mizar API} is able to create and to handle one or two contexts at the same time.
A context is either a {@link module:Context.PlanetContext planet} or a {@link module:Context.SkyContext sky}. This means that Mizar can display :
+ a planet
+ a sky
+ a planet with the sky behind

A {@link module:Context context} contains :
+ a {@link module:Globe globe}
+ a {@link module:Crs coordinate reference system}
+ a {@link module:Navigation navigation}
+ a few GUI components 

## How to use it ##

### Embedding in a web page ###

*Integration of Mizar api script in HEADER*

```javascript
<script type="text/javascript" src="Mizar.min.js"></script>
```

*Declaration of Mizar canvas in BODY*

```javascript
<canvas
  id="MizarCanvas"
  style="border: none; margin: 0; padding: 0;">
</canvas>
```

**Note :** 
By default, the canvas will take the entire window. If you want to limit the canvas size, specify it with the attributes "height" and "width"

### Creating a basic Mizar instance ###
The only require element in Mizar constructor is the name of the canvas element.

```javascript
var mizar = new Mizar({
    canvas :"MizarCanvas"
  });
```

See tutorial {@tutorial getting-started-with-Earth|Getting start with Earth by creating a context}

**Important :**
The context can be created at the Mizar initialisation. Please look the the tutorial :
+ {@tutorial getting-started-with-Earth-init|Getting started with Earth without creating a context}
+ {@tutorial getting-started-with-EarthAndSky|Getting started with Earth & Sky wihtout creating contexts}

### Add a layer

Through the {@link Mizar#addLayer addLayer method}, you can create many kinds of {@link module:Layer layers} :

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

See the tutorial : {@tutorial adding-features|Adding features}

## Documentation ##
The API documentation can be found {@link Mizar here}

## Contributing

Please read [CONTRIBUTING.md](https://raw.githubusercontent.com/MizarWeb/Mizar/master/CONTRIBUTING.md) for details on the process for submitting pull requests to me.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/MizarWeb/Mizar/tags).


## License

This project is licensed under the GPLV3 License - see the [LICENSE](https://raw.githubusercontent.com/MizarWeb/Mizar/master/LICENSE.md) file for details.

## License-3rd

See the [LICENSES](http://github.com/MizarWeb/Mizar/tree/master/licenses-3rd/) directory for details.
