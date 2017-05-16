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
define(["jquery", "underscore-min", "../Utils/Constants", "../Provider/ProviderFactory",
        "./HipsMetadata","../Gui/dialog/ErrorDialog"],
    function ($, _, Constants, ProviderFactory, HipsMetadata, ErrorDialog) {

        var self;
        /**
         * @name LayerManager
         * @class
         * Create the layer manager
         * @param {Mizar} mizarAPI - mizar API
         * @param {Mizar.configuration} options - options
         * @constructor
         */
        var LayerManager = function (mizarAPI, options) {
            this.mizarAPI = mizarAPI;
            this.dataProviders = {};
            if (options.hasOwnProperty('registry') && options.registry.hasOwnProperty('hips')) {
                loadHIPSLayers(this, options.registry.hips);
            }
            self = this;
        };
        

        /**
         * Get service url from HIPS Layer
         * @param hipsLayer
         * @returns {Array}
         * @private
         */
        function getHipsServiceUrlArray(hipsLayer) {
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
         * This callback function.
         * @callback serviceRegistryCallback
         * @param {string} url
         */

        /**
         * Loads HIPS layers from passed service url
         * @param {Array} hipsServiceUrlArray - HIPS service URL
         * @param {serviceRegistryCallback} callback - The callback that handles the response
         * @private
         */
        function checkHipsServiceIsAvailable(hipsServiceUrlArray, callback) {
            if (hipsServiceUrlArray.length === 0) {
                return callback(undefined);
            }
            var url = hipsServiceUrlArray.shift();
            $.ajax({
                type: 'GET',
                url: url + "/properties",
                dataType: 'text'
                //context: layerManager,
                //timeout: 10000
            }).done(function (data, status, xhr) {
                if (xhr.status === 200) {
                    return callback(url);
                }
            }).error(function () {
                checkHipsServiceIsAvailable(hipsServiceUrlArray, callback);
            });
        }

        /**************************************************************************************************************/

        /**
         * Loads HIPS layers from passed service url
         * @param layerManager
         * @param {String} hipsServiceUrl
         * @private
         */
        function loadHIPSLayers(layerManager, hipsServiceUrl) {
            $.ajax({
                type: 'GET',
                url: hipsServiceUrl,
                context: layerManager,
                dataType: 'json'

            }).done(function (hipsLayersJSON) {
                _.each(hipsLayersJSON, function (hipsLayer) {
                    var hipsServiceUrlArray = getHipsServiceUrlArray(hipsLayer);
                    var hipsUrl = checkHipsServiceIsAvailable(hipsServiceUrlArray, function (hipsServiceUrl) {
                        if (typeof hipsServiceUrl === 'undefined') {
                            console.log("Cannot add layer " + hipsLayer.obs_title + " no mirror available");
                            return;
                        }
                        $.proxy(createHips, layerManager)(hipsLayer, hipsServiceUrl);
                    });
                }, layerManager);
            });
        }

        /**
         * Creates a HIPS layer from registry
         * @param hipsLayer
         * @param hipsServiceUrl
         * @private
         */        
        function createHips(hipsLayer, hipsServiceUrl) {
            if (hipsLayer.hasOwnProperty("hips_status") && !hipsLayer.hips_status.match('public') === null) {
                return;
            }
            hipsLayer.hips_service_url = hipsServiceUrl;

            try {
                this.addLayer({type: Constants.LAYER.Hips, hipsMetadata: new HipsMetadata(hipsLayer)});
            } catch(e) {
                ErrorDialog.open("Hips layer "+ hipsLayer.creator_did + " not valid in Hips registry.");
            }
        }

        /**
         * Registers no standard data provider in a predefined contect..
         * @function registerNoStandardDataProvider
         * @param {string} type - data provider key
         * @param {Function} loadFunc - Function
         * @mode {CONTEXT|undefined} - mode
         * @memberOf LayerManager#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         * @example <caption>Registers planets on the sky</caption>
         *   var planetProvider = ProviderFactory.create(Constants.PROVIDER.Planet);
         *   this.registerNoStandardDataProvider("planets", planetProvider.loadFiles);
         */        
        LayerManager.prototype.registerNoStandardDataProvider = function (type, loadFunc, mode) {
            this.dataProviders[type.toString()] = loadFunc;
            switch (mode) {
                case undefined:
                    this.mizarAPI.getContextManager().getActivatedContext().registerNoStandardDataProvider(type, loadFunc);
                    break;
                case Constants.CONTEXT.Sky:
                    this.mizarAPI.getContextManager().getSkyContext().registerNoStandardDataProvider(type, loadFunc);
                    break;
                case Constants.CONTEXT.Planet:
                    this.mizarAPI.getContextManager().getPlanetContext().registerNoStandardDataProvider(type, loadFunc);
                    break;
                default:
                    throw new RangeError("The more "+more+" is not allowed, A valid mode is included in the list CONTEXT", "LayerManager.js");
            }
        };

        /**
         * Returns the sky layers.
         * @function getSkyLayers
         * @returns {Layer[]} the layers
         * @memberOf LayerManager#
         */        
        LayerManager.prototype.getSkyLayers = function () {
            return this.mizarAPI.getContextManager().getSkyContext().getLayers();
        };

        /**
         * Returns the planet layers.
         * @function getPlanetLayers
         * @returns {Layer[]} the layers
         * @memberOf LayerManager#
         */        
        LayerManager.prototype.getPlanetLayers = function () {
            return this.mizarAPI.getContextManager().getPlanetContext().getLayers();
        };

        /**
         * Returns the layers for a specific mode. When no mode is specified,the mode from
         * activatedcontext is specified.
         * @function getLayers
         * @param {CONTEXT|undefined} mode - Mode on which the function is applied
         * @returns {Layer[]} the layers
         * @memberOf LayerManager#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         *
         */        
        LayerManager.prototype.getLayers = function (mode) {
            var layers = [];
            switch (mode) {
                case undefined:
                    layers = this.mizarAPI.getContextManager().getActivatedContext().getLayers();
                    break;
                case Constants.CONTEXT.Sky:
                    layers = this.getSkyLayers();
                    break;
                case Constants.CONTEXT.Planet:
                    layers = this.getPlanetLayers();
                    break;
                default:
                    throw new RangeError("The more "+more+" is not allowed, A valid mode is included in the list CONTEXT", "LayerManager.js");
            }
            return layers;
        };

        /**
         * Returns all the layers regardless of the {@link CONTEXT context}.
         * @function getAllLayers
         * @return {Layer[]} the layers
         * @memberOf LayerManager#
         */        
        LayerManager.prototype.getAllLayers = function () {
            return _.union(this.getSkyLayers(), this.getPlanetLayers());
        };

        /**
         * Returns the layer by its ID
         * @function getLayerByID
         * @param layerID - Layer's ID
         * @param {CONTEXT|undefined} mode - Mode on which the function is applied
         * @returns {Layer|undefined} The layer or undefined when the layer is not found
         * @memberOf LayerManager#
         *
         */        
        LayerManager.prototype.getLayerByID = function (layerID, mode) {
            var layer;
            switch (mode) {
                case undefined:
                    layer = this.mizarAPI.getContextManager().getActivatedContext().getLayerByID(layerID);
                    break;
                case Constants.CONTEXT.Sky:
                    layer = this.mizarAPI.getContextManager().getSkyContext().getLayerByID(layerID);
                    break;
                case Constants.CONTEXT.Planet:
                    layer = this.mizarAPI.getContextManager().getPlanetContext().getLayerByID(layerID);
                    break;
                default:
                    throw new RangeError("unknown mode " + mode + " in getLayerByID(layerID,mode)","LayerManager.js");
            }
            return layer;
        };

        /**
         * Returns the layer by its name.
         * @function getLayerByName
         * @param {string} layerName - Layer's name
         * @param {CONTEXT|undefined} mode - Mode on which the function is applied
         * @returns {Layer|undefined} the layer or undefined when the layer is not found
         * @memberOf LayerManager#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         */        
        LayerManager.prototype.getLayerByName = function (layerName, mode) {
            var layer;
            switch (mode) {
                case undefined:
                    layer = this.mizarAPI.getContextManager().getActivatedContext().getLayerByName(layerName);
                    break;
                case Constants.CONTEXT.Sky:
                    layer = this.mizarAPI.getContextManager().getSkyContext().getLayerByName(layerName);
                    break;
                case Constants.CONTEXT.Planet:
                    layer = this.mizarAPI.getContextManager().getPlanetContext().getLayerByName(layerName);
                    break;
                default:
                    throw new RangeError("unknown mode " + mode + " in getLayerByName(layerName,mode)","LayerManager.js");
            }
            return layer;
        };



        /**
         * Adds a layer
         * @function addLayer
         * @param {Object} layerDescription - See the base properties {@link AbstractLayer.configuration} and a specific layer for specific properties 
         * @param {PlanetLayer} [layerPlanet] - the planet with which the layer must be linked
         * @returns {string} a unique identifier
         * @memberOf LayerManager#
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
         * @todo Bug to fix : PlanetLayer should use this function to create layer when the context changes
         */        
        LayerManager.prototype.addLayer = function (layerDescription, layerPlanet) {

            var layer;

            if (layerPlanet) {
                layer = this.mizarAPI.LayerFactory.create(layerDescription);
                layerPlanet.layers.push(layer);
            } else {
                layer = this.mizarAPI.getContextManager().getActivatedContext().addLayer(layerDescription);
            }

            return layer.ID;
        };

        /**
         * Removes a layer by its ID/
         * @function removeLayer
         * @param layerID - Layer's ID
         * @param mode - Mode on which the function is applied
         * @returns {boolean} True when the layer is added otherwise False
         * @memberOf LayerManager#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         */        
        LayerManager.prototype.removeLayer = function (layerID, mode) {
            var removedLayer;
            switch (mode) {
                case undefined:
                    removedLayer = this.mizarAPI.getContextManager().getActivatedContext().removeLayer(layerID);
                    break;
                case Constants.CONTEXT.Sky:
                    removedLayer = this.mizarAPI.getContextManager().getSkyContext().removeLayer(layerID);
                    break;
                case Constants.CONTEXT.Planet:
                    removedLayer = this.mizarAPI.getContextManager().getPlanetContext().removeLayer(layerID);
                    break;
                default:
                    throw new RangeError("unknown mode " + mode + " in getLayerByID(layerID,mode)", "LayerManager.js");
            }
            return typeof gwLayer !== 'undefined';
        };

        /**
         * Sets the background layer
         * @function setBackgroundLayer
         * @param {string} layerName - Layer's name
         * @param {CONTEXT|undefined} mode - Mode on which the function is applied
         * @returns {boolean} True when the layer is set as background otherwise False
         * @memberOf LayerManager#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         */        
        LayerManager.prototype.setBackgroundLayer = function (layerName, mode) {
            var gwLayer;
            switch (mode) {
                case undefined:
                    gwLayer = this.mizarAPI.getContextManager().getActivatedContext().setBackgroundLayer(layerName);
                    break;
                case Constants.CONTEXT.Sky:
                    gwLayer = this.mizarAPI.getContextManager().getSkyContext().setBackgroundLayer(layerName);
                    break;
                case Constants.CONTEXT.Planet:
                    gwLayer = this.mizarAPI.getContextManager().getPlanetContext().setBackgroundLayer(layerName);
                    break;
                default:
                    throw new RangeError("unknown mode " + mode + " in setBackgroundLayer(layerName,mode)","LayerManager.js");
            }
            return typeof gwLayer !== 'undefined';
        };

        /**
         * Sets the background layer by ID.
         * @function setBackgroundLayerByID
         * @param {string} layerID - Layer's ID
         * @param {CONTEXT|undefined} mode - Mode on which the function is applied.
         * @returns {boolean} True when the layer is set as background otherwise False
         * @memberOf LayerManager#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         */
        LayerManager.prototype.setBackgroundLayerByID = function (layerID, mode) {
            var gwLayer;
            switch (mode) {
                case undefined:
                    gwLayer = this.mizarAPI.getContextManager().getActivatedContext().setBackgroundLayerByID(layerID);
                    break;
                case Constants.CONTEXT.Sky:
                    gwLayer = this.mizarAPI.getContextManager().getSkyContext().setBackgroundLayerByID(layerID);
                    break;
                case Constants.CONTEXT.Planet:
                    gwLayer = this.mizarAPI.getContextManager().getPlanetContext().setBackgroundLayerByID(layerID);
                    break;
                default:
                    throw new RangeError("unknown mode " + mode + " in setBackgroundLayer(layerName,mode)","LayerManager.js");
            }
            return typeof gwLayer !== 'undefined';
        };

        /**
         * Sets the base elevation by its layer's name.<br/>
         * The layer must added before.
         * @function setBaseElevation
         * @param {string} layerName - Name of the layer
         * @param {CONTEXT|undefined} mode - Mode on which the function is applied
         * @returns {boolean} True when the base elevation is set otherwise false
         * @memberOf LayerManager#
         * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
         */        
        LayerManager.prototype.setBaseElevation = function (layerName, mode) {
            var layer = this.getLayerByName(layerName, mode);
            var isAddedToElevation = false;
            switch (mode) {
                case undefined:
                    isAddedToElevation = this.mizarAPI.getContextManager().getActivatedContext().setBaseElevation(layer);
                    break;
                case Constants.CONTEXT.Sky:
                    isAddedToElevation = this.mizarAPI.getContextManager().getSkyContext().setBaseElevation(layer);
                    break;
                case Constants.CONTEXT.Planet:
                    isAddedToElevation = this.mizarAPI.getContextManager().getPlanetContext().setBaseElevation(layer);
                    break;
                default:
                    throw new RangeError("unknown mode " + mode + " in setBaseElevation(layer)","LayerManager.js");
            }
            return isAddedToElevation;
        };

        /**
         * Looks through each value in the list according to the mode, returning an array of all the values that match the query
         * @function searchOnLayerDescription
         * @param {string} query - query on the layer'name or description
         * @param {CONTEXT|undefined} mode - the mode on which the query is run. When undefined is selected,
         * the constraint is run on all contexts.
         * @returns {Layer[]}
         * @memberOf LayerManager#
         */        
        LayerManager.prototype.searchOnLayerDescription = function (query, mode) {
            var layers = this.getLayers(mode);
            return _.filter(layers, function (layer) {
                return (  (String(layer.name).indexOf(query) >= 0) || (String(layer.description || "").indexOf(query) >= 0) );
            });
        };

        /**
         * Looks through each value in the list of sky, returning an array of all the values that match the query
         * @function searchGlobeLayer
         * @param {string} query - query on the layer'name or description
         * @returns {Layer[]} An array of layers matching the constraint
         * @memberOf LayerManager#
         */        
        LayerManager.prototype.searchGlobeLayer = function (query) {
            var layers = this.getSkyLayers();
            return _.filter(layers, function (layer) {
                return (  (String(layer.name).indexOf(query) >= 0) || (String(layer.description || "").indexOf(query) >= 0) );
            });
        };

        /**
         * Looks through each value in the list of planets, returning an array of all the values that match the query.
         * @function searchPlanetLayer
         * @param {string} query - query on the layer'name or description
         * @returns {Layer[]} An array of layers matching the constraint
         * @memberOf LayerManager#
         */        
        LayerManager.prototype.searchPlanetLayer = function (query) {
            var layers = this.getPlanetLayers();
            //Search by name
            return _.filter(layers, function (layer) {
                return ( (String(layer.name).indexOf(query) >= 0) || (String(layer.description || "").indexOf(query) >= 0) );
            });
        };

        /**
         * Destroys the layer manager.
         */
        LayerManager.prototype.destroy = function() {
            this.dataProviders = null;
            this.mizarAPI = null;
        };

        return LayerManager;

    });