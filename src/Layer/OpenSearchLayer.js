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
    "../Utils/Utils",
    "../Utils/UtilsIntersection",
    "./AbstractLayer",
    "./GroundOverlayLayer",
    "../Tiling/Tile",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog",
    "./OpenSearch/OpenSearchUtils",
    "./OpenSearch/OpenSearchCache",
    "moment"
], function(
    _,
    FeatureStyle,
    Utils,
    UtilsIntersection,
    AbstractLayer,
    GroundOverlayLayer,
    Tile,
    Constants,
    ErrorDialog,
    OpenSearchUtils,
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
     * @param {int} [options.heatmapMinFeatureCount=100] The minimum feature count to not display the heatmap anymore
     * @param {int} [options.heatmapMaxLevel=5] The maximum level where the heatmap can be displayed
     * @memberof module:Layer
     */
    var OpenSearchLayer = function(options) {
        options.zIndex = options.zIndex || Constants.DISPLAY.DEFAULT_VECTOR;
        AbstractLayer.prototype.constructor.call(this, Constants.LAYER.OpenSearch, options);

        this.minLevel = options.minLevel || 5;
        this.coordSystemRequired = options.hasOwnProperty("coordSystemRequired")? options.coordSystemRequired: true;


        this.previousKey = null;
        this.previousTileId = null;
        this.previousDistance = null;

        // Keep trace of all features loaded (TODO: make object more light, just keep geometry and style ?)
        this.features = [];
        // Keep all tiles associated to a feature id to add / remove them more efficiently
        this.featuresSet = {};

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

        this.featuresAddedToNotLoadedTiles = {};

        this.heatmapMaxLevel = options.heatmapMaxLevel || 5;
        this.heatmapMinFeatureCount = options.heatmapMinFeatureCount || 100;

        this.colormap = [
            { pct: 0.00, color: [0.0, 0.0, 0.3] },
            { pct: 0.01, color: [0.0, 0.0, 1.0] },
            { pct: 0.05, color: [0.0, 1.0, 1.0] },
            { pct: 0.10, color: [0.0, 1.0, 0.0] },
            { pct: 0.25, color: [1.0, 1.0, 0.0] },
            { pct: 0.50, color: [1.0, 0.0, 0.0] },
            { pct: 1.00, color: [0.3, 0.0, 0.0] },
        ];

        this.heatmapTiles = {};
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

    function _getColorForPercentage(pct, colormap) {
        var colors = colormap.slice(0);
        colors.sort(function(c0, c1) { return c0.pct - c1.pct; });

        const length = colors.length;

        // Find the pct bounds
        var color;
        // Pct is outside colormap bounds
        if (colors[0].pct > pct) {
            color = colors[0].color;
        } else if (colors[length - 1].pct < pct) {
            color = colors[length - 1].color;
        } else {
            for (var i = 0; i < length - 1; ++i) {
                const p0 = colors[i].pct;
                const p1 = colors[i + 1].pct;

                if (p0 <= pct && p1 >= pct) {
                    const p = (pct - p0) / (p1 - p0);
                    const c0 = colors[i].color;
                    const c1 = colors[i + 1].color;

                    color = [
                        (1.0 - p) * c0[0] + p * c1[0],
                        (1.0 - p) * c0[1] + p * c1[1],
                        (1.0 - p) * c0[2] + p * c1[2],
                    ];
                }
            }
        }

        return color;
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

    function _computeGeometryExtent(geometry) {
        //TODO : To be modified according to the planet CRS.
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

    function _removeFeature(layer, featureId, tile) {
        const featureData = layer.featuresSet[featureId];
        if (!featureData) return;

        const index = featureData.tiles.findIndex(function(element) {
            return element.key === tile.key;
        });

        if (index === -1) {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchLayer.js:298", "Tile not found when removing feature");
        } else {
            const feature = layer.features[featureData.index];
            layer.getGlobe().getRendererManager().removeGeometryFromTile(feature.geometry, tile);

            featureData.tiles.splice(index, 1);
        }

        if (featureData.tiles.length === 0) {
            // No more tiles attached to this feature, remove it from the dataset
            delete layer.featuresSet[featureId];

            // And from the features list
            const lastFeature = layer.features.pop();
            if (featureData.index < layer.features.length) {
                // The poped feature is not the one we are removing, swap them
                layer.features[featureData.index] = lastFeature;

                // And update the index
                layer.featuresSet[lastFeature.id].index = featureData.index;
            }
        }
    }

    function _removeFeatures(layer) {
        for (const id in layer.featuresSet) {
            for (var tileIndex = layer.featuresSet[id].tiles.length - 1; tileIndex >= 0; --tileIndex) {
                _removeFeature(layer, id, layer.featuresSet[id].tiles[tileIndex]);
            }
        }

        layer.featuresSet = {};

        for (var i = 0; i < layer.tilesLoaded.length; i++) {
            layer.tilesLoaded[i].tile.osState[layer.getID()] = OpenSearchLayer.TileState.NOT_LOADED;
        }
        layer.tilesLoaded = [];

        layer.getGlobe().getRenderContext().requestFrame();
    }

    function _removeTile(layer, tile) {
        // If there is no features for this tile, there will be no associatedFeaturesId
        if (tile.associatedFeaturesId) {
            // Remove each feature associated with the tile
            for (const id in tile.associatedFeaturesId) {
                const featureId = tile.associatedFeaturesId[id];
                _removeFeature(layer, featureId, tile);
            }
            tile.associatedFeaturesId = [];
        }

        // Remove the tile
        const index = layer.tilesLoaded.findIndex(function(element) {
            return element.tile.key === tile.key;
        });

        if (index !== -1) {
            layer.tilesLoaded.splice(index, 1);
        }

        tile.osState[layer.getID()] = OpenSearchLayer.TileState.NOT_LOADED;

        delete layer.heatmapTiles[tile.level][tile.key];
        layer.buildHeatmap();
    }

    function _removeFeaturesOutside(layer, tiles) {
        var maxLevel = 0;
        for (var t of tiles) {
            if (maxLevel < t.level) {
                maxLevel = t.level;
            }
        }

        for (var i = 0; i < layer.tilesLoaded.length; i++) {
            var tile = layer.tilesLoaded[i].tile;

            var remove = (tile.level > maxLevel);

            if (!remove) {
                remove = !UtilsIntersection.tileIntersects(tile,tiles);
            }

            if (remove) {
                _removeTile(layer, tile);
            }
        }
    }

    function _addFeature(layer, feature, tile) {
        var featureData;

        var style = feature.properties.style ? feature.properties.style : layer.style;
        style.opacity = layer.getOpacity();


        // fix geometry gid
        feature.geometry.gid = feature.id;

        // fix feature ID
        if (!feature.hasOwnProperty("id")) {
            feature.id = feature.properties.identifier;
        }

        // fix style
        if (!feature.properties.hasOwnProperty("style")) {
            feature.properties.style = style;
        }

        if (!layer.featuresSet.hasOwnProperty(feature.id)) {
            layer.features.push(feature);
            featureData = {
                index: layer.features.length - 1,
                tiles: [tile],
            };
            layer.featuresSet[feature.id] = featureData;
        } else {
            featureData = layer.featuresSet[feature.id];

            // Store the tile
            featureData.tiles.push(tile);

            // Always use the base feature to manager geometry indices
            feature = layer.features[featureData.index];
        }

        if (!tile.associatedFeaturesId) tile.associatedFeaturesId = [];

        tile.associatedFeaturesId.push(feature.id);

        if (feature.geometry.type === "GeometryCollection") {
            var geoms = feature.geometry.geometries;
            for (var i = 0; i < geoms.length; i++) {
                layer.getGlobe().getRendererManager().addGeometryToTile(layer, geoms[i], style, tile);
            }
        } else {
            // Add geometry to renderers
            layer.getGlobe().getRendererManager().addGeometryToTile(layer, feature.geometry, style, tile);
        }

        if (tile.state !== Tile.State.LOADED) {
            if (!layer.featuresAddedToNotLoadedTiles[tile.key]) {
                layer.featuresAddedToNotLoadedTiles[tile.key] = [];
            }

            if (feature.geometry.type === "Point") {
                layer.featuresAddedToNotLoadedTiles[tile.key].length = 0;
            }

            layer.featuresAddedToNotLoadedTiles[tile.key].push(feature);
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
            if (code === "{geo:box}" && (tile.type === Constants.TILE.GEO_TILE || tile.type === Constants.TILE.MERCATOR_TILE)) {
                // set bbox
                param.currentValue =
                    tile.geoBound.west +
                    "," +
                    tile.geoBound.south +
                    "," +
                    tile.geoBound.east +
                    "," +
                    tile.geoBound.north;
            } else if (code === "{geo:geometry}" && tile.type === Constants.TILE.HEALPIX_TILE) {
                var corners = tile.getCorners();
                param.currentValue = "POLYGON(("+corners[0][0]+" "+corners[0][1]
                +","+corners[1][0]+" "+corners[1][1]
                +","+corners[2][0]+" "+corners[2][1]
                +","+corners[3][0]+" "+corners[3][1]
                +","+corners[0][0]+" "+corners[0][1]+"))";
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
                layer.getGlobe().getRendererManager().addGeometryCurrentLevel(layer, geoms[i], style);
            }
        } else {
            // Add geometry to renderers
            layer.getGlobe().getRendererManager().addGeometryCurrentLevel(layer, geometry, style);
        }
    }

    function _removeFeatureFromRenderersCurrentLevel(layer, feature) {
        return layer.getGlobe().getRendererManager().removeGeometryCurrentLevel(feature.geometry, layer);
    }

    function _buildUrl(layer, tile, count) {
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
            if (param.name === "maxRecords" && count) {
                currentValue = count;
            } else {
                currentValue = param.currentValueTransformed();
            }

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
        const index = tilesLoaded.findIndex(function(element) { return element.key === key; });
        return index !== -1;
    }

    function _removeFeaturesExternalFov(layer, tiles) {
        var doRemove = false;
        if (layer.lastRemovingDateTime === null) {
            doRemove = true;
        } else {
            doRemove = Date.now() - layer.lastRemovingDateTime >= layer.removingDeltaSeconds * 1000;
        }
        if (doRemove) {
            layer.lastRemovingDateTime = Date.now();
            _removeFeaturesOutside(layer, tiles);
        }
    }

    function _initOsState(layer, tile) {
        if (typeof tile.key === "undefined") {
            tile.key = tile.getKey();
        }
        // If no state defined...
        if (tile.osState == null) {
            //...set it to NOT_LOADED
            tile.osState = {};
        }
        if (tile.osState[layer.getID()] == null) {
            tile.osState[layer.getID()] = OpenSearchLayer.TileState.NOT_LOADED;
        }
    }

    function _computeStats(layer) {
        var nb = 0;
        for(var i=0; i<layer.tilesLoaded.length; i++) {
            var tileLoaded = layer.tilesLoaded[i].tile;
            if(tileLoaded.associatedFeaturesId) {
                nb = nb + tileLoaded.associatedFeaturesId.length;
            }
        }
    }

    function _requestTile(layer, tile, count) {
        var url = _buildUrl(layer, tile, count);
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
                    cachedTile.osState = {};
                }
                cachedTile.osState[layer.getID()] =  OpenSearchLayer.TileState.LOADING;
                layer.computeFeaturesResponse(cachedTile.features, cachedTile, cachedTile.total);
            }
            _computeStats(layer);
        }
    }

    function _setTileLoaded(tile, id) {
        // Only if tile was LOADING...
        if (tile.osState[id] === OpenSearchLayer.TileState.LOADING) {
            // ...set to LOADED
            tile.osState[id] = OpenSearchLayer.TileState.LOADED;
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

    OpenSearchLayer.prototype.modifyFeatureStyle = function(feature, style, useFeatureStyle) {
        if (useFeatureStyle && feature.properties.style) {
            for (var key in feature.properties.style) {
                if (!feature.properties.style.hasOwnProperty(key)) continue;

                style[key] = feature.properties.style[key];
            }
        }

        const rm = this.getGlobe().getRendererManager();
        if (this.featuresSet[feature.id]) {
            for (var tile of this.featuresSet[feature.id].tiles) {
                try {
                    rm.removeGeometryFromTile(feature.geometry, tile);
                    rm.addGeometryToTile(this, feature.geometry, style, tile);
                } catch (error) { /* e */ }
            }
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
        //TODO : Does not work because it is not added to the renderer but postRenderer
        //TODO : Test : load OSM + S1. Click on S1, load quicklook
        this.currentQuicklookLayer.setOnTheTop();
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

        // Check if we have features that might be missing
        if (Object.keys(this.featuresAddedToNotLoadedTiles).length > 0) {
            for (var tile of tiles) {
                if (tile.state === Tile.State.LOADED && this.featuresAddedToNotLoadedTiles[tile.key]) {
                    for (var feature of this.featuresAddedToNotLoadedTiles[tile.key]) {
                        _addFeature(this, feature, tile);
                    }
                    delete this.featuresAddedToNotLoadedTiles[tile.key];
                }
            }
        }

        this.currentKey = OpenSearchUtils.getArrayBoundKey(tiles);

        // if (_mustBeRefreshed(this.previousKey, this.currentKey, this.forceRefresh)) {
        if (this.forceRefresh === true) {
            // Remove cache, in order to reload new features
            _cleanCache(this);
            this.forceRefresh = false;
        }

        var localTiles = tiles.slice(0);

        // Sort tiles in order to load the first tiles closed to the camera
        localTiles.sort(_sortTilesByDistance);

        this.currentLevel = localTiles[0].level;
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

            if (this.previousLevel !== undefined && this.previousLevel !== null) {
                if (this.heatmapTiles && this.heatmapTiles[this.previousLevel]) {
                    const oldKeys = Object.keys(this.heatmapTiles[this.previousLevel]);
                    for (var i = oldKeys.length - 1; i >= 0; --i)  {
                        const key = oldKeys[i];
                        const heatmapData = this.heatmapTiles[this.previousLevel][key];
                        if (heatmapData.feature) _removeFeature(this, heatmapData.feature.id, heatmapData.tile);

                        heatmapData.tile.osState[this.getID()] = OpenSearchLayer.TileState.NOT_LOADED;

                        delete this.heatmapTiles[this.previousLevel][key];
                    }
                }
            }
        }

        this.nbFeaturesTotal = 0;

        // =========================================================================
        // Check each tile
        // =========================================================================

        this.previousLevel = this.currentLevel;
        this.previousKey = this.currentKey;
        for (var j = 0; j < localTiles.length; j++) {
            var currentTile = localTiles[j];

            _initOsState(this, currentTile);
            switch (currentTile.osState[this.getID()]) {
            case OpenSearchLayer.TileState.NOT_LOADED:
                // First load the least possible amount of data
                _requestTile(this, currentTile, 1);
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
        }

        // Remove all feature outside view of tiles
        _removeFeaturesExternalFov(this, localTiles);
        // }
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
                this.modifyFeatureStyle(this.features[i], targetStyle, true);
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
        selectedData.layer.callbackContext.addLayer(layerDescription, function(layerID) {
            // Add feature id of wms into list a current WMS displayed
            self.addServicesRunningOnRecord(selectedData.feature.id, layerID);

            var layer = self.callbackContext.getLayerByID(layerID);
            layer.setOnTheTop();

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

        if (typeof selectedData !== "undefined") {
            this.callbackContext.publish(
                Constants.EVENT_MSG.LAYER_TOGGLE_WMS,
                {
                    layer_name: selectedData.layer.getShortName(),
                    visible: false
                }
            );
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
        var ableToContinue = true;

        const { level, key } = tile;

        if (!this.heatmapTiles[level]) {
            this.heatmapTiles[level] = {};
        }

        this.heatmapTiles[level][key] = {
            tile: tile,
            nbFeatures: nbFeaturesTotalPerTile
        };

        if (nbFeaturesTotalPerTile > this.heatmapMinFeatureCount && level <= this.heatmapMaxLevel) {
            ableToContinue = false;

            this.heatmapTiles[level][key].shouldBeDrawn = true;
        }
        else if (features.length === 1) {
            ableToContinue = false;
            // Set 10 times more than the parsed value because the features total
            // number is approximative
            // TODO Iterate on each page until there is no feature to parse
            _requestTile(this, tile, this.heatmapMinFeatureCount);
        }

        this.buildHeatmap();

        if (!ableToContinue) {
            return;
        }

        _fixCrossLine(features);

        // compute the total number of available features on the server in the FOV
        this.nbFeaturesTotal += nbFeaturesTotalPerTile;

        // For each feature...
        for (var feature of features) {
            try {
                _addFeature(this, feature, tile);
            } catch (error) { /* error */ }
            // Add features to renderer if this is attached to planet
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

        _setTileLoaded(tile, this.getID());

        this.getGlobe().refresh();

        if (!_isTileLoaded(this.tilesLoaded, tile.key)) {
            this.tilesLoaded.push({
                key: key,
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

    /**************************************************************************************************************/
    /**
     * Build a heatmap showing the amount of OS data per tile currently displayed on screen
     * @function buildHeatmap
     * @memberof OpenSearchLayer#
     */
    OpenSearchLayer.prototype.buildHeatmap = function() {
        var total = 0;

        const heatmapData = this.heatmapTiles[this.currentLevel];

        for (const key in heatmapData) {
            total += heatmapData[key].nbFeatures;
        }

        for (const key in heatmapData) {
            const entry = heatmapData[key];
            if (entry.shouldBeDrawn) {
                const pct = entry.nbFeatures / total;
                const { tile } = entry;

                const center = [
                    (tile.geoBound.east + tile.geoBound.west) / 2.0,
                    (tile.geoBound.north + tile.geoBound.south) / 2.0
                ];

                const color = _getColorForPercentage(pct, this.colormap);

                const textFeature = {
                    type: "Feature",
                    id: `${this.ID}_${key}_text`,
                    geometry: {
                        type: "Point",
                        coordinates: center,
                        crs: {
                            type: "name",
                            properties: {
                                name: tile.config.srs
                            }
                        }
                    },
                    properties: {
                        "Feature count": `${entry.nbFeatures}`,
                        "Percentage": `${(pct * 100).toFixed(2).toString()}%`,
                        style: {
                            label: `${(pct * 100).toFixed(2).toString()}%`,
                            fillColor: color,
                            strokeColor: color,
                            textColor: color,
                            opacity: 1,
                            pointMaxSize: 500,

                            extrusionScale: 1,
                            fill: false,
                            fillShader: null,
                            fillTexture: null,
                            fillTextureUrl: null,
                            icon: null,
                            iconUrl: null,
                            onTerrain: true,
                            strokeWidth: 1,
                            zIndex: 0
                        }
                    },
                };

                if (entry.feature) {
                    if (entry.feature.pickData && entry.feature.pickData.picked) {
                        entry.feature.pickData.pickSelection[entry.feature.pickData.index].feature = textFeature;
                        textFeature.pickData = entry.feature.pickData;
                    }
                    _removeFeature(this, entry.feature.id, tile);
                }

                entry.feature = textFeature;

                _addFeature(this, textFeature, tile);

                if (this.tilesLoaded.findIndex(function(element) { return element.key === tile.key; }) === -1) {
                    this.tilesLoaded.push({
                        key: tile.key,
                        tile: tile
                    });
                }

                _setTileLoaded(tile, this.getID());
            }
        }
    };

    /*************************************************************************************************************/

    return OpenSearchLayer;
});
