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
        "../Globe/GlobeFactory", "../Navigation/NavigationFactory", "../Services/ServiceFactory"],
    function ($, _, Utils, AbstractContext, Constants,
              GlobeFactory, NavigationFactory, ServiceFactory) {

        /**
         * Planet context configuration
         * @typedef {Object} AbstractContext.planetContext
         * @property {float} [tileErrorTreshold=3]
         * @property {float} [continuousRendering=false]
         * @property {RenderContext} [renderContext] - Context rendering
         * @property {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} coordinateSystem - CRS configuration
         * @property {PlanetLayer} [planetLayer] - planetLayer
         * @property {AbstractNavigation.astro_configuration|AbstractNavigation.planet_configuration|AbstractNavigation.flat_configuration} navigation - navigation configuration
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
                "posTracker": true,
                "elevTracker": true,
                "compassDiv": false
            };

            var planetOptions = {
                tileErrorTreshold: options.tileErrorTreshold || 3,
                continuousRendering: options.continuousRendering || false,
                renderContext: options.renderContext,
                canvas: this.canvas,
                coordinateSystem: options.coordinateSystem,
                shadersPath: "../../shaders/",
                lighting: false,
                backgroundColor: [0.0, 0.0, 0.0, 1.0],
                minFar: 0,
                defaultColor: [200, 200, 200, 255],
                renderTileWithoutTexture: true,
                publishEvent: function (message, object) {
                    self.publish(message, object);
                }
            };

            // Initialize planet
            try {
                this.globe = GlobeFactory.create(Constants.GLOBE.Planet, planetOptions);
                this.initGlobeEvents(this.globe);

                // Initialize planet context
                this.planetLayer = options.planetLayer;


                if (this.planetLayer) {
                    this.globe.addLayer(this.planetLayer);
                    this.layers = this.layers.concat(this.planetLayer.layers);
                    this.layers = this.layers.concat(this.planetLayer.baseImageries);
                }

                // Don't update view matrix on creation, since we want to use animation on context change
                //if (options.navigation) {
                //    options.navigation.updateViewMatrix = false;
                //}

                this.navigationOptions = options.navigation;

                this.navigation = NavigationFactory.create(
                    (this.getCoordinateSystem().isFlat()) ? Constants.NAVIGATION.FlatNavigation : Constants.NAVIGATION.PlanetNavigation,
                    this,
                    options.navigation
                );

                ServiceFactory.create(Constants.SERVICE.PickingManager).init(this);
            }
            catch (err) {
                console.log("Erreur creation Planet : ", err);
                if (document.getElementById('GlobWebCanvas')) {
                    document.getElementById('GlobWebCanvas').style.display = "none";
                }
                if (document.getElementById('loading')) {
                    document.getElementById('loading').style.display = "none";
                }
                if (document.getElementById('webGLNotAvailable')) {
                    document.getElementById('webGLNotAvailable').style.display = "block";
                }
            }

        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractContext, PlanetContext);

        /**************************************************************************************************************/

        /**
         * @function setCompassVisible
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.setCompassVisible = function (divName, visible) {
        };

        /**
         * @function setBaseElevation
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.setBaseElevation = function (layer) {
            this.globe.setBaseElevation(layer);
            this.elevationTracker.setScaleLayer(layer);
        };

        /**
         * @function setCoordinateSystem
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.setCoordinateSystem = function (cs) {
            if (cs.getType() !== this.getMode()) {
                throw "incompatible coordinate reference system with Planet context";
            }
            // Change navigation
            var geoCenter;
            var geoDistance;

            var self = this;
            $(self.canvas.parentElement).find('#loading').show();

            if (this.globe.getCoordinateSystem().isFlat()) {
                geoCenter = this.globe.getCoordinateSystem().getWorldFrom3D(this.navigation.center);
            } else {
                geoCenter = this.navigation.geoCenter;
            }
            geoDistance = this.navigation.distance / this.globe.getCoordinateSystem().getGeoide().getHeightScale();

            this.globe.setCoordinateSystem(cs);

            this.navigation.stop();

            // We propagate only inertia. The others options are related to the position and we
            // do not want to propagate them to keep the current settings
            var navOptions = {};
            navOptions.inertia = this.navigation.getOptions().hasOwnProperty("inertia") ? this.navigation.getOptions().inertia : false;
            if(this.navigation.getOptions().hasOwnProperty('mouse')) {
                navOptions.mouse = this.navigation.getOptions().mouse;
            }

            try {
                if (cs.isFlat()) {
                    this.navigation = NavigationFactory.create(Constants.NAVIGATION.FlatNavigation, this, navOptions);
                    this.navigation.center = this.globe.getCoordinateSystem().get3DFromWorld(geoCenter);
                } else {
                    this.navigation = NavigationFactory.create(Constants.NAVIGATION.PlanetNavigation, this, navOptions);
                    this.navigation.geoCenter = geoCenter;
                }
                this.navigation.distance = geoDistance * this.globe.getCoordinateSystem().getGeoide().getHeightScale();
            } catch (err) {
                console.log("Erreur creation Planet : ", err);
                if (document.getElementById('GlobWebCanvas')) {
                    document.getElementById('GlobWebCanvas').style.display = "none";
                }
                if (document.getElementById('loading')) {
                    document.getElementById('loading').style.display = "none";
                }
                if (document.getElementById('webGLNotAvailable')) {
                    document.getElementById('webGLNotAvailable').style.display = "block";
                }
            }

            this.navigation.computeViewMatrix();
            this.publish("modifiedCrs", cs);
        };

        /**
         * @function enable
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.enable = function () {
            var renderers = this.getRenderContext().renderers;
            for (var i = 0; i < renderers.length; i++) {
                if (renderers[i].isSky()) {
                    this.getRenderContext().renderers[0].enable();
                    break;
                }
            }
        };

        /**
         * @function disable
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.disable = function () {
            var renderers = this.getRenderContext().renderers;
            for (var i = 0; i < renderers.length; i++) {
                if (!renderers[i].isSky()) {
                    this.getRenderContext().renderers[0].disable();
                    break;
                }
            }
        };

        /**
         * @function destroy
         * @memberOf PlanetContext#
         */
        PlanetContext.prototype.destroy = function () {
            this.hide();
            if(this.elevationTracker) {
                this.elevationTracker.detach();
            }
            if (this.positionTracker) {
                this.positionTracker.detach();
            }
            this.planetLayer.setVisible(false);
            this.planetLayer._detach();
            for(var i=0;i<this.layers.length;i++) {
                var layerID = this.layers[i];
                this.removeLayer(layerID);
            }
            this.globe.destroy();
            this.globe = null;
            this.layers = [];
        };

        /**************************************************************************************************************/
        return PlanetContext;

    });
