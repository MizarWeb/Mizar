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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/**
 * Coordinates
 * @typedef {Object} Coordinates
 * @type {array}
 * @property {float} 0 - longitude expressed in decimal degree.
 * @property {float} 1 - latitude expressed in decimal degree.
 */

/**
 * Coordinates format
 * @typedef {Object} CoordinatesFormat
 * @type {array}
 * @property {string} 0 - longitude formatted in the given CRS.
 * @property {string} 1 - latitude formatted in the given CRS.
 */

/**
 * Interface to handle tracker
 * @interface
 */
function Tracker() {}

/**
 * Update the tracker
 * @param {Event} event
 */
AbstractTracker.prototype.update = function(event) {};

/**
 * Formats the coordinates from the position for displaying the coordinates on the screen.
 * @param {Coordinates} geoPosition
 * @returns {CoordinatesFormat} Coordinates formatted in the given CRS
 */
AbstractTracker.prototype.compute = function(geoPosition) {};

/**
 * Attaches the tracker to the globe
 * @param {Globe} globeContext - globe
 */
AbstractTracker.prototype.attachTo = function(globeContext) {};

/**
 * Detaches from the globe
 */
AbstractTracker.prototype.detach = function() {};
