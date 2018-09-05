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

define(["../Utils/Utils", "./AbstractAnimation", "../Utils/Numeric"], function(
    Utils,
    AbstractAnimation,
    Numeric
) {
    /**
     * Segmented animation configuration
     * @typedef  {Object} AbstractAnimation.segmented_configuration
     * @param {float} duration - duration of the animation
     * @param {Object} valueSetter - the function used to set the value.
     */

    /**
     * @name SegmentedAnimation
     * @class
     * SegmentedAnimation is an animation defined with segments.
     * Each segment has a [start,end] pair of 't' value and a [start,end] pair of
     * values that will be interpolated with the interpolator set on the segment.
     * When the animation runs, a t parameter is mapped to [0,1] according to
     * current time and animation duration.
     * The current segment is then looked up with that 't' value and used to interpolate
     * the animation's current value.
     * @augments AbstractAnimation
     * @param {AbstractAnimation.segmented_configuration} options - Configuration of the animation
     * @constructor
     * @memberOf module:Animation
     */
    var SegmentedAnimation = function(options) {
        // Call ancestor constructor
        AbstractAnimation.prototype.constructor.call(this);

        this.segments = [];
        this.duration = options.duration;
        this.valueSetter = options.valueSetter;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractAnimation, SegmentedAnimation);

    /**
     * Creates a segment.
     * @param start t value at which the segment will be the current segment
     * @param startValue value at t=start
     * @param end value at which the segment will be the current segment
     * @param endValue value at t=end
     * @param interpolator
     * @constructor
     * @todo Create a tutorial with a simple SegmentedAnimation on Mars
     */
    var Segment = function(start, startValue, end, endValue, interpolator) {
        this.start = start;
        this.startValue = startValue;
        this.end = end;
        this.endValue = endValue;
        this.interpolator = interpolator;
    };

    /**************************************************************************************************************/

    /**
     * Adds a new segment to the animation.<br/>
     * start, end are 't' values at which the segment will be the current segment<br/>
     * startValue, endValue are animation values at 't'=start and 't'=end<br/>
     * interpolator is the function that will be called to interpolate bewteen startValue and endValue.
     * @function addSegment
     * @memberOf SegmentedAnimation
     * @param {float} start - t value at which the segment will be the current segment
     * @param {float} startValue - value at t=start
     * @param {float} end - value at which the segment will be the current segment
     * @param {float} endValue - value at t=end
     * @param {Function} interpolator - interpolator function
     */
    SegmentedAnimation.prototype.addSegment = function(
        start,
        startValue,
        end,
        endValue,
        interpolator
    ) {
        var count = this.segments.length;
        var index = 0;
        while (index < count && this.segments[index].end <= start) {
            index++;
        }
        // Insert new segment at position 'index'
        this.segments.splice(
            index,
            0,
            new Segment(start, startValue, end, endValue, interpolator)
        );
    };

    /**
     * Animation update method
     * @function update
     * @memberOf SegmentedAnimation#
     * @param {float} now - Now
     */
    SegmentedAnimation.prototype.update = function(now) {
        var t = Numeric.map01(
            now,
            this.startTime,
            this.startTime + this.duration
        );
        if (t >= 1) {
            // Set last value
            var lastIndex = this.segments.length - 1;
            this.valueSetter(this.segments[lastIndex].endValue);
            this.stop();
        } else {
            // Find current segment
            var count = this.segments.length;
            var index = 0;
            while (index < count && this.segments[index].end < t) {
                index++;
            }
            index = Math.min(index, count - 1);

            // Remap t between segment bounds
            t = Numeric.map01(
                t,
                this.segments[index].start,
                this.segments[index].end
            );
            // Interpolate value
            var value = this.segments[index].interpolator(
                t,
                this.segments[index].startValue,
                this.segments[index].endValue
            );
            // Use value
            this.valueSetter(value);
        }
    };

    /**************************************************************************************************************/

    return SegmentedAnimation;
});
