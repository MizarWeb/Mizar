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

import TileManager from "../Tiling/TileManager";
import TilePool from "../Tiling/TilePool";
import Utils from "../Utils/Utils";
import AbstractGlobe from "./AbstractGlobe";
import Constants from "../Utils/Constants";
/**
 * @name Sky
 * @class
 * Create a virtual sky in a HTML canvas element with its own coordinate reference system.
 *
 * The sky handles two different grids in the same time in order to display both
 * the galactic and equatorial rasters.
 *
 * @augments AbstractGlobe
 * @param {AbstractGlobe.configuration} options - Sky configuration
 * @constructor
 * @memberof module:Globe
 */
var Sky = function (options) {
  AbstractGlobe.prototype.constructor.call(this, Constants.GLOBE.Sky, options);
  this.tilePool = new TilePool(this.renderContext);

  this.tileManagers = {
    Equatorial: this.tileManager,
    Galactic: new TileManager(this, options)
  };

  this.renderContext.requestFrame();
};

/**************************************************************************************************************/
Utils.inherits(AbstractGlobe, Sky);

/**************************************************************************************************************/

/**
 * @function dispose
 * @memberof Sky#
 */
Sky.prototype.dispose = function () {
  for (var x in this.tileManagers) {
    if (this.tileManagers.hasOwnProperty(x)) {
      this.tileManagers[x].reset();
      this.tileManagers[x].tilePool.disposeAll();
    }
  }
};

/**
 * @function setBaseImagery
 * @memberof Sky#
 * @throws {RangeError} Layer must be set
 **/
Sky.prototype.setBaseImagery = function (layer) {
  if (layer == null) {
    throw new RangeError("layer must be exist.", "Sky.js");
  }

  if (this.baseImagery === layer) {
    return;
  }

  if (this.baseImagery) {
    this.tileManagers[this.baseImagery.tiling.coordinateSystem.getGeoideName()].setImageryProvider(null);
    this.baseImagery = null;
  }

  layer.loadOverview();

  // Attach the layer to the globe
  this.definedBackgound = true;
  layer.visible = true;
  if (layer.isDetached()) {
    this.addLayer(layer);
  }
  this.tileManagers[layer.tiling.coordinateSystem.getGeoideName()].setImageryProvider(layer);
  this.baseImagery = layer;
  this.publishEvent(Constants.EVENT_MSG.LAYER_BACKGROUND_CHANGED, layer);
};

/**
 * @function render
 * @memberof Sky#
 */
Sky.prototype.render = function () {
  // Render tiles manager
  if (this.isEnabled()) {
    this.tileManagers[Constants.CRS.Galactic].render();
    this.tileManagers[Constants.CRS.Equatorial].render();
  }
};

/**
 * @function destroy
 * @memberof Sky#
 */
Sky.prototype.destroy = function () {
  AbstractGlobe.prototype.destroy.call(this);
  this.tileManagers.Galactic.reset();
  this.tileManagers.Galactic.tilePool.disposeAll();
  this.tileManagers = null;
};

/**************************************************************************************************************/

export default Sky;
