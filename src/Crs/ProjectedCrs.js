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
define(['./AbstractCrs', '../Utils/Utils', '../Projection/ProjectionFactory','../Renderer/glMatrix'],
    function (AbstractCrs, Utils, ProjectionFactory) {

        /**
         * ProjectedCrs configuration
         * @typedef {AbstractCrs.geoide_configuration} AbstractCrs.configuration
         * @property {CRS} geoideName - name of the coordinate reference system
         * @property {CONTEXT} type - Type of the CRS
         * @property {GeoBound} geoBound - Geographical bounding box
         */        

        /**
         * @name ProjectedCrs
         * @class
         * A coordinate reference system projected on a 2D map.
         * @augments AbstractCrs
         * @param {Crs} cs - coordinate reference system
         * @param {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} options - projection configuration
         * @constructor
         * @memberOf module:Crs
         * @throws {ReferenceError} Will throw when options.projectionName is not defined
         * @throws {RangeError} Will throw when options.projectionName is not part of {@link PROJECTION}
         */
        var ProjectedCrs = function (cs, options) {
            AbstractCrs.prototype.constructor.call(this, {
                geoideName: cs.getGeoideName(),
                radius: cs.getGeoide().getRadius(),
                realPlanetRadius: cs.getGeoide().getRealPlanetRadius(),
                type: cs.getType(),
                geoBound: cs.getGeoBound()                
            });
            this.cs = cs;
            this.projection = ProjectionFactory.create(options);
            this.geoBound.setWest(this.projection.getGeoBound().getWest());
            this.geoBound.setSouth(this.projection.getGeoBound().getSouth());
            this.geoBound.setEast(this.projection.getGeoBound().getEast());
            this.geoBound.setNorth(this.projection.getGeoBound().getNorth());
            this.flat = true;
        };
        /**************************************************************************************************************/

        Utils.inherits(AbstractCrs, ProjectedCrs);

        /**************************************************************************************************************/

        /**
         * Formats the coordinates
         * @function formatCoordinates
         * @memberOf ProjectedCrs
         * @param geo the spatial position in degrees
         * @return {string[]} the format coordinates of the geoide given in parameter
         */
        ProjectedCrs.prototype.formatCoordinates = function (geo) {
            return this.cs.formatCoordinates(geo);
        };

        /**
         * Returns the physical position in degrees.
         * @function getWorldFrom3D
         * @memberOf ProjectedCrs
         * @param position3d the position in 3D
         * @param {float[]} dest the physical position
         * @return {float[]} the physical position
         */
        ProjectedCrs.prototype.getWorldFrom3D = function (position3d, dest) {
            if (!dest) {
                dest = new Array(3);
            }
            this.projection.unProject(position3d, dest);
            this.cs._setupPosAfterTrans(dest);
            dest[2] = dest[2] / this.geoide.getHeightScale();
            return dest;
        };

        /**
         * Returns the 3D position from physical position
         * @param posWorld physical position
         * @param {float[]}dest the 3D position
         * @return {float[]} the 3D position
         */
        ProjectedCrs.prototype.get3DFromWorld = function (posWorld, dest) {
            if (!dest) {
                dest = vec3.create();
            }
            var pos = posWorld.slice(0);
            this.cs._setupPosBeforeTrans(pos);
            this.projection.project(pos, dest);
            dest[2] = dest[2] ? dest[2] * this.geoide.getHeightScale() : 0.0;
            return dest;
        };


        /**
         * Returns the local transformation
         * @function getLocalTransform
         * @memberOf ProjectedCrs#
         * @param {Array} geo
         * @param {Array} dest
         * @return {Array} dest Matrix as 16 values
         */
        ProjectedCrs.prototype.getLocalTransform = function (geo, dest) {
            if (!dest) {
                dest = mat4.create();
            }
            mat4.identity(dest);
            return dest;
        };

        /**************************************************************************************************************/

        /**
         * Returns the LHV transformation
         * @function getLHVTransform
         * @memberOf ProjectedCrs
         * @param {Array} geo
         * @param {Array} dest
         * @return {Array} dest Matrix as 16 values
         */
        ProjectedCrs.prototype.getLHVTransform = function (geo, dest) {
            if (!dest) {
                dest = mat4.create();
            }
            var pt = this.projection.project(geo);
            mat4.identity(dest);
            dest[12] = pt[0];
            dest[13] = pt[1];
            dest[14] = pt[2] ? pt[2] * this.geoide.getHeightScale() : 0.0;
            dest[15] = 1.0;
            return dest;
        };

        return ProjectedCrs;

    });