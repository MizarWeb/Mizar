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

define(['../Utils/Utils', '../Utils/Constants', './AbstractNavigation', '../Animation/AnimationFactory', '../Utils/Numeric', '../Renderer/glMatrix'],
    function (Utils, Constants, AbstractNavigation, AnimationFactory, Numeric) {

        /**
         * Flat navigation configuration
         * @typedef {AbstractNavigation.configuration} AbstractNavigation.planet_configuration
         * @property {float[]} [initTarget=[0, 0, 3.0 * RADIUS_PLANET]] - Target in decimal degree (longitude, latitude, distance in meter)
         * at initialisation. distance in meter is optional.
         * @property {int} [minDistance=0] the minimum distance sets to 60 Km by default or options.initTarget[2]
         * when this one is inferior to options.minDistance
         * @property {int} [maxDistance=3*RADIUS_PLANET] the maximum distance sets to 3*RADIUS_PLANET by default or
         * options.initTarget[2] when this one is superior to options.maxDistance
         * @property {boolean} [updateViewMatrix=false] indicating if view matrix must be updated on initialization.
         */

        /**
         * 1km epsilon error for elevation
         * @type {number}
         */
        const OFFSET_ELEVATION = 1000.0;

        /**
         * @name PlanetNavigation
         * @augments AbstractNavigation
         * @class
         * <table border="0">
         *     <tr>
         *         <td><img src="../doc/images/nav_planet.png" width="200px"/></td>
         *         <td>Provides a camera, located outside the globe and looking at the globe. It is used to view a planet</td>
         *     </tr>
         * </table>
         * At initialisation, the distance of the camera is maxDistance
         * @param {PlanetContext} ctx -  Planet context
         * @param {AbstractNavigation.planet_configuration} options - Planet navigation configuration
         * @memberOf module:Navigation
         */
        var PlanetNavigation = function (ctx, options) {
            AbstractNavigation.prototype.constructor.call(this, Constants.NAVIGATION.PlanetNavigation, ctx, options);

            Object.defineProperties(this, {
                scale: {
                    get: function() {
                        return this.ctx.getCoordinateSystem().getGeoide().getHeightScale();
                    }
                },

                distance: {
                    get: function() {
                        const value = this._distance * this.scale;
                        return value;
                    },
                    set: function(v) {
                        const value = v / this.scale;
                        this._distance = value;
                    }
                },

                targetHeight: {
                    get: function() {
                        return this.ctx.getElevation(this.geoCenter[0], this.geoCenter[1]);
                    }
                },

                cameraHeight: {
                    get: function() {
                        const tilt = (90 - this.tilt) * Math.PI / 180;
                        const c = Math.cos(tilt);
                        const d = c * this._distance;
                        return d + this.targetHeight;
                    },
                },

                eye: {
                    get: function() {
                        return [
                            this.inverseViewMatrix[12],
                            this.inverseViewMatrix[13],
                            this.inverseViewMatrix[14]
                        ];
                    },
                },

                geoEye: {
                    get: function() {
                        return this.ctx.getCoordinateSystem().from3DToGeo(this.eye);
                    },
                },
            });

            const geoide = this.ctx.getCoordinateSystem().getGeoide();
            // Default values for min and max distance (in meter)
            const minDistance = (this.options.minDistance) || 50;
            const maxDistance = (this.options.maxDistance) || 3.0 * geoide.getRealPlanetRadius();

            // Scale min and max distance from meter to internal ratio
            this.minDistance = minDistance * geoide.getHeightScale();
            this.maxDistance = maxDistance * geoide.getHeightScale();

            // Initialize the navigation
            this.geoCenter = [0.0, 0.0, 0.0];
            this.heading = 0.0;
            this.tilt = 90.0;
            this._distance = Number.NaN;
            this.offset = 0.0;

            this.inverseViewMatrix = mat4.create();

            var updateViewMatrix = (this.options.hasOwnProperty('updateViewMatrix') ? this.options.updateViewMatrix : true);

            _setInitTarget.call(this, this.options.initTarget);

            // Update the view matrix if needed(true by default)
            if (updateViewMatrix) {
                this.computeViewMatrix();
            }
        };

        /**
         * Defines the position where the camera looks at and the distance of the camera regarding to the planet's surface
         * @param {float[]|undefined} initTarget as [longitude, latitude[, distance in meter]]
         * @private
         */
        function _setInitTarget(initTarget) {
            if (initTarget) {
                this.geoCenter[0] = initTarget[0];
                this.geoCenter[1] = initTarget[1];
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

        Utils.inherits(AbstractNavigation, PlanetNavigation);

        /**************************************************************************************************************/

        /**
         * Saves the current navigation state.
         * @function save
         * @memberOf PlanetNavigation#
         * @return {{geoCenter: *, heading: *, tilt: *, distance: *}} a JS object containing the navigation state
         */
        PlanetNavigation.prototype.save = function () {
            return {
                geoCenter: this.geoCenter,
                heading: this.heading,
                tilt: this.tilt,
                distance: this.distance
            };
        };

        /**
         * Restores the navigation state.
         * @function restore
         * @memberOf PlanetNavigation#
         * @param {Object} state - a JS object containing the navigation state
         * @param {float[]} state.geoCenter - Target of the camera (longitude, latitude)
         * @param state.heading
         * @param {float} state.tilt - tilt of the camera in decimal degree
         * @param {float} state.distance - Distance from the surface of the globe in meter.
         */
        PlanetNavigation.prototype.restore = function (state) {
            this.geoCenter = state.geoCenter;
            this.heading = state.heading;
            this.tilt = state.tilt;
            this.distance = state.distance;
            this.computeViewMatrix();
        };

        /**
         * Zoom to a geographic position
         * @function zoomTo
         * @memberOf PlanetNavigation#
         * @param {float[]} geoPos Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
         * @param {Object} options - Options
         * @param {int} [options.distance] - Final zooming distance in meters - if not set, this is the current distance
         * @param {int} [options.duration = 5000] - Duration of animation in milliseconds
         * @param {int} [options.tilt = 90] - Defines the tilt in the end of animation
         * @param {navigationCallback} [options.callback] - Callback at the end of animation
         */
        PlanetNavigation.prototype.zoomTo = function (geoPos, options) {
            this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE);
            var navigation = this;

            var destDistance = (options && options.distance) ? options.distance : this.distance / this.ctx.getCoordinateSystem().getGeoide().getHeightScale();
            var duration = (options && options.duration) ? options.duration : 5000;
            var destTilt = (options && options.tilt) ? options.tilt :  90;

            // Create a single animation to animate geoCenter, distance and tilt
            var startValue = [this.geoCenter[0], this.geoCenter[1], this.distance, this.tilt];
            var endValue = [geoPos[0], geoPos[1], destDistance * this.ctx.getCoordinateSystem().getGeoide().getHeightScale(), destTilt];
            this.zoomToAnimation = new AnimationFactory.create(
                Constants.ANIMATION.Segmented,
                {
                    "duration": duration,
                    "valueSetter": function (value) {
                        navigation.geoCenter[0] = value[0];
                        navigation.geoCenter[1] = value[1];
                        navigation.distance = value[2];
                        navigation.tilt = value[3];
                        navigation.computeViewMatrix();
                    }
                });

            // Compute a max altitude for the animation
            var worldStart = this.ctx.getCoordinateSystem().get3DFromWorld(this.geoCenter);
            var worldEnd = this.ctx.getCoordinateSystem().get3DFromWorld(geoPos);
            var vec = vec3.subtract(worldStart, worldEnd);
            var len = vec3.length(vec);
            var canvas = this.ctx.getRenderContext().canvas;
            var minFov = Math.min(Numeric.toRadian(45.0),
                Numeric.toRadian(45.0 * canvas.width / canvas.height));
            var maxAltitude = 1.1 * ((len / 2.0) / Math.tan(minFov / 2.0));
            if (maxAltitude > this.distance) {
                // Compute the middle value
                var midValue = [startValue[0] * 0.5 + endValue[0] * 0.5,
                    startValue[1] * 0.5 + endValue[1] * 0.5,
                    maxAltitude, destTilt];

                // Add two segments
                this.zoomToAnimation.addSegment(
                    0.0, startValue,
                    0.5, midValue,
                    function (t, a, b) {
                        var pt = Numeric.easeInQuad(t);
                        var dt = Numeric.easeOutQuad(t);
                        return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                            Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                            Numeric.lerp(dt, a[2], b[2]), // distance
                            Numeric.lerp(t, a[3], b[3])]; // tilt
                    });

                this.zoomToAnimation.addSegment(
                    0.5, midValue,
                    1.0, endValue,
                    function (t, a, b) {
                        var pt = Numeric.easeOutQuad(t);
                        var dt = Numeric.easeInQuad(t);
                        return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                            Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                            Numeric.lerp(dt, a[2], b[2]), // distance
                            Numeric.lerp(t, a[3], b[3])]; // tilt
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
                            Numeric.lerp(dt, a[2], b[2]),  // distance
                            Numeric.lerp(t, a[3], b[3])]; // tilt
                    });
            }

            var self = this;
            this.zoomToAnimation.onstop = function () {
                if (options && options.callback) {
                    options.callback();
                }
                self.zoomToAnimation = null;
                self.ctx.publish(Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE, destDistance);
                self.updateGeoCenter();
            };

            this.ctx.addAnimation(this.zoomToAnimation);
            this.zoomToAnimation.start();
        };

        /**
         * Applies to rotation matrix
         * @function applyLocalRotation
         * @memberOf Navigation#
         */
        PlanetNavigation.prototype.applyLocalRotation = function (matrix) {
            mat4.rotate(matrix, (this.heading) * Math.PI / 180.0, [0.0, 0.0, 1.0]);
            mat4.rotate(matrix, (90 - this.tilt) * Math.PI / 180.0, [1.0, 0.0, 0.0]);
        };

        /**
         * Computes the view matrix
         * @function computeViewMatrix
         * @memberOf Navigation#
         */
        PlanetNavigation.prototype.computeViewMatrix = function () {
            this.computeInverseViewMatrix();
            mat4.inverse(this.inverseViewMatrix, this.renderContext.getViewMatrix());
            this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_MODIFIED);
            this.renderContext.requestFrame();
        };

        /**
         * Compute the inverse view matrix
         * @function computeInverseViewMatrix
         * @memberOf PlanetNavigation#
         */
        PlanetNavigation.prototype.computeInverseViewMatrix = function () {
            this.ctx.getCoordinateSystem().getLHVTransform(this.geoCenter, this.inverseViewMatrix);
            this.applyLocalRotation(this.inverseViewMatrix);
            mat4.translate(this.inverseViewMatrix, [0.0, 0.0, this.distance]);
        };

        /**
         * Zoom to the current observed location
         * @function zoom
         * @memberOf PlanetNavigation#
         * @param {float} delta Delta zoom
         * @param {float} scale Scale
         */
        PlanetNavigation.prototype.zoom = function (delta, scale) {
            // TODO : improve zoom, using scale or delta ? We should use scale always
            if (scale) {
                this.distance *= scale;
            } else {
                this._distance *= (1 + delta * 0.1);
            }

            this.distance = Math.max(Math.min(this.distance, this.maxDistance), this.minDistance);

            // compute the view matrix with new values
            this.computeViewMatrix();
        };

        /**
         * Pans the camera
         * @function pan
         * @memberOf PlanetNavigation#
         * @param {int} dx Window delta x
         * @param {int} dy Window delta y
         */
        PlanetNavigation.prototype.pan = function (dx, dy) {
            // Get geographic frame
            var local2World = mat4.create();
            var coordinateSystem = this.ctx.getCoordinateSystem();
            coordinateSystem.getLocalTransform(this.geoCenter, local2World);
            // Then corresponding vertical axis and north
            var z = vec3.create();
            var previousNorth = vec3.create([0.0, 1.0, 0.0]);
            coordinateSystem.getUpVector(local2World, z);
            //coordinateSystem.getFrontVector( local2World, previousNorth );
            mat4.multiplyVec3(local2World, previousNorth, previousNorth);

            // Then apply local transform
            this.applyLocalRotation(local2World);
            // Retrieve corresponding axes
            var x = vec3.create();
            var y = vec3.create();
            coordinateSystem.getSideVector(local2World, x);
            coordinateSystem.getFrontVector(local2World, y);
            // According to our local configuration, up is y and side is x

            // Compute direction axes
            vec3.cross(z, x, y);
            vec3.cross(y, z, x);
            vec3.normalize(x, x);
            vec3.normalize(y, y);

            //Normalize dx and dy
            dx = dx / this.renderContext.getCanvas().width;
            dy = dy / this.renderContext.getCanvas().height;

            // Move accordingly
            var position = vec3.create();
            coordinateSystem.get3DFromWorld(this.geoCenter, position);
            vec3.scale(x, dx * Math.max(this.distance, 10000 * this.scale), x);
            vec3.scale(y, dy * Math.max(this.distance, 10000 * this.scale), y);
            vec3.subtract(position, x, position);
            vec3.add(position, y, position);

            // Clamp onto sphere
            vec3.normalize(position);
            vec3.scale(position, coordinateSystem.getGeoide().getRadius());

            // Update geographic center
            coordinateSystem.getWorldFrom3D(position, this.geoCenter);
            this.geoCenter[2] = this.targetHeight;

            // Compute new north axis
            var newNorth = vec3.create([0.0, 1.0, 0.0]);
            coordinateSystem.getLocalTransform(this.geoCenter, local2World);
            mat4.multiplyVec3(local2World, newNorth, newNorth);

            // Take care if we traverse the pole, ie the north is inverted
            if (vec3.dot(previousNorth, newNorth) < 0) {
                this.heading = (this.heading + 180.0) % 360.0;
            }

            this.computeViewMatrix();
        };

        /**
         * Rotates the navigation
         * @function rotate
         * @memberOf PlanetNavigation#
         * @param {int} dx Window delta x
         * @param {int} dy Window delta y
         */
        PlanetNavigation.prototype.rotate = function (dx, dy) {
            var previousHeading = this.heading;
            var previousTilt = this.tilt;

            this.heading += dx * 0.1;
            this.tilt += dy * 0.1;

            this.clampTilt();

            this.computeViewMatrix();
        };

        /**
         * Check for collision
         * @function hasCollision
         * @memberOf PlanetNavigation#
         * @return {Boolean} collision detected ?
         */
        PlanetNavigation.prototype.hasCollision = function () {
            const eye = [this.inverseViewMatrix[12], this.inverseViewMatrix[13], this.inverseViewMatrix[14]];
            const geoEye = vec3.create();
            this.ctx.getCoordinateSystem().from3DToGeo(eye, geoEye);
            const elevation = this.ctx.getElevation(geoEye[0], geoEye[1]);

            const near = this.ctx.getRenderContext().near;

            const dist = (geoEye[2] - elevation) - 25;
            const collides = dist < 0;

            if (collides) {
                this.offset = (-dist) + 25;
            }

            return collides;
        };

        /**
         * Compute the new geocenter, being the intersection point
         * with the center of the screen
         */
        PlanetNavigation.prototype.updateGeoCenter = function()  {
            const canvas = this.renderContext.canvas;
            const width = canvas.width;
            const height = canvas.height;

            const center = this.ctx.globe.getLonLatFromPixel(width / 2, height / 2);
            if (center != null && center != undefined) {
                // We want to maintain the camera height, and compute the new distance according to this height
                // We know by trigonometry that cos(90 - tilt) = (camera height - tgt height) / distance
                // So (camera height - old tgt height) / old distance = (camera height - new tgt height) / new distance
                // And new distance = old distance * ((camera height - new tgt height) / (camera height - old tgt height))
                const oldDistance = this._distance;
                const oldTargetHeight = this.targetHeight;
                const cameraHeight = this.cameraHeight;

                const eye = this.geoEye;

                const v = vec3.create();
                vec3.subtract(eye, center, v);

                var tilt;
                const vdist = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
                if (vdist < 1e-5) {
                    tilt = Math.PI / 2;
                } else {
                    tilt = Math.atan(v[2] / vdist);
                }

                // TODO: Properly compute distance
                const d = v[2] / Math.sin(tilt);

                this.tilt = tilt * 180 / Math.PI;
                this._distance = d;
                this.geoCenter = center;
            }
        };

        /**
         * Returns the distance in meters.
         * @return {float} the distance in meters from the surface of the globe
         */
        PlanetNavigation.prototype.getDistance = function() {
            return this._distance;
        };

        /**
         * Destroy
         * @function destroy
         * @memberOf PlanetNavigation#
         */
        PlanetNavigation.prototype.destroy = function () {
            AbstractNavigation.prototype.destroy.call(this);
            this.minDistance = null;
            this.maxDistance = null;
            this.geoCenter = null;
            this._distance = null;
            this.heading = null;
            this.tilt = null;
            this.inverseViewMatrix = null;
        };

        /**
         * Update the navigator inner values
         * @function update
         * @memberOf PlanetNavigation#
         */
        PlanetNavigation.prototype.update = function() {
            if (!this.ctx.globe.tileManager.level0TilesLoaded) {
                return;
            }

            if (Number.isNaN(this.distance)) {
                this.distance = this.maxDistance;
                this._distance = this.cameraHeight;
            }

            const rc = this.ctx.getRenderContext();

            // Update the near plane distance
            rc.near = this.distance * 0.25;

            this.computeViewMatrix();

            if (this.hasCollision()) {
                const hc = this.cameraHeight;
                const ht = this.targetHeight;
                const nh = (hc + this.offset - ht) / this._distance;
                const as = Math.asin(nh); // New tilt value
                if (Number.isNaN(as)) {
                    console.log(`NaN ! ${hc}, ${ht}, ${this.offset}, ${this._distance}, ${nh}`);
                    this._distance += this.offset;
                } else {
                    this.tilt = as * 180 / Math.PI;
                    this.clampTilt();
                }
                this.computeViewMatrix();
            }

            this.ctx.publish(Constants.EVENT_MSG.NAVIGATION_CHANGED_DISTANCE, this.cameraHeight);
        };

        /**
         * Clamp the tilt value between 5 and 90 degrees
         * @function clampTilt
         * @memberOf PlanetNavigation#
         */
        PlanetNavigation.prototype.clampTilt = function() {
            this.tilt = Math.min(Math.max(this.tilt, 10), 90);
        }

        PlanetNavigation.prototype.donePanning = function() {
            this.updateGeoCenter();
        };

        PlanetNavigation.prototype.doneRotating = function() {
            this.updateGeoCenter();
        };

        /**************************************************************************************************************/

        return PlanetNavigation;

    });
