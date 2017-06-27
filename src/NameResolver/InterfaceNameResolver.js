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
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/

/**
 * API allowing to search object name and zoom to it
 * @interface
 */
function NameResolver() {}


/**
 * Queries a service based on an object name.
 * @param {Object} options - Search configuration
 * @param {string} options.objectName - Searched name
 * @param {Function} options.onError - Callback function when error
 * @param {Function} options.onComplete - Callback function when finish
 * @param {Function} options.onSuccess - Callback function when success
 * @param {Function} options.searchLayer - Layer where the research is done
 * @param {Function} options.zoomTo - ZoomTo function
 */
NameResolver.prototype.handle = function (options) {
};

/**
 * Code to execute when remove
 */
NameResolver.prototype.remove = function () {
};


