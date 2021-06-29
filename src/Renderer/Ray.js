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

import "./glMatrix";
/**************************************************************************************************************/

/**
	 @name Ray
	 @class
	   Ray constructor
	 @param origin
	 @param dir
	 @constructor
	 */
var Ray = function (orig, dir) {
  this.orig = orig;
  this.dir = dir;
};

/**************************************************************************************************************/

/**
 * Create a ray from a pixel
 * @function createFromPixel
 * @memberof Ray
 * @param renderContext
 * @param x
 * @param y
 * @return {Ray} Ray
 */
Ray.createFromPixel = function (renderContext, x, y) {
  // reverse y because (0,0) is top left but opengl's normalized
  // device coordinate (-1,-1) is bottom left
  var nx = (x / renderContext.canvas.width) * 2.0 - 1.0;
  var ny = -((y / renderContext.canvas.height) * 2.0 - 1.0);

  var inverseViewProjectionMatrix = mat4.create();
  mat4.inverse(renderContext.viewProjectionMatrix, inverseViewProjectionMatrix);
  // Transform pos to world using inverse viewProjection matrix
  var pos3D = mat4.multiplyVec4(inverseViewProjectionMatrix, [nx, ny, -1, 1]);

  pos3D[0] /= pos3D[3];
  pos3D[1] /= pos3D[3];
  pos3D[2] /= pos3D[3];

  // console.log('Old EP ' + renderContext.eyePosition );
  var inverseViewMatrix = mat4.create();
  mat4.inverse(renderContext.viewMatrix, inverseViewMatrix);
  vec3.set([0.0, 0.0, 0.0], renderContext.eyePosition);
  mat4.multiplyVec3(inverseViewMatrix, renderContext.eyePosition);
  // console.log('New EP ' + renderContext.eyePosition );

  var orig = vec3.create(renderContext.eyePosition);
  var dir = vec3.subtract(pos3D, renderContext.eyePosition, vec3.create());
  vec3.normalize(dir);

  return new Ray(orig, dir);
};

/**************************************************************************************************************/

/**
 * Create a ray from an event
 * @function createFromEvent
 * @memberof Ray
 * @param renderContext
 * @param event
 * @return {Ray} Ray
 */
Ray.createFromEvent = function (renderContext, event) {
  var pos = renderContext.getXYRelativeToCanvas(event);
  return Ray.createFromPixel(pos[0], pos[1]);
};

/**************************************************************************************************************/

/**
 * Intersection object returned
 * @function Intersection
 * @memberof Ray
 * @param t
 */
Ray.Intersection = function (t) {
  this.t = t;
  this.geometry = null;
};

/**************************************************************************************************************/

/**
 * Compute a point on the ray given its t parameter
 * @function computePoint
 * @memberof Ray.prototype
 * @param t
 * @return Point
 */
Ray.prototype.computePoint = function (t) {
  var pt = vec3.create();
  vec3.scale(this.dir, t, pt);
  vec3.add(pt, this.orig);
  return pt;
};

/**************************************************************************************************************/

/**
 *	Compute intersection between a plan and ray
 * @function planeIntersect
 * @memberof Ray.prototype
 * @param {vec3} pt
 * @param {vec3} normal
 * @return {number}The nearest intersection, < 0 if no intersection
 */
Ray.prototype.planeIntersect = function (pt, normal) {
  // Assuming vectors are all normalized
  var denom = vec3.dot(normal, this.dir);
  var epsilon = 1e-6;
  if (Math.abs(denom) > epsilon) {
    var p0l0 = vec3.create();
    vec3.subtract(pt, this.orig, p0l0);
    var t = vec3.dot(p0l0, normal) / denom;
    return t;
  }
  return -1;
};

/**************************************************************************************************************/

/**
 * Compute intersection between a sphere and ray
 * @function sphereIntersect
 * @memberof Ray.prototype
 * @param center
 * @param radius
 * @return the nearest intersection, < 0 if no intersection
 */
Ray.prototype.sphereIntersect = function (center, radius) {
  // cf. http://wiki.cgsociety.org/index.php/Ray_Sphere_Intersection

  var rs = vec3.subtract(this.orig, center, vec3.create());
  // rayDirection is normalized so a = 1
  // var a = vec3.dot(rayDirection, rayDirection);
  var b = 2.0 * vec3.dot(this.dir, rs);
  var c = vec3.dot(rs, rs) - radius * radius;

  // as a == 1, discriminant = b^2 - (4*c)
  // var discr = (b*b) - (4*a*c);
  var discr = b * b - 4 * c;
  if (discr < 0) {
    return -1;
  }

  // t0 = (-b - sqrt(discr)) / 2a, t1 = (-b + sqrt(discr)) / 2a, a == 1
  discr = Math.sqrt(discr);
  var tNear = (-b - discr) / 2;
  var tFar = (-b + discr) / 2;
  if (tNear > tFar) {
    // Swap t values
    var tmp = tNear;
    tNear = tFar;
    tFar = tmp;
  }

  if (tFar < 0) {
    // Hit is beyond ray origin
    return -1;
  }

  return tNear < 0 ? tFar : tNear;
};

/**************************************************************************************************************/

var EPS = 1e-15;
/**
  * Ray triangle intersection optimized
  * @function triangleIntersectOptimized
  * @memberof Ray.prototype
  * @param verts
  * @param i0
  * @param i1
  * @param i2
  * @return the nearest intersection, null if no intersection

  */
Ray.prototype.triangleIntersectOptimized = function (verts, i0, i1, i2) {
  var e1x = verts[i1] - verts[i0];
  var e1y = verts[i1 + 1] - verts[i0 + 1];
  var e1z = verts[i1 + 2] - verts[i0 + 2];

  var e2x = verts[i2] - verts[i0];
  var e2y = verts[i2 + 1] - verts[i0 + 1];
  var e2z = verts[i2 + 2] - verts[i0 + 2];

  var px = this.dir[1] * e2z - this.dir[2] * e2y;
  var py = this.dir[2] * e2x - this.dir[0] * e2z;
  var pz = this.dir[0] * e2y - this.dir[1] * e2x;

  var det = e1x * px + e1y * py + e1z * pz;

  if (det > -EPS && det < EPS) {
    return null;
  }

  var inv_det = 1.0 / det;

  var tx = this.orig[0] - verts[i0];
  var ty = this.orig[1] - verts[i0 + 1];
  var tz = this.orig[2] - verts[i0 + 2];

  var u = (tx * px + ty * py + tz * pz) * inv_det;
  if (u < 0.0 || u > 1.0) {
    return null;
  }

  var qx = ty * e1z - tz * e1y;
  var qy = tz * e1x - tx * e1z;
  var qz = tx * e1y - ty * e1x;

  var v = (this.dir[0] * qx + this.dir[1] * qy + this.dir[2] * qz) * inv_det;
  if (v < 0.0 || u + v > 1.0) {
    return null;
  }

  var t = (e2x * qx + e2y * qy + e2z * qz) * inv_det;
  if (t >= 0) {
    return new Ray.Intersection(t);
  } else {
    return null;
  }
};

/**************************************************************************************************************/

/**
 * @function nodeIntersect
 * @memberof Ray.prototype
 * @param node
 * @param intersects
 * @return Intersects
 */
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

/**
 * @function lodNodeIntersect
 * @memberof Ray.prototype
 * @param node
 * @param intersects
 * @return Intersects
 */
Ray.prototype.lodNodeIntersect = function (node, intersects) {
  var i;
  intersects = intersects || [];

  if (this.sphereIntersect(node.center, node.radius) >= 0) {
    if (node.children.length > 0 && node.childToLoad === 0) {
      for (i = 0; i < node.children.length; i++) {
        this.lodNodeIntersect(node.children[i], intersects);
      }
    } else {
      for (i = 0; i < node.geometries.length; i++) {
        this.geometryIntersect(node.geometries[i], intersects);
      }
    }
  }

  return intersects;
};

/**
 * @function geometryIntersect
 * @memberof Ray.prototype
 * @param geometry
 * @param intersects
 * @return Intersects
 */
Ray.prototype.geometryIntersect = function (geometry, intersects) {
  var indices = geometry.mesh.indices;
  for (var i = 0; i < indices.length; i += 3) {
    var intersect = this.triangleIntersectOptimized(
      geometry.mesh.vertices,
      geometry.mesh.numElements * indices[i],
      geometry.mesh.numElements * indices[i + 1],
      geometry.mesh.numElements * indices[i + 2]
    );

    if (intersect) {
      intersect.geometry = geometry;
      intersects.push(intersect);
    }
  }
};

export default Ray;
