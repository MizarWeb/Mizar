/*******************************************************************************
 * Copyright 2017, 2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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

define([
    "../Utils/Utils",
    "./AbstractLayer",
    "./AbstractRasterLayer",
    "../Utils/Constants",
    "../Tiling/GeoTiling",
    "../Gui/dialog/ErrorDialog"
], function(Utils, AbstractLayer, AbstractRasterLayer, Constants, GeoTiling, ErrorDialog) {
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
     * @memberof module:Layer
     */
    var WCSElevationLayer = function(options) {
        options.tilePixelSize = options.tilePixelSize || 33;
        options.tiling = new GeoTiling(4, 2);
        options.numberOfLevels = options.numberOfLevels || 21;
        options.version = options.version || "2.0.0";
        options.format = options.format || "image/x-aaigrid";
        options.minElevation = options.minElevation || 0;
        options.scale = options.scale || 1;
        options.scaleData = options.scaleData || 1;
        options.crs = options.crs || "EPSG:4326";
        AbstractRasterLayer.prototype.constructor.call(
            this,
            Constants.LAYER.WCSElevation,
            options
        );
        // Build the base GetMap URL
        this.getCoverageBaseUrl = _queryImage.call(
            this,
            this.getBaseUrl(),
            options
        );
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRasterLayer, WCSElevationLayer);

    /**************************************************************************************************************/

    function _queryImage(baseUrl, options) {
        var url = baseUrl;
        url = Utils.addParameterTo(url, "service", "wcs");
        url = Utils.addParameterTo(url, "version", options.version);
        url = Utils.addParameterTo(url, "request", "GetCoverage");

        switch (options.version.substring(0, 3)) {
        case "2.0":
            url = Utils.addParameterTo(url, "outputCRS", options.crs);
            url = Utils.addParameterTo(
                url,
                "size",
                "x(" + options.tilePixelSize + ")"
            );
            url = Utils.addParameterTo(
                url,
                "size",
                "y(" + options.tilePixelSize + ")"
            );
            url = Utils.addParameterTo(url, "coverageid", options.coverage);
            break;
        case "1.0":
            url = Utils.addParameterTo(url, "width", options.tilePixelSize);
            url = Utils.addParameterTo(
                url,
                "height",
                options.tilePixelSize
            );
            url = Utils.addParameterTo(url, "crs", options.crs);
            url = Utils.addParameterTo(url, "coverage", options.coverage);
            break;
        }
        url = Utils.addParameterTo(url, "format", options.format);

        if (options.hasOwnProperty("time")) {
            url = Utils.addParameterTo(url, "time", options.time);
        }

        // time constraints and custom params
        for (var param in this.imageLoadedAtTime) {
            if (param !== "time" && this.imageLoadedAtTime[param] !== null) {
                url = Utils.addParameterTo(
                    url,
                    param,
                    this.imageLoadedAtTime[param]
                );
            }
        }

        return url;
    }

    /**
     * Parse a elevation response
     * @function parseElevations
     * @memberof WCSElevationLayer#
     * @param {string} text Response as text
     */
    WCSElevationLayer.prototype.parseElevations = function(text) {
        if (text === null || text.match("ServiceExceptionReport") != null) {
            return this._returnZeroElevations();
        }
        switch (this.options.format) {
        case "image/x-aaigrid":
            return this._parseAAIGrid(text);
        default:
            ErrorDialog.open(Constants.LEVEL.WARNING,"Format '" + this.format + "' could not be parsed.");
            return this._returnZeroElevations();
        }
    };

    /**
     * Fallback elevations when no data was returned
     * @function _returnZeroElevations
     * @memberof WCSElevationLayer#
     * @returns {float[]} Array of float
     * @private
     */
    WCSElevationLayer.prototype._returnZeroElevations = function() {
        var elevations = [];
        for (
            var i = 0;
            i < this.options.tilePixelSize * this.options.tilePixelSize;
            ++i
        ) {
            elevations.push(0);
        }
        return elevations;
    };

    /**
     * Parse a elevation response from AAIGrid
     * @function _parseAAIGrid
     * @memberof WCSElevationLayer#
     * @param {string} text Response as text
     * @private
     */
    WCSElevationLayer.prototype._parseAAIGrid = function(text) {
        var elevations = [];
        var i;
        var lines = text.trim().split("\n");

        var dataLinesStart = 0;
        var noDATA = Number.NEGATIVE_INFINITY;
        for (i = 0; i < lines.length; ++i) {
            if (lines[i].substring(0, 1) === " ") {
                dataLinesStart = i;
                break;
            } else if (lines[i].substring(0, 1) === "NODATA_value") {
                var elt = lines[i].trim().split(/\s+/);
                noDATA = elt[1];
            }
        }

        var oldVal = Number.NEGATIVE_INFINITY;
        for (i = dataLinesStart; i < lines.length; i++) {
            var elts = lines[i].trim().split(/\s+/);
            for (var n = 0; n < elts.length; n++) {
                var elevation;
                if (isNaN(elts[n]) || elts[n] === noDATA) {
                    elevation = oldVal;
                } else {
                    elevation = parseFloat(elts[n], 10);
                    oldVal = elevation;
                }
                //var elevation = parseInt(elts[n], 10);
                if (elevation < this.options.minElevation) {
                    elevation = this.options.minElevation;
                }
                elevations.push(
                    elevation * this.options.scale * this.options.scaleData
                );
            }
        }

        return elevations;
    };

    /**
     * Get an url for the given tile
     * @function getUrl
     * @memberof WCSElevationLayer#
     * @param {Tile} tile Tile
     * @return {string} Url
     */
    WCSElevationLayer.prototype.getUrl = function(tile) {
        var geoBound = tile.geoBound;

        var url;
        if (this.allowedHTTPRequest) {
            url = this.getCoverageBaseUrl;

            if (this.options.version.substring(0, 3) === "2.0") {
                url = Utils.addParameterTo(
                    url,
                    "subset",
                    "x" +
                        this.options.crs +
                        "(" +
                        geoBound.west +
                        "," +
                        geoBound.east +
                        ")"
                );
                url = Utils.addParameterTo(
                    url,
                    "subset",
                    "y" +
                        this.options.crs +
                        "(" +
                        geoBound.south +
                        "," +
                        geoBound.north +
                        ")"
                );
            } else if (this.options.version.substring(0, 3) === "1.0") {
                url = Utils.addParameterTo(
                    url,
                    "bbox",
                    geoBound.west +
                        "," +
                        geoBound.south +
                        "," +
                        geoBound.east +
                        "," +
                        geoBound.north
                );
            }
        } else {
            url = null;
        }
        return this.allowRequest(url, tile.level);
    };

    WCSElevationLayer.prototype.setParameter = function(paramName, value) {
        if (this._hasToBeRefreshed(paramName, value)) {
            this.options[paramName] = this.imageLoadedAtTime[paramName];
            this.getCoverageBaseUrl = _queryImage.call(
                this,
                this.getBaseUrl(),
                this.options
            );
            this.forceRefresh();
        }
    };

    WCSElevationLayer.prototype.getScale = function() {
        return this.options.scale;
    };

    WCSElevationLayer.prototype.getScaleData = function() {
        return this.options.scaleData;
    };

    WCSElevationLayer.prototype.setTime = function(time) {
        AbstractLayer.prototype.setTime(time);
        this.setParameter("time", time);
    };

    /**************************************************************************************************************/

    return WCSElevationLayer;
});
