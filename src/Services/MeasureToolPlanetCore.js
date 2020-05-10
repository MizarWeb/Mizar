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
 * Tool designed to measure the distance between two points in planet mode
 */

import _ from "underscore";
import Constants from "../Utils/Constants";
import VectorLayer from "../Layer/VectorLayer";
import Numeric from "../Utils/Numeric";
import FeatureStyle from "../Renderer/FeatureStyle";
import "../Renderer/glMatrix";
var navigation, mizarAPI, onselect, measureLayer, self, dragging;

/**********************************************************************************************/

/**
 * Get first Geo pick point in terms of cursor position
 * @param event
 * @returns {Array} geoPickPoint geo position on the planet
 */
function _handleMouseDown(event) {
  event.preventDefault();
  if (!self.activated) {
    return;
  }

  navigation.stop();

  dragging = true;
  self.elevations = [];

  if (event.type.search("touch") >= 0) {
    self.pickPoint = [event.changedTouches[0].offsetX, event.changedTouches[0].offsetY];
  } else {
    self.pickPoint = [event.layerX, event.layerY];
  }
  var geo = mizarAPI.getActivatedContext().getLonLatFromPixel(self.pickPoint[0], self.pickPoint[1]);
  if (geo !== null) {
    self.geoPickPoint = geo;
  } else {
    return null;
  }
  return self.geoPickPoint;
}

/**
 * Close the measure with the last point
 * @param event
 */
function _handleMouseUp(event) {
  event.preventDefault();

  // Compute geo radius
  var stopPickPoint;
  if (event.type.search("touch") >= 0) {
    stopPickPoint = mizarAPI
      .getActivatedContext()
      .getLonLatFromPixel(event.changedTouches[0].offsetX, event.changedTouches[0].offsetY);
  } else {
    stopPickPoint = mizarAPI.getActivatedContext().getLonLatFromPixel(event.layerX, event.layerY);
  }

  // No point found, picking was not on planet but sky
  if (!_.isEmpty(stopPickPoint)) {
    // Find angle between start and stop vectors which is in fact the radius
    var dotProduct = vec3.dot(
      vec3.normalize(mizarAPI.getCrs().get3DFromWorld(stopPickPoint)),
      vec3.normalize(mizarAPI.getCrs().get3DFromWorld(self.geoPickPoint))
    );
    var theta = Math.acos(dotProduct);
    self.geoDistance = Numeric.toDegree(theta);

    if (onselect) {
      onselect();
    }
  }
  navigation.start();
  dragging = false;
}

/**
 * Update drawing and label in terms of current point
 * @param event
 */
function _handleMouseMove(event) {
  event.preventDefault();
  if (!self.activated || !dragging) {
    return;
  }
  if (event.type.search("touch") >= 0) {
    self.secondPickPoint = [event.changedTouches[0].offsetX, event.changedTouches[0].offsetY];
  } else {
    self.secondPickPoint = [event.layerX, event.layerY];
  }

  var geo = mizarAPI.getActivatedContext().getLonLatFromPixel(self.secondPickPoint[0], self.secondPickPoint[1]);
  if (geo !== null) {
    self.secondGeoPickPoint = mizarAPI
      .getActivatedContext()
      .getLonLatFromPixel(self.secondPickPoint[0], self.secondPickPoint[1]);
  } else {
    return;
  }
  //self.storeDistanceAndElevation(self.geoPickPoint, self.secondGeoPickPoint);

  // Update radius
  self.distance = Math.sqrt(
    Math.pow(self.secondPickPoint[0] - self.pickPoint[0], 2) + Math.pow(self.secondPickPoint[1] - self.pickPoint[1], 2)
  );
  var dotProduct;
  if (self.secondGeoPickPoint === undefined) {
    dotProduct = vec3.dot(
      vec3.normalize(mizarAPI.getCrs().get3DFromWorld(self.secondPickPoint)),
      vec3.normalize(mizarAPI.getCrs().get3DFromWorld(self.geoPickPoint))
    );
  } else {
    dotProduct = vec3.dot(
      vec3.normalize(mizarAPI.getCrs().get3DFromWorld(self.secondGeoPickPoint)),
      vec3.normalize(mizarAPI.getCrs().get3DFromWorld(self.geoPickPoint))
    );
  }
  var theta = Math.acos(dotProduct);
  self.geoDistance = Numeric.toDegree(theta);

  updateMeasure();
}

/**********************************************************************************************/

function rotateVector2D(vec, theta) {
  theta = Numeric.toRadian(theta);
  var cs = Math.cos(theta);
  var sn = Math.sin(theta);

  return [vec[0] * cs - vec[1] * sn, vec[0] * sn + vec[1] * cs];
}

/**********************************************************************************************/

/**
 * Computes the measure for the given pick point depending on the second point (used to draw)
 * @returns {Array} points to draw
 */
function computeMeasure() {
  var geoDiff = [
    self.secondGeoPickPoint[0] - self.geoPickPoint[0],
    self.secondGeoPickPoint[1] - self.geoPickPoint[1],
    0
  ];
  var diff = vec3.create(geoDiff);
  var length = vec3.length(diff);
  vec3.normalize(diff);
  vec3.scale(diff, length * 0.001);

  // First arrow
  var arrow = rotateVector2D(diff, 30);
  var arrow2 = rotateVector2D(diff, -30);
  arrow = [self.geoPickPoint[0] + 10 * arrow[0], self.geoPickPoint[1] + 10 * arrow[1]];
  arrow2 = [self.geoPickPoint[0] + 10 * arrow2[0], self.geoPickPoint[1] + 10 * arrow2[1]];

  // Second arrow
  var diff2 = [-diff[0], -diff[1]];
  var arrow3 = rotateVector2D(diff2, 30);
  var arrow4 = rotateVector2D(diff2, -30);
  arrow3 = [self.secondGeoPickPoint[0] + 10 * arrow3[0], self.secondGeoPickPoint[1] + 10 * arrow3[1]];
  arrow4 = [self.secondGeoPickPoint[0] + 10 * arrow4[0], self.secondGeoPickPoint[1] + 10 * arrow4[1]];

  var points = [
    [arrow[0], arrow[1], null],
    [self.geoPickPoint[0], self.geoPickPoint[1], null],
    [arrow2[0], arrow2[1], null],
    [self.geoPickPoint[0], self.geoPickPoint[1], null],
    [self.secondGeoPickPoint[0], self.secondGeoPickPoint[1], null],
    [arrow3[0], arrow3[1], null],
    [self.secondGeoPickPoint[0], self.secondGeoPickPoint[1], null],
    [arrow4[0], arrow4[1], null]
  ];
  return points;
}

/**********************************************************************************************/

function remove() {
  self.clear();
  mizarAPI.getPlanetContext().removeDraw(measureLayer);
}

function createGeoJsonMeasurement(coordinates) {
  return {
    geometry: {
      gid: "measureShape",
      coordinates: coordinates,
      type: Constants.GEOMETRY.LineString,
      crs: {
        type: "name",
        properties: {
          name: mizarAPI.getCrs().getGeoideName()
        }
      }
    },
    properties: {
      style: new FeatureStyle({
        fillColor: [1, 0, 0, 1],
        zIndex: Constants.DISPLAY.SERVICE_VECTOR
      })
    },
    type: "Feature"
  };
}

function createGeoJsonLabel(geoCenter, distance) {
  return {
    geometry: {
      type: Constants.GEOMETRY.Point,
      gid: "measureShape",
      coordinates: geoCenter,
      crs: {
        type: "name",
        properties: {
          name: mizarAPI.getCrs().getGeoideName()
        }
      }
    },
    properties: {
      style: new FeatureStyle({
        label: distance + " km",
        fillColor: [1, 1, 1, 1],
        pointMaxSize: 600,
        zIndex: Constants.DISPLAY.SERVICE_VECTOR
      })
    }
  };
}

/**
 *    Updates measure coordinates
 */
function updateMeasure() {
  self.clear();

  // Create measurement and  apply elevation to all point of displayed arrow
  var coordinates = self.computeMeasure();
  self.measureFeature = createGeoJsonMeasurement(coordinates);

  // Create measurement label
  var center = [(self.secondPickPoint[0] + self.pickPoint[0]) / 2, (self.secondPickPoint[1] + self.pickPoint[1]) / 2];
  var geoCenter = mizarAPI.getActivatedContext().getLonLatFromPixel(center[0], center[1]);
  var distance = self.calculateDistanceElevation(self.geoPickPoint, self.secondGeoPickPoint);
  distance = Numeric.roundNumber(distance.toFixed(3), 2);
  self.measureLabel = createGeoJsonLabel(geoCenter, distance);

  // add measurement and label to the the GeoJson collection
  measureLayer.addFeature(self.measureFeature);
  measureLayer.addFeature(self.measureLabel);
}

/**************************************************************************************************************/

/**
 *    Clear measureFeature and measureLabel
 */
function clear() {
  if (self.measureFeature) {
    measureLayer.removeFeature(self.measureFeature);
  }
  if (self.measureLabel) {
    measureLayer.removeFeature(self.measureLabel);
  }
}

/**************************************************************************************************************/

/**
 * Calculate intermediaries elevation points to increase drawing precision
 *
 * @param {Object} options
 *              <ul>
 *                  <li>nbPoints : number of intermediary points to compute</li>
 *              </ul>
 * @param {Array} firstPoint
 * @param {Array} secondPoint
 * @return {Array} intermediatePoints
 */
function calculateIntermediateElevationPoint(options, firstPoint, secondPoint) {
  var nbPoints = options.nbPoints | 50;
  var deltaX = firstPoint[0] - secondPoint[0];
  var intervalX;
  if (deltaX > 180.0) {
    deltaX = 360.0 - deltaX;
    intervalX = -deltaX / nbPoints;
  } else if (deltaX < -180.0) {
    deltaX = 360.0 + deltaX;
    intervalX = deltaX / nbPoints;
  } else {
    intervalX = deltaX / nbPoints;
  }
  var intervalY = (firstPoint[1] - secondPoint[1]) / nbPoints;

  var intermediatePoints = [];
  intermediatePoints[0] = firstPoint;
  for (var i = 1; i < nbPoints; i++) {
    var x = intermediatePoints[i - 1][0] - intervalX;
    if (x > 180.0) {
      x = x - 360;
    } else if (x < -180.0) {
      x = x + 360;
    }
    var y = intermediatePoints[i - 1][1] - intervalY;
    intermediatePoints[i] = [x, y];
  }
  intermediatePoints[nbPoints] = secondPoint;
  return intermediatePoints;
}

/**
 * Calculate distance elevation from a point
 *
 * url calcul distance : http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {Array} firstPoint
 * @param {Array} secondPoint
 * @returns {number} distance elevation in kilometers
 */
function calculateDistanceElevation(firstPoint, secondPoint) {
  var R = mizarAPI.getCrs().getGeoide().getRealPlanetRadius();
  var phi1 = Numeric.toRadian(firstPoint[1]);
  var phi2 = Numeric.toRadian(secondPoint[1]);
  var delta_phi = Numeric.toRadian(secondPoint[1] - firstPoint[1]);
  var delta_lambda = Numeric.toRadian(secondPoint[0] - firstPoint[0]);

  var a =
    Math.sin(delta_phi / 2) * Math.sin(delta_phi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(delta_lambda / 2) * Math.sin(delta_lambda / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  var distance = R * c;

  return distance / 1000;
}

/**
 * Calculate distance and elevation for a given point and store it
 * @param {Array} firstPoint
 * @param {Array} secondPoint
 */
function storeDistanceAndElevation(firstPoint, secondPoint) {
  var distance = self.calculateDistanceElevation(firstPoint, secondPoint);
  distance = Numeric.roundNumber(distance.toFixed(3), 2);

  var elevation = mizarAPI.getActivatedContext().getElevation(secondPoint[0], secondPoint[1]);
  var scale = mizarAPI.getActivatedContext().getBaseElevation().getScale();
  elevation = Numeric.roundNumber(elevation / scale, 0);
  var pointElevation = [distance, elevation];

  self.elevations.push(pointElevation);
}

/**
 * Updates Mizar context
 * @param {Mizar} mizar
 * @fires Context#backgroundLayer:added
 * @fires Context#layer:added
 */
function updateContext(mizar) {
  mizarAPI = mizar;
  navigation = mizarAPI.getActivatedContext().getNavigation();
  dragging = false;

  // Layer containing measure feature
  if (!measureLayer) {
    measureLayer = new VectorLayer();
  }
  mizarAPI.getPlanetContext().addDraw(measureLayer);

  this.activated = false;
  this.renderContext = mizarAPI.getRenderContext();

  this.elevations = [];
  this.measureFeature = null;
}

export default {
  init: function (options) {
    mizarAPI = options.mizar;
    navigation = mizarAPI.getActivatedContext().getNavigation();
    onselect = options.onselect;
    self = this;
    dragging = false;

    // Layer containing measure feature
    measureLayer = mizarAPI.LayerFactory.create({
      type: Constants.LAYER.Vector,
      visible: true
    });
    mizarAPI.getPlanetContext().addDraw(measureLayer);

    this.activated = false;
    this.renderContext = mizarAPI.getRenderContext();

    this.elevations = [];
    this.measureFeature = null;
  },
  _handleMouseDown: _handleMouseDown,
  _handleMouseUp: _handleMouseUp,
  _handleMouseMove: _handleMouseMove,
  clear: clear,
  remove: remove,
  updateContext: updateContext,
  calculateIntermediateElevationPoint: calculateIntermediateElevationPoint,
  calculateDistanceElevation: calculateDistanceElevation,
  computeMeasure: computeMeasure,
  storeDistanceAndElevation: storeDistanceAndElevation
};
