({
    baseUrl: "../src",
    name: "../build/almond",
    include: ['Mizar'],
    out: "../Mizar.min",
    optimize: "none",
    wrap: {
        startFile: '../build/start.frag',
        endFile: '../build/end.frag'
    },
    paths: {
        path: "../node_modules/path/path",
        fits: "../external/fits",
        "underscore-min": "../node_modules/underscore/underscore-min",
        jquery: "../node_modules/jquery/dist/jquery.min",
        "jquery.ui": "../node_modules/jquery-ui-dist/jquery-ui.min",
        wcs: "../external/wcs",
        samp: "../external/samp",
        string: "../node_modules/string/dist/string",
        gzip: "../external/gzip.min",
        saveAs: "../node_modules/file-saver/FileSaver.min",
        jszip: "../node_modules/jszip/dist/jszip.min",
        xmltojson: "../node_modules/xmltojson/lib/xmlToJSON.min",
        "wms-capabilities": "../node_modules/wms-capabilities/dist/wms-capabilities",
        moment : "../node_modules/moment/min/moment-with-locales.min"
    },
    shim: {
        "underscore-min": {
            exports: '_',
            init: function () {
                return _.noConflict();
            }
        },
        jquery: {
            exports: "$"
        }
    },
    uglify2: {
        output: {
            beautify: false
        },
        compress: {
            unsafe: false,
            dead_code: false,
        },
        warnings: true,
        mangle: true
    }
})
