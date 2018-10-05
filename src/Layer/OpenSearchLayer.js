/*******************************************************************************
 * Copyright 2017, 2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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
define([
    "underscore-min",
    "../Renderer/FeatureStyle",
    "../Renderer/RendererManager",
    "../Utils/Utils",
    "../Utils/UtilsIntersection",
    "./AbstractLayer",
    "./GroundOverlayLayer",
    "../Renderer/RendererTileData",
    "../Tiling/Tile",
    "../Tiling/GeoTiling",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog",
    "./OpenSearch/OpenSearchForm",
    "./OpenSearch/OpenSearchUtils",
    "./OpenSearch/OpenSearchResult",
    "./OpenSearch/OpenSearchRequestPool",
    "./OpenSearch/OpenSearchCache",
    "moment"
], function(
    _,
    FeatureStyle,
    RendererManager,
    Utils,
    UtilsIntersection,
    AbstractLayer,
    GroundOverlayLayer,
    RendererTileData,
    Tile,
    GeoTiling,
    Constants,
    ErrorDialog,
    OpenSearchForm,
    OpenSearchUtils,
    OpenSearchResult,
    OpenSearchRequestPool,
    OpenSearchCache,
    Moment
) {
    /**
     * Update status attribute.<br/>
     * Called with pagination
     * @event OpenSearchLayer#updateStatsAttribute
     * @type {OpenSearchLayer~pagination|OpenSearchLayer~result}
     */

    /**
     * Toggle WMS<br/>
     * Called to display/undisplay the WMS related to the opensearch record
     * @event OpenSearchLayer#toggleWMS
     * @type {object}
     * @property {string} layer_name Name of the layer to make visible
     * @property {boolean} visible display/undisplay the layer related to the opensearch record
     */

    /**
     * Opensearch pagination.
     * @typedef {object} OpenSearchLayer~pagination
     * @property {string} shortName of the opensearch layer
     * @property {int} current page in the query
     */

    /**
     * Opensearch result.
     * @typedef {object} OpenSearchLayer~result
     * @property {string} shortName of the opensearch layer
     * @property {int} nb_loaded number of loaded records
     * @property {int} nb_total total number of records
     */

    /**
     * The time object.
     * @typedef {object} TimeTravelParams~details
     * @property {date|moment} date - the current time.
     * @property {string} display - the current date as string for display.
     * @property {object} [period] - time period.
     * @property {moment} [period.from] - start date.
     * @property {moment} [period.to] - stop date.
     */
    /**
     * @name OpenSearchLayer
     * @class
     * This layer draws an OpenSearch dynamic layer
     * @augments AbstractLayer
     * @param {Object} options Configuration properties for the layer. See {@link AbstractLayer} for base properties
     * @param {string} options.serviceUrl Url of OpenSearch description XML file
     * @param {int} [options.minOrder=5] Starting order for OpenSearch requests
     * @param {Boolean} [options.coordSystemRequired=true]
     * @param {FeatureStyle} [options.style=new FeatureStyle()]
     * @memberof module:Layer
     */
    var OpenSearchLayer = function(options) {
        AbstractLayer.prototype.constructor.call(this, Constants.LAYER.OpenSearch, options);

        this.minLevel = options.minLevel || 5;
        this.coordSystemRequired = options.hasOwnProperty("coordSystemRequired")? options.coordSystemRequired: true;


        this.previousKey = null;
        this.previousTileId = null;
        this.previousDistance = null;

        // Keep trace of all features loaded (TODO: make object more light, just keep geometry and style ?)
        this.features = [];

        // Keep trace of all tiles loaded (bound, key and features id associated)
        this.tilesLoaded = [];

        this.nbFeaturesTotal = 0;

        // last datetime for removing outside    
        this.lastRemovingDateTime = null;
        this.removingDeltaSeconds = options.hasOwnProperty("removingDeltaSeconds")? options.removingDeltaSeconds: 1;

        this.nbFeaturesTotal = 0;


        // Pool for request management (manage outside to be sharable between multiple opensearch layers)
        this.pool = options.openSearchRequestPool;

        // Cache for data management
        this.cache = new OpenSearchCache();

        // Force Refresh
        this.forceRefresh = false;

        // Layer created on-the-fly to display quickook over openSearch layer
        // TODO: optimisation : created only once and reused ?
        this.currentQuicklookLayer = null;
        // Id of current feature displayed
        this.currentIdDisplayed = null;

    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractLayer, OpenSearchLayer);

    /**************************************************************************************************************/

    OpenSearchLayer.TileState = {
        LOADING: 0,
        LOADED: 1,
        NOT_LOADED: 2
    };

    function _fixCrossLine(features) {
        var len = features.length;
        while (len--) {
            var currentFeature = features[len];

            if (currentFeature.geometry) {
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
        }        
    }

    function _isFeatureAttachedToMoreThanOne(featureId, key, tilesLoaded) {        
        var isUsed = false;
        var len = tilesLoaded.length;        
        while(len--) {
            var aTile = tilesLoaded[len].tile;
            if (key !== aTile.key) {
                var index = (typeof aTile.associatedFeaturesId !== "undefined") ? aTile.associatedFeaturesId.indexOf(featureId) : -1;                
                if (index >= 0) {
                    isUsed = true;
                    break;
                }                
            }
        }
        return isUsed;
    }    

    function _isAlreadyAdded(featureId, features) {
        var isFound = _.find(features, function (feature) { return feature.id === featureId; });
        return isFound !== undefined;
    }

    function _isAlreadyAddedInTile(featureId, tile) {
        if (typeof tile.associatedFeaturesId.length === "undefined") {
            return false;
        }
        var num = tile.associatedFeaturesId.indexOf(featureId);
        return num >= 0; 
    }  
    
    function _getFeatureIndexById(features, featureId) {
        var index = -1;
        var len = features.length;
        while(len--) {
            if (features[len].id === featureId) {
                index = len;
                break;
            }            
        }        
        return index;
    } 
    
    /**
     * Internal function to sort tiles
     * @function _sortTilesByDistance
     * @param {Tile} t1 First tile
     * @param {Tile} t2 Second tile
     * @private
     */
    function _sortTilesByDistance(t1, t2) {
        return t1.distance - t2.distance;
    }

    function _computeGeoTileIndex(tiles) {
        var resut = {};
        for (var i = 0; i < tiles.length; i++) {
            var level = tiles[i].level;
            if (resut[level] == null) {
                resut[level] = {
                    x:[],
                    y:[]
                };
            }
            resut[level].x.push(tiles[i].x);
            resut[level].y.push(tiles[i].y);
        }
        return resut;
    }  
    
    function _computeGeometryExtent(geometry) {
        var result = {
            east: -180,
            west: +180,
            north: -90,
            south: +90
        };
        for (var i = 0; i < geometry.coordinates[0].length; i++) {
            var coord = geometry.coordinates[0][i];
            result.south = coord[1] < result.south ? coord[1] : result.south;
            result.north = coord[1] > result.north ? coord[1] : result.north;
            result.east = coord[0] > result.east ? coord[0] : result.east;
            result.west = coord[0] < result.west ? coord[0] : result.west;
        }
        return result;        
    }   
    
    function _removeFeature(layer, featureId) {
        var featureIndex = _getFeatureIndexById(layer.features, featureId);
        var feature = layer.features[featureIndex];

        layer.getGlobe().getRendererManager().removeGeometry(feature.geometry, layer);

        // Remove from list of features
        layer.features[featureIndex] = layer.features[layer.features.length-1];
        layer.features.pop();
    }

    function _removeFeatures(layer) {
        // clean renderers
        var len = layer.features.length; 
        while (len--) {
            _removeFeature(layer, layer.features[len].id);
        }

        for (var i = 0; i < layer.tilesLoaded.length; i++) {
            layer.tilesLoaded[i].tile.osState[layer.getID()] = OpenSearchLayer.TileState.NOT_LOADED;
        }

        layer.getGlobe().getRenderContext().requestFrame();          
    }  
    
    function _removeTile(layer, tile) {
        if (typeof tile.associatedFeaturesId === "undefined") {
            tile.associatedFeaturesId = [];
        }
        // For each feature of the tile, remove the features
        var lenAssociatedFeaturesId = tile.associatedFeaturesId.length;
        while(lenAssociatedFeaturesId--) {
            var featureId = tile.associatedFeaturesId[lenAssociatedFeaturesId];
            if( !_isFeatureAttachedToMoreThanOne(featureId, tile.key, layer.tilesLoaded) ) {
                _removeFeature(layer, featureId);
            }
        }
        tile.associatedFeaturesId = [];

        // Remove the tile
        var len = layer.tilesLoaded.length;
        var indice;
        while (len--) {
            if(layer.tilesLoaded[len].tile.key === tile.key) {
                indice = len;
                break;
            }
        }
        layer.tilesLoaded[indice] = layer.tilesLoaded[layer.tilesLoaded.length-1];
        layer.tilesLoaded.pop();        
    }  
    
    function _removeFeaturesOutside(layer, visualTilesIndex) {
        for (var i = 0; i < layer.tilesLoaded.length; i++) {
            var tile = layer.tilesLoaded[i].tile;
            var intersects = UtilsIntersection.tileIntersects(tile,visualTilesIndex);
            if (intersects === false) {
                _removeTile(layer, tile);
            }
        }
    }   
    
    function _addFeatureToRenderers(layer, feature) {
        var geometry = feature.geometry;

        // Manage style, if undefined try with properties, otherwise use defaultStyle
        var style = layer.style;
        var props = feature.properties;
        if (props && props.style) {
            style = props.style;
        }

        // Manage geometry collection
        if (geometry.type === "GeometryCollection") {
            var geoms = geometry.geometries;
            for (var i = 0; i < geoms.length; i++) {
                layer.getGlobe().getRendererManager().addGeometry(layer, geoms[i], style);
            }
        } else {
            // Add geometry to renderers
            layer.getGlobe().getRendererManager().addGeometry(layer, geometry, style);
        }        
    } 

    function _removeFeatureFromRenderers(layer, feature) {
        return layer.getGlobe().getRendererManager().removeGeometry(feature.geometry, layer);
    }    
    
    function _addFeature(layer, feature) {
        var defaultCrs = {
            type: "name",
            properties: {
                name: Constants.CRS.WGS84
            }
        };

        feature.geometry.gid = feature.id;

        // MS: Feature could be added from ClusterOpenSearch which have features with different styles
        var style = feature.properties.style ? feature.properties.style : layer.style;
        //style.visible = true;
        style.opacity = layer.getOpacity();

        layer.features.push(feature);

        // Add features to renderer if layer is attached to planet
        _addFeatureToRenderers(layer, feature);
        if (layer.isVisible()) {
            layer.getGlobe().getRenderContext().requestFrame();
        }        
    } 
    
    function _cleanCache(layer) {
        layer.cache.reset();
        layer.previousViewKey = null;        
    }  
    

    function _prepareParameters(layer, tile) {
        var param; // param managed
        var code; // param code
        for (var i = 0; i < layer.getServices().queryForm.parameters.length; i++) {
            param = layer.getServices().queryForm.parameters[i];
            code = param.value;
            code = code.replace("?}", "}");
            if (code === "{geo:box}") {
                // set bbox
                param.currentValue =
                    tile.bound.west +
                    "," +
                    tile.bound.south +
                    "," +
                    tile.bound.east +
                    "," +
                    tile.bound.north;
            }
        }
    }   
    
    function _addFeatureToRenderersCurrentLevel(layer, feature) {
        var geometry = feature.geometry;

        // Manage style, if undefined try with properties, otherwise use defaultStyle
        var style = layer.style;
        var props = feature.properties;
        if (props && props.style) {
            style = props.style;
        }

        // Manage geometry collection
        if (geometry.type === "GeometryCollection") {
            var geoms = geometry.geometries;
            for (var i = 0; i < geoms.length; i++) {
                layer.getGlobe().rendererManager.addGeometryCurrentLevel(layer, geoms[i], style);
            }
        } else {
            // Add geometry to renderers
            layer.getGlobe().rendererManager.addGeometryCurrentLevel(layer, geometry, style);
        }        
    }

    function _removeFeatureFromRenderersCurrentLevel(layer, feature) {
        return layer.getGlobe().getRendererManager().removeGeometryCurrentLevel(feature.geometry, layer);
    }     

    function _buildUrl(layer, tile) {
        //var url = this.serviceUrl + "/search?order=" + tile.order + "&healpix=" + tile.pixelIndex;
        if (!layer.getServices().hasOwnProperty("queryForm")) {
            return null;
        }
        var url = layer.getServices().queryForm.template;

        // Prepare parameters for this tile
        _prepareParameters(layer, tile);

        // Check each parameter
        var param; // param managed
        var currentValue; // value set
        for (
            var i = 0;
            i < layer.getServices().queryForm.parameters.length;
            i++
        ) {
            param = layer.getServices().queryForm.parameters[i];
            currentValue = param.currentValueTransformed();
            if (currentValue === null) {
                // Remove parameter if not mandatory (with a ?)
                url = url.replace(
                    "&" + param.name + "=" + param.value.replace("}", "?}"),
                    ""
                );
                url = url.replace(
                    param.name + "=" + param.value.replace("}", "?}"),
                    ""
                );
                // Set blank if parameter is mandatory
                url = url.replace(param.value, "");
            } else {
                // replace value
                url = url.replace(param.value, currentValue);
                // replace optional value
                url = url.replace(param.value.replace("}", "?}"), currentValue);
            }
        }
        return url;
    }    

    function _isTileLoaded(tilesLoaded, key) {
        var isLoaded = false;
        var len = tilesLoaded.length;
        while(len--) {
            if (tilesLoaded[len].key === key) {
                isLoaded = true;
                break;
            }
        }
        return isLoaded;
    }    

    function _removeFeaturesExternalFov(layer, tiles) {
        var doRemove = false;
        if (layer.lastRemovingDateTime === null) {
            doRemove = true;
        } else {
            doRemove = Date.now() - layer.lastRemovingDateTime >= layer.removingDeltaSeconds * 1000;
        }
        if (doRemove) {
            var visualTilesIndex = _computeGeoTileIndex(tiles);
            layer.lastRemovingDateTime = Date.now();
            _removeFeaturesOutside(layer, visualTilesIndex);                 
        }
    }  
    
    function _initOsState(layer, tile) {
        if (typeof tile.key === "undefined") {
            tile.key = OpenSearchUtils.getKey(tile);
        }        
        // If no state defined...
        if (tile.osState == null) {
            //...set it to NOT_LOADED
            tile.osState = [];
        }    
        if (tile.osState[layer.getID()] == null) {
            tile.osState[layer.getID()] = OpenSearchLayer.TileState.NOT_LOADED;
        }            
    }

    function _mustBeRefreshed(previousKey, currentKey, forceRefreshed) {
        var needRefresh;
        if (previousKey === null || forceRefreshed === true) {
            needRefresh = true;
        } else {
            needRefresh = previousKey !== currentKey;
        }        
        return needRefresh;
    }

    function _computeStats(layer) {
        var nb = 0;
        for(var i=0; i<layer.tilesLoaded.length; i++) {
            var tileLoaded = layer.tilesLoaded[i].tile;
            if(tileLoaded.associatedFeaturesId) {
                nb = nb + tileLoaded.associatedFeaturesId.length;
            }             
        } 
        console.log("features in tileLoaded :"+nb);
        console.log("nb features :"+layer.features.length);                
    }

    function _requestTile(layer, tile) {
        var url = _buildUrl(layer, tile);
        if (url !== null) {            
            var cachedTile = layer.cache.getCacheFromKey(url);
            if(cachedTile == null) {
                // cache
                tile.osState[layer.getID()] =  OpenSearchLayer.TileState.LOADING;
                layer.pool.addQuery(url, tile, layer);
            } else {
                // If no state defined...
                if (cachedTile.osState == null) {
                    //...set it to NOT_LOADED
                    cachedTile.osState = [];
                }      
                cachedTile.osState[layer.getID()] =  OpenSearchLayer.TileState.LOADING;
                layer.computeFeaturesResponse(cachedTile.features, cachedTile, cachedTile.total);                                                     
            }    
            _computeStats(layer);        
        }
    }    
    /**************************************************************************************************************/

    /**
     * @function getInformationType
     * @memberof OpenSearchLayer#
     */
    OpenSearchLayer.prototype.getInformationType = function() {
        return Constants.INFORMATION_TYPE.VECTOR;
    };

    /**
     * @function setTime
     * @memberof OpenSearchLayer#
     * @param {Time.configuration} time Time configuration
     */
    OpenSearchLayer.prototype.setTime = function(time) {
        AbstractLayer.prototype.setTime(time);
        this.setParameter.call(this, "mizar:time", time);
    };

    /**
     * @function setParameter
     * @memberof OpenSearchLayer#
     * @param {string} paramName Name of parameter
     * @param {Time.configuration} value Time configuration
     */
    OpenSearchLayer.prototype.setParameter = function(paramName, value) {
        if (paramName === "mizar:time") {
            value.period.from = Moment(value.period.from).format("YYYY-MM-DD HH:mm");
            value.period.to = Moment(value.period.to).format("YYYY-MM-DD HH:mm");

            OpenSearchUtils.setCurrentValueToParam(this.getServices().queryForm,"time:start",value.period.from);
            OpenSearchUtils.setCurrentValueToParam(this.getServices().queryForm,"time:end",value.period.to);
        } else {
            OpenSearchUtils.setCurrentValueToParam(this.getServices().queryForm,paramName,value
            );
        }
        this.resetAll();
    };

    /**
     * Go to next page
     * @function nextPage
     * @memberof OpenSearchLayer#
     * @fires OpenSearchLayer#updateStatsAttribute
     */
    OpenSearchLayer.prototype.nextPage = function() {
        var num = OpenSearchUtils.getCurrentValue(this.getServices().queryForm,"startPage");
        // If not specified, set default to 1
        if (num === null || typeof num === "undefined") {
            num = 1;
        } else {
            num = parseInt(num);
        }
        OpenSearchUtils.setCurrentValueToParam(this.getServices().queryForm,"startPage",num + 1);

        // update labels
        this.callbackContext.publish(
            Constants.EVENT_MSG.LAYER_UPDATE_STATS_ATTRIBUTES,
            {
                shortName: this.getShortName(),
                page: num + 1
            }
        );

        this.forceRefresh = true;
        for (var i = 0; i < this.tilesLoaded.length; i++) {
            this.tilesLoaded[i].tile.osState[this.getID()] = OpenSearchLayer.TileState.NOT_LOADED;
        }
        this.getGlobe().getRenderContext().requestFrame();
    };

    /**************************************************************************************************************/

    /**
     * Attaches the layer to the globe
     * @function _attach
     * @memberof OpenSearchLayer#
     * @param g The globe
     * @private
     */
    OpenSearchLayer.prototype._attach = function(g) {
        AbstractLayer.prototype._attach.call(this, g);
        this.extId += this.id;
        g.getTileManager().addPostRenderer(this);
    };

    /**************************************************************************************************************/

    /**
     * Detach the layer from the globe
     * @function _detach
     * @memberof OpenSearchLayer#
     * @private
     */
    OpenSearchLayer.prototype._detach = function() {
        this.getGlobe().getTileManager().removePostRenderer(this);
        AbstractLayer.prototype._detach.call(this);
    };

    /**************************************************************************************************************/


    OpenSearchLayer.prototype.modifyFeatureStyle = function(feature, style) {
        if (_removeFeatureFromRenderers(this, feature)) {
            feature.properties.style = style;
            _addFeatureToRenderers(this, feature);
        }        
    };   

    /**
     * Load quicklook
     * @function loadQuicklook
     * @memberof OpenSearchLayer#
     * @param {Feature} feature Feature
     * @param {string} url Url of image
     */
    OpenSearchLayer.prototype.loadQuicklook = function(feature, url) {
        // Save coordinates
        this.currentIdDisplayed = feature.id;

        // Get quad coordinates
        var coordinates = feature.geometry.coordinates[0];
        var quad = [];
        for (var i = 0; i < 4; i++) {
            quad[i] = coordinates[i];
        }

        if (this.currentQuicklookLayer === null) {
            // Creation first time
            this.currentQuicklookLayer = new GroundOverlayLayer({quad: quad,image: url});
            this.currentQuicklookLayer._attach(this.globe);
        } else {
            this.currentQuicklookLayer.update(quad, url);
        }
        this.getGlobe().refresh();
    };

    /**************************************************************************************************************/

    /**
     * Indicate if quicklook is currently displayed
     * @function isQuicklookDisplayed
     * @memberof OpenSearchLayer#
     * @return {Boolean} Is quicklook currently displayed ?
     */
    OpenSearchLayer.prototype.isQuicklookDisplayed = function() {
        // Trivial case
        return this.currentQuicklookLayer !== null;
    };

    /**************************************************************************************************************/

    /**removeGeometry
     * Remove quicklook
     * @function removeQuicklook
     * @memberof OpenSearchLayer#
     */
    OpenSearchLayer.prototype.removeQuicklook = function() {
        if (this.currentQuicklookLayer === null) {
            return;
        }

        this.currentQuicklookLayer._detach();
        this.currentQuicklookLayer = null;
    };

    /**************************************************************************************************************/

    /**
     * Highlight feature
     * @function highlight
     * @memberof OpenSearchLayer#
     * @param {Feature} feature Feature
     * @param {FeatureStyle} style Style
     */
    OpenSearchLayer.prototype.highlight = function(feature, style) {
        feature.properties.style = style;
        _addFeatureToRenderersCurrentLevel(this, feature);
    };

    /**
     * Unhighlight feature
     * @function unhighlight
     * @memberof OpenSearchLayer#
     * @param {Feature} feature Feature
     * @param {FeatureStyle} style Style
     */
    OpenSearchLayer.prototype.unhighlight = function(feature, style) {
        _removeFeatureFromRenderersCurrentLevel(this, feature);
    };

    /**
     * Render function
     * @function render
     * @memberof OpenSearchLayer#
     * @param {Tile[]} tiles The array of tiles to render
     * @fires Context#startLoad
     * @fires Context#endLoad
     * @fires Context#features:added
     */
    OpenSearchLayer.prototype.render = function(tiles) {
        if (!this.isVisible() || tiles.length === 0) {
            return;
        }         

        this.currentKey = OpenSearchUtils.getArrayBoundKey(tiles);

        if (_mustBeRefreshed(this.previousKey, this.currentKey, this.forceRefresh)) {            
            if (this.forceRefresh === true) {
                // Remove cache, in order to reload new features
                _cleanCache(this);
                this.forceRefresh = false;
            }

            // Sort tiles in order to load the first tiles closed to the camera
            tiles.sort(_sortTilesByDistance);

            this.currentLevel = tiles[0].level;
            this.ctx = this.callbackContext;

            this.isZoomLevelChanged = this.currentLevel !== this.previousLevel;

            if (this.isZoomLevelChanged) {
                // Go to page 1
                OpenSearchUtils.setCurrentValueToParam(
                    this.getServices().queryForm,
                    "startPage",
                    1
                );
                // update labels
                this.callbackContext.publish(
                    Constants.EVENT_MSG.LAYER_UPDATE_STATS_ATTRIBUTES,
                    {
                        shortName: this.getShortName(),
                        page: 1
                    }
                );                
            }

            this.nbFeaturesTotal = 0;

            // =========================================================================
            // Check each tile
            // =========================================================================

            this.previousLevel = this.currentLevel;
            this.previousKey = this.currentKey;
            for (var i = 0; i < tiles.length; i++) {
                var currentTile = tiles[i];

                _initOsState(this, currentTile);
                switch (currentTile.osState[this.getID()]) {
                case OpenSearchLayer.TileState.NOT_LOADED:
                    _requestTile(this, currentTile);
                    break;
                case OpenSearchLayer.TileState.LOADED:
                    //console.log("tile still loaded !!!");
                    break;
                case OpenSearchLayer.TileState.LOADING:
                    //console.log("tile loading...");
                    break;
                default:
                    break;
                }
                // Remove all feature outside view of tiles
                _removeFeaturesExternalFov(this, tiles);
            }
        }
    };


    /**************************************************************************************************************/

    /**
     * setRequestProperties OpenSearch form from a submit
     * @function setRequestProperties
     * @memberof OpenSearchLayer#
     * @param {Object} properties query parameters from query form
     */
    OpenSearchLayer.prototype.setRequestProperties = function(properties) {
        this.getServices().queryForm.setParametersValueFrom(properties);
        this.getServices().queryForm.updateFromGUI();
        this.resetAll();
        this.forceRefresh = true;
    };

    /**************************************************************************************************************/

    /**
     * @function setVisible
     * @memberof OpenSearchLayer#
     * @throws {TypeError} - The parameter of setVisible should be a boolean
     */
    OpenSearchLayer.prototype.setVisible = function(arg) {
        if (typeof arg === "boolean") {
            // Change for current layer
            if (this.visible !== arg && this.getGlobe().attributionHandler) {
                this.getGlobe().attributionHandler.toggleAttribution(this);
            }
            this.visible = arg;

            var linkedLayers = this.callbackContext.getLinkedLayers(this.ID);
            // Change for wms linked layers
            for (var i = 0; i < linkedLayers.length; i++) {
                linkedLayers[i].setVisible(arg);
            }

            if (
                typeof this.currentQuicklookLayer !== "undefined" &&
                this.currentQuicklookLayer !== null
            ) {
                //this.currentQuicklookLayer.setVisible(this.visible);
                if (this.visible === false) {
                    this.removeQuicklook();
                }
            }

            if (this.getGlobe()) {
                this.getGlobe()
                    .getRenderContext()
                    .requestFrame();
            }
            this.publish(Constants.EVENT_MSG.LAYER_VISIBILITY_CHANGED, this);
        } else {
            throw new TypeError(
                "the parameter of setVisible should be a boolean",
                "AbstractLayer.js"
            );
        }
    };

    /**************************************************************************************************************/
    /**
     * @function setOpacity
     * @memberof OpenSearchLayer#
     * @throws {RangeError} opacity - opacity value should be a value in [0..1]
     */
    OpenSearchLayer.prototype.setOpacity = function(arg) {
        if (typeof arg === "number" && arg >= 0.0 && arg <= 1.0) {
            var targetStyle = new FeatureStyle(this.getStyle());
            targetStyle.setOpacity(arg);

            for (var i = 0; i < this.features.length; i++) {
                this.modifyFeatureStyle(this.features[i], targetStyle);
            }

            var linkedLayers = this.callbackContext.getLinkedLayers(
                this.getID()
            );
            // Change for wms linked layers
            for (i = 0; i < linkedLayers.length; i++) {
                linkedLayers[i].getStyle().setOpacity(arg);
            }

            AbstractLayer.prototype.setOpacity.call(this, arg);
        } else {
            throw new RangeError(
                "opacity value should be a value in [0..1]",
                "AbstractLayer.js"
            );
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
        _cleanCache(this);
        // Remove all features
        _removeFeatures(this);
    };


    /**
     * Load WMS layer
     * @function loadWMS
     * @memberof OpenSearchLayer#
     * @param {Json} selectedData Selected data
     * @fires OpenSearchLayer#toggleWMS
     * @fires Context#backgroundLayer:added
     * @fires Context#layer:added
     */
    OpenSearchLayer.prototype.loadWMS = function(selectedData) {
        var extent = _computeGeometryExtent(selectedData.feature.geometry);
        var endpoint = selectedData.feature.properties.services.browse.layer.url;
        var name = selectedData.layer.name + " (WMS)";
        var layerDescription = {
            type: "WMS",
            name: name,
            baseUrl: endpoint,
            onlyFirst: true,
            format: "image/png",
            visible: true,
            restrictTo: extent,
            background: false,
            linkedTo: selectedData.layer.ID
        };
        var self = this;
        selectedData.layer.callbackContext.addLayer(layerDescription, function(
            layerID
        ) {
            // Add feature id of wms into list a current WMS displayed
            self.addServicesRunningOnRecord(selectedData.feature.id, layerID);

            if (typeof self.callbackContext !== "undefined") {
                self.callbackContext.publish(
                    Constants.EVENT_MSG.LAYER_TOGGLE_WMS,
                    {
                        layer_name: selectedData.layer.getShortName(),
                        visible: true
                    }
                );
            }
        });
    };

    /**************************************************************************************************************/

    /**
     * Unload all WMS layer
     * @function unloadAllWMS
     * @memberof OpenSearchLayer#
     * @fires OpenSearchLayer#toggleWMS
     */
    OpenSearchLayer.prototype.unloadAllWMS = function(selectedData) {
        this.removeServicesRunningOnRecords();
        this.removeServicesRunningOnCollection();

        this.callbackContext.refresh();

        if (typeof this.callbackContext !== "undefined") {
            if (typeof selectedData !== "undefined") {
                this.callbackContext.publish(
                    Constants.EVENT_MSG.LAYER_TOGGLE_WMS,
                    {
                        layer_name: selectedData.layer.getShortName(),
                        visible: false
                    }
                );
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Unload WMS layer
     * @function unloadWMS
     * @memberof OpenSearchLayer#
     * @param {Json} selectedData Selected data
     * @fires OpenSearchLayer#toggleWMS
     */
    OpenSearchLayer.prototype.unloadWMS = function(selectedData) {
        // Remove feature id
        this.removeServicesRunningOnRecord(selectedData.feature.id);

        selectedData.layer.callbackContext.refresh();

        if (typeof this.callbackContext !== "undefined") {
            this.callbackContext.publish(Constants.EVENT_MSG.LAYER_TOGGLE_WMS, {
                layer_name: selectedData.layer.getShortName(),
                visible: false
            });
        }
    };

    /**************************************************************************************************************/
    /**
     * Compute a response to OpenSearch query
     * @function computeFeaturesResponse
     * @memberof OpenSearchLayer#
     * @param {Array} features Array of features loaded
     * @param {Tile} tile Tile
     * @param {int} nbFeaturesTotalPerTile Total number of features found over all pages for a given tile
     * @fires OpenSearchLayer#updateStatsAttribute
     */
    OpenSearchLayer.prototype.computeFeaturesResponse = function(features, tile, nbFeaturesTotalPerTile) {
        _fixCrossLine(features);

        // compute the total number of available features on the server in the FOV
        this.nbFeaturesTotal += nbFeaturesTotalPerTile;

        // Init array of feature id associated to tile
        if (tile.associatedFeaturesId == null) {
            tile.associatedFeaturesId = [];
        }

        // For each feature...
        for (var i = features.length - 1; i >= 0; i--) {
            var feature = features[i];

            if (!feature.hasOwnProperty("id")) {
                feature.id = feature.properties.identifier;
            }

            if (_isAlreadyAdded(feature.id, this.features)) {
                // Check if still added into this tile
                if (_isAlreadyAddedInTile(feature.id, tile)) {
                    // Nothing to do !
                } else {
                    tile.associatedFeaturesId.push(feature.id);
                }
            } else {
                _addFeature(this, feature);
                tile.associatedFeaturesId.push(feature.id);
            }
        }

        if (typeof this.callbackContext !== "undefined") {            
            this.callbackContext.publish(
                Constants.EVENT_MSG.LAYER_UPDATE_STATS_ATTRIBUTES,
                {
                    shortName: this.getShortName(),
                    nb_loaded: this.features.length,
                    nb_total: this.nbFeaturesTotal
                }
            );
        }

        // Only if tile was LOADING...
        if (tile.osState[this.getID()] === OpenSearchLayer.TileState.LOADING) {
            // ...set to LOADED
            tile.osState[this.getID()] = OpenSearchLayer.TileState.LOADED;
        }

        this.getGlobe().refresh();

        if (!_isTileLoaded(this.tilesLoaded, OpenSearchUtils.getKey(tile))) {
            this.tilesLoaded.push({
                key: OpenSearchUtils.getKey(tile),
                tile: tile
            });
        }    
        
        // Publish event that layer have received new features
        this.getGlobe()
            .publishEvent(Constants.EVENT_MSG.FEATURED_ADDED, {
                layer: this,
                features: this.features
            });      
    };


    /*************************************************************************************************************/

    return OpenSearchLayer;
});
