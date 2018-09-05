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
 * Animation is an interface to handle animations through a {@link Globe}.<br/>
 * Mizar is able to create different types of animation on a globe :
 * <ul>
 *     <li>{@link module:Animation.InertiaAnimation InertiaAnimation} : Animation simulating inertia for camera navigation</li>
 *     <li>{@link module:Animation.InterpolatedAnimation InterpolatedAnimation} : Generic animation to interpolate arbitrary values</li>
 *     <li>{@link module:Animation.PathAnimation PathAnimation} : Animation defined with a path</li>
 *     <li>{@link module:Animation.SegmentedAnimation SegmentedAnimation} : Animation defined with segments</li>
 * </ul>
 * @see {@link module:Animation the animation package}
 * @interface
 */
function Animation() {
}

/**
 * Returns the rendering context.
 * @return {RenderContext|null} the rendering context
 */
Animation.prototype.getRenderContext = function () {
};

/**
 * Returns the status of the animation.
 * @return {ANIMATION_STATUS}
 */
Animation.prototype.getStatus = function () {
};

/**
 * Starts the animation, records the start time in startTime member
 * and registers the animation.
 */
Animation.prototype.start = function () {
};

/**
 * Pauses the animation.
 */
Animation.prototype.pause = function () {
};

/**
 * Stops the animation and unregisters the animation.#
 */
Animation.prototype.stop = function () {
}
;
