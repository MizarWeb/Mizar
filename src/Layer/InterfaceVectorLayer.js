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

/**
 * RasterLayer is an interface to get access to the raster layer data model.
 *
 * In addition to the classes, a {@link module:Layer.LayerFactory factory} is available to help for creating
 * layer. Once the layer is created, the client can handle it by the use of its {@link VectorLayer interface} or its
 * {@link VectorLayer interface} .
 *
 * @see {@link module:Layer the layer package}
 * @interface
 * @extends {Layer}
 */
function VectorLayer() {}

/**
 * Returns the min level for which the vector is displayed.
 * @returns {int} Returns the min level for which the vector is displayed.
 */
AbstractVectorLayer.prototype.getMinLevel = function() {};

/**
 * Returns the max level for which the vector is not displayed.
 * @returns {int} Returns the max level for which the vector is not displayed.
 */
AbstractVectorLayer.prototype.getMaxLevel = function() {};

/**
 * Returns the URL to get the vector data.
 * @returns {String} the URL to get the vector data
 */
AbstractVectorLayer.prototype.getUrl = function() {};

/**
 * Attaches the vector layer to the globe and adds features to the renderers {@link _addFeatureToRenderers}
 * @param {AbstractGlobe} g globe
 * @private
 */
AbstractVectorLayer.prototype._attach = function(g) {};

/**
 * Detaches the vector layer from the globe ands removes features from the renderers {@link _removeFeatureFromRenderers}
 * @private
 */
AbstractVectorLayer.prototype._detach = function() {};

/**
 * {@link addFeature Adds a feature} collection, in GeoJSON format
 * @param {GeoJSON} featureCollection Feature Collection
 */
AbstractVectorLayer.prototype.addFeatureCollection = function(
    featureCollection
) {};

/**
 * {@link removeFeature Removes a feature} collection, in GeoJSON format
 * @param {GeoJSON} featureCollection Feature Collection
 */
AbstractVectorLayer.prototype.removeFeatureCollection = function(
    featureCollection
) {};

/**
 * Add a feature to renderers.
 * @param {GeoJSON} feature Feature
 * @private
 */
AbstractVectorLayer.prototype._addFeatureToRenderers = function(feature) {};

/**
 * Removes a feature from renderers.
 * @param {GeoJSON} feature Feature
 * @returns {boolean} True when the feature is removed from the globe otherwise False
 * @private
 */
AbstractVectorLayer.prototype._removeFeatureFromRenderers = function(
    feature
) {};

/**
 * Add a feature to the layer
 * @param {GeoJSON} feature Feature
 */
AbstractVectorLayer.prototype.addFeature = function(feature) {};

/**
 * Removes a feature from the layer.
 * @param {GeoJSON} feature Feature
 */
AbstractVectorLayer.prototype.removeFeature = function(feature) {};

/**
 * Removes all features from the layer.
 */
AbstractVectorLayer.prototype.removeAllFeatures = function() {};

/**
 * Modifies the feature style for a specific feature.
 * @param {GeoJson} feature feature for which the feature style is modified
 * @param {FeatureStyle} style Feature style
 */
AbstractVectorLayer.prototype.modifyFeatureStyle = function(feature, style) {};

/**
 * Modifies the feature style for all features.
 * @param {FeatureStyle} style Feature style
 */
AbstractVectorLayer.prototype.modifyStyle = function(style) {};
