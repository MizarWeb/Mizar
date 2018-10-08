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

define(["../Utils/Constants", "./RasterOverlayRenderer", "./GroundOverlayRenderer","../Gui/dialog/ErrorDialog"], function(
    Constants,
    RasterOverlayRenderer,
    GroundOverlayRenderer,
    ErrorDialog
) {
    /**************************************************************************************************************/

    /**
     @name RendererManager
     @class
         RendererManager constructor
     @param {AbstractGlobe} globe AbstractGlobe
     @constructor
     */
    var RendererManager = function(globe) {
        // Create the registered renderers
        this.renderers = [];
        for (var i = 0; i < RendererManager.factory.length; i++) {
            this.renderers.push(RendererManager.factory[i](globe));
        }

        // The array of renderables used during rendering
        this.renderables = [];

        // To uniquely identify buckets created by the renderers
        this.bucketId = 0;
    };

    /**************************************************************************************************************/

    /**
     The factory for renderers
     */
    RendererManager.factory = [];

    /**************************************************************************************************************/

    /**
     * Set the selected layer on the top.
     * @function setSelectedRasterBucket
     * @memberof RendererManager.prototype
     * @param selectedLayer Layer to draw on the top
     */
    RendererManager.prototype.setSelectedRasterBucket = function(selectedLayer) {
        var rendererIdx = this.renderers.length;
        while (rendererIdx--) {
            var renderer = this.renderers[rendererIdx];
            if (renderer instanceof RasterOverlayRenderer || renderer instanceof GroundOverlayRenderer) {
                var buckets = renderer.buckets;
                var bucketIdx = buckets.length;
                while (bucketIdx--) {
                    var bucket = buckets[bucketIdx];
                    var layer = bucket.layer;
                    if (
                        bucket.style.zIndex ==
                            Constants.DISPLAY.SELECTED_RASTER &&
                        bucket.style.zIndex <= Constants.DISPLAY.SELECTED_RASTER
                    ) {
                        bucket.style.zIndex = Constants.DISPLAY.DEFAULT_RASTER;
                    }
                    if (
                        layer.getID() === selectedLayer.getID() &&
                        bucket.style.zIndex <= Constants.DISPLAY.SELECTED_RASTER
                    ) {
                        bucket.style.zIndex = Constants.DISPLAY.SELECTED_RASTER;
                    }
                }
            }
        }
    };

    /**
     * Get a renderer
     * @function getRenderer
     * @memberof RendererManager.prototype
     * @param geometry
     * @param style
     * @return Renderer
     */
    RendererManager.prototype.getRenderer = function(geometry, style) {
        for (var i = 0; i < this.renderers.length; i++) {
            if (this.renderers[i].canApply(geometry.type, style)) {
                return this.renderers[i];
            }
        }

        return null;
    };

    /**************************************************************************************************************/

    /**
     *    Generate the tile data
     * @function generate
     * @memberof RendererManager.prototype
     * @param {Tile} tile Tile
     */
    RendererManager.prototype.generate = function(tile) {
        var i;
        if (!tile.parent) {
            for (i = 0; i < this.renderers.length; i++) {
                this.renderers[i].generateLevelZero(tile);
            }
        } else {
            var tileData = tile.parent.extension.renderer;
            if (tileData) {
                // delete renderer created at init time
                delete tile.extension.renderer;

                // Now generate renderables
                for (i = 0; i < tileData.renderables.length; i++) {
                    var renderable = tileData.renderables[i];
                    if (renderable.generateChild) {
                        renderable.generateChild(tile);
                    }
                }
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Add a geometry to the renderer
     * @function addGeometry
     * @memberof RendererManager.prototype
     * @param layer
     * @param geometry
     * @param style
     */
    RendererManager.prototype.addGeometry = function(layer, geometry, style) {
        var renderer = this.getRenderer(geometry, style);
        if (renderer) {
            renderer.addGeometry(layer, geometry, style);
        } else {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "RendererManager.js", "No renderer for RendererManager");
        }
    };

    /**************************************************************************************************************/

    /**
     * Remove a geometry from the renderer
     * @function removeGeometry
     * @memberof RendererManager.prototype
     * @param geometry
     * @param layer
     * @return {Boolean}
     */
    RendererManager.prototype.removeGeometry = function(geometry, layer) {
        var bucket = geometry._bucket;
        if (bucket && bucket.layer === layer) {
            /*if (layer.type === "OpenSearch") {
             if (bucket.renderer.removeGeometryOneLevel(geometry) !== "undefined") {
             bucket.renderer.removeGeometryOneLevel(geometry);
             return true;
             }
             }*/
            bucket.renderer.removeGeometry(geometry);
            return true;
        }
        return false;
    };

    /**************************************************************************************************************/

    /**
     * Add a geometry to a tile
     * @function addGeometryToTile
     * @memberof RendererManager.prototype
     * @param layer
     * @param geometry
     * @param style
     * @param {Tile} tile Tile
     */
    RendererManager.prototype.addGeometryToTile = function(
        layer,
        geometry,
        style,
        tile
    ) {
        var renderer = this.getRenderer(geometry, style);
        renderer.addGeometryToTile(layer, geometry, style, tile);
    };

    /**************************************************************************************************************/

    /**
     * Remove a geometry from a tile
     * @function removeGeometryFromTile
     * @memberof RendererManager.prototype
     * @param geometry
     * @param {Tile} tile Tile
     */
    RendererManager.prototype.removeGeometryFromTile = function(
        geometry,
        tile
    ) {
        var bucket = geometry._bucket;
        bucket.renderer.removeGeometryFromTile(geometry, tile, false);
    };

    /**************************************************************************************************************/

    /**
     * Function to sort with zIndex, then bucket
     */
    var renderableSort = function(r1, r2) {
        var zdiff = r1.bucket.style.zIndex - r2.bucket.style.zIndex;
        if (zdiff === 0) {
            return r1.bucket.id - r2.bucket.id;
        } else {
            return zdiff;
        }
    };

    /**************************************************************************************************************/

    /**
     * Render all
     * @function render
     * @memberof RendererManager.prototype
     */
    RendererManager.prototype.render = function() {
        // Add main renderables
        var i, j;
        for (j = 0; j < this.renderers.length; j++) {
            var buckets = this.renderers[j].buckets;
            for (i = 0; i < buckets.length; i++) {
                if (buckets[i].layer.isVisible() && buckets[i].mainRenderable) {
                    this.renderables.push(buckets[i].mainRenderable);
                }
            }
        }

        // Renderable sort
        this.renderables.sort(renderableSort);
        //var renderCall = 0;

        i = 0;
        while (i < this.renderables.length) {
            j = i + 1;
            var currentRenderer = this.renderables[i].bucket.renderer;
            while (
                j < this.renderables.length &&
                this.renderables[j].bucket.renderer === currentRenderer
            ) {
                j++;
            }

            //var minLevel =  (this.renderables[i].bucket.layer.minLevel) ? this.renderables[i].bucket.layer.minLevel : 0;
            //var processedLevel = this.renderables[i].bucket.renderer.tileManager.processedLevel;
            //if(minLevel <= processedLevel) {
            currentRenderer.render(this.renderables, i, j);
            //}
            //renderCall++;

            i = j;
        }

        //console.log( "# of render calls "  + renderCall );

        this.renderables.length = 0;
    };

    /**************************************************************************************************************/

    return RendererManager;
});
