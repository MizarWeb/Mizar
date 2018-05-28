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

define(['../Utils/Utils', '../Utils/Constants', './AbstractNavigation', '../Animation/AnimationFactory', '../Utils/Numeric', '../Renderer/Ray', '../Renderer/glMatrix'],
    function (Utils, Constants, AbstractNavigation, AnimationFactory, Numeric, Ray) {

        /**
         * Flat navigation configuration
         * @typedef {AbstractNavigation.configuration} AbstractNavigation.flat_configuration
         * @property {float[]} [initTarget = [0, 0, 5.0 * RADIUS_PLANET]] - Target in decimal degree (longitude, latitude, distance in meter)
         * at initialisation. distance in meter is optional.
         * @property {float} [minDistance = DEFAULT_MIN_DISTANCE] - The minimum distance in meter from the surface of the globe
         * or options.initTarget[2] when this one is inferior to options.minDistance
         * @property {float} [maxDistance = 5.0 * RADIUS_PLANET] - The maximum distance in meter or
         * options.initTarget[2] when this one is superior to options.maxDistance
         */

        /**
         * Duration of animation in milliseconds to align the camera with the north.
         * @type {number}
         */
        const DEFAULT_DURATION_NORTH = 1000.0;

        /**
         * Min heading value in decimal degree.
         * @type {number}
         */
        const MIN_HEADING = 0.0;

        /**
         * Max heading value in decimal degree.
         * @type {number}
         */
        const MAX_HEADING = 360.0;

        /**
         * Difference between two successive rotation (in degree) of the camera.
         * @type {number}
         */
        const DELTA_HEADING = 0.05;

        /**
         * Rotation axis according to the center of the map (0,0).
         * Long, lat, distance as vector length
         * @type {number[]}
         */
        const ROTATION_AXIS = [0.0, 0.0, 1.0];

        /**
         * 3D cartesian of planet center.
         * Long lat distance as vector ength.
         * @type {number[]}
         */
        const CENTER = [0.0, 0.0, 0.0];

        /**
         * Default min distance in meter.
         * @type {number}
         */
        const DEFAULT_MIN_DISTANCE = 60000;

        /**
         * Default duration in millisecond for zoom feature.
         * @type {number}
         */
        const DEFAULT_DURATION_ZOOM = 5000;

        /**
         * @name FlatNavigation
         * @class
         * <table border="0">
         *     <tr>
         *         <td><img src="../doc/images/nav_flat.png" width="200px"/></td>
         *         <td>Provides a camera to navigate on a 2D map - Only available in a Planet context. A 2D navigation
         *         provides a navigation for which there is no tilt and no roll <img src="https://developers.google.com/kml/documentation/kmlreference"/></td>
         *     </tr>
         * </table>
         * @augments AbstractNavigation
         * @param {PlanetContext} ctx - Planet context
         * @param {AbstractNavigation.flat_configuration} options - Flat navigation configuration
         * @constructor
         * @memberOf module:Navigation
         */
        var FlatNavigation = function (ctx, options) {

            AbstractNavigation.prototype.constructor.call(this, Constants.NAVIGATION.FlatNavigation, ctx, options);

            // Default values for min and max distance (in meter)
            this.minDistance = (this.options.minDistance) || DEFAULT_MIN_DISTANCE;
            this.maxDistance = (this.options.maxDistance) || 5.0 * this.ctx.getCoordinateSystem().getGeoide().getRadius() / this.ctx.getCoordinateSystem().getGeoide().getHeightScale();

            // Scale min and max distance from meter to internal ratio
            this.minDistance *= this.ctx.getCoordinateSystem().getGeoide().getHeightScale();
            this.maxDistance *= this.ctx.getCoordinateSystem().getGeoide().getHeightScale();

            // Initialize the navigation
            this.center = CENTER;
            this.distance = this.maxDistance;
            this.heading = 0;
            this.up = [0.0, 1.0, 0.0];
            _setInitTarget.call(this, this.options.initTarget);

            this.computeViewMatrix();
        };

        /**
         * Defines the position where the camera looks at and the distance of the camera from the planet's surface.
         * @param {float[]|undefined} initTarget as [longitude, latitude[, distance in meter]]
         * @private
         */
        function _setInitTarget(initTarget) {
            if (initTarget) {
                var pos = this.ctx.getCoordinateSystem().get3DFromWorld(initTarget);
                this.center[0] = pos[0];
                this.center[1] = pos[1];
                this.distance = (initTarget.length === 3) ? initTarget[2] * this.ctx.getCoordinateSystem().getGeoide().getHeightScale() : this.distance;
                if (this.distance < this.minDistance) {
                    this.minDistance = this.distance;
                }
                if (this.distance > this.maxDistance) {
                    this.maxDistance = this.distance;
                }
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
            return AnimationFactory.create(
                Constants.ANIMATION.Segmented,
                {
                    "duration": durationTime,
                    "valueSetter": function (value) {
                        var angle = value - navigation.heading;
                        navigation.heading = value;
                        var rot = quat4.fromAngleAxis(Numeric.toRadian(angle), ROTATION_AXIS);
                        quat4.multiplyVec3(rot, navigation.up);
                        navigation.computeViewMatrix();
                    }
                }
            );
        }

        /**
         * Rotates from startHeading to North
         * @param {AbstractAnimation} animation - animation on which the rotation is applied
         * @param {float} startHeading - start heading
         * @private
         */
        function _rotateAnimationToNorth(animation, startHeading) {
            var endHeading;
            if (startHeading > 180) {
                endHeading = MAX_HEADING;
            } else {
                endHeading = MIN_HEADING;
            }
            animation.addSegment(
                0.0, startHeading,
                1.0, endHeading,
                function (t, a, b) {
                    return Numeric.lerp(t, a, b);
                }
            );
        }

        /**
         * Init zoom animation
         * @param {AbstractNavigation} navigation - navigation object
         * @param {number} duration - duration of the animation in millisecond
         * @return {AbstractAnimation} animation
         * @private
         */
        function _initZoomAnimation(navigation, duration) {
            return AnimationFactory.create(
                Constants.ANIMATION.Segmented,
                {
                    "duration": duration,
                    "valueSetter": function (value) {
                        navigation.center[0] = value[0];
                        navigation.center[1] = value[1];
                        navigation.distance = value[2];
                        navigation.computeViewMatrix();
                    }
                }
            );
        }

        /**
         * Adds two segments to the animation, which starts to startValue and stops to endValue
         * by crossing the maxAltitude at middle value of [startValue, endValue]
         * @param {AbstractAnimation} zoomToAnimation - animation where the segment is added
         * @param {float[]} startValue - Starting position (longitude, latitude, distance as vector length)
         * @param {float[]} endValue - Ending position (longitude, latitude, distance as vector length)
         * @param {float} maxAltitude - altitude (as vector length) where the camera FOV contains the center and the target position
         * @private
         */
        function _addZoomOutThenZoomIn(zoomToAnimation, startValue, endValue, maxAltitude) {
            // Compute the middle value
            var midValue = [startValue[0] * 0.5 + endValue[0] * 0.5,
                startValue[1] * 0.5 + endValue[1] * 0.5,
                maxAltitude];

            // zoom out to max altitude
            zoomToAnimation.addSegment(
                0.0, startValue,
                0.5, midValue,
                function (t, a, b) {
                    var pt = Numeric.easeInQuad(t);
                    var dt = Numeric.easeOutQuad(t);
                    return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                        Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                        Numeric.lerp(dt, a[2], b[2])]; // distance
                }
            );

            // zoom in
            _addZoomIn.call(this, zoomToAnimation, midValue, endValue, 0.5);
        }

        /**
         * Adds a segment to the animation, which starts to startValue and stops to endValue
         * @param {AbstractAnimation} zoomToAnimation - animation where the segment is added
         * @param {float[]} startValue - Starting position (longitude, latitude, distance as vector length)
         * @param {float[]} endValue - Ending position (longitude, latitude, distance as vector length)
         * @param {float} [startParameter=0.0] - start parameter
         * @private
         */
        function _addZoomIn(zoomToAnimation, startValue, endValue, startParameter) {
            var parameter = startParameter ? startParameter : 0.0;
            zoomToAnimation.addSegment(
                parameter, startValue,
                1.0, endValue,
                function (t, a, b) {
                    var pt = Numeric.easeOutQuad(t);
                    var dt = Numeric.easeInQuad(t);
                    return [Numeric.lerp(pt, a[0], b[0]),  // geoPos.long
                        Numeric.lerp(pt, a[1], b[1]),  // geoPos.lat
                        Numeric.lerp(dt, a[2], b[2])];  // distance
                }
            );
        }

        /**
         * Adds an event when the animation stops.
         * @param {AbstractAnimation} zoomToAnimation - animation where the event is added
         * @param {AbstractContext} ctx - context
         * @param {number} destDistance - Final zooming distance in meter
         * @param {Object} [options] - options
         * @param {Object} [options.callback] - Callback function to call when it is defined.
         * @private
         */
        function _addStop(zoomToAnimation, ctx, destDistance, options) {
            zoomToAnimation.onstop = function () {
                if (options && options.callback) {
                    options.callback();
                }
                zoomToAnimation = null;
                ctx.publish(Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE, destDistance);
            };
        }

        /**
         * Computes altitude (as vector length) for which the fov see the distance between worldStart-worldEnd
         * @param {AbstractContext} ctx - context
         * @param {float[]} worldStart - Starting position as [longitude, latitude, distance]
         * @param {float[]} worldEnd - Ending position as [longitude, latitude, distance]
         * @return {number} the altitude for which the fov see the distance worldStart-worldEnd
         * @private
         */
        function _computeMaxAltitudeForZoomAnimation(ctx, worldStart, worldEnd) {
            var vec = vec3.subtract(worldStart, worldEnd);
            var len = vec3.length(vec);
            var canvas = ctx.getRenderContext().getCanvas();
            var fov = ctx.getRenderContext().getFov();
            var minFov = Math.min(Numeric.toRadian(fov), Numeric.toRadian(fov * canvas.width / canvas.height));
            return (len / 2.0) / Math.tan(minFov / 2.0);
        }


        /**************************************************************************************************************/

        Utils.inherits(AbstractNavigation, FlatNavigation);

        /**************************************************************************************************************/

        /**
         * @function getCenter
         * @memberOf FlatNavigation#
         * @return {float[]} Returns the central position of the camera
         */
        FlatNavigation.prototype.getCenter = function () {
            var center = AbstractNavigation.prototype.getCenter.call(this);
            if (center == null) {
                center = this.center;
            }
            return center;
        };

        /**
         * Saves the current navigation state.
         * @function save
         * @memberOf FlatNavigation#
         * @return {{center: *, distance: *, up: *}} a JS object containing the navigation state
         */
        FlatNavigation.prototype.save = function () {
            return {
                center: this.center,
                distance: this.distance,
                up: this.up
            };
        };

        /**
         * Restores the navigation state.
         * @function restore
         * @memberOf FlatNavigation#
         * @param {Object} state a JS object containing the navigation state
         * @param {float[]} state.center - Center of the camera's field of view in decimal degree as [longitude, latitude]
         * @param {int} state.distance - Distance in meters from the surface of the globe to the camera
         */
        FlatNavigation.prototype.restore = function (state) {
            this.center = state.center;
            this.distance = state.distance;
            this.up = state.up;
            this.computeViewMatrix();
        };

        /**
         * Computes the view matrix.
         * @function computeViewMatrix
         * @memberOf FlatNavigation#
         */
        FlatNavigation.prototype.computeViewMatrix = function () {
            var vm = this.renderContext.getViewMatrix();
            var eye = [this.center[0], this.center[1], this.distance];
            mat4.lookAt(eye, this.center, this.up, vm);
            this.up = [vm[1], vm[5], vm[9]];
            this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_MODIFIED);
            this.renderContext.requestFrame();
        };

        /**
         * Zooms to a geographic position by creating an animation.
         *
         * @function zoomTo
         * @memberOf FlatNavigation#
         * @param {float[]} geoPos Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
         * @param {Object} options - options
         * @param {int} [options.distance] - Final zooming distance in meters. By default, the distance does not change
         * @param {int} [options.duration = DEFAULT_DURATION_ZOOM] -  Duration of animation in milliseconds
         * @param {navigationCallback} options.callback - Callback at the end of animation
         */
        FlatNavigation.prototype.zoomTo = function (geoPos, options) {
            this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE);
            var navigation = this;
            var duration = (options && options.duration) ? options.duration : DEFAULT_DURATION_ZOOM;
            var zoomToAnimation = _initZoomAnimation.call(this, navigation, duration);

            var destDistance = (options && options.distance) ? options.distance : this.distance / this.ctx.getCoordinateSystem().getGeoide().getHeightScale();
            var pos = this.ctx.getCoordinateSystem().get3DFromWorld(geoPos);
            var startValue = [this.center[0], this.center[1], this.distance];
            var endValue = [pos[0], pos[1], destDistance * this.ctx.getCoordinateSystem().getGeoide().getHeightScale()];

            var maxAltitude = _computeMaxAltitudeForZoomAnimation.call(this, this.ctx, this.center, pos);

            if (maxAltitude > this.distance) {
                _addZoomOutThenZoomIn.call(this, zoomToAnimation, startValue, endValue, maxAltitude);
            }
            else {
                _addZoomIn.call(this, zoomToAnimation, startValue, endValue);
            }

            _addStop.call(this, zoomToAnimation, this.ctx, destDistance, options);

            this.ctx.addAnimation(zoomToAnimation);
            zoomToAnimation.start();
        };

        /**
         * Zoom to the current observed location
         * @function zoom
         * @memberOf FlatNavigation#
         * @param {float} delta Delta zoom
         * @param {float} scale Scale
         */
        FlatNavigation.prototype.zoom = function (delta, scale) {
            var previousDistance = this.distance;

            // TODO : improve zoom, using scale or delta ? We should use scale always
            if (scale) {
                this.distance *= scale;
            } else {
                this.distance *= (1 + delta * 0.1);
            }

            if (this.distance > this.maxDistance) {
                this.distance = previousDistance;
            }
            if (this.distance < this.minDistance) {
                this.distance = previousDistance;
            }

            //TODO : add the collision algorithm because of the elevation

            this.computeViewMatrix();
            this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE, this.getDistance());

        };

        /**
         * Pans the camera
         * @function pan
         * @memberOf FlatNavigation#
         * @param {int} dx Window delta x
         * @param {int} dy Window delta y
         */
        FlatNavigation.prototype.pan = function (dx, dy) {
            var x = this.renderContext.getCanvas().width / 2.0;
            var y = this.renderContext.getCanvas().height / 2.0;

            // Get the most-left point
            var ptLeft = this.ctx.getLonLatFromPixel(0, y);
            if ((ptLeft === null) && (dx > 0)) {
                dx = 0;
            }

            // Get the most-right point
            var ptRight = this.ctx.getLonLatFromPixel(this.renderContext.getCanvas().width, y);
            if ((ptRight === null) && (dx < 0)) {
                dx = 0;
            }

            // Get the most-top point
            var ptTop = this.ctx.getLonLatFromPixel(x, 0);
            if ((ptTop === null) && (dy > 0)) {
                dy = 0;
            }

            // Get the most-bottom point
            var ptBottom = this.ctx.getLonLatFromPixel(x, this.renderContext.getCanvas().height);
            if ((ptBottom === null) && (dy < 0)) {
                dy = 0;
            }

            if ((dx === 0) && (dy === 0)) {
                return;
            }

            var ray = Ray.createFromPixel(this.renderContext, x - dx, y - dy);

            this.center = ray.computePoint(ray.planeIntersect(CENTER, ROTATION_AXIS));

            this.computeViewMatrix();
        };


        /**
         * Camera heading.
         * @function rotate
         * @memberOf FlatNavigation#
         * @param {int} dx Window delta x
         */
        FlatNavigation.prototype.rotate = function (dx) {
            // Constant tiny angle
            var angle = dx * DELTA_HEADING;
            this.heading += angle;
            var rot = quat4.fromAngleAxis(Numeric.toRadian(angle), ROTATION_AXIS);
            quat4.multiplyVec3(rot, this.up);
            this.computeViewMatrix();
        };

        /**
         * Returns the distance in meters.
         * @function getDistance
         * @memberOf FlatNavigation#
         * @return {float} the distance in meters from the surface of the globe
         */
        FlatNavigation.prototype.getDistance = function () {
            return this.distance * this.ctx.getCoordinateSystem().getGeoide().getRealPlanetRadius();
        };

        /**
         * Returns the heading of the camera.
         * @function getHeading
         * @memberOf FlatNavigation#
         * @return {number} the heading angle between [0, 360]
         */
        FlatNavigation.prototype.getHeading = function () {
            return ((this.heading % MAX_HEADING) + MAX_HEADING) % MAX_HEADING;
        };

        /**
         * Moves up vector.
         * @function moveUpTo
         * @memberOf FlatNavigation#
         * @param {float[]} vec Vector
         * @param {int} [duration = DEFAULT_DURATION_NORTH] - Duration of animation in milliseconds
         */
        FlatNavigation.prototype.moveUpTo = function (vec, duration) {
            // Create a single animation to animate up
            var startValue = [];
            var endValue = this.up;
            endValue[0] = Numeric.toDegree(endValue[0]);
            endValue[1] = Numeric.toDegree(endValue[1]);
            endValue[2] = endValue[2];

            this.ctx.getCoordinateSystem().getWorldFrom3D(vec, startValue);

            var durationTime = duration || DEFAULT_DURATION_NORTH;

            var navigation = this;
            var moveUpToAnimation = _initMoveUpAnimation.call(this, navigation, durationTime);
            _rotateAnimationToNorth.call(this, moveUpToAnimation, this.getHeading());
            this.ctx.addAnimation(moveUpToAnimation);
            moveUpToAnimation.start();
        };

        /**
         * Destroy
         * @function destroy
         * @memberOf FlatNavigation#
         */
        FlatNavigation.prototype.destroy = function () {
            AbstractNavigation.prototype.destroy.call(this);
            this.up = null;
            this.minDistance = null;
            this.maxDistance = null;
            this.heading = null;
            this.center = null;
            this.distance = null;
        };


        /**************************************************************************************************************/

        return FlatNavigation;

    });
