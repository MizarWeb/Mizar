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
 * Projection is an interface that provides many methods used to represent the 3-dimensional surface of the earth or
 * other round body on a 2-dimensional plane in cartography. The creation of a map projection involves two steps :
 * <ul>
 *     <li>selection of a {@link Projection#getGeoBound model for the shape of the body} (choosing between a sphere or
 *     ellipsoid),</li>
 *     <li>transform {@link Projection#project planetographic coordinates to plane coordinates}.</li>
 * </ul>
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
 * @see {@link module:Projection the projection package}
 * @interface
 */
function Projection() {}

/**
 * Returns the projection center.
 * @returns {float[]} the projection center (longitude in degree, latitude in degree)
 */
Projection.prototype.getProjectionCenter = function() {};

/**
 * Returns the geobound
 * @returns {GeoBound}
 */
Projection.prototype.getGeoBound = function() {};

/**
 * Unprojects coordinates from a given 2D map to world coordinates
 * @param {float[]} position3d - 3D position on the map (x in pixel, y in pixel, altitude in meter)
 * @param {float[]} dest - physical position (longitude in degree, latitude in degree, altitude in meter)
 * @returns {float[]} physical position (longitude in degree, latitude in degree, altitude in meter)
 */
Projection.prototype.unProject = function (position3d, dest) {};

/**
 * Projects the world coordinates to a given 2D map
 * @param {float[]} geoPos - physical position (longitude in degree, latitude in degree, altitude in meter)
 * @param {float[]} dest - position on the map (x in pixel, y in pixel, altitude in meter)
 * @returns {float[]} position on the map (x in pixel, y in pixel, altitude in meter)
 */
Projection.prototype.project = function (geoPos, dest) {};
