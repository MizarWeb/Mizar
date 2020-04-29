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
 * layer. Once the layer is created, the client can handle it by the use of its {@link Layer interface}  or its
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
VectorLayer.prototype.getMinLevel = function () {};

/**
 * Returns the max level for which the vector is not displayed.
 * @returns {int} Returns the max level for which the vector is not displayed.
 */
VectorLayer.prototype.getMaxLevel = function () {};

/**
 * Returns the URL to get the vector data.
 * null can be returned when data is not in GeoJson format. In this case,
 * a {@link InterfaceProvider provider} is used to transform data in
 * GeoJson
 * @returns {string|undefined} the URL to get the vector data
 */
VectorLayer.prototype.getUrl = function () {};

/**
 * Returns true when data must bil filled by a {@link InterfaceProvider provider}.
 * A provider only fills the data in {@link InterfaceContext#addLayer} method.
 * @returns {boolean} true when data must be filled by a data provider otherwise false
 */
VectorLayer.prototype.isForDataProvider = function () {};

/**
 * Returns true when the vertor is not itself a data. For instance, it could be
 * represent a selection, on a distance by an arrow.
 * @returns {boolean} true when the vector is a draw otherwise false
 */
VectorLayer.prototype.isDraw = function () {};

/**
 * Sets the vector as a draw.
 * @param {boolean} value
 */
VectorLayer.prototype.setDraw = function (value) {};

/**
 * Attaches the vector layer to the globe and adds features to the renderers {@link _addFeatureToRenderers}
 * @param {AbstractGlobe} g globe
 * @private
 */
VectorLayer.prototype._attach = function (g) {};

/**
 * Detaches the vector layer from the globe ands removes features from the renderers {@link _removeFeatureFromRenderers}
 * @private
 */
VectorLayer.prototype._detach = function () {};

/**
 * {@link addFeature Adds a feature} collection, in GeoJSON format
 * @param {GeoJSON} featureCollection Feature Collection
 */
VectorLayer.prototype.addFeatureCollection = function (featureCollection) {};

/**
 * {@link removeFeature Removes a feature} collection, in GeoJSON format
 * @param {GeoJSON} featureCollection Feature Collection
 */
VectorLayer.prototype.removeFeatureCollection = function (featureCollection) {};

/**
 * Add a feature to renderers.
 * @param {GeoJSON} feature Feature
 * @private
 */
VectorLayer.prototype._addFeatureToRenderers = function (feature) {};

/**
 * Removes a feature from renderers.
 * @param {GeoJSON} feature Feature
 * @returns {boolean} true when the feature is removed from the globe otherwise false
 * @private
 */
VectorLayer.prototype._removeFeatureFromRenderers = function (feature) {};

/**
 * Add a feature to the layer
 * @param {GeoJSON} feature Feature
 */
VectorLayer.prototype.addFeature = function (feature) {};

/**
 * Removes a feature from the layer.
 * @param {GeoJSON} feature Feature
 */
VectorLayer.prototype.removeFeature = function (feature) {};

/**
 * Removes all features from the layer.
 */
VectorLayer.prototype.removeAllFeatures = function () {};

/**
 * Modifies the feature style for a specific feature.
 * @param {GeoJson} feature feature for which the feature style is modified
 * @param {FeatureStyle} style Feature style
 */
VectorLayer.prototype.modifyFeatureStyle = function (feature, style) {};

/**
 * Modifies the feature style for all features.
 * @param {FeatureStyle} style Feature style
 */
VectorLayer.prototype.modifyStyle = function (style) {};
