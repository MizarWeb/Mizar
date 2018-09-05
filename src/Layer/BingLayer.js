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
    "./AbstractRasterLayer",
    "../Utils/Constants",
    "../Tiling/MercatorTiling"
], function(Utils, AbstractRasterLayer, Constants, MercatorTiling) {
    /**************************************************************************************************************/
    var BingTileSystem = (function() {
        var EarthRadius = 6378137;
        var MinLatitude = -85.05112878;
        var MaxLatitude = 85.05112878;
        var MinLongitude = -180;
        var MaxLongitude = 180;

        /**
         * Clips a number to the specified minimum and maximum values.
         * @param n - The number to clip.
         * @param minValue - Minimum allowable value.
         * @param maxValue - Maximum allowable value.
         * @returns {number} The clipped value.
         * @private
         * @constructor
         */
        function Clip(n, minValue, maxValue) {
            return Math.min(Math.max(n, minValue), maxValue);
        }

        /**
         * Determines the map width and height (in pixels) at a specified level of detail.
         * @param levelOfDetail - Level of detail, from 1 (lowest detail) to 23 (highest detail)
         * @returns {number} The map width and height in pixels.
         * @constructor
         * @private
         */
        function MapSize(levelOfDetail) {
            return 256 << levelOfDetail;
        }

        /**
         * Determines the ground resolution (in meters per pixel) at a specified
         * latitude and level of detail.
         * @param latitude - Latitude (in degrees) at which to measure the ground resolution
         * @param levelOfDetail - Level of detail, from 1 (lowest detail) to 23 (highest detail)
         * @returns {number}
         * @constructor
         */
        function GroundResolution(latitude, levelOfDetail) {
            latitude = Clip(latitude, MinLatitude, MaxLatitude);
            return (
                (Math.cos((latitude * Math.PI) / 180.0) *
                    2.0 *
                    Math.PI *
                    EarthRadius) /
                MapSize(levelOfDetail)
            );
        }

        /**
         * Determines the map scale at a specified latitude, level of detail, and screen resolution.
         * @param latitude - Latitude (in degrees) at which to measure the map scale.
         * @param levelOfDetail - Level of detail, from 1 (lowest detail) to 23 (highest detail)
         * @param screenDpi - Resolution of the screen, in dots per inch.
         * @returns {number} The map scale, expressed as the denominator N of the ratio 1 : N.
         * @constructor
         * @private
         */
        function MapScale(latitude, levelOfDetail, screenDpi) {
            return (
                (GroundResolution(latitude, levelOfDetail) * screenDpi) / 0.0254
            );
        }

        /**
         * Converts a point from latitude/longitude WGS-84 coordinates (in degrees)
         * into pixel XY coordinates at a specified level of detail.
         * @param latitude - Latitude of the point, in degrees
         * @param longitude - Longitude of the point, in degrees
         * @param levelOfDetail - Level of detail, from 1 (lowest detail) to 23 (highest detail)
         * @returns {float[]} [Output parameter receiving the X coordinate in pixels, Output parameter receiving the Y coordinate in pixels]
         * @constructor
         */
        function LatLongToPixelXY(latitude, longitude, levelOfDetail) {
            latitude = Clip(latitude, MinLatitude, MaxLatitude);
            longitude = Clip(longitude, MinLongitude, MaxLongitude);

            var x = (longitude + 180) / 360;
            var sinLatitude = Math.sin((latitude * Math.PI) / 180);
            var y =
                0.5 -
                Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI);

            var mapSize = MapSize(levelOfDetail);
            var pixelX = Clip(x * mapSize + 0.5, 0, mapSize - 1);
            var pixelY = Clip(y * mapSize + 0.5, 0, mapSize - 1);

            return [Math.floor(pixelX), Math.floor(pixelY)];
        }

        /**
         * Converts a pixel from pixel XY coordinates at a specified level of detail
         * into latitude/longitude WGS-84 coordinates (in degrees).
         * @param pixelX - X coordinate of the point, in pixels
         * @param pixelY - Y coordinates of the point, in pixels
         * @param levelOfDetail - Level of detail, from 1 (lowest detail) to 23 (highest detail)
         * @returns {float[]} [Output parameter receiving the latitude in degrees, Output parameter receiving the longitude in degrees]
         * @constructor
         */
        function PixelXYToLatLong(pixelX, pixelY, levelOfDetail) {
            var mapSize = MapSize(levelOfDetail);
            var x = Clip(pixelX, 0, mapSize - 1) / mapSize - 0.5;
            var y = 0.5 - Clip(pixelY, 0, mapSize - 1) / mapSize;

            var latitude =
                90 - (360 * Math.atan(Math.exp(-y * 2 * Math.PI))) / Math.PI;
            var longitude = 360 * x;

            return [latitude, longitude];
        }

        /**
         * Converts pixel XY coordinates into tile XY coordinates of the tile containing the specified pixel.
         * @param pixelXY [Pixel X coordinate, Pixel Y coordinate]
         * @returns {float[]} [Output parameter receiving the tile X coordinate, Output parameter receiving the tile Y coordinate]
         * @constructor
         */
        function PixelXYToTileXY(pixelXY) {
            return [pixelXY[0] / 256, pixelXY[1] / 256];
        }

        /**
         * Converts tile XY coordinates into pixel XY coordinates of the upper-left pixel of the specified tile.
         * @param tileXY [Tile X coordinate, Tile Y coordinate.]
         * @returns {float[]} [Output parameter receiving the pixel X coordinate,  Output parameter receiving the pixel Y coordinate]
         * @constructor
         */
        function TileXYToPixelXY(tileXY) {
            return [tileXY[0] * 256, tileXY[1] * 256];
        }

        /**
         * Converts tile XY coordinates into a QuadKey at a specified level of detail.
         * @param tileX - Tile X coordinate
         * @param tileY - Tile Y coordinate
         * @param levelOfDetail - Level of detail, from 1 (lowest detail) to 23 (highest detail)
         * @returns {string} A string containing the QuadKey
         * @constructor
         * @private
         */
        function TileXYToQuadKey(tileX, tileY, levelOfDetail) {
            var quadKey = "";
            for (var i = levelOfDetail; i > 0; i--) {
                var digit = "0";
                var mask = 1 << (i - 1);
                if ((tileX & mask) !== 0) {
                    digit++;
                }
                if ((tileY & mask) !== 0) {
                    digit++;
                    digit++;
                }
                quadKey += digit;
            }
            return quadKey;
        }

        /**
         * Converts a QuadKey into tile XY coordinates.
         * @param quadKey - QuadKey of the tile
         * @constructor
         */
        function QuadKeyToTileXY(quadKey) {
            var tileX = 0,
                tileY = 0;
            var levelOfDetail = quadKey.length();
            for (var i = levelOfDetail; i > 0; i--) {
                var mask = 1 << (i - 1);
                switch (quadKey[levelOfDetail - i]) {
                    case "0":
                        break;

                    case "1":
                        tileX |= mask;
                        break;

                    case "2":
                        tileY |= mask;
                        break;

                    case "3":
                        tileX |= mask;
                        tileY |= mask;
                        break;

                    default:
                        throw new ArgumentException(
                            "Invalid QuadKey digit sequence."
                        );
                }
            }
        }

        return {
            tileXYToQuadKey: TileXYToQuadKey,
            latLongToPixelXY: LatLongToPixelXY
        };
    })();

    /**************************************************************************************************************/

    /**
     * Bing layer configuration
     * @typedef {AbstractRasterLayer.configuration} AbstractRasterLayer.bing_configuration
     * @property {int} [baseLevel=2]
     * @property {onreadyCallback} [onready] - CallBack function.
     * @property {String} imageSet the image set to use, can be Aerial, Road
     * @property {String} key the bing key to use
     */

    /**
     * Callback when the layer is ready.
     * @callback onreadyCallback
     * @param {BingLayer} Bing layer
     */

    /**
     * @name BingLayer
     * @class
     *     Bing Maps is a web mapping service provided as a part of Microsoft's Bing suite of search engines and powered
     * by the Bing Maps for Enterprise framework.
     * @augments AbstractRasterLayer
     * @param {AbstractRasterLayer.bing_configuration} options -Bing Layer configuration
     * @see {@link https://en.wikipedia.org/wiki/Bing_Maps}
     * @memberOf module:Layer
     */
    var BingLayer = function(options) {
        // Call ancestor
        AbstractRasterLayer.prototype.constructor.call(
            this,
            Constants.LAYER.Bing,
            options
        );

        this.tilePixelSize = 256;
        this.tiling = new MercatorTiling(options.baseLevel || 2);
        this.numberOfLevels = 18;
        this.baseUrl = "";
        this.baseUrlSubDomains = [];
        this._ready = false;

        var self = this;

        // Need to provide a global callback for JSONP
        window._bingTileProviderCallback = function(result) {
            self.baseUrl = self.proxify(
                result.resourceSets[0].resources[0].imageUrl
            );
            self.baseUrlSubDomains = self.proxify(
                result.resourceSets[0].resources[0].imageUrlSubdomains
            );
            self._ready = true;

            // Call callback if set
            if (options.onready && options.onready instanceof Function) {
                options.onready(self);
            }

            // Request a frame
            if (self.globe) {
                self.globe.getRenderContext().requestFrame();
            }
        };

        // JSONP Call : needed because of cross-site origin policy
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = this.proxify(
            "http://dev.virtualearth.net/REST/V1/Imagery/Metadata/" +
                options.imageSet +
                "?jsonp=_bingTileProviderCallback&key=" +
                options.key
        );
        script.id = "_bingTileProviderCallback";
        document.getElementsByTagName("head")[0].appendChild(script);
    };

    Utils.inherits(AbstractRasterLayer, BingLayer);

    /**************************************************************************************************************/

    /**
     * Returns an url for the given tile.
     * @function getUrl
     * @memberOf BingLayer#
     * @param {Tile} tile Tile
     * @returns {string} Url
     */
    BingLayer.prototype.getUrl = function(tile) {
        var url = this.baseUrl.replace(
            "{quadkey}",
            BingTileSystem.tileXYToQuadKey(tile.x, tile.y, tile.level)
        );
        url = url.replace(
            "{subdomain}",
            this.baseUrlSubDomains[
                Math.floor(Math.random() * this.baseUrlSubDomains.length)
            ]
        );
        return this.proxify(url, tile.level);
    };

    /**************************************************************************************************************/

    return BingLayer;
});
