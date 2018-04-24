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
    function (Utils, AbstractRasterLayer, Constants, GeoTiling) {

        /**
         * WCSElevation configuration
         * @typedef {AbstractRasterLayer.configuration} AbstractRasterLayer.wcsElevation_configuration
         * @property {int} [tilePixelSize = 33]
         * @property {int} [numberOfLevels = 21]
         * @property {string} baseUrl - the base Url to access the WCS server
         * @property {string} coverage - the name of the coverage to use (WCS parameter)
         * @property {string} crs - the coordinate reference system to use (WCS parameter)
         * @property {string} [outputCRS=crs] for 2.0
         * @property {string} version -  2.0.x or 1.0.x is supported
         * @property {float} [scale=1] - elevation scale value
         * @property {float} [scaleData=1] - elevation scale value to apply to have the true altitude
         * @property {string} [format='image/x-aaigrid']
         * @property {float} [minElevation=0]
         */

        /**
         * @name WCSElevationLayer
         * @class
         *    Create a layer for elevation data using WCS protocol  based on a GeoTiling(4, 2)
         *    with a pixelSize = 33 by default. The only supported format is right now image/x-aaigrid. It is an ASCII
         *    format that is easily parsed in Javascript.
         * @augments AbstractRasterLayer
         * @param {AbstractLayer.wcsElevation_configuration} options - WCSElevation Configuration
         * @constructor
         * @memberOf module:Layer
         */
        var WCSElevationLayer = function (options) {
            options.tilePixelSize = options.tilePixelSize || 33;
            options.tiling = new GeoTiling(4, 2);
            options.numberOfLevels = options.numberOfLevels || 21;
            AbstractRasterLayer.prototype.constructor.call(this, Constants.LAYER.WCSElevation, options);

            this.version = options.version || '2.0.0';
            this.format = options.format || 'image/x-aaigrid';
            this.minElevation = options.minElevation || 0;
            this.scale = options.scale || 1;
            this.scaleData = options.scaleData || 1;

            // Build the base GetMap URL
            var url = this.baseUrl;
            url = Utils.addParameterTo(url, "service", "wcs");
            url = Utils.addParameterTo(url, "version", this.version);
            url = Utils.addParameterTo(url, "request", "GetCoverage");

            switch (this.version.substring(0, 3)) {
                case '2.0':
                    this.crs = options.outputCRS || options.crs || 'http://www.opengis.net/def/crs/EPSG/0/4326';
                    url = Utils.addParameterTo(url, "outputCRS", this.crs);
                    url = Utils.addParameterTo(url, "size", "x(" + this.tilePixelSize + ")");
                    url = Utils.addParameterTo(url, "size", "y(" + this.tilePixelSize + ")");
                    url = Utils.addParameterTo(url, "coverageid", options.coverage);
                    break;
                case '1.0':
                    url = Utils.addParameterTo(url, "width",  this.tilePixelSize);
                    url = Utils.addParameterTo(url, "height",  this.tilePixelSize);
                    url = Utils.addParameterTo(url, "crs",  options.crs || 'EPSG:4326');
                    url = Utils.addParameterTo(url, "coverage",  options.coverage);
                    break;
            }
            url = Utils.addParameterTo(url, "format",  this.format);
            this.getCoverageBaseUrl = url;
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractRasterLayer, WCSElevationLayer);

        /**************************************************************************************************************/

        /**
         * Parse a elevation response
         * @function parseElevations
         * @memberOf WCSElevationLayer#
         * @param {String} text Response as text
         */
        WCSElevationLayer.prototype.parseElevations = function (text) {
            if (text === null || text.match("ServiceExceptionReport") != null) {
                return this._returnZeroElevations();
            }
            switch (this.format) {
                case "image/x-aaigrid":
                    return this._parseAAIGrid(text);
                default:
                    console.log("Format '" + this.format + "' could not be parsed.");
                    return this._returnZeroElevations();
            }
        };

        /**
         * Fallback elevations when no data was returned
         * @function _returnZeroElevations
         * @memberOf WCSElevationLayer#
         * @returns {float[]} Array of float
         * @private
         */
        WCSElevationLayer.prototype._returnZeroElevations = function () {
            var elevations = [];
            for (var i = 0; i < this.tilePixelSize * this.tilePixelSize; ++i) {
                elevations.push(0);
            }
            return elevations;
        };

        /**
         * Parse a elevation response from AAIGrid
         * @function _parseAAIGrid
         * @memberOf WCSElevationLayer#
         * @param {String} text Response as text
         * @private
         */
        WCSElevationLayer.prototype._parseAAIGrid = function (text) {
            var elevations = [];
            var i;
            var lines = text.trim().split('\n');

            var dataLinesStart = 0;
            for (i = 0; i < lines.length; ++i) {
                if (lines[i].substring(0, 1) === " ") {
                    dataLinesStart = i;
                    break;
                }
            }

            for (i = dataLinesStart; i < lines.length; i++) {
                var elts = lines[i].trim().split(/\s+/);
                for (var n = 0; n < elts.length; n++) {
                    var elevation = parseInt(elts[n], 10);
                    if (elevation < this.minElevation) {
                        elevation = this.minElevation;
                    }
                    elevations.push(elevation * this.scale * this.scaleData);
                }
            }

            return elevations;
        };

        /**
         * @function getBaseUrl
         * @memberOf WCSElevationLayer#
         */
        WCSElevationLayer.prototype.getBaseUrl = function() {
            return this.getCoverageBaseUrl;
        };

        /**
         * Get an url for the given tile
         * @function getUrl
         * @memberOf WCSElevationLayer#
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        WCSElevationLayer.prototype.getUrl = function (tile) {
            var geoBound = tile.geoBound;
            var url = this.getCoverageBaseUrl;

            if (this.version.substring(0, 3) === '2.0') {
                url = Utils.addParameterTo(url, "subset", "x"+this.crs + "(" + geoBound.west + "," + geoBound.east + ")");
                url = Utils.addParameterTo(url, "subset", "y"+this.crs + "(" + geoBound.south + "," + geoBound.north + ")");
            }
            else if (this.version.substring(0, 3) === '1.0') {
                url = Utils.addParameterTo(url, "bbox",geoBound.west+","+geoBound.south+","+geoBound.east+","+geoBound.north);
            }
            return this.proxify(url, tile.level);
        };

        /**************************************************************************************************************/

        return WCSElevationLayer;

    });
