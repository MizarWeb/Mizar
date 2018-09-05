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
define([
    "./AbstractCrs",
    "../Renderer/GeoBound",
    "../Utils/Utils",
    "../Utils/Constants",
    "../Utils/Numeric"
], function(AbstractCrs, GeoBound, Utils, Constants, Numeric) {
    /**
     * @constant
     * @type {string}
     */
    const DESCRIPTION =
        "Sun coordinate Reference System is a coordinate system using the Sun sphere and in " +
        "which the heliocentric longitude increases to the east. The heliocentric latitude is measured in degrees " +
        "north or south of the Sun equator.";

    /**
     * @constant
     * @type {string}
     */
    const LONGITUDE_LABEL = "Long";

    /**
     * @constant
     * @type {string}
     */
    const LATITUDE_LABEL = "Lat";

    /**
     * @name SunCrs
     * @class
     * Sun  coordinate Reference System is a coordinate system using the Sun sphere and in which the
     * heliocentric longitude increases to the east. The heliocentric latitude is measured in degrees north or south
     * of the Sun equator.
     * <br/>
     * SunCrs is initialized with the following parameters :
     * <ul>
     *     <li>geoideName = IAU:Sun</li>
     *     <li>radius = 1.0</li>
     *     <li>realPlanetRadius = 696342000</li>
     *     <li>type = Planet</li>
     *     <li>geoBound = new GeoBound(-180, -90, 180, 90)</li>
     * </ul>
     * @augments AbstractCrs
     * @param options - No option to give.
     * @constructor
     * @memberOf module:Crs
     */
    var SunCrs = function(options) {
        AbstractCrs.prototype.constructor.call(this, {
            geoideName: Constants.CRS.Sun,
            radius: 1.0,
            realPlanetRadius: 696342000,
            type: Constants.CONTEXT.Planet,
            geoBound: new GeoBound(-180, -90, 180, 90)
        });
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractCrs, SunCrs);

    /**************************************************************************************************************/

    /**
     * Formats coordinates as (x.xxx N, y.yyy E).
     * @function formatCoordinates
     * @memberOf SunCrs
     * @param {float[]} geo the spatial position in degree
     * @return {string[]} the coordinates as xx.xxx S/N xx.xxx E/W
     */
    SunCrs.prototype.formatCoordinates = function(geo) {
        var astro = [];
        var longitude = Numeric.roundNumber(geo[0], 3);
        var latitude = Numeric.roundNumber(geo[1], 3);
        astro[0] = this.getLatitudeLabel() + " = ";
        astro[0] += latitude >= 0 ? latitude + " N" : -1.0 * latitude + " S";
        astro[1] = this.getLongitudeLabel() + " = ";
        astro[1] += longitude >= 0 ? longitude + " E" : -1.0 * longitude + " W";
        return astro;
    };

    /**
     * @function getLongitudeLabel
     * @memberOf SunCrs#
     */
    SunCrs.prototype.getLongitudeLabel = function() {
        return LONGITUDE_LABEL;
    };

    /**
     * @function getLatitudeLabel
     * @memberOf SunCrs#
     */
    SunCrs.prototype.getLatitudeLabel = function() {
        return LATITUDE_LABEL;
    };

    /**
     * Do nothing
     * @function _setupPosAfterTrans
     * @memberOf SunCrs#
     * @private
     */
    SunCrs.prototype._setupPosAfterTrans = function(posWorld) {
        //Do Nothing
    };

    /**
     * Do nothing
     * @function _setupPosBeforeTrans
     * @memberOf SunCrs#
     * @private
     */
    SunCrs.prototype._setupPosBeforeTrans = function(posWorld) {
        //Do Nothing
    };

    /**
     * @function getName
     * @memberOf SunCrs#
     */
    SunCrs.prototype.getName = function() {
        return Constants.CRS.Sun;
    };

    /**
     * @function getDescription
     * @memberOf SunCrs#
     */
    SunCrs.prototype.getDescription = function() {
        return DESCRIPTION;
    };

    return SunCrs;
});
