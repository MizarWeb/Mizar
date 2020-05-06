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

/**************************************************************************************************************/

/**
 * @class
 * Abstract Wrapper constructor
 * @param {Context} options - context
 * @implements {ReverseNameResolver}
 */
const AbstractReverseNameResolver = function (options) {
  this.ctx = options;
};

/**************************************************************************************************************/

/**
 * @function handle
 * @memberof AbstractReverseNameResolver#
 * @abstract
 */
AbstractReverseNameResolver.prototype.handle = function () {
  throw new Error("AbstractReverseNameResolver.js: handle from AbstractReverseNameResolver not implemented");
};

/**
 * @function remove
 * @memberof AbstractReverseNameResolver#
 * @abstract
 */
AbstractReverseNameResolver.prototype.remove = function () {
  throw new Error("AbstractReverseNameResolver.js: remove from AbstractReverseNameResolver not implemented");
};

/**************************************************************************************************************/

///**
// *    Extract HealpixId, order from url
// */
//AbstractReverseNameResolver.prototype.extractFilters = function (url) {
//    var filtersUrl = url.substring(url.indexOf('?') + 1, url.length);
//
//    var filtersParts = filtersUrl.split('&');
//
//    var startOrder, startHealpixID;
//    var order, healpixID;
//    _.each(filtersParts, function (part) {
//
//        var keyAndValue = part.split('=');
//
//        if (keyAndValue[0] === "order") {
//            order = keyAndValue[1];
//        }
//        if (keyAndValue[0] === "healpix") {
//            healpixID = keyAndValue[1];
//        }
//    });
//
//    return this.filters = {
//        "healpixID": healpixID,
//        "order": order
//    };
//};

export default AbstractReverseNameResolver;
