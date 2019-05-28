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
    "../Tiling/GeoTiling",
    "../Utils/UtilsIntersection"
], function(
    Utils,
    AbstractLayer,
    AbstractRasterLayer,
    GeoTiling,
    UtilsIntersection
) {
    /**
     * Configuration parameters to query a Web Map Service (WMS) and Web Map Service-Time (WMS-Time)
     * @typedef {AbstractLayer.configuration} AbstractRasterLayer.wms_configuration
     * @property {string} type - Must be "WMS" - the type of this service
     * @property {string} layers - Layers to display on map. Value is a comma-separated list of layer names.
     * @property {string} [styles=""] - Styles in which layers are to be rendered. Value is a comma-separated list
     * of style names, or empty if default styling is required. Style names may be empty in the list, to use
     * default layer styling.
     * @property {string} [version = "1.3.0"] - Service version
     * @property {string} [format = "image/jpeg"] - Format for the map output
     * @property {string} [transparent = false] - 	Whether the map background should be transparent. Values are
     * true or false. Default is false
     * @property {string} [time] - Time value or range for map data using WMS-Time
     * @property {int} [tilePixelSize = 256] - tile in pixels
     * @property {int} [numberOfLevels = 21] - number of levels
     * @property {{west:float, north:float, east:float, south:float}} [restrictTo] - Bounding box on which the WMS
     * query is allowed. The WMS query must intersect the bounding box sets to restrictTo. When restrictTo is not
     * defined, the bounding box is equivalent to the whole planet.
     * @property {boolean} [autoFillTimeTravel] - Set to true so that Mizar can automatically retrieve the
     * defined time from the time dimension.
     * @property {{units:string,unitSymbol:string,default:string,multipleValues:string,nearestValue:string,value:string}} [dimension.time] - Supported time for WMS-T
     */

    //TODO : check id restrictTo is set to the extent of the layer
    //TODO : For version 1.3.0 crs must be CRS:84 and then tile.config.srs must be CRS:84 with BBOX coord long/lat
    //TODO : For version 1.3.0 and crs=EPSG:xxxx => too bad because we have the bbox coord in this order lat/long
    //TODO : For version != 1.3.0, crs is not used anymore, we srs and it akes an EPSG code with the bbox order long/lat

    /**
     * @name WMSLayer
     * @class
     *    Creates a layer for imagery data using WMS (Web Map Service) or WMS-Time (Web Map Service - Time) protocol
     *    based on a GeoTiling(4, 2) with a pixelSize = 256 by default.<br/>
     *    WMS provides a standard interface for requesting a geo-spatial map image.
     *    The standard guarantees that these images can all be overlaid on one another.
     *    <br/><br/>
     *    Example of a WMS request<br/>
     *    <code>
     *        http://example.com/wms?request=GetMap&service=WMS&version=1.3.0&layers=MyLayer
     *        &styles=population&crs=CRS:84&bbox=-145.15104058007,21.731919794922,-57.154894212888,58.961058642578
     *        &width=780&height=330&format=image/png
     *    </code>
     *
     * @augments AbstractRasterLayer
     * @param {AbstractRasterLayer.wms_configuration} options - WMS Configuration
     * @constructor
     * @memberof module:Layer
     * @see {@link http://www.opengeospatial.org/standards/wms WMS} standard
     */
    var WMSLayer = function(options) {
        options.tilePixelSize = options.tilePixelSize || 256;
        options.tiling = new GeoTiling(4, 2);
        options.numberOfLevels = options.numberOfLevels || 21;
        options.transparent = options.transparent || false;

        this.restrictTo = options.restrictTo;
        this.autoFillTimeTravel = options.autoFillTimeTravel;

        //this._computeBaseUrlAndCapabilities(options);

        AbstractRasterLayer.prototype.constructor.call(
            this,
            options.type,
            options
        );

        this.timeTravelValues = null;

        // If needed, try to fill time travel parameters
        if (this.autoFillTimeTravel === true && this.containsDimension("time")) {
            this.generateTimeTravel(options.dimension.time);
        }

        this.getMapBaseUrl = _queryImage.call(
            this,
            this.getBaseUrl(),
            this.tilePixelSize,
            this.tilePixelSize,
            options
        );
        this.layers = options.layers;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractRasterLayer, WMSLayer);

    /**************************************************************************************************************/

    /**
     * Static part of the URL to query the WMS/WMS-T server.
     * @function _queryImage
     * @memberof WMSLayer#
     * @param {string} baseUrl - Base URL of the WMS/WMS-Time server
     * @param {int} xTilePixelSize - Number of pixels along X for the output image
     * @param {int} yTilePixelSize - Number of pixels along Y for the output image
     * @param {AbstractRasterLayer.wms_configuration} options - options
     * @return {string} the URL
     * @private
     */
    function _queryImage(baseUrl, xTilePixelSize, yTilePixelSize, options) {
        // Build the base GetMap URL
        var url = baseUrl;
        url = Utils.addParameterTo(url, "service", "wms");
        url = Utils.addParameterTo(
            url,
            "version",
            options.hasOwnProperty("version") ? options.version : "1.3.0"
        );
        url = Utils.addParameterTo(url, "request", "getMap");
        url = Utils.addParameterTo(url, "layers", options.layers);
        url = Utils.addParameterTo(
            url,
            "styles",
            options.hasOwnProperty("styles") ? options.styles : ""
        );
        url = Utils.addParameterTo(
            url,
            "format",
            options.hasOwnProperty("format") ? options.format : "image/jpeg"
        );

        // transparent option
        if (options.hasOwnProperty("transparent")) {
            url = Utils.addParameterTo(url, "transparent", options.transparent);
        }
        url = Utils.addParameterTo(url, "width", xTilePixelSize);
        url = Utils.addParameterTo(url, "height", yTilePixelSize);

        if (options.hasOwnProperty("time")) {
            url = Utils.addParameterTo(url, "time", options.time);
        }

        // custom params
        for (var param in this.imageLoadedAtTime) {
            if (param !== "time" && this.imageLoadedAtTime[param] !== undefined) {
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
     * Checks whether the footprint (that represents the restricted zone area) intersects with the tile
     * @function _tileIsIntersectedFootprint
     * @memberof WMSLayer#
     * @param {{west:float, north:float, east:float, south:float}} tile - Tile
     * @param {{west:float, north:float, east:float, south:float}} footprint - restricted zone area
     * @return {boolean} true when the tile intersects with the footprint otherwise false
     * @private
     */
    function _tileIsIntersectedFootprint(tile, footprint) {
        var isIntersect;
        if (footprint != null) {
            // check if tile is inside restrict zone
            isIntersect = UtilsIntersection.boundsIntersects(tile, footprint);
        } else {
            isIntersect = true;
        }
        return isIntersect;
    }

    /**
     * Sets the time to query
     * @function setTime
     * @memberof WMSLayer#
     * @param {Time.configuration} time - time to query
     */
    WMSLayer.prototype.setTime = function(time) {
        this.setParameter("time", time);
    };

    /**
     * Returns the legend from the WMS/WMS-T server
     * @function getLegend
     * @memberof WMSLayer#
     * @return {{title:string, format:string, url:string, size:string}} the legend information
     */
    WMSLayer.prototype.getLegend = function() {
        var metadata = this.metadataAPI;
        var legend;
        if (metadata.Style) {
            var defaultStyle = metadata.Style[0];
            var title = defaultStyle.Title;
            var format = defaultStyle.LegendURL[0].Format;
            var url = defaultStyle.LegendURL[0].OnlineResource;
            var size = defaultStyle.LegendURL[0].size;
            if (title === undefined || title === "default") {
                legend = {};
            } else {
                legend = {
                    title: title,
                    format: format,
                    url: url,
                    size: size
                };
            }
        } else {
            legend = {};
        }
        return legend;
    };

    /**
     * Sets visible/hidden the layer and the legend related to the layer.
     * To make visible the legend, a <div id="legendDiv"/> must be set in the HTML file.
     * @function setVisible
     * @memberof WMSLayer#
     * @param arg true when the layer must be visible otherwise false
     */
    WMSLayer.prototype.setVisible = function(arg) {
        AbstractRasterLayer.prototype.setVisible.call(this, arg);
        if (document.getElementById("legendDiv")) {
            var legend = this.getLegend();
            if (Object.keys(legend).length > 0) {
                document.getElementById("legendDiv").innerHTML = "";
                if (arg === true) {
                    document.getElementById("legendDiv").innerHTML =
                        "<div id='legendTxt' class='column'>" +
                        legend.title +
                        "</div><div id='legendUrl' class='column'><img src='" +
                        legend.url +
                        "'/></div>";
                }
            }
        }
    };

    /**
     * Returns the url for the given tile
     * The URL is returned in the following case :
     * - the HTTP request is allowed (case of the time request, the requested time is inside a supported time value
     * or range - when no time dimension, no constraint).
     * - the image is background (when an image is in background, this image is always request, we do not try to
     * make optimization)
     * - the spatial tile intersects with the image extent (useful when we want to display a single footprint as
     * an image - in this case, we do not want to make the request to the server when we know the request does not
     * intersect the image's footprint)
     * @function getUrl
     * @memberof WMSLayer#
     * @param {Tile} tile Tile
     * @return {string} Url
     */
    WMSLayer.prototype.getUrl = function(tile) {
        // Just add the bounding box to the GetMap URL
        var bound = tile.bound;
        var url, bbox;
        // we cannot reject the request to the server when the layer is defined as background otherwise there is
        // no image to show and Mizar is waiting for an image
        if (this.isBackground() || _tileIsIntersectedFootprint(bound, this.restrictTo)) {
            bbox =
                bound.west +
                "," +
                bound.south +
                "," +
                bound.east +
                "," +
                bound.north;
            url = this.getMapBaseUrl;
            url = Utils.addParameterTo(
                url,
                "transparent",
                this.options.transparent
            );
            url = Utils.addParameterTo(url, "crs", tile.config.srs);
            url = Utils.addParameterTo(url, "bbox", bbox);
        } 

        return this.allowRequest(url, tile.level);
    };

    /**
     * Set a parameter and add it to the static query parameters.
     * The parameter is added according to some [use cases]{@link AbstractLayer#_hasToBeRefreshed} with the time.
     * @function setParameter
     * @memberof WMSLayer#
     * @param paramName parameter name
     * @param value value name
     */
    WMSLayer.prototype.setParameter = function(paramName, value) {
        if (this._hasToBeRefreshed(paramName, value)) {
            this.options[paramName] = this.imageLoadedAtTime[paramName];                        
            this.getMapBaseUrl = _queryImage.call(
                this,
                this.getBaseUrl(),
                this.tilePixelSize,
                this.tilePixelSize,
                this.options
            );
            if(this.isBackground()) {
                //TODO : refresh background without deleting other layers in tiles
            } else {
                this.forceRefresh();
            }           
        }
    };

    /**************************************************************************************************************/

    return WMSLayer;
});
