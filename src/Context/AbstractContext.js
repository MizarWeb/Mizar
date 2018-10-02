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
    "jquery",
    "underscore-min",
    "../Utils/Event",
    "moment",
    "../Utils/Utils",
    "../Time/Time",
    "../Utils/UtilsIntersection",
    "../Services/ServiceFactory",
    "../Utils/Constants",
    "../Registry/WMSServerRegistryHandler",
    "../Registry/WMTSServerRegistryHandler",
    "../Registry/WCSServerRegistryHandler",
    "../Registry/OpenSearchRegistryHandler",
    "../Registry/PendingLayersRegistryHandler",
    "../Registry/LayerRegistryHandler",
    "../Gui/Compass",
    "../Gui/Tracker/PositionTracker",
    "../Gui/Tracker/ElevationTracker",
    "../Utils/AttributionHandler",
    "../Gui/dialog/ErrorDialog",
    "../Renderer/PointRenderer",
    "../Renderer/LineStringRenderable",
    "../Renderer/PolygonRenderer",
    "../Renderer/LineRenderer",
    "../Renderer/PointSpriteRenderer",
    "../Renderer/ConvexPolygonRenderer",
    "../Renderer/PolyLineRenderer"
], function (
    $,
    _,
    Event,
    Moment,
    Utils,
    Time,
    UtilsIntersection,
    ServiceFactory,
    Constants,
    WMSServerRegistryHandler,
    WMTSServerRegistryHandler,
    WCSServerRegistryHandler,
    OpenSearchRegistryHandler,
    PendingLayersRegistryHandler,
    LayerRegistryHandler,
    Compass,
    PositionTracker,
    ElevationTracker,
    AttributionHandler,
    ErrorDialog
) {
    //TODO : attention de bien garder les ...Renderer dans le define

    /**
     * Default ID for position tracker
     * @constant
     * @type {string}
     * @default
     */
    const DEFAULT_POSITION_TRACKER_ELT = "posTracker";
    /**
     * Default position for position tracker
     * @constant
     * @type {string}
     * @default
     */
    const DEFAULT_POSITION_TRACKER_ELT_POS = "bottom";
    /**
     * Default ID for elevation tracker
     * @constant
     * @type {string}
     * @default
     */
    const DEFAULT_ELEVATION_TRACKER_ELT = "elevTracker";
    /**
     * Default position for elevation tracker
     * @constant
     * @type {string}
     * @default
     */
    const DEFAULT_ELEVATION_TRACKER_ELT_POS = "bottom";
    /**
     * Default ID for compass
     * @constant
     * @type {string}
     * @default
     */
    const DEFAULT_COMPASS_ELT = "compassDiv";
    /**
     * Default ID for attribution
     * @constant
     * @type {string}
     * @default
     */
    const DEFAULT_ATTRIBUTION_ELT = "globeAttributions";

    /**
     * @constant
     * @type{{RA:{string},DEC:{String}}}
     */
    const TARGET_POS = {
        RA: "initialRa",
        DEC: "initialDec"
    };

    /**
     * @constant
     * @type {number}
     * @default
     */
    const DEFAULT_ZOOM_DURATION = 3000;

    /**
     * @name AbstractContext
     * @class
     * A context is the main webGL object that contains its own coordinate reference system,
     * its own data, its own navigation and its own GUI.<br/>
     * Client implementations should not normally instantiate this class directly.
     * @param {Mizar.configuration} mizarConfiguration - Mizar configuration
     * @param {CONTEXT} mode - the type of context
     * @param {AbstractContext.skyContext|AbstractContext.planetContext} ctxOptions - sky or planet options
     * @implements {Context}
     * @listens Layer#baseLayersReady
     */
    var AbstractContext = function(mizarConfiguration, mode, ctxOptions) {
        Event.prototype.constructor.call(this);
        var self = this;
        this.time = Time.parse(Moment().toISOString());
        this.globe = null; // Sky or globe
        this.navigation = null;
        this.attributionHandler = null;
        this.components = {};
        this.dataProviders = {};
        this.canvas = mizarConfiguration.canvas;
        this.isMobile = ctxOptions.isMobile;
        this.isEnableCtx = true;

        // Link to time travel service
        this.timeTravelService = ctxOptions.timeTravelService;

        this.subscribe(Constants.EVENT_MSG.BASE_LAYERS_READY, function(
            imagery
        ) {
            // When the background takes time to load, the viewMatrix computed by "computeViewMatrix" is created but
            // with empty values. Because of that, the globe cannot be displayed without moving the camera.
            // So we rerun "computeViewMatrix" once "baseLayersReady" is loaded to display the globe
            if (
                self.getNavigation().getRenderContext().viewMatrix[0] !==
                "undefined"
            ) {
                self.getNavigation().computeViewMatrix();
            }
        });
        this.mizarConfiguration = mizarConfiguration.hasOwnProperty(
            "configuration"
        )
            ? mizarConfiguration.configuration
            : {};
        this.ctxOptions = ctxOptions;
        this.mode = mode;
        this.layers = [];
        this.pendingLayers = [];
        this.initCanvas(this.canvas);

        try {
            this.positionTracker = _createTrackerPosition.call(
                this,
                this.mizarConfiguration
            );
        } catch (err) {
            ErrorDialog.open(
                Constants.LEVEL.DEBUG,
                "Cannot create position tracker",
                err
            );
        }

        try {
            this.elevationTracker = _createTrackerElevation.call(
                this,
                this.mizarConfiguration,
                ctxOptions
            );
        } catch (err) {
            ErrorDialog.open(
                Constants.LEVEL.DEBUG,
                "Cannot create elevation tracker",
                err
            );
        }

        try {
            this.compass = _createCompass.call(this, this.mizarConfiguration);
        } catch (err) {
            ErrorDialog.open(
                Constants.LEVEL.DEBUG,
                "Cannot create compass tracker",
                err
            );
        }
    };

    function _initComponentsVisibility(components) {
        // Show UI components depending on its state
        for (var componentId in components) {
            if (_isDivExist(componentId)) {
                if (components[componentId]) {
                    $("#" + componentId).fadeIn(1000);
                } else {
                    $("#" + componentId).fadeOut();
                }
            }
        }
    }

    function _isDivExist(divID) {
        return $("#" + divID).length;
    }

    /**
     * Zoom to the selected layer.
     * @param {Layer} layer - selected layer
     * @private
     */
    function _handleCameraWhenLayerAdded(layer) {
        if (
            layer.isVisible() &&
            layer.getProperties() &&
            !layer.isBackground() &&
            layer.getProperties().hasOwnProperty(TARGET_POS.RA) &&
            layer.getProperties().hasOwnProperty(TARGET_POS.DEC)
        ) {
            var fov = layer.getProperties().initialFov
                ? layer.getProperties().initialFov
                : layer
                    .getGlobe()
                    .getRenderContext()
                    .getFov();
            var navigation = layer.callbackContext.getNavigation();
            var center = navigation.getCenter();
            var globeType = layer.globe.getType();
            switch (globeType) {
            case Constants.GLOBE.Sky:
                navigation.zoomTo(
                    [
                        layer.getProperties().initialRa,
                        layer.getProperties().initialDec
                    ],
                    {
                        fov: fov,
                        duration: DEFAULT_ZOOM_DURATION
                    }
                );
                break;
            case Constants.GLOBE.Planet:
                var bbox = layer.getProperties().bbox;
                if (
                    UtilsIntersection.isValueBetween(
                        center[0],
                        bbox[0],
                        bbox[2]
                    ) &&
                        UtilsIntersection.isValueBetween(
                            center[1],
                            bbox[1],
                            bbox[3]
                        )
                ) {
                    // Do not move, we see the target
                } else {
                    var crs = layer.globe.getCoordinateSystem();
                    var planetRadius = crs
                        .getGeoide()
                        .getRealPlanetRadius();
                    var distanceCamera = Utils.computeDistanceCameraFromBbox(
                        bbox,
                        fov,
                        planetRadius,
                        crs.isFlat()
                    );
                    navigation.zoomTo(
                        [
                            layer.getProperties().initialRa,
                            layer.getProperties().initialDec
                        ],
                        {
                            distance: distanceCamera,
                            duration: 3000
                        }
                    );
                }
                break;
            default:
                throw new Error(
                    "type " + globeType + " is not implemented",
                    "AbstractContext.js"
                );
            }
        }
    }

    /**
     * Creates position tracker
     *
     * When no position tracker element is defined in the configuration,
     * then {@link DEFAULT_POSITION_TRACKER_ELT} is the default element
     * @param {Mizar.configuration} mizarConfiguration
     * @returns {PositionTracker} positionTracker object or null when the tracker is not configured
     * @throws {ReferenceError} Can't get the Div to insert the tracker
     * @private
     */
    function _createTrackerPosition(mizarConfiguration) {
        return new PositionTracker({
            element:
                mizarConfiguration.positionTracker &&
                mizarConfiguration.positionTracker.element
                    ? mizarConfiguration.positionTracker.element
                    : DEFAULT_POSITION_TRACKER_ELT,
            isMobile: mizarConfiguration.isMobile,
            position:
                mizarConfiguration.positionTracker &&
                mizarConfiguration.positionTracker.position
                    ? mizarConfiguration.positionTracker.position
                    : DEFAULT_POSITION_TRACKER_ELT_POS
        });
    }

    /**
     * Creates elevation tracker.
     * When no elevation tracker element is defined in the configuration,
     * then {@link DEFAULT_ELEVATION_TRACKER_ELT} is the default element
     * @param {Mizar.configuration} mizarConfiguration - Mizar configuration
     * @param {AbstractContext.planetContext} ctxOptions - options
     * @returns {ElevationTracker} elevationTracker object or null when the tracker is not configured
     * @throws {ReferenceError} Can't get the Div to insert the tracker
     * @private
     */
    function _createTrackerElevation(mizarConfiguration, ctxOptions) {
        return new ElevationTracker({
            element:
                mizarConfiguration.elevationTracker &&
                mizarConfiguration.elevationTracker.element
                    ? mizarConfiguration.elevationTracker.element
                    : DEFAULT_ELEVATION_TRACKER_ELT,
            isMobile: mizarConfiguration.isMobile,
            position:
                mizarConfiguration.elevationTracker &&
                mizarConfiguration.elevationTracker.elevation
                    ? mizarConfiguration.elevationTracker.position
                    : DEFAULT_ELEVATION_TRACKER_ELT_POS,
            elevationLayer:
                ctxOptions.planetLayer !== undefined
                    ? ctxOptions.planetLayer.elevationLayer
                    : undefined
        });
    }

    /**
     * Creates compass.
     * When no compass element is defined in the configuration,
     * then {@link DEFAULT_COMPASS_ELT} is the default element
     * @param {Mizar.configuration} mizarConfiguration - Mizar configuration
     * @returns {Compass}
     * @throws {ReferenceError} can't get the div to insert the compass
     * @private
     */
    function _createCompass(mizarConfiguration) {
        return new Compass({
            element: mizarConfiguration.compass
                ? mizarConfiguration.compass
                : DEFAULT_COMPASS_ELT,
            ctx: this,
            isMobile: this.isMobile
        });
    }

    /**
     * Adds to the globe either as background or as additional layer
     * @param {Layer} layer - layer to add.
     * @fires Context#backgroundLayer:changed
     * @fires Context#backgroundLayer:added
     * @fires Context#layer:added
     * @private
     */
    function _addToGlobe(layer) {
        if (!this._getGlobe().hasDefinedBackground() && layer.isBackground()) {
            this._getGlobe().setBaseImagery(layer);
        } else {
            this._getGlobe().addLayer(layer);
        }
    }

    /**
     * Removes the layer from rasterOverlayRenderer and set the background attribute to true.
     *
     * When the user uses setBackgroundLayer or setBackgroundLayerByID,
     * the layer had background = false as attribute , so it was add it as a simple overlay.
     * To add the layer as background, first we need to remove it from rasterOverlayRenderer.
     * @param {Layer} layer
     * @private
     */
    function _removeRasterOverlay(layer) {
        // todo : when added a layer without background = true and then using setBackgroundLayer
        // the screen blink. It seems, this is due to the removeOverlay
        if (
            layer.getInformationType() === Constants.INFORMATION_TYPE.RASTER &&
            !layer.isBackground()
        ) {
            this._getGlobe().rasterOverlayRenderer.removeOverlay(layer);
            layer.background = true;
        }
    }

    /**************************************************************************************************************/
    Utils.inherits(Event, AbstractContext);
    /**************************************************************************************************************/

    /**
     * @function getTime
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getTime = function() {
        return this.time;
    };

    /**
     * @function setTime
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.setTime = function(time) {
        this.time = Time.parse(time);
        for (var i = 0; i < this.layers.length; i++) {
            var layer = this.layers[i];
            layer.setTime(this.time);
        }
    };

    /**
     * ShowUp message.<br/>
     * Do not display the canvas with the ID <i>MizarCanvas</i> and the loading icon and displays
     * the HTML element with the ID <i>webGLNotAvailable</i>
     * @param err
     * @protected
     * @todo Mettre en paramètre MizarCanvas et webGLNotAvailable
     */
    AbstractContext.prototype._showUpError = function(err) {
        if (document.getElementById("MizarCanvas")) {
            document.getElementById("MizarCanvas").style.display = "none";
        }
        if (document.getElementById("loading")) {
            document.getElementById("loading").style.display = "none";
        }
        if (document.getElementById("webGLNotAvailable")) {
            document.getElementById("webGLNotAvailable").style.display =
                "block";
        }
    };

    /**
     * Fill data-provider-type layer by features coming from data object
     * @function _fillDataProvider
     * @param {Layer} layer - layer in which data should be added.
     * @param {Object} mizarDescription - See the base properties {@link AbstractLayer.configuration} and a specific layer for specific properties
     * @memberof AbstractContext#
     * @protected
     */
    AbstractContext.prototype._fillDataProvider = function(
        layer,
        mizarDescription
    ) {
        if (
            mizarDescription.data &&
            this.dataProviders[mizarDescription.data.type]
        ) {
            var callback = this.dataProviders[mizarDescription.data.type];
            callback(layer, mizarDescription.data);
        }
    };

    /**
     * Returns the data provider layers or an empty array when no data provider layer.
     * @function getDataProviderLayers
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getDataProviderLayers = function() {
        var dpLayers = [];
        var layers = this.getLayers();
        var i = layers.length;
        var layer = layers[i];
        while (layer) {
            if (
                layer.hasOwnProperty("options") &&
                layer.options.hasOwnProperty("type") &&
                layer.options.type === Constants.LAYER.GeoJSON
            ) {
                dpLayers.push(layer);
            }
            layer = layers[++i];
        }
        return dpLayers;
    };

    /**
     * @function getTileManager
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getTileManager = function() {
        return this._getGlobe().getTileManager();
    };

    /**
     * Registers no standard data provider and call them in the addLayer method.
     * @function registerNoStandardDataProvider
     * @param {string} type - data provider key
     * @param {Function} loadFunc - Function
     * @memberof AbstractContext#
     * @example <caption>Registers planets on the sky</caption>
     *   var planetProvider = ProviderFactory.create(Constants.PROVIDER.Planet);
     *   this.registerNoStandardDataProvider("planets", planetProvider.loadFiles);
     */
    AbstractContext.prototype.registerNoStandardDataProvider = function(
        type,
        loadFunc
    ) {
        this.dataProviders[type.toString()] = loadFunc;
    };

    /**
     * @function getContextConfiguration
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getContextConfiguration = function() {
        return this.ctxOptions;
    };

    /**
     * @function getMizarConfiguration
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getMizarConfiguration = function() {
        return this.mizarConfiguration;
    };

    /**
     * @function _getGlobe
     * @memberof AbstractContext#
     * @private
     */
    AbstractContext.prototype._getGlobe = function() {
        return this.globe;
    };

    /**
     * @function getLonLatFromPixel
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getLonLatFromPixel = function(x, y) {
        return this._getGlobe().getLonLatFromPixel(x, y);
    };

    /**
     * @function getPixelFromLonLat
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getPixelFromLonLat = function(
        longitude,
        latitude
    ) {
        return this._getGlobe().getPixelFromLonLat(longitude, latitude);
    };

    /**
     * @function getElevation
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getElevation = function(lon, lat) {
        return this._getGlobe().getElevation(lon, lat);
    };

    /**
     * @function getPositionTracker
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getPositionTracker = function() {
        return this.positionTracker;
    };

    /**
     * @function getElevationTracker
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getElevationTracker = function() {
        return this.elevationTracker;
    };

    /**
     * @function getLayers
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getLayers = function() {
        return this.layers;
    };

    /**
     * @function getLayerByID
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getLayerByID = function(layerId) {
        return _.find(_.union(this.getLayers()), function(layer) {
            return layer.getID() === layerId;
        });
    };

    /**
     * @function getLayerByName
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getLayerByName = function(layerName) {
        return _.findWhere(this.getLayers(), { name: layerName });
    };

    /**
     * @function addLayer
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.addLayer = function(
        layerDescription,
        callback,
        fallback
    ) {
        var pendingLayersHandler = new PendingLayersRegistryHandler(
            this.pendingLayers,
            this.layers
        );
        var wmsServerHandler = new WMSServerRegistryHandler(
            this.pendingLayers
        );
        var wmtsServerHandler = new WMTSServerRegistryHandler(
            this.pendingLayers
        );
        var wcsServerHandler = new WCSServerRegistryHandler(
            this.layers,
            this.pendingLayers
        );

        var openSearchServerHandler = new OpenSearchRegistryHandler(
            this.pendingLayers
        );        
        var layerHandler = new LayerRegistryHandler(this.pendingLayers);

        pendingLayersHandler.setNext(wmsServerHandler);
        wmsServerHandler.setNext(wmtsServerHandler);
        wmtsServerHandler.setNext(wcsServerHandler);
        wcsServerHandler.setNext(openSearchServerHandler);
        openSearchServerHandler.setNext(layerHandler);

        var self = this;
        pendingLayersHandler.handleRequest(
            layerDescription,
            function(layers) {
                for (var i = 0; i < layers.length; i++) {
                    var layer = layers[i];
                    layer.callbackContext = self;

                    self.layers.push(layer);

                    // Take autoFillTimeTravel into account
                    if (layer.autoFillTimeTravel === true) {
                        // Only when visible & time travel service activated and available
                        if (
                            layer.visible === true &&
                            self.timeTravelService &&
                            typeof self.timeTravelService !== "undefined"
                        ) {
                            self.timeTravelService.update(
                                layer.timeTravelValues
                            );
                        }
                    }

                    _addToGlobe.call(self, layer);

                    self._fillDataProvider(layer, layerDescription);
                    if (layer.isVisible()) {
                        layer.setTime(self.getTime());
                    }

                    if (layer.isPickable()) {
                        ServiceFactory.create(
                            Constants.SERVICE.PickingManager
                        ).addPickableLayer(layer);
                    }

                    layer.subscribe(
                        Constants.EVENT_MSG.LAYER_VISIBILITY_CHANGED,
                        _handleCameraWhenLayerAdded
                    );

                    //if (layer.addEventTime) {
                    //    layer.addEventTime();
                    //}

                    if (callback) {
                        callback(layer.ID);
                    }
                }
            },
            function(e) {
                if (fallback) {
                    fallback(e);
                } else {
                    ErrorDialog.open(
                        Constants.LEVEL.ERROR,
                        "Cannot create the layer(s)",
                        e
                    );
                }
            }
        );
    };

    /**
     * @function getLinkedLayers
     * @memberof AbstractContext#
     * @return {Array} Array of linked layers
     * @private
     */

    AbstractContext.prototype.getLinkedLayers = function(layerID) {
        // Search linked layers
        var indexes = $.map(this.layers, function(obj, index) {
            if (obj.linkedTo === layerID) {
                return index;
            }
        });
        var linkedLayers = [];
        for (var i = 0; i < indexes.length; i++) {
            linkedLayers.push(this.layers[indexes[i]]);
        }
        return linkedLayers;
    };

    /**
     * @function removeLayer
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.removeLayer = function(layerID) {
        var removedLayer = null;
        var indexes = $.map(this.layers, function(obj, index) {
            if (obj.ID === layerID) {
                return index;
            }
        });

        if (indexes.length > 0) {
            // At least one layer to remove
            var removedLayers = this.layers.splice(indexes[0], 1);
            removedLayer = removedLayers[0];
            if (removedLayer.autoFillTimeTravel === true) {
                this.timeTravelService.update({
                    remove: { ID: layerID }
                });
            }
            var tileManager = this.getTileManager();
            tileManager.abortLayerRequests(removedLayer);

            removedLayer.unsubscribe(
                Constants.EVENT_MSG.LAYER_VISIBILITY_CHANGED,
                _handleCameraWhenLayerAdded
            );
            ServiceFactory.create(
                Constants.SERVICE.PickingManager
            ).removePickableLayer(removedLayer);

            this._getGlobe().removeLayer(removedLayer);
            this.getRenderContext().requestFrame();
        }
        return removedLayer;
    };

    /**
     * @function removeAllLayers
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.removeAllLayers = function() {
        var nbLayers = this.layers.length;
        while (nbLayers != 0) {
            var layerIndex = nbLayers - 1;
            var layerID = this.layers[layerIndex].ID;
            if (this.attributionHandler != null)
                this.attributionHandler.removeAttribution(
                    this.layers[layerIndex]
                );
            this.removeLayer(layerID);
            nbLayers--;
        }
    };

    /**
     * @function addDraw
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.addDraw = function(layer) {
        Utils.assert(
            layer.type === Constants.LAYER.Vector,
            "layer must be a vector layer in addDraw",
            "AbstractContext.js"
        );
        layer.setDraw(true);
        this._getGlobe().addLayer(layer);
    };

    /**
     * @function removeDraw
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.removeDraw = function(layer) {
        this._getGlobe().removeLayer(layer);
    };

    /**
     * @function refresh
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.refresh = function() {
        if (this._getGlobe()) {
            this._getGlobe().refresh();
        }
    };

    /**************************************************************************************************************/

    /**
     * Initialization of the canvas element.
     * When no canvas element is provided, sets to full screen.
     * @function initCanvas
     * @memberof AbstractContext#
     * @param {Object} canvas Canvas object
     * @param {?Object} canvas.parentElement HTML object
     */
    AbstractContext.prototype.initCanvas = function(canvas) {
        var width, height;
        var parentCanvas = $(canvas.parentElement);

        $(canvas.parentElement)
            .find("#loading")
            .show();

        if ($(canvas).attr("width")) {
            width = $(canvas).attr("width");
        } else if (parentCanvas.attr("width")) {
            width = parentCanvas.attr("width");
        } else {
            //full screen
            width = window.innerWidth;
        }

        if ($(canvas).attr("height")) {
            height = $(canvas).attr("height");
        } else if (parentCanvas.attr("height")) {
            height = parentCanvas.attr("height");
        } else {
            //full screen
            height = window.innerHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Add some useful css properties to parent element
        if (parentCanvas) {
            parentCanvas.css({
                position: "relative",
                overflow: "hidden"
            });
        }

        // Define on resize function
        var self = this;
        var onResize = function() {
            if (
                parentCanvas &&
                parentCanvas.attr("height") &&
                parentCanvas.attr("width")
            ) {
                // Embedded
                canvas.width = parentCanvas.width();
                canvas.height = parentCanvas.height();
            } else {
                // Fullscreen
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            self.refresh();
        };

        // Take into account window resize 1s after resizing stopped
        var timer;
        $(window).resize(function() {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(onResize, 500);
        });

        // Context lost listener
        canvas.addEventListener(
            "webglcontextlost",
            function(event) {
                // TODO
                event.preventDefault();
                document.getElementById("loading").style.display = "none";
                document.getElementById("webGLContextLost").style.display =
                    "block";
            },
            false
        );
    };

    /**
     * Initializes the planet or sky events.
     * @function iniGlobeEvents
     * @memberof AbstractContext#
     * @param {AbstractGlobe} globe Planet or Sky object
     */
    AbstractContext.prototype.initGlobeEvents = function(globe) {
        if (globe) {
            this.globe = globe;
            this.attributionHandler = new AttributionHandler(this.globe, {
                element:
                    this.mizarConfiguration.attributionHandler &&
                    this.mizarConfiguration.attributionHandler.element
                        ? this.mizarConfiguration.attributionHandler.element
                        : DEFAULT_ATTRIBUTION_ELT
            });

            if (this.positionTracker != null) {
                this.positionTracker.attachTo(this);
                // it will be updated by the position tracker
                this.setComponentVisibility("posTrackerInfo", false);
            }

            if (this.elevationTracker != null) {
                this.elevationTracker.attachTo(this);
            }

            if (this.compass != null) {
                this.compass.attachTo(this);
            }
        } else {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "AbstractContext.js", "Globe is null in initGlobeEvents");
        }

        _initComponentsVisibility(this.components);

        //When base layer failed to load, open error dialog
        var self = this;
        this.subscribe(Constants.EVENT_MSG.BASE_LAYERS_ERROR, function(layer) {
            $(self.canvas.parentElement)
                .find("#loading")
                .hide();
            ErrorDialog.open(
                Constants.LEVEL.ERROR,
                "Cannot add the layer " +
                    layer.getName() +
                    "from " +
                    layer.getBaseUrl(),
                layer.message
            );
        });
    };

    /**************************************************************************************************************/

    /**
     * @function isEnabled
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.isEnabled = function() {
        return this.isEnableCtx;
    };

    /**
     * @function isDisabled
     * @memberof AbstractContext#
     */

    AbstractContext.prototype.isDisabled = function() {
        return !this.isEnabled();
    };

    /**
     * @function show
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.show = function() {
        this.navigation.start();
        this.showComponents();
    };

    /**
     * @function showComponents
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.showComponents = function() {
        // Show UI components depending on its state
        for (var componentId in this.components) {
            if (_isDivExist(componentId) && this.components[componentId]) {
                $("#" + componentId).fadeIn(1000);
            }
        }
    };

    /**
     * @function hideComponents
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.hideComponents = function(uiArray) {
        // Hide all the UI components
        for (var componentId in this.components) {
            if (
                _isDivExist(componentId) &&
                $.inArray(componentId, uiArray) === -1
            ) {
                $("#" + componentId).fadeOut();
            }
        }
    };

    /**
     * @function hide
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.hide = function() {
        this.navigation.stopAnimations();
        this.navigation.stop();

        // Hide all the UI components
        for (var componentId in this.components) {
            if (_isDivExist(componentId)) {
                $("#" + componentId).fadeOut();
            }
        }
    };

    /**
     * @function setComponentVisibility
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.setComponentVisibility = function(
        componentId,
        isVisible
    ) {
        var component = $("#" + componentId);
        if (isVisible) {
            component.show();
        } else {
            component.hide();
        }

        this.components[componentId] = isVisible;
    };

    /**
     * @function getComponentVisibility
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getComponentVisibility = function(componentId) {
        return this.components[componentId];
    };

    /**************************************************************************************************************/

    /**
     * @function showAdditionalLayers
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.showAdditionalLayers = function() {
        _.each(this.visibleLayers, function(layer) {
            layer.setVisible(true);
            if (layer.isPickable()) {
                ServiceFactory.create(
                    Constants.SERVICE.PickingManager
                ).addPickableLayer(layer);
            }
        });
    };

    /**
     * @function hideAdditionalLayers
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.hideAdditionalLayers = function() {
        var self = this;
        this.visibleLayers = [];
        var gwLayers = this.getAdditionalLayers();
        _.each(gwLayers, function(layer) {
            if (layer.isVisible()) {
                layer.setVisible(false);
                self.visibleLayers.push(layer);
            }
        });
    };

    /**
     * @function setBackgroundLayer
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.setBackgroundLayer = function(survey) {
        // Find the layer by name among all the layers
        var gwLayer = this.getLayerByName(survey);
        if (gwLayer) {
            _removeRasterOverlay.call(this, gwLayer);
            this._getGlobe().setBaseImagery(gwLayer);
        } else {
            this.publish(
                Constants.EVENT_MSG.LAYER_BACKGROUND_ERROR,
                survey + " hasn't been found"
            );
        }
        return gwLayer;
    };

    /**
     * @function setBackgroundLayerByID
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.setBackgroundLayerByID = function(surveyID) {
        // Find the layer by name among all the layers
        var gwLayer = this.getLayerByID(surveyID);
        if (gwLayer) {
            _removeRasterOverlay.call(this, gwLayer);
            this._getGlobe().setBaseImagery(gwLayer);
        } else {
            this.publish(
                Constants.EVENT_MSG.LAYER_BACKGROUND_ERROR,
                surveyID + " hasn't been found"
            );
        }
        return gwLayer;
    };

    /**
     * @function getAdditionalLayers
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getAdditionalLayers = function() {
        return _.filter(this.layers, function(layer) {
            return layer.category !== "background";
        });
    };

    /**
     * @function getRenderContext
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getRenderContext = function() {
        return this._getGlobe().getRenderContext();
    };

    /**
     * @function disbable
     * @memberof AbstractContext#
     * @abstract
     */
    AbstractContext.prototype.disable = function() {
        if (this.positionTracker) {
            this.positionTracker.detach();
        }
        if (this.elevationTracker) {
            this.elevationTracker.detach();
        }
        if (this.compass) {
            this.compass.detach();
        }
        var i = 0;
        var layer = this.layers[i];
        while (layer) {
            if (this.attributionHandler != null)
                this.attributionHandler.disable(layer);
            layer = this.layers[++i];
        }
        var renderers = this.getRenderContext().renderers;
        for (var j = 0; j < renderers.length; j++) {
            if (renderers[j].getType() === this.getMode()) {
                renderers[j].disable();
            }
        }
        this.isEnableCtx = false;
    };

    /**
     * @function enable
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.enable = function() {
        if (this.positionTracker != null) this.positionTracker.attachTo(this);

        if (this.elevationTracker != null) this.elevationTracker.attachTo(this);

        if (this.compass != null) this.compass.attachTo(this);

        var i = 0;
        var layer = this.layers[i];
        while (layer) {
            if (layer.isPickable()) {
                ServiceFactory.create(
                    Constants.SERVICE.PickingManager
                ).addPickableLayer(layer);
            }
            if (this.AttributionHandler != null)
                this.attributionHandler.enable(layer);
            layer = this.layers[++i];
        }
        var renderers = this.getRenderContext().renderers;
        for (i = 0; i < renderers.length; i++) {
            if (renderers[i].getType() === this.getMode()) {
                renderers[i].enable();
            }
        }
        this.isEnableCtx = true;
    };

    /**
     * @function setCompassVisible
     * @memberof AbstractContext#
     * @abstract
     */
    AbstractContext.prototype.setCompassVisible = function(divName, visible) {
        throw new SyntaxError(
            "compass visible not implemented",
            "AbstractContext.js"
        );
    };

    /**
     * @function setTimeTravelVisible
     * @memberof AbstractContext#
     * @abstract
     */
    AbstractContext.prototype.setTimeTravelVisible = function(
        divName,
        visible
    ) {
        throw new SyntaxError(
            "time travel visible not implemented",
            "AbstractContext.js"
        );
    };

    /**
     * @function getMode
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getMode = function() {
        return this.mode;
    };

    /**
     * @function setCoordinateSystem
     * @memberof AbstractContext#
     * @abstract
     */
    AbstractContext.prototype.setCoordinateSystem = function(cs) {
        throw new SyntaxError("CRS not implemented", "AbstractContext.js");
    };

    /**
     * @function getNavigation
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getNavigation = function() {
        return this.navigation;
    };

    /**
     * @function getCoordinateSystem
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.getCoordinateSystem = function() {
        return this._getGlobe().getCoordinateSystem();
    };

    /**
     * @function addAnimation
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.addAnimation = function(anim) {
        this._getGlobe().addAnimation(anim);
    };

    /**
     * @function removeAnimation
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.removeAnimation = function(anim) {
        this._getGlobe().removeAnimation(anim);
    };

    /**
     * @function render
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.render = function() {
        this._getGlobe().render();
    };

    /**
     * @function dispose
     * @memberof AbstractContext#
     */
    AbstractContext.prototype.dispose = function() {
        this._getGlobe().dispose();
    };

    AbstractContext.prototype.trackerDestroy = function() {
        if (this.elevationTracker) {
            this.elevationTracker.destroy();
            this.elevationTracker = null;
        }
        if (this.positionTracker) {
            this.positionTracker.destroy();
            this.positionTracker = null;
        }
    };

    /**i
     * @function destroy
     * @memberof AbstractContext#
     * @abstract
     */
    AbstractContext.prototype.destroy = function() {
        this.hide();
        this.trackerDestroy();
        if (this.compass) {
            this.compass.destroy();
            this.compass = null;
        }
        this.removeAllLayers();
        this.components = null;
        this.attributionHandler = null;
        this.layers = null;
        this.visibleLayers = null;
        this.dataProviders = null;
        this.mizarConfiguration = null;
        this.ctxOptions = null;
        this.mode = null;

        this.unsubscribe(Constants.EVENT_MSG.BASE_LAYERS_READY, function(
            imagery
        ) {
            // When the background takes time to load, the viewMatrix computed by "computeViewMatrix" is created but
            // with empty values. Because of that, the globe cannot be displayed without moving the camera.
            // So we rerun "computeViewMatrix" once "baseLayersReady" is loaded to display the globe
            if (
                self.getNavigation().getRenderContext().viewMatrix[0] !==
                "undefined"
            ) {
                self.getNavigation().computeViewMatrix();
            }
        });

        if (this.navigation) {
            this.navigation.destroy();
            this.navigation = null;
        }

        if (this._getGlobe()) {
            this._getGlobe().destroy();
            this.globe = null;
        }
        this.canvas = null;
    };

    /**************************************************************************************************************/

    return AbstractContext;
});
