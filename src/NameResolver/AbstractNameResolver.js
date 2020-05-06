/*******************************************************************************
 * Copyright 2017, 2018 CNES8 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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
 * @name AbstractNameResolverer
 * @class
 * Abstract Wrapper constructor
 * @param {Context} options - Context
 * @implements {NameResolver}
 */
const AbstractNameResolver = function (options) {
  this.ctx = options;
};

/**************************************************************************************************************/

/**
 * @function handle
 * @memberof AbstractNameResolver#
 * @abstract
 */
AbstractNameResolver.prototype.handle = function (options) {
  throw new Error("AbstractNameResolver.js: handle from NameResolver not implemented");
};

/**
 * @function remove
 * @memberof AbstractNameResolver#
 * @abstract
 */
AbstractNameResolver.prototype.remove = function () {
  throw new Error("AbstractNameResolver.js: remove from NameResolver not implemented");
};

/**************************************************************************************************************/

export default AbstractNameResolver;
