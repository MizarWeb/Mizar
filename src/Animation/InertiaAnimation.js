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

/**
 * Mizar is able to create different types of animation on a globe :
 * <ul>
 *     <li>{@link module:Animation.InertiaAnimation InertiaAnimation}: Animation simulating inertia for camera navigation</li>
 *     <li>{@link module:Animation.InterpolatedAnimation InterpolatedAnimation} : Generic animation to interpolate arbitrary values</li>
 *     <li>{@link module:Animation.PathAnimation PathAnimation} : Animation defined with a path</li>
 *     <li>{@link module:Animation.SegmentedAnimation SegmentedAnimation} : Animation defined with segments</li>
 * </ul>
 *
 * In addition to the classes, a {@link module:Animation.AnimationFactory factory} is available to help for creating
 * animation. Once the animation is created, the client can handle it by the use of its {@link Animation interface}.
 *
 * See {@tutorial getting-started-layer-extrude} for an example of sgmented animation.
 *
 * @module Animation
 * @implements {Animation}
 *
 */
define(["../Utils/Utils", "./AbstractAnimation"], function(
    Utils,
    AbstractAnimation
) {
    /**************************************************************************************************************/

    /**
     * @constant
     * @type {float}
     * @default
     */
    const EPSILON = 0.1;

    /**
     * Default panFactor value
     * @constant
     * @type {number}
     * @default
     */
    const PAN_FACTOR = 0.95;

    /**
     * Default rotateFactor value
     * @constant
     * @type {number}
     * @default
     */
    const ROTATE_FACTOR = 0.95;

    /**
     * Default zoomFactor value
     * @constant
     * @type {number}
     * @default
     */
    const ZOOM_FACTOR = 0.5;

    /**
     * Inertia animation configuration
     * @typedef {Object} AbstractAnimation.inertia_configuration
     * @property {Navigation} nav - Navigation object that applies the transformations.
     * @property {float} [panFactor=0.95] - Pan Factor which is included in [0..1]. - 1 is sensible to the pan
     * @property {float} [zoomFactor=0.50] - Zoom Factor which is included in [0..1]. - 1 is sensible to the zoom
     * @property {float} [rotateFactor=0.95] - Rotate Factor which is included in [0..1]. - 1 is sensible to the rotation
     */

    /**
     * @name InertiaAnimation
     * @class
     * Animation simulating inertia for camera's navigation.
     * Inertia is its tendency to retain its velocity: in the absence of external influence, the camera's motion
     * persists in an uniform rectilinear motion.
     * @augments AbstractAnimation
     * @param {AbstractAnimation.inertia_configuration} options Configuration of the Inertia animation
     * @constructor
     * @memberof module:Animation
     */
    var InertiaAnimation = function(options) {
        Utils.assert(
            options.nav != null,
            "nav is required in constructor",
            "InertiaAnimation.js"
        );
        AbstractAnimation.prototype.constructor.call(this);
        if (options) {
            this.panFactor = options.hasOwnProperty("panFactor")
                ? options.panFactor
                : PAN_FACTOR;
            this.rotateFactor = options.hasOwnProperty("rotateFactor")
                ? options.rotateFactor
                : ROTATE_FACTOR;
            this.zoomFactor = options.hasOwnProperty("zoomFactor")
                ? options.zoomFactor
                : ZOOM_FACTOR;
        }

        this.type = null;
        this.dx = 0;
        this.dy = 0;
        this.navigation = options.nav;
        this.renderContext = options.nav.getRenderContext();
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractAnimation, InertiaAnimation);

    /**************************************************************************************************************/

    /**
     * Updates the inertia.
     * @function update
     * @memberof InertiaAnimation#
     */
    InertiaAnimation.prototype.update = function(now) {
        var hasToStop = false;

        switch (this.type) {
        case "pan":
            this.navigation.pan(this.dx, this.dy);
            this.dx *= this.panFactor;
            this.dy *= this.panFactor;
            hasToStop =
                    Math.abs(this.dx) < EPSILON && Math.abs(this.dy) < EPSILON;
            break;
        case "rotate":
            this.navigation.rotate(this.dx, this.dy);
            this.dx *= this.rotateFactor;
            this.dy *= this.rotateFactor;
            hasToStop =
                    Math.abs(this.dx) < EPSILON && Math.abs(this.dy) < EPSILON;
            break;
        case "zoom":
            this.navigation.zoom(this.dx);
            this.dx *= this.zoomFactor;
            hasToStop = Math.abs(this.dx) < EPSILON;
            break;
        default:
        }
        this.navigation.getRenderContext().requestFrame();

        if (hasToStop) {
            this.stop();
        }
    };

    /**************************************************************************************************************/

    /**
     * Launches the animation.
     * @function launch
     * @param {string} type Type of inertia
     * <ul>
     *   <li>pan</li>
     *   <li>rotate</li>
     *   <li>zoom</li>
     * </ul>
     * @param {int} dx x of inertiaVector Vector of movement in window coordinates(for pan and rotate inertia)
     * @param {int} dy x of inertiaVector Vector of movement in window coordinates(for pan and rotate inertia)
     * @memberof InertiaAnimation#
     */
    InertiaAnimation.prototype.launch = function(type, dx, dy) {
        // Set first value
        this.type = type;
        this.dx = dx;
        this.dy = dy;

        this.start();
    };

    /**************************************************************************************************************/

    return InertiaAnimation;
});
