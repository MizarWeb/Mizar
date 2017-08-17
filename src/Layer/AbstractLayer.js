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

define(["underscore-min", "../Utils/Event", "../Utils/Utils", "../Utils/Constants", "../Utils/UtilityFactory"],
    function (_, Event, Utils, Constants, UtilityFactory) {

        /**
         * AbstactLayer configuration
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
         * @param {Array} [availableServices=[]}
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
            this.ID = "URN:Mizar:Layer:"+_.uniqueId(this.constructor.name + ':');
            this.name = this.options.hasOwnProperty('name') ? this.options.name : "";
            this.attribution = this.options.hasOwnProperty('attribution') ? this.options.attribution : "";
            this.copyrightUrl = this.options.hasOwnProperty('copyrightUrl') ? this.options.copyrightUrl : "";
            this.ack = this.options.hasOwnProperty('ack') ? this.options.ack : "";
            this.icon = this.options.hasOwnProperty('icon') ? this.options.icon : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wMBQkVBRMIQtMAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAvklEQVQY012QMWpCURBFz3yfG7CIwSatpLGwsJJsQEHssr2UttapkkK0zRJEFPKLj5UYPGme8vgDt5l7uNwZKEYNdaZO1FR6VQkBT8AbMAGe1e7dTwXUB8bAFPgF9sBWPUXENbWgBTAELkCTw7bqMdR5kTQCehlogB/gE/iqcs9OVhT9I8v7EZU6UJfqh3pWa3WlvqsvakoRcVOPwCYnvQI1sM67Q0T8JYAWvAEOwDewj4jr4z0teJdf84AA/gF1uG92uhcfoAAAAABJRU5ErkJggg==";
            this.description = this.options.hasOwnProperty('description') ? this.options.description : "";
            this.visible = this.options.hasOwnProperty('visible') ? this.options.visible : false;
            this.properties = this.options.hasOwnProperty('properties') ? this.options.properties : {};
            this.type = type;
            this.pickable = this.options.hasOwnProperty('pickable') ? this.options.pickable : false;
            this.services = this.options.hasOwnProperty('services') ? this.options.services : [];
            this.dataType = this.options.dataType || "";
            this.background = options.background;
            this.category = this.options.background ? "background" : this.options.category;
            this.coordinateSystem = options.coordinateSystem;
            this.format = this.options.format || "";
            this.baseUrl = this.options.baseUrl || "";
            this.deletable = this.options.deletable || false;
            this.fitsSupported = false;

            // Update layer color
            this.color = _createColor.call(this, this.options);

            // Layer opacity must be in range [0, 1]
            this.opacity = _createOpacity.call(this, this.options);

            // Create style if needed
            this.style = _createStyle.call(this, this.options, this.opacity, this.icon, this.color, this.visible);

            // Ensure that the attribution link will be opened in new tab
            if (this.attribution && this.attribution.search('<a') >= 0 && this.attribution.search('target=') < 0) {
                this.attribution = this.attribution.replace(' ', ' target=_blank ');
            }

            this.availableServices = _createAvailableServices(this.options);
        };



        function _createAvailableServices(options) {
            var availableServices;
            if (options.hasOwnProperty('availableServices')) {
                availableServices = options.availableServices
            } else {
                availableServices = [];
            }
            return availableServices;
        }

        /**
         *
         * @param options
         * @param opacity
         * @param icon
         * @param color
         * @param visible
         * @returns {*}
         * @private
         */
        function _createStyle(options, opacity, icon, color, visible) {
            var style;
            if (!options.hasOwnProperty('style')) {
                style = UtilityFactory.create(Constants.UTILITY.CreateStyle, {
                    rendererHint: "Basic",
                    opacity: opacity,
                    iconUrl: icon,
                    fillColor: color,
                    strokeColor: color,
                    visible: visible
                });
            } else if (options.style === "FeatureStyle") {
                style = options.style;
            } else {
                style = UtilityFactory.create(Constants.UTILITY.CreateStyle, options.style);
            }
            return style;
        }

        /**
         *
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
            return color
        }

        /**************************************************************************************************************/

        Utils.inherits(Event, AbstractLayer);

        /**************************************************************************************************************/


        /**
         * Proxify an url
         * @function proxify
         * @memberOf AbstractLayer#
         * @param {String} url - URL
         * @return {String} Url proxified
         */
         AbstractLayer.prototype.proxify = function (url) {
           var proxifiedUrl = url;
           if ( (this.options) && (this.options.proxy) ) {
             if (this.options.proxy.use === true) {
               if (url.startsWith(this.options.proxy.url)) {
                 proxifiedUrl = url; // No change, proxy always set
               } else {
                 proxifiedUrl = this.options.proxy.url + url; // Add proxy redirection
               }
            }
           }
           return proxifiedUrl;
         }

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
         * @function getIcon
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getIcon = function () {
            return this.icon;
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
         * @function setVisible
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.setVisible = function (arg) {
            if (typeof arg === "boolean") {
                if (this.visible !== arg && this.globe.attributionHandler) {
                    this.globe.attributionHandler.toggleAttribution(this);
                }
                this.visible = arg;
                if (this.globe) {
                    this.globe.renderContext.requestFrame();
                }
                this.publish("visibility:changed", this);
            } else {
                throw new TypeError("the parameter of setVisible should be a boolean", "AbstractLayer.js");
            }
        };

        /**
         * @function getOpacity
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getOpacity = function () {
            return this.opacity;
        };

        /**
         * @function setOpacity
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.setOpacity = function (arg) {
            if (typeof arg === "number" && arg >=0.0 && arg <=1.0) {
                this.opacity = arg;
                if (this.globe) {
                    this.globe.renderContext.requestFrame();
                }
                this.publish("opacity:changed", this);
            } else {
               throw new TypeError('opacity value should be a value in [0..1]', "AbstractLayer.js");
            }
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
         * @function getBaseURl
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getBaseURl = function() {
            return this.baseUrl;
        };

        /**
         * @function getDataType
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getDataType = function() {
            return this.dataType;
        };

        /**
         * @function getFormat
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getFormat = function() {
            return this.format;
        };

        /**
         * @function isDeletable
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.isDeletable = function() {
            return this.deletable;
        };

        /**
         * @function getColor
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getColor = function() {
            return this.color;
        };

        /**
         * @function getStyle
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getStyle = function() {
            return this.style;
        };

        /**
         * @function getAvailableServices
         * @memberOf AbstractLayer#
         */
        AbstractLayer.prototype.getAvailableServices = function() {
            return this.availableServices;
        };

        AbstractLayer.prototype.isBackground = function() {
            return this.background;
        };

        /**
         * @function _proxifyUrl
         * @memberOf AbstractLayer#
         * @private
         */
        AbstractLayer.prototype._proxifyUrl = function (url) {
          if (this.options.proxy) {
            return this.options.proxy.url + url;
          } else {
            return url;
          }
        };

        return AbstractLayer;

    });
