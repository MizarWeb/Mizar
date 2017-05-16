Mizar
=====

Virtual Globe library with WebGL

Mizar is a Javascript library developed by CNES. This library is mainly based on <a href="(https://github.com/TPZF/GlobWeb">GlobWeb library</a> developed by Telespazio France using the WebGL standard. WebGL allows embedding 3D visualisation in a browser without any plugin and it is supported on <a href="http://caniuse.com/#feat=webgl">recent versions of Mozilla Firefox and Google Chrome</a>.
The main focus of Mizar is to provide a high performance 3D library for visualizing geospatial data for astronomicals and planetaries datum.

Mizar supports the following features:
 * Base raster layer using WMS, WMTS, Bing Map REST API, WorldWind Tile Service, HIPS
 * Manipulation of vector data through GeoJSON interface: add/remove/select/style modification
 * Overlay raster layer on top of existing base layers
 * High performance vector rendering  : automatic tiling of vector data

## Getting started ##
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.


### Using github ###

```
npm install https://github.com/RegardsOss/MizarLib.git
```

### Using npm repository ###

```
npm install mizar --only=production
```

## How to use it ##

### Quick start ###
Pre-build stable version can be downloaded here :<br>
<a href="http://github.com/RegardsOss/Mizar/mizar.min.js">Mizar lite</a>

See the following example for basic usage.
<a href="https://raw.github.com/RegardsOss/Mizar/tree/master/examples/index.html">List of examples</a>

Internally, MIZAR-lite is using Standard Asynchronous Module Definition (AMD) modules.
You can also use MIZAR-lite using any AMD loader such as RequireJS or Dojo.

See the following example for using GlobWeb with Require.js :
<a href="https://raw.github.com/RegardsOss/Mizar/tree/master/demo/client">Demo with Require.js</a>

## Documentation ##
<a href="http://raw.github.com/RegardsOss/Mizar/tree/master/doc_api/index.html">API Documentation</a>  

## Build ##

GlobWeb use Require.js optimizer to build a minified version of Mizar:

```
npm install mizar
npm run build
```

## Contributing

Please read [CONTRIBUTING.md](https://raw.githubusercontent.com/RegardsOss/Mizar/master/CONTRIBUTING.md) for details on the process for submitting pull requests to me.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/RegardsOss/Mizar/tags).


## License

This project is licensed under the GPLV3 License - see the [LICENSE](https://raw.githubusercontent.com/RegardsOss/Mizar/master/LICENSE) file for details.

## License-3rd

See the [LICENSES](http://github.com/RegardsOss/Mizar/tree/master/licenses-3rd/) directory for details.
