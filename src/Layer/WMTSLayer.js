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
/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

define(['../Utils/Utils', './AbstractRasterLayer', '../Utils/Constants','../Tiling/GeoTiling'],
    function (Utils, AbstractRasterLayer, Constants, WMTSTiling) {
        /**
         * Configuration parameters to query a Web Map Tile Service (WMTS)
         * @typedef {AbstractRasterLayer} AbstractRasterLayer.wmts_configuration
         * @property {string} [version = "1.0.0"] WMTS version
         * @property {string} layer - basic unit of geographic information that may be requested as a map from a server
         * @property {string} matrixSet - The name of pyramidal images
         * @property {int} startLevel - Start level of the index
         * @property {string} [style] - Styled Layers Descriptor
         */
        /**
         * @name WMTSLayer
         * @class
         *    Creates a layer for imagery data using WMTS protocol.
         *    <br/>
         *    WMTS protocol provides tiles with a resolution of <i>tilePixelSize</i><br/>
         *    based on a GeoTiling(4, 2)<br/>
         *    <img src="../doc/images/wmts_tile.png"/><br/>
         *    <br/
         *    Example of a WMTS request:
         *    <code>
         *            http://example.com/wmts?LAYER=MyLayer1,MyLayer2&
         *            EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&
         *            VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&
         *            TILEMATRIXSET=PM&TILEMATRIX=18&TILEROW=90241&TILECOL=132877&
         *    </code>
         *    <br/><br/>
         *    The parameters of a WMTS server are the following:
         *    <ul>
         *        <li><b>TILEMATRIXSET</b>: The name of pyramidal images</li>
         *        <li><b>TILEMATRIX</b>: The name of the matrix that contains the tile</li>
         *        <li><b>TILEROW</b>: The line number from the top left corner from the tile</li>
         *        <li><b>TILECOL</b>: The column number from the top left corner from the tile</li>
         *    </ul>
         *    <img src="../doc/images/wmts_pixel.png"/>
         *
         * @augments AbstractRasterLayer
         * @param {AbstractRasterLayer.configuration} options - WMTS configuration
         * @property {int} [tilePixelSize = 256] - tile in pixels
         * @property {int} [numberOfLevels = 21] - number of levels
         * @property {string} [version = "1.0.0"] - WMS version
         * @property {string} [transparent]
         * @property {string} [time] - Time dimension
         * @property {string} [format = "image/png"] - output image format
         * @constructor
         * @memberOf module:Layer
         * @see {@link http://www.opengeospatial.org/standards/wmts WMTS} standard
         * @see {@link http://www.opengeospatial.org/standards/sld SLD} standard
         */
        var WMTSLayer = function (options) {

            //_computeBaseUrlAndCapabilities.call(this, options);

            //options.tilePixelSize = options.tilePixelSize || 256;
            //options.tiling = new WMTSTiling(2, 1);
            //options.numberOfLevels = options.numberOfLevels || 21;


            AbstractRasterLayer.prototype.constructor.call(this, Constants.LAYER.WMTS, options);

            //this.tiling = new WMTSTiling();
            //this.getTileBaseUrl = null;

            //if (options.byPass === true) {
                // Special, options still filled from getCapabilities !
                this.getTileBaseUrl = _queryImage.call(this, this.getBaseUrl(), options);
            //    this.numberOfLevels = options.tileMatrix.length;
            //    this.tiling.update(options.tileMatrix);
            //    if ((options.getCapabilitiesTileManager !== null) && (typeof options.getCapabilitiesTileManager !== "undefined")) {
            //        options.getCapabilitiesTileManager.setImageryProvider(this);
            //    }
            //
            //} else {
            //    // Check getCapabilities
            //    this.getCapabilitiesEnabled = true;
            //    this.afterLoad = options.afterLoad;
            //    // manage get capabilities
            //    this.loadGetCapabilities(this.manageCapabilities,this.getGetCapabilitiesUrl(),this);
            //}
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractRasterLayer, WMTSLayer);

        /**************************************************************************************************************/

        function _queryImage(baseUrl, options) {
            var url = baseUrl;
            url = Utils.addParameterTo(url, "service","wmts");
            url = Utils.addParameterTo(url, "version",options.version || "1.0.0");
            url = Utils.addParameterTo(url,"request", "GetTile");
            url = Utils.addParameterTo(url,"layer", options.layer);
            url = Utils.addParameterTo(url, "tilematrixset", "WGS84");
//            url = Utils.addParameterTo(url, "tilematrixset", options.tilematrixset);

            if (options.style) {
                url = Utils.addParameterTo(url, "style",options.style);
            }
            url = Utils.addParameterTo(url, "format", options.hasOwnProperty('format') ? options.format : 'image/png');
            if (options.time) {
                url = Utils.addParameterTo(url, "time", options.time);
            }
            return url;
        }

        //function _computeBaseUrlAndCapabilities(options) {
        //    if(options.getCapabilities) {
        //        options.baseUrl = Utils.computeBaseUrlFromCapabilities(options.getCapabilities,["service","request","version"]);
        //    } else if(options.baseUrl) {
        //        options.getCapabilities = _computeCapabilitiesFromBaseUrl.call(this, options.baseUrl, options);
        //    } else {
        //        throw new ReferenceError('No URL to access to the WMS server is defined', 'WMSLayer.js');
        //    }
        //}

//        function _computeCapabilitiesFromBaseUrl(baseUrl, options) {
//            var getCapabilitiesUrl = baseUrl;
//            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WMTS");
//            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
//            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "version", options.hasOwnProperty('version') ? options.version : '1.0.0.0');
//            return getCapabilitiesUrl;
//        }
//
//        WMTSLayer.prototype.getMatrixSet = function(json,name) {
//            var matrix = json.Capabilities.Contents.TileMatrixSet;
//            if ( (matrix.length === null) || (typeof matrix.length === "undefined")) {
//                // only one !
//                if (matrix.Indentifier["_text"] === name) {
//                    return matrix;
//                }
//            } else {
//                for (var i=0;i<matrix.length;i++) {
//                    if (matrix[i].Identifier["_text"] === name) {
//                        return matrix[i];
//                    }
//                }
//            }
//            return null;
//        };
//        /**
//         * When getCapabilities is loading, manage it
//         * @function manageCapabilities
//         * @memberof WMTSLayer#
//         * @param json Json object
//         * @param sourceObject Object where data is stored
//         * @private
//         */
//        WMTSLayer.prototype.manageCapabilities = function (json,sourceObject) {
//            if ( (sourceObject.options.layer === null) || (typeof sourceObject.options.layer === "undefined")) {
//                // duplicate for each layer
//                var layers = json.Capabilities.Contents.Layer;
//                if ( (layers.length === null) || (typeof layers.length === "undefined")) {
//                    // Only one layer ! Load it !
//                    var layerName = layers.Identifier["_text"];
//                    sourceObject.options.layer = layerName;
//                    if ((sourceObject.options.matrixSet === null) || (typeof sourceObject.options.matrixSet === "undefined")) {
//                        sourceObject.options.matrixSet = json.Capabilities.Contents.TileMatrixSet.Identifier["_text"];
//                    }
//                } else {
//                    // More than one layer, duplicate config
//                    for (var i=0;i<layers.length;i++) {
//                        layerName = layers[i].Identifier["_text"];
//                        matrixSet = null;
//                        if ( (layers[i].TileMatrixSetLink)
//                           && (layers[i].TileMatrixSetLink.TileMatrixSet) ) {
//                            matrixSet = layers[i].TileMatrixSetLink.TileMatrixSet["_text"];
//                        }
//                        var newConfig = Object.assign({}, sourceObject.options);
//                        newConfig.layer = layerName;
//                        newConfig.name += " "+layerName;
//                        if (matrixSet !== null) {
//                            newConfig.matrixSet = matrixSet;
//                            // Get appropriate matrix Set
//                            newConfig.tileMatrix = sourceObject.getMatrixSet(json,matrixSet);
//                        }
//                        newConfig.byPass = true;
//                        sourceObject.multiLayers.push(newConfig);
//                    }
//                    // stop all !
//                    if ((sourceObject.callbackContext !== null) && (typeof sourceObject.callbackContext !== "undefined")) {
//                        sourceObject.callbackContext.addLayerFromObject(sourceObject,sourceObject.options);
//                    }
//                    return;
//                }
//            }
//
//            if ( (sourceObject.afterLoad !== null) && (typeof sourceObject.afterLoad !== "undefined")) {
//                sourceObject.afterLoad(sourceObject);
//            }
//
//            sourceObject.getTileBaseUrl =  _queryImage.call(this, sourceObject.baseUrl, sourceObject.options);
//
//            // more than one matrixset ?
//            var matrixSet = null;
//            var matrixSets = json.Capabilities.Contents.TileMatrixSet;
//            if ((matrixSets.length !== null) && (typeof matrixSets.length !== "undefined")) {
//                for (var i=0;i<matrixSets.length;i++) {
//                    if (matrixSets[i].Identifier["_text"] === sourceObject.options.matrixSet) {
//                        // Search specified matrixset
//                        matrixSet = matrixSets[i];
//                    }
//                }
//            } else if (matrixSets.Identifier["_text"] === sourceObject.options.matrixSet) {
//                // Only one matrixset
//                    matrixSet = matrixSets;
//            }
//
//            if (matrixSet === null) {
//                throw new Error("Unable to find "+sourceObject.options.matrixSet+" in getCapabilities of WMTS service");
//            }
//            sourceObject.numberOfLevels = matrixSet.TileMatrix.length;
//            sourceObject.tiling.update(matrixSet);
//
//            if (sourceObject.getCapabilitiesTileManager !== null) {
//                sourceObject.getCapabilitiesTileManager.setImageryProvider(sourceObject);
//            }
//            this.getCapabilitiesEnabled = false;
//
///*            if ((sourceObject.callbackAfterCreation !== null) && (typeof sourceObject.callbackAfterCreation !== "undefined")) {
//
//                sourceObject.callbackAfterCreation(sourceObject,sourceObject.options);
//            }*/
//            if ((sourceObject.callbackContext !== null) && (typeof sourceObject.callbackContext !== "undefined")) {
//                sourceObject.callbackContext.addLayerFromObject(sourceObject,sourceObject.options);
//            }
//
//        };

        /**************************************************************************************************************/

        /**
         * Returns an url for the given tile
         * @function getUrl
         * @memberOf WMTSLayer#
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        WMTSLayer.prototype.getUrl = function (tile) {
            var url = this.getTileBaseUrl;
            url = Utils.addParameterTo(url, "tilematrix", tile.level+1);
            url = Utils.addParameterTo(url, "tilecol", tile.x);
            url = Utils.addParameterTo(url, "tilerow", tile.y);
            return this.proxify(url, tile.level);
        };


        /**************************************************************************************************************/

        return WMTSLayer;

    });
