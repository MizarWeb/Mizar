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
define(['../Utils/Utils', './AbstractLayer', '../Utils/Constants'],
    function (Utils, AbstractLayer, Constants) {
        /**
         * GeoJson layer configuration
         * @typedef {AbstractLayer.configuration} AbstractLayer.geojson_configuration
         * @property {string} url - the url of json data to load when attaching to globe
         * @property {int} [minLevel = 0] - minimum rendering level depending on tile level
         * @property {int} [maxLevel = 15] - maximum rendering level depending on tile level
         * @property {function} [callback] - the callback function called when data are loaded. Data loaded are passed in parameter of the function.
         */
        /**
         * @name GeoJsonLayer
         * @class
         *    Create a layer to display vector data in GeoJSON format.
         * @augments AbstractLayer
         * @param {AbstractLayer.geojson_configuration} options - GeoJsonLayer configuration
         * @constructor
         * @memberOf module:Layer
         */
        var GeoJsonLayer = function (options) {
            AbstractLayer.prototype.constructor.call(this, Constants.LAYER.GeoJSON, options);

            this.url = this.proxify(options.url);
            this.gid = 0;


            if (options && options.callback) {
                this.callback = options.callback;
            } else {
                this.callback = null;
            }

            this.minLevel = options && options.hasOwnProperty('minLevel') ? options.minLevel : 0.0;
            this.maxLevel = options && options.hasOwnProperty('maxLevel') ? options.maxLevel : 15.0;

            this.features = [];

        };

        /**
         * Check if the GeoJSon has a valid geometry attribute
         * @param {Object} feature - GeoJSON feature
         * @throws {RangeError} Invalid GeoJson
         * @private
         */
        function _checkValidGeoJson(feature) {
            var geometry = feature.geometry;
            if (!geometry || !geometry.type) {
                throw new RangeError("Invalid GeoJson", "GeoJsonLayer.js");
            }
        }

        /**
         * Set the global crs when the geometry has not crs.
         * If no globalCrs, then WGS84 is set
         * @param {Object} feature - GeoJSON feature
         * @param {Object} globalCrs - GeoJSON crs element
         * @returns {Object} the feature
         * @private
         */
        function _setCrs(feature, globalCrs) {
            if(!feature.geometry.crs) {
                feature.geometry.crs = (globalCrs) ? globalCrs :  {
                    type: "name",
                    properties: {
                        name: Constants.CRS.WGS84
                    }
                };
            }
            return feature;
        }

        /**
         * Sets an unique ID of the GeoJSON geometry
         * @param {Object} feature - GeoJSON feature
         * @returns {Object} GeoJSON feature
         * @private
         */
        function _setID(feature) {
            feature.geometry.gid = "GeoJSON_" + this.gid;
            this.gid++;
            return feature;
        }

        /**************************************************************************************************************/

        Utils.inherits(AbstractLayer, GeoJsonLayer);

        /**************************************************************************************************************/

        /**
         * Attach the vector layer to the planet
         * @function _attach
         * @memberOf GeoJsonLayer#
         * @param {Planet} g globe
         * @private
         */
        GeoJsonLayer.prototype._attach = function (g) {
            AbstractLayer.prototype._attach.call(this, g);
            // Add the feature to renderers
            for (var i = 0; i < this.features.length; i++) {
                this._addFeatureToRenderers(this.features[i]);
            }
        };

        /**************************************************************************************************************/

        /**
         * Detach the vector layer from the planet
         * @function _detach
         * @memberOf GeoJsonLayer#
         * @private
         */
        GeoJsonLayer.prototype._detach = function () {
            // Remove feature from renderers
            for (var i = 0; i < this.features.length; i++) {
                this._removeFeatureFromRenderers(this.features[i]);
            }

            this.features = [];

            AbstractLayer.prototype._detach.call(this);
        };


        /**
         * Adds a feature collection, in GeoJSON format
         * @function addFeatureCollection
         * @memberOf GeoJsonLayer#
         * @param {GeoJSON} featureCollection Feature Collection
         * @throws {ReferenceError} Error, featureCollection is null
         */
        GeoJsonLayer.prototype.addFeatureCollection = function (featureCollection) {
            // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
            if ((featureCollection === null) || (featureCollection === undefined)) {
                throw new ReferenceError("Error, featureCollection is null", "GeoJsonLayer.js");
            }

            var defaultCrs = {
                type: "name",
                properties: {
                    name: Constants.CRS.WGS84
                }
            };

            //check if crs is global at the featureCollection
            var crs = (featureCollection.crs) ? featureCollection.crs : defaultCrs;


            var features = featureCollection.features;
            if (features) {
                for (var i = 0; i < features.length; i++) {
                    this.addFeature(features[i], crs);
                }
            }
        };

        /**************************************************************************************************************/

        /**
         * Removes a feature collection, in GeoJSON format
         * @function removeFeatureCollection
         * @memberOf GeoJsonLayer#
         * @param {GeoJSON} featureCollection Feature Collection
         */
        GeoJsonLayer.prototype.removeFeatureCollection = function (featureCollection) {
            // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
            var features = featureCollection.features;
            if (features) {
                for (var i = 0; i < features.length; i++) {
                    this.removeFeature(features[i]);
                }
            }
            this.features = [];
        };

        /**************************************************************************************************************/

        /**
         * Add a feature to renderers
         * @function _addFeatureToRenderers
         * @memberOf GeoJsonLayer#
         * @param {GeoJSON} feature Feature
         * @private
         */
        GeoJsonLayer.prototype._addFeatureToRenderers = function (feature) {
            var geometry = feature.geometry;

            // Manage style, if undefined try with properties, otherwise use defaultStyle
            var style = this.style;
            var props = feature.properties;
            if (props && props.style) {
                style = props.style;
            }

            // Manage geometry collection
            if (geometry.type === "GeometryCollection") {
                var geoms = geometry.geometries;
                for (var i = 0; i < geoms.length; i++) {
                    this.globe.vectorRendererManager.addGeometry(this, geoms[i], style);
                }
            }
            else {
                // Add geometry to renderers
                this.globe.vectorRendererManager.addGeometry(this, geometry, style);
            }
        };

        /**************************************************************************************************************/

        /**
         * Remove a feature from renderers
         * @function _removeFeatureFromRenderers
         * @memberOf GeoJsonLayer#
         * @param {GeoJSON} feature Feature
         * @private
         */
        GeoJsonLayer.prototype._removeFeatureFromRenderers = function (feature) {
            var geometry = feature.geometry;

            // Manage geometry collection
            if (geometry.type === "GeometryCollection") {
                var geoms = geometry.geometries;
                var res = false;
                if (this.globe && this.globe.vectorRendererManager) {
                    for (var i = 0; i < geoms.length; i++) {
                        res = this.globe.vectorRendererManager.removeGeometry(geoms[i], this);
                    }
                }
                return res;
            }
            else {
                if (this.globe && this.globe.vectorRendererManager) {
                    return this.globe.vectorRendererManager.removeGeometry(geometry, this);
                }
            }
        };

        /**
         * Set data type of the GeoJSON : Point or LineString
         * @param feature
         * @memberOf GeoJsonLayer#
         * @private
         */
        GeoJsonLayer.prototype._setDataType = function(feature) {
            if (!this.datatype) {
                if (feature.geometry.type.startsWith(Constants.GEOMETRY.Point)) {
                    this.dataType = Constants.GEOMETRY.Point;
                } else {
                    this.dataType = Constants.GEOMETRY.LineString;
                }
            }
        };

        /**************************************************************************************************************/
        /**
         * Add a feature to the layer
         * @function addFeature
         * @memberOf GeoJsonLayer.prototype
         * @param {GeoJSON} feature Feature
         */
        GeoJsonLayer.prototype.addFeature = function (feature, globalCrs) {
            _checkValidGeoJson.call(this, feature);
            feature = _setCrs.call(this, feature, globalCrs);
            feature = _setID.call(this, feature);

            this._setDataType(feature);
            this.features.push(feature);

            // Add features to renderer if layer is attached to planet
            if (this.globe) {
                this._addFeatureToRenderers(feature);
                if (this.isVisible()) {
                    this.globe.renderContext.requestFrame();
                }
            }
        };

        /**************************************************************************************************************/
        /**
         * Remove a feature from the layer
         * @function removeFeature
         * @memberOf GeoJsonLayer#
         * @param {GeoJSON} feature Feature
         */
        GeoJsonLayer.prototype.removeFeature = function (feature) {
            var index = this.features.indexOf(feature);
            this.features.splice(index, 1);
            if (this.globe) {
                this._removeFeatureFromRenderers(feature);
                if (this.isVisible()) {
                    this.globe.renderContext.requestFrame();
                }
            }
        };

        /**************************************************************************************************************/

        /**
         * Remove all feature from the layer
         * @function removeAllFeatures
         * @memberOf GeoJsonLayer#
         */
        GeoJsonLayer.prototype.removeAllFeatures = function () {
            // Remove feature from renderers
            if (this.globe) {
                for (var i = 0; i < this.features.length; i++) {
                    this._removeFeatureFromRenderers(this.features[i]);
                }
            }
            this.features.length = 0;

            // Refresh rendering if needed
            if (this.globe && this.isVisible()) {
                this.globe.renderContext.requestFrame();
            }
        };

        /**************************************************************************************************************/
        /**
         * Modify feature style
         * @function modifyFeatureStyle
         * @memberOf GeoJsonLayer#
         * @param {GeoJSON} feature Feature
         * @param {FeatureStyle} style Feature style
         */
        GeoJsonLayer.prototype.modifyFeatureStyle = function (feature, style) {
            if (this._removeFeatureFromRenderers(feature)) {
                feature.properties.style = style;
                this._addFeatureToRenderers(feature);
            }
        };

        /**************************************************************************************************************/

        /**
         * Modify the vector layer style
         * @function modifyStyle
         * @memberOf GeoJsonLayer#
         * @param {FeatureStyle} style Feature style
         */
        GeoJsonLayer.prototype.modifyStyle = function (style) {
            var i;
            for (i = 0; i < this.features.length; i++) {
                this._removeFeatureFromRenderers(this.features[i]);
            }

            this.style = style;

            for (i = 0; i < this.features.length; i++) {
                this._addFeatureToRenderers(this.features[i]);
            }
        };

        /**************************************************************************************************************/

        /**
         * Get the vector layer style
         * @function getStyle
         * @memberOf GeoJsonLayer#
         * @return {FeatureStyle}  Feature style
         */
        GeoJsonLayer.prototype.getStyle = function () {
            return this.style;
        };

        /**
         * Set the vector layer style
         * @function setStyle
         * @memberOf GeoJsonLayer#
         * @param {FeatureStyle} arg Feature style
         */
        GeoJsonLayer.prototype.setStyle = function (arg) {
            this.style = arg;
        };

        return GeoJsonLayer;

    });
