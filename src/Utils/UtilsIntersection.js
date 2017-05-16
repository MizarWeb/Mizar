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
define(["./Numeric", "../Tiling/HEALPixBase"], function (Numeric, HEALPixBase) {

    var UtilsIntersection = {};


    UtilsIntersection.convertPolygonToHealpixOrder = function (coordinates, fact, order) {
          return HEALPixBase.convertPolygonToHealpixOrder(coordinates, fact, order);
    };

    /**
     * Check if a point lies on a line
     * @param point
     * @param segmentStart
     * @param segmentEnd
     * @returns {boolean}
     */
    UtilsIntersection.pointInLine = function (point, segmentStart, segmentEnd) {
        var deltax = segmentEnd[0] - segmentStart[0];
        var deltay, t;
        var liesInXDir = false;

        if (deltax === 0) {
            liesInXDir = (point[0] === segmentStart[0]);
        } else {
            t = (point[0] - segmentStart[0]) / deltax;
            liesInXDir = (t >= 0 && t <= 1);
        }

        if (liesInXDir) {
            deltay = segmentEnd[1] - segmentStart[1];
            if (deltax === 0) {
                return (point[1] === segmentStart[1]);
            } else {
                t = (point[1] - segmentStart[1]) / deltay;
                return (t >= 0 && t <= 1);
            }
        } else {
            return false;
        }
    };

    /**
     *    Determine if a point lies inside a sphere of radius depending on viewport
     */
    UtilsIntersection.pointInSphere = function (ctx, point, sphere, pointTextureHeight) {
        var point3D = [];
        var sphere3D = [];

        // Compute pixel size vector to offset the points from the earth
        var pixelSizeVector = ctx.getRenderContext().computePixelSizeVector();

        ctx.getCoordinateSystem().get3DFromWorld(point, point3D);
        ctx.getCoordinateSystem().get3DFromWorld(sphere, sphere3D);

        var radius = pointTextureHeight * (pixelSizeVector[0] * sphere3D[0] + pixelSizeVector[1] * sphere3D[1] + pixelSizeVector[2] * sphere3D[2] + pixelSizeVector[3]);

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
        var lon = pt[0] * Math.PI / 180;
        var lat = pt[1] * Math.PI / 180;
        var x = Math.cos(lat) * Math.cos(lon);
        var y = Math.cos(lat) * Math.sin(lon);
        var z = Math.sin(lat);
        return [x,y,z];
    }

    function greatArcIntersection (a0,a1,b0,b1) {
        var p = vec3.cross(a0,a1,[]);
        var q = vec3.cross(b0,b1,[]);
        var t = vec3.normalize(vec3.cross(p,q,[]));

        var s1 = vec3.dot(vec3.cross(a0,p,[]),t);
        var s2 = vec3.dot(vec3.cross(a1,p,[]),t);
        var s3 = vec3.dot(vec3.cross(b0,q,[]),t);
        var s4 = vec3.dot(vec3.cross(b1,q,[]),t);

        var st =  Numeric.sign(-s1) + Numeric.sign(s2) + Numeric.sign(-s3) + Numeric.sign(s4);
        return Math.abs(st) === 4;
    };    

    /**
     * Point in ring with spherical geometry
     */
    UtilsIntersection.pointInRing = function (point, ring) {
        var nvert = ring.length;
        var nbinter = 0;

        var p0 = to3D(point);
        var p1 = to3D([point[0],point[1]+90]);

        for (var i = 0; i < nvert-1; i++) {
            if (greatArcIntersection(to3D(ring[i]),to3D(ring[i+1]),p0,p1)) {
                nbinter++;
            }
        }
        return (nbinter % 2) === 1;
    };    

    return UtilsIntersection;

});