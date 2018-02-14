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
define(['jquery','../Renderer/FeatureStyle', '../Renderer/VectorRendererManager', '../Utils/Utils', './AbstractLayer', '../Renderer/RendererTileData', '../Tiling/Tile','../Tiling/GeoTiling','../Utils/Constants','./OpenSearch/OpenSearchForm','./OpenSearch/OpenSearchUtils','./OpenSearch/OpenSearchResult','./OpenSearch/OpenSearchRequestPool','./OpenSearch/OpenSearchCache'],
    function ($,FeatureStyle, VectorRendererManager, Utils, AbstractLayer, RendererTileData, Tile,GeoTiling,Constants,OpenSearchForm,OpenSearchUtils,OpenSearchResult,OpenSearchRequestPool,OpenSearchCache) {

        /**
         * @name OpenSearchLayer
         * @class
         * This layer draws an OpenSearch dynamic layer
         * @augments AbstractLayer
         * @param {Object} options Configuration properties for the layer. See {@link AbstractLayer} for base properties
         * @param {String} options.serviceUrl Url of OpenSearch description XML file
         * @param {int} [options.minOrder=5] Starting order for OpenSearch requests
         * @param {int} [options.maxRequests=2] Max request
         * @param {Boolean} [options.invertY=false] a boolean, if set all the image data of current layer is flipped along the vertical axis
         * @param {Boolean} [options.coordSystemRequired=true]
         * @param {FeatureStyle} [options.style=new FeatureStyle()]
         * @memberof module:Layer
         */
          var OpenSearchLayer = function (options) {
            AbstractLayer.prototype.constructor.call(this, Constants.LAYER.OpenSearch, options);

            if (typeof options.serviceUrl !== 'undefined') {
              this.serviceUrl = this.proxify(options.serviceUrl);
            }

            if (typeof options.getCapabilities !== 'undefined') {
              this.describeUrl = this.proxify(options.getCapabilities);
            }


            this.name = options.name;
            this.title = options.title;

            this.afterLoad = options.afterLoad;

            this.minOrder = options.minOrder || 5;
            this.maxRequests = options.maxRequests || 2;
            this.invertY = options.invertY || false;
            this.coordSystemRequired = options.hasOwnProperty('coordSystemRequired') ? options.coordSystemRequired : true;
            this.formDescription = null;

            this.extId = "os";

            this.oldBound = null;
            
            this.previousViewKey = null;

            // Used for picking management
            this.features = [];

            // Counter set, indicates how many times the feature has been requested
            this.featuresSet = {};

            this.tilesToLoad = [];

            // Keep save of all tiles where a feature is set, in order to remove all when reset
            this.allTiles = {};

            // OpenSearch result
            this.result = new OpenSearchResult();

            // Pool for request management
            this.pool = new OpenSearchRequestPool(this);
            
            // Cache for data management
            this.cache = new OpenSearchCache();

            // Features already loaded
            this.featuresAdded = [];

            // Force Refresh
            this.forceRefresh = false;

            if (typeof this.describeUrl !== 'undefined') {
              this.hasForm = true;
              this.loadGetCapabilities(this.manageCapabilities,this.describeUrl,this);
            } else {
              this.hasForm = false;
            }

            document.currentOpenSearchLayer = this;
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractLayer, OpenSearchLayer);

        /**************************************************************************************************************/

        /**
         * Go to next page
         * @function nextPage
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.nextPage = function () {
            var num = OpenSearchUtils.getCurrentValue(this.formDescription,"page");
            // If not specified, set default to 1
            if ((num === null) || (typeof num === "undefined")) {
                num = 1;
            }
            OpenSearchUtils.setCurrentValueToParam(this.formDescription,"page",num*1+1);

            this.forceRefresh = true;
            this.globe.renderContext.requestFrame();
        }

        /**************************************************************************************************************/

        /**
         * When getCapabilities is loading, manage it
         * @function manageCapabilities
         * @memberof OpenSearchLayer#
         * @param json Json object
         * @param sourceObject Object where data is stored
         * @private
         */
        OpenSearchLayer.prototype.manageCapabilities = function (json,sourceObject) {
          // check if form description is well provided
          var dataForm = null;
          var openSearchRoot = json.OpenSearchDescription;
          if (typeof openSearchRoot !== 'undefined') {
            sourceObject.name  = (typeof sourceObject.name  !== 'undefined') ? sourceObject.name  : OpenSearchUtils.getValue(openSearchRoot,"ShortName");
            sourceObject.title = (typeof sourceObject.title !== 'undefined') ? sourceObject.title : OpenSearchUtils.getValue(openSearchRoot,"LongName");
            var urls = openSearchRoot.Url;
            if (typeof urls !== 'undefined') {
              dataForm = urls;
            }
          }
          if (dataForm != null) {
            // Load form description
            sourceObject.formDescription = new OpenSearchForm(dataForm,"application/json");
            OpenSearchUtils.initNavigationValues(sourceObject.formDescription);
          } else {
            console.log("Form not correct");
          }

          if ((sourceObject.callbackContext !== null) && (typeof sourceObject.callbackContext !== "undefined")) {
            sourceObject.callbackContext.addLayerFromObject(sourceObject,sourceObject.options);
          }

          if (typeof sourceObject.afterLoad === 'function') {
            // Update GUI !!
            sourceObject.afterLoad(sourceObject);
          }
        };

        /**************************************************************************************************************/
        /**************************************************************************************************************/
        /**************************************************************************************************************/

        /**
         * @name OSData
         * @class
         * OpenSearch renderable
         * @param {AbstractLayer} layer layer
         * @param {Tile} tile Tile
         * @param p Parent object
         * @private
         */
        var OSData = function (layer, tile, p) {
            this.layer = layer;
            this.parent = p;
            this.tile = tile;
            this.featureIds = []; // exclusive parameter to remove from layer
            this.state = OpenSearchLayer.TileState.NOT_LOADED;
            this.complete = false;
            this.childrenCreated = false;
        };

         /**************************************************************************************************************/

        /**
         * Traverse
         * @function traverse
         * @memberof OSData.prototype
         * @param {Tile} tile Tile
         * @private
         */
        OSData.prototype.traverse = function (tile) {
            if (!this.layer.isVisible()) {
                return;
            }
           
            if (tile.state !== Tile.State.LOADED) {
                return;
            }

            // Check if the tile need to be loaded
            if (this.state === OpenSearchLayer.TileState.NOT_LOADED) {
                this.layer.tilesToLoad.push(this);
            }

            // Create children if needed
            if (this.state === OpenSearchLayer.TileState.LOADED && !this.complete && tile.state === Tile.State.LOADED && tile.children && !this.childrenCreated) {
                var i;
                for (i = 0; i < 4; i++) {
                    if (!tile.children[i].extension[this.layer.extId]) {
                        tile.children[i].extension[this.layer.extId] = new OSData(this.layer, tile.children[i], this);
                    }
                }
                this.childrenCreated = true;


                // HACK : set renderable to have children
                var renderables = tile.extension.renderer ? tile.extension.renderer.renderables : [];
                for (i = 0; i < renderables.length; i++) {
                    if (renderables[i].bucket.layer === this.layer) {
                        renderables[i].hasChildren = true;
                    }
                }
            }
        };

        /**************************************************************************************************************/

        /**
         * Dispose renderable data from tile
         * @function dispose
         * @memberof OSData.prototype
         * @param renderContext
         * @param tilePool
         * @private
         */
        OSData.prototype.dispose = function (renderContext, tilePool) {
            var i;
            if (this.parent && this.parent.childrenCreated) {
                this.parent.childrenCreated = false;
                // HACK : set renderable to not have children!
                var renderables = this.parent.tile.extension.renderer ? this.parent.tile.extension.renderer.renderables : [];
                for (i = 0; i < renderables.length; i++) {
                    if (renderables[i].bucket.layer === this.layer) {
                        renderables[i].hasChildren = false;
                    }
                }
            }
            for (i = 0; i < this.featureIds.length; i++) {
                this.layer.removeFeature(this.featureIds[i], this.tile);
            }
            this.tile = null;
            this.parent = null;
        };

        /**************************************************************************************************************/
        /**************************************************************************************************************/
        /**************************************************************************************************************/

        /**
         * Attaches the layer to the globe
         * @function _attach
         * @memberof OpenSearchLayer#
         * @param g The globe
         * @private
         */
        OpenSearchLayer.prototype._attach = function (g) {
            AbstractLayer.prototype._attach.call(this, g);
            this.extId += this.id;
            g.tileManager.addPostRenderer(this);
        };

        /**************************************************************************************************************/

        /**
         * Detach the layer from the globe
         * @function _detach
         * @memberof OpenSearchLayer#
         * @private
         */
        OpenSearchLayer.prototype._detach = function () {
            this.globe.tileManager.removePostRenderer(this);
            AbstractLayer.prototype._detach.call(this);
        };

        /**************************************************************************************************************/

        /**
         * Launches request to the OpenSearch service.
         * @function launchRequest
         * @memberof OpenSearchLayer#
         * @param {Tile} tile Tile
         * @param {String} url Url
         * @fires Context#startLoad
         * @fires Context#endLoad
         * @fires Context#features:added
         */
        OpenSearchLayer.prototype.launchRequest = function (tile, url) {
            var key = this.cache.getKey(tile.bound);
            // add tile in all tiles
            if (( this.allTiles[key] === null) || (typeof this.allTiles[key] === "undefined")) {
                this.allTiles[key] = tile;
            }
            this.pool.addQuery(url,tile,key);
        };

        /**************************************************************************************************************/

        /**
         * Remove all previous features
         * @function removeFeatures
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.removeFeatures = function () {
            // clean renderers
            for (var x in this.featuresSet) {
                if(this.featuresSet.hasOwnProperty(x)) {
                    var featureData = this.featuresSet[x];
                    for (var key in this.allTiles) {
                        var tile = this.allTiles[key];
                        var feature = this.features[featureData.index];
                        this.globe.vectorRendererManager.removeGeometryFromTile(feature.geometry,tile);
                    }
                }
            }

            // Clean old results
            var self = this;
            this.allTiles = {};
            this.globe.tileManager.visitTiles(function (tile) {
                if (tile.extension[self.extId]) {
                    tile.extension[self.extId].dispose();
                    tile.extension[self.extId].featureIds = []; // exclusive parameter to remove from layer
                    tile.extension[self.extId].state = OpenSearchLayer.TileState.NOT_LOADED;
                    tile.extension[self.extId].complete = false;
                }
            });

            this.featuresSet = [];
            this.features = [];
            this.featuresAdded = [];

            //this.globe.refresh();
            this.globe.renderContext.requestFrame();
            
        };

        /**************************************************************************************************************/

        /**
         * Adds feature to the layer and to the tile extension.
         * @function addFeature
         * @memberof OpenSearchLayer#
         * @param {Feature} feature Feature
         * @param {Tile} tile Tile
         */
        OpenSearchLayer.prototype.addFeature = function (feature,tile) {
            var featureData;
            
            // update list added
            var key = this.cache.getKey(tile.bound);

            var ind = ""+feature.id;//+"_"+key;
            this.featuresAdded.push(ind);

            this.featuresSet[feature.id] = featureData;

            var defaultCrs = {
                type: "name",
                properties: {
                    name: Constants.CRS.WGS84
                }
            };

            feature.geometry.gid = feature.id;


            // MS: Feature could be added from ClusterOpenSearch which have features with different styles
            var style = feature.properties.style ? feature.properties.style : this.style;
            style.visible = true;

            var old = this.featuresSet[feature.id];
            if ( (old === null) || (typeof old === "undefined") ) {
                this.features.push(feature);
                var featureData = {
                    index: this.features.length - 1,
                    tiles: [tile]
                };
                this.featuresSet[feature.id] = featureData;
            }
            else {
                featureData = this.featuresSet[feature.id];
                // Store the tile
                featureData.tiles.push(tile);

                // Always use the base feature to manage geometry indices
                feature = this.features[featureData.index];
            }

             // Add features to renderer if layer is attached to planet
             if (this.globe) {
                this._addFeatureToRenderers(feature);
                if (this.isVisible()) {
                    this.globe.renderContext.requestFrame();
                }
            }
           
        };

        /**************************************************************************************************************/

        /**
         * Add a feature to renderers
         * @function _addFeatureToRenderers
         * @memberof GeoJsonLayer#
         * @param {GeoJSON} feature Feature
         * @private
         */
        OpenSearchLayer.prototype._addFeatureToRenderers = function (feature) {
            var geometry = feature.geometry;

            // Manage style, if undefined try with properties, otherwise use defaultStyle
            var style = this.style;
            var props = feature.properties;
            if (props && props.style) {
                style = props.style;
            }

            // Manage geometry collection
            if (geometry.type === "GeometryCollection") {
                var geoms = geometry.geometries;
                for (var i = 0; i < geoms.length; i++) {
                    this.globe.vectorRendererManager.addGeometry(this, geoms[i], style);
                }
            }
            else {
                // Add geometry to renderers
                this.globe.vectorRendererManager.addGeometry(this, geometry, style);
            }
        };
        /**************************************************************************************************************/

        /**
         * Removes feature from Dynamic OpenSearch layer.
         * @function removeFeature
         * @memberof OpenSearchLayer#
         * @param {String} identifier identifier
         * @param {Tile} tile Tile
         */
        OpenSearchLayer.prototype.removeFeature = function (identifier, tile) {
            var featureIt = this.featuresSet[identifier];

            if (!featureIt) {
                return;
            }

            // Remove tile from array
            var tileIndex = featureIt.tiles.indexOf(tile);
            if (tileIndex >= 0) {
                featureIt.tiles.splice(tileIndex, 1);
            }
            else {
                console.log('OpenSearchLayer internal error : tile not found when removing feature');
            }

            if (featureIt.tiles.length === 0) {
                var feature = this.features[featureIt.index];
                this.globe.vectorRendererManager.removeGeometryFromTile(feature.geometry,tile);
                // Remove it from the set
                delete this.featuresSet[identifier];

                // Remove it from the array by swapping it with the last feature to optimize removal.
                var lastFeature = this.features.pop();
                if (featureIt.index < this.features.length) {
                    // Set the last feature at the position of the removed feature
                    this.features[featureIt.index] = lastFeature;
                    // Update its index in the Set.
                    //this.featuresSet[ lastFeature.properties.identifier ].index = featureIt.index;
                    this.featuresSet[lastFeature.id].index = featureIt.index;
                }

            }
        };

        /**************************************************************************************************************/

        /**
         * Modifies feature style.
         * @function modifyFeatureStyle
         * @memberof OpenSearchLayer#
         * @param {Feature} feature Feature
         * @param {FeatureStyle} style Style
         */
        OpenSearchLayer.prototype.modifyFeatureStyle = function (feature, style) {
            feature.properties.style = style;
            //var featureData = this.featuresSet[feature.properties.identifier];
            var featureData = this.featuresSet[feature.id];
            if (featureData) {
                // TODO: change for all tiles, not only of current level
                for (var i = 0; i < featureData.tiles.length; i++) {
                    var tile = featureData.tiles[i];
                    this.globe.vectorRendererManager.removeGeometryFromTile(feature.geometry, tile);
                    this.globe.vectorRendererManager.addGeometryToTile(this, feature.geometry, style, tile);
                }
            }
        };

        /**************************************************************************************************************/

        /**
         * Tile Ccnstants
         */

        OpenSearchLayer.TileState = {
            LOADING: 0,
            LOADED: 1,
            NOT_LOADED: 2,
            INHERIT_PARENT: 3
        };


        /**************************************************************************************************************/

        /**
         * Generate the tile data
         * @function generate
         * @memberof OpenSearchLayer#
         * @param {Tile} tile Tile
         * @private
         */
        OpenSearchLayer.prototype.generate = function (tile) {
            if (tile.order === this.minOrder) {
                tile.extension[this.extId] = new OSData(this, tile, null);
            }
        };
       
        /**************************************************************************************************************/

        /**
         * Prepare paramters for a given bound
         * @function prepareParameters
         * @memberof OpenSearchLayer#
         * @param {Bound} bound Bound
         * @return 
         */
        OpenSearchLayer.prototype.prepareParameters = function (bound) {
            var param;      // param managed
            var code;       // param code
            for (var i=0;i<this.formDescription.parameters.length;i++) {
                param = this.formDescription.parameters[i];
                code = param.value;
                code = code.replace("?}","}");
                if (code === "{geo:box}") {
                    // set bbox
                    param.currentValue = bound.west+","+bound.south+","+bound.east+","+bound.north;
                }
            }
        }
            
        /**************************************************************************************************************/

        /**
         * Build request url
         * @function buildUrl
         * @memberof OpenSearchLayer#
         * @param {Bound} bound Bound
         * @return {String} Url
         */
        OpenSearchLayer.prototype.buildUrl = function (bound) {

            //var url = this.serviceUrl + "/search?order=" + tile.order + "&healpix=" + tile.pixelIndex;
            if (this.formDescription === null) {
                return null;
            }
            var url = this.formDescription.template;

            // Prepare parameters for this tile
            this.prepareParameters(bound);

            // Check each parameter
            var param;          // param managed
            var currentValue;   // value set 
            for (var i=0;i<this.formDescription.parameters.length;i++) {
                param = this.formDescription.parameters[i];
                //console.log("check param ",param.value);
                currentValue = param.currentValueTransformed();
                if (currentValue === null) {
                    // Remove parameter if not mandatory (with a ?)
                    url = url.replace( "&"+param.name+"="+param.value.replace("}","?}") , "");
                    url = url.replace( param.name+"="+param.value.replace("}","?}") , "");
                    // Set blank if parameter is mandatory
                    url = url.replace( param.value , "");
                } else {
                    // replace value
                    url = url.replace(param.value,currentValue);
                    // replace optional value
                    url = url.replace(param.value.replace("}","?}"),currentValue);
                }
            }

            return url;
        };

        /**************************************************************************************************************/

        /**
         * Internal function to sort tiles
         * @function _sortTilesByDistance
         * @param {Tile} t1 First tile
         * @param {Tile} t2 Second tile
         * @private
         */
        function _sortTilesByDistance(t1, t2) {
            return t1.tile.distance - t2.tile.distance;
        }

        /**************************************************************************************************************/

        /**
         * Render function
         * @function render
         * @memberof OpenSearchLayer#
         * @param tiles The array of tiles to render
         */
        OpenSearchLayer.prototype.render = function (tiles) {
            if (!this.isVisible()) {
                return;
            }

            this.tiles = tiles;

            var needRefresh = false;
            var globalKey = this.cache.getArrayBoundKey(tiles);

            if (this.forceRefresh === true) {
                // Remove cache, in order to reload new features
                this.cleanCache();
                this.forceRefresh = false;
            }

            if (this.previousViewKey === null) {
                needRefresh = true;
            } else {
                needRefresh = ( this.previousViewKey !== globalKey);
            }

            if (needRefresh) {
                this.previousViewKey = globalKey;
                for (var i=0;i<tiles.length;i++) {
                    var features = this.cache.getTile(tiles[i].bound);
                    this.updateGUI();
                    if (features === null) {
                        var url = this.buildUrl(tiles[i].bound);
                        if (url !== null) {
                            this.launchRequest(tiles[i], url);
                        }
                    } else {
                        this.manageFeaturesResponse(features,tiles[i]);
                        this.updateGUI();
                    }
                }
            }
        };
        
        /**************************************************************************************************************/

        /**
         * Submit OpenSearch form
         * @function submit
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.submit = function() {
            this.formDescription.updateFromGUI();
            this.resetAll();
        }
            
        /**************************************************************************************************************/

        /**
         * Reset pool, cache and all OpenSearch data loaded
         * @function resetAll
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.resetAll = function() {
            // Reset pool
            this.pool.resetPool();
            // Reset cache
            this.cleanCache();
            // Remove all features
            this.removeFeatures();
        }

        /**************************************************************************************************************/

        /**
         * Clean the cache
         * @function cleanCache
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.cleanCache = function() {
            this.cache.reset();
            this.previousViewKey = null;
        }

        /**************************************************************************************************************/

        /**
         * Update the GUI (mainly debug purpose)
         * @function updateGUI
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.updateGUI = function () {
            var message = "";
            message += "<a href='javascript:document.currentOpenSearchLayer.resetAll();'>Reset</a><br>";
            message += "<a href='javascript:document.currentOpenSearchLayer.nextPage();'>Next</a><br>";
            message += "# Features : "+this.features.length+"<br>";
            message += this.pool.getPoolsStatus()+"<br>";
            message += this.cache.getCacheStatus();
            $("#resultNavigation").html(message);
        }

        /**************************************************************************************************************/

        /**
         * Check is feature still added to tile
         * @function featureStillAddedToTile
         * @memberof OpenSearchLayer#
         * @param {Feature} feature Feature
         * @param {Tile} tile Tile
         * @private
         */
        OpenSearchLayer.prototype.featureStillAddedToTile = function (feature,tile) {
            // search feature + tile key
            var key = this.cache.getKey(tile.bound);
            var ind = "";
            ind += feature.id;
            //ind += "_";
            //ind += key;

            var num = this.featuresAdded.indexOf(ind);

            return (num >= 0);
        }
            
        /**************************************************************************************************************/

        /**
         * Manage a response to OpenSearch query
         * @function manageFeaturesResponse
         * @memberof OpenSearchLayer#
         * @param {Array} features Array of features loaded
         * @param {Tile} tile Tile
         * @private
         */
        OpenSearchLayer.prototype.manageFeaturesResponse = function(features,tile) {
            this.updateFeatures(features);

            for (i = features.length - 1; i >= 0; i--) {
                feature = features[i];

                if (!feature.hasOwnProperty("id")) {
                    feature.id = feature.properties.identifier;
                }

                // Check if feature still added ?
                alreadyAdded = this.featureStillAddedToTile(feature,tile);
                if (alreadyAdded) {
                    // Remote it from list
                } else {
                    // Add it
                    this.addFeature(feature,tile);
                }
                features.splice(i, 1);
            }
            this.globe.refresh();
        }

        /**************************************************************************************************************/

        /**
         * Update features
         * @function updateFeatures
         * @memberof OpenSearchLayer#
         * @param {Array} features Array of features
         * @private
         */
        OpenSearchLayer.prototype.updateFeatures = function (features) {
            for (var i = 0; i < features.length; i++) {
                var currentFeature = features[i];

                switch (currentFeature.geometry.type) {
                    case Constants.GEOMETRY.Point:
                        // Convert to geographic to simplify picking
                        if (currentFeature.geometry.coordinates[0] > 180) {
                            currentFeature.geometry.coordinates[0] -= 360;
                        }
                        break;
                    case Constants.GEOMETRY.Polygon:
                        var ring = currentFeature.geometry.coordinates[0];
                        for (var j = 0; j < ring.length; j++) {
                            // Convert to geographic to simplify picking
                            if (ring[j][0] > 180) {
                                ring[j][0] -= 360;
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        };

        /*************************************************************************************************************/

        return OpenSearchLayer;

    });
