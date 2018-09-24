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

define(["../Utils/Utils", "./AbstractAnimation","../Utils/Numeric"], function(
    Utils,
    AbstractAnimation,
    Numeric
) {
    /**
     * Interpolated animation configuration
     * @typedef {Object} AbstractAnimation.interpolated_configuration
     * @property {float} startValue - Starting point of the interpolation.
     * @property {float} endValue - Ending point of the interpolation.
     * @property {float} duration - Duration of the animation in seconds
     * @property {Function} interpolationFunction-  Interpolation function
     * @property {Function} setFunction - Setter of the Interpolation function
     */

    /**
     * @name InterpolatedAnimation
     * @class
     * Generic animation to interpolate arbitrary values
     * The animation will interpolate between startValue and endValue, using the
     * interpolateFunction(t, startValue, endValue) (t [0,1])
     * The interpolated value is then given to the setFunction(value)
     * @augments AbstractAnimation
     * @param {AbstractAnimation.interpolated_configuration} options Configuration of the InterpolatedAnimation
     * @constructor
     * @memberof module:Animation
     * @todo Create a tutorial with a simple InterpolatedAnimation on Mars
     */
    var InterpolatedAnimation = function(options) {
        Utils.assert(
            typeof options.startValue === "number" &&
                typeof options.endValue === "number" &&
                typeof options.duration === "number" &&
                typeof options.interpolationFunction === "function" &&
                typeof options.setFunction === "function",
            "Missing required arguments in constructor",
            "InterpolatedAnimation.js"
        );
        // Call ancestor constructor
        AbstractAnimation.prototype.constructor.call(this);
        this.values = [[0.0, options.startValue], [1.0, options.endValue]];
        this.duration = options.duration;
        this.interpolationFunction = options.interpolationFunction;
        this.setFunction = options.setFunction;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractAnimation, InterpolatedAnimation);

    /**************************************************************************************************************/

    /**
     * Adds a new value to the animation.
     * @function addValue
     * @memberof InterpolatedAnimation#
     * @param {float} t Value at [0,1]
     * @param {float} value Value to reach
     */
    InterpolatedAnimation.prototype.addValue = function(t, value) {
        Utils.assert(
            t >= 0 && t <= 1,
            "t must be in [0,1] when using addValue method",
            "InterpolatedAnimation.js"
        );
        Utils.assert(
            typeof value === "number",
            "value must be a number when using addValue method",
            "InterpolatedAnimation.js"
        );
        var count = this.values.length;
        var upper = 0;
        while (upper < count && this.values[upper][0] < t) {
            upper++;
        }
        // Insert new value at position 'upper'
        this.values.splice(upper, 0, [t, value]);
    };

    /**
     * Starts the animation.
     * @function start
     * @memberof InterpolatedAnimation#
     */
    InterpolatedAnimation.prototype.start = function() {
        Animation.prototype.start.call(this);
        this.setFunction(this.startValue);
        //TODO this.startValue is a bug ?
    };

    /**
     * Stops the animation.
     * @function stop
     * @memberof InterpolatedAnimation
     */
    InterpolatedAnimation.prototype.stop = function() {
        Animation.prototype.stop.call(this);
        this.setFunction(this.endValue);
        //TODO this.endValue is a bug ?
    };

    /**
     * Updates the Animation.
     * @function udate
     * @memberof InterpolatedAnimation
     * @param {float} now Now
     */
    InterpolatedAnimation.prototype.update = function(now) {
        var t = Numeric.map01(
            now,
            this.startTime,
            this.startTime + this.duration
        );
        if (t >= 1) {
            this.stop();
            return;
        }

        // Find upper and lower bounds
        var count = this.values.length;
        var upper = 0;
        while (upper < count && this.values[upper][0] < t) {
            upper++;
        }
        upper = Math.min(upper, count - 1);
        var lower = Math.max(0, upper - 1);

        // Remap t between lower and upper bounds
        t = Numeric.map01(t, this.values[lower][0], this.values[upper][0]);
        // Interpolate value
        var value = this.interpolationFunction(
            t,
            this.values[lower][1],
            this.values[upper][1]
        );
        // Use interpolated value
        this.setFunction(value);
    };

    /**************************************************************************************************************/

    return InterpolatedAnimation;
});
