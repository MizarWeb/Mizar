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
    "./AbstractProjection",
    "../Utils/Utils",
    "../Utils/Constants",
    "../Renderer/glMatrix"
], function(AbstractProjection, Utils, Constants) {
    /**
     * @name MollweideProjection
     * @class
     *    The Mollweide coordinate system is a coordinate reference system. It is composed of :
     * <ul>
     * <li>a reference frame : the reference geoid, which is set as parameter of the options object,</li>
     * <li>a projection : the Mollweide projection.</li>
     * </ul>
     * The Mollweide projection is an equal-area, pseudocylindrical map projection generally used for global maps of
     * the world or night sky.<br/>
     * <img src="../doc/images/mollweide.png" width="200px"/>
     * @augments AbstractProjection
     * @param {AbstractProjection.configuration} [options] - No options.
     * @constructor
     * @see {@link https://en.wikipedia.org/wiki/Mollweide_projection}
     * @memberof module:Projection
     */
    var MollweideProjection = function(options) {
        AbstractProjection.prototype.constructor.call(
            this,
            [0, 0],
            [-180, -90, 180, 90],
            options
        );
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractProjection, MollweideProjection);

    /**************************************************************************************************************/

    /**
     *  Newton-Raphson method to find auxiliary theta needed for mollweide x/y computation
     *  @see https://en.wikipedia.org/wiki/Mollweide_projection
     */
    function _findTheta(lat) {
        // Avoid divide by zero
        if (Math.abs(lat) === Math.PI / 2) {
            return lat;
        }

        var epsilon = 0.001;
        var thetaN = lat; // n
        var thetaN1; // n+1

        do {
            var twoThetaN = 2 * thetaN;
            thetaN = thetaN1;
            if (!thetaN) {
                thetaN = lat;
            }
            thetaN1 =
                twoThetaN / 2 -
                (twoThetaN + Math.sin(twoThetaN) - Math.PI * Math.sin(lat)) /
                    (2 + 2 * Math.cos(twoThetaN));
        } while (Math.abs(thetaN1 - thetaN) >= epsilon);

        return thetaN1;
    }

    /**
     * @function unProject
     * @memberof MollweideProjection#
     */
    MollweideProjection.prototype.unProject = function(position3d, dest) {
        if (!dest) {
            dest = new Array(3);
        }

        var auxTheta = Math.asin(position3d[1] / Math.sqrt(2));
        var phi = Math.asin((2 * auxTheta + Math.sin(2 * auxTheta)) / Math.PI);
        var lambda =
            (Math.PI * position3d[0]) / (2 * Math.sqrt(2) * Math.cos(auxTheta));

        dest[0] = (lambda * 180) / Math.PI;
        dest[1] = (phi * 180) / Math.PI;
        dest[2] = position3d[2];
        return dest;
    };

    /**
     * @function project
     * @memberof MollweideProjection#
     */
    MollweideProjection.prototype.project = function(geoPos, dest) {
        if (!dest) {
            dest = new Array(3);
        }

        var lambda = (geoPos[0] * Math.PI) / 180; // longitude
        var theta0 = (geoPos[1] * Math.PI) / 180; // latitude
        var auxTheta = _findTheta(theta0);

        // Transfrom to Mollweide coordinate system
        var mollX =
            ((2 * Math.sqrt(2)) / Math.PI) * lambda * Math.cos(auxTheta);
        var mollY = Math.sqrt(2) * Math.sin(auxTheta);

        dest[0] = mollX;
        dest[1] = mollY;
        dest[2] = geoPos[2];
        return dest;
    };

    /**
     * @function getName
     * @memberof MollweideProjection#
     */
    MollweideProjection.prototype.getName = function() {
        return Constants.PROJECTION.Mollweide;
    };

    /**************************************************************************************************************/

    return MollweideProjection;
});
