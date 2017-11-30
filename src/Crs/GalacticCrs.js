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
        const DESCRIPTION = "System in which a celestial object's position on the celestial sphere is described in " +
            "relation to the structure of the Milky Way galaxy. An object's galactic longitude is measured along the " +
            "galactic equator, a great circle on the celestial sphere that follows the band of the Milky Way. The " +
            "galactic equator, also called the galactic circle, is inclined at an angle of approximately 62° to the " +
            "celestial equator; distances are measured along it beginning at a point in the constellation Sagittarius lying in " +
            "the direction of the Milky Way's nucleus. The galactic poles are the two points where a perpendicular line " +
            "through the middle of the plane of the galactic equator intersect the celestial sphere. An object's galactic " +
            "latitude is measured in degrees north or south of the galactic equator toward the galactic poles.";

        /**
         * @constant
         * @type {string}
         */
        const LONGITUDE_LABEL = "l";

        /**
         * @constant
         * @type {string}
         */
        const LATITUDE_LABEL = "b";

        /**
         * @name GalacticCrs
         * @class
         * System in which a celestial object's position on the celestial
         * sphere is described in relation to the structure of the Milky Way galaxy. An object's galactic longitude is measured
         * along the galactic equator, a great circle on the celestial sphere that follows the band of the Milky Way.
         * The galactic equator, also called the galactic circle, is inclined at an angle of approximately 62° to the
         * celestial equator; distances are measured along it beginning at a point in the constellation Sagittarius lying in
         * the direction of the Milky Way's nucleus. The galactic poles are the two points where a perpendicular line through
         * the middle of the plane of the galactic equator intersect the celestial sphere. An object's galactic latitude is
         * measured in degrees north or south of the galactic equator toward the galactic poles.
         * <br/>
         * <i>source : galactic coordinate system. Dictionary.com. The American Heritage® Science Dictionary.
         * Houghton Mifflin Company. http://www.dictionary.com/browse/galactic-coordinate-system (accessed: March 5, 2017).</i>
         * <br/>
         * <img src="../doc/images/galactic.png"/>
         * <br/>
         * GalacticCrs is initialized with the following parameters :
         * <ul>
         *     <li>geoideName = Galactic</li>
         *     <li>radius = 10.0</li>
         *     <li>realPlanetRadius = 1.0</li>
         *     <li>type = Sky</li>
         *     <li>geoBound = new GeoBound(0, -90, 360, 90)</li>
         * </ul>
         * @augments AbstractCrs
         * @param options - no option to give.
         * @constructor
         * @see {@link https://en.wikipedia.org/wiki/Galactic_coordinate_system Wikipedia}
         * @memberOf module:Crs
         */
        var GalacticCrs = function (options) {
            AbstractCrs.prototype.constructor.call(this, {
                geoideName: Constants.CRS.Galactic,
                radius: 10.0,
                realPlanetRadius: 1.0,
                type: Constants.CONTEXT.Sky,
                geoBound: new GeoBound(0, -90, 360, 90)
            });
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractCrs, GalacticCrs);

        /**************************************************************************************************************/

        /**
         * @function formatCoordinates
         * @memberOf GalacticCrs#
         */
        GalacticCrs.prototype.formatCoordinates = function (geo) {
            var astro = [];
            astro[0] = this.getLongitudeLabel()+" = "+Numeric.roundNumber(geo[0], 3);
            astro[0] += "&deg;";
            astro[1] = this.getLatitudeLabel()+" = "+Numeric.roundNumber(geo[1], 3);
            astro[1] += "&deg;";
            return astro;
        };

        /**
         * @function getLongitudeLabel
         * @memberOf GalacticCrs#
         */
        GalacticCrs.prototype.getLongitudeLabel = function () {
            return LONGITUDE_LABEL;
        };

        /**
         * @function getLatitudeLabel
         * @memberOf GalacticCrs#
         */
        GalacticCrs.prototype.getLatitudeLabel = function () {
            return LATITUDE_LABEL;
        };

        /**
         * @function _setupPosAfterTrans
         * @memberOf GalacticCrs#
         * @private
         */
        GalacticCrs.prototype._setupPosAfterTrans = function (posWorld) {
            if (posWorld[0] < 0) {
                posWorld[0] += 360.0;
            }
            [posWorld[0], posWorld[1]] = this.convert(posWorld, Constants.CRS.Equatorial, Constants.CRS.Galactic);
        };

        /**
         * @function _setupPosBeforeTrans
         * @memberOf GalacticCrs#
         * @rpivate
         */
        GalacticCrs.prototype._setupPosBeforeTrans = function (posWorld) {
            [posWorld[0], posWorld[1]] = this.convert(posWorld, Constants.CRS.Galactic, Constants.CRS.Equatorial);
            if (posWorld[0] > 180) {
                posWorld[0] -= 360.0;
            }
        };

        /**
         * @function getName
         * @memberOf GalacticCrs#
         */
        GalacticCrs.prototype.getName = function () {
            return Constants.CRS.Galactic;
        };

        /**
         * @function getName
         * @memberOf GalacticCrs#
         */
        GalacticCrs.prototype.getDescription = function () {
            return DESCRIPTION;
        };

        return GalacticCrs;

    });
