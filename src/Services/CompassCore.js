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
 * Compass module : map control with "north" component
 */
import Constants from "../Utils/Constants";
import Numeric from "../Utils/Numeric";
const MAX_ROTATION = 360;

/**
 *    Private variables
 */
let parentElement = null;
let ctx = null;
let crs = null;
let svgDoc = null;

/**************************************************************************************************************/

/**
 * Aligns with north.
 * @param {object} event
 * @private
 */
function _alignWithNorth(event) {
  const coordinateSystem = ctx.getCoordinateSystem();
  const radius = coordinateSystem.getGeoide().getRadius();

  // scale the up direction to the sphere's surface in order to have the right value after projection.
  const up = [0, 0, radius];

  let temp = [];
  coordinateSystem.from3DToGeo(up, temp);
  temp = coordinateSystem.convert(temp, coordinateSystem.getGeoideName(), crs);
  coordinateSystem.fromGeoTo3D(temp, up);
  ctx.getNavigation().moveUpTo(up);
}

/**************************************************************************************************************/

function updateNorthPlanet() {
  const navigation = ctx.getNavigation();
  const currentHeading = navigation.getHeading();

  const upHeading = 0;
  const degNorth = (currentHeading - upHeading + MAX_ROTATION) % MAX_ROTATION;

  const northText = svgDoc.getElementById("NorthText");
  northText.setAttribute("transform", "rotate(" + degNorth + " 40 40)");
}

function updateNorthAzimuth() {
  const navigation = ctx.getNavigation();
  const currentHeading = navigation.getHeading();

  const upHeading = 0;
  const degNorth = (upHeading - currentHeading + MAX_ROTATION) % MAX_ROTATION;

  const northText = svgDoc.getElementById("NorthText");
  northText.setAttribute("transform", "rotate(" + degNorth + " 40 40)");
}

function updateNorthSky() {
  let geo = [];
  const coordinateSystem = ctx.getCoordinateSystem();
  const center = ctx.getNavigation().center3d ? ctx.getNavigation().center3d : ctx.getNavigation().geoCenter;
  coordinateSystem.from3DToGeo(center, geo);
  geo = coordinateSystem.convert(geo, crs, coordinateSystem.getGeoideName());

  const LHV = [];
  coordinateSystem.getLHVTransform(geo, LHV);

  let temp = [];
  const north = [LHV[4], LHV[5], LHV[6]];
  const vertical = [LHV[8], LHV[9], LHV[10]];

  const up = vec3.create(ctx.getNavigation().up);
  vec3.scale(up, coordinateSystem.getGeoide().getRadius());

  coordinateSystem.from3DToGeo(up, temp);
  temp = coordinateSystem.convert(temp, crs, coordinateSystem.getGeoideName());
  coordinateSystem.fromGeoTo3D(temp, up);
  vec3.normalize(up);
  // Find angle between up and north
  const cosNorth = vec3.dot(up, north) / (vec3.length(up) * vec3.length(north));
  const radNorth = Math.acos(cosNorth);

  if (isNaN(radNorth)) {
    return;
  }
  let degNorth = Numeric.toDegree(radNorth);

  // Find sign between up and north
  let sign;
  vec3.cross(up, north, temp);
  sign = vec3.dot(temp, [vertical[0], vertical[1], vertical[2]]);
  if (sign < 0) {
    degNorth *= -1;
  }

  const northText = svgDoc.getElementById("NorthText");
  northText.setAttribute("transform", "rotate(" + degNorth + " 40 40)");
}

/**
 * Function updating the north position on compass
 */
function updateNorth() {
  const mode = ctx.getMode();
  switch (mode) {
    case Constants.CONTEXT.Sky:
      updateNorthSky();
      break;
    case Constants.CONTEXT.Planet:
      updateNorthPlanet();
      break;
    case Constants.CONTEXT.Ground:
      updateNorthAzimuth();
      break;
    default:
      throw new RangeError("CompassCore.js: CompassCore is not supported for this context");
  }
}

/**************************************************************************************************************/

/**
 *    Remove compass element
 *
 */
function remove() {
  document.getElementById(parentElement).innerHTML = "";
}

/**************************************************************************************************************/

export default {
  init: function (options) {
    parentElement = options.element;
    //ctx = options.ctx;
    //crs = ctx.getCoordinateSystem().getGeoideName();
    //svgDoc = options.svgDoc;
  },
  setSvg: function (svg) {
    svgDoc = svg;
  },
  setCtx: function (context) {
    ctx = context;
    crs = context.getCoordinateSystem().getGeoideName();
  },
  updateNorth: updateNorth,
  _alignWithNorth: _alignWithNorth,
  remove: remove
};
