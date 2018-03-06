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
 * RasterLayer is an interface to get access to the raster layer data model.
 *
 * In addition to the classes, a {@link module:Layer.LayerFactory factory} is available to help for creating
 * layer. Once the layer is created, the client can handle it by the use of its {@link Layer interface} or its
 * {@link RasterLayer interface} .
 *
 * @see {@link module:Layer the layer package}
 * @interface
 * @extends {Layer}
 */
function RasterLayer() {}

/**
 * Returns the URL to query the raster.
 * @param {Tile} tile for which the URL is created
 * @returns {string} the URL
 */
RasterLayer.prototype.getUrl = function(tile) {};


/**
 * Returns the proxified Url when the tile level is between [minLevel, maxLevel]
 * @param url url
 * @returns {Boolean} the proxified Url when the tile level is between [minLevel, maxLevel]
 */
RasterLayer.prototype.proxify = function(url, level) {};

/**
 * Returns True when the tile is defined between [minLevel,maxLevel] otherwise False.
 * @param level level of the tile
 * @returns {Boolean} True when the tile level is defined between [minLevel,maxLevel] otherwise False.
 */
RasterLayer.prototype.isBetweenMinMaxLevel = function(level) {};

/**
 * Attaches the raster layer to the globe and creates an overlay if needed.
 * @param {Globe} g - globe
 * @private
 */
RasterLayer.prototype._attach = function (g) {};

/**************************************************************************************************************/

/**
 * Detaches the raster layer from the globe and removes the overlay is needed
 * @private
 */
AbstractRasterLayer.prototype._detach = function () {};
