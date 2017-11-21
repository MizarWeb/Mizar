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
        '../Crs/CoordinateSystemFactory', '../Renderer/RenderContext','../Renderer/glMatrix'],
    function (Event, Utils,
              TileManager, VectorRendererManager, Ray, GeoBound,
              CoordinateSystemFactory, RenderContext) {


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
            return intersection
        }

        /**
         * Computes the position
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
            this.dispose();
            this.tileManager.removePostRenderer(this.vectorRendererManager);
            this.renderContext.renderers.splice(this.renderContext.renderers.indexOf(this), 1);
            this.coordinateSystem.destroy();
            this.type = null;
            this.publishEvent = null;
            this.isEnable = null;
            this.sky = null;
            this.continuousRendering = null;
            this.tileManager = null;
            this.vectorRendererManager = null;
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
            throw "setBaseImagery Not implemented";
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
            throw "setBaseElevation Not implemented";
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
            if (layer.url) {
                $.ajax({
                    url: layer.url,
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
            this.publishEvent("layer:add", layer);
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
            this.publishEvent("layer:remove", layer);
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
            throw "getElevation Not implemented";
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
            var ray = Ray.createFromPixel(this.renderContext, x, y);
            var intersection = _computeIntersection.call(this, ray, this.coordinateSystem);
            return _computePosition.call(this, ray, intersection, this.coordinateSystem);
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
            throw "render Not implemented";
        };

        /**
         * @function setCoordinateSystem
         * @memberOf AbstractGlobe#
         */
        AbstractGlobe.prototype.setCoordinateSystem = function (coordinateSystem) {
            this.coordinateSystem = coordinateSystem;
            this.tileManager.tileConfig.coordinateSystem = coordinateSystem;
            this.dispose();
            this.tileManager.level0Tiles = this.tileManager.tiling.generateLevelZeroTiles(this.tileManager.tileConfig, this.tileManager.tilePool);
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

        return AbstractGlobe;

    });
