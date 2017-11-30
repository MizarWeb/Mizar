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
/**
 * A coordinate reference system is a coordinate system that is related to an object
 * by a {@link module:Crs.Geoide geodetic datum}.
 * Mizar currently supports the following coordinates reference systems :
 * <table border="1">
 *     <tr>
 *         <td><img src="../doc/images/equatorial.png" width="200px"/></td>
 *         <td>{@link module:Crs.EquatorialCrs EquatorialCrs}</td>
 *         <td>Provides an equatorial coordinate reference system</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/galactic.png" width="200px"/></td>
 *         <td>{@link module:Crs.GalacticCrs GalacticCrs}</td>
 *         <td>Provides a galactic coordinate reference system</td>
 *     </tr>
 *     <tr>
 *         <td></td>
 *         <td>{@link module:Crs.Mars2000Crs Mars2000Crs}</td>
 *         <td>Provides a coordinate reference system base on the Mars geoide</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/earth.jpg" width="200px"/></td>
 *         <td>{@link module:Crs.WGS84Crs WGS84Crs}</td>
 *         <td>Provides a coordinate reference system base on the Earth geoide</td>
 *     </tr>
 *     <tr>
 *         <td></td>
 *         <td>{@link module:Crs.ProjectedCrs ProjectedCrs}</td>
 *         <td>Provides a projected coordinate reference system on a map</td>
 *     </tr>
 * </table>
 * <br/>
 * In addition to the classes, a {@link module:Crs.CoordinateSystemFactory factory} is available to help for creating
 * coordinate reference system. Once the coordinate reference system is created, the client can handle it by the use of its
 * {@link Crs interface}.
 *
 * @module Crs
 * @implements {Crs}
 */
define(['./AbstractCrs', '../Renderer/GeoBound', '../Utils/Utils', '../Utils/Constants', '../Renderer/glMatrix'],
    function (AbstractCrs, GeoBound, Utils, Constants) {

        /**
         * @constant
         * @type {string}
         */
        const DESCRIPTION = "System in which a celestial object's position on the celestial " +
            "sphere is described in terms of its declination and right ascension, measured with respect to the celestial " +
            "equator. Declination and right ascension correspond directly to geographic latitude and longitude as " +
            "projected outward onto the celestial sphere. Declination is measured in degrees north or south of the " +
            "celestial equator but right ascension  is measured in hours, minutes, and seconds eastward along the " +
            "celestial equator from the point of the vernal equinox. Because the celestial equator moves among the fixed " +
            "stars with the precession of the Earth's poles, an object's declination and right ascension change " +
            "gradually over time, and coordinates in the equatorial system must be specified for particular years. By " +
            "Default J2000 is used";

        /**
         * @constant
         * @type {string}
         */
        const LONGITUDE_LABEL = "&alpha;";

        /**
         * @constant
         * @type {string}
         */
        const LATITUDE_LABEL = "&delta;";

        /**
         * @name EquatorialCrs
         * @class
         * System in which a celestial object's position on the celestial
         * sphere is described in terms of its declination and right ascension, measured with respect to the celestial equator.
         * Declination and right ascension correspond directly to geographic latitude and longitude as projected outward onto
         * the celestial sphere. Declination is measured in degrees north or south of the celestial equator but right ascension
         * is measured in hours, minutes, and seconds eastward along the celestial equator from the point of the vernal equinox.
         * Because the celestial equator moves among the fixed stars with the precession of the Earth's poles, an object's
         * declination and right ascension change gradually over time, and coordinates in the equatorial system must be
         * specified for particular years.
         * <br/>
         * <i>source : equatorial coordinate system. Dictionary.com. The American Heritage® Science Dictionary.
         * Houghton Mifflin Company. http://www.dictionary.com/browse/equatorial-coordinate-system (accessed: March 5, 2017).</i>
         * <br/>
         * <img src="../doc/images/equatorial.png"/>
         * <br/>
         * EquatorialCrs is initialized with the following parameters :
         * <ul>
         *     <li>geoideName = Equatorial</li>
         *     <li>radius = 10.0</li>
         *     <li>realPlanetRadius = 1.0</li>
         *     <li>type = Sky</li>
         *     <li>geoBound = new GeoBound(0, -90, 360, 90)</li>
         * </ul>
         * @augments AbstractCrs
         * @param {Object} options - No option to give
         * @constructor
         * @see {@link https://en.wikipedia.org/wiki/Equatorial_coordinate_system Wikipedia}
         * @memberOf module:Crs
         */
        var EquatorialCrs = function (options) {
            AbstractCrs.prototype.constructor.call(this, {
                geoideName: Constants.CRS.Equatorial,
                radius: 10.0,
                realPlanetRadius: 1.0,
                type: Constants.CONTEXT.Sky,
                geoBound: new GeoBound(0, -90, 360, 90)
            });
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractCrs, EquatorialCrs);

        /**************************************************************************************************************/

        /**
         * @function transformVec
         * @memberOf EquatorialCrs#
         */
        EquatorialCrs.prototype.transformVec = function (vec) {
            var transformMatrix = this.computeTransformMatrix();
            var res = [];
            mat4.multiplyVec3(transformMatrix, vec, res);
            return res;
        };


        /**
         * @function computeTransformMatrix
         * @memberOf EquatorialCrs#
         */
        EquatorialCrs.prototype.computeTransformMatrix = function () {
            var transformMatrix = [];

            var galNorth = this.convert([0, 90], Constants.CRS.Galactic, Constants.CRS.Equatorial);
            var gal3DNorth = this.fromGeoTo3D(galNorth);

            var galCenter = this.convert([0, 0], Constants.CRS.Galactic, Constants.CRS.Equatorial);
            var gal3DCenter = this.fromGeoTo3D(galCenter);

            var galEast = this.convert([90, 0], Constants.CRS.Galactic, Constants.CRS.Equatorial);
            var gal3DEast = this.fromGeoTo3D(galEast);

            transformMatrix[0] = gal3DCenter[0];
            transformMatrix[1] = gal3DCenter[1];
            transformMatrix[2] = gal3DCenter[2];
            transformMatrix[3] = 0.0;
            transformMatrix[4] = gal3DEast[0];
            transformMatrix[5] = gal3DEast[1];
            transformMatrix[6] = gal3DEast[2];
            transformMatrix[7] = 0.0;
            transformMatrix[8] = gal3DNorth[0];
            transformMatrix[9] = gal3DNorth[1];
            transformMatrix[10] = gal3DNorth[2];
            transformMatrix[11] = 0.0;
            transformMatrix[12] = 0.0;
            transformMatrix[13] = 0.0;
            transformMatrix[14] = 0.0;
            transformMatrix[15] = 1.0;

            return transformMatrix;
        };

        /**
         * @function formatCoordinates
         * @memberOf EquatorialCrs#
         */
        EquatorialCrs.prototype.formatCoordinates = function (geo) {
            var sexa =  this.getSexagesimalFromDeg(geo);
            var dest = [];
            dest[0] = this.getLongitudeLabel()+" = "+sexa[0];
            dest[1] = this.getLatitudeLabel()+" = "+sexa[1];
            return dest;
        };

        /**
         * @function getLongitudeLabel
         * @memberOf EquatorialCrs#
         */
        EquatorialCrs.prototype.getLongitudeLabel = function () {
            return LONGITUDE_LABEL;
        };

        /**
         * @function getLatitudeLabel
         * @memberOf EquatorialCrs#
         */
        EquatorialCrs.prototype.getLatitudeLabel = function () {
            return LATITUDE_LABEL;
        };

        /**
         * @function _setupPosAfterTrans
         * @memberOf EquatorialCrs#
         * @private
         */
        EquatorialCrs.prototype._setupPosAfterTrans = function (posWorld) {
            if (posWorld[0] < 0) {
                posWorld[0] += 360.0;
            }
        };

        /**
         * @function _setupPosBeforeTrans
         * @memberOf EquatorialCrs#
         * @private
         */
        EquatorialCrs.prototype._setupPosBeforeTrans = function (posWorld) {
            if (posWorld[0] > 180) {
                posWorld[0] -= 360.0;
            }
        };

        /**
         * @function getName
         * @memberOf EquatorialCrs#
         */
        EquatorialCrs.prototype.getName = function () {
            return Constants.CRS.Equatorial;
        };

        /**
         * @function getDescription
         * @memberOf EquatorialCrs#
         * @abstract
         */
        EquatorialCrs.prototype.getDescription = function () {
            return DESCRIPTION;
        };


        /**************************************************************************************************************/

        return EquatorialCrs;

    });
