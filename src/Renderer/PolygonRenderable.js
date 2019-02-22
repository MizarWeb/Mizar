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
    "../Utils/Constants",
    "../Utils/Utils",
    "./FeatureStyle",
    "./RendererManager",
    "../Tiling/TiledVectorRenderable",
    "../Tiling/TiledVectorRenderer",
    "../Tiling/Triangulator",
    "./PolygonCutter",
    "../Gui/dialog/ErrorDialog"
], function(
    Constants,
    Utils,
    FeatureStyle,
    RendererManager,
    TiledVectorRenderable,
    TiledVectorRenderer,
    Triangulator,
    PolygonCutter,
    ErrorDialog
) {
    var dividePolygon = function(polygons, pointSet, bounds, level, res) {
        if (level === 0) {
            for (var i = 0; i < polygons.length; i++) {
                res.push(polygons[i]);
            }
            return;
        }

        var cx = (bounds[0] + bounds[2]) * 0.5;
        var cy = (bounds[1] + bounds[3]) * 0.5;

        var result = PolygonCutter.cutMulti(
            polygons,
            pointSet,
            [cx, bounds[1]],
            [cx, bounds[3]]
        );
        var nres;
        if (result.insidePolygons.length > 0) {
            nres = PolygonCutter.cutMulti(
                result.insidePolygons,
                pointSet,
                [bounds[0], cy],
                [bounds[2], cy]
            );
            if (nres.insidePolygons.length > 0) {
                dividePolygon(
                    nres.insidePolygons,
                    pointSet,
                    [cx, bounds[1], bounds[2], cy],
                    level - 1,
                    res
                );
            }
            if (nres.outsidePolygons.length > 0) {
                dividePolygon(
                    nres.outsidePolygons,
                    pointSet,
                    [cx, cy, bounds[2], bounds[3]],
                    level - 1,
                    res
                );
            }
        }
        if (result.outsidePolygons.length > 0) {
            nres = PolygonCutter.cutMulti(
                result.outsidePolygons,
                pointSet,
                [bounds[0], cy],
                [bounds[2], cy]
            );
            if (nres.insidePolygons.length > 0) {
                dividePolygon(
                    nres.insidePolygons,
                    pointSet,
                    [bounds[0], bounds[1], cx, cy],
                    level - 1,
                    res
                );
            }
            if (nres.outsidePolygons.length > 0) {
                dividePolygon(
                    nres.outsidePolygons,
                    pointSet,
                    [bounds[0], cy, cx, bounds[3]],
                    level - 1,
                    res
                );
            }
        }
    };

    /**************************************************************************************************************/

    /**
         @name PolygonRenderable
         @class
             PolygonRenderable constructor
         @param {Bucket} bucket Bucket
         @augments TiledVectorRenderable
         @constructor
         */
    var PolygonRenderable = function(bucket) {
        TiledVectorRenderable.prototype.constructor.call(this, bucket);
    };

    /**************************************************************************************************************/

    // Inheritance
    Utils.inherits(TiledVectorRenderable, PolygonRenderable);

    /**************************************************************************************************************/

    function _getArea(ring) {
        var p1, p2;
        var area = 0.0;
        for (var i = 0; i < ring.length - 1; i++) {
            p1 = ring[i];
            p2 = ring[i + 1];

            area += (p1[0] + p2[0]) * (p2[1] - p1[1]);
        }
        return -area * 0.5;
    }

    /**
         @name PointSet
         @class
             PointSet constructor
         @param {Array} points Array of points
         @constructor
         */
    var PointSet = function(points) {
        this.points = [];
        this.indexMap = {};

        for (var i = 0; i < points.length; i++) {
            this.addPoint(points[i]);
        }
    };

    /**
     * Add a point
     * @function addPoint
     * @memberof PointSet.prototype
     * @param {Array} pt Point as array of 2 float
     */
    PointSet.prototype.addPoint = function(pt) {
        var key = pt[0] + "-" + pt[1];
        if (!this.indexMap[key]) {
            this.indexMap[key] = this.points.length;
            this.points.push(pt);
        }
        return this.indexMap[key];
    };

    var clipPolygonToTriGridStartUp = function(pointSet, bounds, level) {
        // Build an index polygon
        var poly = [];
        for (var i = 0; i < pointSet.points.length; i++) {
            poly[i] = i;
        }

        var result = PolygonCutter.cut(
            poly,
            pointSet,
            [bounds[0], bounds[1]],
            [bounds[0], bounds[3]]
        );
        result = PolygonCutter.cutMulti(
            result.insidePolygons,
            pointSet,
            [bounds[0], bounds[3]],
            [bounds[2], bounds[3]]
        );
        result = PolygonCutter.cutMulti(
            result.insidePolygons,
            pointSet,
            [bounds[2], bounds[3]],
            [bounds[2], bounds[1]]
        );
        result = PolygonCutter.cutMulti(
            result.insidePolygons,
            pointSet,
            [bounds[2], bounds[1]],
            [bounds[0], bounds[1]]
        );

        var polygons = [];
        dividePolygon(result.insidePolygons, pointSet, bounds, level, polygons);
        return polygons;
    };

    /**************************************************************************************************************/

    /**
     * Clamp a polygon on a tile
     * @function buildVerticesAndIndices
     * @memberof PolygonRenderable.prototype
     * @param {Tile} tile Tile
     * @param {Array} coordinates
     */
    PolygonRenderable.prototype.buildVerticesAndIndices = function(
        tile,
        coordinates
    ) {
        var size = tile.config.tesselation - 1;
        var numLevel = Math.floor(Math.log(size) / Math.log(2));

        // Convert points to tile "coordinates"
        var points = tile.lonlat2tile(coordinates);

        // A CW order is needed, so compute signed area to check if the input polygon is CW or not
        // Note : the transfromation lonlat2tile inverse the area compared to input coordinates
        var area = _getArea(points);
        var n, i;
        if (area > 0) {
            // Revert the points to have a CW polygon as input
            for (n = 0; n < points.length / 2; n++) {
                var tmp = points[n];
                points[n] = points[points.length - n - 1];
                points[points.length - n - 1] = tmp;
            }
        }

        // Recursively tesselate a polygon
        var pointSet = new PointSet(points);
        var polygons = clipPolygonToTriGridStartUp(
            pointSet,
            [0.0, 0.0, size, size],
            numLevel
        );
        if (polygons.length > 0) {
            var indexOffset = this.vertices.length / 3;

            // First fill vertex buffer
            for (n = 0; n < pointSet.points.length; n++) {
                var pt = pointSet.points[n];
                var vec = tile.computePosition(pt[0], pt[1]);
                this.vertices.push(vec[0], vec[1], vec[2]);
            }

            // Then fill index buffer
            for (n = 0; n < polygons.length; n++) {
                var polygon = polygons[n];
                if (polygon.length === 4) {
                    this.triIndices.push(
                        polygon[0] + indexOffset,
                        polygon[2] + indexOffset,
                        polygon[1] + indexOffset
                    );
                    this.lineIndices.push(
                        polygon[0] + indexOffset,
                        polygon[2] + indexOffset,
                        polygon[2] + indexOffset,
                        polygon[1] + indexOffset,
                        polygon[1] + indexOffset,
                        polygon[0] + indexOffset
                    );
                } else if (polygon.length === 5) {
                    this.triIndices.push(
                        polygon[0] + indexOffset,
                        polygon[3] + indexOffset,
                        polygon[1] + indexOffset
                    );
                    this.triIndices.push(
                        polygon[3] + indexOffset,
                        polygon[2] + indexOffset,
                        polygon[1] + indexOffset
                    );
                    this.lineIndices.push(
                        polygon[0] + indexOffset,
                        polygon[3] + indexOffset,
                        polygon[3] + indexOffset,
                        polygon[1] + indexOffset,
                        polygon[1] + indexOffset,
                        polygon[0] + indexOffset
                    );
                    this.lineIndices.push(
                        polygon[3] + indexOffset,
                        polygon[2] + indexOffset,
                        polygon[2] + indexOffset,
                        polygon[1] + indexOffset,
                        polygon[1] + indexOffset,
                        polygon[3] + indexOffset
                    );
                } else {
                    var coords = new Array(polygon.length);
                    for (i = 0; i < polygon.length; i++) {
                        coords[i] = pointSet.points[polygon[i]];
                    }
                    var tris = Triangulator.process(coords);
                    if (tris) {
                        for (i = 0; i < tris.length; i += 3) {
                            this.triIndices.push(
                                polygon[tris[i]] + indexOffset,
                                polygon[tris[i + 2]] + indexOffset,
                                polygon[tris[i + 1]] + indexOffset
                            );
                            this.lineIndices.push(
                                polygon[tris[i]] + indexOffset,
                                polygon[tris[i + 2]] + indexOffset
                            );
                            this.lineIndices.push(
                                polygon[tris[i + 2]] + indexOffset,
                                polygon[tris[i + 1]] + indexOffset
                            );
                            this.lineIndices.push(
                                polygon[tris[i + 1]] + indexOffset,
                                polygon[tris[i]] + indexOffset
                            );
                        }
                    } else {
                        ErrorDialog.open(Constants.LEVEL.DEBUG, "PolygonRenderable.js", "Triangulation problem");
                    }
                }
            }
        }
    };

    /**************************************************************************************************************/

    /**
         @name PolygonRenderer
         @class
             PolygonRenderer constructor
         @param {AbstractGlobe} globe Globe
         @augments TiledVectorRenderer
         @constructor
         */
    var PolygonRenderer = function(globe) {
        TiledVectorRenderer.prototype.constructor.call(this, globe);
    };

    // Inheritance
    Utils.inherits(TiledVectorRenderer, PolygonRenderer);

    /**************************************************************************************************************/

    /**
     * Check if renderer is applicable
     * @function canApply
     * @memberof PolygonRenderer.prototype
     * @param type
     * @param style
     * @return {Boolean} Can apply ?
     */
    PolygonRenderer.prototype.canApply = function(type, style) {
        return (
            style.fill &&
            (type === Constants.GEOMETRY.Polygon ||
                type === Constants.GEOMETRY.MultiPolygon)
        );
    };

    /**************************************************************************************************************/

    /**
         @name PolygonBucket
         @class
             PolygonBucket constructor
         @param layer
         @param style
         @constructor
         */
    var PolygonBucket = function(layer, style) {
        this.layer = layer;
        this.style = new FeatureStyle(style);
        this.renderer = null;
    };

    /**************************************************************************************************************/

    /**
     * Create a renderable for this bucket
     * @function createRenderable
     * @memberof PolygonBucket.prototype
     * @return {PolygonRenderable} Renderable
     */
    PolygonBucket.prototype.createRenderable = function() {
        return new PolygonRenderable(this);
    };

    /**************************************************************************************************************/

    /**
     * Check if a bucket is compatible
     * @function isCompatible
     * @memberof PolygonBucket.prototype
     * @param style
     * @return {Boolean} Is compatible ?
     */
    PolygonBucket.prototype.isCompatible = function(style) {
        return (
            this.style.fillColor[0] === style.fillColor[0] &&
            this.style.fillColor[1] === style.fillColor[1] &&
            this.style.fillColor[2] === style.fillColor[2] &&
            this.style.fillColor[3] === style.fillColor[3]
        );
    };

    /**************************************************************************************************************/

    /**
     * Get or create a bucket to store a feature with the given style
     * @function createBucket
     * @memberof PolygonRenderer.prototype
     * @param layer
     * @param style
     * @return {PolygonBucket} Bucket
     */
    PolygonRenderer.prototype.createBucket = function(layer, style) {
        // Create a bucket
        return new PolygonBucket(layer, style);
    };

    /**************************************************************************************************************/

    // Register the renderer
    RendererManager.factory.push(function(globe) {
        return new PolygonRenderer(globe);
    });

    return PolygonRenderable;
});
