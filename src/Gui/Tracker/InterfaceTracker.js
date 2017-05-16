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

/**
 * Interface to handle tracker
 * @interface
 */
function Tracker() {
}

/**
 * Update the tracker
 * @param event
 */
AbstractTracker.prototype.update = function (event) {
};

/**
 * Compute from geoPosition
 * @param {float[]} geoPosition
 */
AbstractTracker.prototype.compute = function (geoPosition) {
};

/**
 * Attaches the tracker to the globe
 * @param {globe} globeContext - globe
 */
AbstractTracker.prototype.attachTo = function (globeContext) {
};

/**
 * Detaches from the globe
 */
AbstractTracker.prototype.detach = function () {
}; 
