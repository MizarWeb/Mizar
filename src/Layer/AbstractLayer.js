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

define(["jquery", "underscore-min", "../Utils/Event", "moment", "../Time/Time", "../Utils/Utils", "../Utils/Constants", "../Utils/UtilityFactory", "xmltojson", "../Error/NetworkError"],
    function ($, _, Event, Moment, Time, Utils, Constants, UtilityFactory, XmlToJson, NetworkError) {

        const DEFAULT_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wMBQkVBRMIQtMAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAvklEQVQY012QMWpCURBFz3yfG7CIwSatpLGwsJJsQEHssr2UttapkkK0zRJEFPKLj5UYPGme8vgDt5l7uNwZKEYNdaZO1FR6VQkBT8AbMAGe1e7dTwXUB8bAFPgF9sBWPUXENbWgBTAELkCTw7bqMdR5kTQCehlogB/gE/iqcs9OVhT9I8v7EZU6UJfqh3pWa3WlvqsvakoRcVOPwCYnvQI1sM67Q0T8JYAWvAEOwDewj4jr4z0teJdf84AA/gF1uG92uhcfoAAAAABJRU5ErkJggg==";

        /**
         * AbstractLayer configuration
         * @typedef {Object} AbstractLayer.configuration
         * @property {String} [name=""] - Layer name
         * @property {String} [attribution=""] - Attribution
         * @property {String} [copyrightUrl=""] - Copyright URL
         * @property {String} [ack=""] - ack
         * @property {String} [icon=a default image] - An icon to represent the layer
         * @property {String} [description=""] - A description
         * @property {boolean} [visible=true] - A boolean flag to display the layer
         * @property {Object} [properties={}] properties
         * @property {boolean} [pickable=false] - Sets to true to make the layer pickable
         * @property {boolean} [service=[]] - List of services related to the layer
         * @property {GEOMETRY} dataType - the data type for vector layers
         * @property background
         * @property category
         * @param {Crs} coordinateSystem
         * @param {string} [format=""]
         * @param {string} [baseUrl=""]
         * @param {boolean} [deletable=""]
         * @param {Array} [color= a random color]
         * @param {float} [opacity=1.0] - An opacity value
         * @param {FeatureStyle} [style]
         * @param {Array} [services=[]}
         * @param {layerCallback} callback - A callback that transfoms data.
         */

        /**
         * This callback allows to transform FeatureCollection from a GeoJson.
         * @callback layerCallback
         * @param {data} FeatureCollection
         */

        /**
         * @name AbstractLayer
         * @class
         *   Abstract class for creating layer.
         * @augments Event
         * @param {LAYER} type - layer type
         * @param {AbstractLayer.configuration} options - Layer Configuration
         * @constructor
         * @implements {Layer}
         */
        var AbstractLayer = function (type, options) {
            Event.prototype.constructor.call(this, options);

            this.globe = null;
            this.options = options || {};
            this.ID = "URN:Mizar:Layer:" + _.uniqueId(this.constructor.name + ':');
            this.name = this.options.name != null ? this.options.name : "";
            this.attribution = this.options.attribution || "";
            this.copyrightUrl = this.options.copyrightUrl || "";
            this.ack = this.options.ack || "";
            this.description = this.options.description || "";
            this.visible = this.options.visible || false;
            this.properties = this.options.properties || {};
            this.services = this.options.services || [];
            this.type = type;
            this.pickable = this.options.pickable || false;
            this.pickable = this.options.pickable || false;
            this.dataType = this.options.dataType || "";
            this.background = options.background || false;
            this.category = (this.options.background) ? "background" : this.options.category;
            this.coordinateSystem = options.coordinateSystem;
            this.format = this.options.format || "";
            this.baseUrl = this.options.baseUrl || "";
            this.deletable = this.options.deletable || false;
            this.dimension = this.options.dimension;
            this.getCapabilitiesEnabled = false;
            this.getCapabilitiesTileManager = null;
            this.callbackContext = null;
            this.linkedTo = this.options.linkedTo || "";
            this.servicesRunningOnCollection = [];
            this.servicesRunningOnRecords = {};
            this.vectorLayer = false;
            this.metadataAPI = (this.options.metadataAPI) ? this.options.metadataAPI : null;
            this.time = null;
            // Do we take DEM into account with this layer ?
            this.pickingNoDEM = this.options.pickingNoDEM ? this.options.pickingNoDEM : false;

            // Set if we need to auto fill the time travel range/step with auto discovered time values
            this.autoFillTimeTravel = (this.options.autoFillTimeTravel) ? this.options.autoFillTimeTravel : false;

            // Create style if needed
            this.style = _createStyle.call(this, this.options, this.icon);

            // Ensure that the attribution link will be opened in new tab
            if (this.attribution && this.attribution.search('<a') >= 0 && this.attribution.search('target=') < 0) {
                this.attribution = this.attribution.replace(' ', ' target=_blank ');
            }

            //this.services = _createAvailableServices(this.options);
            this.multiLayers = [];

            //cache to know which custom (e;g time, style, ...) Raster parameters are send
            this.imageLoadedAtTime = {};

            /**
             * Used to allow/deny http request
             * @type {boolean}
             */
            this.allowedHTTPRequest = true;

        };


        function _createAvailableServices(options) {
            var availableServices;
            if (options.hasOwnProperty('availableServices')) {
                availableServices = options.availableServices;
            } else {
                availableServices = [];
            }
            return availableServices;
        }

        /**
         * Create style
         * @param options
         * @returns {*}
         * @private
         */
        function _createStyle(options) {
            var style;
            if (options.hasOwnProperty('style')) {
                // we use style from layerDescription.
                style = UtilityFactory.create(Constants.UTILITY.CreateStyle, options.style);
            } else if (options.style === "FeatureStyle") {
                // use a previous definition
                style = options.style;
            } else {
                // Update layer color
                var color = _createColor.call(this, options);

                // Layer opacity must be in range [0, 1]
                var opacity = _createOpacity.call(this, options);

                // Create a default icon if needed.
                var icon = _createIcon.call(this, options);

                // Create a default zIndex if needed
                var zIndex = _createZIndex.call(this, options);

                // create default style
                style = UtilityFactory.create(Constants.UTILITY.CreateStyle, {
                    rendererHint: "Basic",
                    opacity: opacity,
                    iconUrl: icon,
                    fillColor: color,
                    strokeColor: color,
                    zIndex: zIndex
                });
            }
            return style;
        }

        function _createZIndex(options) {
            var zIndex;
            if (options.hasOwnProperty('zIndex')) {
                zIndex = options.zIndex;
            } else {
                zIndex = Constants.DISPLAY.DEFAULT_RASTER;
            }
            return zIndex;
        }

        function _createIcon(options) {
            var icon;
            if (options.hasOwnProperty('icon')) {
                icon = options.icon;
            } else {
                icon = DEFAULT_ICON;
            }
            return icon;
        }

        /**
         * Creates opacity
         * @param options
         * @returns {*}
         * @private
         */
        function _createOpacity(options) {
            var opacity;
            if (options.hasOwnProperty('opacity')) {
                opacity = options.opacity / 100.0;
            } else {
                opacity = 1.0;
            }
            return opacity;
        }

        /**
         * Creates color.
         * @param options
         * @returns {*}
         * @private
         */
        function _createColor(options) {
            var color;
            if (options.hasOwnProperty('color')) {
                color = (options.color instanceof Array) ? options.color : UtilityFactory.create(Constants.UTILITY.FeatureStyle).fromStringToColor(options.color);
            }
            else {
                // Generate random color
                var rgb = Utils.generateColor();
                color = rgb.concat([1]);
            }
            return color;
        }


        /**************************************************************************************************************/

        Utils.inherits(Event, AbstractLayer);

        /**************************************************************************************************************/

        /**
         * Tests if the layer must be refreshed.
         * @param {string} param parameter
         * @param value value
         * @return {boolean} True when the layer must be refreshed otherwise False
         * @private
         */
        AbstractLayer.prototype._hasToBeRefreshed = function (param, value) {
            var mustBeRefreshed = false;
            if (param === "time" && this.containsDimension(param)) {
                var time = Time.parse(value);
                var isInTimeDimension = time.isInTimeDefinition(this.getDimensions().time.value);
                value = isInTimeDimension ? time.getDisplayValue() : null;
                this.allowedHTTPRequest = (value !== null);
            } else if(param === "time") {
                mustBeRefreshed = false;
                return mustBeRefreshed;
            }
            if (this.imageLoadedAtTime[param] === undefined) {
                // this a new parameter, then we refresh
                mustBeRefreshed = true;
                this.imageLoadedAtTime[param] = value;
            } else if (this.imageLoadedAtTime[param] === value) {
                mustBeRefreshed = false;
            } else {
                mustBeRefreshed = true;
                this.imageLoadedAtTime[param] = value;
            }
            return mustBeRefreshed;
        };

        AbstractLayer.prototype.hasDimension = function () {
            return this.dimension != null;
        };

        AbstractLayer.prototype.getDimensions = function () {
            return this.dimension == null ? {} : this.dimension;
        };

        AbstractLayer.prototype.containsDimension = function (variable) {
            return this.hasDimension() && this.dimension[variable] != null;
        };

        /**
         * return short name
         * @function getShortName
         * @memberOf AbstractLayer#
         * @return {String} Short name
         */
        AbstractLayer.prototype.getShortName = function () {
            var shortName = Utils.formatId(this.name);
            if (typeof shortName === 'string') {
                shortName = shortName.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
            }

            return shortName;
        };

        /**************************************************************************************************************/

        /**
         * @function hasServicesRunningOnCollection
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.hasServicesRunningOnCollection = function () {
            return this.servicesRunningOnCollection.length > 0;
        };

        /**************************************************************************************************************/

        /**
         * @function postProcessDateTime
         * @memberOf AbstractLayer#
         */
        /*        AbstractLayer.prototype.postProcessTime = function (time) {
         return time;
         };
         */
        /**************************************************************************************************************/

        /**
         * @function setDateTime
         * @memberOf AbstractLayer#
         * @param time Json object
         *  {
         *     "date" : current date,
         *     "display" : current date as text for display
         *     "period" : {
         *          "from" : ,
         *          "to" : }
         *  }
         */
        AbstractLayer.prototype.setTime = function (time) {
            this.time = time;
        };

        /**************************************************************************************************************/

        /**
         * @function forceRefresh
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.forceRefresh = function () {
            var tileManager = this.getGlobe().getTileManager();
            tileManager.updateVisibleTiles(this);
            this.getGlobe().refresh();
        };

        /**
         * @function getServicesRunningOnCollection
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getServicesRunningOnCollection = function () {
            var layers = [];
            for (var layerIndex in this.servicesRunningOnCollection) {
                var layerID = this.servicesRunningOnCollection[layerIndex];
                var layer = this.callbackContext.getLayerByID(layerID);
                if (layer != null) {
                    layers.push(layer);
                }
            }
            return layers;
        };

        /**
         * @function removeServicesRunningOnCollection
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.removeServicesRunningOnCollection = function () {
            for (var layerIndex in this.servicesRunningOnCollection) {
                var layerID = this.servicesRunningOnCollection[layerIndex];
                this.callbackContext.removeLayer(layerID);
            }
            return this.servicesRunningOnCollection.length === 0;
        };

        /**
         * @function hasServicesRunningOnRecords
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.hasServicesRunningOnRecords = function () {
            return Object.keys(this.servicesRunningOnRecords).length > 0;
        };

        /**
         * @function getServicesRunningOnRecords
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getServicesRunningOnRecords = function () {
            var layers = [];
            for (var featureIndex in this.servicesRunningOnRecords) {
                var featureID = this.servicesRunningOnRecords[featureIndex];
                layers = layers.concat(this.getServicesRunningOnRecord(featureID));
            }
            return layers;
        };

        /**
         * @function removeServicesRunningOnRecords
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.removeServicesRunningOnRecords = function () {
            for (var featureID in this.servicesRunningOnRecords) {
                this.removeServicesRunningOnRecord(featureID);
            }
            return Object.keys(this.servicesRunningOnRecords).length === 0;
        };

        /**
         * @function hasServicesRunningOnRecord
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.hasServicesRunningOnRecord = function (featureID) {
            return this.servicesRunningOnRecords.hasOwnProperty(featureID);
        };

        /**
         * @function getServicesRunningOnRecord
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getServicesRunningOnRecord = function (featureID) {
            var layers = [];
            if (this.hasServicesRunningOnRecord(featureID)) {
                var servicesForFeatureID = this.servicesRunningOnRecords[featureID];
                for (var layerIndex in servicesForFeatureID.layerIds) {
                    var layerID = servicesForFeatureID[layerIndex];
                    var layer = this.callbackContext.getLayerByID(layerID);
                    if (layer != null) {
                        layers.push(layer);
                    }
                }
            } else {
                // do nothing
            }
            return layers;
        };

        /**
         * @function addServicesRunningOnRecord
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.addServicesRunningOnRecord = function (featureID, layerIDs) {
            var isAdded;
            if (featureID != null && layerIDs != null && !this.hasServicesRunningOnRecord(featureID)) {
                var layersIDArray = Array.isArray(layerIDs) ? layerIDs : [layerIDs];
                this.servicesRunningOnRecords[featureID] = {
                    "layerIds": layersIDArray
                };
                isAdded = true;
            } else {
                isAdded = false;
            }
            return isAdded;
        };

        /**
         * @function removeServicesRunningOnRecord
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.removeServicesRunningOnRecord = function (featureID) {
            var isRemoved;
            if (this.hasServicesRunningOnRecord(featureID)) {
                var servicesForFeatureID = this.servicesRunningOnRecords[featureID];
                for (var layerIndex in servicesForFeatureID.layerIds) {
                    var layerID = servicesForFeatureID.layerIds[layerIndex];
                    this.callbackContext.removeLayer(layerID);
                }
                delete this.servicesRunningOnRecords[featureID];
                isRemoved = true;
            } else {
                isRemoved = false;
            }
            return isRemoved;
        };

        /**
         * @function addServicesRunningOnCollection
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.addServicesRunningOnCollection = function (layerIDs) {
            var isAdded;
            if (layerIDs != null) {
                var layersIDArray = Array.isArray(layerIDs) ? layerIDs : [layerIDs];
                this.servicesRunningOnCollection = this.servicesRunningOnCollection.concat(layersIDArray);
                isAdded = true;
            } else {
                isAdded = false;
            }
            return isAdded;
        };


        /**************************************************************************************************************/

        /**
         * Get getCapabilities url
         * @function getGetCapabilitiesUrl
         * @memberOf AbstractLayer#
         * @return {String} url
         */
        AbstractLayer.prototype.getGetCapabilitiesUrl = function () {
            return this.proxify(this.getCapabilitiesUrl);
        };


        /**************************************************************************************************************/

        /**
         * Load the getCapabilities into json variable
         * @function loadGetCapabilities
         * @memberOf AbstractLayer
         * @param {function} callback Callback function
         * @param {String} paramUrl url (if ommited, reconstructed with getCapabilitiesUrl)
         * @param {Object} sourceObject source object
         * @return {JSON} data loaded
         */
        AbstractLayer.prototype.loadGetCapabilities = function (callback, paramUrl, sourceObject) {
            var url;
            var urlRaw;
            if (typeof paramUrl === 'undefined') {
                url = this.getGetCapabilitiesUrl();
                urlRaw = this.getCapabilitiesUrl;
            } else {
                url = this.proxify(paramUrl);
                urlRaw = paramUrl;
            }
            this.getCapabilitiesEnabled = true;
            $.ajax({
                type: "GET",
                url: url,
                dataType: 'text',
                async: false,
                success: function (response) {
                    var myOptions = {
                        mergeCDATA: true,
                        xmlns: false,
                        attrsAsObject: false,
                        childrenAsArray: false
                    };
                    var result = XmlToJson.parseString(response, myOptions);
                    callback(result, sourceObject);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    throw new NetworkError(thrownError.message, "AbstractLayer.js", thrownError.code);
                }
            });
        };

        /**************************************************************************************************************/


        /**
         * Proxify an url
         * @function proxify
         * @memberOf AbstractLayer#
         * @param {String} url - URL
         * @return {String} Url proxified
         */
        AbstractLayer.prototype.proxify = function (url) {
            return Utils.proxify(url, this.options.proxy);
        };

        /**
         * @function getMetadataAPI
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getMetadataAPI = function () {
            return this.metadataAPI;
        };

        /**
         * @function getGlobe
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getGlobe = function () {
            return this.globe;
        };


        /**
         * @function getID
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getID = function () {
            return this.ID;
        };


        /**
         * @function getName
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getName = function () {
            return this.name;
        };

        /**
         * @function getAttribution
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getAttribution = function () {
            return this.attribution;
        };

        /**
         * @function getCopyrightUrl
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getCopyrightUrl = function () {
            return this.copyrightUrl;
        };

        /**
         * @function getAck
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getAck = function () {
            return this.ack;
        };

        /**
         * @function getDescription
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getDescription = function () {
            return this.description;
        };

        /**
         * @function isVisible
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.isVisible = function () {
            return this.visible;
        };


        /**
         * @function setOnTheTop
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.setOnTheTop = function () {
            var manager = this.getGlobe().getVectorRendererManager();
            manager.setSelectedRasterBucket(this);
        };

        /**
         * @function setVisible
         * @memberOf AbstractLayer#
         * @throws {TypeError} - The parameter of setVisible should be a boolean
         */
        AbstractLayer.prototype.setVisible = function (arg) {
            if (typeof arg === "boolean") {
                if (this.visible !== arg && this.getGlobe().attributionHandler) {
                    this.getGlobe().attributionHandler.toggleAttribution(this);
                }
                this.visible = arg;

                if (!this.isBackground() && this.visible) {
                    this.setOnTheTop();
                }

                var ctxTime = this.callbackContext.getTime();
                if (ctxTime !== this.time) {
                    this.setTime(ctxTime);
                }

                // Manage autoFillTimeTravel
                if (this.autoFillTimeTravel === true) {
                    if (this.visible === true) {
                        //add !
                        if (this.callbackContext.timeTravelService) {
                            this.callbackContext.timeTravelService.update(this.timeTravelValues);
                        }
                    } else {
                        // Remove
                        if (this.callbackContext.timeTravelService) {
                            this.callbackContext.timeTravelService.update({
                                "remove": {"ID": this.ID}
                            });
                        }
                    }
                }

                this.getGlobe().getRenderContext().requestFrame();
                this.publish(Constants.EVENT_MSG.LAYER_VISIBILITY_CHANGED, this);
            } else {
                throw new TypeError("the parameter of visible should be a boolean", "AbstractLayer.js");
            }
        };

        /**
         * @function getOpacity
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getOpacity = function () {
            return this.getStyle().getOpacity();
        };

        /**
         * @function setOpacity
         * @memberOf AbstractLayer#
         * @throws {RangeError} opacity - opacity value should be a value in [0..1]
         */
        AbstractLayer.prototype.setOpacity = function (arg) {
            var style = this.getStyle();
            style.setOpacity(arg);
            this.getGlobe().getRenderContext().requestFrame();
            this.publish(Constants.EVENT_MSG.LAYER_OPACITY_CHANGED, this);
        };

        /**
         * @function getProperties
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getProperties = function () {
            return this.properties;
        };

        /**
         * @function getType
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getType = function () {
            return this.type;
        };

        /**
         * @function isPickable
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.isPickable = function () {
            return this.pickable;
        };

        /**
         * @function isType
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.isType = function (type) {
            return this.type === type;
        };

        /**
         * @function getServices
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getServices = function () {
            return this.services;
        };

        /**
         * @function getCoordinateSystem
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getCoordinateSystem = function () {
            return this.coordinateSystem;
        };

        /**
         * @function _attach
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype._attach = function (g) {
            this.globe = g;
            if (this.attribution && this.globe.attributionHandler && this.isVisible()) {
                this.globe.attributionHandler.addAttribution(this);
            }
        };

        /**
         * @function _detach
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype._detach = function () {
            if (this.attribution && this.globe.attributionHandler) {
                this.globe.attributionHandler.removeAttribution(this);
            }
            this.globe = null;
        };

        /**
         * @function getBaseUrl
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getBaseUrl = function () {
            return this.baseUrl;
        };

        /**
         * @function getDataType
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getDataType = function () {
            return this.dataType;
        };

        /**
         * @function getFormat
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getFormat = function () {
            return this.format;
        };

        /**
         * @function isDeletable
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.isDeletable = function () {
            return this.deletable;
        };

        /**
         * @function getStyle
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getStyle = function () {
            return this.style;
        };

        /**
         * Sets the vector layer style.
         * @function setStyle
         * @memberOf AbstractLayer#
         * @param {FeatureStyle} arg Feature style
         */
        AbstractLayer.prototype.setStyle = function (arg) {
            this.style = arg;
        };

        /**
         * @function isBackground
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.isBackground = function () {
            return this.background;
        };

        /**
         * @function isVectorLayer
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.isVectorLayer = function () {
            return this.vectorLayer;
        };

        /**
         * Decrypt time range to generate time travel informations
         * @function generateTimeTravel
         * @param {String} timeDetails Details of time range
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.generateTimeTravel = function (timeDetails) {
            if (timeDetails) {
                // In a general case, timeDetails.value could have this shape:
                //  val1,val2,min1/max1/step1,val3,min2/max2/step2
                var timesDefinition = timeDetails.value.split(",");
                var distinctValues = []; // records the distinct values : val1,val2,val3
                var sampleValues = []; // records the samples values : min1/max1/step1,min2/max2/step2
                var timeDefinition;

                // We need to iter because it is possible that we have a mix of distinct values and sample values
                for (var i=0;i<timesDefinition.length;i++) {
                    timeDefinition = timesDefinition[i].trim();
                    if(Time.isDistinctValue(timeDefinition)) {
                        distinctValues.push(timeDefinition);
                    } else if(Time.isSampling(timeDefinition)) {
                        sampleValues.push(timeDefinition);
                    } else {
                        console.log("This should be refactored if we handle an interval min/max at the server level")
                    }
                }
                // Add distinct values in time travel
                if (distinctValues.length > 0) {
                    this.timeTravelValues = {
                        "add": {
                            "enumeratedValues": distinctValues,
                            "ID": this.ID
                        }
                    };
                }
                
                // Add sample values in time travel
                if(sampleValues.length > 0) {
                    var start,end, step, tmpArray, sampleDefinition;
                    for (i=0; i<sampleValues.length; i++) {
                        sampleDefinition = sampleValues[i];
                        tmpArray = sampleDefinition.split("/");
                        start = Moment(tmpArray[0]);
                        end = Moment(tmpArray[1]);
                        step = Time.timeResolution(tmpArray[2]);
                        this.timeTravelValues = {
                            "add": {
                                "start": start,
                                "end": end,
                                "stepKind": step.unit,
                                "stepValue": step.step,
                                "ID": this.ID
                            }
                        };
                    }
                }
            }
        };

        return AbstractLayer;

    });
