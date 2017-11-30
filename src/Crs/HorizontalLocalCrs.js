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
define(['./AbstractCrs', '../Renderer/GeoBound', '../Utils/Utils', '../Utils/Constants', '../Utils/Numeric'],
    function (AbstractCrs, GeoBound, Utils, Constants, Numeric) {

        /**
         * @constant
         * @type {string}
         */
        const DESCRIPTION = "System in which an local object's position is described in the observer's local horizon." +
            "It is expressed in terms of altitude (or elevation) angle and azimuth. The elevation is measured for -90° " +
            "(nadir) to 90° (zenith) but azimuth is measured in degrees eastward along the horizon from the North";

        /**
         * @constant
         * @type {string}
         */
        const LONGITUDE_LABEL = "Az";

        /**
         * @constant
         * @type {string}
         */
        const LATITUDE_LABEL = "Alt";


        /**
         * @name HorizontalLocalCrs
         * @class
         * System in which an local object's position is described in the observer's local horizon. It is expressed in
         * terms of altitude (or elevation) angle and azimuth. The elevation is measured for -90° (nadir) to 90° (zenith)
         * but azimuth is measured in degrees eastward along the horizon from the North.
         * <br/>
         * HorizontalLocalCrs is initialized with the following parameters :
         * <ul>
         *     <li>geoideName = HorizontalLocalCrs</li>
         *     <li>radius = 1.0</li>
         *     <li>realPlanetRadius = 1</li>
         *     <li>type = Planet</li>
         *     <li>geoBound = new GeoBound(0, -90, 360, 90)</li>
         * </ul>
         * @augments AbstractCrs
         * @param options - No option to give.
         * @constructor
         * @memberOf module:Crs
         */
        var HorizontalLocalCrs = function (options) {
            AbstractCrs.prototype.constructor.call(this, {
                geoideName: Constants.CRS.HorizontalLocal,
                radius: 1.0,
                realPlanetRadius: 1,
                type: Constants.CONTEXT.Ground,
                geoBound: new GeoBound(0, -90, 360, 90)
            });
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractCrs, HorizontalLocalCrs);

        /**************************************************************************************************************/

        /**
         * Formats coordinates as (x.xxx N, y.yyy E).
         * @function formatCoordinates
         * @memberOf HorizontalLocalCrs
         * @param {float[]} geo the spatial position in degree
         * @return {string[]} the coordinates as xx.xxx S/N xx.xxx E/W
         */
        HorizontalLocalCrs.prototype.formatCoordinates = function (geo) {
            var astro = [];
            var azimuth = Numeric.roundNumber(geo[0], 3);
            var altitude = Numeric.roundNumber(geo[1], 3);
            if(azimuth > 0 && azimuth <= 180) {
                azimuth = 360 - azimuth;
            } else {
                azimuth = -1*azimuth;
            }
            astro[0] = this.getLongitudeLabel()+" = "+azimuth;
            astro[0] += "&deg;";
            astro[1] = this.getLatitudeLabel()+" = "+altitude;
            astro[1] +="&deg;";
            return astro;
        };

        /**
         * @function getLongitudeLabel
         * @memberOf HorizontalLocalCrs#
         */
        HorizontalLocalCrs.prototype.getLongitudeLabel = function () {
            return LONGITUDE_LABEL;
        };

        /**
         * @function getLatitudeLabel
         * @memberOf HorizontalLocalCrs#
         */
        HorizontalLocalCrs.prototype.getLatitudeLabel = function () {
            return LATITUDE_LABEL;
        };

        /**
         * Do nothing
         * @function _setupPosAfterTrans
         * @memberOf HorizontalLocalCrs
         * @private
         */
        HorizontalLocalCrs.prototype._setupPosAfterTrans = function(posWorld) {
            //Do Nothing
        };

        /**
         * Do nothing
         * @function _setupPosBeforeTrans
         * @memberOf HorizontalLocalCrs
         * @private
         */
        HorizontalLocalCrs.prototype._setupPosBeforeTrans = function(posWorld) {
            //Do Nothing
        };

        /**
         * @function getName
         * @memberOf HorizontalLocalCrs#
         */
        HorizontalLocalCrs.prototype.getName = function () {
            return Constants.CRS.HorizontalLocal;
        };

        /**
         * @function getDescription
         * @memberOf HorizontalLocalCrs#
         */
        HorizontalLocalCrs.prototype.getDescription = function () {
            return DESCRIPTION;
        };

        return HorizontalLocalCrs;

    });
