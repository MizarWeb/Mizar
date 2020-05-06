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

import Utils from "../Utils/Utils";
import Constants from "../Utils/Constants";
// import UtilsIntersection from "../Utils/UtilsIntersection";
import Tile from "./Tile";
import GeoBound from "../Renderer/GeoBound";
import HEALPixBase from "./HEALPixBase";
import "../Renderer/glMatrix";
/** @constructor
     Tile constructor
     */
const GeoTile = function (geoBound, level, x, y) {
  // Call ancestor constructor
  Tile.prototype.constructor.call(this);
  this.bound = this.geoBound = geoBound;
  this.level = level;
  this.x = x;
  this.y = y;
  this.key = this.level + "#" + this.x + "#" + this.y;
  this.type = Constants.TILE.GEO_TILE;
};

/**************************************************************************************************************/

/** inherits from Tile */
GeoTile.prototype = new Tile();

/**************************************************************************************************************/

/** @export
     Get elevation at a geo position
     */
GeoTile.prototype.getElevation = function (lon, lat) {
  // Get the lon/lat in coordinates between [0,1] in the tile
  const u = (lon - this.geoBound.getWest()) / (this.geoBound.getEast() - this.geoBound.getWest());
  const v = (lat - this.geoBound.getNorth()) / (this.geoBound.getSouth() - this.geoBound.getNorth());

  // Quick fix when lat is on the border of the tile
  const childIndex = (v >= 1 ? 1 : Math.floor(2 * v)) * 2 + Math.floor(2 * u);

  if (this.children && this.children[childIndex] && this.children[childIndex].state === Tile.State.LOADED) {
    return this.children[childIndex].getElevation(lon, lat);
  }

  const tess = this.config.tesselation;
  const i = Math.floor(u * tess);
  const j = Math.floor(v * tess);

  const vo = this.config.vertexSize * (j * tess + i);
  const vertex = [this.vertices[vo], this.vertices[vo + 1], this.vertices[vo + 2]];
  mat4.multiplyVec3(this.matrix, vertex);

  const geo = this.config.coordinateSystem.getWorldFrom3D(vertex);
  return geo[2];
};

GeoTile.prototype.getKey = function () {
  return this.key;
};

/**************************************************************************************************************/

/**
     Create the children
     */
GeoTile.prototype.createChildren = function () {
  // Create the children
  const lonCenter = (this.geoBound.getEast() + this.geoBound.getWest()) * 0.5;
  const latCenter = (this.geoBound.getNorth() + this.geoBound.getSouth()) * 0.5;

  const level = this.level + 1;

  const tile00 = new GeoTile(
    new GeoBound(this.geoBound.getWest(), latCenter, lonCenter, this.geoBound.getNorth()),
    level,
    2 * this.x,
    2 * this.y
  );
  const tile10 = new GeoTile(
    new GeoBound(lonCenter, latCenter, this.geoBound.getEast(), this.geoBound.getNorth()),
    level,
    2 * this.x + 1,
    2 * this.y
  );
  const tile01 = new GeoTile(
    new GeoBound(this.geoBound.getWest(), this.geoBound.getSouth(), lonCenter, latCenter),
    level,
    2 * this.x,
    2 * this.y + 1
  );
  const tile11 = new GeoTile(
    new GeoBound(lonCenter, this.geoBound.getSouth(), this.geoBound.getEast(), latCenter),
    level,
    2 * this.x + 1,
    2 * this.y + 1
  );

  tile00.initFromParent(this, 0, 0);
  tile10.initFromParent(this, 1, 0);
  tile01.initFromParent(this, 0, 1);
  tile11.initFromParent(this, 1, 1);

  this.children = [tile00, tile10, tile01, tile11];
};

/**************************************************************************************************************/

/**
     Convert coordinates in longitude,latitude to coordinate in "tile space"
     Tile space means coordinates are between [0,tesselation-1] if inside the tile
     Used by renderers algorithm to clamp coordinates on the tile
     */
GeoTile.prototype.lonlat2tile = function (coordinates) {
  const ul = this.geoBound.getEast() - this.geoBound.getWest();
  const vl = this.geoBound.getSouth() - this.geoBound.getNorth();
  const factor = this.config.tesselation - 1;
  const tileCoords = [];
  for (let i = 0; i < coordinates.length; i++) {
    const u = (factor * (coordinates[i][0] - this.geoBound.getWest())) / ul;
    const v = (factor * (coordinates[i][1] - this.geoBound.getNorth())) / vl;
    tileCoords.push([u, v]);
  }
  return tileCoords;
};

/**************************************************************************************************************/

/**
     Generate vertices for tile
     */
GeoTile.prototype.generateVertices = function (elevations) {
  // Compute tile matrix
  this.matrix = this.config.coordinateSystem.getLHVTransform(this.geoBound.getCenter());
  const invMatrix = mat4.create();
  mat4.inverse(this.matrix, invMatrix);
  this.inverseMatrix = invMatrix;

  // Build the vertices
  const vertexSize = this.config.vertexSize;
  const size = this.config.tesselation;
  const vertices = new Float32Array(vertexSize * size * (size + 6));
  const lonStep = (this.geoBound.getEast() - this.geoBound.getWest()) / (size - 1);
  const latStep = (this.geoBound.getSouth() - this.geoBound.getNorth()) / (size - 1);
  //var radius = this.config.coordinateSystem.getGeoide().getRadius();
  //var scale = this.config.coordinateSystem.getGeoide().getHeightScale();
  let offset = 0;

  // Optimized build for sphere coordinates : uncomment if needed
  let lat = this.geoBound.getNorth(); /* * Math.PI / 180.0*/
  // latStep = latStep * Math.PI / 180.0;
  // lonStep = lonStep * Math.PI / 180.0;
  const pos3d = [0.0, 0.0, 0.0];
  for (let j = 0; j < size; j++) {
    //var cosLat = Math.cos( lat );
    //var sinLat = Math.sin( lat );

    let lon = this.geoBound.getWest(); /* * Math.PI / 180.0*/

    for (let i = 0; i < size; i++) {
      // var height = elevations ? scale * elevations[ offset ] : 0.0;
      // var x = (radius + height) * Math.cos( lon ) * cosLat;
      // var y = (radius + height) * Math.sin( lon ) * cosLat;
      // var z = (radius + height) * sinLat;

      const height = elevations ? elevations[offset] : 0.0;
      this.config.coordinateSystem.get3DFromWorld([lon, lat, height], pos3d);
      const x = pos3d[0];
      const y = pos3d[1];
      const z = pos3d[2];
      const vi = offset * vertexSize;
      vertices[vi] = invMatrix[0] * x + invMatrix[4] * y + invMatrix[8] * z + invMatrix[12];
      vertices[vi + 1] = invMatrix[1] * x + invMatrix[5] * y + invMatrix[9] * z + invMatrix[13];
      vertices[vi + 2] = invMatrix[2] * x + invMatrix[6] * y + invMatrix[10] * z + invMatrix[14];

      offset++;
      lon += lonStep;
    }

    lat += latStep;
  }

  return vertices;
};

/**************************************************************************************************************/

/** @constructor
     GeoTiling constructor
     */
const GeoTiling = function (nx, ny) {
  this.level0NumTilesX = nx;
  this.level0NumTilesY = ny;
};

/**************************************************************************************************************/

/**
     Generate the tiles for level zero
     */
GeoTiling.prototype.generateLevelZeroTiles = function (config) {
  config.skirt = !config.coordinateSystem.isFlat();
  config.cullSign = 1;
  config.srs = "CRS:84";

  const level0Tiles = [];

  const latStep =
    (config.coordinateSystem.getGeoBound().getNorth() - config.coordinateSystem.getGeoBound().getSouth()) /
    this.level0NumTilesY;
  const lonStep =
    (config.coordinateSystem.getGeoBound().getEast() - config.coordinateSystem.getGeoBound().getWest()) /
    this.level0NumTilesX;

  // Manage (just for latitude) a partial GeoTiling cover (not only 360 * 180)
  this.latStart = config.coordinateSystem.getGeoBound().getSouth();
  this.latDelta = config.coordinateSystem.getGeoBound().getNorth() - config.coordinateSystem.getGeoBound().getSouth();

  for (let j = 0; j < this.level0NumTilesY; j++) {
    for (let i = 0; i < this.level0NumTilesX; i++) {
      const geoBound = new GeoBound(
        config.coordinateSystem.getGeoBound().getWest() + i * lonStep,
        config.coordinateSystem.getGeoBound().getNorth() - (j + 1) * latStep,
        config.coordinateSystem.getGeoBound().getWest() + (i + 1) * lonStep,
        config.coordinateSystem.getGeoBound().getNorth() - j * latStep
      );
      const tile = new GeoTile(geoBound, 0, i, j);
      tile.config = config;
      level0Tiles.push(tile);
    }
  }

  return level0Tiles;
};

/**************************************************************************************************************/

/**
     Locate a level zero tile
     */

GeoTiling.prototype._lon2LevelZeroIndex = function (lon) {
  return Math.min(this.level0NumTilesX - 1, Math.floor(((lon + 180) * this.level0NumTilesX) / 360));
};

/**************************************************************************************************************/

/**
     Locate a level zero tile
     */
GeoTiling.prototype._lat2LevelZeroIndex = function (lat) {
  // Take into account a partial bbox for GeoTiling
  const topLat = this.latStart + this.latDelta;
  return Math.min(this.level0NumTilesY - 1, Math.floor(((topLat - lat) * this.level0NumTilesY) / this.latDelta));
};
/**************************************************************************************************************/

/**
     Locate a level zero tile
     */
GeoTiling.prototype.lonlat2LevelZeroIndex = function (lon, lat) {
  return this._lat2LevelZeroIndex(lat) * this.level0NumTilesX + this._lon2LevelZeroIndex(lon);
};

/**************************************************************************************************************/

/**
     Get the overlapped tile by the given geometry
     */
GeoTiling.prototype.getOverlappedLevelZeroTiles = function (geometry) {
  const tileIndices = [];
  const bbox = Utils.getBBox(geometry);
  const i1 = this._lon2LevelZeroIndex(bbox.west);
  const j1 = this._lat2LevelZeroIndex(bbox.north);
  const i2 = this._lon2LevelZeroIndex(bbox.east);
  const j2 = this._lat2LevelZeroIndex(bbox.south);
  for (let j = j1; j <= j2; j++) {
    for (let i = i1; i <= i2; i++) {
      tileIndices.push(j * this.level0NumTilesX + i);
    }
  }
  return tileIndices;
};

/**************************************************************************************************************/

/**
     Return tile of given longitude/latitude from tiles array if exists, null otherwise
     */
GeoTiling.prototype.findInsideTile = function (lon, lat, tiles) {
  let tile = null;
  for (var i = 0; i < tiles.length; i++) {
    tile = tiles[i];
    const index = HEALPixBase.lonLat2pix(tile.order, lon, lat);
    if (index === tile.pixelIndex) {
      return tile;
    }
  }
  // index not found, check with lon lat
  for (i = 0; i < tiles.length; i++) {
    tile = tiles[i];
    const found =
      lat <= tile.bound.north && lat >= tile.bound.south && lon <= tile.bound.east && lon >= tile.bound.west;
    if (found === true) {
      return tile;
    }
  }
  return null;
};

/**************************************************************************************************************/

export default GeoTiling;
