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
 * visibility:changed.<br/>
 * Called when the visibility of a layer changes
 * @event Layer#visibility:changed
 * @type {Layer}
 */

/**
 * opacity:changed.<br/>
 * Called when the opacity of a layer changes
 * @event Layer#opacity:changed
 * @type {Layer}
 */

/**
 * startLoad.<br/>
 * Called when a layer start to be loaded
 * @event Context#startLoad
 * @type {Layer}
 */

/**
 * endLoad.<br/>
 * Called when layer end loading
 * @event Context#endLoad
 * @type {Layer}
 */

/**
 * visibility:changed.<br/>
 * Called when the visibility of a layer changes
 * @event Layer#visibility:changed
 * @type {Layer}
 */

/**
 * opacity:changed.<br/>
 * Called when the opacity of a layer changes
 * @event Layer#opacity:changed
 * @type {Layer}
 */

/**
 * features:added.<br/>
 * Called when data coming from a GeoJSON are added
 * @event Context#features:added
 * @type {Object}
 * @property {Layer} layer
 * @property {Object} features
 */

/**
 * Layer is an interface to get access to the layer data model.
 *
 * In addition to the classes, a {@link module:Layer.LayerFactory factory} is available to help for creating
 * layer. Once the layer is created, the client can handle it by the use of its {@link Layer interface}.
 *
 * @see {@link module:Layer the layer package}
 * @interface
 */
function Layer() {}

Layer.prototype.hasDimension = function() {};

Layer.prototype.getDimensions = function() {};

Layer.prototype.setTime = function() {};

/**
 * Returns the metadata form the API.
 * @return {Object} metadata
 */
Layer.prototype.getMetadataAPI = function() {};

/**
 * Returns the globe.
 * @return {Globe}
 */
Layer.prototype.getGlobe = function() {};

/**
 * Returns the identifier.
 * @return {string}
 */
Layer.prototype.getID = function() {};

/**
 * Returns the layer's name.
 * @return {string}
 */
Layer.prototype.getName = function() {};

/**
 * Returns the information type of the layer.
 * @return {INFORMATION_TYPE}
 */
Layer.prototype.getInformationType = function() {};

/**
 * Returns the attribution
 * @return {string}
 */
Layer.prototype.getAttribution = function() {};

/**
 * Returns the copyright URL
 * @return {string}
 */
Layer.prototype.getCopyrightUrl = function() {};

/**
 * Returns the acknowledgement.
 * @return {string}
 */
Layer.prototype.getAck = function() {};

/**
 * Returns the layer description.
 * @return {string}
 */
Layer.prototype.getDescription = function() {};

/**
 * Check whether the layer is visible.
 * @return {boolean}
 */
Layer.prototype.isVisible = function() {};

/**
 * Sets the layer on the top.
 */
Layer.prototype.setOnTheTop = function() {};

/**
 * Sets visible the layer.
 * @param {Boolean} arg - true when the layer is displayed on the globe otherwise false
 * @fires Layer#visibility:changed
 * @throws {TypeError} Will throw an error when arg is not a boolean
 */
Layer.prototype.setVisible = function(arg) {};

/**
 * Returns the opacity.
 * @return {float} A value between [0..1]
 */
Layer.prototype.getOpacity = function() {};

/**
 * Sets the opacity.
 * @param {float} arg - A value between [0..1], 0 is transparent
 * @fires Layer#opacity:changed
 * @throws {TypeError} Will throw an error when arg is not a number in [0..1]
 */
Layer.prototype.setOpacity = function(arg) {};

/**
 * Returns the properties.
 * @return {Object} properties
 */
Layer.prototype.getProperties = function() {};

/**
 * Returns the type of layer
 * @return {string}
 */
Layer.prototype.getType = function() {};

/**
 * Checks whether the layer is pickable
 * @return {boolean}
 */
Layer.prototype.isPickable = function() {};

/**
 * Check the type of the layer
 * @param {string} type Type to check
 * @return {boolean} Result
 */
Layer.prototype.isType = function(type) {};

/**
 * Returns the services related to the layer
 * @return {string[]}
 */
Layer.prototype.getServices = function() {};

/**
 * Returns the data type for vector layers.
 * @return {GEOMETRY}
 */
Layer.prototype.getDataType = function() {};

/**
 * Returns the format for raster layer
 * @returns {string} the format
 */
Layer.prototype.getFormat = function() {};

/**
 * Returns the coordinate reference system of the layer.
 * @returns {Crs} the coordinate reference system of the layer
 */
Layer.prototype.getCoordinateSystem = function() {};

/**
 * Returns the base URL
 * @returns {string} the base URL
 */
Layer.prototype.getBaseUrl = function() {};

/**
 * Returns true when the layer is deletable by the client
 * @returns {boolean} true when the layer is deletable by the client otherwise false
 */
Layer.prototype.isDeletable = function() {};

/**
 * Returns the style.
 * @returns {FeatureStyle} the style
 */
Layer.prototype.getStyle = function() {};

/**
 * Sets the vector layer style.
 * @function setStyle
 * @param {FeatureStyle} arg Feature style
 */
Layer.prototype.setStyle = function(arg) {};

/**
 * Returns true when the layer is set as background otherwise false.
 * @returns {Boolean} true when the layer is set as background otherwise false
 */
Layer.prototype.isBackground = function() {};

/**
 * Returns true when at least on service related to this whole layer is loaded otherwise false.
 * A service is a layer which is created from this layer.
 * @returns {Boolean} true when at least on service related to this whole layer is loaded otherwise false
 */
Layer.prototype.hasServicesRunningOnCollection = function() {};

/**
 * Returns the loaded services related to the whole layer.
 * When no loaded services, an empty array is returned.
 * @returns {Array<Layer>} an array of loaded services related to the whole layer.
 */
Layer.prototype.getServicesRunningOnCollection = function() {};

/**
 * Adds a reference to loaded service related to the collection.
 * @param {String|Array<String>} layerIDs services related to the collection
 * @returns {Boolean} true when the references are added otherwise false
 * @protected
 */
Layer.prototype.addServicesRunningOnCollection = function(layerIDs) {};

/**
 * Removes all loaded services on collection.
 * @returns {Boolean} frue when all loaded services on the collection are unloaded otherwise false
 * @protected
 * @fires Context#layer:removed
 */
Layer.prototype.removeServicesRunningOnCollection = function() {};

/**
 * Returns true when at least one service related to a record of this layer is loaded otherwise false.
 * A service is a layer which is created from this layer.
 * @returns {Boolean} true when at least one service related to a record of this layer is loaded otherwise false
 */
Layer.prototype.hasServicesRunningOnRecords = function() {};

/**
 * Returns the loaded services related to a record of this layer.
 * When no loaded services, an empty array is returned.
 * @returns {Array<Layer>} an array of loaded services related to a record of this layer.
 */
Layer.prototype.getServicesRunningOnRecords = function() {};

/**
 * Removes all loaded services on records.
 * @returns {Boolean} true when all loaded services on records are unloaded otherwise false
 * @protected
 */
Layer.prototype.removeServicesRunningOnRecords = function() {};

/**
 * Returns true when at least one service is related to a record otherwise false.
 * A service is a layer which is created from this layer.
 * @param {string} featureID Record ID
 * @returns {Boolean} true when when at least one service is related to a featureID otherwise false
 */
Layer.prototype.hasServicesRunningOnRecord = function(featureID) {};

/**
 * Returns an array of layerID related to a record.
 * @param {string} featureID Record ID
 * @returns {Array<Layer>} layers related to the featureID
 */
Layer.prototype.getServicesRunningOnRecord = function(featureID) {};

/**
 * Adds a reference to loaded services related to a record
 * @param {string} featureID record ID from which services are loaded
 * @param {String|Array<String>} layerIDs services related to a record
 * @returns {Boolean} true when the references are added otherwise false
 * @protected
 */
Layer.prototype.addServicesRunningOnRecord = function(featureID, layerIDs) {};

/**
 * Removes loaded services on a record.
 * @param {string} featureID
 * @returns {Boolean} true when all loaded services related to a record are unloaded otherwise false
 * @protected
 */
Layer.prototype.removeServicesRunningOnRecord = function(featureID) {};

/**
 * Returns true when the layer is a vector otherwise false when this is a raster.
 * @returns {Boolean} true when the layer is a vector otherwise false when this is a raster.
 */
Layer.prototype.isVectorLayer = function() {};

/**
 * Attachs the raster layer to the planet.
 * @param {Globe} g - globe
 * @protected
 */
Layer.prototype._attach = function(g) {};

/**
 * Detaches the vector layer from the planet.
 * @protected
 */
Layer.prototype._detach = function() {};
