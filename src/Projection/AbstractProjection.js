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

import GeoBound from "../Renderer/GeoBound";
/**
 * Base projection configuration
 * @typedef {Object} AbstractProjection.configuration
 * @property {PROJECTION} projectionName - Name of the projection
 */

/**
 * @name AbstractProjection
 * @class
 *   Abstract class for projections.
 * A map projection is one of many methods used to represent the 3-dimensional surface of the earth or other round body
 * on a 2-dimensional plane in cartography. The creation of a map projection involves two steps :
 * <ul>
 *     <li>selection of a model for the shape of the body (choosing between a sphere or ellipsoid),</li>
 *     <li>transform planetographic coordinates to plane coordinates.</li>
 * </ul>
 * @param {float[]} projectionCenter - the projection center as (longitude, latitude)
 * @param {float[]} geoBound - Geo boundary as [minLongitude, minLatitude, maxLongitude, maxLatitude]
 * @param {AbstractProjection.configuration} options - Not used currently
 * @constructor
 * @implements {Projection}
 */
var AbstractProjection = function (projectionCenter, geoBound, options) {
  this.geoBound = new GeoBound(geoBound[0], geoBound[1], geoBound[2], geoBound[3]);
  this.projectionCenter = projectionCenter;
  this.options = options || {};
};

/**
 * @function getProjectionCenter
 * @memberof AbstractProjection#
 */
AbstractProjection.prototype.getProjectionCenter = function () {
  return this.projectionCenter;
};

/**
 * @function getGeoBound
 * @memberof AbstractProjection#
 */
AbstractProjection.prototype.getGeoBound = function () {
  return this.geoBound;
};

/**
 * @function unProject
 * @memberof AbstractProjection#
 * @abstract
 */
AbstractProjection.prototype.unProject = function (position3d, dest) {
  throw new SyntaxError("unProject not implemented", "AbstractProjection.js");
};

/**
 * @function project
 * @memberof AbstractProjection#
 * @abstract
 */
AbstractProjection.prototype.project = function (geoPos, dest) {
  throw new SyntaxError("project not implemented", "AbstractProjection.js");
};

/**
 * @function getName
 * @memberof AbstractProjection#
 * @abstract
 */
AbstractProjection.prototype.getName = function () {
  throw new SyntaxError("getName not implemented", "AbstractProjection.js");
};

/**************************************************************************************************************/

export default AbstractProjection;
