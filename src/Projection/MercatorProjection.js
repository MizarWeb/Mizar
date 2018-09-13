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
     * Mercator projection configuration
     * @typedef {AbstractProjection.configuration} AbstractProjection.mercator_configuration
     * @property {float} [lambda0 = 0.0] - the longitude of an arbitrary central meridian usually(but not always) Greenwich, in degrees
     * (default value is 0)
     */

    /**
     * @name MercatorProjection
     * @class
     *    The Mercator coordinate system is a coordinate reference system. It is composed of :
     * <ul>
     * <li>a reference frame : the reference geoide, which is set as parameter of the options object,</li>
     * <li>a projection : the Mercator projection.</li>
     * </ul>
     * The Mercator projection is a cylindrical map projection presented by the Flemish geographer and cartographer
     * Gerardus Mercator in 1569. It became the standard map projection for nautical purposes because of its ability to
     * represent lines of constant course<br/>
     * <img src="../doc/images/mercator.png" width="200px"/>
     * @augments AbstractProjection
     * @param {AbstractProjection.mercator_configuration} [options] - Mercator projection configuration.
     * @see {@link https://en.wikipedia.org/wiki/Mercator_projection}
     * @constructor
     * @memberof module:Projection
     */
    var MercatorProjection = function(options) {
        AbstractProjection.prototype.constructor.call(
            this,
            [0, 0],
            [-180, -80, 180, 84],
            options
        );
        this.lambda0 = options && options.lambda0 ? options.lambda0 : 0.0; // Greenwich (i.e., zero)
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractProjection, MercatorProjection);

    /**************************************************************************************************************/

    /**
     *  Hyperbolic sine
     */
    var _sinh = function(x) {
        var expY = Math.exp(x);
        return (expY - 1 / expY) / 2;
    };

    /**
     * @function unProject
     * @memberof MercatorProjection#
     */
    MercatorProjection.prototype.unProject = function(position3d, dest) {
        if (!dest) {
            dest = new Array(3);
        }

        dest[0] = this.lambda0 + (position3d[0] * 180) / Math.PI;
        dest[1] = (Math.atan(_sinh(position3d[1])) * 180) / Math.PI;
        dest[2] = position3d[2];

        if (Math.abs(dest[1]) > 85.05) return null;

        return dest;
    };

    /**
     * @function project
     * @memberof MercatorProjection#
     */
    MercatorProjection.prototype.project = function(geoPos, dest) {
        if (!dest) {
            dest = new Array(3);
        }

        // Clamp latitude values, since mercator converges to infinity at poles
        if (geoPos[1] > 85.05) {
            geoPos[1] = 85.05;
        }
        if (geoPos[1] < -85.05) {
            geoPos[1] = -85.05;
        }

        var longInRad = (geoPos[0] * Math.PI) / 180; // longitude
        var latInRad = (geoPos[1] * Math.PI) / 180; // latitude

        var x = longInRad - (this.lambda0 * Math.PI) / 180;
        var y = Math.log(Math.tan(latInRad) + 1 / Math.cos(latInRad));

        dest[0] = x;
        dest[1] = y;
        dest[2] = geoPos[2];
        return dest;
    };

    /**
     * @function getName
     * @memberof MercatorProjection#
     */
    MercatorProjection.prototype.getName = function() {
        return Constants.PROJECTION.Mercator;
    };

    /**************************************************************************************************************/

    return MercatorProjection;
});
