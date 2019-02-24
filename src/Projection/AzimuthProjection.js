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
    "./AbstractProjection",
    "../Utils/Utils",
    "../Utils/Numeric",
    "../Utils/Constants",
    "../Renderer/glMatrix"
], function(AbstractProjection, Utils, Numeric, Constants) {
    /**
     * Azimuthal projection configuration
     * @typedef {AbstractProjection.configuration} AbstractProjection.azimuth_configuration
     * @property {string} [pole = "north"] - Projection center. It can be "north" or "south"
     */

    /**
     * @name AzimuthProjection
     * @class
     *    The Azimuth coordinate system is a coordinate reference system. It is composed of :
     * <ul>
     * <li>a reference frame : the reference geoid, which is set as parameter of the options object,</li>
     * <li>a projection : the Azimuth projection.</li>
     * </ul>
     * <img src="../doc/images/azimuth.png" width="200px"/>
     *
     * @see {@link https://en.wikipedia.org/wiki/Azimuthal_equidistant_projection}
     * @augments AbstractProjection
     * @param {AbstractProjection.azimuth_configuration} [options] - Azimuthal projection configuration.
     * @constructor
     * @memberof module:Projection
     */
    var AzimuthProjection = function(options) {
        this.pole = (options && options.pole) || "north";
        var geoBound;
        var projectionCenter;
        if (this.pole === "south") {
            geoBound = [-180, -90, 180, 0];
            projectionCenter = [0, -90];
        } else {
            geoBound = [-180, 0, 180, 90];
            projectionCenter = [0, 90];
            this.pole = "north";
        }
        AbstractProjection.prototype.constructor.call(
            this,
            projectionCenter,
            geoBound,
            options
        );
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractProjection, AzimuthProjection);

    /**************************************************************************************************************/

    /**
     * @function unProject
     * @memberof AzimuthProjection#
     */
    AzimuthProjection.prototype.unProject = function(position3d, dest) {
        var p = Math.sqrt(
            position3d[0] * position3d[0] + position3d[1] * position3d[1]
        );
        var o = Math.atan2(position3d[0], -position3d[1]);

        p = Numeric.toDegree(p);
        o = Numeric.toDegree(o);

        o *= this.pole === "south" ? -1 : 1;

        if (p > 90) return null;

        if (!dest) {
            dest = new Array(3);
        }
        dest[0] = o;
        dest[1] = this.pole === "south" ? p - 90 : 90 - p;
        dest[2] = position3d[2];
        return dest;
    };

    /**
     * @function project
     * @memberof AzimuthProjection#
     */
    AzimuthProjection.prototype.project = function(geoPos, dest) {
        if (!dest) {
            dest = new Array(3);
        }
        var p = this.pole === "south" ? 90 + geoPos[1] : 90 - geoPos[1];
        p = Numeric.toRadian(p);

        var o = Numeric.toRadian(geoPos[0]);
        o *= this.pole === "south" ? -1 : 1;
        dest[0] = p * Math.sin(o);
        dest[1] = -p * Math.cos(o);
        dest[2] = geoPos[2];
        return dest;
    };

    /**
     * @function getName
     * @memberof AzimuthProjection#
     */
    AzimuthProjection.prototype.getName = function() {
        return Constants.PROJECTION.Azimuth;
    };

    /**************************************************************************************************************/

    return AzimuthProjection;
});
