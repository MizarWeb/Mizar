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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/**
 * @name CoordinateSystemFactory
 * @class
 * Factory to create a coordinate reference system
 * @memberOf module:Crs
 */
define(["../Utils/Constants", "./WGS84Crs", "./Mars2000Crs", "./EquatorialCrs",
        "./GalacticCrs", "./ProjectedCrs"],
    function (Constants, WGS84Crs, Mars2000Crs,
              EquatorialCrs, GalacticCrs, ProjectedCrs) {


        return {
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
                if (options && options.geoideName) {
                    switch (options.geoideName) {
                        case Constants.CRS.Equatorial :
                            cs = new EquatorialCrs(options);
                            break;
                        case Constants.CRS.Galactic :
                            cs = new GalacticCrs(options);
                            break;
                        // For Earth
                        case Constants.CRS.WGS84 :
                            cs = new WGS84Crs(options);
                            break;
                        // For Mars
                        case Constants.CRS.Mars_2000_old:
                        case Constants.CRS.Mars_2000 :
                            cs = new Mars2000Crs(options);
                            break;
                        // Unknown geoide name
                        default :
                            throw new RangeError("Datum " + options.geoideName + " not implemented","CoordinateSystemFactory.js");
                    }
                } else {
                    throw new ReferenceError("geoideName not defined in " + JSON.stringify(options), "CoordinateSystemFactory.js");
                }

                if (options && options.projectionName) {
                    cs = new ProjectedCrs(cs, options);
                }
                return cs;
            }
        }
    });


