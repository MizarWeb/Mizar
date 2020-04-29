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

import Utils from "../Utils/Utils";
import AbstractLayer from "./AbstractLayer";
import Constants from "../Utils/Constants";
import FeatureStyle from "../Renderer/FeatureStyle";
/**
 * AbstractVectorLayer layer configuration
 * @typedef {AbstractVectorLayer.configuration} AbstractLayer.vector_configuration
 * @property {string} url - the url of json data to load when attaching to globe
 * @property {int} [minLevel = 0] - minimum rendering level depending on tile level
 * @property {int} [maxLevel = 15] - maximum rendering level depending on tile level
 * @property {function} [callback] - the callback function called when data are loaded. Data loaded are passed in parameter of the function.
 */
/**
 * @name AbstractVectorLayer
 * @class
 *    Create a layer to display vector data in GeoJSON format.
 * @augments AbstractLayer
 * @param {LAYER} type - the type of the layer
 * @param {AbstractVectorLayer.configuration} options - Configuration properties for the AbstractVectorLayer
 * @constructor
 * @implements {VectorLayer}
 */
var AbstractVectorLayer = function (type, options) {
  this.zIndex = options.zIndex || Constants.DISPLAY.DEFAULT_VECTOR;
  AbstractLayer.prototype.constructor.call(this, type, options);

  this.vectorLayer = true;
  this.url = options.url;
  this.draw = false;

  if (options.callback) {
    this.callback = options.callback;
  } else {
    this.callback = null;
  }

  this.minLevel = options.hasOwnProperty("minLevel") ? options.minLevel : 0;
  this.maxLevel = options.hasOwnProperty("maxLevel") ? options.maxLevel : 21;

  this.features = [];
};

/**************************************************************************************************************/

Utils.inherits(AbstractLayer, AbstractVectorLayer);

/**************************************************************************************************************/

/**
 * @function getInformationType
 * @memberof AbstractVectorLayer#
 */
AbstractVectorLayer.prototype.getInformationType = function () {
  return Constants.INFORMATION_TYPE.VECTOR;
};

/**
 * Returns the min level for which the vector is displayed.
 * @function getMinLevel
 * @memberof AbstractVectorLayer#
 * @returns {int} Returns the min level for which the vector is displayed.
 */
AbstractVectorLayer.prototype.getMinLevel = function () {
  return this.minLevel;
};

/**
 * Returns the max level for which the vector is not displayed.
 * @function getMaxLevel
 * @memberof AbstractVectorLayer#
 * @returns {int} Returns the max level for which the vector is not displayed.
 */
AbstractVectorLayer.prototype.getMaxLevel = function () {
  return this.maxLevel;
};

/**
 * @function getUrl
 * @memberof AbstractVectorLayer#
 */
AbstractVectorLayer.prototype.getUrl = function () {
  return this.url;
};

/**
 * @function isForDataProvider
 * @memberof AbstractVectorLayer#
 */
AbstractVectorLayer.prototype.isForDataProvider = function () {
  return this.getUrl() === undefined;
};

/**
 * @function isDraw
 * @memberof AbstractVectorLayer#
 */
AbstractVectorLayer.prototype.isDraw = function () {
  return this.draw;
};

/**
 * @function isDraw
 * @memberof AbstractVectorLayer#
 */
AbstractVectorLayer.prototype.setDraw = function (value) {
  Utils.assert(typeof value === "boolean", "value is not a boolean : " + value, "AbstractVectorLayer.js");
  this.draw = value;
};

/**
 * Attach the vector layer to the globe
 * @function _attach
 * @memberof AbstractVectorLayer#
 * @param {AbstractGlobe} g globe
 * @private
 */
AbstractVectorLayer.prototype._attach = function (g) {
  AbstractLayer.prototype._attach.call(this, g);

  // Add the feature to renderers
  for (var i = 0; i < this.features.length; i++) {
    this._addFeatureToRenderers(this.features[i]);
  }
};

/**
 * Detach the vector layer from the globe
 * @function _detach
 * @memberof AbstractVectorLayer#
 * @private
 */
AbstractVectorLayer.prototype._detach = function () {
  // Remove feature from renderers
  for (var i = 0; i < this.features.length; i++) {
    this._removeFeatureFromRenderers(this.features[i]);
  }

  AbstractLayer.prototype._detach.call(this);
};

/**
 * Adds a feature collection, in GeoJSON format
 * @function addFeatureCollection
 * @memberof AbstractVectorLayer#
 * @param {GeoJSON} featureCollection Feature Collection
 */
AbstractVectorLayer.prototype.addFeatureCollection = function (featureCollection) {
  // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
  var features = featureCollection.features;
  if (features) {
    for (var i = 0; i < features.length; i++) {
      this.addFeature(features[i]);
    }
  }
};

/**
 * Removes a feature collection, in GeoJSON format
 * @function removeFeatureCollection
 * @memberof AbstractVectorLayer#
 * @param {GeoJSON} featureCollection Feature Collection
 */
AbstractVectorLayer.prototype.removeFeatureCollection = function (featureCollection) {
  // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
  var features = featureCollection.features;
  if (features) {
    for (var i = 0; i < features.length; i++) {
      this.removeFeature(features[i]);
    }
  }
};

/**
 * Check whether a feature can be considered on terrain
 */
AbstractVectorLayer.prototype._isOnTerrain = function (feature) {
  var onTerrain = true;

  const coords = feature.geometry.coordinates;
  if (coords && coords[0] && coords[0][0]) {
    if (coords[0][0].length === 3) {
      const props = feature.properties || {};
      const style = props.style || {};

      if (!style.rendererHint || style.rendererHint !== "Tiled") {
        onTerrain = false;
      }
    }
  }

  return onTerrain;
};

/**
 * Add a feature to renderers.
 * @function _addFeatureToRenderers
 * @memberof AbstractVectorLayer#
 * @param {GeoJSON} feature Feature
 * @private
 */
AbstractVectorLayer.prototype._addFeatureToRenderers = function (feature) {
  var geometry = feature.geometry;

  // Manage style, if undefined try with properties, otherwise use defaultStyle
  var style;
  var props = feature.properties;
  if (props && props.style) {
    style = props.style;
  } else {
    style = Object.assign({}, this.style);
  }
  style.zIndex = this.zIndex;
  style.onTerrain = this._isOnTerrain(feature);

  // Manage geometry collection
  if (geometry.type === "GeometryCollection") {
    var geoms = geometry.geometries;
    for (var i = 0; i < geoms.length; i++) {
      this.getGlobe().getRendererManager().addGeometry(this, geoms[i], style);
    }
  } else {
    // Add geometry to renderers
    this.getGlobe().getRendererManager().addGeometry(this, geometry, style);
  }
};

/**
 * Removes a feature from renderers.
 * @function _removeFeatureFromRenderers
 * @memberof AbstractVectorLayer#
 * @param {GeoJSON} feature Feature
 * @returns {boolean} true when the feature is removed from the globe otherwise false
 * @private
 */
AbstractVectorLayer.prototype._removeFeatureFromRenderers = function (feature) {
  var isRemoved = true;
  var geometry = feature.geometry;

  // Manage geometry collection
  if (geometry.type === "GeometryCollection") {
    var geoms = geometry.geometries;
    if (this.getGlobe() && this.getGlobe().getRendererManager()) {
      for (var i = 0; i < geoms.length; i++) {
        isRemoved = isRemoved && this.getGlobe().getRendererManager().removeGeometry(geoms[i], this);
      }
    } else {
      isRemoved = false;
    }
  } else if (this.getGlobe() && this.getGlobe().getRendererManager()) {
    isRemoved = this.getGlobe().getRendererManager().removeGeometry(geometry, this);
  } else {
    isRemoved = false;
  }
  return isRemoved;
};

/**
 * Add a feature to the layer
 * @function addFeature
 * @memberof AbstractVectorLayer#
 * @param {GeoJSON} feature Feature
 */
AbstractVectorLayer.prototype.addFeature = function (feature) {
  // Check feature geometry : only add valid feature
  var geometry = feature.geometry;
  if (!geometry || !geometry.type) {
    return;
  }
  this.features.push(feature);

  // Add features to renderer if layer is attached to planet
  if (this.getGlobe()) {
    this._addFeatureToRenderers(feature);
    if (this.isVisible()) {
      this.getGlobe().getRenderContext().requestFrame();
    }
  }
};

/**
 * Removes a feature from the layer.
 * @function removeFeature
 * @memberof AbstractVectorLayer#
 * @param {GeoJSON} feature Feature
 */
AbstractVectorLayer.prototype.removeFeature = function (feature) {
  var index = this.features.indexOf(feature);
  this.features.splice(index, 1);
  if (this.getGlobe()) {
    this._removeFeatureFromRenderers(feature);
    if (this.isVisible()) {
      this.getGlobe().getRenderContext().requestFrame();
    }
  }
};

/**
 * Removes all features from the layer.
 * @function removeAllFeatures
 * @memberof AbstractVectorLayer#
 */
AbstractVectorLayer.prototype.removeAllFeatures = function () {
  // Remove feature from renderers
  if (this.getGlobe()) {
    for (var i = 0; i < this.features.length; i++) {
      this._removeFeatureFromRenderers(this.features[i]);
    }
  }
  this.features.length = 0;

  // Refresh rendering if needed
  if (this.getGlobe() && this.isVisible()) {
    this.getGlobe().getRenderContext().requestFrame();
  }
};

/**
 * Modifies the feature style for a specific feature.
 * @function modifyFeatureStyle
 * @memberof AbstractVectorLayer#
 * @param {GeoJson} feature feature for which the feature style is modified
 * @param {FeatureStyle} style Feature style
 */
AbstractVectorLayer.prototype.modifyFeatureStyle = function (feature, style) {
  if (this._removeFeatureFromRenderers(feature)) {
    feature.properties.style = style;
    this._addFeatureToRenderers(feature);
  }
};

/**
 * Modifies the feature style for all features.
 * @function modifyStyle
 * @memberof AbstractVectorLayer#
 * @param {FeatureStyle} style Feature style
 */
AbstractVectorLayer.prototype.modifyStyle = function (style) {
  var i;
  for (i = 0; i < this.features.length; i++) {
    this._removeFeatureFromRenderers(this.features[i]);
  }

  this.setStyle(style);

  for (i = 0; i < this.features.length; i++) {
    this._addFeatureToRenderers(this.features[i]);
  }
};

export default AbstractVectorLayer;
