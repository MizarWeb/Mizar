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
define(["./Numeric", "./Constants","../Tiling/HEALPixBase"], function(Numeric, Constants, HEALPixBase) {
    var UtilsIntersection = {};

    UtilsIntersection.convertPolygonToHealpixOrder = function(
        coordinates,
        fact,
        order
    ) {
        return HEALPixBase.convertPolygonToHealpixOrder(
            coordinates,
            fact,
            order
        );
    };

    /**
     * Check if a point lies on a line
     * @param point
     * @param segmentStart
     * @param segmentEnd
     * @returns {boolean}
     */
    UtilsIntersection.pointInLine = function(point, segmentStart, segmentEnd) {
        var deltax = segmentEnd[0] - segmentStart[0];
        var deltay, t;
        var liesInXDir = false;

        if (deltax === 0) {
            liesInXDir = point[0] === segmentStart[0];
        } else {
            t = (point[0] - segmentStart[0]) / deltax;
            liesInXDir = t >= 0 && t <= 1;
        }

        if (liesInXDir) {
            deltay = segmentEnd[1] - segmentStart[1];
            if (deltax === 0) {
                return point[1] === segmentStart[1];
            } else {
                t = (point[1] - segmentStart[1]) / deltay;
                return t >= 0 && t <= 1;
            }
        } else {
            return false;
        }
    };

    /**
     *    Determine if a point lies inside a sphere of radius depending on viewport
     */
    UtilsIntersection.pointInSphere = function(
        ctx,
        point,
        sphere,
        pointTextureHeight
    ) {
        var point3D = [];
        var sphere3D = [];

        // Compute pixel size vector to offset the points from the earth
        var pixelSizeVector = ctx.getRenderContext().computePixelSizeVector();

        ctx.getCoordinateSystem().get3DFromWorld(point, point3D);
        ctx.getCoordinateSystem().get3DFromWorld(sphere, sphere3D);

        var radius =
            pointTextureHeight *
            (pixelSizeVector[0] * sphere3D[0] +
                pixelSizeVector[1] * sphere3D[1] +
                pixelSizeVector[2] * sphere3D[2] +
                pixelSizeVector[3]);

        //Calculate the squared distance from the point to the center of the sphere
        var vecDist = [];
        vec3.subtract(point3D, sphere3D, vecDist);
        vecDist = vec3.dot(vecDist, vecDist);

        //Calculate if the squared distance between the sphere's center and the point
        //is less than the squared radius of the sphere
        if (vecDist < radius * radius) {
            return true;
        }

        //If not, return false
        return false;
    };

    /**
     * Convert spherical coordinate to cartesian
     */
    function to3D(pt) {
        var lon = (pt[0] * Math.PI) / 180;
        var lat = (pt[1] * Math.PI) / 180;
        var x = Math.cos(lat) * Math.cos(lon);
        var y = Math.cos(lat) * Math.sin(lon);
        var z = Math.sin(lat);
        return [x, y, z];
    }

    function greatArcIntersection(a0, a1, b0, b1) {
        var p = vec3.cross(a0, a1, []);
        var q = vec3.cross(b0, b1, []);
        var t = vec3.normalize(vec3.cross(p, q, []));

        var s1 = vec3.dot(vec3.cross(a0, p, []), t);
        var s2 = vec3.dot(vec3.cross(a1, p, []), t);
        var s3 = vec3.dot(vec3.cross(b0, q, []), t);
        var s4 = vec3.dot(vec3.cross(b1, q, []), t);

        var st =
            Numeric.sign(-s1) +
            Numeric.sign(s2) +
            Numeric.sign(-s3) +
            Numeric.sign(s4);
        return Math.abs(st) === 4;
    }

    /**
     * Point in ring with spherical geometry
     */
    UtilsIntersection.pointInRing = function(point, ring) {
        var nvert = ring.length;
        var nbinter = 0;

        var p0 = to3D(point);
        var p1 = to3D([point[0], point[1] + 90]);

        for (var i = 0; i < nvert - 1; i++) {
            if (
                greatArcIntersection(to3D(ring[i]), to3D(ring[i + 1]), p0, p1)
            ) {
                nbinter++;
            }
        }
        return nbinter % 2 === 1;
    };

    /**
     * Checks if a value v is between the interval [min, max].
     * @function isValueBetween
     * @param {float} v - value
     * @param {float} min - min value
     * @param {float} max - max value
     * @return {boolean} true when v is between min and max otherwise talse
     */
    UtilsIntersection.isValueBetween = function(v, min, max) {
        return min <= v && v <= max;
    };

    /**
     * Checks is two bounding boxes intersect
     * @function boundsIntersects
     * @param {{west:float, north:float, east:float, south:float}} a - bounding box
     * @param {{west:float, north:float, east:float, south:float}} b - bounding box
     * @return {boolean} true when the two bounding boxes intersect otherwise false
     */
    UtilsIntersection.boundsIntersects = function(a, b) {
        if (a === null || b === null) {
            return false;
        }
        if (a.north == null || b.north == null) {
            return false;
        }
        var xOk =
            UtilsIntersection.isValueBetween(a.west, b.west, b.east) ||
            UtilsIntersection.isValueBetween(a.east, b.west, b.east) ||
            (a.west <= b.west && a.east >= b.east);

        var yOk =
            UtilsIntersection.isValueBetween(a.north, b.south, b.north) ||
            UtilsIntersection.isValueBetween(a.south, b.south, b.north) ||
            (a.south <= b.south && a.north >= b.north);

        return xOk && yOk;
    };


    /**
     * Returns true when t1 intersects with t2 otherwise false
     * @function tileIntersectHealpixTile
     * @param {Tile} t1 
     * @param {Tile} t2 
     * @returns {boolean} true when t1 intersects with t2 otherwise false
     */
    UtilsIntersection.tileIntersectHealpixTile = function(t1, t2) {
        if (t1 === null || t2 === null) {
            return false;
        }

        var result;
        if (t1.level === t2.level) {
            result = t1.pixelIndex === t2.pixelIndex;
        } else if (t1.level > t2.level) {
            var diffLevel = t1.level - t2.level;
            result = t1.pixelIndex >> Math.pow(2, diffLevel) === t2.pixelIndex;
        } else {
            diffLevel = t2.level - t1.level;
            result = t2.pixelIndex >> Math.pow(2, diffLevel) === t1.pixelIndex;
        }      
        return result;
    };

    /**
     * Returns true when t1 intersects with t2 otherwise false
     * @function tileIntersectGeoTile
     * @param {Tile} t1 
     * @param {Tile} t2 
     * @returns {boolean} true when t1 intersects with t2 otherwise false
     */
    UtilsIntersection.tileIntersectGeoTile = function(t1, t2) {
        if (t1 === null || t2 === null) {
            return false;
        }

        var result;
        if (t1.level === t2.level) {
            result = t1.x === t2.x && t1.y === t2.y;
        } else if (t1.level > t2.level) {
            var diffLevel = t1.level - t2.level;
            var x1 = Math.pow(2, diffLevel) * t2.x;
            var x2 = Math.pow(2, diffLevel) * (t2.x + 1) - 1;
            var y1 = Math.pow(2, diffLevel) * t2.y;
            var y2 = Math.pow(2, diffLevel) * (t2.y + 1) - 1;
            result = UtilsIntersection.isValueBetween(t1.x, x1, x2) && UtilsIntersection.isValueBetween(t1.y, y1, y2);           
        } else {
            diffLevel = t2.level - t1.level;
            x1 = Math.pow(2, diffLevel) * t1.x;
            x2 = Math.pow(2, diffLevel) * (t1.x + 1) - 1;
            y1 = Math.pow(2, diffLevel) * t1.y;
            y2 = Math.pow(2, diffLevel) * (t1.y + 1) - 1;
            result = UtilsIntersection.isValueBetween(t2.x, x1, x2) && UtilsIntersection.isValueBetween(t2.y, y1, y2);         
        }      
        return result;
    };

    /**
     * Returns true when t1 intersects with t2 otherwise false
     * @function tileIntersect
     * @param {Tile} t1 
     * @param {Tile} t2 
     * @returns {boolean} true when t1 intersects with t2 otherwise false
     */
    UtilsIntersection.tileIntersect = function(t1, t2) {
        if (t1 === null || t2 === null) {
            return false;
        }
        var result;
        if (t1.type === Constants.TILE.GEO_TILE || t1.type === Constants.TILE.MERCATOR_TILE) {
            result = UtilsIntersection.tileIntersectGeoTile(t1, t2);
        } else if (t1.type === Constants.TILE.HEALPIX_TILE) {
            result = UtilsIntersection.tileIntersectHealpixTile(t1, t2);
        } else {
            throw new "Unknown tiling";
        }
        return result;
    };

    /**
     * Checks is one tile intersects intersect with a set of tiles
     * @function tileIntersects
     * @param {Tile} a - tile
     * @param {Tile[]} b - index
     * @return {boolean} true when intersection otherwise false
     */
    UtilsIntersection.tileIntersects = function(a, b) {
        if (a === null || b === null) {
            return false;
        }
        var result = false;
        for(var i=0; i<b.length && !result; i++) {
            var tile = b[i];
            result = UtilsIntersection.tileIntersect(a, tile);
        }
        return result;
    };

    /**
     * Checks if the coordinates cross the date line.
     * @function isCrossDateLine
     * @param {float} minLong - min longitude
     * @param {float} maxLong - max longitude
     * @return {boolean} true when the coordinates cross the date line otherwise false
     */
    UtilsIntersection.isCrossDateLine = function(minLong, maxLong) {
        return Math.abs(minLong - maxLong) > 180;
    };

    return UtilsIntersection;
});
