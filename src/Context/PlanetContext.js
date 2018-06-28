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
/**
 * Mizar is able to handle different types of context.
 * <p>
 * A context is a concept that brings together :
 * <ul>
 *     <li>a webGL {@link AbstractGlobe globe}</li>
 *     <li>a {@link AbstractCrs coordinate reference system}</li>
 *     <li>a {@link AbstractNavigation navigation}</li>
 * </ul>
 * <table border="1">
 *     <tr>
 *         <td><img src="../doc/images/nav_astro.png" width="200px"/></td>
 *         <td>{@link module:Context.SkyContext SkyContext}</td>
 *         <td>A context representing a sky</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/nav_planet.png" width="200px"/></td>
 *         <td>{@link module:Context.PlanetContext PlanetContext}</td>
 *         <td>A context representing a planet</td>
 *     </tr>
 *     <tr>
 *         <td></td>
 *         <td>{@link module:Context.GroundContext GroundContext}</td>
 *         <td>A context representing a planet's ground</td>
 *     </tr>
 * </table>
 *
 * The context is automatically instantiated by the method createContext from {@link Mizar}.
 * <br/>
 * In addition to the classes, a {@link module:Context.ContextFactory factory} and a {@link ContextManager context manager}
 * are availables to help for creating context. Once the context is created, the client can handle it by the use of its
 * {@link Context interface}.
 *
 * @module Context
 * @implements {Context}
 */
define(["jquery", "underscore-min", "../Utils/Utils", "./AbstractContext", "../Utils/Constants",
        "../Globe/GlobeFactory", "../Navigation/NavigationFactory", "../Services/ServiceFactory",
        "../Gui/Compass","../Gui/TimeTravel"],
    function ($, _, Utils, AbstractContext, Constants,
              GlobeFactory, NavigationFactory, ServiceFactory,
              Compass,TimeTravel) {

        /**
         * Planet context configuration
         * @typedef {Object} AbstractContext.planetContext
         * @property {float} [tileErrorTreshold=3]
         * @property {float} [continuousRendering=false]
         * @property {RenderContext} [renderContext] - Context rendering
         * @property {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} coordinateSystem - CRS configuration
         * @property {AbstractNavigation.planet_configuration|AbstractNavigation.flat_configuration} navigation - navigation configuration
         */

        /**
         * @name PlanetContext
         * @class
         * Virtual globe where the camera is outside the globe.
         * When an error happens at the initialisation, a message is displayed
         * @augments AbstractContext
         * @param {Mizar.configuration} mizarConfiguration - mizar configuration
         * @param {AbstractContext.planetContext} options - planet context configuration
         * @constructor
         * @memberOf module:Context
         */
        var PlanetContext = function (mizarConfiguration, options) {
            AbstractContext.prototype.constructor.call(this, mizarConfiguration, Constants.CONTEXT.Planet, options);
            var self = this;
            this.components = {
                "posTrackerInfo": true,
                "posTracker": true,
                "elevTracker": true,
                "compassDiv": true,
                "timeTravelDiv": true,
                "posTrackerInfoButton": true
            };

            var planetOptions = _createPlanetConfiguration.call(this, options);


            // Initialize planet
            try {
                this.globe = GlobeFactory.create(Constants.GLOBE.Planet, planetOptions);
                this.navigation = _createNavigation.call(this, this.getCoordinateSystem().isFlat(), options.navigation);
                this.initGlobeEvents(this.globe);

                ServiceFactory.create(Constants.SERVICE.PickingManager).init(this);

                this.setTimeTravelVisible(options.timeTravel && this.components.timeTravelDiv ? options.timeTravel : "timeTravelDiv", true);
            }
            catch (err) {
                this._showUpError(this, err);
            }

        };

        /**
         * Planet configuration data model
         * @typedef {Object} AbstractGlobe.dm_planet
         * @property {Object} canvas - canvas object
         * @property {int} tileErrorTreshold - tile error treshold
         * @property {boolean} continuousRendering - continuous rendering
         * @property {renderContext|null} renderContext - Rendering context
         * @property {AbstractCrs.crsFactory} coordinateSystem - Coordinate reference system of the planet
         * @property {string} shadersPath = "../../shaders/" - Shaders location
         * @property {boolean} lighting = false - Lighting
         * @property {float[]} backgroundColor = [0.0, 0.0, 0.0, 1.0] - Background color
         * @property {int} minFar = 0
         * @property {int[]} defaultColor = [200, 200, 200, 255] - Default color
         * @property {boolean} renderTileWithoutTexture = true
         * @property {function} publishEvent - Callback
         */

        /**
         * Create the navigation according to the isFlat parameter.
         * @param {boolean} isFlat - The globe is projected or in 3D
         * @param {AbstractNavigation.planet_configuration|AbstractNavigation.flat_configuration} navigationOpts - Options for navigation
         * @returns {FlatNavigation|PlanetNavigation} navigation
         * @private
         */
        function _createNavigation(isFlat, navigationOpts) {
            var navigationType;
            if (isFlat) {
                navigationType = Constants.NAVIGATION.FlatNavigation;
            } else {
                navigationType = Constants.NAVIGATION.PlanetNavigation;
            }

            return  NavigationFactory.create(navigationType, this, navigationOpts);
        }

        /**
         * Creates planet configuration
         * @param {Object} options
         * @param {int} [options.tileErrorTreshold = 3] - Tile error treshold
         * @param {boolean} [options.continuousRendering = false] - continuous rendering
         * @param {renderContext} [options.renderContext] - Rendering context
         * @param {AbstractCrs.crsFactory} options.coordinateSystem - Coordinate reference system of the planet
         * @returns {AbstractGlobe.dm_planet} Planet data model.
         * @private
         */
        function _createPlanetConfiguration(options) {
            var self = this;
            return {
                tileErrorTreshold: options.tileErrorTreshold || 3,
                continuousRendering: options.continuousRendering || false,
                renderContext: options.renderContext,
                canvas: this.canvas,
                isMobile : options.isMobile || false,
                coordinateSystem: options.coordinateSystem,
                shadersPath: this.mizarConfiguration.mizarAPIUrl+'shaders/',
                lighting: false,
                backgroundColor: [0.0, 0.0, 0.0, 1.0],
                minFar: 0,
                defaultColor: [200, 200, 200, 255],
                renderTileWithoutTexture: true,
                //todofl : redondance car params identiques
                publishEvent: function (message, object) {
                    self.publish(message, object);
                }
            }
        }

        /**
         * Computes GeoCenter according to the coordinate reference system.
         * @param {Crs} crs - coordinate reference system
         * @returns {float[]} geocenter
         * @private
         */
        function _computeGeoCenter(crs) {
            var geoCenter;
            if (crs.isFlat()) {
                geoCenter = crs.getWorldFrom3D(this.navigation.center);
            } else {
                geoCenter = this.navigation.geoCenter;
            }
            return geoCenter;
        }

        /**
         * Propagates navigation options (inertia and mouse) when the coordinate reference system changes.
         * @param {AbstractNavigation.configuration} options - Navigation configuration
         * @private
         * @returns {Object} navigation options
         */
        function _propagateNavOptions(options) {
            var navOptions = {};
            navOptions.inertia = options.hasOwnProperty("inertia") ? options.inertia : false;
            if(options.hasOwnProperty('mouse')) {
                navOptions.mouse = options.mouse;
            }
            return navOptions;
        }

        /**
         * Updates the navigation according to the new coordinate reference system and the current settings
         * of the previous coordinate reference system
         * @param {Crs} newCrs -  the new coordinate reference system
         * @param geoCenter - Current geo center of the camera in the previous coordinate reference system
         * @param geoDistance - Distance from the globe's surface of the camera in the previous coordinate reference system
         * @param {Object} navOptions - Navigation's options
         * @param {boolean} [navOptions.inertia=false] - Inertia
         * @param {Object} [navOptions.mouse] - Mouse's configuration
         * @private
         */
        function _updateNavForNewCrs(newCrs, geoCenter, geoDistance, navOptions) {
            if (newCrs.isFlat()) {
                this.navigation = NavigationFactory.create(Constants.NAVIGATION.FlatNavigation, this, navOptions);
                this.navigation.center = newCrs.get3DFromWorld(geoCenter);
            } else {
                this.navigation = NavigationFactory.create(Constants.NAVIGATION.PlanetNavigation, this, navOptions);
                this.navigation.geoCenter = geoCenter;
            }
            this.navigation.distance = geoDistance * newCrs.getGeoide().getHeightScale();
        }

        /**************************************************************************************************************/

        Utils.inherits(AbstractContext, PlanetContext);

        /**************************************************************************************************************/

        /**
         * @function setTimeTravelVisible
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.setTimeTravelVisible = function (divName, visible) {
            if (visible) {
                this.timeTravel = new TimeTravel({
                    element: divName,
                    ctx: this,
                    crs : this.getCoordinateSystem().getGeoideName()
                });
            } else {
                if (this.timeTravel) {
                    this.timeTravel.remove();
                }
            }
            this.setComponentVisibility(divName, visible);
        };

        /**
         * @function setBaseElevation
         * @memberOf PlanetContext#
         * @throws TypeError : The provided error is not a WCSElevation or a WMSElevation
         */
        PlanetContext.prototype.setBaseElevation = function (layer) {
            if(layer.getType() !== Constants.LAYER.WCSElevation && layer.getType() !== Constants.LAYER.WMSElevation ) {
                throw new TypeError("The provided layer ID="+layer.getID()+" has a type +"+layer.getType()+" instead of WCSElevation or WMSElevation", "PlanetContext.js");
            }
            this.globe.setBaseElevation(layer);
            if (this.elevationTracker != null) {
                this.elevationTracker.setScaleLayer(layer);
            }
        };

        /**
         * @function setBaseElevationByID
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.setBaseElevationByID = function (layerID) {
            // Find the layer by name among all the layers
            var layer = this.getLayerByID(layerID);
            if (layer) {
                this.setBaseElevation(layer);
            }
            return layer;
        };

        /**
         * @function getBaseElevation
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.getBaseElevation = function () {
            return this.globe.getBaseElevation();
        };

        /**
         * @function setCoordinateSystem
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.setCoordinateSystem = function (newCrs) {
            if (newCrs.getType() !== this.getMode()) {
                throw new RangeError("incompatible coordinate reference system with Planet context", "PlanetContext.js");
            }
            // Change navigation
            var geoCenter;
            var geoDistance;

            var self = this;
            $(self.canvas.parentElement).find('#loading').show();

            // Compute current position and distance in order to set them in the new navigation related to the
            // new coordinate reference system
            geoCenter = _computeGeoCenter.call(this, this.globe.getCoordinateSystem());
            geoDistance = this.navigation.distance / this.globe.getCoordinateSystem().getGeoide().getHeightScale();

            // Update the coordinate reference system
            this.globe.setCoordinateSystem(newCrs);
            this.navigation.stop();

            // Creates the options for the new navigation related to the new coordinate reference system.
            // We only keep the inertia and the options for the mouse
            var navOptions = _propagateNavOptions.call(this, this.navigation.getOptions());

            try {
                // Create a new navigation related to the new coordinate reference system
                _updateNavForNewCrs.call(this, newCrs, geoCenter, geoDistance, navOptions);
            } catch (err) {
                this._showUpError(this, err);
            }

            this.positionTracker.detach();
            this.positionTracker.attachTo(this);
            this.elevationTracker.detach();
            this.elevationTracker.attachTo(this);

            this.navigation.computeViewMatrix();
            this.publish(Constants.EVENT_MSG.CRS_MODIFIED, this);
        };

        /**
         * @function destroy
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.destroy = function () {
            //this.setTimeTravelVisible(false);
            AbstractContext.prototype.destroy.call(this);
        };

        /**************************************************************************************************************/
        return PlanetContext;

    });
