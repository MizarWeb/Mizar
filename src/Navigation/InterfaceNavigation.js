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
 * navigation:changedDistance.<br/>
 * Called when the distance taget/camera has changed
 * @event Context#navigation:changedDistance
 * @type {float}
 */

/**
 * Camera view event.<br/>
 * Called when the view of the camera has changed (pan, rotate, ...)
 * @event Context#modifiedNavigation
 */

/**
 * Navigation is an interface that provides some methods used to control the camera.
 * <table border="1">
 *     <tr>
 *         <td><img src="../doc/images/nav_astro.png" width="200px"/></td>
 *         <td>{@link module:Navigation.AstroNavigation AstroNavigation}</td>
 *         <td>Provides a camera located at the center of the scene. The camera is inside the globe.
 *         It is used to view the sky</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/nav_planet.png" width="200px"/></td>
 *         <td>{@link module:Navigation.PlanetNavigation PlanetNavigation}</td>
 *         <td>Provides a camera, located outside the globe and looking at the globe. It is used to view a planet</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/nav_flat.png" width="200px"/></td>
 *         <td>{@link module:Navigation.FlatNavigation FlatNavigation}</td>
 *         <td>Provides a camera to navigate on a 2D map - Only available in a Planet context</td>
 *     </tr>
 * </table>
 * @see {@link module:Navigation the navigation package}
 * @interface
 */
function Navigation() {}

/**
 * Returns the {@link NAVIGATION type} of navigation.
 * @return {NAVIGATION} the type of navigation
 */
Navigation.prototype.getType = function () {};

/**
 * Returns the navigation's options at the initialisation.
 * @return {Object} Options
 */
Navigation.prototype.getOptions = function () {};

/**
 * Starts the navigation.
 */
Navigation.prototype.start = function () {};

/**
 * Stops the navigation.
 */
Navigation.prototype.stop = function () {};

/**
 * Stops the animations.
 */
Navigation.prototype.stopAnimations = function () {};

/**
 * Returns the field of view in decimal degree.
 * @return {float[]} the Field of view [fov along width, fov along height]
 */
Navigation.prototype.getFov = function () {};

/**
 * Moves up vector.
 * @param {float[]} vec - 3D Vector
 * @param {int} [duration = 1000] - Duration of animation in milliseconds
 */
Navigation.prototype.moveUpTo = function (vec, duration) {};

/**
 * Returns the center of the field of view.
 * @return {float[]} the center in decimal degree of the field of view [longitude, latitude]
 */
Navigation.prototype.getCenter = function () {};

/**
 * Rotates the camera.
 * @param {float} dx Window delta x
 * @param {float} dy Window delta y
 */
Navigation.prototype.rotate = function (dx, dy) {};

/**
 * Pans the camera to a direction up/down or left/right with the same distance from the object
 * @param {float} dx Window direction left/right
 * @param {float} dy Window direction up/down
 */
Navigation.prototype.pan = function (dx, dy) {};

/**
 * Applies zooming.
 * @param {float} delta Delta zoom
 * @param {float} scale Scale
 */
Navigation.prototype.zoom = function (delta, scale) {};

/**
 * Zooms to a 2D position (longitude, latitude).
 * @param {float[]} geoPos - spatial position in decimal degree [longitude, latitude]
 * @param {Object} options - options for the selected navigation
 * @fires Context#navigation:changedDistance
 */
Navigation.prototype.zoomTo = function (geoPos, options) {};

/**
 * Computes the view matrix
 * @memberof Navigation#
 * @fires Context#modifiedNavigation
 */
Navigation.prototype.computeViewMatrix = function () {};

/**
 * Basic animation from current view matrix to the given one
 * @param {Object[]} mat Destination view matrix (array of 16)
 * @param {int} fov Final zooming fov in degrees
 * @param {int} duration Duration of animation in milliseconds
 * @param {Function} callback Callback on the end of animation
 */
Navigation.prototype.toViewMatrix = function (mat, fov, duration, callback) {};

/**
 * Returns the rendering context.
 * @returns {RenderContext} the rendering context
 */
Navigation.prototype.getRenderContext = function () {};

/**
 * Sets the rendering context
 * @param {RenderContext} renderContext - the rendering context to set
 */
Navigation.prototype.setRenderContext = function (renderContext) {};

/**
 * Destroys the navigation
 */
Navigation.prototype.destroy = function () {};
