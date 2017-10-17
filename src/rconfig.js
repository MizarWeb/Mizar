/*******************************************************************************
 * Copyright 2017 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
 *
 * This file is part of MIZAR.
 *
 * MIZAR is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MIZAR is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
require.config({
    baseUrl: "../src",
    name: "Mizar",
    include: ['Mizar'],
    insertRequire: ['Mizar'],
    out: "../build/generated/Mizar.min.js",
    optimize: "uglify2",
    onBuildWrite: function (name, path, contents) {
        contents = contents
            .replace(/define\s*\([^{]*?{/, "")
            .replace(/\s*return\s+[^\}]+(\}\);[^\w\}]*)$/, "")
            .replace(/\}\);[^}\w]*$/, "");

        return contents;
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
        xmltojson: "../node_modules/xmltojson/lib/xmlToJSON.min"
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
    }
});
