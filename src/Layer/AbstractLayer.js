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
    "jquery",
    "underscore-min",
    "../Utils/Event",
    "moment",
    "../Time/Time",
    "../Utils/Utils",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog",
    "../Utils/UtilityFactory",
    "xmltojson",
    "../Error/NetworkError",
    "../Utils/Proxy"
], function(
    $,
    _,
    Event,
    Moment,
    Time,
    Utils,
    Constants,
    ErrorDialog,
    UtilityFactory,
    XmlToJson,
    NetworkError,
    Proxy
) {
    const DEFAULT_ICON =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wMBQkVBRMIQtMAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAvklEQVQY012QMWpCURBFz3yfG7CIwSatpLGwsJJsQEHssr2UttapkkK0zRJEFPKLj5UYPGme8vgDt5l7uNwZKEYNdaZO1FR6VQkBT8AbMAGe1e7dTwXUB8bAFPgF9sBWPUXENbWgBTAELkCTw7bqMdR5kTQCehlogB/gE/iqcs9OVhT9I8v7EZU6UJfqh3pWa3WlvqsvakoRcVOPwCYnvQI1sM67Q0T8JYAWvAEOwDewj4jr4z0teJdf84AA/gF1uG92uhcfoAAAAABJRU5ErkJggg==";

    /**
     * AbstractLayer configuration
     * @typedef {Object} AbstractLayer.configuration
     * @property {string} [name=""] - Layer name
     * @property {string} [attribution=""] - Attribution
     * @property {string} [copyrightUrl=""] - Copyright URL
     * @property {string} [ack=""] - ack
     * @property {string} [icon=a default image] - An icon to represent the layer
     * @property {string} [description=""] - A description
     * @property {boolean} [visible=true] - A boolean flag to display the layer
     * @property {Object} [properties={}] properties
     * @property {boolean} [pickable=false] - Sets to true to make the layer pickable
     * @property {boolean} [service=[]] - List of services related to the layer
     * @property {GEOMETRY} dataType - the data type for vector layers
     * @property {boolean} [background = false] -Set to true to render the layer as a background
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
     * Time configuration
     * @typedef {Object} Time.configuration
     * @property {date} date - Current date
     * @property {string} display - Current date as text for display
     * @property {Time.period.configuration}  - Period
     */

    /**
     * Time period configuration
     * @typedef {Object} Time.period.configuration
     * @property {date} from - start date
     * @property {date} to - stop date
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
    var AbstractLayer = function(type, options) {
        Event.prototype.constructor.call(this, options);

        this.globe = null;
        this.options = options || {};
        this.ID = "URN:Mizar:Layer:" + _.uniqueId(this.constructor.name + ":");
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
        this.dataType = this.options.dataType || "";
        this.background = options.background || false;
        this.category = this.options.background
            ? "background"
            : this.options.category;
        this.coordinateSystem = options.coordinateSystem;
        this.format = this.options.format || "";
        this.baseUrl = this.options.baseUrl || "";
        this.deletable = this.options.deletable || false;
        this.dimension = this.options.dimension;
        this.callbackContext = null;
        this.linkedTo = this.options.linkedTo || "";
        this.servicesRunningOnCollection = [];
        this.servicesRunningOnRecords = {};
        this.vectorLayer = false;
        this.metadataAPI = this.options.metadataAPI
            ? this.options.metadataAPI
            : null;
        this.time = null;
        // Do we take DEM into account with this layer ?
        this.pickingNoDEM = this.options.pickingNoDEM
            ? this.options.pickingNoDEM
            : false;

        // Set if we need to auto fill the time travel range/step with auto discovered time values
        this.autoFillTimeTravel = this.options.autoFillTimeTravel
            ? this.options.autoFillTimeTravel
            : false;

        // Create style if needed
        this.style = _createStyle.call(this, this.options, this.icon);

        // Ensure that the attribution link will be opened in new tab
        if (
            this.attribution &&
            this.attribution.search("<a") >= 0 &&
            this.attribution.search("target=") < 0
        ) {
            this.attribution = this.attribution.replace(" ", " target=_blank ");
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
        if (options.hasOwnProperty("availableServices")) {
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
        if (options.hasOwnProperty("style")) {
            // we use style from layerDescription.
            style = UtilityFactory.create(
                Constants.UTILITY.CreateStyle,
                options.style
            );
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
        if (options.hasOwnProperty("zIndex")) {
            zIndex = options.zIndex;
        } else {
            zIndex = Constants.DISPLAY.DEFAULT_RASTER;
        }
        return zIndex;
    }

    function _createIcon(options) {
        var icon;
        if (options.hasOwnProperty("icon")) {
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
        if (options.hasOwnProperty("opacity")) {
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
        if (options.hasOwnProperty("color")) {
            color =
                options.color instanceof Array
                    ? options.color
                    : UtilityFactory.create(
                        Constants.UTILITY.FeatureStyle
                    ).fromStringToColor(options.color);
        } else {
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
     * @return {boolean} true when the layer must be refreshed otherwise false
     * @private
     */
    AbstractLayer.prototype._hasToBeRefreshed = function(param, value) {
        var mustBeRefreshed = false;
        if (param === "time" && this.containsDimension(param)) {
            var time = Time.parse(value);
            var isInTimeDimension = time.isInTimeDefinition(
                this.getDimensions().time.value
            );
            value = isInTimeDimension ? time.getDisplayValue() : null;
            this.allowedHTTPRequest = value !== null;
        } else if (param === "time") {
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

    AbstractLayer.prototype.hasDimension = function() {
        return this.dimension != null;
    };

    AbstractLayer.prototype.getDimensions = function() {
        return this.dimension == null ? {} : this.dimension;
    };

    AbstractLayer.prototype.containsDimension = function(variable) {
        return this.hasDimension() && this.dimension[variable] != null;
    };

    /**
     * return short name
     * @function getShortName
     * @memberof AbstractLayer#
     * @return {string} Short name
     */
    AbstractLayer.prototype.getShortName = function() {
        var shortName = Utils.formatId(this.name);
        if (typeof shortName === "string") {
            shortName = shortName
                .replace(/[^a-z0-9\s]/gi, "")
                .replace(/[_\s]/g, "-");
        }

        return shortName;
    };

    /**************************************************************************************************************/

    /**
     * @function hasServicesRunningOnCollection
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.hasServicesRunningOnCollection = function() {
        return this.servicesRunningOnCollection.length > 0;
    };

    /**************************************************************************************************************/

    /**
     * @function postProcessDateTime
     * @memberof AbstractLayer#
     */
    /*        AbstractLayer.prototype.postProcessTime = function (time) {
         return time;
         };
         */
    /**************************************************************************************************************/

    /**
     * @function setDateTime
     * @memberof AbstractLayer#
     * @param {Time.configuration} time configuration
     */
    AbstractLayer.prototype.setTime = function(time) {
        this.time = time;
    };

    /**************************************************************************************************************/

    /**
     * @function forceRefresh
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.forceRefresh = function() {
        if (this.getGlobe()) {
            var tileManager = this.getGlobe().getTileManager();
            tileManager.updateVisibleTiles(this);
            this.getGlobe().refresh();
        }
    };

    /**
     * @function getServicesRunningOnCollection
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getServicesRunningOnCollection = function() {
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
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.removeServicesRunningOnCollection = function() {
        for (var layerIndex in this.servicesRunningOnCollection) {
            var layerID = this.servicesRunningOnCollection[layerIndex];
            this.callbackContext.removeLayer(layerID);
        }
        return this.servicesRunningOnCollection.length === 0;
    };

    /**
     * @function hasServicesRunningOnRecords
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.hasServicesRunningOnRecords = function() {
        return Object.keys(this.servicesRunningOnRecords).length > 0;
    };

    /**
     * @function getServicesRunningOnRecords
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getServicesRunningOnRecords = function() {
        var layers = [];
        for (var featureIndex in this.servicesRunningOnRecords) {
            var featureID = this.servicesRunningOnRecords[featureIndex];
            layers = layers.concat(this.getServicesRunningOnRecord(featureID));
        }
        return layers;
    };

    /**
     * @function removeServicesRunningOnRecords
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.removeServicesRunningOnRecords = function() {
        for (var featureID in this.servicesRunningOnRecords) {
            this.removeServicesRunningOnRecord(featureID);
        }
        return Object.keys(this.servicesRunningOnRecords).length === 0;
    };

    /**
     * @function hasServicesRunningOnRecord
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.hasServicesRunningOnRecord = function(featureID) {
        return this.servicesRunningOnRecords.hasOwnProperty(featureID);
    };

    /**
     * @function getServicesRunningOnRecord
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getServicesRunningOnRecord = function(featureID) {
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
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.addServicesRunningOnRecord = function(
        featureID,
        layerIDs
    ) {
        var isAdded;
        if (
            featureID != null &&
            layerIDs != null &&
            !this.hasServicesRunningOnRecord(featureID)
        ) {
            var layersIDArray = Array.isArray(layerIDs) ? layerIDs : [layerIDs];
            this.servicesRunningOnRecords[featureID] = {
                layerIds: layersIDArray
            };
            isAdded = true;
        } else {
            isAdded = false;
        }
        return isAdded;
    };

    /**
     * @function removeServicesRunningOnRecord
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.removeServicesRunningOnRecord = function(
        featureID
    ) {
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
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.addServicesRunningOnCollection = function(
        layerIDs
    ) {
        var isAdded;
        if (layerIDs != null) {
            var layersIDArray = Array.isArray(layerIDs) ? layerIDs : [layerIDs];
            this.servicesRunningOnCollection = this.servicesRunningOnCollection.concat(
                layersIDArray
            );
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
     * @memberof AbstractLayer#
     * @return {string} url
     */
    AbstractLayer.prototype.getGetCapabilitiesUrl = function() {
        return this.getCapabilitiesUrl;
    };

    /**************************************************************************************************************/

    /**
     * @function getMetadataAPI
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getMetadataAPI = function() {
        return this.metadataAPI;
    };

    /**
     * @function getGlobe
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getGlobe = function() {
        return this.globe;
    };

    /**
     * @function getID
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getID = function() {
        return this.ID;
    };

    /**
     * @function getName
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getName = function() {
        return this.name;
    };

    /**
     * @function getInformationType
     * @memberof AbstractLayer#
     * @abstract
     */
    AbstractLayer.prototype.getInformationType = function() {
        throw new SyntaxError(
            "getInformationType not implemented",
            "AbstractLayer.js"
        );
    };

    /**
     * @function getAttribution
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getAttribution = function() {
        return this.attribution;
    };

    /**
     * @function getCopyrightUrl
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getCopyrightUrl = function() {
        return this.copyrightUrl;
    };

    /**
     * @function getAck
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getAck = function() {
        return this.ack;
    };

    /**
     * @function getDescription
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getDescription = function() {
        return this.description;
    };

    /**
     * @function isVisible
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.isVisible = function() {
        return this.visible;
    };

    /**
     * @function setOnTheTop
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.setOnTheTop = function() {
        var manager = this.getGlobe().getRendererManager();
        manager.setSelectedRasterBucket(this);
    };

    /**
     * @function setVisible
     * @memberof AbstractLayer#
     * @throws {TypeError} - The parameter of setVisible should be a boolean
     */
    AbstractLayer.prototype.setVisible = function(arg) {
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
                        this.callbackContext.timeTravelService.update(
                            this.timeTravelValues
                        );
                    }
                } else {
                    // Remove
                    if (this.callbackContext.timeTravelService) {
                        this.callbackContext.timeTravelService.update({
                            remove: { ID: this.ID }
                        });
                    }
                }
            }

            this.getGlobe()
                .getRenderContext()
                .requestFrame();
            this.publish(Constants.EVENT_MSG.LAYER_VISIBILITY_CHANGED, this);
        } else {
            throw new TypeError(
                "the parameter of visible should be a boolean",
                "AbstractLayer.js"
            );
        }
    };

    /**
     * @function getOpacity
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getOpacity = function() {
        return this.getStyle().getOpacity();
    };

    /**
     * @function setOpacity
     * @memberof AbstractLayer#
     * @throws {RangeError} opacity - opacity value should be a value in [0..1]
     */
    AbstractLayer.prototype.setOpacity = function(arg) {
        var style = this.getStyle();
        style.setOpacity(arg);
        this.getGlobe()
            .getRenderContext()
            .requestFrame();
        this.publish(Constants.EVENT_MSG.LAYER_OPACITY_CHANGED, this);
    };

    /**
     * @function getProperties
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getProperties = function() {
        return this.properties;
    };

    /**
     * @function getType
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getType = function() {
        return this.type;
    };

    /**
     * @function isPickable
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.isPickable = function() {
        return this.pickable;
    };

    /**
     * @function isType
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.isType = function(type) {
        return this.type === type;
    };

    /**
     * @function getServices
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getServices = function() {
        return this.services;
    };

    /**
     * @function getCoordinateSystem
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getCoordinateSystem = function() {
        return this.coordinateSystem;
    };

    /**
     * @function isAttached
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.isAttached = function() {
        return !this.isDetached;
    };

    /**
     * @function isDetached
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.isDetached = function() {
        return this.globe == null;
    };

    /**
     * @function _attach
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype._attach = function(g) {
        this.globe = g;
        if (
            this.attribution &&
            this.globe.attributionHandler &&
            this.isVisible()
        ) {
            this.globe.attributionHandler.addAttribution(this);
        }
    };

    /**
     * @function _detach
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype._detach = function() {
        if (this.attribution && this.globe.attributionHandler) {
            this.globe.attributionHandler.removeAttribution(this);
        }
        this.globe = null;
    };

    /**
     * @function getBaseUrl
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getBaseUrl = function() {
        return this.baseUrl;
    };

    /**
     * @function getDataType
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getDataType = function() {
        return this.dataType;
    };

    /**
     * @function getFormat
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getFormat = function() {
        return this.format;
    };

    /**
     * @function isDeletable
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.isDeletable = function() {
        return this.deletable;
    };

    /**
     * @function getStyle
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.getStyle = function() {
        return this.style;
    };

    /**
     * Sets the vector layer style.
     * @function setStyle
     * @memberof AbstractLayer#
     * @param {FeatureStyle} arg Feature style
     */
    AbstractLayer.prototype.setStyle = function(arg) {
        this.style = arg;
    };

    /**
     * @function isBackground
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.isBackground = function() {
        return this.background;
    };

    /**
     * @function isVectorLayer
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.isVectorLayer = function() {
        return this.vectorLayer;
    };

    /**
     * Decrypt time range to generate time travel informations
     * @function generateTimeTravel
     * @param {string} timeDetails Details of time range
     * @memberof AbstractLayer#
     */
    AbstractLayer.prototype.generateTimeTravel = function(timeDetails) {
        if (timeDetails) {
            // In a general case, timeDetails.value could have this shape:
            //  val1,val2,min1/max1/step1,val3,min2/max2/step2
            var timesDefinition = timeDetails.value.split(",");
            var distinctValues = []; // records the distinct values : val1,val2,val3
            var sampleValues = []; // records the samples values : min1/max1/step1,min2/max2/step2
            var timeDefinition;

            // We need to iter because it is possible that we have a mix of distinct values and sample values
            for (var i = 0; i < timesDefinition.length; i++) {
                timeDefinition = timesDefinition[i].trim();
                if (Time.isDistinctValue(timeDefinition)) {
                    distinctValues.push(timeDefinition);
                } else if (Time.isSampling(timeDefinition)) {
                    sampleValues.push(timeDefinition);
                } else {
                    ErrorDialog.open(Constants.LEVEL.WARNING, "Case not handle by Mizar for timeDefinition "+timeDefinition);
                }
            }
            // Add distinct values in time travel
            if (distinctValues.length > 0) {
                this.timeTravelValues = {
                    add: {
                        enumeratedValues: distinctValues,
                        ID: this.ID
                    }
                };
            }

            // Add sample values in time travel
            if (sampleValues.length > 0) {
                var start, end, step, tmpArray, sampleDefinition;
                for (i = 0; i < sampleValues.length; i++) {
                    sampleDefinition = sampleValues[i];
                    tmpArray = sampleDefinition.split("/");
                    start = Moment(tmpArray[0]);
                    end = Moment(tmpArray[1]);
                    step = Time.timeResolution(tmpArray[2]);
                    this.timeTravelValues = {
                        add: {
                            start: start,
                            end: end,
                            stepKind: step.unit,
                            stepValue: step.step,
                            ID: this.ID
                        }
                    };
                }
            }
        }
    };

    return AbstractLayer;
});
