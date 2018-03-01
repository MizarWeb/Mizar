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
define(['jquery','../Renderer/FeatureStyle', '../Renderer/VectorRendererManager', '../Utils/Utils', './AbstractLayer', './GroundOverlayLayer','../Renderer/RendererTileData', '../Tiling/Tile','../Tiling/GeoTiling','../Utils/Constants','./OpenSearch/OpenSearchForm','./OpenSearch/OpenSearchUtils','./OpenSearch/OpenSearchResult','./OpenSearch/OpenSearchRequestPool','./OpenSearch/OpenSearchCache'],
    function ($,FeatureStyle, VectorRendererManager, Utils, AbstractLayer, GroundOverlayLayer,RendererTileData, Tile,GeoTiling,Constants,OpenSearchForm,OpenSearchUtils,OpenSearchResult,OpenSearchRequestPool,OpenSearchCache) {

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
            this.previousTileWidth = null;
            this.previousDistance = null;

            // Used for picking management
            //this.features = [];
            // Counter set, indicates how many times the feature has been requested
            //this.featuresSet = {};
            //this.tilesToLoad = [];

            // Keep save of all tiles where a feature is set, in order to remove all when reset
            //this.allTiles = {};

            // Keep trace of all features loaded (TODO: make object more light, just keep geometry and style ?)
            this.features = [];
            // Keep trace of all features id loaded
            this.featuresIdLoaded = [];
            // Keep trace of all tiles loaded (bound, key and features id associated)
            this.tilesLoaded = [];

            // last datetime for removing outside
            this.lastRemovingDateTime = null;
            this.removingDeltaSeconds = options.hasOwnProperty('removingDeltaSeconds') ? options.removingDeltaSeconds : 5;

            // OpenSearch result
            this.result = new OpenSearchResult();

            // Pool for request management
            this.pool = new OpenSearchRequestPool(this);
            
            // Cache for data management
            this.cache = new OpenSearchCache();

            // Force Refresh
            this.forceRefresh = false;

            if (typeof this.describeUrl !== 'undefined') {
              this.hasForm = true;
              this.loadGetCapabilities(this.manageCapabilities,this.describeUrl,this);
            } else {
              this.hasForm = false;
            }

            // Layer created on-the-fly to display quickook over openSearch layer
            // TODO: optimisation : created only once and reused ?
            this.currentQuicklookLayer = null;
            // Id of current feature displayed
            this.currentIdDisplayed = null;

            document.currentOpenSearchLayer = this;
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractLayer, OpenSearchLayer);

        /**************************************************************************************************************/

        OpenSearchLayer.TileState = {
            LOADING: 0,
            LOADED: 1,
            NOT_LOADED: 2
        };

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

            // update labels
            $(".labelPage")[0].innerText = "Page "+(num+1);

            //this.forceRefresh = true;
            for (var i=0;i<this.tilesLoaded.length;i++) {
                this.tilesLoaded[i].tile.osState = OpenSearchLayer.TileState.NOT_LOADED;
            }
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
            //g.addManualRendererLayer(this);
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
            //this.globe.vectorRendererManager.removePostRenderer(this);
            //g.removeManualRendererLayer(this);
            AbstractLayer.prototype._detach.call(this);
        };

        /**************************************************************************************************************/

        OpenSearchLayer.prototype.getTileByKey = function(key) {
            for (var i=0;i<this.tilesLoaded.length;i++) {
                if (this.tilesLoaded[i].key === key) {
                    return this.tilesLoaded[i];
                }
            }
            return null;
        }
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
            if (this.getTileByKey(key) === null) {
                this.tilesLoaded.push(
                    { "key" : key,
                      "tile" : tile 
                    }
                );
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
            for (var i=0;i<this.features.length;i++) {
                    this.globe.vectorRendererManager.removeGeometry(features[i].geometry);
            }
            this.features = [];
            this.featuresId = [];
            // clean tiles
            for (var i=0;i<this.tilesLoaded.length;i++) {
                this.tilesLoaded[i].tile.osState = OpenSearchLayer.TileState.NOT_LOADED;
            }
            this.tilesLoaded = [];

            // Clean old results
            var self = this;

            //this.globe.refresh();
            this.globe.renderContext.requestFrame();
            
        };


        /**************************************************************************************************************/

        /**
         * Remove all feature still used by a tile
         * @function removeTile
         * @param {Tile} tile Tile
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.removeTile = function (tile) {
            if (typeof tile.associatedFeaturesId === "undefined") {
                tile.associatedFeaturesId = [];
            }
            // For each feature of the tile
            for (var i=0;i<tile.associatedFeaturesId.length;i++) {
                featureId = tile.associatedFeaturesId[i];
                // Is this feature is used in other tile ?
                isUsed = false;
                for (var j=0;j<this.tilesLoaded.length;j++) {
                    aTile = this.tilesLoaded[j].tile;
                    if (tile.key !== aTile.key) {
                        if (typeof aTile.associatedFeaturesId !== "undefined") {
                            index = aTile.associatedFeaturesId.indexOf(featureId);
                        } else {
                            index = -1;
                        }
                        if (index >= 0) {
                            isUsed = true;
                            break;
                        }
                    }
                }

                if (isUsed === false) {
                    this.removeFeature(featureId);
                }
            }
            tile.associatedFeaturesId = [];
            // Remove the tile
            index = -1;
            for (var i=0;i<this.tilesLoaded.length;i++) {
                if (this.tilesLoaded[i].tile.key === tile.key) {
                    index = i;
                    break;
                }
            }
            if (index >= 0) {
                this.tilesLoaded.splice(index,1);
            }

        };

        /**************************************************************************************************************/

        /**
         * Remove all previous features
         * @function removeFeaturesOutside
         * @param {JSon} extent Extent
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.removeFeaturesOutside = function (extent) {
            // clean renderers
            nbRemoved = 0;
            for (var i=0;i<this.tilesLoaded.length;i++) {
                tile = this.tilesLoaded[i].tile;
                intersects = Utils.boundsIntersects(tile.bound,extent);
                if (intersects === false) {
                    this.removeTile(tile);
                    nbRemoved++;
                }
            }
            console.log(nbRemoved+" tiles removed");
        };

        /**************************************************************************************************************/

        /**
         * Adds feature to the layer 
         * @function addFeature
         * @memberof OpenSearchLayer#
         * @param {Feature} feature Feature
         */
        OpenSearchLayer.prototype.addFeature = function (feature) {
            // update list id added
            this.featuresIdLoaded.push(feature.id);

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

            this.features.push(feature);

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
         *  (called when it's sure to have to remove feature)
         * @function removeFeature
         * @memberof OpenSearchLayer#
         * @param {String} featureId Feature id
         */
        OpenSearchLayer.prototype.removeFeature = function (featureId) {
            var featureIndex = this.getFeatureIndexById(featureId);
            var feature = this.features[featureIndex];

            // remove id from featuresId
            var index = this.featuresIdLoaded.indexOf(featureId);
            if (index !== -1) this.featuresIdLoaded.splice(index, 1);

            this.globe.vectorRendererManager.removeGeometry(feature.geometry,this);

            // Remove from list of features
            this.features.splice(featureIndex,1);
        };

        /**************************************************************************************************************/
    
        /**
         * Load quicklook
         * @function loadQuicklook
         * @memberof OpenSearchLayer#
         * @param {Feature} feature Feature
         * @param {String} url Url of image
         */
        OpenSearchLayer.prototype.loadQuicklook = function (feature, url) {
            // Save coordinates
            this.currentIdDisplayed = feature.id;
            
            // Get quad coordinates
            var coordinates = feature.geometry.coordinates[0];
            var quad = [];
            for (var i=0;i<4;i++) {
                quad[i] = coordinates[i];
            }

            if (this.currentQuicklookLayer === null) {
                // Creation first time
                this.currentQuicklookLayer = new GroundOverlayLayer({
                        "quad":quad,
                        "image":url
                });
                this.currentQuicklookLayer._attach(this.globe);
            } else {
                this.currentQuicklookLayer.update(quad,url);
            }
            this.globe.refresh();
         };
    
        /**************************************************************************************************************/

        /**
         * Indicate if quicklook is currently displayed
         * @function isQuicklookDisplayed
         * @memberof OpenSearchLayer#
         * @return {Boolean} Is quicklook currently displayed ?
         */
        OpenSearchLayer.prototype.isQuicklookDisplayed = function () {
            // Trivial case
            return (this.currentQuicklookLayer !== null);
         };

         /**************************************************************************************************************/

       /**
         * Remove quicklook
         * @function removeQuicklook
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.removeQuicklook = function () {
            if (this.currentQuicklookLayer === null) {
                return;
            }

            this.currentQuicklookLayer._detach();
            this.currentQuicklookLayer = null;
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
           if (this.globe.vectorRendererManager.removeGeometry(feature.geometry,this)) {
            feature.properties.style = style;
            this.globe.vectorRendererManager.addGeometry(this, feature.geometry, style);
            }
        };

        /**************************************************************************************************************/

        /**
         * Prepare parameters for a given bound
         * @function prepareParameters
         * @memberof OpenSearchLayer#
         * @param {Bound} bound Bound
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
                // todo sort tiles

                // =========================================================================
                // Determination of zoom level change
                // =========================================================================

                var newTileWidth = this.tiles[0].bound.east-this.tiles[0].bound.west;
                var ctx = this.callbackContext;
                var distance = null;
                if (ctx) {
                    var initNav = ctx.getNavigation();
                    distance = initNav.getDistance();
                }
                // TODO : warning, float comparison not ok
                var isZoomLevelChanged = false;
                isZoomLevelChanged = (newTileWidth !== this.previousTileWidth);
                if (ctx) {
                    isZoomLevelChanged = isZoomLevelChanged && (distance !== this.previousDistance);
                    this.previousDistance = distance;
                } }
                if (isZoomLevelChanged) {
                    console.log("Changement of zoom level, go to page 1");
                    // Go to page 1
                    OpenSearchUtils.setCurrentValueToParam(this.formDescription,"page",1);

                    this.result.featuresLoaded = 0;
                    $(".labelLoaded")[0].innerText = "loaded : "+this.features.length;
                    $(".labelPage")[0].innerText = "Page 1";
                }

                // =========================================================================
                // Check each tile
                // =========================================================================

                this.previousTileWidth = newTileWidth;
                this.previousViewKey = globalKey;
                this.result.featuresTotal = 0;
                for (var i=0;i<tiles.length;i++) {
                    var currentTile = tiles[i];
                    if (typeof currentTile.key === "undefined") {
                        currentTile.key = this.cache.getKey(currentTile.bound);
                    }
                    // If no state defined...
                    if ( (currentTile.osState === null) || (typeof currentTile.osState === 'undefined')) {
                        //...set it to NOT_LOADED
                        currentTile.osState = OpenSearchLayer.TileState.NOT_LOADED;
                    }

                    if (currentTile.osState === OpenSearchLayer.TileState.NOT_LOADED) {
                        var url = this.buildUrl(currentTile.bound);
                        if (url !== null) {
                            currentTile.osState = OpenSearchLayer.TileState.LOADING;
                            this.launchRequest(currentTile, url);
                        }
                    } else if (currentTile.osState === OpenSearchLayer.TileState.LOADED) {
                        //console.log("tile still loaded !!!");
                    } else if (currentTile.osState === OpenSearchLayer.TileState.LOADING) {
                        //console.log("tile loading...");
                    }



                    /**tileCache = this.cache.getTile(tiles[i].bound);
                    this.updateGUI();
                    if (tileCache === null) {
                        var url = this.buildUrl(tiles[i].bound);
                        if (url !== null) {
                            this.launchRequest(tiles[i], url);
                        }
                    } else {
                        this.result.featuresTotal += tileCache.remains;
                        this.manageFeaturesResponse(tileCache.features.slice(),tiles[i]);
                        this.updateGUI();
                    }*/

                    // Remove all feature outside view of tiles
                    doRemove = false;
                    if (this.lastRemovingDateTime === null) {
                        doRemove = true;
                    } else {
                        doRemove = (Date.now() - this.lastRemovingDateTime) >= (this.removingDeltaSeconds * 1000);
                    }
                    if (doRemove) {
                        var viewExtent = this.getExtent(tiles);
                        this.lastRemovingDateTime = Date.now();
                        this.removeFeaturesOutside(viewExtent);
                    }
                }
        }
        
        /**************************************************************************************************************/

        /**
         * Get extent from array of tiles
         * @function getExtent
         * @param {Array} tiless Array of tiles
         * @return {Json} Extent (north, south, east, west)
         * @memberof OpenSearchLayer#
         */

        OpenSearchLayer.prototype.getExtent = function(tiles) {
            var result = {
                "east":-180,
                "west":+180,
                "north":-90,
                "south":+90
            }
            var bound;
            for (var i=0;i<tiles.length;i++) {
                bound = tiles[i].bound;
                result.south = bound.south<result.south ? bound.south  : result.south;
                result.north = bound.north>result.north ? bound.north  : result.north;
                result.east  = bound.east >result.east  ? bound.east   : result.east;
                result.west  = bound.west <result.west  ? bound.west   : result.west;
            }
            return result;
        }

        /**************************************************************************************************************/

        /**
         * Get geometry extent 
         * @function getGeometryExtent
         * @param {Json} geometry Geometry
         * @memberof OpenSearchLayer#
         */
        OpenSearchLayer.prototype.getGeometryExtent = function(geometry) {
            var result = {
                "east":-180,
                "west":+180,
                "north":-90,
                "south":+90
            }
            for (var i=0;i<geometry.coordinates[0].length;i++) {
                coord = geometry.coordinates[0][i];
                result.south = coord[1] < result.south ? coord[1]  : result.south;
                result.north = coord[1] > result.north ? coord[1]  : result.north;
                result.east  = coord[0] > result.east  ? coord[0]  : result.east;
                result.west  = coord[0] < result.west  ? coord[0]  : result.west;
                
            }
            return result;
        }

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
         * @function setVisible
         * @memberOf OpenSearchLayer#
         * @throws {TypeError} - The parameter of setVisible should be a boolean
         */
        OpenSearchLayer.prototype.setVisible = function (arg) {
            if (typeof arg === "boolean") {
                // Change for current layer
                if (this.visible !== arg && this.globe.attributionHandler) {
                    this.globe.attributionHandler.toggleAttribution(this);
                }
                this.visible = arg;

                var linkedLayers = this.callbackContext.getLinkedLayers(this.ID);
                // Change for wms linked layers
                for (var i=0;i<linkedLayers.length;i++) {
                    linkedLayers[i].setVisible(arg);
                }

                if (this.globe) {
                    this.globe.renderContext.requestFrame();
                }
                this.publish(Constants.EVENT_MSG.LAYER_VISIBILITY_CHANGED, this);
            } else {
                throw new TypeError("the parameter of setVisible should be a boolean", "AbstractLayer.js");
            }

        }
        
        /**************************************************************************************************************/

        /**
        /**
         * @function setOpacity
         * @memberOf OpenSearchLayer#
         * @throws {RangeError} opacity - opacity value should be a value in [0..1]
         */
        OpenSearchLayer.prototype.setOpacity = function (arg) {
            if (typeof arg === "number" && arg >=0.0 && arg <=1.0) {
                this.opacity = arg;

                var linkedLayers = this.callbackContext.getLinkedLayers(this.ID);
                // Change for wms linked layers
                for (var i=0;i<linkedLayers.length;i++) {
                    linkedLayers[i].opacity = arg;
                }
                
                if (this.globe) {
                    this.globe.renderContext.requestFrame();
                }
                this.publish(Constants.EVENT_MSG.LAYER_OPACITY_CHANGED, this);
            } else {
               throw new RangeError('opacity value should be a value in [0..1]', "AbstractLayer.js");
            }
        };

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
            this.removeFeaturesOutside(null);
            
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
            //$("#resultNavigation").html(message);
        }

        /**************************************************************************************************************/

        /**
         * Check is feature still added to global render
         * @function featureStillAdded
         * @memberof OpenSearchLayer#
         * @param {String} featureId Feature id
         * @private
         */
        OpenSearchLayer.prototype.featureStillAdded = function (featureId) {

            var num = this.featuresIdLoaded.indexOf(featureId);

            return (num >= 0);
        }

        /**
         * Check is feature still added to tile
         * @function featureStillAddedToTile
         * @memberof OpenSearchLayer#
         * @param {String} featureId Feature id
         * @param {Tile} tile Tile
         * @private
         */
        OpenSearchLayer.prototype.featureStillAddedToTile = function (featureId,tile) {
            if (typeof tile.associatedFeaturesId.length === "undefined") {
                return false;
            }

            var num = tile.associatedFeaturesId.indexOf(featureId);

            return (num >= 0);
        }

        /**************************************************************************************************************/

        /**
         * Load WMS layer
         * @function loadWMS
         * @memberof OpenSearchLayer#
         * @param {Json} selectedData Selected data
         * @private
         */
        OpenSearchLayer.prototype.loadWMS = function(selectedData) {
            var extent = this.getGeometryExtent(selectedData.feature.geometry);
            var endpoint = selectedData.feature.properties.services.browse.layer.url;
            var name = selectedData.layer.name + " (WMS)";
            var layerDescription = {
                "type": "WMS",
                "name": name,
                "baseUrl":endpoint,
                "getCapabilities":endpoint,
                "onlyFirst":true,
                "format":"image/png",
                "visible": true,
                "restrictTo": extent,
                "background": false,
                "linkedTo": selectedData.layer.ID
            };
            var idLayerAdded = selectedData.layer.callbackContext.addLayer(layerDescription).ID;
            
            // Add feature id of wms into list a current WMS displayed
            this.currentWMS.push({
                "featureId" : selectedData.feature.id,
                "layerId" : idLayerAdded
            });

            $(".QLWMS_"+selectedData.layer.getShortName())[0].style = "display:inline";
        }
        
        /**************************************************************************************************************/

        /**
         * Unload all WMS layer
         * @function unloadAllWMS
         * @memberof OpenSearchLayer#
         * @private
         */
        OpenSearchLayer.prototype.unloadAllWMS = function() {
            // Remove feature id
            var layerId = null;
            for (var i=0;i<this.currentWMS.length;i++) {
                layerId = this.currentWMS[i].layerId;
                this.callbackContext.removeLayer(layerId);
            }

            this.callbackContext.refresh();
            
            this.currentWMS = [];

            $(".QLWMS_"+this.getShortName())[0].style = "display:none";
        }

        /**************************************************************************************************************/

        /**
         * Unload WMS layer
         * @function unloadWMS
         * @memberof OpenSearchLayer#
         * @param {Json} selectedData Selected data
         * @private
         */
        OpenSearchLayer.prototype.unloadWMS = function(selectedData) {
            // Remove feature id
            var newCurrentWMS = [];
            var layerId = null;
            for (var i=0;i<this.currentWMS.length;i++) {
                if (this.currentWMS[i].featureId !== selectedData.feature.id) {
                    newCurrentWMS.push(this.currentWMS[i]);
                } else {
                    layerId = this.currentWMS[i].layerId;
                }
            }

            if (layerId === null) {
                console.log("OpenSearchLayer.unloadWMS : layer not found");
                return;
            }

            this.currentWMS = newCurrentWMS;

            // remove layer
            selectedData.layer.callbackContext.removeLayer(layerId);
            selectedData.layer.callbackContext.refresh();

            if (this.currentWMS.length === 0) {
                $(".QLWMS_"+selectedData.layer.getShortName())[0].style = "display:none";

            }
        }
        /**************************************************************************************************************/

        /**
         * is associated layer ?
         * @function isAssociatedLayer
         * @memberof AbstractLayer#
         * @param {Integer} featureId feature id to search
         * @return {Boolean} is associated layer of this feature displayed ?
         * @private
         */
        OpenSearchLayer.prototype.isAssociatedLayer = function(featureId) {
            // Check if any WMS layer is loaded
            for (var i=0;i<this.currentWMS.length;i++) {
                if (this.currentWMS[i].featureId === featureId) {
                    return true;
                }
            }
            return false;
        }

        OpenSearchLayer.prototype.getFeatureById = function(featureId) {
            for (var i=0;i<this.features.length;i++) {
                if (this.features[i].id === featureId) {
                    return this.features[i];
                }
            }
            return null;
        }

        OpenSearchLayer.prototype.getFeatureIndexById = function(featureId) {
            for (var i=0;i<this.features.length;i++) {
                if (this.features[i].id === featureId) {
                    return i;
                }
            }
            return -1;
        }

        OpenSearchLayer.prototype.updateFeatureListWithTile = function(featureId,tile) {
            var feature = this.getFeatureById(featureId);
            if (feature === null) {
                // Feature not found...no action
                return;
            }
            
            // Creation of list of associated tiles to keep trace of feature by tile
            if (typeof feature.associatedTiles === "undefined") {
                feature.associatedTiles = [];
            }
            
            // Make key value for tile
            var key = this.cache.getKey(tile.bound);

            if (feature.associatedTiles.indexOf(key) >=0 ) {
                // still aded !
            } else {
                // add it
                feature.associatedTiles.push(key);
            }
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

            this.result.featuresLoaded += features.length;
            
            // Init array of feature id associated to tile
            if ((tile.associatedFeaturesId === null) || (typeof tile.associatedFeaturesId === "undefined")) {
                tile.associatedFeaturesId = [];
            }

            // For each feature...
            for (i = features.length - 1; i >= 0; i--) {
                feature = features[i];

                if (!feature.hasOwnProperty("id")) {
                    feature.id = feature.properties.identifier;
                }

                // Check if feature still globaly added ? (even on another tile)
                alreadyAdded = this.featureStillAdded(feature.id);
                alreadyAddedToTile = false;
                if (alreadyAdded) {
                    // Check if still added into this tile
                    alreadyAddedToTile = this.featureStillAddedToTile(feature.id,tile);
                    if (alreadyAddedToTile === true) {
                        // Nothing to do !
                    } else {
                        tile.associatedFeaturesId.push(feature.id);
                        this.updateFeatureListWithTile(feature.id,tile);
                    }
                } else {
                    this.addFeature(feature);
                    tile.associatedFeaturesId.push(feature.id);
                    this.updateFeatureListWithTile(feature.id,tile);
                } 
                features.splice(i, 1);
            }

            $(".labelLoaded")[0].innerText = "loaded : "+this.features.length;
            $(".labelTotal")[0].innerText = "total : ~ "+this.result.featuresTotal;
            
            // Only if tile was LOADING...
            if (tile.osState === OpenSearchLayer.TileState.LOADING) {
                // ...set to LOADED
                tile.osState = OpenSearchLayer.TileState.LOADED;
            }

            this.globe.refresh();
        };
        
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
