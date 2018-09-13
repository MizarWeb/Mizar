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
    "../Utils/Utils",
    "../Utils/Constants",
    "./AbstractNavigation",
    "../Animation/SegmentedAnimation",
    "../Animation/AnimationFactory",
    "../Utils/Numeric",
    "../Renderer/Ray",
    "../Renderer/glMatrix"
], function(
    Utils,
    Constants,
    AbstractNavigation,
    SegmentedAnimation,
    AnimationFactory,
    Numeric,
    Ray
) {
    /**************************************************************************************************************/

    /**
     * Duration of animation in milliseconds to align the camera with the north.
     * @type {number}
     */
    const DEFAULT_DURATION_NORTH = 1000;

    /**
     * Default duration in millisecond for zoom feature.
     * @type {number}
     */
    const DEFAULT_DURATION_ZOOM = 5000;

    /**
     * Default min FOV.
     * @type {number}
     */
    const DEFAULT_MIN_FOV = 0.5;

    /**
     * Default max FOV.
     * @type {number}
     */
    const DEFAULT_MAX_FOV = 70;

    /**
     * Arbitrary middle fov value which determines if the animation needs two segments
     * @type {number}
     */
    const DEFAULT_MIDDLE_FOV = 25;

    /**
     * Final FOV.
     * @type {number}
     */
    const DEFAULT_FINAL_FOV = 2.0;

    /**
     * 3D position of the azimuth 0.
     * @type {number[]}
     */
    const DEFAULT_AZIMUTH_ZERO = [1.0, 0.0, 0.0];

    /**
     * Min heading value in decimal degree.
     * @type {number}
     */
    const MIN_HEADING = 0.0;

    /**
     * Max heading value in decimal degee.
     * @type {number}
     */
    const MAX_HEADING = 360.0;

    /**
     * Difference between two successive rotation (in degree) of the camera.
     * @type {number}
     */
    const DELTA_HEADING = 0.05;

    /**
     * Default heading in decimal degree.
     * @type {number}
     */
    const DEFAULT_HEADING = MIN_HEADING;

    /**
     * @name GroundNavigation
     * @class
     * When an <i>initFov</i> is provided out the range [<i>minFov</i>, <i>maxFov</i>], the range
     * [<i>minFov</i>, <i>maxFov</i>] is updated with the value of <i>initFov</i>.
     * @augments AstroNavigation
     * @param {GroundContext} ctx - ground context
     * @param {AbstractNavigation.astro_configuration} options - navigation configuration
     * @constructor
     * @memberof module:Navigation
     */
    var GroundNavigation = function(ctx, options) {
        AbstractNavigation.prototype.constructor.call(
            this,
            Constants.NAVIGATION.GroundNavigation,
            ctx,
            options
        );

        // Default values for fov (in degrees)
        this.minFov = this.options.minFov || DEFAULT_MIN_FOV;
        this.maxFov = this.options.maxFov || DEFAULT_MAX_FOV;

        // Initialize the navigation
        this.center3d = DEFAULT_AZIMUTH_ZERO;
        this.up = [0.0, 0.0, 1.0];
        this.heading = this.options.initTarget
            ? this.options.initTarget[0]
            : DEFAULT_HEADING;
        _setInitTarget.call(this, this.options.initTarget);
        _setInitFov.call(this, this.options.initFov);
        _setUpVector.call(this, this.options.up);

        // Update the view matrix now
        this.computeViewMatrix();
    };

    /**
     * Defines the position where the camera looks at.
     * @param {float[]|undefined} initTarget
     * @private
     */
    function _setInitTarget(initTarget) {
        if (initTarget) {
            this.ctx
                .getCoordinateSystem()
                .get3DFromWorld(initTarget, this.center3d);
        }
    }

    /**
     * Defines the field of view of the camera at initialisation.<br/>
     * When the initFov outside the range [minFov, maxFov], the range is extented to include the initFov
     * @param {float|undefined} initFov
     * @private
     */
    function _setInitFov(initFov) {
        if (initFov) {
            if (this.minFov > initFov) {
                this.minFov = initFov;
            } else if (this.maxFov < initFov) {
                this.maxFov = initFov;
            }
            this.renderContext.setFov(initFov);
            this._clampFov();
        }
    }

    /**
     * Defines the Up vector.
     * @param up
     * @private
     */
    function _setUpVector(up) {
        if (up) {
            this.up = up;
        }
    }

    /**
     * Init move up animation.
     * @param {AbstractNavigation} navigation - navigation object
     * @param {number} durationTime - duration of the animation in millisecond
     * @return {AbstractAnimation} animation
     * @private
     */
    function _initMoveUpAnimation(navigation, durationTime) {
        return AnimationFactory.create(Constants.ANIMATION.Segmented, {
            duration: durationTime,
            valueSetter: function(value) {
                var position3d = navigation.ctx
                    .getCoordinateSystem()
                    .get3DFromWorld([value[0], value[1]]);
                navigation.center3d[0] = position3d[0];
                navigation.center3d[1] = position3d[1];
                navigation.center3d[2] = position3d[2];
                navigation.computeViewMatrix();
            }
        });
    }

    /**
     * Init zoom animation
     * @param {AbstractNavigation} navigation - navigation object
     * @param {number} duration - duration of the animation in millisecond
     * @return {AbstractAnimation} animation
     * @private
     */
    function _initZoomAnimation(navigation, duration) {
        return AnimationFactory.create(Constants.ANIMATION.Segmented, {
            duration: duration,
            valueSetter: function(value) {
                var position3d = navigation.ctx
                    .getCoordinateSystem()
                    .get3DFromWorld([value[0], value[1]]);
                navigation.center3d[0] = position3d[0];
                navigation.center3d[1] = position3d[1];
                navigation.center3d[2] = position3d[2];
                navigation.ctx.getRenderContext().setFov(value[2]);
                navigation.computeViewMatrix();
            }
        });
    }

    /**
     * Adds two segments to the animation, which starts to startValue and stops to endValue
     * by crossing the middleFov at middle value of [startValue, endValue]
     * @param {AbstractAnimation} zoomToAnimation - animation where the segment is added
     * @param {float[]} startValue - Starting position (longitude, latitude, distance as vector length)
     * @param {float[]} endValue - Ending position (longitude, latitude, distance as vector length)
     * @param {float} middleFov - FOV
     * @private
     */
    function _addZoomOutThenZoomIn(
        zoomToAnimation,
        startValue,
        endValue,
        middleFov
    ) {
        // Compute the middle value
        var midValue = [
            startValue[0] * 0.5 + endValue[0] * 0.5,
            startValue[1] * 0.5 + endValue[1] * 0.5,
            middleFov
        ];

        // zoom out to max altitude
        zoomToAnimation.addSegment(0.0, startValue, 0.5, midValue, function(
            t,
            a,
            b
        ) {
            var pt = Numeric.easeInQuad(t);
            var dt = Numeric.easeOutQuad(t);
            return [
                Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                Numeric.lerp(dt, a[2], b[2])
            ]; // distance
        });

        // zoom in
        _addZoomIn.call(this, zoomToAnimation, midValue, endValue, 0.5);
    }

    /**
     * Adds a segment to the animation, which starts to startValue and stops to endValue
     * @param {AbstractAnimation} animation - animation where the segment is added
     * @param {float[]} startValue - Starting position (longitude, latitude, distance as vector length)
     * @param {float[]} endValue - Ending position (longitude, latitude, distance as vector length)
     * @param {float} [startParameter=0.0] - start parameter
     * @private
     */
    function _addZoomIn(animation, startValue, endValue, startParameter) {
        var parameter = startParameter ? startParameter : 0.0;
        animation.addSegment(parameter, startValue, 1.0, endValue, function(
            t,
            a,
            b
        ) {
            var pt = Numeric.easeOutQuad(t);
            var dt = Numeric.easeInQuad(t);
            return [
                Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                Numeric.lerp(dt, a[2], b[2])
            ]; // distance
        });
    }

    /**
     * Adds an event when the animation stops.
     * @param {AbstractAnimation} animation - animation where the event is added
     * @param {AbstractContext} ctx - context
     * @param {number} destDistance - Final zooming distance in meter
     * @param {Object} [options] - options
     * @param {Object} [options.callback] - Callback function to call when it is defined.
     * @private
     * @fires Navigation#navigation:changedDistance
     */
    function _addStop(animation, ctx, destDistance, options) {
        animation.onstop = function() {
            if (options && options.callback) {
                options.callback();
            }
            animation = null;
            ctx.publish(
                Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE,
                destDistance
            );
        };
    }

    /**
     * Computes parameters for animation
     * @param {AbstractContext} ctx - context
     * @param {Array.<float>} center3D - start position in 3D
     * @param {Array.<float>} geoPos - stop position
     * @param {float} startFov - start FOV
     * @param {float} destFov - stop FOV
     * @return {Array.<float>} Returns [startValue, endValue]
     * @private
     */
    function _computeParametersAnimation(
        ctx,
        center3D,
        geoPos,
        startFov,
        destFov
    ) {
        var geoStart = [];
        ctx.getCoordinateSystem().getWorldFrom3D(center3D, geoStart);
        var path = Numeric.shortestPath360(geoStart[0], geoPos[0]);
        var startValue = [path[0], geoStart[1], startFov];
        var endValue = [path[1], geoPos[1], destFov];
        return [startValue, endValue];
    }

    /**************************************************************************************************************/

    Utils.inherits(AbstractNavigation, GroundNavigation);

    /**************************************************************************************************************/

    /**
     * Returns the center of the navigation.
     * @function getCenter
     * @memberof GroundNavigation#
     * @return {float[]}
     */
    GroundNavigation.prototype.getCenter = function() {
        var center = AbstractNavigation.prototype.getCenter.call(this);
        if (center == null) {
            center = [];
            this.ctx
                .getCoordinateSystem()
                .getWorldFrom3D(this.center3d, center);
        }
        return center;
    };

    /**
     * ZoomTo a 3D position
     * @function zoomTo
     * @param {float[]} geoPos - target of the camera
     * @param {Object} options - options
     * @param {float} [options.fov = DEFAULT_FINAL_FOV] - field of view in degree
     * @param {int} [options.duration = DEFAULT_DURATION_ZOOM] - duration of the animation in milliseconds
     * @param {navigationCallback} [options.callback] - Called at the end of navigation
     * @memberof GroundNavigation#
     */
    GroundNavigation.prototype.zoomTo = function(geoPos, options) {
        var navigation = this;

        // default values
        var destFov = options && options.fov ? options.fov : DEFAULT_FINAL_FOV;
        var duration =
            options && options.duration
                ? options.duration
                : DEFAULT_DURATION_ZOOM;

        // Create a single animation to animate center3d and fov
        var parameters = _computeParametersAnimation.call(
            this,
            this.ctx,
            this.center3d,
            geoPos,
            this.renderContext.getFov(),
            destFov
        );
        var startValue = parameters[0];
        var endValue = parameters[1];

        var zoomToAnimation = _initZoomAnimation.call(
            this,
            navigation,
            duration
        );

        // End point which is out of frustum invokes two steps animation, one step otherwise
        var end3DValue = this.ctx.getCoordinateSystem().get3DFromWorld(geoPos);
        if (
            DEFAULT_MIDDLE_FOV > this.renderContext.getFov() &&
            this.renderContext
                .getWorldFrustum()
                .containsSphere(end3DValue, 0.005) < 0
        ) {
            // Two steps animation, 'rising' & 'falling'
            _addZoomOutThenZoomIn.call(
                this,
                zoomToAnimation,
                startValue,
                endValue,
                DEFAULT_MIDDLE_FOV
            );
        } else {
            // One step animation, 'falling' only
            _addZoomIn.call(this, zoomToAnimation, startValue, endValue);
        }

        _addStop.call(this, zoomToAnimation, this.ctx, destFov, options);

        this.ctx.addAnimation(zoomToAnimation);
        zoomToAnimation.start();
    };

    GroundNavigation.prototype.moveUpTo = function(vec, duration) {
        // Create a single animation to animate up
        var startValue = this.center3d;
        var endValue = DEFAULT_AZIMUTH_ZERO;
        var durationTime = duration || DEFAULT_DURATION_NORTH;

        var navigation = this;
        var moveUpToAnimation = _initMoveUpAnimation.call(
            this,
            navigation,
            durationTime
        );
        _addZoomIn.call(this, moveUpToAnimation, startValue, endValue);
        this.ctx.addAnimation(moveUpToAnimation);
        moveUpToAnimation.start();
    };

    /**
    * Compute the view matrix
    * @function computeViewMatrix
    * @memberof GroundNavigation#
    */
    GroundNavigation.prototype.computeViewMatrix = function() {
        var eye = [];
        vec3.normalize(this.center3d);

        var vm = this.renderContext.viewMatrix;

        mat4.lookAt([0.0, 0.0, 0.0], this.center3d, this.up, vm);

        var geo = [];
        this.ctx.getCoordinateSystem().getWorldFrom3D(this.center3d, geo);
        this.heading = geo[0];
        this.up = [0, 0, vm[9]];
        this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_MODIFIED);
        this.renderContext.requestFrame();
    };

    /**************************************************************************************************************/

    /**
         Event handler for mouse wheel
         @function zoom
         @param delta Delta zoom
         @memberof GroundNavigation#
         */
    GroundNavigation.prototype.zoom = function(delta, scale) {
        // TODO : improve zoom, using scale or delta ? We should use scale always
        if (scale) {
            this.renderContext.setFov(
                (this.renderContext.getFov() * 1) / scale
            );
        } else {
            // Arbitrary value for smooth zooming
            this.renderContext.setFov(
                this.renderContext.getFov() * (1 + delta * 0.1)
            );
        }

        this._clampFov();
        this.computeViewMatrix();
    };

    /**************************************************************************************************************/

    /**
         Pan the navigation by computing the difference between 3D centers
         @function pan
         @param dx Window delta x
         @param dy Window delta y
         @memberof GroundNavigation#
         */
    GroundNavigation.prototype.pan = function(dx, dy) {
        var x = this.renderContext.canvas.width / 2.0;
        var y = this.renderContext.canvas.height / 2.0;
        var ray = Ray.createFromPixel(this.renderContext, x - dx, y - dy);
        this.center3d = ray.computePoint(
            ray.sphereIntersect(
                [0, 0, 0],
                this.ctx
                    .getCoordinateSystem()
                    .getGeoide()
                    .getRadius()
            )
        );
        this.computeViewMatrix();
    };

    /**************************************************************************************************************/

    /**
         Rotate the navigation
         @function rotate
         @param dx Window delta x
         @param dy Window delta y
         @memberof GroundNavigation#
         */
    GroundNavigation.prototype.rotate = function(dx, dy) {
        var angle = dx * DELTA_HEADING;
        var coord = [];
        this.ctx.getCoordinateSystem().getWorldFrom3D(this.center3d, coord);
        this.heading += angle;
        coord[0] = this.heading;
        this.ctx.getCoordinateSystem().get3DFromWorld(coord, this.center3d);
        this.computeViewMatrix();
    };

    /**
         @function getHeading
         @memberof GroundNavigation#
         */
    GroundNavigation.prototype.getHeading = function() {
        return this.heading;
    };

    /**************************************************************************************************************/

    /**
     *    Clamping of fov
     */
    GroundNavigation.prototype._clampFov = function() {
        if (this.renderContext.getFov() > this.maxFov) {
            this.renderContext.setFov(this.maxFov);
        }
        if (this.renderContext.getFov() < this.minFov) {
            this.renderContext.setFov(this.minFov);
        }
    };

    /**************************************************************************************************************/

    return GroundNavigation;
});
