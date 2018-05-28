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

define(['../Renderer/Ray','../Utils/Utils'], function (RayParent,Utils) {

  var Ray = function (orig,dir) {
      RayParent.prototype.constructor.call(this,orig,dir);
  };

  Utils.inherits(RayParent, Ray);


    Ray.prototype.nodeIntersect = function (node, intersects) {
        var i;
        intersects = intersects || [];

        for (i = 0; i < node.children.length; i++) {
            node.children[i].intersectWith(this, intersects);
        }

        for (i = 0; i < node.geometries.length; i++) {
            this.geometryIntersect(node.geometries[i], intersects);
        }

        intersects.sort(function (a, b) {
            return a.t - b.t;
        });
        return intersects;
    };

    Ray.prototype.lodNodeIntersect = function (node, intersects) {
        var i;
        intersects = intersects || [];

        if (this.sphereIntersect(node.center, node.radius) >= 0) {
            if (node.children.length > 0 && node.childToLoad === 0) {
                for (i = 0; i < node.children.length; i++) {
                    this.lodNodeIntersect(node.children[i], intersects);
                }
            }
            else {
                for (i = 0; i < node.geometries.length; i++) {
                    this.geometryIntersect(node.geometries[i], intersects);
                }
            }
        }

        return intersects;
    };

    Ray.prototype.geometryIntersect = function (geometry, intersects) {
        var indices = geometry.mesh.indices;
        for (var i = 0; i < indices.length; i += 3) {
            var intersect = this.triangleIntersectOptimized(geometry.mesh.vertices, geometry.mesh.numElements * indices[i],
                geometry.mesh.numElements * indices[i + 1], geometry.mesh.numElements * indices[i + 2]);

            if (intersect) {
                intersect.geometry = geometry;
                intersects.push(intersect);
            }
        }
    };
    console.log(Ray);


    return Ray;

});
