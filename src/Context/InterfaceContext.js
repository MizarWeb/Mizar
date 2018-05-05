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
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/

/**
 * Camera view event.<br/>
 * Called when the view of the camera has changed (pan, rotate, ...)
 * @event Context#modifiedNavigation
 */

/**
 * Start navigation.<br/>
 * Called when navigation is started (by the user or through animation)
 * @event Context#startNavigation
 */

/**
 * End navigation.<br/>
 * Called when navigation is ended (by the user or through animation)
 * @event Context#endNavigation
 */

/**
 * startLoad.<br/>
 * Called when a layer start to be loaded
 * @event Context#startLoad
 * @type {Layer}
 */

/**
 * endLoad.<br/>
 * Called when layer end loading
 * @event Context#endLoad
 * @type {Layer}
 */

/**
 * backgroundLayer.<br/>
 * Called when a layer is loaded as background
 * @event Context#backgroundLayer
 * @type {Layer}
 */

/**
 * baseLayersError.<br/>
 *
 * @event Context#baseLayersError
 * @type {Layer} 
 */

/**
 * baseLayersReady.<br/>
 *
 * @event Context#baseLayersReady
 * @type {Layer|boolean}
 */

/**
 * startBackgroundLoad.<br/>
 * Called when background layers (imagery and/or elevation) start to be loaded
 * @event Context#startBackgroundLoad
 */

/**
 * endBackgroundLoad.<br/>
 * Called when background layers (imagery and/or elevation) end loading
 * @event Context#endBackgroundLoad
 */

/**
 * visibility:changed.<br/>
 * Called when the visibility of a layer changes
 * @event Layer#visibility:changed
 * @type {Layer}
 */

/**
 * opacity:changed.<br/>
 * Called when the opacity of a layer changes
 * @event Layer#opacity:changed
 * @type {Layer}
 */

/**
 * features:added.<br/>
 * Called when data coming from a GeoJSON are added
 * @event Context#features:added
 * @type {Object}
 * @property {Layer} layer
 * @property {Object} features  
 */

/**
 * layer:add.<br/>
 * Called when a layer is added
 * @event Context#layer:add
 * @see {@link Layer}
 */

/**
 * layer:remove.<br/>
 * Called when a layer is removed
 * @event Context#layer:remove
 * @see {@link Layer}
 */

/**
 * modifiedCrs.<br/>
 * Called when a CRS changes
 * @event Context#modifiedCrs
 * @type {ContextInterface}
 */

/**
 * Context is an interface to handle a context, which allows {@link Mizar}  :
 * <ul>
 *     <li>to handle a {@link Globe}</li>
 *     <li>to handle a {@link Crs coordinate reference system}</li>
 *     <li>to handle a {@link Animation}</li>
 *     <li>to handle the graphical components</li>
 * </ul>
 * Mizar owns different contexts:
 * <table border="1">
 *     <tr>
 *         <td><img src="../doc/images/nav_astro.png" width="200px"/></td>
 *         <td>{@link module:Context.SkyContext SkyContext}</td>
 *         <td>A context representing a sky</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/nav_planet.png" width="200px"/></td>
 *         <td>{@link module:Context.PlanetContext PlanetContext}</td>
 *         <td>A context representing a planet</td>
 *     </tr>
 *     <tr>
 *         <td>&nbsp;</td>
 *         <td>{@link module:Context.GroundContext GroundContext}</td>
 *         <td>A context representing the ground</td>
 *     </tr>
 * </table>
 * In addition to the two contexts, the client can define two sub-contexts :
 * <ul>
 *     <li>The planet without background</li>
 *     <li>The planet with the sky background</li>
 * </ul>
 * 
 * In addition to the classes, a {@link module:Context.ContextFactory factory} is available to help for creating
 * context. Once the context is created, the client can handle it by the use of its {@link Context interface}. 
 * @see {@link module:Context the context package}
 * @interface
 */
function Context() {
}


/***********************************************************************************
 *                        Methods to get Configuration                             *
 ***********************************************************************************/
/**
 * Returns the context Configuration
 * @return {Object} - see options.skyContext or options.planetContext for {@link {Mizar}}
 */
Context.prototype.getContextConfiguration = function () {
};

/**
 * Returns the mizar Configuration
 * @return {Object} - see options.configuration for {@link {Mizar}}
 */
Context.prototype.getMizarConfiguration = function () {
};


/***********************************************************************************
 *                        Methods for handling GUI                                 *
 ***********************************************************************************/
/**
 * Returns the position tracker.
 * @return {PositionTracker}
 */
Context.prototype.getPositionTracker = function () {
};

/**
 * Returns the elevation tracker.
 * @return {ElevationTracker}
 */
Context.prototype.getElevationTracker = function () {
};

/**
 * Sets the compass to visible or not.
 * @param {string} divName - Name of the compass div
 * @param {boolean} visible - Visible or not
 */
Context.prototype.setCompassVisible = function (divName, visible) {
};

/**
 * Sets the UI component visibility.
 * @param {string} componentId - Id of the component
 * @param {boolean} isVisible - Sets to True when the component must be visible
 */
Context.prototype.setComponentVisibility = function (componentId, isVisible) {
};

/**
 * Get the UI component visibility.
 * @param {string} componentId - Id of the component
 * @returns {boolean} - The visibility of the component
 */
Context.prototype.getComponentVisibility = function (componentId) {
};

/**
 * Shows components in the current state given by this.components.
 */
Context.prototype.showComponents = function() {
};

/**
 * Start Navigation and "Show" sky or planet components.
 */
Context.prototype.show = function () {
};

/**
 * Hide components
 * @param uiArray Array of components,which must not be hide.
 */
Context.prototype.hideComponents = function(uiArray) {
};

/**
 * Stops navigation and hide sky or planet components.
 */
Context.prototype.hide = function () {
};

/**
 * Shows the additional layers.
 */
Context.prototype.showAdditionalLayers = function () {
};

/**
 * Hides the additional layers.
 */
Context.prototype.hideAdditionalLayers = function () {
};

/**************************************************************************************
 *                      Methods for interacting with the map                          *
 **************************************************************************************/
/**
 * Returns the lon-lat from a pixel.
 * The pixel is expressed in the canvas frame, i.e. (0,0) corresponds to the lower-left corner of the pixel
 * @param    {int} x - the x pixel coordinate
 * @param    {int} y - the y pixel coordinate
 * @return   {float[]} an array of two numbers [lon,lat] or null if the pixel is not on the globe
 */
Context.prototype.getLonLatFromPixel = function (x, y) {
};


/**
 * Returns the pixel coordinates from longitude/latitude in decimal degree.
 * @param {float} longitude - lonitude in decimal degree in the current coordinate reference system
 * @param {float} latitude - latitude in decimal degree in the current coordinate reference system
 * @returns {int[]} pixels coordinates in the canvas
 */
Context.prototype.getPixelFromLonLat = function(longitude, latitude){
};

/**
 * Returns the elevation at a geo position.
 * @param {float} lon - the longitude in degree
 * @param {float} lat - the latitude in degree
 * @return {float} the elevation in meter at the position [lon,lat]
 */
Context.prototype.getElevation = function (lon, lat) {
};

/***************************************************************************************
 *                          Methods for handling layers                                *
 ***************************************************************************************/
/**
 * Returns the layers of a specific context.
 * @return {Layer[]} an array of layers
 */
Context.prototype.getLayers = function () {
};

/**
 * Returns the layer based on its ID.
 * Looks through each value in the layer list, returning the first one that matches the ID,
 * or undefined if no value passes the test.
 * The function returns as soon as it finds an acceptable element, and doesn't traverse the entire list.
 * @param {string} layerId - the layer identifier
 * @return {Layer|undefined} the layer
 */
Context.prototype.getLayerByID = function (layerId) {
};

/**
 * Returns the layer based on its name.
 * Looks through the list of layers and returns the first value that matches the name of the layer.
 * If no match is found, undefined will be returned.
 * @param {string} layerName - Name of the layer
 * @return {Layer|undefined} the layer
 */
Context.prototype.getLayerByName = function (layerName) {
};

/**
 * Sets the background survey.
 * @param {string} survey The name of the layer
 * @return {Layer|undefined} the layer which has been added to the background
 * @fires Context#backgroundLayer:change
 */
Context.prototype.setBackgroundLayer = function (survey) {
};

/**
 * Sets the background survey by layer ID.
 * @param {string} surveyID The name of the layer
 * @return {Layer|undefined} the layer which has been added to the background
 */
Context.prototype.setBackgroundLayerByID = function (surveyID) {
};

/**
 * Returns the additional layers.
 * @return {Layer[]} the additional layers by opposition to the background layers
 */
Context.prototype.getAdditionalLayers = function () {
};

/**
 * Registers a new layer to globe to be visualized on the globe.
 *
 * Adds a layer to the globe.
 * According to the attributes of the layer, the layer is either added as background or
 * as additional layer.
 * @param {Object} mizarDescription - See the base properties {@link AbstractLayer.configuration} and specific properties for specific layers
 * @return {Layer} the created layer
 * @throws {RangeError} Unable to create the layer
 * @fires Context#backgroundLayer:add
 * @fires Context#additionalLayer:add
 */
Context.prototype.addLayer = function (mizarDescription, callback, fallback) {
};

/**
 * Removes a layer based on its identifier
 * @param {string} layerID - the layer identifier
 * @return {Layer} the removed layer
 */
Context.prototype.removeLayer = function (layerID) {
};

/**
 * Removes all layers.
 */
Context.prototype.removeAllLayers = function () {
};


/***************************************************************************************
 *                  Methods for handling temporary draw on the map                     *
 ***************************************************************************************/
/**
 * Adds a temporary draw as a layer on the globe.<br/>
 * A temporary draw is used to create a subLayer or a simple draw. This added layer is not searchable and does not
 * subscribe to "visibility:changed" by configuration
 * @param {Layer} layer
 */
Context.prototype.addDraw = function(layer) {
};

/**
 * Removes the temporary draw on the globe.
 * @param {Layer} layer
 */
Context.prototype.removeDraw = function(layer) {
};

/****************************************************************************************
 *                  Methods for handling renderers                                      *
 ****************************************************************************************/
/**
 * Returns the rendering context.
 * @return {RenderContext} The rendering context
 */
Context.prototype.getRenderContext = function () {
};

/**
 * Renders the Planet.
 * The pixel is expressed in the canvas frame, i.e. (0,0) corresponds to the lower-left corner of the pixel
 * (private for now because it is automatically called in requestAnimationFrame)
 * @private
 */
Context.prototype.render = function () {
};

/**
 * Returns the mode of the globe
 * @return {CONTEXT} the mode of the globe
 */
Context.prototype.getMode = function () {
};

/**
 * Refreshes rendering, must be called when canvas size is modified.
 */
Context.prototype.refresh = function () {
};

/***************************************************************************************
 *                  Methods for handling coordinate systems                            *
 ***************************************************************************************/
/**
 * Sets the coordinate reference system.
 * @param cs - the coordinate reference system
 * @throws RangeError - "incompatible coordinate reference system with globe context (e.g : sky, planet)"
 * @fires Context#modifiedCrs
 */
Context.prototype.setCoordinateSystem = function (cs) {
};

/**
 * Returns the reference coordinate system.
 * @return {Crs} the coordinate reference system
 */
Context.prototype.getCoordinateSystem = function () {
};


/**************************************************************************************
 *                      Methods for handling navigation                               *
 **************************************************************************************/
/**
 * Returns the navigation.
 * @returns {Navigation} navigation
 */
Context.prototype.getNavigation = function () {
};

/**************************************************************************************
 *                      Methods for handling time dimension                           *
 **************************************************************************************/
/**
 * Returns the time dimension.
 * @returns {string|null} the time dimension
 */
Context.prototype.getTime = function() {
};

/**
 * Set the time dimension to all supported value.
 * @param {date} time
 */
Context.prototype.setTime = function(time) {
};

/**************************************************************************************
 *                      Methods for handling animations                               *
 **************************************************************************************/
/**
 * Adds an animation.
 * @param {Animation} anim - the animation to add
 */
Context.prototype.addAnimation = function (anim) {
};

/**
 * Removes an animation.
 * @param {Animation} anim - the animation to remove
 */
Context.prototype.removeAnimation = function (anim) {
};

/***************************************************************************************
 *                          Methods for handling tiles                                 *
 ***************************************************************************************/

/**
 * Returns the tile manager.
 * @returns {TileManager}
 */
Context.prototype.getTileManager = function () {
};



/******************************************************************************************
 *                          Methods for handling memory                                   *
 ******************************************************************************************/

/**
 * Cleans up every reference to gl objects and unloads all tiles of the current context.
 */
Context.prototype.dispose = function () {
};

/**
 * Destroys the globe of the current context.
 * The globe is destroyed by :
 * <ul>
 *     <li>cleaning up every reference to gl objects and unloads all tiles</li>
 *     <li>Removing the renderer from all the tiles</li>
 * </ul>
 */
Context.prototype.destroy = function () {
};

/**
 * Disables the globe of the current context.
 */
Context.prototype.disable = function () {
};

/**
 * Enables the globe of the current context.
 */
Context.prototype.enable = function () {
};