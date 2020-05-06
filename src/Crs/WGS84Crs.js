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
import AbstractCrs from "./AbstractCrs";
import GeoBound from "../Renderer/GeoBound";
import Utils from "../Utils/Utils";
import Constants from "../Utils/Constants";
import Numeric from "../Utils/Numeric";
const DESCRIPTION =
  "WGS84 coordinate Reference System is a coordinate system using the Earth geoide in which " +
  "the geographic longitude increases to the east. The geographic latitude is measured in degrees north or south " +
  "of the Earth equator. In Mizar, the latitudes are projected on a sphere";

/**
 * @constant
 * @type {string}
 */
const LONGITUDE_LABEL = "Long";

/**
 * @constant
 * @type {string}
 */
const LATITUDE_LABEL = "Lat";

/**
 * @name WGS84Crs
 * @class
 * WGS84 coordinate Reference System is a coordinate system using the Earth geoide in which the
 * geographic longitude increases to the east. The geographic latitude is measured in degrees north or south
 * of the Earth equator.
 * <br/>
 * <img src="../doc/images/earth.jpg" width="200px"/>
 * <br/>
 * WGS84Crs is initialized with the following parameters :
 * <ul>
 *     <li>geoideName = CRS:84</li>
 *     <li>radius = 1</li>
 *     <li>realPlanetRadius = 6378137 meters</li>
 *     <li>type = Planet</li>
 *     <li>geoBound = new GeoBound(-180, -90, 180, 90)</li>
 * </ul>
 * @augments AbstractCrs
 * @param options - No option to give.
 * @constructor
 * @memberof module:Crs
 */
var WGS84Crs = function (options) {
  AbstractCrs.prototype.constructor.call(this, {
    geoideName: Constants.CRS.WGS84,
    radius: 1.0,
    realPlanetRadius: 6378137,
    type: Constants.CONTEXT.Planet,
    geoBound: new GeoBound(-180, -90, 180, 90)
  });
};

/**************************************************************************************************************/

Utils.inherits(AbstractCrs, WGS84Crs);

/**************************************************************************************************************/

/**
 * Formats the coordinates (longitude, latitude) as (x.xxx&deg, y.yyy&deg).
 * @function formatCoordinates
 * @memberof WGS84Crs#
 * @param {float[]} geo the spatial position in degree
 * @return {string[]} the formatted chain
 */
WGS84Crs.prototype.formatCoordinates = function (geo) {
  var astro = [];
  var longitude = Numeric.roundNumber(geo[0], 3);
  var latitude = Numeric.roundNumber(geo[1], 3);
  astro[0] = this.getLatitudeLabel() + " = ";
  astro[0] += latitude >= 0 ? latitude + " N" : -1.0 * latitude + " S";
  astro[1] = this.getLongitudeLabel() + " = ";
  astro[1] += longitude >= 0 ? longitude + " E" : -1.0 * longitude + " W";
  return astro;
};

/**
 * @function getLongitudeLabel
 * @memberof WGS84Crs#
 */
WGS84Crs.prototype.getLongitudeLabel = function () {
  return LONGITUDE_LABEL;
};

/**
 * @function getLatitudeLabel
 * @memberof WGS84Crs#
 */
WGS84Crs.prototype.getLatitudeLabel = function () {
  return LATITUDE_LABEL;
};

/**
 * @function _setupPosAfterTrans
 * @memberof WGS84Crs#
 * Do nothing
 * @param posWorld
 * @private
 */
WGS84Crs.prototype._setupPosAfterTrans = function (posWorld) {
  //Do Nothing
};

/**
 * Do nothing
 * @function _setupPosBeforeTrans
 * @memberof WGS84Crs#
 * @param posWorld
 * @private
 */
WGS84Crs.prototype._setupPosBeforeTrans = function (posWorld) {
  //Do Nothing
};

/**
 * @function getName
 * @memberof WGS84Crs#
 */
WGS84Crs.prototype.getName = function () {
  return Constants.CRS.WGS84;
};

/**
 * @function getDescription
 * @memberof WGS84Crs#
 */
WGS84Crs.prototype.getDescription = function () {
  return DESCRIPTION;
};

export default WGS84Crs;
