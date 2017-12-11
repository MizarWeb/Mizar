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
         * @property {float} [minDistance = 60000] - The minimum distance in meters from the surface of the globe
         * or options.initTarget[2] when this one is inferior to options.minDistance
         * @property {float} [maxDistance = 5.0 * RADIUS_PLANET] - The maximum distance in meters or
         * options.initTarget[2] when this one is superior to options.maxDistance
         */
        
        /**
         * @name FlatNavigation
         * @class
         * <table border="0">
         *     <tr>
         *         <td><img src="../doc/images/nav_flat.png" width="200px"/></td>
         *         <td>Provides a camera to navigate on a 2D map - Only available in a Planet context</td>
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
            this.minDistance = (this.options.minDistance) || 60000;
            this.maxDistance = (this.options.maxDistance) || 5.0 * this.ctx.getCoordinateSystem().getGeoide().getRadius() / this.ctx.getCoordinateSystem().getGeoide().getHeightScale();

            // Scale min and max distance from meter to internal ratio
            this.minDistance *= this.ctx.getCoordinateSystem().getGeoide().getHeightScale();
            this.maxDistance *= this.ctx.getCoordinateSystem().getGeoide().getHeightScale();

            // Initialize the navigation
            this.center = [0.0, 0.0, 0.0];
            this.distance = this.maxDistance;
            this.up = [0.0, 1.0, 0.0];
            _setInitTarget.call(this, this.options.initTarget);

            this.computeViewMatrix();

        };
        /**
         * Defines the position where the camera looks at and the distance of the camera regarding to the planet's surface
         * @param {float[]|undefined} initTarget as [longitude, latitude[, distance in meter]]
         * @private
         */
        function _setInitTarget(initTarget) {
            if (initTarget) {
                var pos = this.ctx.getCoordinateSystem().get3DFromWorld(initTarget);
                this.center[0] = pos[0];
                this.center[1] = pos[1];
                this.distance = (initTarget.length === 3) ? initTarget[2] * this.ctx.getCoordinateSystem().getGeoide().getHeightScale() : this.distance;
                if(this.distance < this.minDistance) {
                    this.minDistance = this.distance;
                }
                if(this.distance > this.maxDistance) {
                    this.maxDistance = this.distance;
                }
            }
        }


        /**************************************************************************************************************/

        Utils.inherits(AbstractNavigation, FlatNavigation);

        /**************************************************************************************************************/

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
         * @function save
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
         * Computes the view matrix
         * @function computeViewMatrix
         * @memberOf FlatNavigation#
         */
        FlatNavigation.prototype.computeViewMatrix = function () {
            var eye = [];
            //vec3.normalize(this.geoCenter);
            var vm = this.renderContext.getViewMatrix();

            eye = [this.center[0], this.center[1], this.distance];

            mat4.lookAt(eye, this.center, this.up, vm);
            this.up = [vm[1], vm[5], vm[9]];
            this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_MODIFIED);
            this.renderContext.requestFrame();
        };
        
        /**
         * Zooms to a geographic position
         * @function zoomTo
         * @memberOf FlatNavigation#
         * @param {float[]} geoPos Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
         * @param {Object} options - options
         * @param {int} [options.distance] - Final zooming distance in meters. By default, the distance does not change
         * @param {int} [options.duration = 5000] -  Duration of animation in milliseconds
         * @param {navigationCallback} options.callback - Callback at the end of animation
         */
        FlatNavigation.prototype.zoomTo = function (geoPos, options) {
            this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE);
            var navigation = this;

            var destDistance = (options && options.distance) ? options.distance : this.distance / this.ctx.getCoordinateSystem().getGeoide().getHeightScale();
            var duration = (options && options.duration) ? options.duration : 5000;

            var pos = this.ctx.getCoordinateSystem().get3DFromWorld(geoPos);

            // Create a single animation to animate geoCenter, distance and tilt
            var startValue = [this.center[0], this.center[1], this.distance];
            var endValue = [pos[0], pos[1], destDistance * this.ctx.getCoordinateSystem().getGeoide().getHeightScale()];
            this.zoomToAnimation = AnimationFactory.create(
                Constants.ANIMATION.Segmented,
                {
                    "duration": duration,
                    "valueSetter": function (value) {
                        navigation.center[0] = value[0];
                        navigation.center[1] = value[1];
                        navigation.distance = value[2];
                        navigation.computeViewMatrix();
                    }
                });

            // Compute a max altitude for the animation
            var worldStart = this.center;
            var worldEnd = pos;
            var vec = vec3.subtract(worldStart, worldEnd);
            var len = vec3.length(vec);
            var canvas = this.ctx.getRenderContext().getCanvas();
            var minFov = Math.min(Numeric.toRadian(45.0), Numeric.toRadian(45.0 * canvas.width / canvas.height));
            var maxAltitude = 1.1 * ((len / 2.0) / Math.tan(minFov / 2.0));
            if (maxAltitude > this.distance) {
                // Compute the middle value
                var midValue = [startValue[0] * 0.5 + endValue[0] * 0.5,
                    startValue[1] * 0.5 + endValue[1] * 0.5,
                    maxAltitude];

                // Add two segments
                this.zoomToAnimation.addSegment(
                    0.0, startValue,
                    0.5, midValue,
                    function (t, a, b) {
                        var pt = Numeric.easeInQuad(t);
                        var dt = Numeric.easeOutQuad(t);
                        return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                            Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                            Numeric.lerp(dt, a[2], b[2])]; // distance
                    });

                this.zoomToAnimation.addSegment(
                    0.5, midValue,
                    1.0, endValue,
                    function (t, a, b) {
                        var pt = Numeric.easeOutQuad(t);
                        var dt = Numeric.easeInQuad(t);
                        return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                            Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                            Numeric.lerp(dt, a[2], b[2])]; // distance
                    });
            }
            else {
                // Add only one segments
                this.zoomToAnimation.addSegment(
                    0.0, startValue,
                    1.0, endValue,
                    function (t, a, b) {
                        var pt = Numeric.easeOutQuad(t);
                        var dt = Numeric.easeInQuad(t);
                        return [Numeric.lerp(pt, a[0], b[0]),  // geoPos.long
                            Numeric.lerp(pt, a[1], b[1]),  // geoPos.lat
                            Numeric.lerp(dt, a[2], b[2])];  // distance
                    });
            }

            var self = this;
            this.zoomToAnimation.onstop = function () {
                if (options && options.callback) {
                    options.callback();
                }
                self.zoomToAnimation = null;
                self.ctx.publish(Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE, destDistance);
            };

            this.ctx.addAnimation(this.zoomToAnimation);
            this.zoomToAnimation.start();
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

            this.center = ray.computePoint(ray.planeIntersect([0, 0, 0], [0, 0, 1]));

            this.computeViewMatrix();
        };

        
        /**
         * Rotates the camera
         * @function rotate
         * @memberOf FlatNavigation#
         * @param {int} dx Window delta x
         * @param {int} dy Window delta y
         */
        FlatNavigation.prototype.rotate = function (dx, dy) {
            // Constant tiny angle
            var angle = -dx * 0.1 * Math.PI / 180.0;

            var rot = quat4.fromAngleAxis(angle, [0, 0, 1]);
            quat4.multiplyVec3(rot, this.up);

            this.computeViewMatrix();
        };

        /**
         * Returns the distance in meters.
         * @return {float} the distance in meters from the surface of the globe
         */
        FlatNavigation.prototype.getDistance = function() {
            return this.distance*this.ctx.getCoordinateSystem().getGeoide().getRealPlanetRadius();
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
            this.center = null;
            this.distance = null;
        };


        /**************************************************************************************************************/

        return FlatNavigation;

    });
