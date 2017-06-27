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
define([], function () {

    /**
     * Geoide configuration
     * @typedef {Object} AbstractCrs.geoide_configuration
     * @property {float} radius - internal radius in vector length
     * @property {float} realPlanetRadius - real planet radius in meter
     */

    /**
     * @name Geoide
     * @class
     * Geodetic datum is a set of parameters that define the position of the origin, the scale, and the orientation of a
     * coordinate system in relationship with the planet.
     * @param {AbstractCrs.geoide_configuration} options - Options for Geoide
     * @constructor
     * @throws {ReferenceError} Will throw an error when options.realPlanetRadius or options.radius are not defined
     * @memberOf module:Crs
     * @todo add flattening parameter
     */
    var Geoide = function (options) {
        this.radius = options && options.hasOwnProperty('radius') ? options.radius : null;
        this.realPlanetRadius = options && options.hasOwnProperty('realPlanetRadius') ? options.realPlanetRadius : null;
        if (this.radius === null || this.realPlanetRadius === null) {
            throw new ReferenceError("Radius and realPlanetRadius must be set to define a geoide", "Geoide.js");
        }
        this.heightScale = 1.0 / this.realPlanetRadius;
    };


    /**
     * Get real planet radius in meter
     * @function getRealPlanetRadius
     * @memberOf Geoide#
     * @return {float} Real planet radius
     */
    Geoide.prototype.getRealPlanetRadius = function () {
        return this.realPlanetRadius;
    };

    /**
     * Get radius in vector length
     * @function getRadius
     * @memberOf Geoide#
     * @return {float} Radius
     */
    Geoide.prototype.getRadius = function () {
        return this.radius;
    };

    /**
     * Get height scale = 1/realPlanetRadius
     * @function getHeightScale
     * @memberOf Geoide#
     * @return {float} Height scale
     */
    Geoide.prototype.getHeightScale = function () {
        return this.heightScale;
    };
    /**************************************************************************************************************/

    return Geoide;

});
