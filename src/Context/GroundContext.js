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

define(["jquery", "underscore-min", "../Utils/Utils", "./AbstractContext", "../Utils/Constants",
        "../Globe/GlobeFactory", "../Navigation/NavigationFactory", "../Services/ServiceFactory"],
    function ($, _, Utils, AbstractContext, Constants,
              GlobeFactory, NavigationFactory, ServiceFactory) {

        var GroundContext = function (mizarConfiguration, options) {
            AbstractContext.prototype.constructor.call(this, mizarConfiguration, Constants.CONTEXT.Ground, options);
            var self = this;

            this.components = {
                "posTracker": true,
                "elevTracker": false,
                "compassDiv": false
            };

            var groundOptions = _createGroundConfiguration.call(this, options);

            // Initialize sky
            try {
                // Create the sky
                this.globe = GlobeFactory.create(Constants.GLOBE.Sky, groundOptions);
                this.initGlobeEvents(this.globe);

                this.navigation = NavigationFactory.create(Constants.NAVIGATION.GroundNavigation, this, options.navigation ? options.navigation : options);

                ServiceFactory.create(Constants.SERVICE.PickingManager).init(this);

                //this.setCompassVisible(options.compass && this.components.compassDiv ? options.compass : "compassDiv", true);

            }
            catch (err) {
                this._showUpError(this, err);
            }
        };

        function _createGroundConfiguration(options) {
            var self = this;
            return {
                tileErrorTreshold: options.tileErrorTreshold || 3,
                continuousRendering: options.continuousRendering || false,
                renderContext: options.renderContext,
                canvas: this.canvas,
                coordinateSystem: options.coordinateSystem,
                shadersPath: this.mizarConfiguration['mizarAPIUrl']+'shaders/',
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

        /**************************************************************************************************************/

        Utils.inherits(AbstractContext, GroundContext);

        /**************************************************************************************************************/

        GroundContext.prototype.setCoordinateSystem = function (cs) {
            if (cs.getType() !== this.getMode()) {
                throw "incompatible coordinate reference system with Sky context";
            }
            this.globe.setCoordinateSystem(cs);
            this.publish("modifiedCrs", cs);
        };

        GroundContext.prototype.destroy = function () {
            //this.setCompassVisible(false);
            AbstractContext.prototype.destroy.call(this);
        };

        /**************************************************************************************************************/

        return GroundContext;

    });