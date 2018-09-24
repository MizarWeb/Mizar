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
/**
 * layer:add.<br/>
 * Called when a layer is added in the globe
 * @event Context#layer:add
 * @type {Layer}
 */

/**
 * layer:remove.<br/>
 * Called when a layer is removed from the globe
 * @event Context#layer:removed
 * @type {Layer}
 */

/**
 * layer:remove.<br/>
 * Called when the a layer has replaced another layer as background
 * @event Context#backgroundLayer:changed
 * @type {Layer}
 */

/**
 * Globe is an interface to handle all WebGL objects through a {@link Context}. Globe is able :
 * <ul>
 *     <li>to draw layers,</li>
 *     <li>to render layers,</li>
 *     <li>to dispose layers and WebGL objects,</li>
 *     <li>to transform (longitude,latitude) from/to pixel coordinates</li>
 * </ul>
 *
 * The pixel coordinates are expressed in the canvas frame, i.e. (0,0) corresponds to the lower-left corner of the pixel.
 * The geo-position coordinates(longitude,latitude) are expressed in decimal degree in their defined coordinate reference
 * system.
 *
 * In Mizar, it exists two kinds of globes :
 * <table border="1">
 *     <tr>
 *         <td><img src="../doc/images/nav_astro.png" width="200px"/></td>
 *         <td>{@link module:Globe.Sky Sky}</td>
 *         <td>Provides two grids to handle data according to their coordinate reference system : Equatorial, Galactic.
 *         Then the globe renders the two grids in the same time.</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/nav_planet.png" width="200px"/></td>
 *         <td>{@link module:Globe.Planet Planet}</td>
 *         <td>Provides only one grid to handle data in the reference frame of the planet</td>
 *     </tr>
 * </table>
 *
 * In addition to the classes, a {@link module:Globe.GlobeFactory factory} is available to help for creating
 * globe. Once the globe is created, the client can handle it by the use of its {@link Globe interface}.
 * @see {@link module:Globe the globe package}
 * @interface
 */
function Globe() {}

/**
 * Returns the type of globe.
 * @returns {GLOBE} type of globe
 */
Globe.prototype.getType = function() {};

/**
 * Checks if the globe is a {@link module:Globe.Sky sky}.
 * @returns {boolean} true when the globe is a sky otherwise false
 */
Globe.prototype.isSky = function() {};

/**
 * Checks if the globe is a {@link module:Globe.Planet planet}.
 * @returns {boolean} true when the globe is a planet otherwise false
 */
Globe.prototype.isPlanet = function() {};

/**
 * Returns true when a layer is already defined as background other false.
 * @returns true when a layer is already defined as background other false
 */
Globe.prototype.hasDefinedBackground = function() {};

/**
 * Registers the layer as a background raster and attach it to the globe.<br/>
 * When a raster layer is already set, this layer is replaced by the new one.
 * @param {AbstractRasterLayer} layer - raster layer to use
 * @fires Context#backgroundLayer:changed
 * @fires Context#backgroundLayer:added
 * @fires Context#layer:added
 * @throws {Error} layer must be a Layer object
 */
Globe.prototype.setBaseImagery = function(layer) {};

/**
 * Returns the background raster as a layer.
 * @return {AbstractRasterLayer} the raster layer
 */
Globe.prototype.getBaseImagery = function() {};

/**
 * Registers the elevation layer and attach it to the globe.<br/>
 * When an elevation layer is already set, this layer is replaced by the new one
 * @returns {WMSElevationLayer|WCSElevationLayer} the used layer
 * @fires Context#layer:removed
 */
Globe.prototype.setBaseElevation = function(layer) {};

/**
 * Returns the elevation layer.
 * @returns {WMSElevationLayer|WCSElevationLayer|null} the used layer
 */
Globe.prototype.getBaseElevation = function() {};

/**
 * Registers a new layer to globe to be visualized on the globe.<br/>
 *
 * When the layer is added, an internal ID is generated to the layer based on an autoincrement value.
 * Once the layer is added, the globe is rendered. According to the visible attribute of the layer,
 * the layer is automatically shown on the globe.
 *
 * The layer can be mainly a raster or a set of vectors.<br/>
 * In the vector case, the data is located in the <i>url</i> attribute of the layer object. In addition to the URL,
 * a <i>callback</i> attribute can be applied to the data.
 *
 *
 * @param {Layer} layer the layer to add
 * @fires Context#backgroundLayer:added
 * @fires Context#layer:added
 * @throws {Error} layer must be a {@link Layer} object
 */
Globe.prototype.addLayer = function(layer) {};

/**
 * Removes a layer.
 *
 * The layer is set to unvisible. Then it is detached to the globe.
 * The globe is rendered to remove the layer from the globe.
 *
 * @param {Layer} layer - the layer to remove
 * @fires Context#layer:removed
 * @throws {Error} layer must be a {@link Layer} object
 */
Globe.prototype.removeLayer = function(layer) {};

/**
 * Adds an animation to be played later on.
 * @param {Animation} anim - the animation to add
 * @throws {Error} anim  must be a {@link Animation} object
 */
Globe.prototype.addAnimation = function(anim) {};

/**
 * Removes an animation.
 * @param {Animation} anim - the animation to remove
 * @throws {Error} anim must be a {@link Animation} object
 */
Globe.prototype.removeAnimation = function(anim) {};

/**
 * Returns the elevation in meters at a geo position at the defined coordinate reference system.
 * @param {number} lon - the longitude in degree
 * @param {number} lat - the latitude in degree
 * @return {number} the elevation in meter at the position [lon,lat]
 * @throws {Error} lon lat must be numbers
 */
Globe.prototype.getElevation = function(lon, lat) {};

/**
 * Returns the viewport geo bound.
 * @param transformCallback Callback transforming the frustum/globe intersection coordinates if needed
 * @return {GeoBound} the geo bound of the viewport
 */
Globe.prototype.getViewportGeoBound = function(transformCallback) {};

/**
 * Returns the geo position [longitude, latitude] in degree from a pixel.<br/>
 * The pixel is expressed in the canvas frame, i.e. (0,0) corresponds to the lower-left corner of the pixel.
 * The geo position is expressed in the defined coordinate reference system.
 * @param {int} x the pixel x coordinate
 * @param {int} y the pixel y coordinate
 * @return {float[]|null} an array of two numbers [lon,lat] or null if the pixel is not on the globe
 * @throws {Error} x y must be numbers
 */
Globe.prototype.getLonLatFromPixel = function(x, y) {};

/**
 * Returns the pixel coordinates from geo position [longitude, latitude] in degree in the defined coordinate reference
 * system.<br/>
 * The pixel is expressed in the canvas frame, i.e. (0,0) corresponds to the lower-left corner of the pixel
 * @param {float} lon - the longitude in decimal degree expressed in the current CRS
 * @param {float} lat - the latitude in decimal degree expressed in the current CRS
 * @return {int[]|null} an array of two numbers [x,y] or null if the pixel is not on the globe
 * @throws {Error} lon lat must be numbers
 */
Globe.prototype.getPixelFromLonLat = function(lon, lat) {};

/**
 * Sets the coordinate reference system
 * @param {Crs} coordinateSystem - the coordinate reference system
 * @throws {Error} coordinateSystem must be a {@link Crs} object
 */
Globe.prototype.setCoordinateSystem = function(coordinateSystem) {};

/**
 * Returns the coordinate reference system.
 * @return {Crs} the coordinate reference system
 */
Globe.prototype.getCoordinateSystem = function() {};

/**
 * Computes the position that intersects between a ray and a sphere or a ray and a plane (according to the CRS).
 * @param {Ray} ray
 * @returns {float[]|null} the position
 */
Globe.prototype.computeIntersection = function(ray) {};

/**
 * Displays some rendering statistics.
 * @return {string} the statistics
 */
Globe.prototype.getRenderStats = function() {};

/**
 * Returns the rendering context.
 * @return {RenderContext} the rendering context
 */
Globe.prototype.getRenderContext = function() {};

/**
 * Sets the rendering context.
 * @param {RenderContext} context - the rendering context
 * @throws {Error} context must be a {@link Context} object
 */
Globe.prototype.setRenderContext = function(context) {};

/**
 * Returns the tile manager.
 * @return {TileManager} Tile manager
 */
Globe.prototype.getTileManager = function() {};

/**
 * Returns the renderer manager.
 * The render manager contains the full list of renders.
 * @return {RendererManager} renderer manager
 */
Globe.prototype.getRendererManager = function() {};

/**
 * Renders the globe.
 * The pixel is expressed in the canvas frame, i.e. (0,0) corresponds to the lower-left corner of the pixel
 * (private for now because it is automatically called in requestAnimationFrame)
 * @fires Context#startLoad
 * @fires Context#endLoad
 * @fires Context#baseLayersReady
 * @fires Context#baseLayersError
 * @fires Context#startBackgroundLoad
 * @fires Context#endBackgroundLoad
 */
Globe.prototype.render = function() {};

/**
 * Cleans up every reference to gl objects and unloads all tiles
 */
Globe.prototype.dispose = function() {};

/**
 * Destroys the globe.
 * The globe is destroyed by :
 * <ul>
 *     <li>cleaning up every reference to gl objects and unloads all tiles</li>
 *     <li>Removing the renderer from all the tiles</li>
 * </ul>
 */
Globe.prototype.destroy = function() {};

/**
 * Refreshes rendering, must be called when canvas size is modified.
 */
Globe.prototype.refresh = function() {};

/**
 * Checks if the globe rendering is enabled.
 * @return {boolean} true when the globe rendering is enabled otherwise false
 */
Globe.prototype.isEnabled = function() {};

/**
 * Enables the globe.
 *
 * This is used to enable the sky when we use the sphere to map the data. In this way,
 * we see the globe and the sky in the same time.
 */
Globe.prototype.enable = function() {};

/**
 * Disables the globe.
 *
 * This method is only overloaded by the sky to make disable the sky when the planet
 * is projected on a map.
 */
Globe.prototype.disable = function() {};

/**
 * TODO : text
 */
Globe.prototype.hasMesh = function() {};
