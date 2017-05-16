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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
define(["jquery", "underscore-min", "../Utils/Event", "../Utils/Utils", "../Layer/LayerFactory","../Services/ServiceFactory", "../Utils/Constants",
        "../Gui/Tracker/PositionTracker", "../Gui/Tracker/ElevationTracker", "../Utils/AttributionHandler",
        "../Renderer/PointRenderer", "../Renderer/LineStringRenderable", "../Renderer/PolygonRenderer", "../Renderer/LineRenderer",
        "../Renderer/PointSpriteRenderer", "../Renderer/ConvexPolygonRenderer"],
    function ($, _, Event, Utils, LayerFactory, ServiceFactory, Constants,
              PositionTracker, ElevationTracker, AttributionHandler) {

        //TODO : attention de bien garder les ...Renderer dans le define

        /**
         * @name AbstractContext
         * @class
         * The active context object can normally be obtained from the {@link module:Context.ContextManager ContextManager}
         * class of the Mizar instance.<br/>
         * A context is the main webGL object that contains its own coordinate reference system,
         * its own data, its own navigation and its own GUI.<br/>
         * Client implementations should not normally instantiate this class directly.
         * @param {Object} mizarConfiguration see options.configuration for {@link Mizar}
         * @param {CONTEXT} mode - the type of context
         * @param {Object} ctxOptions  -See options.planetContext or options.skyContext configuration for {@link Mizar}
         * @constructor
         * @implements {Context}
         * @listens Context#baseLayersReady
         */
        var AbstractContext = function (mizarConfiguration, mode, ctxOptions) {
            Event.prototype.constructor.call(this);
            var self = this;
            this.globe = null;	// Sky or globe
            this.navigation = null;
            this.components = {};
            this.dataProviders = {};
            this.canvas = mizarConfiguration.canvas;
            this.subscribe("baseLayersReady", function (imagery) {
                $(self.canvas.parentElement).find('#loading').hide();
            });
            this.mizarConfiguration = mizarConfiguration.hasOwnProperty('configuration') ? mizarConfiguration.configuration : {};
            this.credits = true;
            this.ctxOptions = ctxOptions;
            this.mode = mode;
            this.layers = [];

            this.initCanvas(this.canvas);
            this.positionTracker = _createTrackerPosition.call(this, this.mizarConfiguration);
            this.elevationTracker = _createTrackerElevation.call(this, this.mizarConfiguration, ctxOptions);
        };

        /**
         * Creates tracker position
         * @param mizarConfiguration
         * @returns {PositionTracker}
         * @private
         */
        function _createTrackerPosition(mizarConfiguration) {
            return new PositionTracker({
                element: (mizarConfiguration.positionTracker && mizarConfiguration.positionTracker.element) ? mizarConfiguration.positionTracker.element : "posTracker",
                isMobile: mizarConfiguration.isMobile ? true : false,
                position: (mizarConfiguration.positionTracker && mizarConfiguration.positionTracker.position) ? mizarConfiguration.positionTracker.position : "bottom"
            });
        }

        /**
         * Creates elevation tracker
         * @param mizarConfiguration
         * @param ctxOptions
         * @returns {ElevationTracker}
         * @private
         */
        function _createTrackerElevation(mizarConfiguration, ctxOptions) {
            return new ElevationTracker({
                element: (mizarConfiguration.elevationTracker && mizarConfiguration.elevationTracker.element) ? mizarConfiguration.elevationTracker.element : "elevTracker",
                isMobile: mizarConfiguration.isMobile ? true : false,
                position: (mizarConfiguration.elevationTracker && mizarConfiguration.elevationTracker.elevation) ? mizarConfiguration.elevationTracker.position : "bottom",
                elevationLayer: (ctxOptions.planetLayer !== undefined) ? ctxOptions.planetLayer.elevationLayer : undefined
            });
        }

        /**
         * Adds to the globe either as background or as additional layer
         * @param layer
         * @private
         */
        function _addToGlobe(layer) {
            if (layer.category === "background" && layer.isVisible()) {
                this.globe.setBaseImagery(layer);
            } else {
                this.globe.addLayer(layer);
            }
        }

        /**
         * Fill data-provider-type layer by features coming from data object
         * @param {Layer} layer
         * @param mizarDescription
         * @private
         */
        function _fillDataProvider(layer, mizarDescription) {
            if (mizarDescription.data && this.dataProviders[mizarDescription.data.type]) {
                var callback = this.dataProviders[mizarDescription.data.type];
                callback(layer, mizarDescription.data);
            }
        }

        /**
         * Zoom to when the visibility is changed.
         * @param layer
         * @private
         */
        function onVisibilityChange(layer) {

            if (layer.isVisible() && layer.properties && !layer.background
                && layer.properties.hasOwnProperty("initialRa") && layer.properties.hasOwnProperty("initialDec") && layer.properties.hasOwnProperty("initialFov")) {

                if (self.getMode() === Constants.GLOBE.Sky) {
                    var fov = self.getNavigation().getRenderContext().fov;
                    self.getNavigation().zoomTo([layer.properties.initialRa, layer.properties.initialDec], {fov:fov, duration:3000});
                }
                else {
                    self.getNavigation().zoomTo([layer.properties.initialRa, layer.properties.initialDec], {distance : layer.properties.initialFov, duration : 3000});
                }
            }
        }


        /**************************************************************************************************************/
        Utils.inherits(Event, AbstractContext);
        /**************************************************************************************************************/

        /**
         * ShowUp message.<br/>
         * Do not display the canvas with the ID <i>MizarCanvas</i> and the loading icon and displays
         * the HTML element with the ID <i>webGLNotAvailable</i>
         * @param err
         * @protected
         * @todo Mettre en paramètre MizarCanvas et webGLNotAvailable
         */
        AbstractContext.prototype._showUpError = function(err) {
            console.error("Globe creation error : ", err);
            if (document.getElementById('MizarCanvas')) {
                document.getElementById('MizarCanvas').style.display = "none";
            }
            if (document.getElementById('loading')) {
                document.getElementById('loading').style.display = "none";
            }
            if (document.getElementById('webGLNotAvailable')) {
                document.getElementById('webGLNotAvailable').style.display = "block";
            }
        };
        
        /**
         * Registers no standard data provider and call them in the addLayer method.
         * @function registerNoStandardDataProvider
         * @param {string} type - data provider key
         * @param {Function} loadFunc - Function
         * @memberOf LayerManager#
         * @example <caption>Registers planets on the sky</caption>
         *   var planetProvider = ProviderFactory.create(Constants.PROVIDER.Planet);
         *   this.registerNoStandardDataProvider("planets", planetProvider.loadFiles);
         */
        AbstractContext.prototype.registerNoStandardDataProvider = function (type, loadFunc) {
            this.dataProviders[type.toString()] = loadFunc;
        };

        /**
         * @function getContextConfiguration
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getContextConfiguration = function () {
            return this.ctxOptions;
        };

        /**
         * @function getMizarConfiguration
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getMizarConfiguration = function () {
            return this.mizarConfiguration;
        };

        /**
         * @function getLonLatFromPixel
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getLonLatFromPixel = function (x, y) {
            return this.globe.getLonLatFromPixel(x, y);
        };

        /**
         * @function getElevation
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getElevation = function (lon, lat) {
            return this.globe.getElevation(lon, lat);
        };

        /**
         * @function getPositionTracker
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getPositionTracker = function () {
            return this.positionTracker;
        };

        /**
         * @function getElevationTracker
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getElevationTracker = function () {
            return this.elevationTracker;
        };

        /**
         * @function getLayers
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getLayers = function () {
            return this.layers;
        };

        /**
         * @function getLayerByID
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getLayerByID = function (layerId) {
            return _.find(_.union(this.getLayers()), function (layer) {
                return (layer.ID === layerId);
            });
        };

        /**
         * @function getLayerByName
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getLayerByName = function (layerName) {
            return _.findWhere(this.getLayers(), {name: layerName});
        };


        /**
         * @function addLayer
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.addLayer = function (mizarLayer, layerPlanet) {
            var layer = LayerFactory.create(mizarLayer);
            if (layerPlanet) {
                layerPlanet.layers.push(layer);
            } else if (layer.type === 'Planet') {
                this.layers.push(layer);
            } else {
                this.layers.push(layer);
                _addToGlobe.call(this, layer);
            }

            _fillDataProvider.call(this, layer, mizarLayer);

            if (layer.pickable) {
                ServiceFactory.create(Constants.SERVICE.PickingManager).addPickableLayer(layer);
            }
            layer.subscribe("visibility:changed", onVisibilityChange);
            var layerEvent = (layer.category === "background") ? "backgroundLayer:add" : "additionalLayer:add";
            this.publish(layerEvent, layer);
            return layer;
        };

        /**
         * @function removeLayer
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.removeLayer = function (layerID) {
            var removedLayer = null;
            var indexes = $.map(this.layers, function (obj, index) {
                if (obj.ID === layerID) {
                    return index;
                }
            });
            if (indexes.length > 0) {
                var removedLayers = this.layers.splice(indexes[0], 1);
                removedLayer = removedLayers[0];
                removedLayer.unsubscribe("visibility:changed", onVisibilityChange);
                ServiceFactory.create(Constants.SERVICE.PickingManager).removePickableLayer(removedLayer);
                removedLayer._detach();

            }
            return removedLayer;
        };

        /**
         * Initializes the touch navigation handler.
         * @param {Object} options to add touch navigation
         * @param {Navigation} options.navigation Navigation object
         * @function initTouchNavigation
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.initTouchNavigation = function (options) {
            options.navigation.touch = {
                inversed: this.globe.isSky(),
                zoomOnDblClick: true
            };

            var self = this;
            window.addEventListener("orientationchange", function () {
                self.refresh();
            }, false);
        };

        /**
         * @function refresh
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.refresh = function () {
            this.globe.refresh();
        };

        /**************************************************************************************************************/

        /**
         * Initialization of the canvas element.
         * When no canvas element is provided, sets to full screen.
         * @function initCanvas
         * @memberOf AbstractContext#
         * @param {Object} canvas Canvas object
         * @param {?Object} canvas.parentElement HTML object
         */
        AbstractContext.prototype.initCanvas = function (canvas) {
            var width, height;
            var parentCanvas = $(canvas.parentElement);
            $(canvas.parentElement).find('#loading').show();

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

            var self = this;

            // Define on resize function
            var onResize = function () {
                if (parentCanvas && parentCanvas.attr("height") && parentCanvas.attr("width")) {
                    // Embedded
                    canvas.width = parentCanvas.width();
                    canvas.height = parentCanvas.height();
                }
                else {
                    // Fullscreen
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }
                self.refresh();
            };

            // Take into account window resize 1s after resizing stopped
            var timer;
            $(window).resize(function () {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(onResize, 500);
            });

            // Context lost listener
            canvas.addEventListener("webglcontextlost", function (event) {
                // TODO
                event.preventDefault();
                document.getElementById('loading').style.display = "none";
                document.getElementById('webGLContextLost').style.display = "block";
            }, false);
        };

        /**
         * Initializes the planet or sky events.
         * @function iniGlobeEvents
         * @memberOf AbstractContext#
         * @param {AbstractGlobe} globe Planet or Sky object
         */
        AbstractContext.prototype.initGlobeEvents = function (globe) {
            if (globe) {
                this.globe = globe;
                new AttributionHandler(
                    this.globe,
                    {
                        element: (this.mizarConfiguration.attributionHandler &&  this.mizarConfiguration.attributionHandler.element)
                                ? this.mizarConfiguration.attributionHandler.element : 'globeAttributions'
                    }
                );
                if (this.mizarConfiguration.isMobile) {
                    this.initTouchNavigation(options);
                }
                this.positionTracker.attachTo(this.globe);
                this.elevationTracker.attachTo(this.globe);
            }
            var self = this;
            //When base layer failed to load, open error dialog
            this.subscribe("baseLayersError", function (layer) {
                $(self.canvas.parentElement).find('#loading').hide();
                console.log("error");
            });
        };


        /**************************************************************************************************************/

        /**
         * @function show
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.show = function () {
            this.navigation.start();

            // Show UI components depending on its state
            for (var componentId in this.components) {
                if( this.components.hasOwnProperty(componentId) && this.components[componentId]) {
                    $("#" + componentId).fadeIn(1000);
                }
            }
        };

        /**
         * @function showComponents
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.showComponents = function () {
            // Show UI components depending on its state
            for (var componentId in this.components) {
                if( this.components.hasOwnProperty(componentId) && this.components[componentId]) {
                    $("#" + componentId).fadeIn(1000);
                }
            }
        };

        /**
         * @function hideComponents
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.hideComponents = function (uiArray) {
            // Hide all the UI components
            for (var componentId in this.components) {
                if( this.components.hasOwnProperty(componentId) && $.inArray(componentId , uiArray) === -1 ){
                    $("#" + componentId).fadeOut();
                }
            }
        };

        /**
         * @function hide
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.hide = function () {
            this.navigation.stopAnimations();
            this.navigation.stop();

            // Hide all the UI components
            for (var componentId in this.components) {
                if (this.components.hasOwnProperty(componentId)) {
                    $("#" + componentId).fadeOut();
                }
            }
        };

        /**
         * @function setComponentVisibility
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.setComponentVisibility = function (componentId, isVisible) {
            var component = $("#" + componentId);
            if (isVisible) {
                component.show();
            }
            else {
                component.hide();
            }

            this.components[componentId] = isVisible;
        };

        /**************************************************************************************************************/

        /**
         * @function showAdditionalLayers
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.showAdditionalLayers = function () {
            _.each(this.visibleLayers, function (layer) {
                layer.setVisible(true);
            });
        };


        /**
         * @function hideAdditionalLayers
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.hideAdditionalLayers = function () {
            this.visibleLayers = [];
            var gwLayers = this.getAdditionalLayers();
            var self = this;
            _.each(gwLayers, function (layer) {
                if (layer.isVisible()) {
                    layer.setVisible(false);
                    self.visibleLayers.push(layer);
                }

            });
        };

        /**
         * @function setBackgroundLayer
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.setBackgroundLayer = function (survey) {
            //var globe = this.globe;

            // Find the layer by name among all the layers
            var gwLayer = this.getLayerByName(survey);
            if (gwLayer) {
                // Check if is not already set
                //if (gwLayer !== globe.baseImagery) {
                // Change visibility's of previous layer, because visibility is used to know the active background layer in the layers list (layers can be shared)
                //if (globe.baseImagery) {
                //    globe.baseImagery.setVisible(false);
                //}
                this.globe.setBaseImagery(gwLayer);
                this.publish("backgroundLayer:change", gwLayer);
                //gwLayer.setVisible(true);

                // // Clear selection
                // PickingManagerCore.getSelection().length = 0;
                //
                // for (var i = 0; i < gwLayers.length; i++) {
                //     var currentLayer = gwLayers[i];
                //     if (currentLayer.subLayers) {
                //         var len = currentLayer.subLayers.length;
                //         for (var j = 0; j < len; j++) {
                //             var subLayer = currentLayer.subLayers[j];
                //             if (subLayer.name === "SolarObjectsSublayer") {
                //                 PickingManagerCore.removePickableLayer(subLayer);
                //                 globe.removeLayer(subLayer);
                //                 currentLayer.subLayers.splice(j, 1);
                //             }
                //         }
                //     }
                // }

                //}
            } else {
                this.publish("backgroundSurveyError", "Survey " + layerName + " hasn't been found");
            }
            return gwLayer;
        };

        /**
         * @function setBackgroundLayerByID
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.setBackgroundLayerByID = function (surveyID) {
            // Find the layer by name among all the layers
            var gwLayer = this.getLayerByID(surveyID);
            if (gwLayer) {
                this.globe.setBaseImagery(gwLayer);
            }
            return gwLayer;
        };

        /**
         * @function getAdditionalLayers
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getAdditionalLayers = function () {
            return _.filter(this.layers, function (layer) {
                return layer.category !== "background";
            });
        };

        /**
         * @function getRenderContext
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getRenderContext = function () {
            return this.globe.getRenderContext();
        };

        /**
         * @function disbable
         * @memberOf AbstractContext#
         * @abstract
         */
        AbstractContext.prototype.disable = function () {
            var renderers = this.getRenderContext().renderers;
            for (var i = 0; i < renderers.length; i++) {
                if (renderers[i].getType() === this.getMode()) {
                    renderers[i].disable();
                }
            }
        };

        /**
         * @function enable
         * @memberOf AbstractContext#
         * @abstract
         */
        AbstractContext.prototype.enable = function () {
            var renderers = this.getRenderContext().renderers;
            for (var i = 0; i < renderers.length; i++) {
                if (renderers[i].getType() === this.getMode()) {
                    renderers[i].enable();
                }
            }
        };

        /**
         * @function setCompassVisible
         * @memberOf AbstractContext#
         * @abstract
         */
        AbstractContext.prototype.setCompassVisible = function (divName, visible) {
            throw "compass visible not implemented";
        };


        /**
         * @function getMode
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getMode = function () {
            return this.mode;
        };

        /**
         * @function setCoordinateSystem
         * @memberOf AbstractContext#
         * @abstract
         */
        AbstractContext.prototype.setCoordinateSystem = function (cs) {
            throw "CRS not implemented";
        };

        /**
         * @function getNavigation
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getNavigation = function () {
            return this.navigation;
        };

        /**
         * @function getCoordinateSystem
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.getCoordinateSystem = function () {
            return this.globe.getCoordinateSystem();
        };

        /**
         * @function addAnimation
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.addAnimation = function (anim) {
            this.globe.addAnimation(anim);
        };

        /**
         * @function removeAnimation
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.removeAnimation = function (anim) {
            this.globe.removeAnimation(anim);
        };

        /**
         * @function render
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.render = function () {
            this.globe.render();
        };

        /**
         * @function dispose
         * @memberOf AbstractContext#
         */
        AbstractContext.prototype.dispose = function () {
            this.globe.dispose();
        };

        /**
         * @function destroy
         * @memberOf AbstractContext#
         * @abstract
         */
        AbstractContext.prototype.destroy = function () {
            throw "destroy Not implemented";
        };

        /**************************************************************************************************************/

        return AbstractContext;

    }
);
