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
    "../Utils/Utils",
    "../Renderer/BatchRenderable",
    "../Utils/Constants"
], function(Utils, BatchRenderable, Constants) {
    /**************************************************************************************************************/

    /** @constructor
     *    TiledVectorRenderable constructor
     */
    var TiledVectorRenderable = function(bucket) {
        BatchRenderable.prototype.constructor.call(this, bucket);

        this.tile = null;
        // The tiled vector renderable always has a children
        this.hasChildren = true;
    };

    /**************************************************************************************************************/

    Utils.inherits(BatchRenderable, TiledVectorRenderable);

    /**************************************************************************************************************/

    /**
     * Initialize a child renderable
     */
    TiledVectorRenderable.prototype.initChild = function(i, j) {
        var child = new TiledVectorRenderable(this.bucket);
        child.tile = this.tile;
        child.vertexBufferShared = true;
        child.vertexBuffer = this.vertexBuffer;
        child.vertices = this.vertices;
        child.buildChildrenIndices(this, j * 2 + i);
        return child;
    };

    /**************************************************************************************************************/

    /**
     * Generate a child renderable
     */
    TiledVectorRenderable.prototype.generateChild = function(tile) {
        for (var j = 0; j < this.geometryInfos.length; j++) {
            this.bucket.renderer._addGeometryToTile(
                this.bucket,
                this.geometryInfos[j].geometry,
                tile
            );
        }
    };

    /**************************************************************************************************************/

    /**
     * Build children indices.
     * Children indices are used to render a tile children when it is not completely loaded.
     */
    TiledVectorRenderable.prototype.buildChildrenIndices = function(
        parent,
        index
    ) {
        var n;
        var vertexOffset1, vertexOffset2, vertexOffset3;
        var x1, x2, x3, i;
        var y1, y2, y3, j;
        for (n = 0; n < parent.triIndices.length; n += 3) {
            vertexOffset1 = 3 * parent.triIndices[n];
            vertexOffset2 = 3 * parent.triIndices[n + 1];
            vertexOffset3 = 3 * parent.triIndices[n + 2];

            x1 = parent.vertices[vertexOffset1];
            x2 = parent.vertices[vertexOffset2];
            x3 = parent.vertices[vertexOffset3];

            i = 0;
            if (
                x1 > 0 ||
                (x1 === 0 && x2 > 0) ||
                (x1 === 0 && x2 === 0 && x3 > 0)
            ) {
                i = 1;
            }

            y1 = parent.vertices[vertexOffset1 + 1];
            y2 = parent.vertices[vertexOffset2 + 1];
            y3 = parent.vertices[vertexOffset3 + 1];

            j = 1;
            if (
                y1 > 0 ||
                (y1 === 0 && y2 > 0) ||
                (y1 === 0 && y2 === 0 && y3 > 0)
            ) {
                j = 0;
            }

            if (index === 2 * j + i) {
                this.triIndices.push(
                    parent.triIndices[n],
                    parent.triIndices[n + 1],
                    parent.triIndices[n + 2]
                );
            }
        }
        for (n = 0; n < parent.lineIndices.length / 2; n++) {
            vertexOffset1 = 3 * parent.lineIndices[2 * n];
            vertexOffset2 = 3 * parent.lineIndices[2 * n + 1];

            x1 = parent.vertices[vertexOffset1];
            x2 = parent.vertices[vertexOffset2];

            i = 0;
            if (x1 > 0 || (x1 === 0 && x2 > 0)) {
                i = 1;
            }

            y1 = parent.vertices[vertexOffset1 + 1];
            y2 = parent.vertices[vertexOffset2 + 1];

            j = 1;
            if (y1 > 0 || (y1 === 0 && y2 > 0)) {
                j = 0;
            }

            if (index === 2 * j + i) {
                this.lineIndices.push(
                    parent.lineIndices[2 * n],
                    parent.lineIndices[2 * n + 1]
                );
            }
        }
    };

    /**************************************************************************************************************/

    /**
     *    Add a feature to the renderable
     *    @return    Boolean indicating if geometry intersects the given tile
     */
    TiledVectorRenderable.prototype.build = function(geometry, tile) {
        this.tile = tile;
        var i, j;
        var tileInRange;
        if (
            typeof this.bucket.layer.minLevel === "undefined" ||
            typeof this.bucket.layer.maxLevel === "undefined"
        ) {
            tileInRange = true;
        } else {
            tileInRange =
                this.bucket.layer.minLevel <= tile.level &&
                tile.level <= this.bucket.layer.maxLevel;
        }

        if (tileInRange) {
            var coords = geometry.coordinates;
            switch (geometry.type) {
            case Constants.GEOMETRY.LineString:
                this.buildVerticesAndIndices(tile, coords);
                break;
            case Constants.GEOMETRY.Polygon:
                for (i = 0; i < coords.length; i++) {
                    this.buildVerticesAndIndices(tile, coords[i]);
                }
                break;
            case Constants.GEOMETRY.MultiLineString:
                for (i = 0; i < coords.length; i++) {
                    this.buildVerticesAndIndices(tile, coords[i]);
                }
                break;
            case Constants.GEOMETRY.MultiPolygon:
                for (j = 0; j < coords.length; j++) {
                    for (i = 0; i < coords[j].length; i++) {
                        this.buildVerticesAndIndices(tile, coords[j][i]);
                    }
                }
                break;
            }
        }
        return tile.geoBound.intersectsGeometry(geometry);
    };

    /**************************************************************************************************************/

    return TiledVectorRenderable;
});
