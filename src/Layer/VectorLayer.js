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

define(['../Utils/Utils', './AbstractLayer', '../Utils/Constants', '../Renderer/FeatureStyle'],
    function (Utils, AbstractLayer, Constants, FeatureStyle) {
        /**
         * Vector layer configuration
         * @typedef {AbstractLayer.configuration} AbstractLayer.vector_configuration
         * @property {string} url - the url of json data to load when attaching to globe
         * @property {int} [minLevel = 0] - minimum rendering level depending on tile level
         * @property {int} [maxLevel = 15] - maximum rendering level depending on tile level
         * @property {function} [callback] - the callback function called when data are loaded. Data loaded are passed in parameter of the function.
         */        
        /**
         * @name VectorLayer
         * @class
         *    Create a layer to display vector data in GeoJSON format.
         * @augments AbstractLayer
         * @param {AbstractLayer.vector_configuration} options - Vector configuration
         * @constructor
         * @memberOf module:Layer
         */
        var VectorLayer = function (options) {
            AbstractLayer.prototype.constructor.call(this, Constants.LAYER.Vector, options);

            if (options && options.url) {
                this.url = options.url;
            } else {
                this.url = null;
            }

            if (options && options.callback) {
                this.callback = options.callback;
            } else {
                this.callback = null;
            }

            this.minLevel = options && options.hasOwnProperty('minLevel') ? options.minLevel : 0.0;
            this.maxLevel = options && options.hasOwnProperty('maxLevel') ? options.maxLevel : 15.0;

            this.features = [];
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractLayer, VectorLayer);

        /**************************************************************************************************************/

        /**
         * Attach the vector layer to the globe
         * @function _attach
         * @memberof VectorLayer#
         * @param {AbstractGlobe} g globe
         * @private
         */
        VectorLayer.prototype._attach = function (g) {
            AbstractLayer.prototype._attach.call(this, g);

            // Add the feature to renderers
            for (var i = 0; i < this.features.length; i++) {
                this._addFeatureToRenderers(this.features[i]);
            }
        };

        /**************************************************************************************************************/

        /**
         * Detach the vector layer from the globe
         * @function _detach
         * @memberof VectorLayer#
         * @private
         */
        VectorLayer.prototype._detach = function () {
            // Remove feature from renderers
            for (var i = 0; i < this.features.length; i++) {
                this._removeFeatureFromRenderers(this.features[i]);
            }

            AbstractLayer.prototype._detach.call(this);
        };

        /**************************************************************************************************************/

        /**
         * Adds a feature collection, in GeoJSON format
         * @function addFeatureCollection
         * @memberof VectorLayer#
         * @param {GeoJSON} featureCollection Feature Collection
         */
        VectorLayer.prototype.addFeatureCollection = function (featureCollection) {
            // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
            var features = featureCollection.features;
            if (features) {
                for (var i = 0; i < features.length; i++) {
                    this.addFeature(features[i]);
                }
            }
        };

        /**************************************************************************************************************/
        /**
         * Removes a feature collection, in GeoJSON format
         * @function removeFeatureCollection
         * @memberof VectorLayer#
         * @param {GeoJSON} featureCollection Feature Collection
         */
        VectorLayer.prototype.removeFeatureCollection = function (featureCollection) {
            // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
            var features = featureCollection.features;
            if (features) {
                for (var i = 0; i < features.length; i++) {
                    this.removeFeature(features[i]);
                }
            }
        };

        /**************************************************************************************************************/

        /**
         * Add a feature to renderers
         * @function _addFeatureToRenderers
         * @memberof VectorLayer#
         * @param {GeoJSON} feature Feature
         * @private
         */
        VectorLayer.prototype._addFeatureToRenderers = function (feature) {
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
         * @memberof VectorLayer#
         * @param {GeoJSON} feature Feature
         * @private
         */
        VectorLayer.prototype._removeFeatureFromRenderers = function (feature) {
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

        /**************************************************************************************************************/
        /**
         * Add a feature to the layer
         * @function addFeature
         * @memberof VectorLayer#
         * @param {GeoJSON} feature Feature
         */
        VectorLayer.prototype.addFeature = function (feature) {
            // Check feature geometry : only add valid feature
            var geometry = feature.geometry;
            if (!geometry || !geometry.type) {
                return;
            }
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
         * Add a feature to the layer
         * @function addFeature
         * @memberof VectorLayer#
         * @param {GeoJSON} feature Feature
         */
        VectorLayer.prototype.removeFeature = function (feature) {
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
         * Remove a feature from the layer
         * @function removeFeature
         * @memberof VectorLayer#
         * @param {GeoJSON} feature Feature
         */
        VectorLayer.prototype.removeAllFeatures = function () {
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
         * Remove all feature from the layer
         * @function removeAllFeatures
         * @memberof VectorLayer#
         */
        VectorLayer.prototype.modifyFeatureStyle = function (feature, style) {
            if (this._removeFeatureFromRenderers(feature)) {
                feature.properties.style = style;
                this._addFeatureToRenderers(feature);
            }
        };

        /**************************************************************************************************************/

        /**
         * Modify feature style
         * @function modifyFeatureStyle
         * @memberof VectorLayer#
         * @param {GeoJSON} feature Feature
         * @param {FeatureStyle} style Feature style
         */
        VectorLayer.prototype.modifyStyle = function (style) {
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
         * @memberof VectorLayer#
         * @return {FeatureStyle}  Feature style
         */
        VectorLayer.prototype.getStyle = function () {
            return this.style;
        };

        /**
         * Set the vector layer style
         * @function setStyle
         * @memberof VectorLayer#
         * @param {FeatureStyle} arg Feature style
         */
        VectorLayer.prototype.setStyle = function (arg) {
            this.style = arg;
        };

        return VectorLayer;

    });
