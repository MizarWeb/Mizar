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
 * GlobWeb is distributered in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/
/**
 * Provides classes for handling a globe.
 * <p>
 * The different possible globes in MIZAR are :
 * <ul>
 *     <li>a sky</li>
 *     <li>a planet</li>
 * </ul>
 * <p>
 * A sky is a globe where the camera is located in it whereas the planet is a globe where the camera
 * is located outside.
 * <br/>
 * In addition to the classes, a {@link module:Globe.GlobeFactory factory} is available to help for creating globe.
 * Once the globe is created, the client can handle it by the use of its {@link Globe interface}.
 *
 * @module Globe
 * @implements {Globe}
 */
import Tile from "../Tiling/Tile";
import Utils from "../Utils/Utils";
import AbstractGlobe from "./AbstractGlobe";
import Constants from "../Utils/Constants";
/**
 * @name Planet
 * @class
 * Create a virtual planet in a HTML canvas element with its own coordinate reference system.
 * @augments AbstractGlobe
 * @param {AbstractGlobe.configuration} options - Planet configuration
 * @constructor
 * @memberof module:Globe
 */
const Planet = function (options) {
  AbstractGlobe.prototype.constructor.call(this, Constants.GLOBE.Planet, options);
  this.manualRendererlayers = [];
};

/**************************************************************************************************************/

Utils.inherits(AbstractGlobe, Planet);

/**************************************************************************************************************/

/**
 * Sets the base imagery layer for the Planet.
 * @function setBaseImagery
 * @memberof Planet#
 * @param {AbstractRasterLayer} layer the layer to use
 * @throws {RangeError} layer must be set.
 */
Planet.prototype.setBaseImagery = function (layer) {
  if (layer == null) {
    throw new RangeError("Planet.js: layer must be exist.");
  }

  if (layer === this.baseImagery) {
    return;
  }

  if (this.baseImagery) {
    this.tileManager.setImageryProvider(null);
    this.baseImagery = null;
  }

  // Attach the layer to the globe
  this.definedBackgound = true;
  layer.background = true;
  layer.visible = true;
  //setImageryProvider needs visible=true and we cannit
  if (layer.isDetached()) {
    this.addLayer(layer);
  }
  this.tileManager.setImageryProvider(layer);
  this.baseImagery = layer;
  this.publishEvent(Constants.EVENT_MSG.LAYER_BACKGROUND_CHANGED, layer);
};

/**
 * @function setBaseElevation
 * @memberof Planet#
 */
Planet.prototype.setBaseElevation = function (layer) {
  if (this.tileManager.elevationProvider) {
    this.removeLayer(this.tileManager.elevationProvider);
  }
  this.tileManager.setElevationProvider(layer);
  if (layer) {
    this.addLayer(layer);
  }
};

/**
 * @function getElevation
 * @memberof Planet#
 */
Planet.prototype.getElevation = function (lon, lat) {
  // Use imagery provider tiling if defined, otherwise use globe default one
  let tiling = this.tileManager.tiling;
  if (this.baseImagery) {
    tiling = this.baseImagery.tiling;
  }
  const levelZeroTile = this.tileManager.level0Tiles[tiling.lonlat2LevelZeroIndex(lon, lat)];

  if (Tile.State && levelZeroTile && levelZeroTile.state === Tile.State.LOADED) {
    return levelZeroTile.getElevation(lon, lat);
  } else {
    return 0.0;
  }
};

/**
 * @function render
 * @memberof Planet#
 */
Planet.prototype.render = function () {
  if (this.isEnabled()) {
    // Call pre-renderers (only in 3D mode, no atmosphere for 2D)
    if (!this.coordinateSystem.isFlat()) {
      for (let i = 0; i < this.preRenderers.length; i++) {
        this.preRenderers[i].preRender();
      }
    }
    // Render tiles
    this.tileManager.render();
  }

  this.cachedPickingValue = null;
};

/**
 * @function hashMesh
 * @memberof Planet#
 */
Planet.prototype.hasMesh = function () {
  return true;
};

/**************************************************************************************************************/

export default Planet;
