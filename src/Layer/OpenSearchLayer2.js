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

define([
    "./AbstractLayer",
    "../Renderer/FeatureStyle",
    "../Renderer/RendererManager",
    "../Utils/Utils",
    "../Renderer/RendererTileData",
    "../Tiling/Tile",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog",
    "../Utils/Proxy",
    "./OpenSearch/OpenSearchUtils"
], function(
    AbstractLayer,
    FeatureStyle,
    RendererManager,
    Utils,
    RendererTileData,
    Tile,
    Constants,
    ErrorDialog,
    Proxy,
    OpenSearchUtils
) {
    /**************************************************************************************************************/

    function _setDefaultOptions(options) {
        //options.icon = options.icon || "css/images/star16x16.png";
        options.background = false;
        options.category = options.category || "Catalog";
        options.pickable = options.pickable || true;
        return options;
    }

    /**
     * Hips catalogue configuration
     * @typedef {AbstractLayer.configuration} AbstractLayer.hipsCat_configuration
     * @property {string} serviceUrl - Endpoint to reach the Hips catalogue
     * @property {int} [minOrder = 2] - min order
     * @property {int} [maxRequests = 4] - Max requests in parallel
     * @property {boolean} [invertY = false]
     */

    /**
     * Create a HIPS catalogue
     * @param {AbstractLayer.hipsCat_configuration} options - Hip catalogue configuration
     * @constructor
     * @memberof module:Layer
     * @see {@link http://www.ivoa.net/documents/HiPS/20170406/index.html Hips standard}
     */
    var OpenSearchLayer2 = function(options) {
        AbstractLayer.prototype.constructor.call(
            this,
            Constants.LAYER.OpenSearch,
            options
        );
        var i;

        this.serviceUrl = options.baseUrl;
        this.minOrder = options.minOrder || 2;
        this.maxOrder = options.maxOrder || 10;
        this.maxRequests = options.maxRequests || 4;

        this.extId = "openSearch";

        this.currentPage = 0;

        // Used for picking management
        this.features = [];
        // Counter set, indicates how many times the feature has been requested
        this.featuresSet = {};

        // Maximum two requests for now
        this.freeRequests = [];
        this.tilesToLoad = [];

        // Build the request objects
        for (i = 0; i < this.maxRequests; i++) {
            var xhr = new XMLHttpRequest();
            this.freeRequests.push(xhr);
        }
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractLayer, OpenSearchLayer2);

    /**************************************************************************************************************/

    /**
     * Go to next page
     * @function nextPage
     * @memberof OpenSearchLayer2#
     * @fires OpenSearchLayer#updateStatsAttribute
     */
    OpenSearchLayer2.prototype.nextPage = function() {
        var num = OpenSearchUtils.getCurrentValue(
            this.getServices().queryForm,
            "startPage"
        );
        // If not specified, set default to 1
        if (num === null || typeof num === "undefined") {
            num = 1;
        } else {
            num = parseInt(num);
        }
        OpenSearchUtils.setCurrentValueToParam(
            this.getServices().queryForm,
            "startPage",
            num + 1
        );

        this.currentPage = num + 1;

        // update labels
        this.callbackContext.publish(
            Constants.EVENT_MSG.LAYER_UPDATE_STATS_ATTRIBUTES,
            {
                shortName: this.getShortName(),
                page: num + 1
            }
        );
       

        this.forceRefresh = true;

        this.getGlobe()
            .getRenderContext()
            .requestFrame();
    };

    /**
     * Attaches the layer to the globe
     * @param g The globe
     * @private
     */
    OpenSearchLayer2.prototype._attach = function(g) {
        AbstractLayer.prototype._attach.call(this, g);
        this.extId += this.id;
        g.getTileManager().addPostRenderer(this);
    };

    /**************************************************************************************************************/

    /**
     * Detaches the layer from the globe
     * @private
     */
    OpenSearchLayer2.prototype._detach = function() {
        this.getGlobe()
            .getTileManager()
            .removePostRenderer(this);
        AbstractLayer.prototype._detach.call(this);
    };

    /**************************************************************************************************************/

    /**
     * Update features
     * @function updateFeatures
     * @memberof OpenSearchLayer#
     * @param {Array} features Array of features
     * @private
     */
    OpenSearchLayer2.prototype.updateFeatures = function(features) {
        for (var i = 0; i < features.length; i++) {
            var currentFeature = features[i];

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
    };

    /**
     * Launches request to the HipsCatLayer service
     * @param tile
     * @param url
     * @fires Context#startLoad
     * @fires Context#endLoad
     * @fires Context#features:added
     */
    OpenSearchLayer2.prototype.launchRequest = function(tile, url) {
        var tileData = tile.extension[this.extId];
        var index = null;

        if (this.freeRequests.length === 0) {
            return;
        }

        // Set that the tile is loading its data for HipsCatLayer
        tileData.state = OpenSearchLayer2.TileState.LOADING;

        // Pusblish the start load event, only if there is no pending requests
        if (this.maxRequests === this.freeRequests.length) {
            this.getGlobe().publishEvent(
                Constants.EVENT_MSG.LAYER_START_LOAD,
                this
            );
        }

        var xhr = this.freeRequests.pop();
        var self = this;
        xhr.open("GET", Proxy.proxify(url));
        xhr.setRequestHeader("Accept", "application/xml");
        xhr.send(null);
        self = this;
        xhr.onreadystatechange = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {

                    var response = JSON.parse(xhr.response);

                    tileData.complete = response.totalResults === response.features.length;

                    self.updateFeatures(response.features);

                    for (var i = response.features.length - 1; i >= 0; i--) {
                        var feature = response.features[i];
                        // Eliminate already added features from response
                        var alreadyAdded = self.featuresSet.hasOwnProperty(feature.id);
                        if (alreadyAdded) response.features.splice(i, 1);

                        feature.properties.style = this.style;
                        self.addFeature(feature, tile);
                    }
                    self.globe.refresh();

                    //Publish event that layer have received new features
                    if (
                        response.hasOwnProperty("features") &&
                        response.features.length > 0
                    ) {
                        self.globe.publishEvent(
                            Constants.EVENT_MSG.FEATURED_ADDED,
                            { layer: self, features: response.features }
                        );
                    }
                } else if (xhr.status >= 400) {
                    tileData.complete = true;
                }

                tileData.state = OpenSearchLayer2.TileState.LOADED;
                self.freeRequests.push(xhr);

                // Publish the end load event, only if there is no pending requests
                if (self.maxRequests === self.freeRequests.length) {
                    self.globe.publishEvent(
                        Constants.EVENT_MSG.LAYER_END_LOAD,
                        self
                    );
                }
            }
        };
    };

    /**************************************************************************************************************/

    /**
     * Adds feature to the layer and to the tile extension
     * @param feature
     * @param tile
     */
    OpenSearchLayer2.prototype.addFeature = function(feature, tile) {
        var tileData = tile.extension[this.extId];
        var featureData;

        // Add feature if it doesn't exist
        if (!this.featuresSet.hasOwnProperty(feature.id)) {
            this.features.push(feature);
            featureData = {
                index: this.features.length - 1,
                tiles: [tile]
            };
            this.featuresSet[feature.id] = featureData;
        } else {
            featureData = this.featuresSet[feature.id];

            // Store the tile
            featureData.tiles.push(tile);

            // Always use the base feature to manage geometry indices
            feature = this.features[featureData.index];
        }

        // Add feature id
        tileData.featureIds.push(feature.id);

        // Set the identifier on the geometry
        feature.geometry.gid = feature.id;

        // Add to renderer
        //this.addFeatureToRenderer(feature, tile);

        // MS: Feature could be added from ClusterOpenSearch which have features with different styles
        var style = feature.properties.style
            ? feature.properties.style
            : this.style;

        this.getGlobe()
            .getRendererManager()
            .addGeometry(this, feature.geometry, style);
    };

    /**************************************************************************************************************/

    /**
     * Removes feature from Dynamic HipsCatLayer layer
     * @param identifier
     * @param tile
     */
    OpenSearchLayer2.prototype.removeFeature = function(identifier, tile) {
        var featureIt = this.featuresSet[identifier];

        if (!featureIt) {
            return;
        }

        // Remove tile from array
        var tileIndex = featureIt.tiles.indexOf(tile);
        if (tileIndex >= 0) {
            featureIt.tiles.splice(tileIndex, 1);
        } else {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchLayer internal error : tile not found when removing feature");
        }        

        if (featureIt.tiles.length === 0) {
            console.log(this.features[featureIt.index].geometry);
            this.getGlobe().getRendererManager().removeGeometry(this.features[featureIt.index].geometry, this);

            // Remove it from the set
            delete this.featuresSet[identifier];

            // Remove it from the array by swapping it with the last feature to optimize removal.
            var lastFeature = this.features.pop();
            if (featureIt.index < this.features.length) {
                // Set the last feature at the position of the removed feature
                this.features[featureIt.index] = lastFeature;
                // Update its index in the Set.
                this.featuresSet[lastFeature.id].index = featureIt.index;
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Modifies feature style
     * @param feature
     * @param style
     */
    OpenSearchLayer2.prototype.modifyFeatureStyle = function(feature, style) {
        feature.properties.style = style;
        var featureData = this.featuresSet[feature.id];
        if (featureData) {
            var i;
            for (i = 0; i < featureData.tiles.length; i++) {
                var tile = featureData.tiles[i];
                this.getGlobe()
                    .getRendererManager()
                    .removeGeometryFromTile(feature.geometry, tile);
                this.getGlobe()
                    .getRendererManager()
                    .addGeometryToTile(this, feature.geometry, style, tile);
            }
        }
    };

    OpenSearchLayer2.TileState = {
        LOADING: 0,
        LOADED: 1,
        NOT_LOADED: 2,
        INHERIT_PARENT: 3
    };

    /**************************************************************************************************************/

    /**
     * Generates the tile data
     * @param tile
     */
    OpenSearchLayer2.prototype.generate = function(tile) {
        if (this.minOrder <= tile.level && tile.level <= this.maxOrder) {
            tile.extension[this.extId] = new OSData(this, tile, null);
        }
    };

    /**************************************************************************************************************/

    /**
     * HipsCatLayer renderable
     * @param layer
     * @param tile
     * @param p
     * @constructor
     */
    var OSData = function(layer, tile, p) {
        this.layer = layer;
        this.parent = p;
        this.tile = tile;
        this.featureIds = []; // exclusive parameter to remove from layer
        this.state = OpenSearchLayer2.TileState.NOT_LOADED;
        this.complete = false;
        this.childrenCreated = false;
        var self = this;
        this.layer.callbackContext.subscribe(Constants.EVENT_MSG.LAYER_UPDATE_STATS_ATTRIBUTES, function(){
            self.state = OpenSearchLayer2.TileState.NOT_LOADED;
        });
    };

    /**************************************************************************************************************/

    /**
     * Traverse
     * @param tile
     */
    OSData.prototype.traverse = function(tile) {
        var i;
        if (!this.layer.isVisible()) return;

        if (tile.state !== Tile.State.LOADED) return;

        // Check if the tile need to be loaded
        if (this.state === OpenSearchLayer2.TileState.NOT_LOADED) {
            this.layer.tilesToLoad.push(this);
        }

        // Create children if needed
        if (
            this.state === OpenSearchLayer2.TileState.LOADED &&
            !this.complete &&
            tile.state === Tile.State.LOADED &&
            tile.children &&
            !this.childrenCreated
        ) {
            for (i = 0; i < 4; i++) {
                if (!tile.children[i].extension[this.layer.extId])
                    tile.children[i].extension[this.layer.extId] = new OSData(
                        this.layer,
                        tile.children[i],
                        this
                    );
            }
            this.childrenCreated = true;

            // HACK : set renderable to have children
            var renderables = tile.extension.renderer
                ? tile.extension.renderer.renderables
                : [];
            for (i = 0; i < renderables.length; i++) {
                if (renderables[i].bucket.layer === this.layer)
                    renderables[i].hasChildren = true;
            }
        }
    };

    /**************************************************************************************************************/
    /**
     * Disposes renderable data from tile
     * @param renderContext
     * @param tilePool
     */
    OSData.prototype.dispose = function(renderContext, tilePool) {
        var i;
        if (this.parent && this.parent.childrenCreated) {
            this.parent.childrenCreated = false;
            // HACK : set renderable to not have children!
            var renderables = this.parent.tile.extension.renderer
                ? this.parent.tile.extension.renderer.renderables
                : [];
            for (i = 0; i < renderables.length; i++) {
                if (renderables[i].bucket.layer === this.layer)
                    renderables[i].hasChildren = false;
            }
        }

        for (i = 0; i < this.featureIds.length; i++) {
            this.layer.removeFeature(this.featureIds[i], this.tile);
        }
        this.tile = null;
        this.parent = null;
    };

    /**************************************************************************************************************/

    /**
     * Prepare parameters for a given bound
     * @function prepareParameters
     * @memberof OpenSearchLayer2#
     * @param {Bound} bound Bound
     */
    OpenSearchLayer2.prototype.prepareParameters = function(bound) {
        var param; // param managed
        var code; // param code
        for (
            var i = 0;
            i < this.getServices().queryForm.parameters.length;
            i++
        ) {
            param = this.getServices().queryForm.parameters[i];
            code = param.value;
            code = code.replace("?}", "}");
            if (code === "{geo:box}") {
                // set bbox
                param.currentValue =
                    bound.west +
                    "," +
                    bound.south +
                    "," +
                    bound.east +
                    "," +
                    bound.north;
            }
        }
    };

    /**
     * Builds URL
     * @param tile
     * @return {*}
     */
    OpenSearchLayer2.prototype.buildUrl = function(tile) {
        if (!this.getServices().hasOwnProperty("queryForm")) {
            return null;
        }
        var url = this.getServices().queryForm.template;

        // Prepare parameters for this tile
        this.prepareParameters(tile.bound);

        // Check each parameter
        var param; // param managed
        var currentValue; // value set
        for (var i = 0; i < this.getServices().queryForm.parameters.length; i++) {
            param = this.getServices().queryForm.parameters[i];
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
    };

    /**
     * Get Tile URL.
     * @param tile
     * @returns {*}
     */
    OpenSearchLayer2.prototype.getUrl = function(tile) {
        return this.buildUrl(tile);
    };

    /**************************************************************************************************************/

    /**
     * Internal function to sort tiles
     * @param t1
     * @param t2
     * @return {number}
     * @private
     */
    function _sortTilesByDistance(t1, t2) {
        return t1.tile.distance - t2.tile.distance;
    }

    /**
     * Render function
     *
     * @param tiles The array of tiles to render
     */
    OpenSearchLayer2.prototype.render = function(tiles) {
        if (!this.visible) return;

        for (var k=0;k<tiles.length;k++) {
            console.log("visible tile - level:"+tiles[k].level+" , x="+tiles[k].x+" ,y="+tiles[k].y);
        }
        

        var self = this;
        Object.keys(this.featuresSet).forEach(function (key) { 
            var featureData = self.featuresSet[key];
            var loadedTiles = featureData.tiles;
            for (var i=0 ; i< loadedTiles.length; i++) {
                var isFound = false;
                for (var j=0; j<tiles.length; j++) {
                    if(tiles[j].level === loadedTiles[i].level && 
                        tiles[j].x === loadedTiles[i].x && 
                        tiles[j].y === loadedTiles[i].y) {
                        isFound = true;
                        break;
                    }                    
                }
                if(!isFound) {
                    console.log("remove tile - level:"+loadedTiles[i].level+" , x="+loadedTiles[i].x+" ,y="+loadedTiles[i].y);
                    loadedTiles[i].extension[self.extId].dispose();
                }
            }
        });

        // Sort tiles
        this.tilesToLoad.sort(_sortTilesByDistance);

        // Load data for the tiles if needed
        for (var i = 0; i < this.tilesToLoad.length && this.freeRequests.length > 0; i++) {
            var tile = this.tilesToLoad[i].tile;
            var url = this.buildUrl(tile);
            if (url) {
                this.launchRequest(tile, url);
            }
        }

        this.tilesToLoad.length = 0;
    };

    /*************************************************************************************************************/

    return OpenSearchLayer2;
});
