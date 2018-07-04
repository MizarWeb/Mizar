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
        "./Context/ContextFactory", "./Navigation/NavigationFactory", "./Layer/LayerFactory","./Crs/CoordinateSystemFactory",
        "./Animation/AnimationFactory", "./Utils/UtilityFactory", "./Services/ServiceFactory", "./Provider/ProviderFactory",
        "./Utils/Utils", "./Utils/Event", "./Utils/Stats", "./Utils/Constants", "./Gui/dialog/ErrorDialog", "./Layer/HipsMetadata", "./Time/Time"],
    function ($, _,
              ContextFactory, NavigationFactory, LayerFactory, CoordinateSystemFactory,
              AnimationFactory, UtilityFactory, ServiceFactory, ProviderFactory,
              Utils, Event, Stats, Constants, ErrorDialog, HipsMetadata, Time) {

        //TODO bug : shortest path
        //TODO : charger cratere Mars et l'afficher à un certain niveau de zoom => fonctionne par FeatureStyle
        //TODO : calculer le getFov pour la navigation de type "Planet" pour en déduire le FOV en fonction du level de Geotiling
        //TODO : Elevation KO quand projection 2D

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
         * @property {AbstractContext.groundContext} [groundContext] - Ground context configuration
         */

        /**
         * Mizar parameters
         * @typedef {Object} Mizar.parameters
         * @property {Object|string} canvas - div ID or div element
         * @property {Mizar.configuration} [configuration] - Mizar global configuration
         * @property {AbstractContext.skyContext} [skyContext] - Sky context configuration
         * @property {AbstractContext.planetContext} [planetContext] - Planet context configuration
         * @property {AbstractContext.groundContext} [groundContext] - Ground context configuration
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
         * @property {boolean} [proxyUse=False] - Uses a proxy to send request
         * @property {string} [proxyUrl] - Proxy URL to use when proxyUse is true. This is used to avoid CORS errors.
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
         * @throws {ReferenceError} No option found
         * @throws {TypeError} Canvas not defined
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
                url: this.options.configuration.proxyUrl,
                // Sets to false when proxyUse is undefined or null
                use: this.options.configuration.proxyUse == null ? false : this.options.configuration.proxyUse
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

            /**
             * Access to time.
             * @name TimeUtility
             * @memberOf Mizar#
             * @private
             */
            this.TimeUtility = Time;

            this.skyContext = null;
            this.planetContext = null;
            this.groundContext = null;
            this.activatedContext = null;
            this.renderContext = null;
            this.dataProviders = {};

            if (options.skyContext) {
                options.skyContext.isMobile = options.isMobile;
                this.createContext(Mizar.CONTEXT.Sky, options.skyContext);
                this.setActivatedContext(Mizar.CONTEXT.Sky);
            }

            if (options.planetContext) {
                options.planetContext.isMobile = options.isMobile;
                this.createContext(Mizar.CONTEXT.Planet, options.planetContext);
                this.setActivatedContext(Mizar.CONTEXT.Planet);
            }

            if (options.groundContext) {
                options.groundContext.isMobile = options.isMobile;
                this.createContext(Mizar.CONTEXT.Ground, options.groundContext);
                this.setActivatedContext(Mizar.CONTEXT.Ground);
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
         * Static variable, supported {@link DISPLAY display} order
         * @name DISPLAY
         * @memberOf Mizar#
         */
        Mizar.DISPLAY = Constants.DISPLAY;

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

        /**
         * Static variable, supported {@link EVENT_MSG event} type
         * @name EVENT_MSG
         * @memberOf Mizar#
         */
        Mizar.EVENT_MSG = Constants.EVENT_MSG;

        /**
         * Static variable, supported {@link TIME_STEP constants} type
         * @name TIME_STEP
         * @memberOf Mizar#
         */
        Mizar.TIME_STEP = Constants.TIME_STEP;

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
            var mizarSrc = _.find(scripts, function (script) {
                return (script.src.indexOf(scriptName) !== -1);
            });
            if (mizarSrc) {
                mizarSrc = mizarSrc.src.split('/').slice(0, index).join('/') + '/';
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
         * @throws {ReferenceError} No option found
         * @throws {TypeError} Canvas not defined
         * @function _checkConfiguration
         * @memberOf Mizar#
         * @private
         */
        function _checkConfiguration(options) {
            if (typeof options === 'undefined') {
                throw new ReferenceError('No option found', 'Mizar.js');
            } else if (typeof options.canvas === 'undefined') {
                throw new TypeError('Canvas not defined', 'Mizar.js');
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
                mizarOptions.configuration = options.configuration;
            } else {
                mizarOptions.configuration = {};
            }
            mizarOptions.configuration.mizarAPIUrl = mizarAPIUrl;
            if (options.hasOwnProperty('skyContext')) {
                mizarOptions.skyContext = options.skyContext;
            }
            if (options.hasOwnProperty('planetContext')) {
                mizarOptions.planetContext = options.planetContext;
            }
            if (options.hasOwnProperty('groundContext')) {
                mizarOptions.groundContext = options.groundContext;
            }
            return mizarOptions;
        }

        /**
         * Switch to a context
         * @param {AbstractContext} context - Target context
         * @param {Object} [options] - options management for the source context
         * @param {boolean} options.mustBeDestroyed=false - options management for the source context
         * @function _switchToContext
         * @memberOf Mizar#
         * @private
         */
        function _switchToContext(context, options) {

            var self = this;
            var mustBeDestroyed = options.hasOwnProperty("mustBeDestroyed") ? options.mustBeDestroyed : false;
            var mustBeHidden = options.hasOwnProperty("mustBeHidden") ? options.mustBeHidden : false;

            // Hide sky
            this.getActivatedContext().hide();

            // Hide all additional layers
            this.getActivatedContext().hideAdditionalLayers();

            var viewMatrix;
            var fov;
            if (context.hasOwnProperty("_oldVM") && context.hasOwnProperty("_oldFov")) {
                viewMatrix = context._oldVM;
                fov = context._oldFov;
            } else if (context.getNavigation().inverseViewMatrix === undefined) {
                this.getActivatedContext()._oldVM = this.renderContext.getViewMatrix();
                this.getActivatedContext()._oldFov = this.renderContext.getFov();
                viewMatrix = context.getNavigation().getRenderContext().getViewMatrix();
                fov = 90;
            } else {
                this.getActivatedContext()._oldVM = this.renderContext.getViewMatrix();
                this.getActivatedContext()._oldFov = this.renderContext.getFov();
                viewMatrix = mat4.create();
                context.getNavigation().computeInverseViewMatrix();
                mat4.inverse(context.getNavigation().inverseViewMatrix, viewMatrix);
                fov =  90;
            }

            if(mustBeDestroyed) {
                this.getActivatedContext().destroy();
            } else if(mustBeHidden) {
                this.getActivatedContext().disable();
            } else {
                // display the two context in the same time
            }
            this.activatedContext = context;
            if (!context.getNavigation().getRenderContext().cameraUpdateFunction) {
                context.getNavigation().getRenderContext().cameraUpdateFunction = context.getNavigation().update.bind(context.getNavigation());
            }
            context.getNavigation().toViewMatrix(viewMatrix, fov, 2000, function() {
                if(context) {
                    context.enable();
                }
                if (options && options.callback) {
                    options.callback.call(self);
                }
                context.showAdditionalLayers();
                self.publish(Constants.EVENT_MSG.MIZAR_MODE_TOGGLE, context);
                self.getActivatedContext().show();
                self.getActivatedContext().refresh();
                if(self.getRenderContext().viewMatrix[0] !== "undefined") {
                    self.getActivatedContext().getNavigation().computeViewMatrix();
                }
            });

        }

        /**
         * Saves the atmosphere state and disable it when 2D is used
         * @function _disableAtmosphere
         * @memberOf Mizar#
         * @private
         */
        function _disableAtmosphere() {
            if (this.getActivatedContext()._atmosphereLayer !== undefined) {
                if (this.getActivatedContext()._atmosphereLayer.globe !== null) {
                    this.getActivatedContext()._saveAtmosphereVisible = this.getActivatedContext()._atmosphereLayer.visible;
                    this.getActivatedContext()._atmosphereLayer.setVisible(false);
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
            if (this.getActivatedContext()._atmosphereLayer !== undefined) {
                if (this.getActivatedContext()._atmosphereLayer.globe !== null) {
                    this.getActivatedContext()._atmosphereLayer.setVisible(this.getActivatedContext()._saveAtmosphereVisible);
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
            if(this.skyContext) {
                this.skyContext.enable();
            }

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
            if(this.skyContext) {
                this.skyContext.disable();
            }

            // If a pole is closed to the center of the canvas, this should mean that
            // the user is interested to the pole, so we switch to azimuth projection
            // instead of plate carrée projection
            _project2AzimuthOrPlate.call(this, this.getActivatedContext().navigation.getCenter());
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
         * @throws {RangeError} Toggle Dimension is not implemented for Sky
         * @private
         */
        function _skipIfSkyMode() {
            if (this.getActivatedContext().getMode() === Mizar.CONTEXT.Sky) {
                throw new RangeError("Toggle Dimension is not implemented for Sky", "Mizar.js");
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
         * @param {string} url - URL
         * @return {string} Url proxified
         * @private
         */
        function _proxify(url) {
            var proxifyUrl;
            if (proxy.use === true) {
                proxifyUrl = proxy.url + url;
            } else {
                proxifyUrl = url;
            }
            return proxifyUrl;
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

                }).fail(function(XMLHttpRequest, textStatus, errorThrown) {
                    ErrorDialog.open("<font style='color:orange'>Warning : Cannot connect to <b>" + options.registry.hips + "</b></font>");
                }).done(function (hipsLayersJSON) {
                    _.each(hipsLayersJSON, function (hipsLayer) {
                        var hipsServiceUrlArray = _getHipsServiceUrlArray(hipsLayer);
                        var hipsUrl = _checkHipsServiceIsAvailable(hipsServiceUrlArray, function (hipsServiceUrl) {
                            if (typeof hipsServiceUrl === 'undefined') {
                                var text = "";
                                if (typeof hipsLayer.obs_title === 'undefined') {
                                    text = "with ID <b>" + hipsLayer.ID + "</b>";
                                } else {
                                    text = "with title <b>" + hipsLayer.obs_title + "</b>";
                                }
                                ErrorDialog.open("<font style='color:orange'>Warning : Cannot add layer <b>" + text + "</b> no mirror available</font>");
                                return;
                            }
                            $.proxy(_createHips, Mizar)(hipsLayer, hipsServiceUrl);
                        });
                    }, Mizar);
                });
            }
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
            try {
                if (hipsLayer.hasOwnProperty("hips_status") && !hipsLayer.hips_status.match('public') === null) {
                    return;
                }
                hipsLayer.hips_service_url = hipsServiceUrl;
                this.addLayer({type: Mizar.LAYER.Hips, hipsMetadata: new HipsMetadata(hipsLayer)});
            } catch (e) {
                var name = hipsLayer.obs_title ?  hipsLayer.obs_title : hipsLayer.obs_collection;
                ErrorDialog.open("Hips layer <font style='color:yellow'><b>" + name + "</b></font>  not valid <font color='grey'><i>(" + hipsLayer.hips_service_url + " - reason : "+ e.message +")</i></font>", true);
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
         * Returns the ground context.
         * @returns {GroundContext|null}
         * @function getGroundContext
         * @memberOf Mizar#
         */
        Mizar.prototype.getGroundContext = function () {
            return this.groundContext;
        };

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
                case Mizar.CONTEXT.Ground:
                    context = this.getGroundContext();
                    break;
                default:
                    throw new RangeError("The mode " + mode + " is not allowed, A valid mode is included in the list CONTEXT", "Mizar.js");
            }
            return context;
        }

        /**
         * Returns the selected context.
         * When activatedContext is not set, it is set automatically to the created context
         * (in the following order : sky, planet, ground). When no context is created,
         * an  exception "No created context" is send.
         * @returns {PlanetContext|SkyContext|GroundContext|null}
         * @function getActivatedContext
         * @memberOf Mizar#
         */
        Mizar.prototype.getActivatedContext = function () {
            try {
                if (this.activatedContext == null) {
                    if (this.skyContext != null) {
                        this.activatedContext = this.skyContext;
                    } else if (this.planetContext != null) {
                        this.activatedContext = this.planetContext;
                    } else if (this.groundContext != null) {
                        this.activatedContext = this.groundContext;
                    } else {
                        throw new ReferenceError("No created context", "Mizar.js");
                    }
                }
            } catch(e) {
                ErrorDialog.open("Cannot get the context : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return this.activatedContext;
        };

        /**
         * Selects the context as default context according to the {@link CONTEXT context mode}.<br/>
         * Once a context is selected, methods can be applied to it.
         * @param {CONTEXT} contextMode - select one context among {@link CONTEXT context}
         * @returns {boolean} True when the contextMode is known otherwise False
         * @function setActivatedContext
         * @memberOf Mizar#
         * @throws {RangeError} contextMode not valid - a valid contextMode is included in the list {@link CONTEXT}
         */
        Mizar.prototype.setActivatedContext = function (contextMode) {
            var result;
            switch (contextMode) {
                case Mizar.CONTEXT.Planet:
                    this.activatedContext = this.planetContext;
                    result = true;
                    break;
                case Mizar.CONTEXT.Sky:
                    this.activatedContext = this.skyContext;
                    result = true;
                    break;
                case Mizar.CONTEXT.Ground:
                    this.activatedContext = this.groundContext;
                    result = true;
                    break;
                default:
                    result = false;
                    ErrorDialog.open("Cannot set the context : <font style='color:orange'><b>" + contextMode + " is not supported</b></font>", true);
            }
        };

        /**
         * Returns the mode in which the active context is set.
         * @function getMode
         * @memberOf Mizar#
         * @returns {CONTEXT|null} Returns the mode otherwise null when no created context
         */
        Mizar.prototype.getMode = function() {
            var result;
            var context = this.getActivatedContext();
            if(context) {
                result = context.getMode();
            } else {
                result = null;
            }
            return result;
        };

        /**
         * Returns the rendering context.
         * @returns {RenderContext|null} the rendering context
         * @function getRenderContext
         * @memberOf Mizar#
         */
        Mizar.prototype.getRenderContext = function () {
            var result;
            var context = this.getActivatedContext();
            if(context) {
                result = context.getRenderContext();
            } else {
                result = null;
            }
            return result;
        };

        /**
         * Returns the options
         * @function getOptions
         * @memberOf Mizar#
         * @throws ReferenceError - Will throw an exception when no context has been created.
         * @returns {Mizar.parameters} - Mizar's options
         */
        Mizar.prototype.getOptions = function () {
            return this.options;
        };


        //               ***************************** coordinate reference *****************************

        /**
         * Returns the coordinate reference system related to the selected {@link CONTEXT context}
         * @returns {Crs|null} the coordinate reference system or null when no created context
         * @function getCrs
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.getCrs = function () {
            var result;
            var context = this.getActivatedContext();
            if(context) {
                result = context.getCoordinateSystem();
            } else {
                result = null;
            }
            return result;
        };

        /**
         * Sets the coordinate reference system related to the selected {@link CONTEXT context}
         * @param {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} coordinateSystem - coordinate system description
         * @returns {boolean} True when the coordinate system is set otherwise False when an error occurs
         * @function setCrs
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.setCrs = function (coordinateSystem) {
            var result;
            var context = this.getActivatedContext();
            if(context) {
                var crs = CoordinateSystemFactory.create(coordinateSystem);
                context.setCoordinateSystem(crs);
                result = true;
            } else {
                result = false;
            }
            return result;
        };

        /**
         * Update the time travel navigation range
         * @param {JSON} parameters Parameters
         * @function setTime
         * @memberOf Mizar#
         */
        Mizar.prototype.updateTimeTravel = function(parameters) {
            this.getServiceByName(Mizar.SERVICE.TimeTravel).update(parameters);
        };

        /**
         * Sets the current or integrated time of the application
         * @param time single, multiple or range of values
         * @function setTime
         * @memberOf Mizar#
         */
        Mizar.prototype.setTime = function(time) {
            this.activatedContext.setTime(time);
        };

        /**
         * Returns the current or integrated time.
         * @returns {string} the simple, multiple or range of values
         * @function getTime
         * @memberOf Mizar#
         */
        Mizar.prototype.getTime = function() {
            return this.activatedContext.getTime();
        };

        //               ***************************** context management *****************************

        /**
         * Creates a context according to the {@link CONTEXT context mode}.<br/>
         * @param {CONTEXT} contextMode - Select on context among {@link CONTEXT context}
         * @param {AbstractContext.skyContext|AbstractContext.planetContext|AbstractContext.groundContext} options - Options for the context, See options.planetContext or options.skycontext configuration for {@link Mizar}
         * @retuns {boolean} True when the context is created otherwise false when the contextMode is unknown
         * @throws {RangeError} contextMode not valid - a valid contextMode is included in the list {@link CONTEXT}
         * @function createContext
         * @memberOf Mizar#
         */
        Mizar.prototype.createContext = function (contextMode, options) {
            var result;
            try {
                options.renderContext = this.renderContext;
                options.timeTravelService = this.getServiceByName(Mizar.SERVICE.TimeTravel);
                options.isMobile = this.getOptions().configuration.isMobile;

                var ctx = this.ContextFactory.create(contextMode, this.getOptions(), options);

                switch (contextMode) {
                    case Mizar.CONTEXT.Sky:
                        this.skyContext = ctx;
                        _loadHIPSLayers(this, this.getOptions().configuration);
                        break;
                    case Mizar.CONTEXT.Planet:
                        this.planetContext = ctx;
                        break;
                    case Mizar.CONTEXT.Ground:
                        this.groundContext = ctx;
                        break;
                    default:
                        throw new RangeError("Unknown contextMode '" + contextMode + "'", "Mizar.js");
                }
                this.renderContext = ctx.getRenderContext();
                result = true;
            } catch (e) {
                console.error("Error",e);
                result = false;
                ErrorDialog.open("Cannot create the context : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
        };

        /**
         * Switches 2D <--> 3D, only for planetary context. <br/>
         * When this method is used in a sky context, and exception is thrown
         * @returns {boolean} True when toggle works otherwise False
         * @function toggleDimension
         * @memberOf Mizar#
         */
        Mizar.prototype.toggleDimension = function () {
            var result;
            try {
                _skipIfSkyMode.call(this);
                if (this.getCrs().isFlat()) {
                    // we are in 2D and we are going to 3D
                    _switch2Dto3D.call(this);
                } else {
                    // we are in 3D and we are goint to 2D
                    _switch3Dto2D.call(this);
                }
                this.render();
                result = true;
            } catch (e) {
                result = false;
                ErrorDialog.open("Cannot toggle the dimension : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
        };

        /**
         * Switches To a context.
         * @param {AbstractContext} context - target context
         * @param {Object} [options] - options management for the source context
         * @param {boolean} options.mustBeDestroyed=false - options management for the source context
         * @param {Function} callback - Call at the end of the toggle
         * @fires Mizar#mizarMode:toggle
         * @function toggleToContext
         * @memberOf Mizar#
         */
        Mizar.prototype.toggleToContext = function (context, options) {
            var result;
            try {
                var toggleMode = (this.getActivatedContext().getMode() === Mizar.CONTEXT.Sky) ? Mizar.CONTEXT.Planet : Mizar.CONTEXT.Sky;
                var opts = options || {};
                _switchToContext.call(this, context, opts);
                result = true;
            } catch(e) {
                result = false;
                ErrorDialog.open("Cannot toggle the context : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
        };

        //               ***************************** layer management *****************************

        /**
         * Returns the sky layers, which have been added by {@link Mizar#addLayer}.
         * @function getSkyLayers
         * @returns {Layer[]|null} the layers
         * @memberOf Mizar#
         */
        Mizar.prototype.getSkyLayers = function () {
            var result;
            var context = this.getSkyContext();
            if(context) {
                result = context.getLayers();
            } else {
                result = null;
            }
            return result;
        };

        /**
         * Returns the planet layers, which have been added by {@link Mizar#addLayer}
         * @function getPlanetLayers
         * @returns {Layer[]|null} the layers
         * @memberOf Mizar#
         */
        Mizar.prototype.getPlanetLayers = function () {
            var result;
            var context = this.getPlanetContext();
            if(context) {
                result = context.getLayers();
            } else {
                result = null;
            }
            return result;
        };

        /**
         * Returns the grounds layers, which have been added by {@link Mizar#addLayer}
         * @function getGroundLayers
         * @returns {Layer[]|null} the layers
         * @memberOf Mizar#
         */
        Mizar.prototype.getGroundLayers = function () {
            var result;
            var context = this.getGroundContext();
            if(context) {
                result = context.getLayers();
            } else {
                result = null;
            }
            return result;
        };

        /**
         * Returns the layers for a specific context.<br/>
         * When no context is specified, the layers from the selected context are returned.
         * @function getLayers
         * @param {CONTEXT|null} mode - Context on which the function is applied
         * @returns {Layer[]} the layers
         * @memberOf Mizar#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.getLayers = function (mode) {
            var result;
            try {
                result = _getContext.call(this, mode).getLayers();
            } catch(e) {
                result = null;
                ErrorDialog.open("Cannot get the layers : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
        };

        /**
         * Draws the layer on the top.
         * @function setLayerOnTheTop
         * @param layerID
         * @return {boolean} Returns true when the layer is drawn on the top otherwise False.
         * @memberOf Mizar#
         */
        Mizar.prototype.setLayerOnTheTop = function(layerID) {
            var result;
            var layer = this.getLayerByID(layerID);
            if (layer != null) {
                layer.setOnTheTop();
                result = true;
            } else {
                result = false;
                ErrorDialog.open("Cannot set the layer on the top : <font style='color:orange'><b>" + layerID + " does not exist</b></font>", true);
            }
            return result;
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
         * @param {string} layerID - Layer's ID
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {Layer|undefined|null} The layer or undefined when the layer is not found
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.getLayerByID = function (layerID, mode) {
            var result;
            try {
                result = _getContext.call(this, mode).getLayerByID(layerID);
            } catch(e) {
                result = null;
                ErrorDialog.open("Cannot get the layer by ID : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
        };

        /**
         * Returns the layer by its name according to the {@link CONTEXT context}.<br/>
         * When no context is specified, the layer from the selected context is returned.<br/>
         * <b>Note:</b> The name may not be unique. In this case, the first layer having this name is returned
         * @function getLayerByName
         * @param {string} layerName - Layer's name, provided in the layer description when the layer is {@link Mizar#addLayer added}
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {Layer|undefined|null} the layer or undefined when the layer is not found
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.getLayerByName = function (layerName, mode) {
            var result;
            try {
                result = _getContext.call(this, mode).getLayerByName(layerName);
            } catch(e) {
                result = null;
                ErrorDialog.open("Cannot get the layer by name : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
        };


        /**
         * Adds a layer according to the selected {@link CONTEXT context}.<br/>
         * When layerPlanet is not provided, then the layer is added to the selected context otherwise the layer
         * is added to the layerPlanet.
         *
         * @function addLayer
         * @param {Object} layerDescription - See the base properties {@link AbstractLayer.configuration} and a specific layer for specific properties
         * @returns {string|null} a unique identifier or null when a problem happens
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
         * @see {@link module:Layer.TileWireframeLayer TileWireframeLayer} : A layer to draw a grid on the planet
         * @see {@link module:Layer.VectorLayer VectorLayer} : A layer to draw a vector
         * @see {@link module:Layer.WCSElevationLayer WCSElevationLayer} : A layer to draw the elevation
         * @see {@link module:Layer.WMSElevationLayer WMSElevationLayer} : A layer to draw the elevation
         * @see {@link module:Layer.WMSLayer WMSLayer} : A layer to draw images coming from the WMS server
         * @see {@link module:Layer.WMTSLayer WMTSLayer} : A layer to draw predefined tiles coming from a WMTS server
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.addLayer = function (layerDescription, callback, fallback) {
            //var result;
            //try {
                this.getActivatedContext().addLayer(layerDescription, callback, fallback);
            //} catch(e) {
            //    result = false;
            //    var prefixe;
            //    var text;
            //    var hipsLayer = layerDescription.hipsMetadata;
            //    if(hipsLayer != null) {
            //        if (typeof hipsLayer.hipsMetadata.obs_title === 'undefined') {
            //            prefixe = "ID ";
            //            text = hipsLayer.hipsMetadata.ID;
            //        } else {
            //            prefixe = "";
            //            text = hipsLayer.hipsMetadata.obs_title;
            //        }
            //        //ErrorDialog.open("Hips layer " + prefixe + "<font style='color:yellow'><b>" + text + "</b></font> not valid in Hips registry <font color='grey'><i>(" + hipsLayer.hipsMetadata.hips_service_url + " - reason : "+ e.message +")</i></font>.");
            //    } else {
            //        //ErrorDialog.open("Cannot add the layer <font style='color:yellow'><b>" + JSON.stringify(layerDescription) + "</b></font><font color='grey'><i>(reason : "+ e.message +")</i></font>.");
            //    }
            //}
        };

        /**
         * Removes a layer by its ID according to the {@link CONTEXT context}.<br/>
         * When no context is specified, then the function is applied on the selected context.
         * @function removeLayer
         * @param {string} layerID - Layer's ID
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {boolean} True when the layer is added otherwise False
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.removeLayer = function (layerID, mode) {
            var result;
            try {
                var removedLayer = _getContext.call(this, mode).removeLayer(layerID);
                result = typeof removedLayer !== 'undefined';
            } catch(e) {
                result = false;
                ErrorDialog.open("Cannot remove the layer : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
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
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.setBackgroundLayer = function (layerName, mode) {
            var result;
            try {
                var gwLayer = _getContext.call(this, mode).setBackgroundLayer(layerName);
                result = typeof gwLayer !== 'undefined';
            } catch(e) {
                result = false;
                ErrorDialog.open("Cannot set the background : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
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
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.setBackgroundLayerByID = function (layerID, mode) {
            var result;
            try {
                var gwLayer = _getContext.call(this, mode).setBackgroundLayerByID(layerID);
                result = typeof gwLayer !== 'undefined';
            } catch(e) {
                result = false;
                ErrorDialog.open("Cannot set the backgorund by ID : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
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
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.setBaseElevation = function (layerName, mode) {
            var result;
            try {
                var layer = this.getLayerByName(layerName, mode);
                var gwLayer = _getContext.call(this, mode).setBaseElevation(layer);
                result = typeof gwLayer !== 'undefined';
            } catch(e) {
                result = false;
                ErrorDialog.open("Cannot set the base elevation : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
        };

        /**
         * Gets the base elevation to the {@link CONTEXT context}.<br/>
         * When no context is specified, then the function is applied on the selected context.
         * @function getBaseElevation
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {WCSElevationLayer|null} True when the base elevation is set otherwise false
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.getBaseElevation = function (mode) {
            return _getContext.call(this, mode).getBaseElevation();
        };

        /**
         * Sets the base elevation by its layer's ID according to the {@link CONTEXT context}.<br/>
         * When no context is specified, then the function is applied on the selected context.
         * <b>Note:</b> The layer must be {@link Mizar#addLayer added} before
         * @function setBaseElevation
         * @param {string} layerID - ID of the layer
         * @param {CONTEXT|undefined} mode - Context on which the function is applied
         * @returns {boolean} True when the base elevation is set otherwise false
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         */
        Mizar.prototype.setBaseElevationByID = function (layerID, mode) {
            var result;
            try {
                var gwLayer = _getContext.call(this, mode).setBaseElevationByID(layerID);
                result =  typeof gwLayer !== 'undefined';
            } catch(e) {
                result = false;
                ErrorDialog.open("Cannot set the base elevation by ID : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
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
                return (  (String(layer.getName()).indexOf(query) >= 0) || (String(layer.getDescription() || "").indexOf(query) >= 0) );
            });
        };

        /**
         * Looks through each value in the sky layers, returning an array of all the values that match the query.<br/>
         * The query is performed on the name and the description of each layer
         * @function searchSkyLayer
         * @param {string} query - query on the layer's name or description
         * @returns {Layer[]} An array of layers matching the constraint
         * @memberOf Mizar#
         */
        Mizar.prototype.searchSkyLayer = function (query) {
            var layers = this.getSkyLayers();
            return _.filter(layers, function (layer) {
                return (  (String(layer.getName()).indexOf(query) >= 0) || (String(layer.getDescription() || "").indexOf(query) >= 0) );
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
                return ( (String(layer.getName()).indexOf(query) >= 0) || (String(layer.getDescription() || "").indexOf(query) >= 0) );
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
         * @returns {boolean} True when data provider is registered otherwise False
         * @memberOf Mizar#
         * @see {@link Mizar#setActivatedContext}
         * @see {@link Mizar#createContext}
         * @example <caption>Registers planets on the sky</caption>
         *   var planetProvider = ProviderFactory.create(Mizar.PROVIDER.Planet);
         *   this.registerNoStandardDataProvider("planets", planetProvider.loadFiles);
         */
        Mizar.prototype.registerNoStandardDataProvider = function (type, loadFunc, mode) {
            var result;
            try {
                _getContext.call(this, mode).registerNoStandardDataProvider(type, loadFunc);
                result = true;
            } catch(e) {
                result = false;
                ErrorDialog.open("Cannot register the data provider : <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
        };

        /**
         * Apply proxy to url if needed
         * @function _getUrl
         * @memberOf Mizar#
         * @private
         */
        Mizar.prototype._getUrl = function (url) {
            var result;
            if (this.options.configuration.proxyUse === true) {
                result = this.options.configuration.proxyUrl + url;
            } else {
                result = url;
            }
            return result;
        };

        /**
         * Returns the service based on its name
         * @param {SERVICE} serviceName
         * @param {Object} options - options for the service
         * @memberOf Mizar#
         * @returns {Object|null} - the service
         */
        Mizar.prototype.getServiceByName = function (serviceName, options) {
            var result;
            try {
                result = ServiceFactory.create(serviceName, options);
            } catch(e) {
                result = null;
                ErrorDialog.open("Cannot get the service by name: <font style='color:orange'><b>" + e.message + "</b></font>", true);
            }
            return result;
        };


        /**
         * Creates and get Stats Object
         * @function createStats
         * @param {Object} options - Configuration properties for stats. See {@link Stats} for options
         * @returns {boolean} True when context fors tats exist otherwise False
         * @return {Stats}
         * @memberOf Mizar#

         */
        Mizar.prototype.createStats = function (options) {
            var result;
            if (this.skyContext) {
                this.Stats = new Stats(this.skyContext, options);
                result = true;
            } else if (this.planetContext) {
                this.Stats = new Stats(this.planetContext, options);
                result = true;
            } else if (this.groundContext) {
                this.Stats = new Stats(this.groundContext, options);
                result = true;
            } else {
                result = false;
                ErrorDialog.open("Cannot create the stats", true);
            }
            return result;
        };

        //               ***************************** Rendering management *****************************


        /**
         * Renders the canvas.
         * @returns {boolean} True when the canvas is rendered otherwise False
         * @function render
         * @memberOf Mizar#
         */
        Mizar.prototype.render = function () {
            var result;
            var renderContext = this.getRenderContext();
            if(renderContext) {
                this.getRenderContext().frame();
                result = true;
            } else {
                result = false;
            }
            return result;
        };

        //               ***************************** Memory management *****************************

        /**
         * Disposes the Mizar's contexts (planet, sky and ground)
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
            if(this.groundContext) {
                this.groundContext.dispose();
            }
        };


        /**
         * Reload a layer (keep id and ID)
         * @function reloadLayer
         * @memberOf Mizar#
         */
        Mizar.prototype.reloadLayer = function (layer) {
            var ctx = this.getActivatedContext();
            if (ctx) {
                var tileManager = ctx.getTileManager();
                tileManager.abortLayerRequests(layer);
                layer._detach(ctx.globe);
                layer._attach(ctx.globe);
            } else {
               console.error("Context not yet available");
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
            if(this.groundContext) {
                this.groundContext.destroy();
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
