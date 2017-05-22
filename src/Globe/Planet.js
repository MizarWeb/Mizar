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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
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
define(['../Tiling/Tile',
        '../Utils/Event', '../Utils/Utils',
        './AbstractGlobe', '../Utils/Constants'],
    function (Tile,
              Event, Utils,
              AbstractGlobe, Constants) {

        /**
         * @name Planet
         * @class
         * Create a virtual planet in a HTML canvas element with its own coordinate reference system.
         * @augments AbstractGlobe
         * @param {AbstractGlobe.configuration} options - Planet configuration
         * @constructor
         * @memberOf module:Globe
         */
        var Planet = function (options) {
            AbstractGlobe.prototype.constructor.call(this, Constants.GLOBE.Planet, options);
            this.sky = false;
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractGlobe, Planet);

        /**************************************************************************************************************/

        /**
         * Sets the base imagery layer for the Planet.
         * @function setBaseImagery
         * @memberOf Planet#
         * @param {AbstractRasterLayer} layer the layer to use
         */
        Planet.prototype.setBaseImagery = function (layer) {
            if (this.baseImagery === layer) {
                return;
            }

            if (this.baseImagery) {
                this.removeLayer(this.baseImagery);
                this.baseImagery = null;
            }
            // Attach the layer to the globe
            if (layer) {
                layer._overlay = false;
                layer.background = true;
                this.addLayer(layer);
                this.baseImagery = layer;
                layer.setVisible(true);
            }
            // Modify the tile manager after the layer has been attached
            this.tileManager.setImageryProvider(layer);
        };

        /**
         * @function setBaseElevation
         * @memberOf Planet#
         */
        Planet.prototype.setBaseElevation = function (layer) {
            if (this.tileManager.elevationProvider) {
                this.removeLayer(this.tileManager.elevationProvider);
            }
            this.tileManager.setElevationProvider(layer);
            if (layer) {
                layer._overlay = false;
                this.addLayer(layer);
            }
        };

        /**
         * @function
         * @memberOf Planet#
         */        
        Planet.prototype.getElevation = function (lon, lat) {
            // Use imagery provider tiling if defined, otherwise use globe default one
            var tiling = this.tileManager.tiling;
            if (this.baseImagery) {
                tiling = this.baseImagery.tiling;
            }
            var levelZeroTile = this.tileManager.level0Tiles[tiling.lonlat2LevelZeroIndex(lon, lat)];
            if (Tile.State && levelZeroTile && levelZeroTile.state === Tile.State.LOADED) {
                return levelZeroTile.getElevation(lon, lat);
            } else {
                return 0.0;
            }
        };

        /**
         * @private
         * @function render
         * @memberOf AbstractGlobe#
         */
        Planet.prototype.render = function () {
            if (this.isEnabled()) {
                // Call pre-renderers (only in 3D mode, no atmosphere for 2D)
                if (!this.coordinateSystem.isFlat()) {
                    for (var i = 0; i < this.preRenderers.length; i++) {
                        this.preRenderers[i].preRender();
                    }
                }
                // Render tiles
                this.tileManager.render();
            }
        };
        

        /**************************************************************************************************************/

        return Planet;

    });
