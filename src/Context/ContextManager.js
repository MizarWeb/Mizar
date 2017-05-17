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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
define(["jquery", "./ContextFactory", "../Crs/CoordinateSystemFactory", "../Utils/Stats", "../Renderer/glMatrix"],
    function ($, ContextFactory, CoordinateSystemFactory, Stats) {

        /**
         * @constant
         * @type {number}
         */
        const ANGLE_CAMERA_POLE = 30.0;

        /**
         * @name ContextManager
         * @class
         * Creates a context manager to handle contexts.
         * @param {Mizar} mizarAPI
         * @constructor
         */
        var ContextManager = function (mizarAPI) {
            this.mizarAPI = mizarAPI;
            this.skyContext = null;
            this.planetContext = null;
            this.activatedContext = null;
            this.renderContext = null;
        };

        /**
         * Switch from a planet to sky
         * @function _switchPlanet2Sky
         * @memberOf ContextManager#
         * @private
         */
        function _switchPlanet2Sky() {
            var self = this;
            // Hide planet
            this.getActivatedContext().hide();

            // Hide all additional layers
            this.getActivatedContext().hideAdditionalLayers();

            // change the context
            this.setActivatedContext(this.mizarAPI.CONTEXT.Sky);

            // Add smooth animation from planet context to sky context
            this.planetContext.navigation.toViewMatrix(this._oldVM, this._oldFov,
                2000, function () {
                    // Show all additional layers
                    self.getActivatedContext().showAdditionalLayers();
                    self.getScene().renderContext.tileErrorTreshold = 1.5;
                    self.mizarAPI.publish("mizarMode:toggle", self.activatedContext);


                    // Destroy planet context
                    self.planetContext.destroy();
                    // Show sky
                    self.getActivatedContext().show();
                    self.getScene().refresh();
                    self.getActivatedContext().getPositionTracker().attachTo(self.getScene());

                });
        }

        /**
         * Switch sky to planet
         * @param {PlanetLayer} gwLayer - planet layer
         * @param {AbstractContext.planetContext} options - options for planet context
         * @function _switchSky2Planet
         * @memberOf ContextManager#
         * @private
         */
        function _switchSky2Planet(gwLayer, options) {

            var self = this;

            // Create planet context (with existing sky render context)
            var planetConfig = $.extend({}, options);
            planetConfig.planetLayer = gwLayer;
            planetConfig.coordinateSystem = gwLayer.coordinateSystem;
            planetConfig.renderContext = this.getRenderContext();
            planetConfig.renderContext.shadersPath = "../../Mizar/shaders/";

            // Hide sky
            this.getActivatedContext().hide();

            // Hide all additional layers
            this.getActivatedContext().hideAdditionalLayers();

            // Create the planetary context and use it as default
            this.createContext(this.mizarAPI.CONTEXT.Planet, planetConfig);

            // Store old view matrix & fov to be able to rollback to sky context
            this._oldVM = this.getRenderContext().getViewMatrix();
            this._oldFov = this.getRenderContext().getFov();

            if (!this.getActivatedContext().getCoordinateSystem().isFlat()) {
                //Compute planet view matrix
                var planetVM = mat4.create();
                this.getNavigation().computeInverseViewMatrix();
                mat4.inverse(this.getNavigation().inverseViewMatrix, planetVM);

                // Add smooth animation from sky context to planet context
                this.getNavigation().toViewMatrix(planetVM, 90, 2000, function () {
                    self.getActivatedContext().show();
                    self.refresh();
                    self.mizarAPI.publish("mizarMode:toggle", self.activatedContext);
                });
            }
            else {
                this.getActivatedContext().show();
                this.refresh();
                this.mizarAPI.publish("mizarMode:toggle", self.activatedContext);
            }
        }

        /**
         * Saves the atmosphere state and disable it when 2D is used
         * @function _disableAtmosphere
         * @memberOf ContextManager#
         * @private
         */
        function _disableAtmosphere() {
            if (this.activatedContext._atmosphereLayer !== undefined) {
                if (this.activatedContext._atmosphereLayer.globe !== null) {
                    this.activatedContext._saveAtmosphereVisible = this.activatedContext._atmosphereLayer.visible;
                    this.activatedContext._atmosphereLayer.setVisible(false);
                    this.render();
                }
            }
        }

        /**
         * Retrieves the atmosphere and enable it when 3D is used
         * @function _enableAtmosphere
         * @memberOf ContextManager#
         * @private
         */
        function _enableAtmosphere() {
            if (this.activatedContext._atmosphereLayer !== undefined) {
                if (this.activatedContext._atmosphereLayer.globe !== null) {
                    this.activatedContext._atmosphereLayer.setVisible(this.activatedContext._saveAtmosphereVisible);
                    this.render();
                }
            }
        }

        /**
         * Switch 2D to 3D.
         * @function _switch2Dto3D
         * @memberOf ContextManager#
         * @private
         */
        function _switch2Dto3D() {
            _enableAtmosphere.call(this);

            // Enable skyContext behind the planet
            this.skyContext.enable();

            this.setCrs({geoideName: this.getCrs().getGeoideName()});

            // Check zoom level
            this.planetContext.navigation.zoom(0);
        }

        /**
         * Switch 3D to 2D.
         * @function _switch3Dto2D
         * @memberOf ContextManager#
         * @private
         */
        function _switch3Dto2D() {
            _disableAtmosphere.call(this);

            // Disable skyContext
            this.skyContext.disable();

            // If a pole is closed to the center of the canvas, this should mean that
            // the user is interested to the pole, so we switch to azimuth projection
            // instead of plate carrée projection
            _project2AzimuthOrPlate.call(this, this.activatedContext.navigation.getCenter());
        }

        /**
         * Selects the right projection according to the target of the camera.<br/>
         * When the angle of the target of the camera with a pole (north or south)
         * is inferior to ANGLE_CAMERA_POLE, then the azimuthal projection is selected
         * otherwise plate carrée is selected
         * @param {float[]} lookAt - target of the camera [longitude, latitude] in decimal degree
         * @function _project2AzimuthOrPlate
         * @memberOf ContextManager#
         * @private
         */
        function _project2AzimuthOrPlate(lookAt) {
            if (lookAt !== null && 90 - Math.abs(lookAt[1]) <= ANGLE_CAMERA_POLE) {
                this.setCrs({
                    geoideName: this.getCrs().getGeoideName(),
                    projectionName: this.mizarAPI.PROJECTION.Azimuth,
                    pole: (Math.sign(lookAt[1]) > 0) ? "north" : "south"
                });
            } else {
                this.setCrs({
                    geoideName: this.getCrs().getGeoideName(),
                    projectionName: this.mizarAPI.PROJECTION.Plate
                });
            }
        }

        /**
         * Skip if sky mode
         * @function _skipIfSkyMode
         * @memberOf ContextManager#
         * @throws "Not implemented"
         * @private
         */
        function _skipIfSkyMode() {
            if (this.getMode() === this.mizarAPI.CONTEXT.Sky) {
                throw "Not implemented";
            }
        }

        /**********************************************************************************************************/

        /**
         * MizarMode:toggle event.
         * Called when the context changes
         * @event Mizar#mizarMode:toggle
         * @type {Context}
         */

        /**
         * plugin:not_found event.
         * Called when a plugin is not found
         * @event Mizar#plugin:not_found
         * @type {string}
         */

        /**
         * Subscribes to an event.
         * @param message event's message
         * @param object information related to the message
         * @function subscribe
         * @memberOf ContextManager#
         */
        ContextManager.prototype.subscribe = function (message, object) {
            this.activatedContext.subscribe(message, object);
        };

        /**
         * Unsubscribes to an event
         * @param message event's message
         * @param object information related to the message
         * @function unsubscribe
         * @memberOf ContextManager#
         */
        ContextManager.prototype.unsubscribe = function (message, object) {
            this.activatedContext.unsubscribe(message, object);
        };

        /**
         * Returns the mode of the context : either Planet or Sky
         * @returns {CONTEXT} the mode - the context's type
         * @function getMode
         * @memberOf ContextManager#
         */
        ContextManager.prototype.getMode = function () {
            return this.activatedContext.getMode();
        };

        /**
         * Creates a context according to the context mode.
         * @param {CONTEXT} contextMode contextMode
         * @param {AbstractContext.skyContext|AbstractContext.planetContext} options - Options for the context, See options.planetContext or options.skycontext configuration for {@link Mizar}
         * @throws {RangeError} contextMode not valid - a valid contextMode is included in the list {@link CONTEXT}
         * @function createContext
         * @memberOf ContextManager#
         * @fires Mizar#mizarMode:toggle
         */
        ContextManager.prototype.createContext = function (contextMode, options) {
            options.renderContext = this.mizarAPI.getOptions().renderContext;
            this.activatedContext = this.mizarAPI.ContextFactory.create(contextMode, this.mizarAPI.getOptions(), options);
            switch(contextMode) {
                case this.mizarAPI.CONTEXT.Sky:
                    this.skyContext = this.activatedContext;
                    break;
                case this.mizarAPI.CONTEXT.Planet:
                    this.planetContext = this.activatedContext;
                    break;
                default:
                    throw new RangeError("Unknown contextMode '"+contextMode+"'", "ContextManager.js");
            }
            this.mizarAPI.getOptions().renderContext = this.activatedContext.globe.renderContext;
            this.mizarAPI.publish("mizarMode:toggle", this.activatedContext);
        };

        /**
         * Returns the sky context.
         * @returns {SkyContext|null}
         * @function getSkyContext
         * @memberOf ContextManager#
         */
        ContextManager.prototype.getSkyContext = function () {
            return this.skyContext;
        };

        /**
         * Returns the planet context.
         * @returns {PlanetContext|null}
         * @function getPlanetContext
         * @memberOf ContextManager#
         */
        ContextManager.prototype.getPlanetContext = function () {
            return this.planetContext;
        };

        /**
         * Returns the activated context
         * @returns {PlanetContext|SkyContext}
         * @function getActivatedContext
         * @memberOf ContextManager#
         */
        ContextManager.prototype.getActivatedContext = function () {
            return this.activatedContext;
        };

        /**
         * Refreshes the context.
         * @function refresh
         * @memberOf ContextManager#
         */
        ContextManager.prototype.refresh = function () {
            this.activatedContext.refresh();
        };

        /**
         * Returns the rendering context.
         * @returns {RenderContext} the rendering context
         * @function getRenderContext
         * @memberOf ContextManager#
         */
        ContextManager.prototype.getRenderContext = function () {
            return this.activatedContext.getRenderContext();
        };

        /**
         * Returns the coordinate reference system.
         * @returns {Crs} the crs
         * @function getCrs
         * @memberOf ContextManager#
         */
        ContextManager.prototype.getCrs = function () {
            return this.activatedContext.getCoordinateSystem();
        };

        /**
         * Sets the coordinate reference system
         * @param {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} coordinateSystem - coordinate system description
         * @function setCrs
         * @memberOf ContextManager#
         */
        ContextManager.prototype.setCrs = function (coordinateSystem) {
            var crs = CoordinateSystemFactory.create(coordinateSystem);
            this.activatedContext.setCoordinateSystem(crs);
        };

        /**
         * Adds an animation.
         * @function addAnimation
         * @param {Animation} anim - the animation to add
         * @memberOf ContextManager#
         */
        ContextManager.prototype.addAnimation = function (anim) {
            this.activatedContext.addAnimation(anim);
        };

        /**
         * Removes an animation.
         * @function removeAnimation
         * @param {Animation} anim - the animation to remove
         * @memberOf ContextManager#
         */
        ContextManager.prototype.removeAnimation = function (anim) {
            this.activatedContext.removeAnimation(anim);
        };

        /**
         * Renders the canvas.
         * @function render
         * @memberOf ContextManager#
         */
        ContextManager.prototype.render = function () {
            this.getRenderContext().frame();
        };

        /**
         * Disposes Mizar
         * @function dispose
         * @memberOf ContextManager#
         */
        ContextManager.prototype.dispose = function () {
            if (this.planetContext) {
                this.planetContext.dispose();
            }
            if (this.skyContext) {
                this.skyContext.dispose();
            }
        };

        /**
         * Destroys the context manager
         * @function destroy
         * @memberOf ContextManager#
         */
        ContextManager.prototype.destroy = function () {
            if (this.planetContext) {
                this.planetContext.destroy();
            }
            if (this.skyContext) {
                this.skyContext.destroy();
            }
            this.planetContext = null;
            this.skyContext = null;
            this.activatedContext = null;
            this.renderContext = null;
        };

        /**
         * Creates and get Stats Object
         * @function createStats
         * @param options Configuration properties for stats. See {@link Stats} for options
         * @return {Stats}
         * @memberOf ContextManager#
         */
        ContextManager.prototype.createStats = function (options) {
            if (this.skyContext) {
                this.Stats = new Stats(this.skyContext, options);
            } else if (this.planetContext) {
                this.Stats = new Stats(this.planetContext, options);
            } else {
                console.log("No context");
            }
        };

        /**
         * Returns the scene
         * @returns {Globe}
         * @function getScene
         * @memberOf ContextManager#
         */
        ContextManager.prototype.getScene = function () {
            return this.activatedContext.globe;
        };

        /**
         * Switches 2D <--> 3D
         * @function toggleDimension
         * @memberOf ContextManager#
         * @throws "Not implemented" - Will throw an exception for Sky mode. In this version, the sky cannot be projected in 2D
         */
        ContextManager.prototype.toggleDimension = function () {
            _skipIfSkyMode.call(this);
            if (this.getCrs().isFlat()) {
                // we are in 2D and we are going to 3D
                _switch2Dto3D.call(this);
            } else {
                // we are in 3D and we are goint to 2D
                _switch3Dto2D.call(this);
            }
            this.render();
        };

        /**
         * Sets the activated context according to the context mode
         * @param {CONTEXT} contextMode
         * @fires Mizar#mizarMode:toggle
         * @function setActivatedContext
         * @memberOf ContextManager#
         * @throws {RangeError} contextMode not valid - a valid contextMode is included in the list {@link CONTEXT}
         */
        ContextManager.prototype.setActivatedContext = function (contextMode) {
            switch (contextMode) {
                case this.mizarAPI.CONTEXT.Planet:
                    this.activatedContext = this.planetContext;
                    break;
                case this.mizarAPI.CONTEXT.Sky:
                    this.activatedContext = this.skyContext;
                    break;
                default:
                    throw RangeError("The contextMode " + contextMode + " is not allowed, A valid contextMode is included in the list Constants.CONTEXT", "ContextManager.js");
            }
            this.mizarAPI.publish("mizarMode:toggle", this.activatedContext);
        };

        /**
         * Callback after the context switches.
         * @callback toggleContextCallback
         * @param {ContextManager} contextManager
         */

        /**
         * Switch from a context to another one.
         * @param {PlanetLayer} gwLayer - planet layer
         * @param {AbstractContext.planetContext} options - options for the planet
         * @param {toggleContextCallback} callback - Call at the end of the toggle
         * @fires Mizar#mizarMode:toggle
         * @function toggleContext
         * @memberOf ContextManager#
         */
        ContextManager.prototype.toggleContext = function (gwLayer, options, callback) {
            var toggleMode = (this.getMode() === this.mizarAPI.CONTEXT.Sky) ? this.mizarAPI.CONTEXT.Planet : this.mizarAPI.CONTEXT.Sky;
            var self = this;

            if (toggleMode === this.mizarAPI.CONTEXT.Sky) {
                _switchPlanet2Sky.call(this);
            } else {
                _switchSky2Planet.call(this, gwLayer, options);
            }
            if (callback) {
                callback.call(self);
            }
        };

        /**
         * Returns the navigation.
         * @returns {AbstractNavigation}
         * @function getNavigation
         * @memberOf ContextManager#
         */
        ContextManager.prototype.getNavigation = function () {
            return this.activatedContext.getNavigation();
        };

        return ContextManager;

    });
