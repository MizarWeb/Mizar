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
/*global define: false */

/**
 * Mollweider viewer module : Sky representation in mollweide coordinate system
 */
import $ from "jquery";
import Numeric from "../Utils/Numeric";
import Ray from "../Renderer/Ray";
import "../Renderer/glMatrix";
var mizarAPI;
var mizarBaseUrl;
var navigation;
var halfPaddingX;
var halfPaddingY;
var halfHeight;
var halfWidth;
var tesselation;
var center3d;
var canvas;
var context;
var self;
var imageObj;

/**
 *  Newton-Raphson method to find auxiliary theta needed for mollweide x/y computation
 *  @param lat latitude
 *  @see https://en.wikipedia.org/wiki/Mollweide_projection
 *  @return theta
 */
function _findTheta(lat) {
  // Avoid divide by zero
  if (Math.abs(lat) === Math.PI / 2) {
    return lat;
  }

  var epsilon = 0.001;
  var thetaN; // n
  var thetaN1; // n+1

  do {
    thetaN = thetaN1;
    if (!thetaN) {
      thetaN = lat;
    }
    var twoThetaN = 2 * thetaN;
    thetaN1 =
      twoThetaN / 2 - (twoThetaN + Math.sin(twoThetaN) - Math.PI * Math.sin(lat)) / (2 + 2 * Math.cos(twoThetaN));
  } while (Math.abs(thetaN1 - thetaN) >= epsilon);

  return thetaN1;
}

/**********************************************************************************************/

/**
 *  Canvas 2D point
 *  @param {Object} options
 *      <ul>
 *          <li>options : x,y, color, size</li>
 */
var Point = function (options) {
  this.x = options.x | 0;
  this.y = options.y | 0;
  this.color = options.color || "rgb(255,0,0)";
  this.size = options.size | 2;
  for (var x in options) {
    if (options.hasOwnProperty(x)) {
      this[x] = options[x];
    }
  }
};

/**********************************************************************************************/

/**
 *  Compute mollweide position for given 3D position
 *  @param {Array} pos position
 *  @return {Array} x,y coordinates
 */
function computeMollweidePosition(pos) {
  var coordinateSystem = mizarAPI.getCrs();
  var geoPos = coordinateSystem.getWorldFrom3D(pos);
  if (geoPos[0] > 180) geoPos[0] -= 360;
  //var geoPos = coordinateSystem.from3DToEquatorial(pos, null, false);
  //geoPos = coordinateSystem.convert(geoPos, Constants.CRS.Equatorial, coordinateSystem.getGeoideName());
  //geoPos = coordinateSystem.fromEquatorialToGeo(geoPos, null, false);

  var lambda = Numeric.toRadian(geoPos[0]); // longitude
  var theta0 = Numeric.toRadian(geoPos[1]); // latitude

  var auxTheta = _findTheta(theta0);

  // Transfrom to Mollweide coordinate system
  var mollX = ((2 * Math.sqrt(2)) / Math.PI) * lambda * Math.cos(auxTheta);
  var mollY = Math.sqrt(2) * Math.sin(auxTheta);

  // Transform to image space
  //    2.8: max x value in Mollweide projection
  //    1.38: max y value in Mollweide projection
  var x = (-mollX * halfWidth) / 2.8 + halfWidth + halfPaddingX;
  var y = (-mollY * halfHeight) / 1.38 + halfHeight + halfPaddingY;

  return [x, y];
}

/**********************************************************************************************/

/**
 *  Update navigation eye for the given mouse coordinates
 *  @param {Array} moll
 */
function updateNavigation(moll) {
  // Transform to Mollweide space
  center3d.x = (-(moll[0] - halfWidth - halfPaddingX) * 2.8) / halfWidth;
  center3d.y = (-(moll[1] - halfHeight - halfPaddingY) * 1.38) / halfHeight;

  // Transform to geographic coordinate system
  // http://mathworld.wolfram.com/MollweideProjection.html
  var auxTheta = Math.asin(center3d.y / Math.sqrt(2));

  var phi = Math.asin((2 * auxTheta + Math.sin(2 * auxTheta)) / Math.PI);
  var lambda = (Math.PI * center3d.x) / (2 * Math.sqrt(2) * Math.cos(auxTheta));

  var geo = [Numeric.toDegree(lambda), Numeric.toDegree(phi)];

  // Update navigation
  mizarAPI.getCrs().get3DFromWorld(geo, navigation.center3d);

  navigation.computeViewMatrix();
}

/**********************************************************************************************/

/**
 *  Function updating the position of center of camera on mollweide element
 */
function updateMollweideFov() {
  // Reinit canvas
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.drawImage(imageObj, 0, 0);

  // Draw fov
  context.fillStyle = "rgb(255,0,0)";
  var stepX = mizarAPI.getRenderContext().canvas.clientWidth / (tesselation - 1);
  var stepY = mizarAPI.getRenderContext().canvas.clientHeight / (tesselation - 1);

  var ray;
  var pos3d;
  var mPos;
  for (var i = 0; i < tesselation; i++) {
    // Width
    for (var j = 0; j < tesselation; j++) {
      // Height
      ray = Ray.createFromPixel(mizarAPI.getRenderContext(), i * stepX, j * stepY);
      pos3d = ray.computePoint(ray.sphereIntersect([0, 0, 0], mizarAPI.getCrs().getGeoide().getRadius()));

      mPos = computeMollweidePosition(pos3d);

      // Draw on canvas 2d
      context.fillRect(mPos[0], mPos[1], 2, 2);
    }
  }

  // Draw center
  context.fillStyle = center3d.color;
  mPos = computeMollweidePosition(navigation.center3d);
  center3d.x = mPos[0] - center3d.size / 2;
  center3d.y = mPos[1] - center3d.size / 2;

  // Draw on canvas 2d
  context.fillRect(mPos[0] - center3d.size / 2, mPos[1] - center3d.size / 2, center3d.size, center3d.size);

  // Update fov degrees
  var fov = navigation.getFov();
  var fovx = Numeric.roundNumber(fov[0], 2);
  fovx = mizarAPI.getCrs().fromDegreesToDMS(fovx);
  var fovy = Numeric.roundNumber(fov[1], 2);
  fovy = mizarAPI.getCrs().fromDegreesToDMS(fovy);
  $("#fov").html("Fov : " + fovx + " x " + fovy);
}

function updateGalaxyProjection(ctx) {
  $(self.getImageObj()).attr(
    "src",
    mizarBaseUrl + "css/images/MollweideSky_" + ctx.getCoordinateSystem().getGeoideName() + ".png"
  );
}

/**********************************************************************************************/

export default {
  init: function (options) {
    mizarAPI = options.mizar;
    mizarBaseUrl = options.mizarBaseUrl;

    // Init options
    navigation = mizarAPI.getActivatedContext().getNavigation();
    halfPaddingX = 16;
    halfPaddingY = 8;

    // Grid background dimensions
    halfHeight = 50;
    halfWidth = 100;

    // Level of tesselation to represent fov
    tesselation = 9; // Must be >= 2

    // Center of fov
    center3d = new Point({
      size: 5,
      color: "rgb(255,255,0)"
    });

    // Init image background
    canvas = document.getElementById("mollweideCanvas");
    context = canvas.getContext("2d");
    self = this;

    imageObj = new Image();
    imageObj.onload = function () {
      context.drawImage(imageObj, 0, 0);
      updateMollweideFov();
    };
  },
  getImageObj: function () {
    return imageObj;
  },
  _findTheta: _findTheta,
  computeMollweidePosition: computeMollweidePosition,
  updateNavigation: updateNavigation,
  updateMollweideFov: updateMollweideFov,
  updateGalaxyProjection: updateGalaxyProjection
};
