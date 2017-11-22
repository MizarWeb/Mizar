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
/**
 * Mizar owns different types of navigation to control the camera on the WebGL scene.
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
 *
 * The camera is automatically instantiated by the context {@link AbstractContext}, which is created by client.
 * Usually, the navigation is in 3D (AstroNavigation or PlanetNavigation). However, in a particular case, when
 * the client selects a  {@link module:Crs.CoordinateSystemFactory Coordinate Reference System} with a
 * {@link module:Crs.ProjectedCrs projection}, the {@link module:Navigation.FlatNavigation FlatNavigation} is selected.<br/>
 *
 * Then the client can control the navigation by its {@link Navigation interface}
 *
 * <p><p>
 * In addition, the navigation is controlled by the user with the help of devices : keyboard, touch, mouse.
 * When creating the Mizar instance, the user can define a list of supported devices to be able to control the
 * navigation by these devices. By default, the {@link module:Navigation.MouseNavigationHandler MouseNavigationHandler}
 * and {@link module:Navigation.KeyboardNavigationHandler KeyboardNavigationHandler} are set up.
 * When the parameter <i>isMobile</i> is set to true in {@link Mizar} options, then the
 * {@link module:Navigation.TouchNavigationHandler TouchNavigationHandler} is set up
 *
 * <p>
 * @todo Créer un tuto pour montrer les principales méthodes de Navigation et le changement de 3D <--> 2D
 * @module Navigation
 * @implements {Navigation}
 */
define(['../Utils/Utils', '../Utils/Constants',
        './AbstractNavigation', '../Animation/AnimationFactory',
        '../Utils/Numeric', '../Renderer/Ray', '../Renderer/glMatrix'],
    function (Utils, Constants, AbstractNavigation, AnimationFactory, Numeric, Ray) {

        /**
         * Astro navigation configuration
         * @typedef {AbstractNavigation.configuration} AbstractNavigation.astro_configuration
         * @property {float[]} [initTarget = [0,0]] - initial target of the camera in decimal degree (longitude, latitude)
         * @property {float} [initFov = 0.001] - initial field of view of the camera in decimal degree
         * @property {float} [minFov = 0.001] - Minimal field of view of the camera in decimal degree
         * @property {float} [maxFov = 100] - Maximal field of view of the camera in decimal degree
         * @property {float[]} [up = [0.0, 0.0, 1.0]] - Up vector that defines the north
         */

        /**
         * @name AstroNavigation
         * @class
         * <table border="0">
         *     <tr>
         *         <td><img src="../doc/images/nav_astro.png" width="200px"/></td>
         *         <td>Provides a camera located at the center of the scene. The camera is inside the globe.
         *         It is used to view the sky.</td>
         *     </tr>
         * </table>
         * When an <i>initFov</i> is provided out the range [<i>minFov</i>, <i>maxFov</i>], the range
         * [<i>minFov</i>, <i>maxFov</i>] is updated with the value of <i>initFov</i>.
         * @augments AbstractNavigation
         * @param {SkyContext} ctx - Sky context
         * @param {AbstractNavigation.astro_configuration} options - navigation configuration
         * @constructor
         * @memberOf module:Navigation
         */
        var AstroNavigation = function (ctx, options) {
            AbstractNavigation.prototype.constructor.call(this, Constants.NAVIGATION.AstroNavigation, ctx, options);

            // Default values for fov (in degrees)
            this.minFov = (this.options.minFov) || 0.001;
            this.maxFov = (this.options.maxFov) || 100;

            // Initialize the navigation
            this.center3d = [1.0, 0.0, 0.0];
            this.up = [0.0, 0.0, 1.0];
            _setInitTarget.call(this, this.options.initTarget);
            _setInitFov.call(this, this.options.initFov);
            _setUpVector.call(this, this.options.up);

            // Update the view matrix now
            this.computeViewMatrix();
        };

        /**
         * Defines the Up vector.
         * @param up
         * @private
         */
        function _setUpVector(up) {
            if(up) {
                this.up = up;
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
         * Defines the position where the camera looks at.
         * @param {float[]|undefined} initTarget
         * @private
         */
        function _setInitTarget(initTarget) {
            if (initTarget) {
                this.ctx.getCoordinateSystem().get3DFromWorld(initTarget, this.center3d);
            }
        }


        /**************************************************************************************************************/

        Utils.inherits(AbstractNavigation, AstroNavigation);

        /**************************************************************************************************************/


        /**
         * ZoomTo a position
         * @function zoomTo
         * @param {float[]} geoPos - target of the camera
         * @param {Object} options - options
         * @param {float} [options.fov = 2.0] - field of view in degree
         * @param {int} [options.duration = 2000] - duration of the animation in milliseconds
         * @param {navigationCallback} [options.callback] - Called at the end of navigation
         * @memberOf AstroNavigation#
         */
        AstroNavigation.prototype.zoomTo = function (geoPos, options) {
            console.log("AstroNavigation.zoomTo : options",options);
            var navigation = this;

            // default values
            var destFov = (options && options.fov) ? options.fov : 2.0;
            var duration = (options && options.duration) ? options.duration : 2000;

            // Create a single animation to animate center3d and fov
            var geoStart = [];
            var middleFov = 25.0;	// arbitrary middle fov value which determines if the animation needs two segments

            this.ctx.getCoordinateSystem().getWorldFrom3D(this.center3d, geoStart);
            var startValue = [geoStart[0], geoStart[1], this.renderContext.getFov()];
            var endValue = [geoPos[0], geoPos[1], destFov];

            // Compute the shortest path if needed
            //TODO : not sure it is work for all cases, better to use scalar product
            if (Math.abs(geoPos[0] - geoStart[0]) > 180.0) {
                if (geoStart[0] < geoPos[0]) {
                    startValue[0] += 360;
                } else {
                    endValue[0] += 360;
                }
            }
            var animation = AnimationFactory.create(
                Constants.ANIMATION.Segmented,
                {
                    "duration": duration,
                    "valueSetter": function (value) {
                        var position3d = navigation.ctx.getCoordinateSystem().get3DFromWorld([value[0], value[1]]);
                        navigation.center3d[0] = position3d[0];
                        navigation.center3d[1] = position3d[1];
                        navigation.center3d[2] = position3d[2];
                        navigation.ctx.getRenderContext().setFov(value[2]);
                        navigation.computeViewMatrix();
                    }
                });

            // TODO : maybe improve it ?
            // End point which is out of frustum invokes two steps animation, one step otherwise
            var end3DValue = this.ctx.getCoordinateSystem().get3DFromWorld(geoPos);
            if (middleFov > this.renderContext.getFov() && this.renderContext.getWorldFrustum().containsSphere(end3DValue, 0.005) < 0) {
                // Two steps animation, 'rising' & 'falling'

                // Compute the middle value
                var midValue = [
                    startValue[0] * 0.5 + endValue[0] * 0.5,
                    startValue[1] * 0.5 + endValue[1] * 0.5,
                    middleFov
                ];

                // Add two segments
                animation.addSegment(
                    0.0, startValue,
                    0.5, midValue,
                    function (t, a, b) {
                        var pt = Numeric.easeInQuad(t);
                        var dt = Numeric.easeOutQuad(t);
                        return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                            Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                            Numeric.lerp(dt, a[2], b[2])]; // fov
                    });

                animation.addSegment(
                    0.5, midValue,
                    1.0, endValue,
                    function (t, a, b) {
                        var pt = Numeric.easeOutQuad(t);
                        var dt = Numeric.easeInQuad(t);
                        return [Numeric.lerp(pt, a[0], b[0]), // geoPos.long
                            Numeric.lerp(pt, a[1], b[1]), // geoPos.lat
                            Numeric.lerp(dt, a[2], b[2])]; // fov
                    });
            }
            else {
                // One step animation, 'falling' only

                // Add only one segment
                animation.addSegment(
                    0.0, startValue,
                    1.0, endValue,
                    function (t, a, b) {
                        var pt = Numeric.easeOutQuad(t);
                        var dt = Numeric.easeInQuad(t);
                        return [Numeric.lerp(pt, a[0], b[0]),  // geoPos.long
                            Numeric.lerp(pt, a[1], b[1]),  // geoPos.lat
                            Numeric.lerp(dt, a[2], b[2])];  // fov
                    });
            }

            animation.onstop = function () {
                if (options && options.callback) {
                    options.callback();
                }
                navigation.zoomToAnimation = null;
            };

            this.ctx.addAnimation(animation);
            animation.start();
            this.zoomToAnimation = animation;
        };

        /**
         * Moves to a 3d position
         * @function moveTo
         * @memberof AstroNavigation#
         * @param {float[]} geoPos - Array of two floats corresponding to final Longitude and Latitude(in this order) to zoom
         * @param {int} [duration = 5000] - Duration of animation in milliseconds
         * @param {Function} [callback] - Callback on the end of animation
         */
        AstroNavigation.prototype.moveTo = function (geoPos, duration, callback) {
            var navigation = this;

            var durationTime = duration || 5000;

            // Create a single animation to animate center3d
            var geoStart = [];
            this.ctx.getCoordinateSystem().getWorldFrom3D(this.center3d, geoStart);

            var startValue = [geoStart[0], geoStart[1]];
            var endValue = [geoPos[0], geoPos[1]];

            // Compute the shortest path if needed
            if (Math.abs(geoPos[0] - geoStart[0]) > 180.0) {
                if (geoStart[0] < geoPos[0]) {
                    startValue[0] += 360;
                } else {
                    endValue[0] += 360;
                }
            }

            var animation = AnimationFactory.create(
                Constants.ANIMATION.Segmented,
                {
                    "duration": durationTime,
                    "valueSetter": function (value) {
                        var position3d = navigation.ctx.getCoordinateSystem().get3DFromWorld([value[0], value[1]]);
                        navigation.center3d[0] = position3d[0];
                        navigation.center3d[1] = position3d[1];
                        navigation.center3d[2] = position3d[2];
                        navigation.computeViewMatrix();
                    }
                });

            animation.addSegment(
                0.0, startValue,
                1.0, endValue,
                function (t, a, b) {
                    var pt = Numeric.easeOutQuad(t);
                    return [
                        Numeric.lerp(pt, a[0], b[0]),  // geoPos.long
                        Numeric.lerp(pt, a[1], b[1])   // geoPos.lat
                    ];
                }
            );

            animation.onstop = function () {
                if (callback) {
                    callback();
                }
            };

            this.ctx.addAnimation(animation);
            animation.start();
        };

        /**
         * Moves up vector.
         * @function moveUpTo
         * @memberOf AstroNavigation#
         * @param {float[]} vec Vector
         * @param {int} [duration = 1000] - Duration of animation in milliseconds
         */
        AstroNavigation.prototype.moveUpTo = function (vec, duration) {
            // Create a single animation to animate up
            var startValue = [];
            var endValue = [];
            this.ctx.getCoordinateSystem().getWorldFrom3D(this.up, startValue);
            this.ctx.getCoordinateSystem().getWorldFrom3D(vec, endValue);
            var durationTime = duration || 1000;

            var navigation = this;
            var animation = AnimationFactory.create(
                Constants.ANIMATION.Segmented,
                {
                    "duration": durationTime,
                    "valueSetter": function (value) {
                        var position3d = navigation.ctx.getCoordinateSystem().get3DFromWorld([value[0], value[1]]);
                        navigation.up[0] = position3d[0];
                        navigation.up[1] = position3d[1];
                        navigation.up[2] = position3d[2];
                        navigation.computeViewMatrix();
                    }
                });

            animation.addSegment(
                0.0, startValue,
                1.0, endValue,
                function (t, a, b) {
                    var pt = Numeric.easeOutQuad(t);
                    return [
                        Numeric.lerp(pt, a[0], b[0]),  // geoPos.long
                        Numeric.lerp(pt, a[1], b[1])   // geoPos.lat
                    ];
                }
            );

            this.ctx.addAnimation(animation);
            animation.start();
        };

        /**
         * Computes the view matrix
         * @function computeViewMatrix
         * @memberOf AstroNavigation#
         */
        AstroNavigation.prototype.computeViewMatrix = function () {
            vec3.normalize(this.center3d);

            var vm = this.renderContext.getViewMatrix();

            mat4.lookAt([0.0, 0.0, 0.0], this.center3d, this.up, vm);
            // mat4.inverse( vm );
            // mat4.rotate(vm, this.heading * Math.PI/180., [1., 0., 0.])
            // mat4.inverse( vm );

            this.up = [vm[1], vm[5], vm[9]];
            this.ctx.publish("modifiedNavigation");
            this.renderContext.requestFrame();
        };

        /**
         * Event handler for mouse wheel
         * @function zoom
         * @memberof AstroNavigation#
         * @param {float} delta Delta zoom
         * @param {float} scale Scale
         */
        AstroNavigation.prototype.zoom = function (delta, scale) {

            // TODO : improve zoom, using scale or delta ? We should use scale always
            if (scale) {
                this.renderContext.setFov(this.renderContext.getFov() * 1 / scale);
            }
            else {
                // Arbitrary value for smooth zooming
                this.renderContext.setFov(this.renderContext.getFov() * (1 + delta * 0.1));
            }

            this._clampFov();
            this.computeViewMatrix();
        };

        /**
         * Pan the navigation by computing the difference between 3D centers
         * @function pan
         * @memberOf AstroNavigation#
         * @param {int} dx Window delta x
         * @param {int} dy Window delta y
         */
        AstroNavigation.prototype.pan = function (dx, dy) {
            var x = this.renderContext.getCanvas().width / 2.0;
            var y = this.renderContext.getCanvas().height / 2.0;
            var ray = Ray.createFromPixel(this.renderContext, x - dx, y - dy);
            this.center3d = ray.computePoint(ray.sphereIntersect([0, 0, 0], this.ctx.getCoordinateSystem().getGeoide().getRadius()));
            this.computeViewMatrix();
        };

        /**
         * Rotates the navigation
         * @function rotate
         * @memberOf AstroNavigation#
         * @param {float} dx Window delta x
         * @param {float} dy Window delta y
         */
        AstroNavigation.prototype.rotate = function (dx, dy) {
            // constant tiny angle
            var angle = dx * 0.1 * Math.PI / 180.0;

            var rot = quat4.fromAngleAxis(angle, this.center3d);
            quat4.multiplyVec3(rot, this.up);

            this.computeViewMatrix();
        };

        /**
         * Clamping of fov
         * @function _clampFov
         * @memberOf AstroNavigation#
         * @private
         */
        AstroNavigation.prototype._clampFov = function () {
            if (this.renderContext.getFov() > this.maxFov) {
                this.renderContext.setFov(this.maxFov);
            }
            if (this.renderContext.getFov() < this.minFov) {
                this.renderContext.setFov(this.minFov);
            }
        };

        /**************************************************************************************************************/

        return AstroNavigation;

    });
