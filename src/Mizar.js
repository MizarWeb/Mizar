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
 * @fileOverview Entry point for the {@link Mizar MIZAR API}
 * @version 1.0 (beta)
 * @author CNES
 */
define(["jquery", "underscore-min",
        "./Context/ContextFactory", "./Navigation/NavigationFactory", "./Layer/LayerFactory", "./Crs/CoordinateSystemFactory",
        "./Animation/AnimationFactory", "./Utils/UtilityFactory", "./Services/ServiceFactory", "./Provider/ProviderFactory",
        "./Utils/Utils", "./Utils/Event", "./Utils/Stats", "./Utils/Constants", "./Gui/dialog/ErrorDialog", "./Layer/HipsMetadata"],
    function ($, _,
              ContextFactory, NavigationFactory, LayerFactory, CoordinateSystemFactory,
              AnimationFactory, UtilityFactory, ServiceFactory, ProviderFactory,
              Utils, Event, Stats, Constants, ErrorDialog, HipsMetadata) {

        //TODO bug : shortest path
        //TODO : charger cratere Mars et l'afficher à un certain niveau de zoom
        //TODO : addLayer

        /**
         * @constant
         * @type {string}
         */
        const API_VERSION = "1.0.0";

        /**
         * @constant
         * @type {number}
         */
        const ANGLE_CAMERA_POLE = 30.0;

        /**
         * @constant
         * @type {string}
         */
        const MIZAR_NAME_PROD = "Mizar.min";

        /**
         * @constant
         * @type {string}
         */
        const MIZAR_NAME_DEV = "Mizar.";

        /**
         * Input Mizar parameters
         * @typedef {Object} Mizar.inputParameters
         * @property {Object|string} canvas - div ID or div element
         * @property {Mizar.inputConfiguration} [configuration] - Mizar global configuration
         * @property {AbstractContext.skyContext} [skyContext] - Sky context configuration
         * @property {AbstractContext.planetContext} [planetContext] - Planet context configuration
         */

        /**
         * Mizar parameters
         * @typedef {Object} Mizar.parameters
         * @property {Object|string} canvas - div ID or div element
         * @property {Mizar.configuration} [configuration] - Mizar global configuration
         * @property {AbstractContext.skyContext} [skyContext] - Sky context configuration
         * @property {AbstractContext.planetContext} [planetContext] - Planet context configuration
         */

        /**
         * Mizar configuration
         * @typedef {Object} Mizar.inputConfiguration
         * @property {string} [mizarBaseUrl] - Used to access to MizarWidget resources
         * @property {boolean} [debug = false] - Debug mode
         * @property {boolean} [isMobile = false] - Mobile support
         * @property {AbstractTracker.position_configuration} [positionTracker] - Position tracker configuration
         * @property {AbstractTracker.elevation_configuration} [elevationTracker] - Elevation tracker configuration
         * @property {Object} [registry] - Hips service registry
         * @property {string} registry.hips - Hips Registry
         */

        /**
         * Mizar configuration
         * @typedef {Mizar.inputConfiguration} Mizar.configuration
         * @property {string} mizarAPIUrl - URL of this script, used to reference shaders and CSS of Mizar API
         */

        /**
         * @name Mizar
         * @class
         * Creates an instance of the Mizar API.
         * @param {Mizar.inputParameters} options - Configuration for Mizar
         * @constructor
         */
        var Mizar = function (options) {
            Event.prototype.constructor.call(this);

            _checkConfiguration(options);
            this.options = _createConfiguration(options);

            // Init all factories
            /**
             * Creates a {@link module:Context.ContextFactory Context}
             * @name ContextFactory
             * @memberOf Mizar#
             * @private
             */
            this.ContextFactory = ContextFactory;

            /**
             * Creates a {@link module:Layer.LayerFactory Layer}
             * @name LayerFactory
             * @memberOf Mizar#
             * @private
             */
            this.LayerFactory = LayerFactory;

            // Set proxy parameters to Layer factory
            this.LayerFactory.proxy = {
              url : this.options.configuration.proxyUrl,
              use : this.options.configuration.proxyUse
            };

            proxy = this.LayerFactory.proxy;

            /**
             * Creates an {@link module:Animation.AnimationFactory animation}
             * @name AnimationFactory
             * @memberOf Mizar#
             */
            this.AnimationFactory = AnimationFactory;

            /**
             * Creates a service
             * @name ServiceFactory
             * @memberOf Mizar#
             */
            this.ServiceFactory = ServiceFactory;

            /**
             * Creates an utility
             * @name UtilityFactory
             * @memberOf Mizar#
             * @private
             */
            this.UtilityFactory = UtilityFactory;

            /**
             * Creates a provider
             * @name ProviderFactory
             * @memberOf Mizar#
             */
            this.ProviderFactory = ProviderFactory;

            this.skyContext = null;
            this.planetContext = null;
            this.activatedContext = null;
            this.renderContext = null;
            this.dataProviders = {};

            if (options.skyContext) {
                this.createContext(Mizar.CONTEXT.Sky, options.skyContext);
            }

            if (options.planetContext) {
                this.createContext(Mizar.CONTEXT.Planet, options.planetContext);
            }

        };

        /**********************************************************************************************************
         *                                      Static variables
         **********************************************************************************************************/

        /**
         * Static variable, API version.<br/>
         * [SemVer]{@link http://semver.org/} concept is used for versioning
         * @name VERSION
         * @memberOf Mizar#
         */
        Mizar.VERSION = API_VERSION;

        /**
         * Static variable, supported {@link ANIMATION animation} type
         * @name ANIMATION
         * @memberOf Mizar#
         */
        Mizar.ANIMATION = Constants.ANIMATION;

        /**
         * Static variable, supported {@link LAYER layer} type
         * @name LAYER
         * @memberOf Mizar#
         */
        Mizar.LAYER = Constants.LAYER;

        /**
         * Static variable, supported {@link GEOMETRY geometry} type
         * @name GEOMETRY
         * @memberOf Mizar#
         */
        Mizar.GEOMETRY = Constants.GEOMETRY;

        /**
         * Static variable, supported {@link NAVIGATION navigation} type
         * @name NAVIGATION
         * @memberOf Mizar#
         */
        Mizar.NAVIGATION = Constants.NAVIGATION;

        /**
         * Static variable, supported {@link CONTEXT context} type
         * @name CONTEXT
         * @memberOf Mizar#
         */
        Mizar.CONTEXT = Constants.CONTEXT;

        /**
         * Static variable, supported {@link PROJECTION projection} type
         * @name PROJECTION
         * @memberOf Mizar#
         */
        Mizar.PROJECTION = Constants.PROJECTION;

        /**
         * Static variable, supported {@link CRS coordinate reference system} type
         * @name CRS
         * @memberOf Mizar#
         */
        Mizar.CRS = Constants.CRS;

        /**
         * Static variable, supported {@link SERVICE service} type
         * @name SERVICE
         * @memberOf Mizar#
         */
        Mizar.SERVICE = Constants.SERVICE;

        /**
         * Static variable, supported {@link UTILITY utility} type
         * @name UTILITY
         * @memberOf Mizar#
         */
        Mizar.UTILITY = Constants.UTILITY;

        /**
         * Static variable, supported {@link PROVIDER provider} type
         * @name PROVIDER
         * @memberOf Mizar#
         */
        Mizar.PROVIDER = Constants.PROVIDER;


        /**********************************************************************************************************
         *                                      Private methods
         **********************************************************************************************************/

        /**
         * Returns the script object that contains the URL of this script
         * @param {Object[]} scripts - All the scripts from the document where Mizar is imported
         * @param {MIZAR_NAME_PROD|MIZAR_NAME_DEV} scriptName - production or dev script name
         * @param {int} index - Number of range '/' to remove from the end of the URL
         * @private
         */
        function _extractURLFrom(scripts, scriptName, index) {
            var mizarSrc =  _.find(scripts, function (script) {
                return (script.src.indexOf(scriptName) !== -1);
            });
            if(mizarSrc) {
                mizarSrc =  mizarSrc.src.split('/').slice(0, index).join('/') + '/';
            }
            return mizarSrc;
        }

        /**
         * Return the base URL of this script.
         * @returns {string} the base URL
         * @private
         */
        function _getMizarAPIBaseURL() {
            var scripts = document.getElementsByTagName('script');
            return _extractURLFrom.call(this, scripts, MIZAR_NAME_PROD, -1) || _extractURLFrom.call(this, scripts, MIZAR_NAME_DEV, -2);
        }

        /**
         * Checks inputs
         * @param {Object} options - Mizar configuration
         * @throw ReferenceError - No option found or canvas not defined
         * @throw ReferenceError - No option found or canvas not defined
         * @function _checkConfiguration
         * @memberOf Mizar#
         * @private
         */
        function _checkConfiguration(options) {
            if (typeof options === 'undefined') {
                throw new ReferenceError('No option found', 'Mizar.js');
            } else if (typeof options.canvas === 'undefined') {
                throw new ReferenceError('Canvas not defined', 'Mizar.js');
            } else {
                // do nothing
            }
        }

        /**
         * Checks inputs from user and creates the mizar configuration
         * @param {Mizar.inputParameters} options inputs from user
         * @returns {Mizar.parameters} mizar configuration.
         * @function _createConfiguration
         * @memberOf Mizar#
         * @private
         */
        function _createConfiguration(options) {

            var mizarAPIUrl = _getMizarAPIBaseURL();
            var mizarOptions = {
                canvas: typeof options.canvas === "string" ? document.getElementById(options.canvas) : options.canvas
            };
            if (options.hasOwnProperty('configuration')) {
                mizarOptions['configuration'] = options.configuration;
            } else {
                mizarOptions['configuration'] = {};
            }
            mizarOptions['configuration']['mizarAPIUrl'] = mizarAPIUrl;
            if (options.hasOwnProperty('skyContext')) {
                mizarOptions['skyContext'] = options.skyContext;
            }

            if (options.hasOwnProperty('planetContext')) {
                mizarOptions['planetContext'] = options.planetContext;
            }
            return mizarOptions;
        }

        /**
         * Switch from a planet to sky
         * @function _switchPlanet2Sky
         * @memberOf Mizar#
         * @private
         */
        function _switchPlanet2Sky() {
            var self = this;
            // Hide planet
            this.activatedContext.hide();

            // Hide all additional layers <!-- cannot use it because of PlanetLayer -->
            //this.activatedContext.hideAdditionalLayers();

            // change the context
            this.setActivatedContext(Mizar.CONTEXT.Sky);

            // Add smooth animation from planet context to sky context
            this.planetContext.navigation.toViewMatrix(this._oldVM, this._oldFov,
                2000, function () {
                    // Show all additional layers
                    self.activatedContext.showAdditionalLayers();
                    self.activatedContext.getRenderContext().tileErrorTreshold = 1.5;
                    self.publish("mizarMode:toggle", self.activatedContext);


                    // Destroy planet context
                    self.planetContext.destroy();

                    // Show sky
                    self.activatedContext.show();
                    self.activatedContext.refresh();
                    self.activatedContext.getPositionTracker().attachTo(self.activatedContext.globe);

                });
        }

        /**
         * Switch sky to planet
         * @param {PlanetLayer} gwLayer - planet layer
         * @param {AbstractContext.planetContext} options - options for planet context
         * @function _switchSky2Planet
         * @memberOf Mizar#
         * @private
         */
        function _switchSky2Planet(gwLayer, options) {

            var self = this;

            // Create planet context (with existing sky render context)
            var planetConfig = $.extend({}, options);
            planetConfig.planetLayer = gwLayer;
            planetConfig.coordinateSystem = gwLayer.coordinateSystem;
            planetConfig.renderContext = this.getRenderContext();

            // Hide sky
            this.activatedContext.hide();

            // Hide all additional layers
            this.activatedContext.hideAdditionalLayers();

            // Create the planetary context and use it as default
            this.createContext(Mizar.CONTEXT.Planet, planetConfig);

            // Store old view matrix & fov to be able to rollback to sky context
            this._oldVM = this.renderContext.getViewMatrix();
            this._oldFov = this.renderContext.getFov();

            if (!this.activatedContext.getCoordinateSystem().isFlat()) {
                //Compute planet view matrix
                var planetVM = mat4.create();
                this.activatedContext.getNavigation().computeInverseViewMatrix();
                mat4.inverse(this.activatedContext.getNavigation().inverseViewMatrix, planetVM);

                // Add smooth animation from sky context to planet context
                this.activatedContext.getNavigation().toViewMatrix(planetVM, 90, 2000, function () {
                    self.activatedContext.show();
                    self.activatedContext.refresh();
                    self.publish("mizarMode:toggle", self.activatedContext);
                });
            }
            else {
                this.activatedContext.show();
                this.activatedContext.refresh();
                this.publish("mizarMode:toggle", self.activatedContext);
            }
        }

        /**
         * Saves the atmosphere state and disable it when 2D is used
         * @function _disableAtmosphere
         * @memberOf Mizar#
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
         * @memberOf Mizar#
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
         * @memberOf Mizar#
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
         * @memberOf Mizar#
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
         * @memberOf Mizar#
         * @private
         */
        function _project2AzimuthOrPlate(lookAt) {
            if (lookAt !== null && 90 - Math.abs(lookAt[1]) <= ANGLE_CAMERA_POLE) {
                this.setCrs({
                    geoideName: this.getCrs().getGeoideName(),
                    projectionName: Mizar.PROJECTION.Azimuth,
                    pole: (Math.sign(lookAt[1]) > 0) ? "north" : "south"
                });
            } else {
                this.setCrs({
                    geoideName: this.getCrs().getGeoideName(),
                    projectionName: Mizar.PROJECTION.Plate
                });
            }
        }

        /**
         * Skip if sky mode
         * @function _skipIfSkyMode
         * @memberOf Mizar#
         * @throws "Not implemented"
         * @private
         */
        function _skipIfSkyMode() {
            if (this.activatedContext.getMode() === Mizar.CONTEXT.Sky) {
                throw "Not implemented";
            }
        }

        /**
         * Get service url from HIPS Layer
         * @function _getHipsServiceUrlArray
         * @memberOf Mizar#
         * @param hipsLayer
         * @returns {Array}
         * @private
         */
        function _getHipsServiceUrlArray(hipsLayer) {
            var hipsServiceUrlArray = [];

            if (hipsLayer.hips_service_url) {
                hipsServiceUrlArray.push(hipsLayer.hips_service_url);
            }
            if (hipsLayer.hips_service_url_1) {
                hipsServiceUrlArray.push(hipsLayer.hips_service_url_1);
            }
            if (hipsLayer.hips_service_url_2) {
                hipsServiceUrlArray.push(hipsLayer.hips_service_url_2);
            }
            return hipsServiceUrlArray;
        }

        /**
         * Proxify an url
         * @function _proxify
         * @memberOf Mizar#
         * @param {String} url - URL
         * @return {String} Url proxified
         * @private
         */
         function _proxify(url) {
           if (proxy.use === true) {
             return proxy.url + url;
           };
           return url;
         }

        /**
         * Loads HIPS layers from passed service url
         * @function _checkHipsServiceIsAvailable
         * @memberOf Mizar#
         * @param {Array} hipsServiceUrlArray - HIPS service URL
         * @param {serviceRegistryCallback} callback - The callback that handles the response
         * @private
         */
        function _checkHipsServiceIsAvailable(hipsServiceUrlArray, callback) {
            if (hipsServiceUrlArray.length === 0) {
                return callback(undefined);
            }
            var url = hipsServiceUrlArray.shift();

            $.ajax({
                type: 'GET',
                url: _proxify(url) + "/properties",
                dataType: 'text'
                //context: layerManager,
                //timeout: 10000
            }).done(function (data, status, xhr) {
                if (xhr.status === 200) {
                    return callback(url);
                }
            }).error(function () {
                _checkHipsServiceIsAvailable(hipsServiceUrlArray, callback);
            });
        }

        /**
         * Loads HIPS layers from passed service url
         * @function _loadHIPSLayers
         * @memberOf Mizar#
         * @param {Mizar} Mizar - Mizar API
         * @param {Options} [options] - Options
         * @param {string} [options.registry] - Registry
         * @param {string} [options.registry.hips] - Hips Registry
         * @private
         */
        function _loadHIPSLayers(Mizar, options) {
            if (typeof options !== 'undefined' && options.hasOwnProperty('registry') && options.registry.hasOwnProperty('hips')) {
                $.ajax({
                    type: 'GET',
                    url: _proxify(options.registry.hips),
                    context: Mizar,
                    dataType: 'json'

                }).done(function (hipsLayersJSON) {
                    _.each(hipsLayersJSON, function (hipsLayer) {
                        var hipsServiceUrlArray = _getHipsServiceUrlArray(hipsLayer);
                        var hipsUrl = _checkHipsServiceIsAvailable(hipsServiceUrlArray, function (hipsServiceUrl) {
                            if (typeof hipsServiceUrl === 'undefined') {
                                text = "";
                                if (typeof hipsLayer.obs_title === 'undefined') {
                                  text = "with ID <b>"+hipsLayer.ID+"</b>";
                                } else {
                                  text = "with title <b>"+hipsLayer.obs_title+"</b>";
                                }
                                ErrorDialog.open("<font style='color:orange'>Warning : Cannot add layer <b>" + text + "</b> no mirror available</font>");
                                //console.log("Cannot add layer " + text + " no mirror available");
                                return;
                            }
                            $.proxy(_createHips, Mizar)(hipsLayer, hipsServiceUrl);
                        });
                    }, Mizar);
                });
            }
        }


        /**
         * Returns the context according to the mode.
         * @function _getContext
         * @param {CONTEXT|undefined} mode - the selected mode
         * @memberOf Mizar#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @returns {Context} the context
         * @private
         */
        function _getContext(mode) {
            var context;
            switch (mode) {
                case undefined:
                    context = this.getActivatedContext();
                    break;
                case Mizar.CONTEXT.Sky:
                    context = this.getSkyContext();
                    break;
                case Mizar.CONTEXT.Planet:
                    context = this.getPlanetContext();
                    break;
                default:
                    throw new RangeError("The mode " + mode + " is not allowed, A valid mode is included in the list CONTEXT", "Mizar.js");
            }
            return context;
        }


        /**
         * Creates a HIPS layer from registry
         * @function _createHips
         * @memberOf Mizar#
         * @param hipsLayer
         * @param hipsServiceUrl
         * @private
         */
        function _createHips(hipsLayer, hipsServiceUrl) {
            if (hipsLayer.hasOwnProperty("hips_status") && !hipsLayer.hips_status.match('public') === null) {
                return;
            }
            hipsLayer.hips_service_url = hipsServiceUrl;

            try {
                this.addLayer({type: Mizar.LAYER.Hips, hipsMetadata: new HipsMetadata(hipsLayer)});
            } catch (e) {
                var prefixe;
                var text;
                if (typeof hipsLayer.obs_title === 'undefined') {
                  prefixe = "ID ";
                  text = hipsLayer.ID;
                } else {
                  prefixe = "";
                  text = hipsLayer.obs_title;
                }
                ErrorDialog.open("Hips layer "+prefixe+"<font style='color:yellow'><b>" + text + "</b></font> not valid in Hips registry <font color='grey'><i>("+hipsLayer.hips_service_url+")</i></font>.");
                //console.log("Hips layer "+prefixe+ text + " not valid in Hips registry ("+hipsLayer.hips_service_url+")");
            }
        }

        /**************************************************************************************************************/

        Utils.inherits(Event, Mizar);

        /**************************************************************************************************************/

        /**************************************************************************************************************
         *                                          Public methods
         **************************************************************************************************************/

        //               ***************************** Members *****************************

        /**
         * Returns the sky context.
         * @returns {SkyContext|null}
         * @function getSkyContext
         * @memberOf Mizar#
         */
        Mizar.prototype.getSkyContext = function () {
            return this.skyContext;
        };

        /**
         * Returns the planet context.
         * @returns {PlanetContext|null}
         * @function getPlanetContext
         * @memberOf Mizar#
         */
        Mizar.prototype.getPlanetContext = function () {
            return this.planetContext;
        };

        /**
         * Returns the selected context
         * @returns {PlanetContext|SkyContext}
         * @function getActivatedContext
         * @memberOf Mizar#
         */
        Mizar.prototype.getActivatedContext = function () {
            return this.activatedContext;
        };

        /**
         * Selects the context as default context according to the {@link CONTEXT context mode}.<br/>
         * Once a context is selected, methods can be applied to it.
         * @param {CONTEXT} contextMode - select one context among {@link CONTEXT context}
         * @fires Mizar#mizarMode:toggle
         * @function setActivatedContext
         * @memberOf Mizar#
         * @throws {RangeError} contextMode not valid - a valid contextMode is included in the list {@link CONTEXT}
         */
        Mizar.prototype.setActivatedContext = function (contextMode) {
            switch (contextMode) {
                case Mizar.CONTEXT.Planet:
                    this.activatedContext = this.planetContext;
                    break;
                case Mizar.CONTEXT.Sky:
                    this.activatedContext = this.skyContext;
                    break;
                default:
                    throw RangeError("The contextMode " + contextMode + " is not allowed, A valid contextMode is included in the list Constants.CONTEXT", "Mizar.js");
            }
            this.publish("mizarMode:toggle", this.activatedContext);
        };

        /**
         * Returns the rendering context.
         * @returns {RenderContext} the rendering context
         * @function getRenderContext
         * @memberOf Mizar#
         */
        Mizar.prototype.getRenderContext = function () {
            return this.activatedContext.getRenderContext();
        };

        /**
         * Returns the options
         * @function getOptions
         * @memberOf Mizar#
         * @returns {Mizar.parameters} - Mizar's options
         */
        Mizar.prototype.getOptions = function () {
            return this.options;
        };


        //               ***************************** coordinate reference *****************************

        /**
         * Returns the coordinate reference system related to the selected {@link CONTEXT context}
         * @returns {Crs} the coordinate reference system
         * @function getCrs
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.getCrs = function () {
            return this.activatedContext.getCoordinateSystem();
        };

        /**
         * Sets the coordinate reference system related to the selected {@link CONTEXT context}
         * @param {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} coordinateSystem - coordinate system description
         * @function setCrs
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}*
         */
        Mizar.prototype.setCrs = function (coordinateSystem) {
            var crs = CoordinateSystemFactory.create(coordinateSystem);
            this.activatedContext.setCoordinateSystem(crs);
        };

        //               ***************************** context management *****************************

        /**
         * Creates a context according to the {@link CONTEXT context mode}.<br/>
         * The created context is selected automatically as default context. The rendering context for the new
         * context is retrieved from the previous context.
         * @param {CONTEXT} contextMode - Select on context among {@link CONTEXT context}
         * @param {AbstractContext.skyContext|AbstractContext.planetContext} options - Options for the context, See options.planetContext or options.skycontext configuration for {@link Mizar}
         * @throws {RangeError} contextMode not valid - a valid contextMode is included in the list {@link CONTEXT}
         * @function createContext
         * @memberOf Mizar#
         * @fires Mizar#mizarMode:toggle
         */
        Mizar.prototype.createContext = function (contextMode, options) {
            options.renderContext = this.renderContext;
            this.activatedContext = this.ContextFactory.create(contextMode, this.getOptions(), options);
            switch (contextMode) {
                case Mizar.CONTEXT.Sky:
                    this.skyContext = this.activatedContext;
                    _loadHIPSLayers(this, this.getOptions().configuration);
                    break;
                case Mizar.CONTEXT.Planet:
                    this.planetContext = this.activatedContext;
                    break;
                default:
                    throw new RangeError("Unknown contextMode '" + contextMode + "'", "Mizar.js");
            }
            this.renderContext = this.activatedContext.getRenderContext();
            this.publish("mizarMode:toggle", this.activatedContext);
        };

        /**
         * Switches 2D <--> 3D, only for planetary context. <br/>
         * When this method is used in a sky context, and exception is thrown
         * @function toggleDimension
         * @memberOf Mizar#
         * @throws "Not implemented" - Will throw an exception for Sky mode. In this version, the sky cannot be projected in 2D
         */
        Mizar.prototype.toggleDimension = function () {
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
         * Callback after the context switches.
         * @callback toggleContextCallback
         * @param {Mizar} contextManager
         */

        /**
         * Switches planetary <---> sky context
         * @param {PlanetLayer} gwLayer - planet layer
         * @param {AbstractContext.planetContext} options - options for the planet
         * @param {toggleContextCallback} callback - Call at the end of the toggle
         * @fires Mizar#mizarMode:toggle
         * @function toggleContext
         * @memberOf Mizar#
         */
        Mizar.prototype.toggleContext = function (gwLayer, options, callback) {
            var toggleMode = (this.getActivatedContext().getMode() === Mizar.CONTEXT.Sky) ? Mizar.CONTEXT.Planet : Mizar.CONTEXT.Sky;
            var self = this;

            if (toggleMode === Mizar.CONTEXT.Sky) {
                _switchPlanet2Sky.call(this);
            } else {
                _switchSky2Planet.call(this, gwLayer, options);
            }
            if (callback) {
                callback.call(self);
            }
        };


        //               ***************************** layer management *****************************

        /**
         * Returns the sky layers, which have been added by {@link Mizar#addLayer}.
         * @function getSkyLayers
         * @returns {Layer[]} the layers
         * @memberOf Mizar#
         */
        Mizar.prototype.getSkyLayers = function () {
            return this.getSkyContext().getLayers();
        };

        /**
         * Returns the planet layers, which have been added by {@link Mizar#addLayer}
         * @function getPlanetLayers
         * @returns {Layer[]} the layers
         * @memberOf Mizar#
         */
        Mizar.prototype.getPlanetLayers = function () {
            return this.getPlanetContext().getLayers();
        };

        /**
         * Returns the layers for a specific context.<br/>
         * When no context is specified, the layers from the selected context are returned.
         * @function getLayers
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {Layer[]} the layers
         * @memberOf Mizar#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.getLayers = function (mode) {
            return _getContext.call(this, mode).getLayers();
        };

        /**
         * Returns all the layers regardless of the {@link CONTEXT context}.
         * @function getAllLayers
         * @return {Layer[]} the layers
         * @memberOf Mizar#
         */
        Mizar.prototype.getAllLayers = function () {
            return _.union(this.getSkyLayers(), this.getPlanetLayers());
        };

        /**
         * Returns the layer by its ID according to the {@link CONTEXT context}.<br/>
         * When no context is specified, the layer from the selected context is returned.<br/>
         * The ID is a unique layer identifier, which is returned when the layer description is {@link Mizar#addLayer added}
         * to Mizar
         * @function getLayerByID
         * @param layerID - Layer's ID
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {Layer|undefined} The layer or undefined when the layer is not found
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.getLayerByID = function (layerID, mode) {
            return _getContext.call(this, mode).getLayerByID(layerID);
        };

        /**
         * Returns the layer by its name according to the {@link CONTEXT context}.<br/>
         * When no context is specified, the layer from the selected context is returned.<br/>
         * <b>Note:</b> The name may not be unique. In this case, the first layer having this name is returned
         * @function getLayerByName
         * @param {string} layerName - Layer's name, provided in the layer description when the layer is {@link Mizar#addLayer added}
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {Layer|undefined} the layer or undefined when the layer is not found
         * @memberOf Mizar#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.getLayerByName = function (layerName, mode) {
            return _getContext.call(this, mode).getLayerByName(layerName);
        };


        /**
         * Adds a layer according to the selected {@link CONTEXT context}.<br/>
         * When layerPlanet is not provided, then the layer is added to the selected context otherwise the layer
         * is added to the layerPlanet.
         *
         * @function addLayer
         * @param {Object} layerDescription - See the base properties {@link AbstractLayer.configuration} and a specific layer for specific properties
         * @param {PlanetLayer} [layerPlanet] - the planet with which the layer must be linked
         * @returns {string} a unique identifier
         * @memberOf Mizar#
         * @listens AbstractLayer#visibility:changed
         * @see {@link module:Layer.AtmosphereLayer AtmosphereLayer} : A layer to create an atmosphere on a planet.
         * @see {@link module:Layer.BingLayer BingLayer}: The Microsoft service proving a WMTS server.
         * @see {@link module:Layer.CoordinateGridLayer CoordinateGridLayer} : A layer to create a grid on the sky
         * @see {@link module:Layer.GeoJsonLayer GeoJSONLayer} : A layer to add a GeoJSON on the globe
         * @see {@link module:Layer.GroundOverlayLayer GroundOverlayLayer} : A layer to draw an image overlay draped onto the terrain
         * @see {@link module:Layer.HipsCatLayer HipsCatLayer} : A layer to draw a HIPS catalogue
         * @see {@link module:Layer.HipsFitsLayer HipsFitsLayer} : A layer to draw an Hips Fits
         * @see {@link module:Layer.HipsGraphicLayer HipsGraphicLayer} : A layer to draw a Hips JPEG/PNG
         * @see {@link module:Layer.MocLayer MocLayer} : A layer to draw a multi-order-coverage index
         * @see {@link module:Layer.OpenSearchLayer OpenSearchLayer} : A layer to draw the result from an open search service
         * @see {@link module:Layer.OSMLayer OSMLayer} : A layer to display data coming from OpenStreetMap server
         * @see {@link module:Layer.PlanetLayer PlanetLayer} : A layer to save all layers of a planet
         * @see {@link module:Layer.TileWireframeLayer TileWireframeLayer} : A layer to draw a grid on the planet
         * @see {@link module:Layer.VectorLayer VectorLayer} : A layer to draw a vector
         * @see {@link module:Layer.WCSElevationLayer WCSElevationLayer} : A layer to draw the elevation
         * @see {@link module:Layer.WMSElevationLayer WMSElevationLayer} : A layer to draw the elevation
         * @see {@link module:Layer.WMSLayer WMSLayer} : A layer to draw images coming from the WMS server
         * @see {@link module:Layer.WMTSLayer WMTSLayer} : A layer to draw predefined tiles coming from a WMTS server
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         * @todo Bug to fix : PlanetLayer should use this function to create layer when the context changes
         */
        Mizar.prototype.addLayer = function (layerDescription, layerPlanet) {
            var layer;
            if (layerPlanet) {
                layer = this.LayerFactory.create(layerDescription);
                this.getActivatedContext()._fillDataProvider(layer, layerDescription);
                layerPlanet.layers.push(layer);
            } else {
                layer = this.getActivatedContext().addLayer(layerDescription);
            }
            return layer.ID;
        };

        /**
         * Removes a layer by its ID according to the {@link CONTEXT context}.<br/>
         * When no context is specified, then the function is applied on the selected context.
         * @function removeLayer
         * @param {string} layerID - Layer's ID
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {boolean} True when the layer is added otherwise False
         * @memberOf Mizar#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.removeLayer = function (layerID, mode) {
            var removedLayer = _getContext.call(this, mode).removeLayer(layerID);
            return typeof removedLayer !== 'undefined';
        };

        /**
         * Sets the background layer according to the selected context.<br/>
         * When no context is specified, then the function is applied on the selected context.<br/>
         * <b>Note 1:</b> The name is not a unique identifier. The first layer matching at this name is returned<br/>
         * <b>Note 2:</b> The layer must be {@link Mizar#addLayer added} before
         * @function setBackgroundLayer
         * @param {string} layerName - Layer's name, which has been provided in the layer description
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {boolean} True when the layer is set as background otherwise False
         * @memberOf Mizar#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.setBackgroundLayer = function (layerName, mode) {
            var gwLayer = _getContext.call(this, mode).setBackgroundLayer(layerName);
            return typeof gwLayer !== 'undefined';
        };

        /**
         * Sets the background layer by ID according to the {@link CONTEXT context}.<br/>
         * When no context is specified, then the function is applied on the selected context.
         * <b>Note:</b> The layer must be {@link Mizar#addLayer added} before
         * @function setBackgroundLayerByID
         * @param {string} layerID - Unique layer identifier.
         * @param {CONTEXT|undefined} mode - Context on which the function is applied.
         * @returns {boolean} True when the layer is set as background otherwise False
         * @memberOf Mizar#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.setBackgroundLayerByID = function (layerID, mode) {
            var gwLayer = _getContext.call(this, mode).setBackgroundLayerByID(layerID);
            return typeof gwLayer !== 'undefined';
        };

        /**
         * Sets the base elevation by its layer's name according to the {@link CONTEXT context}.<br/>
         * When no context is specified, then the function is applied on the selected context.
         * <b>Note:</b> The layer must be {@link Mizar#addLayer added} before
         * @function setBaseElevation
         * @param {string} layerName - Name of the layer
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {boolean} True when the base elevation is set otherwise false
         * @memberOf Mizar#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.setBaseElevation = function (layerName, mode) {
            var layer = this.getLayerByName(layerName, mode);
            return _getContext.call(this, mode).setBaseElevation(layer);
        };

        /**
         * Looks through each value in the list according to the context, returning an array of all the values that match the query.<br/>
         * The query is performed on the name and the description of each layer.<br/>
         * When no context is specified, the function is applied on the selected context.
         * @function searchOnLayerDescription
         * @param {string} query - query on the layer'name or description
         * @param {CONTEXT|undefined} mode - Context on which the query is run.
         * @returns {Layer[]}
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.searchOnLayerDescription = function (query, mode) {
            var layers = this.getLayers(mode);
            return _.filter(layers, function (layer) {
                return (  (String(layer.name).indexOf(query) >= 0) || (String(layer.description || "").indexOf(query) >= 0) );
            });
        };

        /**
         * Looks through each value in the sky layers, returning an array of all the values that match the query.<br/>
         * The query is performed on the name and the description of each layer
         * @function searchSkyLayer
         * @param {string} query - query on the layer'name or description
         * @returns {Layer[]} An array of layers matching the constraint
         * @memberOf Mizar#
         */
        Mizar.prototype.searchSkyLayer = function (query) {
            var layers = this.getSkyLayers();
            return _.filter(layers, function (layer) {
                return (  (String(layer.name).indexOf(query) >= 0) || (String(layer.description || "").indexOf(query) >= 0) );
            });
        };

        /**
         * Looks through each value in the planets layers, returning an array of all the values that match the query.<br/>
         * The query is performed on the name and the description of each layer
         * @function searchPlanetLayer
         * @param {string} query - query on the layer'name or description
         * @returns {Layer[]} An array of layers matching the constraint
         * @memberOf Mizar#
         */
        Mizar.prototype.searchPlanetLayer = function (query) {
            var layers = this.getPlanetLayers();
            //Search by name
            return _.filter(layers, function (layer) {
                return ( (String(layer.name).indexOf(query) >= 0) || (String(layer.description || "").indexOf(query) >= 0) );
            });
        };

        //               ***************************** Utility management *****************************

        /**
         * Registers no standard data provider in a predefined context.<br/>
         * When no context is specified, the function is applied to the selected context.
         * @function registerNoStandardDataProvider
         * @param {string} type - data provider key
         * @param {Function} loadFunc - Function to convert the data
         * @param {CONTEXT|undefined} mode - Context
         * @memberOf Mizar#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         * @example <caption>Registers planets on the sky</caption>
         *   var planetProvider = ProviderFactory.create(Mizar.PROVIDER.Planet);
         *   this.registerNoStandardDataProvider("planets", planetProvider.loadFiles);
         */
        Mizar.prototype.registerNoStandardDataProvider = function (type, loadFunc, mode) {
            _getContext.call(this, mode).registerNoStandardDataProvider(type, loadFunc);
        };

        /**
         * Apply proxy to url if needed
         * @function _getUrl
         * @memberOf Mizar#
         * @private
         */
        Mizar.prototype._getUrl = function(url) {
          if (this.options.configuration.proxyUse === true) {
            return this.options.configuration.proxyUrl + url;
          } else {
            return url;
          }
        }


        /**
         * Returns the service based on its name
         * @param {SERVICE} serviceName
         * @param {Object} options - options for the service
         * @memberOf Mizar#
         * @returns {Object} - the service
         */
        Mizar.prototype.getServiceByName = function (serviceName, options) {
            return ServiceFactory.create(serviceName, options);
        };


        /**
         * Creates and get Stats Object
         * @function createStats
         * @param {Object} options - Configuration properties for stats. See {@link Stats} for options
         * @return {Stats}
         * @memberOf Mizar#
         */
        Mizar.prototype.createStats = function (options) {
            if (this.skyContext) {
                this.Stats = new Stats(this.skyContext, options);
            } else if (this.planetContext) {
                this.Stats = new Stats(this.planetContext, options);
            } else {
                console.log("No context");
            }
        };

        //               ***************************** Rendering management *****************************


        /**
         * Renders the canvas.
         * @function render
         * @memberOf Mizar#
         */
        Mizar.prototype.render = function () {
            this.getRenderContext().frame();
        };

        //               ***************************** Memory management *****************************

        /**
         * Disposes the Mizar's contexts (planet and sky)
         * @function dispose
         * @memberOf Mizar#
         */
        Mizar.prototype.dispose = function () {
            if (this.planetContext) {
                this.planetContext.dispose();
            }
            if (this.skyContext) {
                this.skyContext.dispose();
            }
        };


        /**
         * Destroys Mizar
         * @function destroy
         * @memberOf Mizar#
         */
        Mizar.prototype.destroy = function () {
            if (this.planetContext) {
                this.planetContext.destroy();
            }
            if (this.skyContext) {
                this.skyContext.destroy();
            }
            this.activatedContext = null;
            this.renderContext = null;
            this.ContextFactory = null;
            this.LayerFactory = null;
            this.AnimationFactory = null;
            this.ServiceFactory = null;
            this.UtilityFactory = null;
        };


        // Make object MIZAR available in caller web page
        window.Mizar = Mizar;

        return Mizar;
    });
