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
    "jquery",
    "underscore-min",
    "./AbstractLayer",
    "../Utils/Constants",
    "../Renderer/FeatureStyle",
    "../Utils/Utils",
    "../Tiling/HEALPixBase",
    "./FitsLoader"
], function(
    $,
    _,
    AbstractLayer,
    Constants,
    FeatureStyle,
    Utils,
    HEALPixBase,
    FitsLoader
) {
    /**
     * MocLayer configuration
     * @typedef {AbstractLayer.configuration} AbstractLayer.moc_configuration
     * @property {string} baseUrl - service URL
     * @property {int} [startOrder = 2] - Starting order of HEALPix tiling
     * @property {Object} [style] - See {@link FeatureStyle} description
     */
    /**
     * @name MocLayer
     * @class
     * This layer draws a MOC data
     * @augments AbstractLayer
     * @param {AbstractLayer.moc_configuration} options - Moc layer configuration
     * @memberOf module:Layer
     * @see {@link http://www.ivoa.net/documents/MOC/20140602/index.html Moc}
     */
    var MocLayer = function(options) {
        options.dataType = Constants.GEOMETRY.LineString;
        AbstractLayer.prototype.constructor.call(
            this,
            Constants.LAYER.Moc,
            options
        );

        this.baseUrl = this.proxify(options.baseUrl);
        this.startOrder = options.startOrder || 2;

        if (options.coordinateSystem && options.coordinateSystem.geoideName) {
            this.crs = {
                properties: {
                    name: options.coordinateSystem.geoideName
                }
            };
        } else {
            this.crs = {
                properties: {
                    name: "Equatorial"
                }
            };
        }

        // Set style
        if (options && options.style) {
            this.style = new FeatureStyle(options.style);
        } else {
            this.style = new FeatureStyle();
        }

        this.featuresSet = null;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractLayer, MocLayer);

    /**************************************************************************************************************/

    /**
     * Attaches the layer to the planet
     * @function _attach
     * @memberOf MocLayer#
     * @param g Planet
     * @protected
     */
    MocLayer.prototype._attach = function(g) {
        AbstractLayer.prototype._attach.call(this, g);

        var self = this;
        var i;

        try {
            FitsLoader.loadFits(self.baseUrl, function(fits) {
                var healpixMoc = {};
                var binaryTable = fits.getHDU(1).data;

                // setting startOrder with first order in dataTable
                //self.startOrder = uniq2hpix(binaryTable.getRow(0)[binaryTable.columns[0]])[0];

                for (i = 0; i < binaryTable.rows; i++) {
                    var uniq = binaryTable.getRow(i);
                    var hpix = HEALPixBase.uniq2hpix(
                        uniq[binaryTable.columns[0]]
                    );

                    var order = hpix[0];
                    if (healpixMoc[order] === undefined) {
                        healpixMoc[order] = [];
                    }
                    healpixMoc[order].push(hpix[1]);
                }
                // MIZAR CANNOT display MOC with order less than 3, convert the current moc to a moc starting a order 3
                if (
                    healpixMoc.hasOwnProperty("0") ||
                    healpixMoc.hasOwnProperty("1") ||
                    healpixMoc.hasOwnProperty("2")
                ) {
                    for (i = 0; i < 3; i++) {
                        if (healpixMoc.hasOwnProperty(i)) {
                            var pixels = healpixMoc[i];
                            _.each(pixels, function(pixel) {
                                var pix = HEALPixBase.getChildren(pixel);
                                if (!healpixMoc.hasOwnProperty(i + 1)) {
                                    healpixMoc[i + 1] = [];
                                }
                                healpixMoc[i + 1].push(pix[0]);
                                healpixMoc[i + 1].push(pix[1]);
                                healpixMoc[i + 1].push(pix[2]);
                                healpixMoc[i + 1].push(pix[3]);
                            });
                            delete healpixMoc[i];
                        }
                    }
                }
                self.moc = healpixMoc;
                self.handleDistribution(healpixMoc);
                delete fits;
            });
        } catch (e) {
            $.ajax({
                type: "GET",
                url: self.baseUrl,
                dataType: "json",
                success: function(response) {
                    self.handleDistribution(response);
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    $("#addLayer_" + self.id)
                        .find("label")
                        .css("color", "red");
                    console.error(xhr.responseText);
                }
            });
        }

        // As post renderer, moc layer will regenerate data on tiles in case of base imagery change
        g.getTileManager().addPostRenderer(this);
    };

    /**************************************************************************************************************/

    /**
     * Generates moc data on tiles.
     * @function generate
     * @memberOf MocLayer#
     * @param {Tile} tile Tile
     */
    MocLayer.prototype.generate = function(tile) {
        if (this.featuresSet && tile.order === this.startOrder) {
            var geometries = this.featuresSet[tile.pixelIndex];
            if (geometries) {
                for (var i = 0; i < geometries.length; i++) {
                    this.getGlobe()
                        .getVectorRendererManager()
                        .addGeometryToTile(
                            this,
                            geometries[i],
                            this.style,
                            tile
                        );
                }
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Renders
     * @function render
     * @memberOf MocLayer#
     */
    MocLayer.prototype.render = function() {
        // No rendering
    };

    /**************************************************************************************************************/

    /**
     * Detaches the layer from the planet
     * @function _detach
     * @memberOf MocLayer#
     * @private
     */
    MocLayer.prototype._detach = function() {
        for (var tileIndex in this.featuresSet) {
            if (this.featuresSet.hasOwnProperty(tileIndex)) {
                var tile = this.getGlobe().getTileManager().level0Tiles[
                    tileIndex
                ];
                for (var i = 0; i < this.featuresSet[tileIndex].length; i++) {
                    this.getGlobe()
                        .getVectorRendererManager()
                        .removeGeometryFromTile(
                            this.featuresSet[tileIndex][i],
                            tile
                        );
                }
            }
        }
        this.featuresSet = null;
        this.getGlobe()
            .getTileManager()
            .removePostRenderer(this);

        AbstractLayer.prototype._detach.call(this);
    };

    /**************************************************************************************************************/

    /**
     * Returns children indices of starting tiling order.
     * @function findChildIndices
     * @memberOf MocLayer#
     * @param index Parent index
     * @param order Parent order
     */
    MocLayer.prototype.findChildIndices = function(index, order) {
        var childOrder = this.startOrder;
        var orderDepth = childOrder - order;
        var numSubTiles = Math.pow(4, orderDepth); // Number of subtiles depending on order
        var firstSubTileIndex = index * numSubTiles;
        var indices = [];
        for (
            var i = firstSubTileIndex;
            i < firstSubTileIndex + numSubTiles;
            i++
        ) {
            indices.push(i);
        }

        return indices;
    };

    /**************************************************************************************************************/

    /**
     * Returns index of parent of starting tiling order.
     * @function findParentIndex
     * @memberOf MocLayer#
     * @param index Child index
     * @param order Child order
     */
    MocLayer.prototype.findParentIndex = function(index, order) {
        var parentOrder = this.startOrder;
        var orderDepth = order - parentOrder;
        return Math.floor(index / Math.pow(4, orderDepth));
    };

    /**************************************************************************************************************/

    /**
     * Handles MOC response.
     * @function handleDistribution
     * @memberOf MocLayer#
     * @param response MOC response
     */
    MocLayer.prototype.handleDistribution = function(response) {
        var gl = this.getGlobe()
            .getTileManager()
            .getRenderContext().gl;
        this.featuresSet = {};
        var parentIndex;
        var i, u, v;
        // For each order, compute rectangles geometry depending on the pixel index
        for (var key in response) {
            if (response.hasOwnProperty(key)) {
                var order = parseInt(key, 10);
                for (i = 0; i < response[key].length; i++) {
                    var pixelIndex = response[key][i];

                    if (order > this.startOrder) {
                        parentIndex = this.findParentIndex(pixelIndex, order);
                    } else if (order === this.startOrder) {
                        parentIndex = pixelIndex;
                    } else {
                        // Handle low orders(< 3) by creating children polygons of order 3
                        var indices = this.findChildIndices(pixelIndex, order);
                        if (
                            response[this.startOrder.toString()] === undefined
                        ) {
                            response[
                                this.startOrder.toString()
                            ] = response[0].concat(indices);
                        } else {
                            response[this.startOrder.toString()] = response[
                                this.startOrder.toString()
                            ].concat(indices);
                        }
                        continue;
                    }

                    var geometry = {
                        type: Constants.GEOMETRY.Polygon,
                        gid: "moc" + this.id + "_" + order + "_" + pixelIndex,
                        crs: this.crs,
                        coordinates: [[]]
                    };

                    // Build the vertices
                    var size = 2; // TODO
                    var step = 1;

                    // Tesselate only low-order tiles
                    if (order < 5) {
                        size = 5;
                        step = 1.0 / (size - 1);
                    }

                    var nside = Math.pow(2, order);
                    var pix = pixelIndex & (nside * nside - 1);
                    var ix = HEALPixBase.compress_bits(pix);
                    var iy = HEALPixBase.compress_bits(pix >>> 1);
                    var face = pixelIndex >>> (2 * order);

                    var vertice, geo;

                    // Horizontal boudaries
                    for (u = 0; u < 2; u++) {
                        for (v = 0; v < size; v++) {
                            vertice = HEALPixBase.fxyf(
                                (ix + u * (size - 1) * step) / nside,
                                (iy + v * step) / nside,
                                face
                            );
                            geo = this.getGlobe()
                                .getCoordinateSystem()
                                .getWorldFrom3D(vertice);
                            if (u === 0) {
                                // Invert to clockwise sense
                                geometry.coordinates[0][
                                    2 * u * size + (size - 1) - v
                                ] = [geo[0], geo[1]];
                            } else {
                                geometry.coordinates[0][2 * u * size + v] = [
                                    geo[0],
                                    geo[1]
                                ];
                            }
                        }
                    }

                    // Vertical boundaries
                    for (v = 0; v < 2; v++) {
                        for (u = 0; u < size; u++) {
                            vertice = HEALPixBase.fxyf(
                                (ix + u * step) / nside,
                                (iy + v * (size - 1) * step) / nside,
                                face
                            );
                            geo = this.getGlobe()
                                .getCoordinateSystem()
                                .getWorldFrom3D(vertice);
                            if (v === 1) {
                                // Invert to clockwise sense
                                geometry.coordinates[0][
                                    size + 2 * v * size + (size - 1) - u
                                ] = [geo[0], geo[1]];
                            } else {
                                geometry.coordinates[0][
                                    size + 2 * v * size + u
                                ] = [geo[0], geo[1]];
                            }
                        }
                    }

                    var parentTile = this.getGlobe().getTileManager()
                        .level0Tiles[parentIndex];

                    if (!this.featuresSet[parentIndex]) {
                        this.featuresSet[parentIndex] = [];
                    }

                    this.featuresSet[parentIndex].push(geometry);
                    this.getGlobe()
                        .getVectorRendererManager()
                        .addGeometryToTile(
                            this,
                            geometry,
                            this.style,
                            parentTile
                        );
                }
            }
        }
    };

    return MocLayer;
});
