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

import Utils from "../Utils/Utils";
import AbstractContext from "./AbstractContext";
import Constants from "../Utils/Constants";
// import TimeTravel from "../Gui/TimeTravel";
/**
 * ground context configuration
 * @typedef {Object} AbstractContext.groundContext
 * @property {float} [tileErrorTreshold=1.5]
 * @property {float} [continuousRendering=true]
 * @property {float} [radius = 10.0] - Vector distance of the sky
 * @property {int} [minFar = 15]
 * @property {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} coordinateSystem - CRS configuration
 * @property {RenderContext} [renderContext] - Context rendering
 * @property {AbstractNavigation.astro_configuration} navigation - navigation configuration
 * @property {string} [compass="compassDiv"] - div element where compass is displayed
 * @property {string} [timeTravel="timeTravelDiv"] - div element where time travel is displayed
 */

/**
 * @name GroundContext
 * @class
 * Virtual globe where the camera is inside the globe and having the horizontal coordinate as .<br/>
 * When an error happens at the initialisation, a message is displayed
 * @augments AbstractContext
 * @param {Mizar.configuration} mizarConfiguration - mizar configuration
 * @param {AbstractContext.skyContext} options - skyContext configuration
 * @constructor
 * @memberof module:Context
 */
var GroundContext = function (mizarConfiguration, options) {
  AbstractContext.prototype.constructor.call(this, mizarConfiguration, Constants.CONTEXT.Ground, options);
  var self = this;

  this.components = {
    posTrackerInfo: false,
    posTracker: false,
    elevTracker: false,
    compassDiv: false,
    timeTravelDiv: false
  };

  var groundOptions = _createGroundConfiguration.call(this, options);
  this.initGlobe(groundOptions, {
    "3D": Constants.NAVIGATION.GroundNavigation
  });
};

/**
 * Ground configuration data model
 * @typedef {Object} AbstractGlobe.dm_ground
 * @property {Object} canvas - canvas object
 * @property {int} tileErrorTreshold - tile error treshold
 * @property {boolean} continuousRendering - continuous rendering
 * @property {renderContext} [renderContext] - Rendering context
 * @property {Crs} coordinateSystem - Coordinate reference system of the planet
 * @property {boolean} lighting = false - Lighting
 * @property {float[]} backgroundColor = [0.0, 0.0, 0.0, 1.0] - Background color
 * @property {int} minFar
 * @property {float} radius
 * @property {int[]} defaultColor = [200, 200, 200, 255] - Default color
 * @property {string} shadersPath = "../../shaders/" - Shaders location
 * @property {boolean} renderTileWithoutTexture = false
 * @property {function} publishEvent - Callback
 */

/**
 * Creates planet configuration
 * @param {Object} options
 * @param {int} [options.tileErrorTreshold = 3] - Tile error treshold
 * @param {boolean} [options.continuousRendering = false] - continuous rendering
 * @param {renderContext} [options.renderContext] - Rendering context
 * @param {Crs} options.coordinateSystem - Coordinate reference system of the planet' ground
 * @param {float} [options.radius = 10.0] - Radius object in vector length
 * @returns {AbstractGlobe.dm_ground} Ground data model.
 * @private
 */
function _createGroundConfiguration(options) {
  var self = this;
  return {
    tileErrorTreshold: options.tileErrorTreshold || 3,
    continuousRendering: options.continuousRendering || false,
    renderContext: options.renderContext,
    canvas: this.canvas,
    coordinateSystem: options.coordinateSystem,
    shadersPath: this.mizarConfiguration.mizarAPIUrl + "shaders/",
    lighting: false,
    backgroundColor: [0.0, 0.0, 0.0, 1.0],
    minFar: 0,
    defaultColor: [200, 200, 200, 255],
    renderTileWithoutTexture: true,
    publishEvent: function (message, object) {
      self.publish(message, object);
    }
  };
}

/**************************************************************************************************************/

Utils.inherits(AbstractContext, GroundContext);

/**************************************************************************************************************/

/**
 * @function setCoordinateSystem
 * @memberof GroundContext#
 * @throws RangeError - "incompatible coordinate reference system with Sky context"
 */
GroundContext.prototype.setCoordinateSystem = function (cs) {
  if (cs.getType() !== this.getMode()) {
    throw new RangeError("GroundContext.js: incompatible coordinate reference system with Sky context");
  }
  this.globe.setCoordinateSystem(cs);
  this.publish(Constants.EVENT_MSG.CRS_MODIFIED, this);
};

/**************************************************************************************************************/

export default GroundContext;
