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
 * @name ProjectionFactory
 * @class
 * Factory to create a projection
 * @memberOf module:Projection
 */
define(["../Utils/Constants",
        "./AitoffProjection", "./AugustProjection",
        "./MercatorProjection", "./MollweideProjection",
        "./PlateProjection", "./AzimuthProjection"],
    function (Constants,
              AitoffProjection, AugustProjection,
              MercatorProjection, MollweideProjection,
              PlateProjection, AzimuthProjection) {

        /**
         * Creates a projection based on the name of the projection and its options.
         * @param {PROJECTION} projectionName - Name of the projection
         * @param {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} options - Options for the projection
         * @returns {Projection} projection
         * @throws {RangeError} Will throw when options.projectionName is not part of {@link PROJECTION}
         * @private
         */
        function _createProjection(projectionName, options) {
            var cs;
            switch (projectionName) {
                case Constants.PROJECTION.Aitoff :
                    cs = new AitoffProjection(options);
                    break;
                case Constants.PROJECTION.August :
                    cs = new AugustProjection(options);
                    break;
                case Constants.PROJECTION.Azimuth :
                    cs = new AzimuthProjection(options);
                    break;
                case Constants.PROJECTION.Mercator :
                    cs = new MercatorProjection(options);
                    break;
                case Constants.PROJECTION.Mollweide :
                    cs = new MollweideProjection(options);
                    break;
                case Constants.PROJECTION.Plate :
                    cs = new PlateProjection(options);
                    break;
                default :
                    throw new RangeError("Unable to create the projection " + options.projectionName,"ProjectionFactory.js");
            }
            return cs;
        }

        return {
            /**
             * Create a projection
             * @param {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} options - Options.
             * @return {Projection}
             * @throws {ReferenceError} Will throw when options.projectionName is not defined
             * @throws {RangeError} Will throw when options.projectionName is not part of {@link PROJECTION}
             * @alias module:Projection.ProjectionFactory.create
             */
            create : function (options) {
                var cs;

                if (options && options.projectionName) {
                    cs =_createProjection(options.projectionName, options);
                } else {
                    throw new ReferenceError("Unable to get options.projectionName","ProjectionFactory.js");
                }

                return cs;
            }

        }});



