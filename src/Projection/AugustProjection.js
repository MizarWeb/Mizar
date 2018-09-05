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
     * @name AugustProjection
     * @class
     *    The August coordinate system is a coordinate reference system. It is composed of :
     * <ul>
     * <li>a reference frame : the reference geoid, which is set as parameter of the options object,</li>
     * <li>a projection : the August projection.</li>
     * </ul>
     * <img src="../doc/images/august.png" width="200px">
     * @augments AbstractProjection
     * @param {AbstractProjection.configuration} [options] - August projection configuration.
     * @constructor
     * @memberOf module:Projection
     */
    var AugustProjection = function(options) {
        AbstractProjection.prototype.constructor.call(
            this,
            [0, 0],
            [-180, -90, 180, 90],
            options
        );
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractProjection, AugustProjection);

    /**************************************************************************************************************/

    /**
     * @function unProject
     * @memberOf AugustProjection#
     * @throws "must be implemented"
     */
    AugustProjection.prototype.unProject = function(position3d, dest) {
        throw new SyntaxError("must be implemented");
    };

    /**
     * @function project
     * @memberOf AugustProjection#
     */
    AugustProjection.prototype.project = function(geoPos, dest) {
        if (!dest) {
            dest = new Array(3);
        }

        var lambda = (geoPos[0] * Math.PI) / 180; // longitude
        var phi = (geoPos[1] * Math.PI) / 180; // latitude

        var tanPhi = Math.tan(phi / 2),
            k = Math.sqrt(1 - tanPhi * tanPhi),
            c = 1 + k * Math.cos((lambda /= 2)),
            x = (Math.sin(lambda) * k) / c,
            y = tanPhi / c,
            x2 = x * x,
            y2 = y * y;

        dest[0] = (4 / 3) * x * (3 + x2 - 3 * y2);
        dest[1] = (4 / 3) * y * (3 + 3 * x2 - y2);
        dest[2] = geoPos[2];
        return dest;
    };

    /**
     * @function getName
     * @memberOf AugustProjection#
     */
    AugustProjection.prototype.getName = function() {
        return Constants.PROJECTION.August;
    };

    /**************************************************************************************************************/

    return AugustProjection;
});
