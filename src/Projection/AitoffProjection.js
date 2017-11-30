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
/**
 * Mizar owns different types of projection, which is used to represent a planet on a 2D map.
 * <table border="1">
 *     <tr>
 *         <td><img src="../doc/images/aitoff.png" width="200px"/></td>
 *         <td>{@link module:Projection.AitoffProjection AitoffProjection}</td>
 *         <td>Provides a AITOFF projection</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/august.png" width="200px"/></td>
 *         <td>{@link module:Projection.AugustProjection AugustProjection}</td>
 *         <td>Provides an august projection</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/azimuth.png" width="200px"/></td>
 *         <td>{@link module:Projection.AzimuthProjection AzimuthProjection}</td>
 *         <td>Provides an azimuth projection</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/mercator.png" width="200px"/></td>
 *         <td>{@link module:Projection.MercatorProjection MercatorProjection}</td>
 *         <td>Provides a mercator projection</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/mollweide.png" width="200px"/></td>
 *         <td>{@link module:Projection.MollweideProjection MollweideProjection}</td>
 *         <td>Provides a mollweide projection</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/platecarré.png" width="200px"/></td>
 *         <td>{@link module:Projection.PlateProjection PlateProjection}</td>
 *         <td>Provides a plate carrée projection</td>
 *     </tr>
 * </table>
 *
 * The projection is automatically instantiated by the {@link module:Crs.ProjectedCrs ProjectedCrs} class.
 * @module Projection
 * @implements {Projection}
 */
define(['./AbstractProjection', '../Utils/Utils', '../Renderer/glMatrix'],
    function (AbstractProjection, Utils) {
        /**
         * @name AitoffProjection
         * @class
         *    The Aitoff coordinate system is a coordinate reference system. It is composed of :
         * <ul>
         *  <li>a reference frame : the reference geoid, which is set as parameter of the options object,</li>
         *  <li>a projection : the Aitoff projection.</li>
         * </ul>
         *
         * The Aitoff projection is a modified azimuthal map projection first proposed by David A. Aitoff in 1889.
         * Based on the equatorial form of the azimuthal equidistant projection, Aitoff halved longitudes from the central
         * meridian, projected by the azimuthal equidistant, and then stretched the result horizontally into a 2:1 ellipse.
         * <img src="../doc/images/aitoff.png" width="200px"/>
         *
         *
         * @see {@link https://en.wikipedia.org/wiki/Aitoff_projection}
         * @augments AbstractProjection
         * @param {AbstractProjection.configuration} [options] - Aitoff projection configuration.
         * @constructor
         * @memberOf module:Projection
         */
        var AitoffProjection = function (options) {
            AbstractProjection.prototype.constructor.call(this, [0, 0], [-180, -90, 180, 90], options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractProjection, AitoffProjection);

        /**************************************************************************************************************/

        /**
         *    Inverse sampling function(sinc)
         */
        var _sinci = function (x) {
            return x ? x / Math.sin(x) : 1;
        };


        /**
         * @function unProject
         * @memberOf AitoffProjection#
         */
        AitoffProjection.prototype.unProject = function (position3d, dest) {
            if (!dest) {
                dest = new Array(3);
            }

            var epsilon = 0.005;
            var deltaLambda;
            var deltaPhi;
            // Abort if [x, y] is not within an ellipse centered at [0, 0] with
            // semi-major axis pi and semi-minor axis pi/2.
            if (position3d[0] * position3d[0] + 4 * position3d[1] * position3d[1] > Math.PI * Math.PI + epsilon) {
                return;
            }

            var lambda = position3d[0],
                phi = position3d[1],
                i = 25;

            do {
                var sinLambda = Math.sin(lambda),
                    sinLambda_2 = Math.sin(lambda / 2),
                    cosLambda_2 = Math.cos(lambda / 2),
                    sinPhi = Math.sin(phi),
                    cosPhi = Math.cos(phi),
                    sin_2phi = Math.sin(2 * phi),
                    sin2phi = sinPhi * sinPhi,
                    cos2phi = cosPhi * cosPhi,
                    sin2lambda_2 = sinLambda_2 * sinLambda_2,
                    F,
                    C = 1 - cos2phi * cosLambda_2 * cosLambda_2,
                    E = C ? Math.acos(cosPhi * cosLambda_2) * Math.sqrt(F = 1 / C) : F = 0,
                    fx = 2 * E * cosPhi * sinLambda_2 - position3d[0],
                    fy = E * sinPhi - position3d[1],
                    deltaXLambda = F * (cos2phi * sin2lambda_2 + E * cosPhi * cosLambda_2 * sin2phi),
                    deltaXPhi = F * (0.5 * sinLambda * sin_2phi - E * 2 * sinPhi * sinLambda_2),
                    deltaYLambda = F * 0.25 * (sin_2phi * sinLambda_2 - E * sinPhi * cos2phi * sinLambda),
                    deltaYPhi = F * (sin2phi * cosLambda_2 + E * sin2lambda_2 * cosPhi),
                    denominator = deltaXPhi * deltaYLambda - deltaYPhi * deltaXLambda;
                if (!denominator) {
                    break;
                }
                deltaLambda = (fy * deltaXPhi - fx * deltaYPhi) / denominator;
                deltaPhi = (fx * deltaYLambda - fy * deltaXLambda) / denominator;
                lambda -= deltaLambda;
                phi -= deltaPhi;
            } while ((Math.abs(deltaLambda) > epsilon || Math.abs(deltaPhi) > epsilon) && --i > 0);

            dest[0] = lambda * 180 / Math.PI;
            dest[1] = phi * 180 / Math.PI;
            dest[2] = position3d[2];
            return dest;
        };

        /**
         * @function project
         * @memberOf AitoffProjection#
         */
        AitoffProjection.prototype.project = function (geoPos, dest) {
            if (!dest) {
                dest = new Array(3);
            }

            var lambda = geoPos[0] * Math.PI / 180; // longitude
            var phi = geoPos[1] * Math.PI / 180;  // latitude

            var cosPhi = Math.cos(phi);
            var sinciAlpha = _sinci(Math.acos(cosPhi * Math.cos(lambda /= 2)));

            dest[0] = 2 * cosPhi * Math.sin(lambda) * sinciAlpha;
            dest[1] = Math.sin(phi) * sinciAlpha;
            dest[2] = this.getDefaultZ();
            //dest[2] = geoPos[2];

            // Triple winkel: mode
            // TODO: inverse
            // dest[0] = (dest[0] + lambda / Math.PI/2) / 2;
            // dest[1] = (dest[1] + phi) / 2;

            return dest;
        };

        /**************************************************************************************************************/

        return AitoffProjection;

    });
