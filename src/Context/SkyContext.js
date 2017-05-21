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
define(["underscore-min", "../Utils/Utils",
        "./AbstractContext", "../Globe/GlobeFactory", "../Navigation/NavigationFactory", "../Services/ServiceFactory",
        "../Gui/Compass", "../Utils/Constants"],
    function (_, Utils,
              AbstractContext, GlobeFactory, NavigationFactory, ServiceFactory,
              Compass, Constants) {

        /**
         * sky context configuration
         * @typedef {Object} AbstractContext.skyContext
         * @property {float} [tileErrorTreshold=1.5]
         * @property {float} [continuousRendering=true]
         * @property {float} [radius = 10.0] - Vector distance of the sky
         * @property {int} [minFar = 15]
         * @property {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} coordinateSystem - CRS configuration
         * @property {RenderContext} [renderContext] - Context rendering
         * @property {AbstractNavigation.astro_configuration} navigation - navigation configuration
         * @property {string} [compass="compassDiv"] - div element where compass is displayed
         */

        /**
         * @name SkyContext
         * @class
         * Virtual globe where the camera is inside the globe.<br/>
         * When an error happens at the initialisation, a message is displayed
         * @augments AbstractContext
         * @param {Mizar.configuration} mizarConfiguration - mizar configuration
         * @param {AbstractContext.skyContext} options - skyContext configuration
         * @constructor
         * @memberOf module:Context
         */
        var SkyContext = function (mizarConfiguration, options) {
            AbstractContext.prototype.constructor.call(this, mizarConfiguration, Constants.CONTEXT.Sky, options);

            var self = this;
            this.components = {
                "posTracker": true,
                "elevTracker": false,
                "compassDiv": true
            };
            var skyOptions = _createSkyConfiguration.call(this, options);

            // Initialize sky
            try {
                // Create the sky
                this.globe = GlobeFactory.create(Constants.GLOBE.Sky, skyOptions);
                this.initGlobeEvents(this.globe);

                this.navigation = NavigationFactory.create(Constants.NAVIGATION.AstroNavigation, this, options.navigation ? options.navigation : options);

                ServiceFactory.create(Constants.SERVICE.PickingManager).init(this);

                this.setCompassVisible(options.compass && this.components.compassDiv ? options.compass : "compassDiv", true);

            }
            catch (err) {
                this._showUpError(this, err);
            }

        };

        /**
         * Planet configuration data model
         * @typedef {Object} AbstractGlobe.dm_sky
         * @property {Object} canvas - canvas object
         * @property {int} tileErrorTreshold - tile error treshold
         * @property {boolean} continuousRendering - continuous rendering
         * @property {renderContext} [renderContext] - Rendering context
         * @property {AbstractCrs.crsFactory} coordinateSystem - Coordinate reference system of the planet
         * @property {boolean} lighting = false - Lighting
         * @property {float[]} backgroundColor = [0.0, 0.0, 0.0, 1.0] - Background color
         * @property {int} minFar
         * @property {float} radius
         * @property {int[]} defaultColor = [200, 200, 200, 255] - Default color
         * @property {string} shadersPath = "../../shaders/" - Shaders location
         * @property {boolean} renderTileWithoutTexture = false
         * @property {function} publishEvent - Callback
         */

        /**
         * Creates planet configuration
         * @param {Object} options
         * @param {int} [options.tileErrorTreshold = 1.5] - Tile error treshold
         * @param {boolean} [options.continuousRendering = true] - continuous rendering
         * @param {renderContext} [options.renderContext] - Rendering context
         * @param {AbstractCrs.crsFactory} options.coordinateSystem - Coordinate reference system of the planet
         * @param {float} [options.radius = 10.0] - Radius object in vector length
         * @returns {AbstractGlobe.dm_sky} Planet data model.
         * @private
         */
        function _createSkyConfiguration(options) {
            var self = this;
            var skyOptions = {
                canvas: this.canvas,
                tileErrorTreshold: options.tileErrorTreshold || 1.5,
                continuousRendering: options.continuousRendering || true,
                renderTileWithoutTexture: false,
                radius: options.radius || 10.0,
                minFar: options.minFar || 15,		// Fix problem with far buffer, with planet rendering
                coordinateSystem: options.coordinateSystem,
                lighting: false,
                backgroundColor: [0.0, 0.0, 0.0, 1.0],
                defaultColor: [200, 200, 200, 255],
                shadersPath: this.mizarConfiguration['mizarAPIUrl']+'shaders/',
                publishEvent: function (message, object) {
                    self.publish(message, object);
                }
            };
            if (options.renderContext) {
                skyOptions.renderContext = options.renderContext;
            }
            return skyOptions;
        }
        

        /**************************************************************************************************************/

        Utils.inherits(AbstractContext, SkyContext);

        /**************************************************************************************************************/

        /**
         * @function setCompassVisible
         * @memberOf SkyContext#
         */
        SkyContext.prototype.setCompassVisible = function (divName, visible) {
            if (visible) {
                this.compass = new Compass({
                    element: divName,
                    ctx: this
                });
            } else {
                if (this.compass) {
                    this.compass.remove();
                }
            }
            this.setComponentVisibility(divName, visible);
        };


        /**
         * @function setCoordinateSystem
         * @memberOf SkyContext#
         */
        SkyContext.prototype.setCoordinateSystem = function (cs) {
            if (cs.getType() !== this.getMode()) {
                throw "incompatible coordinate reference system with Sky context";
            }
            this.globe.setCoordinateSystem(cs);
            this.publish("modifiedCrs", cs);
        };

        /**
         * @function destroy
         * @memberOf SkyContext#
         */
        SkyContext.prototype.destroy = function () {
            this.hide();
            this.compass.setCompassVisible(false);
            if(this.elevationTracker) {
                this.elevationTracker.detach();
            }
            if (this.positionTracker) {
                this.positionTracker.detach();
            }          
            this.removeAllLayers();
            this.globe.destroy();
            this.globe = null;
            this.layers = null;
            this.visibleLayers = null;
        };

        /**************************************************************************************************************/

        return SkyContext;

    });
