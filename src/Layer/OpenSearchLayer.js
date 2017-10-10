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
define(['../Renderer/FeatureStyle', '../Renderer/VectorRendererManager', '../Utils/Utils', './AbstractLayer', '../Renderer/RendererTileData', '../Tiling/Tile','../Utils/Constants','./OpenSearch/OpenSearchForm','./OpenSearch/OpenSearchUtils'],
    function (FeatureStyle, VectorRendererManager, Utils, AbstractLayer, RendererTileData, Tile, Constants,OpenSearchForm,OpenSearchUtils) {

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
         * @memberOf module:Layer
         */
          var OpenSearchLayer = function (options) {
            options.dataType = Constants.GEOMETRY.Point;
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
            this.requestProperties = "";
            this.invertY = options.invertY || false;
            this.coordSystemRequired = options.hasOwnProperty('coordSystemRequired') ? options.coordSystemRequired : true;
            this.formDescription = null;

            this.extId = "os";

            // Used for picking management
            this.features = [];
            // Counter set, indicates how many times the feature has been requested
            this.featuresSet = {};

            // Maximum two requests for now
            this.freeRequests = [];
            this.tilesToLoad = [];

            // Build the request objects
            for (var i = 0; i < this.maxRequests; i++) {
                var xhr = new XMLHttpRequest();
                this.freeRequests.push(xhr);
            }

            if (typeof this.describeUrl !== 'undefined') {
              this.hasForm = true;
              this.loadGetCapabilities(this.manageCapabilities,this.describeUrl,this);
            } else {
              this.hasForm = false;
            }

        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractLayer, OpenSearchLayer);

        /**************************************************************************************************************/

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
          } else {
            console.log("Form not correct");
          }

          if (typeof sourceObject.afterLoad === 'function') {
            // Update GUI !!
            sourceObject.afterLoad(sourceObject);

          }
        };

        /**************************************************************************************************************/


        /**
         * @name OSData
         * @class
         * OpenSearch renderable
         * @param {AbstractLayer} layer layer
         * @param {Tile} tile Tile
         * @param p Parent object
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
            var tileData = tile.extension[this.extId];
            var index = null;

            if (this.freeRequests.length === 0) {
                return;
            }

            // Set that the tile is loading its data for OpenSearch
            tileData.state = OpenSearchLayer.TileState.LOADING;

            // Add request properties to length
            if (this.requestProperties !== "") {
                url += '&' + this.requestProperties;
            }

            // Pusblish the start load event, only if there is no pending requests
            if (this.maxRequests === this.freeRequests.length) {
                this.globe.publishEvent("startLoad", this);
            }

            var xhr = this.freeRequests.pop();
            var self = this;

            xhr.onreadystatechange = function (e) {
                var i,feature;
                var response;
                var alreadyAdded;
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        response = JSON.parse(xhr.response);

                        tileData.complete = (response.totalResults === response.features.length);
                        self.updateFeatures(response.features);

                        for (i = response.features.length - 1; i >= 0; i--) {
                            feature = response.features[i];
                            // Eliminate already added features from response
                            //Old version compatibily
                            if (!feature.hasOwnProperty("id")) {
                                feature.id = feature.properties.identifier;
                            }
                            alreadyAdded = self.featuresSet.hasOwnProperty(feature.id);
                            if (alreadyAdded) {
                                response.features.splice(i, 1);
                            }

                            self.addFeature(feature, tile);
                        }
                        self.globe.refresh();
                    }
                    else if (xhr.status >= 400) {
                        tileData.complete = true;
                        console.error(xhr.responseText);
                        return;
                    }

                    tileData.state = OpenSearchLayer.TileState.LOADED;
                    self.freeRequests.push(xhr);

                    // Publish event that layer have received new features
                    if (response !== undefined && response.features !== null && response.features.length > 0) {
                        self.globe.publishEvent("features:added", {layer: self, features: response.features});
                    }

                    // Publish the end load event, only if there is no pending requests
                    if (self.maxRequests === self.freeRequests.length) {
                        self.globe.publishEvent("endLoad", self);
                    }
                }
            };
            xhr.open("GET", url);
            xhr.send();
        };

        /**************************************************************************************************************/

        /**
         * Sets the new request properties
         * @function setRequestProperties
         * @memberof OpenSearchLayer#
         * @param properties
         */
        OpenSearchLayer.prototype.setRequestProperties = function (properties) {
            // clean renderers
            for (var x in this.featuresSet) {
                if(this.featuresSet.hasOwnProperty(x)) {
                    var featureData = this.featuresSet[x];
                    for (var i = 0; i < featureData.tiles.length; i++) {
                        var tile = featureData.tiles[i];
                        var feature = this.features[featureData.index];
                        this.globe.vectorRendererManager.removeGeometryFromTile(this, feature.geometry, tile);
                    }
                }
            }

            // Clean old results
            var self = this;
            this.globe.tileManager.visitTiles(function (tile) {
                if (tile.extension[self.extId]) {
                    tile.extension[self.extId].dispose();
                    tile.extension[self.extId].featureIds = []; // exclusive parameter to remove from layer
                    tile.extension[self.extId].state = OpenSearchLayer.TileState.NOT_LOADED;
                    tile.extension[self.extId].complete = false;
                }
            });
            this.featuresSet = {};
            this.features = [];

            // Set request properties
            this.requestProperties = "";
            for (var key in properties) {
                if (this.requestProperties !== "") {
                    this.requestProperties += '&';
                }
                this.requestProperties += key + '=' + properties[key];
            }

        };

        /**************************************************************************************************************/

        /**
         * Adds feature to the layer and to the tile extension.
         * @function addFeature
         * @memberof OpenSearchLayer#
         * @param {Feature} feature Feature
         * @param {Tile} tile Tile
         */
        OpenSearchLayer.prototype.addFeature = function (feature, tile) {
            var tileData = tile.extension[this.extId];
            var featureData;

            // Add feature if it doesn't exist
            //if ( !this.featuresSet.hasOwnProperty(feature.properties.identifier) )
            if (!this.featuresSet.hasOwnProperty(feature.id)) {
                this.features.push(feature);
                featureData = {
                    index: this.features.length - 1,
                    tiles: [tile]
                };
                this.featuresSet[feature.properties.identifier] = featureData;
                this.featuresSet[feature.id] = featureData;
            }
            else {
                //featureData = this.featuresSet[feature.properties.identifier];
                featureData = this.featuresSet[feature.id];

                // Store the tile
                featureData.tiles.push(tile);

                // Always use the base feature to manage geometry indices
                feature = this.features[featureData.index];
            }

            // Add feature id
            //tileData.featureIds.push( feature.properties.identifier );
            tileData.featureIds.push(feature.id);

            // Set the identifier on the geometry
            //feature.geometry.gid = feature.properties.identifier;
            feature.geometry.gid = feature.id;

            // Add to renderer
            //this.addFeatureToRenderer(feature, tile);

            // MS: Feature could be added from ClusterOpenSearch which have features with different styles
            var style = feature.properties.style ? feature.properties.style : this.style;

            this.globe.vectorRendererManager.addGeometryToTile(this, feature.geometry, style, tile);
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
                for (var i = 0; i < featureData.tiles.length; i++) {
                    var tile = featureData.tiles[i];
                    this.globe.vectorRendererManager.removeGeometryFromTile(feature.geometry, tile);
                    this.globe.vectorRendererManager.addGeometryToTile(this, feature.geometry, style, tile);
                }
            }
        };

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
         */
        OpenSearchLayer.prototype.generate = function (tile) {
            if (tile.order === this.minOrder) {
                tile.extension[this.extId] = new OSData(this, tile, null);
            }
        };

        /**************************************************************************************************************/

        /**
         * Traverse
         * @function traverse
         * @memberof OSData.prototype
         * @param {Tile} tile Tile
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

        /**
         * Build request url
         * @function buildUrl
         * @memberof OpenSearchLayer#
         * @param {Tile} tile tile
         * @return {String} Url
         */
        OpenSearchLayer.prototype.buildUrl = function (tile) {
            var url = this.serviceUrl + "/search?order=" + tile.order + "&healpix=" + tile.pixelIndex;

            /*if (this.transformer != undefined && typeof beforeHandle == 'function') {
                var url = this.transformer.beforeHandle(url);
            }*/

            if (this.coordSystemRequired) {
                // OpenSearchLayer always works in equatorial
                url += "&coordSystem=EQUATORIAL";
            }
            url += "&media=json";
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

        /**************************************************************************************************************/

        /**
         * Update features
         * @function updateFeatures
         * @memberof OpenSearchLayer#
         * @param {Array} features Array of features
         */
        OpenSearchLayer.prototype.updateFeatures = function (features) {
            for (var i = 0; i < features.length; i++) {
                var currentFeature = features[i];

                switch (currentFeature.geometry.type) {
                    case Constants.GEOMETRY.Point:

                        // Convert to default coordinate system if needed
                        /*if ( "EQ" != this.globe.tileManager.imageryProvider.tiling.coordSystem )
                         {
                         currentFeature.geometry.coordinates = CoordinateSystem.convert(currentFeature.geometry.coordinates, this.globe.tileManager.imageryProvider.tiling.coordSystem, "EQ");
                         }*/

                        // Convert to geographic to simplify picking
                        if (currentFeature.geometry.coordinates[0] > 180) {
                            currentFeature.geometry.coordinates[0] -= 360;
                        }
                        break;
                    case Constants.GEOMETRY.Polygon:
                        var ring = currentFeature.geometry.coordinates[0];
                        for (var j = 0; j < ring.length; j++) {
                            // Convert to default coordinate system if needed
                            /*if ( "EQ" != this.globe.tileManager.imageryProvider.tiling.coordSystem )
                             {
                             ring[j] = CoordinateSystem.convert(ring[j], this.globe.tileManager.imageryProvider.tiling.coordSystem, "EQ");
                             }*/

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
