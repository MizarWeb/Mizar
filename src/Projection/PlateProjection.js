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

define(['./AbstractProjection', '../Utils/Utils', '../Utils/Constants', '../Renderer/glMatrix'],
    function (AbstractProjection, Utils, Constants) {
        /**
         * @name PlateProjection
         * @class
         *    The Plate coordinate system is a coordinate reference system. It is composed of :
         * <ul>
         * <li>a reference frame : the reference geoid, which is set as parameter of the options object,</li>
         * <li>a projection : the Plate carrée projection.</li>
         * </ul>
         * <img src="../doc/images/platecarré.png" width="200px"/>
         * @augments AbstractProjection
         * @param {AbstractProjection.configuration} [options] - No options.
         * @constructor
         * @see {@link https://en.wikipedia.org/wiki/Mollweide_projection}
         * @memberOf module:Projection
         */
        var PlateProjection = function (options) {
            AbstractProjection.prototype.constructor.call(this, [0,0], [-180, -90, 180, 90], options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractProjection, PlateProjection);

        /**************************************************************************************************************/

        /**
         * @function unProject
         * @memberOf PlateProjection#
         */
        PlateProjection.prototype.unProject = function (position3d, dest) {
            if (!dest) {
                dest = new Array(3);
            }
            dest[0] = position3d[0] * 180 / Math.PI;
            dest[1] = position3d[1] * 180 / Math.PI;

            // No 3D, get altitude
            
            dest[2] = position3d[2];

            return dest;
        };

        /**
         * @function project
         * @memberOf PlateProjection#
         */
        PlateProjection.prototype.project = function (geoPos, dest) {

            if (!dest) {
                dest = new Array(3);
            }
            dest[0] = geoPos[0] * Math.PI / 180;
            dest[1] = geoPos[1] * Math.PI / 180;
            dest[2] = geoPos[2];
            return dest;
        };

        /**
         * @function getName
         * @memberOf PlateProjection#
         */
        PlateProjection.prototype.getName = function() {
            return Constants.PROJECTION.Plate;
        };

        /**************************************************************************************************************/

        return PlateProjection;

    });
