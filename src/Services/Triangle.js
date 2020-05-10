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
 * Triangle Object use in Histogram classe
 */
/**************************************************************************************************************/

/**
 *    Test returning true if p1 and p2 are both lying on the same side of a-b, false otherwise
 */
function _sameSide(p1, p2, a, b) {
  var temp1 = [];
  var temp2 = [];
  var temp3 = [];
  var cp1 = [];
  var cp2 = [];
  vec3.cross(vec3.subtract(b, a, temp1), vec3.subtract(p1, a, temp2), cp1);
  vec3.cross(temp1, vec3.subtract(p2, a, temp3), cp2);
  return vec3.dot(cp1, cp2) >= 0;
}

/**************************************************************************************************************/

/**
 *    Private function to check if point is inside the given triangle
 *    If the point was on the same side of a-b as c and is also on the same side of b-c as a and on the same side of c-a as b, then it is in the triangle
 */
function _pointInTriangle(p, a, b, c) {
  return _sameSide(p, a, b, c) && _sameSide(p, b, a, c) && _sameSide(p, c, a, b);
}

/**************************************************************************************************************/

/**
 *    Isoscele triangle object for thresholds manipulation
 *
 *    @param a Pointer of threshold pointing on histogram
 *    @param b Isoscele point 1
 *    @param c Isoscele point 2
 */
var Triangle = function (a, b, c) {
  this.initA = a.slice(0);
  this.initB = b.slice(0);
  this.initC = c.slice(0);

  this.a = a; // Pointer to histogram
  this.b = b; // Isoscele point 1
  this.c = c; // Isoscele point 2

  this.dragging = false;
  this.hover = false;
  this.halfWidth = Math.abs((c[0] - b[0]) / 2);
};

/**************************************************************************************************************/

/**
 *    Reset to initial position
 */
Triangle.prototype.reset = function () {
  this.a = this.initA.slice(0);
  this.b = this.initB.slice(0);
  this.c = this.initC.slice(0);
};

/**************************************************************************************************************/

/**
 *    Test if triangle contains the given point
 *    @param {Array} p point
 */
Triangle.prototype.contains = function (p) {
  return _pointInTriangle(p, this.a, this.b, this.c);
};

/**************************************************************************************************************/

/**
 * Draw the triangle
 * @param ctx the context
 * @param options
 *      <ul>
 *          <li>draggingColor : color used when moving triangle</li>
 *          <li>noDraggingColor : color used when triangle do not move</li>
 */
Triangle.prototype.draw = function (ctx, options) {
  if (!options) {
    options = {};
  }
  if (this.dragging) {
    ctx.fillStyle = options.draggingColor || "#FF0";
  } else {
    ctx.fillStyle = options.noDraggingColor || "#F00";
  }

  ctx.beginPath();
  ctx.moveTo(this.a[0], this.a[1]);
  ctx.lineTo(this.b[0], this.b[1]);
  ctx.lineTo(this.c[0], this.c[1]);
  ctx.closePath();
  ctx.fill();

  if (!this.dragging && this.hover) {
    ctx.strokeStyle = options.draggingColor || "#FF0";
    ctx.stroke();
  }
};

/**************************************************************************************************************/

/**
 *    Modify triangle's position by the given "pointer" point
 *    (could be modified only by X-axis)
 *    @param {Array} point point
 */
Triangle.prototype.modifyPosition = function (point) {
  this.a[0] = point[0];
  this.b[0] = point[0] - this.halfWidth;
  this.c[0] = point[0] + this.halfWidth;
};

/**************************************************************************************************************/

export default Triangle;
