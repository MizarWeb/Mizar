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

define(['../Utils/Constants'], function (Constants) {

    /**************************************************************************************************************/

    /**
     @name GeoBound
     @class
         Geo Bound
     @param {float} w West
     @param {float} s South
     @param {float} e East
     @param {float} n North
     @constructor
     */
    var GeoBound = function (w, s, e, n) {
        this.south = s;
        this.west = w;
        this.north = n;
        this.east = e;
    };

    /**
     Get geo center
     @function getCenter
     @memberOf GeoBound.prototype
     @return {float[]} Geo center as array of 2 float
     */
    GeoBound.prototype.getCenter = function () {
        return [(this.east + this.west) * 0.5, (this.south + this.north) * 0.5, 0.0];
    };


    /**
     Get North
     @function getNorth
     @memberOf GeoBound.prototype
     @return {float} North
     */
    GeoBound.prototype.getNorth = function () {
        return this.north;
    };

    /**
     Set North
     @function setNorth
     @memberOf GeoBound.prototype
     @param {float} val
     */
    GeoBound.prototype.setNorth = function (val) {
        this.north = val;
    };

    /**
     Get South
     @function getSouth
     @memberOf GeoBound.prototype
     @return {float} South
     */
    GeoBound.prototype.getSouth = function () {
        return this.south;
    };

    /**
     Set South
     @function setSouth
     @memberOf GeoBound.prototype
     @param {float} val
     */
    GeoBound.prototype.setSouth = function (val) {
        this.south = val;
    };

    /**
     Get West
     @function getWest
     @memberOf GeoBound.prototype
     @return {float} West
     */
    GeoBound.prototype.getWest = function () {
        return this.west;
    };

    /**
     Set West
     @function setWest
     @memberOf GeoBound.prototype
     @param {float} val
     */
    GeoBound.prototype.setWest = function (val) {
        this.west = val;
    };

    /**
     Get East
     @function getEast
     @memberOf GeoBound.prototype
     @return {float} East
     */
    GeoBound.prototype.getEast = function () {
        return this.east;
    };

    /**
     Set East
     @function setEast
     @memberOf GeoBound.prototype
     @param {float} val
     */
    GeoBound.prototype.setEast = function (val) {
        this.east = val;
    };

    /**
     Compute the geo bound from coordinates
     @function computeFromCoordinates
     @memberOf GeoBound.prototype
     @param {float[][]} coordinates Coordinates as bi-dimensionnal array of float
     */
    GeoBound.prototype.computeFromCoordinates = function (coordinates) {
        this.west = coordinates[0][0];
        this.east = coordinates[0][0];
        this.south = coordinates[0][1];
        this.north = coordinates[0][1];

        for (var i = 1; i < coordinates.length; i++) {
            this.west = Math.min(this.west, coordinates[i][0]);
            this.east = Math.max(this.east, coordinates[i][0]);
            this.south = Math.min(this.south, coordinates[i][1]);
            this.north = Math.max(this.north, coordinates[i][1]);
        }
    };

    function transformCoordinates (coordinates, crsID, globeCrs) {
        var len = coordinates.length,
            convertedCoord = new Array(len); // boost in Safari
        for (var i=0; i<len; ++i) {
            convertedCoord[i] = coordinates[i].slice(0);
        }

        convertedCoord[0][0] = globeCrs.convert(coordinates[0][0], crsID, globeCrs.getGeoideName());
        convertedCoord[0][1] = globeCrs.convert(coordinates[0][1], crsID, globeCrs.getGeoideName());
        for (var j = 1; j < coordinates.length; j++) {
            convertedCoord[j][0] = globeCrs.convert(coordinates[j][0], crsID, globeCrs.getGeoideName());
            convertedCoord[j][1] = globeCrs.convert(coordinates[j][1], crsID, globeCrs.getGeoideName());
        }
        return convertedCoord;
    }

    GeoBound.prototype.computeFromCoordinatesInCrsTo = function (coordinates, crsID, globeCrs) {
        var coords;
        if(crsID === globeCrs.getGeoideName()) {
            coords = coordinates;
        } else {
            coords = transformCoordinates(coordinates, crsID, globeCrs);
        }
        this.computeFromCoordinates(coords);
        return coords;
    };

    /**
     Check if a point is inside the given bound
     @function isPointInside
     @memberOf GeoBound.prototype
     @param {Array} point The point
     @return {Boolean} return the test
     */
    GeoBound.prototype.isPointInside = function (point) {
        return point[0] >= this.west && point[0] <= this.east && point[1] >= this.south && point[1] <= this.north;
    };

    /**
     Intersects this geo bound with another one
     @function intersects
     @memberOf GeoBound.prototype
     @param {GeoBound} geoBound Geo bound
     @return {Boolean} Intersects ?
     */
    GeoBound.prototype.intersects = function (geoBound) {
        if (this.west >= geoBound.east || this.east <= geoBound.west) {
            return false;
        }

        return !(this.south >= geoBound.north || this.north <= geoBound.south);
    };

    /**
     Intersects this geo bound with GeoJSON geometry
     @function intersectsGeometry
     @memberOf GeoBound.prototype
     @param {JSON} geometry GeoJSON geometry
     @return {Boolean} Intersects ?
     */
    GeoBound.prototype.intersectsGeometry = function (geometry) {
        var isIntersected = false;
        var i, j;
        var geoBound = new GeoBound();
        var coords = geometry.coordinates;
        switch (geometry.type) {
            case Constants.GEOMETRY.LineString:
                geoBound.computeFromCoordinates(coords);
                isIntersected |= this.intersects(geoBound);
                break;
            case Constants.GEOMETRY.Polygon:
                // Don't take care about holes
                for (i = 0; i < coords.length && !isIntersected; i++) {
                    geoBound.computeFromCoordinates(coords[i]);
                    isIntersected |= this.intersects(geoBound);
                }
                break;
            case Constants.GEOMETRY.MultiLineString:
                for (i = 0; i < coords.length && !isIntersected; i++) {
                    geoBound.computeFromCoordinates(coords[i]);
                    isIntersected |= this.intersects(geoBound);
                }
                break;
            case Constants.GEOMETRY.MultiPolygon:
                for (i = 0; i < coords.length && !isIntersected; i++) {
                    for (j = 0; j < coords[i].length && !isIntersected; j++) {
                        geoBound.computeFromCoordinates(coords[i][j]);
                        isIntersected |= this.intersects(geoBound);
                    }
                }
                break;
        }
        return isIntersected;
    };

    /**************************************************************************************************************/

    return GeoBound;

});
