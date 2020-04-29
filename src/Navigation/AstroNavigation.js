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
/**
 * Mizar owns different types of navigation to control the camera on the WebGL scene.
 * <table border="1">
 *     <tr>
 *         <td><img src="../doc/images/nav_astro.png" width="200px"/></td>
 *         <td>{@link module:Navigation.AstroNavigation AstroNavigation}</td>
 *         <td>Provides a camera located at the center of the scene. The camera is inside the globe.
 *         It is used to view the sky</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/nav_planet.png" width="200px"/></td>
 *         <td>{@link module:Navigation.PlanetNavigation PlanetNavigation}</td>
 *         <td>Provides a camera, located outside the globe and looking at the globe. It is used to view a planet</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/nav_flat.png" width="200px"/></td>
 *         <td>{@link module:Navigation.FlatNavigation FlatNavigation}</td>
 *         <td>Provides a camera to navigate on a 2D map - Only available in a Planet context</td>
 *     </tr>
 * </table>
 *
 * The camera is automatically instantiated by the context {@link AbstractContext}, which is created by client.
 * Usually, the navigation is in 3D (AstroNavigation or PlanetNavigation). However, in a particular case, when
 * the client selects a  {@link module:Crs.CoordinateSystemFactory Coordinate Reference System} with a
 * {@link module:Crs.ProjectedCrs projection}, the {@link module:Navigation.FlatNavigation FlatNavigation} is selected.<br/>
 *
 * Then the client can control the navigation by its {@link Navigation interface}
 *
 * <p><p>
 * In addition, the navigation is controlled by the user with the help of devices : keyboard, touch, mouse.
 * When creating the Mizar instance, the user can define a list of supported devices to be able to control the
 * navigation by these devices. By default, the {@link module:Navigation.MouseNavigationHandler MouseNavigationHandler}
 * and {@link module:Navigation.KeyboardNavigationHandler KeyboardNavigationHandler} are set up.
 * When the parameter <i>isMobile</i> is set to true in {@link Mizar} options, then the
 * {@link module:Navigation.TouchNavigationHandler TouchNavigationHandler} is set up
 *
 * <p>
 * @todo Créer un tuto pour montrer les principales méthodes de Navigation et le changement de 3D <--> 2D
 * @module Navigation
 * @implements {Navigation}
 */
import Utils from "../Utils/Utils";
import Constants from "../Utils/Constants";
import AbstractNavigation from "./AbstractNavigation";
import AnimationFactory from "../Animation/AnimationFactory";
import Numeric from "../Utils/Numeric";
import Ray from "../Renderer/Ray";
import "../Renderer/glMatrix";
/**
 * Astro navigation configuration
 * @typedef {AbstractNavigation.configuration} AbstractNavigation.astro_configuration
 * @property {float[]} [initTarget = [0,0]] - initial target of the camera in decimal degree (longitude, latitude)
 * @property {float} [initFov = 0.001] - initial field of view of the camera in decimal degree
 * @property {float} [minFov = 0.001] - Minimal field of view of the camera in decimal degree
 * @property {float} [maxFov = 100] - Maximal field of view of the camera in decimal degree
 * @property {float[]} [up = [0.0, 0.0, 1.0]] - Up vector that defines the north
 */

/**
 * Duration of animation in milliseconds to align the camera with the north.
 * @type {number}
 */
const DEFAULT_DURATION_NORTH = 1000;

/**
 * Default duration in millisecond for zoom feature.
 * @type {number}
 */
const DEFAULT_DURATION_ZOOM = 5000;

/**
 * Difference between two successive rotation (in degree) of the camera.
 * @type {number}
 */
const DELTA_HEADING = 0.05;

/**
 * Default min FOV.
 * @type {number}
 */
const DEFAULT_MIN_FOV = 0.001;

/**
 * Default max FOV.
 * @type {number}
 */
const DEFAULT_MAX_FOV = 100;

/**
 * Arbitrary middle fov value which determines if the animation needs two segments
 * @type {number}
 */
const DEFAULT_MIDDLE_FOV = 25;

/**
 * Final FOV.
 * @type {number}
 */
const DEFAULT_FINAL_FOV = 2.0;

/**
 * @name AstroNavigation
 * @class
 * <table border="0">
 *     <tr>
 *         <td><img src="../doc/images/nav_astro.png" width="200px"/></td>
 *         <td>Provides a camera located at the center of the scene. The camera is inside the globe.
 *         It is used to view the sky.</td>
 *     </tr>
 * </table>
 * When an <i>initFov</i> is provided out the range [<i>minFov</i>, <i>maxFov</i>], the range
 * [<i>minFov</i>, <i>maxFov</i>] is updated with the value of <i>initFov</i>.
 * @augments AbstractNavigation
 * @param {SkyContext} ctx - Sky context
 * @param {AbstractNavigation.astro_configuration} options - navigation configuration
 * @constructor
 * @memberof module:Navigation
 */
var AstroNavigation = function (ctx, options) {
  AbstractNavigation.prototype.constructor.call(this, Constants.NAVIGATION.AstroNavigation, ctx, options);

  // Default values for fov (in degrees)
  this.minFov = this.options.minFov || DEFAULT_MIN_FOV;
  this.maxFov = this.options.maxFov || DEFAULT_MAX_FOV;

  // Initialize the navigation
  this.center3d = [1.0, 0.0, 0.0];
  this.up = [0.0, 0.0, 1.0];
  _setInitTarget.call(this, this.options.initTarget);
  _setInitFov.call(this, this.options.initFov);
  _setUpVector.call(this, this.options.up);

  // Update the view matrix now
  this.computeViewMatrix();
};

/**
 * Defines the Up vector.
 * @param up
 * @private
 */
function _setUpVector(up) {
  if (up) {
    this.up = up;
  }
}

/**
 * Defines the field of view of the camera at initialisation.<br/>
 * When the initFov outside the range [minFov, maxFov], the range is extented to include the initFov
 * @param {float|undefined} initFov
 * @private
 */
function _setInitFov(initFov) {
  if (initFov) {
    if (this.minFov > initFov) {
      this.minFov = initFov;
    } else if (this.maxFov < initFov) {
      this.maxFov = initFov;
    }
    this.renderContext.setFov(initFov);
    this._clampFov();
  }
}

/**
 * Defines the position where the camera looks at.
 * @param {float[]|undefined} initTarget
 * @private
 */
function _setInitTarget(initTarget) {
  if (initTarget) {
    this.ctx.getCoordinateSystem().get3DFromWorld(initTarget, this.center3d);
  }
}

/**
 * Init move up animation.
 * @param {AbstractNavigation} navigation - navigation object
 * @param {number} durationTime - duration of the animation in millisecond
 * @return {AbstractAnimation} animation
 * @private
 */
function _initMoveUpAnimation(navigation, durationTime) {
  return AnimationFactory.create(Constants.ANIMATION.Segmented, {
    duration: durationTime,
    valueSetter: function (value) {
      var position3d = navigation.ctx.getCoordinateSystem().get3DFromWorld([value[0], value[1]]);
      navigation.up[0] = position3d[0];
      navigation.up[1] = position3d[1];
      navigation.up[2] = position3d[2];
      navigation.computeViewMatrix();
    }
  });
}

/**
 * Init zoom animation
 * @param {AbstractNavigation} navigation - navigation object
 * @param {number} duration - duration of the animation in millisecond
 * @return {AbstractAnimation} animation
 * @private
 */
function _initZoomAnimation(navigation, duration) {
  return AnimationFactory.create(Constants.ANIMATION.Segmented, {
    duration: duration,
    valueSetter: function (value) {
      var position3d = navigation.ctx.getCoordinateSystem().get3DFromWorld([value[0], value[1]]);
      navigation.center3d[0] = position3d[0];
      navigation.center3d[1] = position3d[1];
      navigation.center3d[2] = position3d[2];
      navigation.ctx.getRenderContext().setFov(value[2]);
      navigation.computeViewMatrix();
    }
  });
}

/**
 * Adds two segments to the animation, which starts to startValue and stops to endValue
 * by crossing the middleFov at middle value of [startValue, endValue]
 * @param {AbstractAnimation} zoomToAnimation - animation where the segment is added
 * @param {float[]} startValue - Starting position (longitude, latitude, distance as vector length)
 * @param {float[]} endValue - Ending position (longitude, latitude, distance as vector length)
 * @param {float} middleFov - FOV
 * @private
 */
function _addZoomOutThenZoomIn(zoomToAnimation, startValue, endValue, middleFov) {
  // Compute the middle value
  var midValue = [startValue[0] * 0.5 + endValue[0] * 0.5, startValue[1] * 0.5 + endValue[1] * 0.5, middleFov];

  // zoom out to max altitude
  zoomToAnimation.addSegment(0.0, startValue, 0.5, midValue, function (t, a, b) {
    var pt = Numeric.easeInQuad(t);
    var dt = Numeric.easeOutQuad(t);
    return [
      Numeric.lerp(pt, a[0], b[0]), // geoPos.long
      Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
      Numeric.lerp(dt, a[2], b[2])
    ]; // distance
  });

  // zoom in
  _addZoomIn.call(this, zoomToAnimation, midValue, endValue, 0.5);
}

/**
 * Adds a segment to the animation, which starts to startValue and stops to endValue
 * @param {AbstractAnimation} animation - animation where the segment is added
 * @param {float[]} startValue - Starting position (longitude, latitude, distance as vector length)
 * @param {float[]} endValue - Ending position (longitude, latitude, distance as vector length)
 * @param {float} [startParameter=0.0] - start parameter
 * @private
 */
function _addZoomIn(animation, startValue, endValue, startParameter) {
  var parameter = startParameter ? startParameter : 0.0;
  animation.addSegment(parameter, startValue, 1.0, endValue, function (t, a, b) {
    var pt = Numeric.easeOutQuad(t);
    var dt = Numeric.easeInQuad(t);
    return [
      Numeric.lerp(pt, a[0], b[0]), // geoPos.long
      Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
      Numeric.lerp(dt, a[2], b[2])
    ]; // distance
  });
}

/**
 * Adds an event when the animation stops.
 * @param {AbstractAnimation} animation - animation where the event is added
 * @param {AbstractContext} ctx - context
 * @param {number} destDistance - Final zooming distance in meter
 * @param {Object} [options] - options
 * @param {Object} [options.callback] - Callback function to call when it is defined.
 * @fires Context#navigation:changedDistance
 * @private
 */
function _addStop(animation, ctx, destDistance, options) {
  animation.onstop = function () {
    if (options && options.callback) {
      options.callback();
    }
    animation = null;
    ctx.publish(Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE, destDistance);
  };
}

/**
 * Computes parameters for animation
 * @param {AbstractContext} ctx - context
 * @param {Array.<float>} center3D - start position in 3D
 * @param {Array.<float>} geoPos - stop position
 * @param {float} startFov - start FOV
 * @param {float} destFov - stop FOV
 * @return {Array.<float>} Returns [startValue, endValue]
 * @private
 */
function _computeParametersAnimation(ctx, center3D, geoPos, startFov, destFov) {
  var geoStart = [];
  ctx.getCoordinateSystem().getWorldFrom3D(center3D, geoStart);
  var path = Numeric.shortestPath360(geoStart[0], geoPos[0]);
  var startValue = [path[0], geoStart[1], startFov];
  var endValue = [path[1], geoPos[1], destFov];
  return [startValue, endValue];
}

/**************************************************************************************************************/

Utils.inherits(AbstractNavigation, AstroNavigation);

/**************************************************************************************************************/

/**
 * Returns the center of the navigation.
 * @function getCenter
 * @memberof AstroNavigation#
 * @return {float[]}
 */
AstroNavigation.prototype.getCenter = function () {
  var center = AbstractNavigation.prototype.getCenter.call(this);
  if (center == null) {
    center = [];
    this.ctx.getCoordinateSystem().getWorldFrom3D(this.center3d, center);
  }
  return center;
};

/**
 * ZoomTo a 3D position
 * @function zoomTo
 * @param {float[]} geoPos - target of the camera
 * @param {Object} options - options
 * @param {float} [options.fov = DEFAULT_FINAL_FOV] - field of view in degree
 * @param {int} [options.duration = DEFAULT_DURATION_ZOOM] - duration of the animation in milliseconds
 * @param {navigationCallback} [options.callback] - Called at the end of navigation
 * @memberof AstroNavigation#
 */
AstroNavigation.prototype.zoomTo = function (geoPos, options) {
  var navigation = this;

  // default values
  var destFov = options && options.fov ? options.fov : DEFAULT_FINAL_FOV;
  var duration = options && options.duration ? options.duration : DEFAULT_DURATION_ZOOM;

  // Create a single animation to animate center3d and fov
  var parameters = _computeParametersAnimation.call(
    this,
    this.ctx,
    this.center3d,
    geoPos,
    this.renderContext.getFov(),
    destFov
  );
  var startValue = parameters[0];
  var endValue = parameters[1];

  var zoomToAnimation = _initZoomAnimation.call(this, navigation, duration);

  // End point which is out of frustum invokes two steps animation, one step otherwise
  var end3DValue = this.ctx.getCoordinateSystem().get3DFromWorld(geoPos);
  if (
    DEFAULT_MIDDLE_FOV > this.renderContext.getFov() &&
    this.renderContext.getWorldFrustum().containsSphere(end3DValue, 0.005) < 0
  ) {
    // Two steps animation, 'rising' & 'falling'
    _addZoomOutThenZoomIn.call(this, zoomToAnimation, startValue, endValue, DEFAULT_MIDDLE_FOV);
  } else {
    // One step animation, 'falling' only
    _addZoomIn.call(this, zoomToAnimation, startValue, endValue);
  }

  _addStop.call(this, zoomToAnimation, this.ctx, destFov, options);

  this.ctx.addAnimation(zoomToAnimation);
  zoomToAnimation.start();
};

/**
 * Moves up vector.
 * @function moveUpTo
 * @memberof AstroNavigation#
 * @param {float[]} vec Vector
 * @param {int} [duration = DEFAULT_DURATION_NORTH] - Duration of animation in milliseconds
 */
AstroNavigation.prototype.moveUpTo = function (vec, duration) {
  // Create a single animation to animate up
  var startValue = [];
  var endValue = [];
  this.ctx.getCoordinateSystem().getWorldFrom3D(this.up, startValue);
  this.ctx.getCoordinateSystem().getWorldFrom3D(vec, endValue);
  var durationTime = duration || DEFAULT_DURATION_NORTH;

  var navigation = this;
  var moveUpToAnimation = _initMoveUpAnimation.call(this, navigation, durationTime);
  _addZoomIn.call(this, moveUpToAnimation, startValue, endValue);
  this.ctx.addAnimation(moveUpToAnimation);
  moveUpToAnimation.start();
};

/**
 * Computes the view matrix
 * @function computeViewMatrix
 * @memberof AstroNavigation#
 */
AstroNavigation.prototype.computeViewMatrix = function () {
  vec3.normalize(this.center3d);
  var vm = this.renderContext.getViewMatrix();
  mat4.lookAt([0.0, 0.0, 0.0], this.center3d, this.up, vm);
  this.up = [vm[1], vm[5], vm[9]];
  this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_MODIFIED);
  this.renderContext.requestFrame();
};

/**
 * Event handler for mouse wheel
 * @function zoom
 * @memberof AstroNavigation#
 * @param {float} delta Delta zoom
 * @param {float} scale Scale
 */
AstroNavigation.prototype.zoom = function (delta, scale) {
  // TODO : improve zoom, using scale or delta ? We should use scale always
  if (scale) {
    this.renderContext.setFov((this.renderContext.getFov() * 1) / scale);
  } else {
    // Arbitrary value for smooth zooming
    this.renderContext.setFov(this.renderContext.getFov() * (1 + delta * 0.1));
  }

  this._clampFov();
  this.computeViewMatrix();
};

/**
 * Pan the navigation by computing the difference between 3D centers
 * @function pan
 * @memberof AstroNavigation#
 * @param {int} dx Window delta x
 * @param {int} dy Window delta y
 */
AstroNavigation.prototype.pan = function (dx, dy) {
  var x = this.renderContext.getCanvas().width / 2.0;
  var y = this.renderContext.getCanvas().height / 2.0;
  var ray = Ray.createFromPixel(this.renderContext, x - dx, y - dy);
  this.center3d = ray.computePoint(
    ray.sphereIntersect([0, 0, 0], this.ctx.getCoordinateSystem().getGeoide().getRadius())
  );
  this.computeViewMatrix();
};

/**
 * Rotates the navigation
 * @function rotate
 * @memberof AstroNavigation#
 * @param {float} dx Window delta x
 */
AstroNavigation.prototype.rotate = function (dx) {
  // constant tiny angle
  var angle = Numeric.toRadian(dx * DELTA_HEADING);
  var rot = quat4.fromAngleAxis(angle, this.center3d);
  quat4.multiplyVec3(rot, this.up);
  this.computeViewMatrix();
};

/**
 * Clamping of fov
 * @function _clampFov
 * @memberof AstroNavigation#
 * @private
 */
AstroNavigation.prototype._clampFov = function () {
  if (this.renderContext.getFov() > this.maxFov) {
    this.renderContext.setFov(this.maxFov);
  }
  if (this.renderContext.getFov() < this.minFov) {
    this.renderContext.setFov(this.minFov);
  }
};

/**
 * Destroy
 * @function destroy
 * @memberof AstroNavigation#
 */
AstroNavigation.prototype.destroy = function () {
  AbstractNavigation.prototype.destroy.call(this);
  this.minFov = null;
  this.maxFov = null;
  this.center3d = null;
  this.up = null;
};

/**************************************************************************************************************/

export default AstroNavigation;
