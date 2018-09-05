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
        "Moon 2000 coordinate Reference System is a coordinate system using the Moon sphere and in " +
        "which the planetocentric longitude increases to the east. The planetocentric latitude is measured in degrees " +
        "north or south of the Moon equator.";

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
     * @name Moon2000Crs
     * @class
     * Moon 2000 coordinate Reference System is a coordinate system using the Moon sphere and in which the
     * planetocentric longitude increases to the east. The planetocentric latitude is measured in degrees north or south
     * of the Moon equator.
     * <br/>
     * Moon2000Crs is initialized with the following parameters :
     * <ul>
     *     <li>geoideName = IAU2000:30101</li>
     *     <li>radius = 1.0</li>
     *     <li>realPlanetRadius = 1737400</li>
     *     <li>type = Planet</li>
     *     <li>geoBound = new GeoBound(-180, -90, 180, 90)</li>
     * </ul>
     * @augments AbstractCrs
     * @param options - No option to give.
     * @constructor
     * @memberOf module:Crs
     */
    var Moon2000Crs = function(options) {
        AbstractCrs.prototype.constructor.call(this, {
            geoideName: Constants.CRS.Moon_2000,
            radius: 1.0,
            realPlanetRadius: 1737400,
            type: Constants.CONTEXT.Planet,
            geoBound: new GeoBound(-180, -90, 180, 90)
        });
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractCrs, Moon2000Crs);

    /**************************************************************************************************************/

    /**
     * Formats coordinates as (x.xxx N, y.yyy E).
     * @function formatCoordinates
     * @memberOf Moon2000Crs
     * @param {float[]} geo the spatial position in degree
     * @return {string[]} the coordinates as xx.xxx S/N xx.xxx E/W
     */
    Moon2000Crs.prototype.formatCoordinates = function(geo) {
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
     * @memberOf Moon2000Crs#
     */
    Moon2000Crs.prototype.getLongitudeLabel = function() {
        return LONGITUDE_LABEL;
    };

    /**
     * @function getLatitudeLabel
     * @memberOf Moon2000Crs#
     */
    Moon2000Crs.prototype.getLatitudeLabel = function() {
        return LATITUDE_LABEL;
    };

    /**
     * Do nothing
     * @function _setupPosAfterTrans
     * @memberOf Moon2000Crs
     * @private
     */
    Moon2000Crs.prototype._setupPosAfterTrans = function(posWorld) {
        //Do Nothing
    };

    /**
     * Do nothing
     * @function _setupPosBeforeTrans
     * @memberOf Moon2000Crs
     * @private
     */
    Moon2000Crs.prototype._setupPosBeforeTrans = function(posWorld) {
        //Do Nothing
    };

    /**
     * @function getName
     * @memberOf Moon2000Crs#
     */
    Moon2000Crs.prototype.getName = function() {
        return Constants.CRS.Moon_2000;
    };

    /**
     * @function getDescription
     * @memberOf Moon2000Crs#
     */
    Moon2000Crs.prototype.getDescription = function() {
        return DESCRIPTION;
    };

    return Moon2000Crs;
});
