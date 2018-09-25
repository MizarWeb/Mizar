/*******************************************************************************
 * Copyright 2017, 2018 CNES8 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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
    "../Utils/Event",
    "../Utils/Utils",
    "../Tiling/TileManager",
    "../Renderer/RendererManager",
    "../Renderer/Ray",
    "../Renderer/GeoBound",
    "../Crs/CoordinateSystemFactory",
    "../Renderer/RenderContext",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog",
    "../Renderer/glMatrix"
], function(
    Event,
    Utils,
    TileManager,
    RendererManager,
    Ray,
    GeoBound,
    CoordinateSystemFactory,
    RenderContext,
    Constants,
    ErrorDialog
) {
    /**
     * AbstractGlobe configuration
     * @typedef {Object} AbstractGlobe.configuration
     * @property {boolean} [continuousRendering=false] - Options that renders the globe in continue
     * @property {Crs} coordinateSystem - coordinate system of the globe
     * @property {Object} [renderContext] - RenderContext object.
     * @property {string} [shadersPath=../shaders/] - Option for RenderContext : shader location.
     * @property {int} [tileErrorTreshold=4] - Option for RenderContext : tile error
     * @property {boolean} [lighting=false] - Option for RenderContext : enable/disable lighting
     * @property {Object|string} canvas - Option for RenderContext : Canvas element to insert in the globe
     * @property {Array} [backgroundColor=[0.0, 0.0, 0.0, 1.0]] - Option for RenderContext : color for background
     * @property {int} [minFar=0] - Option for RenderContext : When 0 , no limit on far
     * @property {Array} [defaultColor=[200, 200, 200, 255]] - Option for TileManager : pixel default color
     * @property {Number} [subdivisionLength=10000] - The targetted length of a segment subdivision
     * @property {Number} [maxSubdivisionCount=128] - The max number of subdivisions for a segment
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
     * @throws {Error} Will throw an error when options.coordinateSystem.geoideName  is not part of {@link CRS}
     * @see {@link module:Crs.CoordinateSystemFactory}
     * @implements {Globe}
     */
    var AbstractGlobe = function(type, options) {
        Utils.assert(
            type === Constants.GLOBE.Sky ||
                type === Constants.GLOBE.Planet ||
                type === Constants.GLOBE.Ground,
            "Type must be a value of Contants.GLOBE for " +
                this.constructor.name,
            "AbstractGlobe.js"
        );
        Utils.assert(
            options != null,
            "Options is required " + this.constructor.name,
            "AbastractGlobe.js"
        );
        Utils.assert(
            options.coordinateSystem != null &&
                typeof options.coordinateSystem === "object" &&
                options.coordinateSystem.geoideName != null,
            "coordinate system is required in options parameters for " +
                this.constructor.name,
            "AbastractGlobe.js"
        );
        this.type = type;

        this.coordinateSystem = CoordinateSystemFactory.create(
            options.coordinateSystem
        );

        if (!options.renderContext) {
            this.renderContext = new RenderContext(options);
        } else {
            this.renderContext = options.renderContext;
        }

        this.publishEvent = options.publishEvent;

        this.isEnable = true;
        this.continuousRendering = options.continuousRendering || false;
        this.tileManager = new TileManager(this, options);
        this.rendererManager = new RendererManager(this);
        this.attributionHandler = null;
        this.baseImagery = null;
        this.preRenderers = [];
        this.nbCreatedLayers = 0;
        this.definedBackgound = false;
        this.subdivisionLength = options.subdivisionLength || 10000;
        this.maxSubdivisionCount = options.maxSubdivisionCount || 128;

        this.tileManager.addPostRenderer(this.rendererManager);

        this.renderContext.renderers.push(this);
        this.refresh();
    };

    /**
     * Computes intersections.
     * @param {Ray} ray
     * @param {Crs} crs - coordinate reference system
     * @returns {number} The nearest intersection, < 0 if no intersection
     * @private
     */
    function _computeIntersection(ray, crs) {
        var intersection;
        if (crs.isFlat()) {
            intersection = ray.planeIntersect([0, 0, 0], [0, 0, 1]);
        } else {
            intersection = ray.sphereIntersect(
                [0, 0, 0],
                crs.getGeoide().getRadius()
            );
        }
        return intersection;
    }

    /**
     * Computes the position.
     * @param {Ray} ray
     * @param {number} intersection
     * @param {Crs} crs
     * @returns {float[]|null} the position
     * @private
     */
    function _computePosition(ray, intersection, crs) {
        if (intersection >= 0) {
            var pos = crs.getWorldFrom3D(ray.computePoint(intersection));
            var geoBound = crs.getGeoBound();
            if (
                !pos ||
                pos[0] < geoBound[0] ||
                pos[0] > geoBound[2] ||
                pos[1] < geoBound[1] ||
                pos[1] > geoBound[3] ||
                isNaN(pos[0]) ||
                isNaN(pos[1])
            ) {
                return null;
            } else {
                return pos;
            }
        } else {
            return null;
        }
    }

    /**
     * Updates the geometry related to the old GeoTiling to the new GeoTiling.
     * @function _updateTileIndexInGeometry
     * @param {TileManager} tileManager tile manager
     * @private
     */
    function _updateTileIndexInGeometry(tileManager) {
        var postRenderers = tileManager.postRenderers;
        var postRendererIdx = postRenderers.length;
        // we use while, this is the fastest loop in Javascript https://jsperf.com/fastest-array-loops-in-javascript/32
        while (postRendererIdx--) {
            // we iterate on renderers
            var postRenderer = postRenderers[postRendererIdx];
            if (postRenderer instanceof RendererManager) {
                // we look for RendererManager because this one contains geometry
                var rendererManager = postRenderers[postRendererIdx];
                var vectors = rendererManager.renderers;
                var vectorIdx = vectors.length;
                while (vectorIdx--) {
                    // we iterate on vector
                    var vector = vectors[vectorIdx];
                    if (
                        vector.levelZeroTiledGeometries &&
                        vector.levelZeroTiledGeometries.length > 0
                    ) {
                        // we retrieve the geometries
                        var geometries = vector.levelZeroTiledGeometries;
                        var geometryIdx = geometries.length;
                        while (geometryIdx--) {
                            // we iterate on each geometry to update the indexed tile related to the geometry
                            // the (0,0) is 0, the (1,0) is 1, ....
                            var geometry = geometries[geometryIdx];
                            var tileIndices =
                                vector.maxTilePerGeometry > 0
                                    ? tileManager.tiling.getOverlappedLevelZeroTiles(
                                        geometry
                                    )
                                    : null;
                            // update
                            geometry._tileIndices = tileIndices;
                        }
                    }
                }
            }
        }
    }

    /*************************************************************************************************************/

    /**
     * @function getType
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getType = function() {
        return this.type;
    };

    /**
     * @function isSky
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.isSky = function() {
        return this.getType() === Constants.GLOBE.Sky;
    };

    /**
     * @function isPlanet
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.isPlanet = function() {
        return this.getType() === Constants.GLOBE.Planet;
    };

    /**
     * @function hasDefinedBackground
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.hasDefinedBackground = function() {
        return this.definedBackgound;
    };

    /**
     * @function setBaseImagery
     * @memberof AbstractGlobe#
     * @abstract
     */
    AbstractGlobe.prototype.setBaseImagery = function(layer) {
        throw new SyntaxError(
            "setBaseImagery Not implemented",
            "AbstractGlobe.js"
        );
    };

    /**
     * @function getBaseImagery
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getBaseImagery = function() {
        return this.baseImagery;
    };

    /**
     * @function setBaseElevation
     * @memberof AbstractGlobe#
     * @abstract
     */
    AbstractGlobe.prototype.setBaseElevation = function(layer) {
        throw new SyntaxError(
            "setBaseElevation Not implemented",
            "AbstractGlobe.js"
        );
    };

    /**
     * @function getBaseElevation
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getBaseElevation = function() {
        return this.tileManager.elevationProvider;
    };

    /**
     * @function addLayer
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.addLayer = function(layer) {
        Utils.assert(
            layer != null,
            "layer must be an AbstractLayer object in addLayer for " +
                this.constructor.name,
            "AbstractGlobe.js"
        );
        var globe = this;
        if (layer.isVectorLayer()) {
            if (layer.isForDataProvider() || layer.isDraw()) {
                layer.id = globe.nbCreatedLayers;
                layer._attach(globe);
                globe.refresh();
                globe.nbCreatedLayers++;
            } else {
                // normal case
                Utils.requestUrl(
                    layer.getUrl(),
                    "json",
                    "application/json",
                    null,                
                    function(data) {
                        layer.addFeatureCollection(data);
                        layer.id = globe.nbCreatedLayers;
                        layer._attach(globe);
                        globe.refresh();
                        globe.nbCreatedLayers++;
                        if (layer.callback) {
                            layer.callback(data);
                        }
                    },
                    function(err) {
                        ErrorDialog.open(
                            Constants.LEVEL.ERROR,
                            "Failed to request " + layer.getUrl(),
                            err
                        );
                    }
                );
            }
        } else {
            if (!layer.id) {
                layer.id = this.nbCreatedLayers;
                this.nbCreatedLayers++;
            }
            layer._attach(globe);
            this.refresh();
        }
        if (layer.isBackground()) {
            this.publishEvent(
                Constants.EVENT_MSG.LAYER_BACKGROUND_ADDED,
                layer
            );
        } else {
            this.publishEvent(Constants.EVENT_MSG.LAYER_ADDED, layer);
        }
    };

    /**
     * @function removeLayer
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.removeLayer = function(layer) {
        Utils.assert(
            layer != null,
            "layer must be an AbstractLayer object in removeLayer for " +
                this.constructor.name,
            "AbstractGlobe.js"
        );
        layer.background = false;
        //layer.setVisible(false); <!-- cannot do it because of PlanetLayer -->
        layer._detach();
        this.publishEvent(Constants.EVENT_MSG.LAYER_REMOVED, layer);
    };

    /**
     * @function addAnimation
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.addAnimation = function(anim) {
        Utils.assert(
            anim != null,
            "anim must be an AbstractAnimation object in addAnimation for " +
                this.constructor.name,
            "AbstractGlobe.js"
        );
        anim.renderContext = this.renderContext;
    };

    /**
     * @function removeAnimation
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.removeAnimation = function(anim) {
        Utils.assert(
            anim != null,
            "anim must be an AbstractAnimation object in removeAnimation for " +
                this.constructor.name,
            "AbstractGlobe.js"
        );
        anim.renderContext = null;
    };

    /**
     * @function getElevation
     * @memberof AbstractGlobe#
     * @abstract
     */
    AbstractGlobe.prototype.getElevation = function(lon, lat) {
        throw new SyntaxError(
            "getElevation Not implemented",
            "AbstractGlobe.js"
        );
    };

    /**
     * @function getViewportGeoBound
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getViewportGeoBound = function(transformCallback) {
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
        var points = [
            [-1, -1, 1, 1],
            [1, -1, 1, 1],
            [-1, 1, 1, 1],
            [1, 1, 1, 1]
        ];
        var earthCenter = [0, 0, 0];
        for (var i = 0; i < 4; i++) {
            mat4.multiplyVec4(tmpMat, points[i]);
            vec3.scale(points[i], 1.0 / points[i][3]);
            vec3.subtract(points[i], eye, points[i]);
            vec3.normalize(points[i]);

            var ray = new Ray(eye, points[i]);
            var t = ray.sphereIntersect(
                earthCenter,
                this.coordinateSystem.getGeoide().getRadius()
            );
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
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getLonLatFromPixel = function(x, y) {
        Utils.assert(
            typeof x === "number" && typeof y === "number",
            "(lon,lat) from getLonLatFromPixel must be numbers for " +
                this.constructor.name,
            "AbstractGlobe.js"
        );
        var ray = Ray.createFromPixel(this.renderContext, x, y);
        return this.computeIntersection(ray);
    };

    /**
     * @function getPixelFromLonLat
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getPixelFromLonLat = function(lon, lat) {
        Utils.assert(
            typeof lon === "number" && typeof lat === "number",
            "(lon,lat) from getPixelFromLonLat must be numbers for " +
                this.constructor.name,
            "AbstractGlobe.js"
        );
        var pos3d = vec3.create();
        this.coordinateSystem.get3DFromWorld([lon, lat], pos3d);
        return this.renderContext.getPixelFrom3D(pos3d[0], pos3d[1], pos3d[2]);
    };

    /**
     * @function setCoordinateSystem
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.setCoordinateSystem = function(coordinateSystem) {
        Utils.assert(
            coordinateSystem != null,
            "coordinateSystem must be a Crs object in setCoordinateSystem for " +
                this.constructor.name,
            "AbstractGlobe.js"
        );
        var oldCrs = this.coordinateSystem;
        this.coordinateSystem = coordinateSystem;
        this.dispose();
        this.tileManager.tileConfig.coordinateSystem = coordinateSystem;
        _updateTileIndexInGeometry.call(this, this.getTileManager());
    };

    /**
     * @function getCoordinateSystem
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getCoordinateSystem = function() {
        return this.coordinateSystem;
    };

    /**
     * @function computeIntersection
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.computeIntersection = function(ray) {
        var intersection;

        if (this.hasMesh()) {
            intersection = Number.MAX_VALUE;
            for (var i = 0; i < this.tileManager.level0Tiles.length; ++i) {
                const tile = this.tileManager.level0Tiles[i];
                const t = tile.intersect(
                    ray,
                    this.tileManager.tileIndexBuffer.indices,
                    this.renderContext
                );
                if (t < intersection && t >= 0) {
                    intersection = t;
                }
            }
            if (intersection === Number.MAX_VALUE) {
                intersection = -1;
            }
        } else {
            //console.log("Ray",ray);
            intersection = _computeIntersection.call(
                this,
                ray,
                this.coordinateSystem
            );
        }

        // console.log("intersection",intersection);
        var result = _computePosition.call(
            this,
            ray,
            intersection,
            this.coordinateSystem
        );
        // console.log("result",result);
        // console.log("=================================");
        return result;
    };

    /**
     * @function getRenderStats
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getRenderStats = function() {
        return "# rendered tiles : " + this.tileManager.tilesToRender.length;
    };

    /**
     * @function getRenderContext
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getRenderContext = function() {
        return this.renderContext;
    };

    /**
     * @function setRenderContext
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.setRenderContext = function(context) {
        Utils.assert(
            context != null,
            "context must be a Context object in setRenderContext for " +
                this.constructor.name,
            "AbstractGlobe.js"
        );
        this.renderContext = context;
    };

    /**
     * @function getTileManager
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getTileManager = function() {
        return this.tileManager;
    };

    /**
     * @function getRendererManager
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.getRendererManager = function() {
        return this.rendererManager;
    };

    /**
     * @function render
     * @memberof AbstractGlobe#
     * @abstract
     */
    AbstractGlobe.prototype.render = function() {
        throw new SyntaxError("render Not implemented", "AbstractGlobe.js");
    };

    /**
     * @function dispose
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.dispose = function() {
        this.tileManager.reset();
        this.tileManager.tilePool.disposeAll();
    };

    /**
     * @function destroy
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.destroy = function() {
        if (this.tileManager) {
            this.dispose();
            this.tileManager.removePostRenderer(this.rendererManager);
            this.tileManager = null;
            this.rendererManager = null;
        }
        this.renderContext.renderers.splice(
            this.renderContext.renderers.indexOf(this),
            1
        );
        if (this.coordinateSystem) {
            this.coordinateSystem.destroy();
            this.coordinateSystem = null;
        }
        this.refresh();
        this.definedBackgound = null;
        this.type = null;
        this.publishEvent = null;
        this.isEnable = null;
        this.globe = null;
        this.continuousRendering = null;
        this.attributionHandler = null;
        this.baseImagery = null;
        this.preRenderers = null;
        this.nbCreatedLayers = null;
    };

    /**
     * @function refresh
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.refresh = function() {
        this.renderContext.requestFrame();
    };

    /**
     * @function isEnabled
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.isEnabled = function() {
        return this.isEnable;
    };

    /**
     * @function enable
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.enable = function() {
        this.isEnable = true;
    };

    /**
     * @function disable
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.disable = function() {
        this.isEnable = false;
    };

    /**
     * @function hasMesh
     * @memberof AbstractGlobe#
     */
    AbstractGlobe.prototype.hasMesh = function() {
        return false;
    };

    /**
     * @function getSubdivisionLength
     * @member AbstractGlobe#
     */
    AbstractGlobe.prototype.getSubdivisionLength = function() {
        return this.subdivisionLength;
    };

    /**
     * @function setSubdivisionLength
     * @member AbstractGlobe#
     */
    AbstractGlobe.prototype.setSubdivisionLength = function(value) {
        this.subdivisionLength = value;
    };

    /**
     * @function getMaxSubdivisionCount
     * @member AbstractGlobe#
     */
    AbstractGlobe.prototype.getMaxSubdivisionCount = function() {
        return this.maxSubdivisionCount;
    };

    /**
     * @function setMaxSubdivisionCount
     * @member AbstractGlobe#
     */
    AbstractGlobe.prototype.setMaxSubdivisionCount = function(value) {
        this.maxSubdivisionCount = value;
    };

    return AbstractGlobe;
});
