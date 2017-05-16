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
 * @fileOverview Entry point for the {@link Mizar MIZAR API}
 * @version 1.0 (beta)
 * @author CNES
 */
define(["jquery","underscore-min",
        "./Context/ContextFactory", "./Navigation/NavigationFactory", "./Layer/LayerFactory",
        "./Layer/LayerManager", "./Context/ContextManager",
        "./Animation/AnimationFactory", "./Utils/UtilityFactory", "./Services/ServiceFactory", "./Provider/ProviderFactory",
        "./Utils/Utils", "./Utils/Event", "./Utils/Constants"],
    function ($,_,
              ContextFactory, NavigationFactory, LayerFactory,
              LayerManager, ContextManager,
              AnimationFactory, UtilityFactory, ServiceFactory, ProviderFactory,
              Utils, Event, Constants) {

        //TODO bug : Elevation in geotiling when azimuth proj is used
        //TODO bug : pb affichage catalogue en 2D quand elevation activé
        //TODO bug : numberOfLevels pour Hips n'est pas toujours tenu en compte.
        //TODO bug : options.baseLevel = 3 dans AbstractHipsLayer => probleme affichage - important pour éviter des requêtes inutiles
        //TODO bug : probleme minification si usage
        //TODO bug : bug "name resolver" with negative longitude
        //TODO bug : bug "nam" resolver" with negative latitude in north azimuthal projection
        //TODO : En azimutale projection, lorsque le WMS fournit une capacité azimuth, l'utiliser sinon utiliser EPSG4326
        //TODO : NiceScroll pour les résultats du resolveur de nom
        //TODO : Check position in zoomTo => cas erreur : l'afficher dans nameResolver comme "badInputParam"
        //TODO : charger cratere Mars et l'afficher à un certain niveau de zoom
        /**
         * Checks inputs from user and creates the mizar configuration
         * @param {Object} options inputs from user
         * @returns {Object} mizar configuration.
         * @throw ReferenceError - Unvalid input parameters
         */
        function createConfiguration(options) {
            var mizarOptions = {};
            if (typeof options === 'undefined') {
                throw new ReferenceError('No options found', 'Mizar.js');
            } else if (typeof options.canvas === 'undefined') {
                throw new ReferenceError('Canvas not defined', 'Mizar.js');
            } else {
                mizarOptions = {
                    canvas: typeof options.canvas === "string" ? document.getElementById(options.canvas) : options.canvas
                };
                if(options.hasOwnProperty('configuration')) {
                    mizarOptions['configuration'] = options.configuration;
                }
                if(options.hasOwnProperty('skyContext')) {
                    mizarOptions['skyContext'] = options.skyContext;
                }
                if(options.hasOwnProperty('planetContext')) {
                    mizarOptions['planetContext'] = options.planetContext;
                }
            }
            return mizarOptions;
        }

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
         * @typedef {Object} Mizar.configuration
         * @property {string} mizarBaseUrl - Used to access to MizarWidget resources
         * @property {boolean} [debug = false] - Debug mode
         * @property {boolean} [isMobile = false] - Mobile support
         * @property {AbstractTracker.position_configuration} [positionTracker] - Position tracker configuration
         * @property {AbstractTracker.elevation_configuration} [elevationTracker] - Elevation tracker configuration
         * @property {Object} [registry] - Hips service registry
         * @property {string} registry.hips - Hips Registry
         */

        /**
         * @name Mizar
         * @class
         * Creates an instance of the Mizar API.
         * @param {Mizar.parameters} options - Configuration for Mizar
         * @constructor
         */
        var Mizar = function (options) {
            Event.prototype.constructor.call(this);

            this.options = createConfiguration(options);
            
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

            this.layerManager = null;
            this.contextManager = new ContextManager(this);

            if (options.skyContext) {
                this.contextManager.createContext(this.CONTEXT.Sky, options.skyContext);
            }

            if (options.planetContext) {
                this.contextManager.createContext(this.CONTEXT.Planet, options.planetContext);
            }

        };

        /**************************************************************************************************************/

        Utils.inherits(Event, Mizar);

        /**************************************************************************************************************/

        /**
         * Supported {@link ANIMATION animation} type
         * @name ANIMATION
         * @memberOf Mizar#
         */
        Mizar.prototype.ANIMATION = Constants.ANIMATION;

        /**
         * Supported {@link LAYER layer} type
         * @name LAYER
         * @memberOf Mizar#
         */
        Mizar.prototype.LAYER = Constants.LAYER;

        /**
         * Supported {@link GEOMETRY geometry} type
         * @name GEOMETRY
         * @memberOf Mizar#
         */
        Mizar.prototype.GEOMETRY = Constants.GEOMETRY;

        /**
         * Supported {@link NAVIGATION navigation} type
         * @name NAVIGATION
         * @memberOf Mizar#
         */        
        Mizar.prototype.NAVIGATION = Constants.NAVIGATION;

        /**
         * Supported {@link CONTEXT context} type
         * @name CONTEXT
         * @memberOf Mizar#
         */
        Mizar.prototype.CONTEXT = Constants.CONTEXT;

        /**
         * Supported {@link PROJECTION projection} type
         * @name PROJECTION
         * @memberOf Mizar#
         */        
        Mizar.prototype.PROJECTION = Constants.PROJECTION;

        /**
         * Supported {@link CRS coordinate reference system} type
         * @name CRS
         * @memberOf Mizar#
         */
        Mizar.prototype.CRS = Constants.CRS;

        /**
         * Supported {@link SERVICE service} type
         * @name SERVICE
         * @memberOf Mizar#
         */        
        Mizar.prototype.SERVICE = Constants.SERVICE;

        /**
         * Supported {@link UTILITY utility} type
         * @name UTILITY
         * @memberOf Mizar#
         */        
        Mizar.prototype.UTILITY = Constants.UTILITY;

        /**
         * Supported {@link PROVIDER provider} type
         * @name PROVIDER
         * @memberOf Mizar#
         */
        Mizar.prototype.PROVIDER = Constants.PROVIDER;

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
         * Returns the layer manager to handles layers
         * @function getLayerManager
         * @memberOf Mizar#
         * @returns {LayerManager} the layer manager
         */
        Mizar.prototype.getLayerManager = function () {
            if (this.layerManager === null) {
                this.layerManager = new LayerManager(this, this.options.hasOwnProperty('configuration') ? this.options.configuration : {});
            }
            return this.layerManager;
        };

        /**
         * Returns the context manager to handle the contexts.
         * @function getContextManager
         * @memberOf Mizar#
         * @returns {ContextManager} - context manager
         */
        Mizar.prototype.getContextManager = function() {
            return this.contextManager;
        };

        /**
         * Returns the navigation object to control the camera.
         * @function getNavigation
         * @memberOf Mizar#
         * @returns {AbstractNavigation} - the navigation
         */
        Mizar.prototype.getNavigation = function() {
            return this.contextManager.getNavigation();
        };


        /**
         * Returns the options
         * @function getOptions
         * @memberOf Mizar#
         * @returns {Object} - Mizar's options
         */
        Mizar.prototype.getOptions = function() {
            return this.options;
        };


        /**
         * Destroys Mizar
         * @function destroy
         * @memberOf Mizar#
         */
        Mizar.prototype.destroy = function () {
            this.contextManager.destroy();
            this.layerManager.destroy();
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
