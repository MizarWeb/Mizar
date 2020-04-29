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
 *    Cache storing <AbstractRasterLayer> tile requests in browser's local storage
 *    Due to performance reasons, it's recommended to use it only for tiles of level 0
 *    @param {Layer} layer
 *    @param options
 *        <ul>
 *            <li>layer: Layer which will contain the given cache(required)</li>
 *            <li>cacheLevel: the maximum level of tiles to be cached</li>
 *        </ul>
 */
var Cache = function (layer, options) {
  this.layer = layer;
  this.options = options;

  this.cacheLevel = options.hasOwnProperty("cacheLevel") ? options.cacheLevel : 1;

  if (!localStorage.getItem(this.layer.getName())) {
    // Create cache space in local storage named after layer
    localStorage.setItem(this.layer.getName(), JSON.stringify({}));
  }

  this._cacheMap = JSON.parse(localStorage.getItem(this.layer.getName()));
};

/**************************************************************************************************************/

/**
 *    Get tile request from cache for the given tile
 *    @returns The image(TODO: handle elevations) corresponding to the given tile, null if doesn't exist in cache
 */
Cache.prototype.getFromCache = function (tile) {
  var cachedTileRequest = null;
  if (this.cacheLevel >= tile.level) {
    var tileId = this.layer.getUrl(tile);
    var tileInfo = this._cacheMap[tileId];
    if (tileInfo) {
      // Update access info
      tileInfo.lastAccess = Date.now();

      var image = new Image();
      image.src = tileInfo.dataUrl;
      image.dataType = "byte";
      cachedTileRequest = {
        image: image,
        elevations: tileInfo.elevations
      };
    }
  }
  return cachedTileRequest;
};

/**************************************************************************************************************/

/**
 *    Internal method to generate data url from HTML image object
 */
Cache.prototype._createDataURL = function (image) {
  var imgCanvas = document.createElement("canvas");
  // Make sure canvas is as big as layer requests
  imgCanvas.width = this.options.tilePixelSize || 256;
  imgCanvas.height = this.options.tilePixelSize || 256;

  var imgContext = imgCanvas.getContext("2d");
  // Draw image into canvas element
  imgContext.drawImage(image, 0, 0, image.width, image.height);

  // Save image as a data URL
  return imgCanvas.toDataURL("image/png");
};

/**************************************************************************************************************/

/**
 *    Store tile request in cache
 */
Cache.prototype.storeInCache = function (tileRequest) {
  var tile = tileRequest.tile;
  if (this.cacheLevel >= tile.level) {
    var tileId = this.layer.getUrl(tile);
    this._cacheMap[tileId] = {
      dataUrl: this._createDataURL(tileRequest.image),
      elevations: tileRequest.elevations,
      lastAccess: Date.now()
    };

    // Update local storage with new cache
    localStorage.setItem(this.layer.getName(), JSON.stringify(this._cacheMap));
  }
};

/**************************************************************************************************************/

/**
 * Clear cache
 */
Cache.prototype.clear = function () {
  this._cacheMap = {};
  localStorage.clear();
};

export default Cache;
