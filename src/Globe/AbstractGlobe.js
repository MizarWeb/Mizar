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
define(['../Utils/Event', '../Utils/Utils',
        '../Tiling/TileManager', '../Renderer/VectorRendererManager', '../Renderer/Ray', '../Renderer/GeoBound',
        '../Crs/CoordinateSystemFactory', '../Renderer/RenderContext', '../Utils/Constants', '../Renderer/glMatrix'],
    function (Event, Utils,
              TileManager, VectorRendererManager, Ray, GeoBound,
              CoordinateSystemFactory, RenderContext, Constants) {


        /**
         * AbstractGlobe configuration
         * @typedef {Object} AbstractGlobe.configuration
         * @property {boolean} [options.continuousRendering=false] - Options that renders the globe in continue
         * @property {AbstractCrs.crsFactory} coordinateSystem - coordinate system data model
         * @property {Object} [renderContext] - RenderContext object.
         * @property {string} [shadersPath=../shaders/] - Option for RenderContext : shader location.
         * @property {int} [tileErrorTreshold=4] - Option for RenderContext : tile error
         * @property {boolean} [lighting=false] - Option for RenderContext : enable/disable lighting
         * @property {Object|string} canvas - Option for RenderContext : Canvas element to insert in the globe
         * @property {Array} [backgroundColor=[0.0, 0.0, 0.0, 1.0]] - Option for RenderContext : color for background
         * @property {int} [minFar=0] - Option for RenderContext : When 0 , no limit on far
         * @property {Array} [defaultColor=[200, 200, 200, 255]] - Option for TileManager : pixel default color
         *
         */
        /**
         * @name AbstractGlobe
         * @class
         * Creates a sky or a planet with it own coordinate reference system and renders the globe.
         * According to its coordinate reference system, the globe can be projected on a map.<br/>
         * Client implementations should not normally instantiate this class directly.
         * @param {GLOBE} type - Type of the globe.
         * @param {AbstractGlobe.configuration} options - Options for globe creation.
         * @throws {ReferenceError} Will throw an error when the options.coordinateSystem is not defined.
         * @throws {RangeError} Will throw an error when options.coordinateSystem.geoideName  is not part of {@link CRS}
         * @throws {RangeError} Will throw an error when options.coordinateSystem.projectionName is not part of {@link PROJECTION} when it is defined
         * @see {@link module:Crs.CoordinateSystemFactory}
         * @constructor
         * @implements {Globe}
         */
        var AbstractGlobe = function (type, options) {
            _checkOptions(options);

            this.type = type;

            this.coordinateSystem = CoordinateSystemFactory.create(options.coordinateSystem);

            if (!options.renderContext) {
                this.renderContext = new RenderContext(options);
            }
            else {
                this.renderContext = options.renderContext;
            }

            this.publishEvent = options.publishEvent;

            this.isEnable = true;
            this.sky = null; // the variable is overidden in the concrete constructor
            this.continuousRendering = options.continuousRendering || false;
            this.tileManager = new TileManager(this, options);
            this.vectorRendererManager = new VectorRendererManager(this);
            this.attributionHandler = null;
            this.baseImagery = null;
            this.preRenderers = [];
            this.nbCreatedLayers = 0;

            this.tileManager.addPostRenderer(this.vectorRendererManager);

            this.renderContext.renderers.push(this);
            this.renderContext.requestFrame();
        };

        /**
         * Check required options
         * @function _checkOptions
         * @param options
         * @throws {ReferenceError} Will throw an error when the options.coordinateSystem is not defined.
         * @private
         */
        function _checkOptions(options) {
            if (!options.coordinateSystem) {
                throw new ReferenceError("coordinateSystem is not defined in " + JSON.stringify(options), "AbstractGLobe.js");
            }
        }

        /**
         * Compute intersections
         * @param ray
         * @param {Crs} crs - coordinate reference system
         * @returns {*}
         * @private
         */
        function _computeIntersection(ray, crs) {
            var intersection;
            if (crs.isFlat()) {
                intersection = ray.planeIntersect([0, 0, 0], [0, 0, 1]);
            } else {
                intersection = ray.sphereIntersect([0, 0, 0], crs.getGeoide().getRadius());
            }
            return intersection;
        }

        /**
         * Computes the position.
         * @param ray
         * @param intersection
         * @param {Crs} crs
         * @returns {float[]|null} the position
         * @private
         */
        function _computePosition(ray, intersection, crs) {
            if (intersection >= 0) {
                var pos = crs.getWorldFrom3D(ray.computePoint(intersection));
                var geoBound = crs.getGeoBound();
                if (!pos || pos[0] < geoBound[0] || pos[0] > geoBound[2] || pos[1] < geoBound[1] || pos[1] > geoBound[3] || isNaN(pos[0]) || isNaN(pos[1])) {
                    return null;
                } else {
                    return pos;
                }
            } else {
                return null;
            }
        }


        /*************************************************************************************************************/

        /**
         * @function getType
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getType = function () {
            return this.type;
        };

        /**
         * @function isSky
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.isSky = function () {
            return this.sky;
        };

        /**
         * @function dispose
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.dispose = function () {
            this.tileManager.tilePool.disposeAll();
            this.tileManager.reset();
        };

        /**
         * @function destroy
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.destroy = function () {
            if(this.tileManager) {
                this.dispose();
                this.tileManager.removePostRenderer(this.vectorRendererManager);
                this.tileManager = null;
                this.vectorRendererManager = null;
            }
            this.renderContext.renderers.splice(this.renderContext.renderers.indexOf(this), 1);
            if(this.coordinateSystem) {
                this.coordinateSystem.destroy();
                this.coordinateSystem = null;
            }
            this.type = null;
            this.publishEvent = null;
            this.isEnable = null;
            this.sky = null;
            this.continuousRendering = null;
            this.attributionHandler = null;
            this.baseImagery = null;
            this.preRenderers = null;
            this.nbCreatedLayers = null;
        };

        /**
         * @function refresh
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.refresh = function () {
            this.renderContext.requestFrame();
        };

        /**
         * @function setBaseImagery
         * @memberOf AbstractGlobe#
         * @abstract
         */
        AbstractGlobe.prototype.setBaseImagery = function (layer) {
            throw new SyntaxError("setBaseImagery Not implemented", "AbstractGlobe.js");
        };

        /**
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getBaseImagery = function () {
            return this.baseImagery;
        };

        /**
         * @function getBaseElevation
         * @memberOf AbstractGlobe#
         * @abstract
         */
        AbstractGlobe.prototype.setBaseElevation = function (layer) {
            throw new SyntaxError("setBaseElevation Not implemented",  "AbstractGlobe.js");
        };

        /**
         * @funtion getBaseElevation
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getBaseElevation = function () {
            return this.tileManager.elevationProvider;
        };

        /**
         * @function addLayer
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.addLayer = function (layer) {
            var globe = this;
            if (layer.isVectorLayer()) {
                $.ajax({
                    url: layer.getUrl(),
                    success: function (data) {
                        layer.addFeatureCollection(data);
                        layer.id = globe.nbCreatedLayers;
                        layer._attach(globe);
                        globe.renderContext.requestFrame();
                        globe.nbCreatedLayers++;
                        if (layer.callback) {
                            layer.callback(data);
                        }
                    }
                });
            } else {
                    layer.id = this.nbCreatedLayers;
                    layer._attach(globe);
                    this.renderContext.requestFrame();
                    this.nbCreatedLayers++;
            }
            this.publishEvent(Constants.EVENT_MSG.LAYER_ADDED, layer);
        };

        /**
         * @function removeLayer
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.removeLayer = function (layer) {
            layer.background = false;
            //layer.setVisible(false); <!-- cannot do it because of PlanetLayer -->
            layer._detach();
            this.renderContext.requestFrame();
            this.publishEvent(Constants.EVENT_MSG.LAYER_REMOVED, layer);
        };

        /**
         * @function addAnimation
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.addAnimation = function (anim) {
            anim.renderContext = this.renderContext;
        };

        /**
         * @function removeAnimation
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.removeAnimation = function (anim) {
            anim.renderContext = null;
        };

        /**
         * @function getElevation
         * @memberOf AbstractGlobe#
         * @abstract
         */
        AbstractGlobe.prototype.getElevation = function (lon, lat) {
            throw new SyntaxError("getElevation Not implemented",  "AbstractGlobe.js");
        };

        /**
         * @function getViewportGeoBound
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getViewportGeoBound = function (transformCallback) {
            var rc = this.renderContext;
            var tmpMat = mat4.create();

            // Compute eye in world space
            mat4.inverse(rc.viewMatrix, tmpMat);
            var eye = [tmpMat[12], tmpMat[13], tmpMat[14]];

            // Compute the inverse of view/proj matrix
            mat4.multiply(rc.projectionMatrix, rc.viewMatrix, tmpMat);
            mat4.inverse(tmpMat);

            // Transform the four corners of the frustum into world space
            // and then for each corner compute the intersection of ray starting from the eye with the earth
            var points = [[-1, -1, 1, 1], [1, -1, 1, 1], [-1, 1, 1, 1], [1, 1, 1, 1]];
            var earthCenter = [0, 0, 0];
            for (var i = 0; i < 4; i++) {
                mat4.multiplyVec4(tmpMat, points[i]);
                vec3.scale(points[i], 1.0 / points[i][3]);
                vec3.subtract(points[i], eye, points[i]);
                vec3.normalize(points[i]);

                var ray = new Ray(eye, points[i]);
                var t = ray.sphereIntersect(earthCenter, this.coordinateSystem.getGeoide().getRadius());
                //var t = ray.sphereIntersect(earthCenter, 15);
                if (t < 0.0) {
                    return null;
                }
                var pos3d = ray.computePoint(t);
                points[i] = this.coordinateSystem.from3DToGeo(pos3d);
                if (transformCallback) {
                    points[i] = transformCallback(points[i]);
                }
            }

            var geoBound = new GeoBound();
            geoBound.computeFromCoordinates(points);

            return geoBound;
        };

        /**
         * @function getLonLatFromPixel
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getLonLatFromPixel = function (x, y) {
            //console.log("AbstractGlobe.getLonLatFromPixel");
            var ray = Ray.createFromPixel(this.renderContext, x, y);

            var intersection;

            if (this.hasMesh()) {
                intersection = Number.MAX_VALUE;
                for (var i = 0; i < this.tileManager.level0Tiles.length; ++i) {
                    const tile = this.tileManager.level0Tiles[i];
                    const t = tile.intersect(ray, this.tileManager.tileIndexBuffer.indices, this.renderContext);
                    if (t < intersection && t >= 0) {
                        intersection = t;
                    }
                }
                if (intersection === Number.MAX_VALUE) {
                    intersection = -1;
                }
            } else {
                //console.log("Ray",ray);
                intersection = _computeIntersection.call(this, ray, this.coordinateSystem);
            }

            // console.log("intersection",intersection);
            var result = _computePosition.call(this, ray, intersection, this.coordinateSystem);
            // console.log("result",result);
            // console.log("=================================");
            return result;
        };

        /**
         * @function getPixelFromLonLat
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getPixelFromLonLat = function (lon, lat) {
            var pos3d = vec3.create();
            this.coordinateSystem.get3DFromWorld([lon, lat], pos3d);
            return this.renderContext.getPixelFrom3D(pos3d[0], pos3d[1], pos3d[2]);
        };

        /**
         * @protected
         * @function render
         * @memberOf AbstractGlobe#
         * @abstract
         */
        AbstractGlobe.prototype.render = function () {
            throw new SyntaxError("render Not implemented", "AbstractGlobe.js");
        };

        /**
         * @function setCoordinateSystem
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.setCoordinateSystem = function (coordinateSystem) {
            var oldCrs = this.coordinateSystem;
            this.coordinateSystem = coordinateSystem;
            this.dispose();
            this.tileManager.tileConfig.coordinateSystem = coordinateSystem;
            this._updateGeoTiling(oldCrs, coordinateSystem);
        };

        /**
         * Updates the GeoTiling when the CRS changes.
         * The GeoTiling for Azimuthal projection is quite different of the others. We need to check when a GeoTiling
         * must be updated. Once a new GeoTiling is done then we need to update the geometry related to the old GeoTiling
         * @function _updateGeoTiling
         * @memberOf AbstractGlobe#
         * @private
         */
        AbstractGlobe.prototype._updateGeoTiling = function(oldCrs, crs) {
            var mustBeUpdated;
            if (crs.isProjected() && crs.getProjection().getName() === Constants.PROJECTION.Azimuth) {
                if(oldCrs.isProjected() && oldCrs.getProjection().getName() === Constants.PROJECTION.Azimuth) {
                    // nothing to update, same projection;
                    mustBeUpdated = false;
                } else {
                    // must be updated, the GeoTiling is quite different between azimuth and another one
                    mustBeUpdated = true;
                }
            } else if (oldCrs.isProjected() && oldCrs.getProjection().getName() === Constants.PROJECTION.Azimuth) {
                if(crs.isProjected() && crs.getProjection().getName() === crs.PROJECTION.Azimuth) {
                    // nothing to update, same projection;
                    mustBeUpdated = false;
                } else {
                    // must be updated, the GeoTiling is quite different between azimuth and another one
                    mustBeUpdated = true;
                }
            } else {
                // nothing to update, the geoTiling is the same.
                mustBeUpdated = false;
            }

            if(mustBeUpdated) {
                this.tileManager.level0Tiles = this.tileManager.tiling.generateLevelZeroTiles(this.tileManager.tileConfig, this.tileManager.tilePool);
                this._updateTileIndexInGeometry();
            }
        };

        /**
         * Updates the geometry related to the old GeoTiling to the new GeoTiling.
         * @function _updateTileIndexInGeometry
         * @memberOf AbstractGlobe#
         * @private
         */
        AbstractGlobe.prototype._updateTileIndexInGeometry = function() {
            var postRenderers = this.tileManager.postRenderers;
            var postRendererIdx = postRenderers.length;
            // we use while, this is the fastest loop in Javascript https://jsperf.com/fastest-array-loops-in-javascript/32
            while(postRendererIdx--) {
                // we iterate on renderers
                var postRenderer = postRenderers[postRendererIdx];
                if (postRenderer instanceof VectorRendererManager) {
                    // we look for VectorRendererManager because this one contains geometry
                    var vectorRendererManager = postRenderers[postRendererIdx];
                    var vectors = vectorRendererManager.renderers;
                    var vectorIdx = vectors.length;
                    while(vectorIdx--) {
                        // we iterate on vector
                        var vector = vectors[vectorIdx];
                        if (vector.levelZeroTiledGeometries && vector.levelZeroTiledGeometries.length > 0) {
                            // we retrieve the geometries
                            var geometries = vector.levelZeroTiledGeometries;
                            var geometryIdx = geometries.length;
                            while(geometryIdx--) {
                                // we iterate on each geometry to update the indexed tile related to the geometry
                                // the (0,0) is 0, the (1,0) is 1, ....
                                var geometry = geometries[geometryIdx];
                                var tileIndices = vector.maxTilePerGeometry > 0 ? this.tileManager.tiling.getOverlappedLevelZeroTiles(geometry) : null;
                                // update
                                geometry._tileIndices = tileIndices;
                            }
                        }
                    }
                }
            }
        };

        /**
         * @function getCoordinateSystem
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getCoordinateSystem = function () {
            return this.coordinateSystem;
        };

        /**
         * @function getRenderStats
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getRenderStats = function () {
            return "# rendered tiles : " + this.tileManager.tilesToRender.length;
        };

        /**
         * @function getRenderContext
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getRenderContext = function () {
            return this.renderContext;
        };

        /**
         * @function setRenderContext
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.setRenderContext = function (context) {
            this.renderContext = context;
        };

        /**
         * @function getTileManager
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getTileManager = function () {
            return this.tileManager;
        };

        /**
         * @function getVectorRendererManager
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.getVectorRendererManager = function() {
            return this.vectorRendererManager;
        };

        /**
         * @function isEnabled
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.isEnabled = function () {
            return this.isEnable;
        };

        /**
         * Enables the sky
         * @function enable
         * @memberOf Sky#
         */
        AbstractGlobe.prototype.enable = function () {
            this.isEnable = true;
        };

        /**
         * @function disable
         * @memberOf Sky#
         */
        AbstractGlobe.prototype.disable = function () {
            this.isEnable = false;
        };

        AbstractGlobe.prototype.hasMesh = function() {
            return false;
        };

        return AbstractGlobe;

    });
