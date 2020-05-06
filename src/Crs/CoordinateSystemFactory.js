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
/**
 * @name CoordinateSystemFactory
 * @class
 * Factory to create a coordinate reference system
 * @memberof module:Crs
 */
import Constants from "../Utils/Constants";
import WGS84Crs from "./WGS84Crs";
import Mars2000Crs from "./Mars2000Crs";
import Moon2000Crs from "./Moon2000Crs";
import EquatorialCrs from "./EquatorialCrs";
import GalacticCrs from "./GalacticCrs";
import ProjectedCrs from "./ProjectedCrs";
import HorizontalLocalCrs from "./HorizontalLocalCrs";
import SunCrs from "./SunCrs";
/**
 * Creates a coordinate reference system based on its geoide name and its options.
 * @param {CRS} geoideName
 * @param {AbstractCrs.crsFactory} options - options to create a coordinate reference system
 * @returns {Crs} the created coordinate reference system
 * @throws {RangeError} Will throw an error when geoideName  is not part of {@link CRS}
 * @private
 */
function _createCrs(geoideName, options) {
  var cs;
  switch (geoideName) {
    case Constants.CRS.Equatorial:
      cs = new EquatorialCrs(options);
      break;
    case Constants.CRS.Galactic:
      cs = new GalacticCrs(options);
      break;
    // For Earth
    case Constants.CRS.WGS84:
      cs = new WGS84Crs(options);
      break;
    // For Mars
    case Constants.CRS.Mars_2000_old:
    case Constants.CRS.Mars_2000:
      cs = new Mars2000Crs(options);
      break;
    // For Moon
    case Constants.CRS.Moon_2000_old:
    case Constants.CRS.Moon_2000:
      cs = new Moon2000Crs(options);
      break;
    // For Ground
    case Constants.CRS.HorizontalLocal:
      cs = new HorizontalLocalCrs(options);
      break;
    // For Sun
    case Constants.CRS.Sun:
      cs = new SunCrs(options);
      break;
    // Unknown geoide name
    default:
      throw new RangeError("Datum " + geoideName + " not implemented", "CoordinateSystemFactory.js");
  }
  return cs;
}

export default {
  /**
   * Data model to create a coordinate reference system through the factory
   * @typedef {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} AbstractCrs.crsFactory
   * @property {CRS} options.geoideName - name of the geoide
   */
  /**
   * Factory for CRS.
   * @param {AbstractCrs.crsFactory} options - Options to create a coordinate reference system
   * @return {Crs} Object to handle CRS
   * @alias module:Crs.CoordinateSystemFactory.create
   * @throws {ReferenceError} Will throw an error when options.geoideName is not defined
   * @throws {RangeError} Will throw an error when options.geoideName  is not part of {@link CRS}
   * @throws {RangeError} Will throw an error when options.projectionName is not part of {@link PROJECTION}
   */
  create: function (options) {
    var cs;
    if (options.geoideName) {
      cs = _createCrs(options.geoideName, options);
    } else {
      throw new ReferenceError("geoideName not defined in " + JSON.stringify(options), "CoordinateSystemFactory.js");
    }

    if (options.projectionName) {
      cs = new ProjectedCrs(cs, options);
    }
    return cs;
  }
};
