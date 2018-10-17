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

define([
    "./RendererTileData",
    "../Tiling/Tile",
    "../Utils/Utils",
    "../Utils/UtilsIntersection"
], function(RendererTileData, Tile, Utils, UtilsIntersection) {
    /**************************************************************************************************************/

    /**
  @name VectorRenderer
  @class
	  VectorRenderer constructor
  @param {AbstractGlobe} globe AbstractGlobe
  @constructor
  */
    var VectorRenderer = function(globe) {
        this.tileManager = globe.tileManager;
        this.globe = globe;
        this.buckets = [];
        this.maxTilePerGeometry = 100;
        this.levelZeroTiledGeometries = [];
    };

    /**************************************************************************************************************/

    /**
     * Find a compatible bucket
     * @function findBucket
     * @memberof VectorRenderer.prototype
     * @param layer
     * @param style
     * @return {Bucket} Bucket
     */
    VectorRenderer.prototype.findBucket = function(layer, style) {
        // Find an existing bucket for the given style
        for (var i = 0; i < this.buckets.length; i++) {
            var bucket = this.buckets[i];
            if (bucket.layer === layer && bucket.isCompatible(style)) {
                return bucket;
            }
        }

        return null;
    };

    /**************************************************************************************************************/

    /**
     * Generate the level zero for a tile
     * @function generateLevelZero
     * @memberof VectorRenderer.prototype
     * @param {Tile} tile Tile
     */
    VectorRenderer.prototype.generateLevelZero = function(tile) {
        for (var i = 0; i < this.levelZeroTiledGeometries.length; i++) {
            var geometry = this.levelZeroTiledGeometries[i];

            // Check that the geometry is on this tile
            var isFound = false;
            for (var n = 0; n < geometry._tileIndices.length && !isFound; n++) {
                var t = this.tileManager.level0Tiles[geometry._tileIndices[n]];
                isFound = t === tile;
            }

            // Found the tile, so add it
            if (isFound) {
                this._addGeometryToTile(geometry._bucket, geometry, tile);
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Recursively add a geometry to a tile
     * @function _recursiveAddGeometryToTile
     * @memberof VectorRenderer.prototype
     * @param {Bucket} bucket Bucket
     * @param geometry
     * @param {Tile} tile Tile
     * @private
     */
    VectorRenderer.prototype._recursiveAddGeometryToTile = function(
        bucket,
        geometry,
        tile
    ) {
        var renderable = this._addGeometryToTile(bucket, geometry, tile);

        if (renderable && renderable.generateChild && tile.children) {
            for (var i = 0; i < 4; i++) {
                if (tile.children[i].state === Tile.State.LOADED) {
                    renderable.hasChildren = true;
                    this._recursiveAddGeometryToTile(
                        bucket,
                        geometry,
                        tile.children[i]
                    );
                }
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Add a geometry to a vector renderer
     * @function addGeometry
     * @memberof VectorRenderer.prototype
     * @param layer
     * @param geometry
     * @param style
     */
    VectorRenderer.prototype.addGeometry = function(layer, geometry, style) {
        var bucket = this.getOrCreateBucket(layer, geometry, style);
        geometry._bucket = bucket;
        var tileIndices =
            this.maxTilePerGeometry > 0
                ? this.tileManager.tiling.getOverlappedLevelZeroTiles(geometry)
                : null;
        if (tileIndices && tileIndices.length < this.maxTilePerGeometry) {
            // Add geometry to each tile in range
            for (var i = 0; i < tileIndices.length; i++) {
                var tile = this.tileManager.level0Tiles[tileIndices[i]];
                if (
                    tile &&
                    typeof tile !== "undefined" &&
                    tile.state === Tile.State.LOADED
                ) {
                    this._recursiveAddGeometryToTile(bucket, geometry, tile);
                }
            }

            geometry._tileIndices = tileIndices;
            this.levelZeroTiledGeometries.push(geometry);
        } else {
            // Attach to mainRenderable
            if (!bucket.mainRenderable) {
                bucket.mainRenderable = bucket.createRenderable();
            }
            bucket.mainRenderable.add(geometry);
        }
    };

    /**************************************************************************************************************/

    /**
     * Remove a geometry from a vector renderer
     * @function removeGeometry
     * @memberof VectorRenderer.prototype
     * @param geometry
     * @private
     */
    VectorRenderer.prototype.removeGeometry = function(geometry) {
        var tileIndices = geometry._tileIndices;

        if (tileIndices) {
            // Remove from tile
            for (var i = 0; i < tileIndices.length; i++) {
                var tile = this.tileManager.level0Tiles[tileIndices[i]];
                this.removeGeometryFromTile(geometry, tile);
            }
            // Remove from geometry arrays
            this.levelZeroTiledGeometries.splice(
                this.levelZeroTiledGeometries.indexOf(geometry),
                1
            );

            geometry._tileIndices = null;
        } else {
            var bucket = geometry._bucket;
            if (bucket.mainRenderable) {
                var numGeometries = bucket.mainRenderable.remove(geometry);
                if (numGeometries === 0) {
                    bucket.mainRenderable.dispose(this.renderContext);
                    bucket.mainRenderable = null;
                }
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Get or create a bucket for the given configuration
     * @function getOrCreateBucket
     * @memberof VectorRenderer.prototype
     * @param layer
     * @param geometry
     * @param style
     * @return {Bucket} Bucket
     */
    VectorRenderer.prototype.getOrCreateBucket = function(
        layer,
        geometry,
        style
    ) {
        // Then find an existing bucket
        var bucket = this.findBucket(layer, style);
        if (!bucket) {
            bucket = this.createBucket(layer, style);
            bucket.renderer = this;
            bucket.id = this.globe.getRendererManager().bucketId++;
            this.buckets.push(bucket);
        }
        return bucket;
    };

    /**************************************************************************************************************/

    /**
     * Add a geometry to a tile
     * @function addGeometryToTile
     * @memberof VectorRenderer.prototype
     * @param layer
     * @param geometry
     * @param style
     * @param {Tile} tile Tile
     */
    VectorRenderer.prototype.addGeometryToTile = function(
        layer,
        geometry,
        style,
        tile
    ) {
        var bucket = this.getOrCreateBucket(layer, geometry, style);
        geometry._bucket = bucket;
        return this._addGeometryToTile(bucket, geometry, tile);
    };

    /**************************************************************************************************************/

    /**
     * Internal method to add a geometry to a tile
     * @function _addGeometryToTile
     * @memberof VectorRenderer.prototype
     * @param {Bucket} bucket Buckeont
     * @param geometry
     * @param {Tile} tile Tile
     * @private
     */
    VectorRenderer.prototype._addGeometryToTile = function(
        bucket,
        geometry,
        tile
    ) {
        var tileData = tile.extension.renderer;
        if (!tileData) {
            tileData = tile.extension.renderer = new RendererTileData(
                this.globe.getRendererManager()
            );
        }

        var renderable = tileData.getRenderable(bucket);
        var needsToAdd = false;
        if (!renderable) {
            renderable = bucket.createRenderable();
            needsToAdd = true;
        }
        if (renderable.add(geometry, tile)) {
            if (needsToAdd) {
                tileData.renderables.push(renderable);
            }
            return renderable;
        }

        return null;
    };

    /**************************************************************************************************************/

    /**
     * Remove a geometry from a tile (recursive)
     * @function _removeGeometryFromTile
     * @memberof VectorRenderer.prototype
     * @param geometry
     * @param {Bound} bbox Bbox of geometry
     * @param {Tile} tile Tile
     * @param {Integer} level Level
     * @private
     */
    VectorRenderer.prototype._removeGeometryFromTile = function(
        geometry,
        bbox,
        tile,
        level
    ) {
        var maxLevel = 0;
        if (
            bbox !== null &&
            UtilsIntersection.boundsIntersects(bbox, tile.bound) === false
        ) {
            return maxLevel;
        }

        var tileData = null;
        if (tile && tile.extension) {
            tileData = tile.extension.renderer;
        }

        if (tileData) {
            var i = 0;
            while (i < tileData.renderables.length) {
                var renderable = tileData.renderables[i];
                var renderer = renderable.bucket.renderer;
                if (renderer === this) {
                    // Remove renderable
                    var numGeometries = renderable.remove(geometry);
                    if (numGeometries === 0) {
                        tileData.renderables.splice(i, 1);
                    } else {
                        i++;
                    }

                    // Remove geometry from children if needed
                    if (renderable.hasChildren === true && tile.children) {
                        for (var n = 0; n < 4; n++) {
                            if (tile.children[n].state === Tile.State.LOADED) {
                                var levelReturned = this._removeGeometryFromTile(
                                    geometry,
                                    bbox,
                                    tile.children[n],
                                    level + 1
                                );
                                if (levelReturned > maxLevel) {
                                    maxLevel = levelReturned;
                                }
                            }
                        }
                    }
                } else {
                    i++;
                }
            }
        }
        return maxLevel;
    };

    /**
     * Remove a geometry from a tile
     * @function removeGeometryFromTile
     * @memberof VectorRenderer.prototype
     * @param geometry
     * @param {Tile} tile Tile
     */
    VectorRenderer.prototype.removeGeometryFromTile = function(geometry, tile) {
        var bbox = Utils.getBBox(geometry);
        // var startDate = new Date();
        var maxLevel = this._removeGeometryFromTile(geometry, bbox, tile, 0);
        // var endDate = new Date();
        // console.log("Delta remove : "+(endDate*1.0 - startDate*1.0)+"ms with "+maxLevel+" levels");
    };

    /**************************************************************************************************************/

    return VectorRenderer;
});
