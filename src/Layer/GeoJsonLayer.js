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
import AbstractVectorLayer from "./AbstractVectorLayer";
import Constants from "../Utils/Constants";
/**
 * @name GeoJsonLayer
 * @class
 *    Create a layer to display vector data in GeoJSON format.
 * @augments AbstractVectorLayer
 * @param {AbstractLayer.geojson_configuration} options - GeoJsonLayer configuration
 * @constructor
 * @memberof module:Layer
 */
var GeoJsonLayer = function (options) {
  AbstractVectorLayer.prototype.constructor.call(this, Constants.LAYER.GeoJSON, options);
  this.gid = 0;
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
  if (!feature.geometry.crs) {
    feature.geometry.crs = globalCrs
      ? globalCrs
      : {
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
  feature.geometry.gid = this.ID + "_GeoJSON_" + this.gid;
  this.gid++;
  return feature;
}

/**
 * Checks whether a geometry type such a point has a geometry.
 * @param {Object} geometry
 * @returns {Boolean} true when the point has an altitude otherwse false
 * @private
 */
function _hasPointAltitude(geometry) {
  return geometry.type === Constants.GEOMETRY.Point && geometry.coordinates.length == 3;
}

/**************************************************************************************************************/

Utils.inherits(AbstractVectorLayer, GeoJsonLayer);

/**************************************************************************************************************/

/**
 * Adds a feature collection, in GeoJSON format
 * @function addFeatureCollection
 * @memberof GeoJsonLayer#
 * @param {GeoJSON} featureCollection Feature Collection
 * @throws {ReferenceError} Error, featureCollection is null
 */
GeoJsonLayer.prototype.addFeatureCollection = function (featureCollection) {
  // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
  if (featureCollection == null) {
    throw new ReferenceError("Error, featureCollection is null", "GeoJsonLayer.js");
  }

  var defaultCrs = {
    type: "name",
    properties: {
      name: Constants.CRS.WGS84
    }
  };

  //check if crs is global at the featureCollection
  var crs = featureCollection.crs ? featureCollection.crs : defaultCrs;

  var features = featureCollection.features;
  if (features) {
    var bbox = [Number.MAX_VALUE, Number.MAX_VALUE, -1 * Number.MAX_VALUE, -1 * Number.MAX_VALUE];
    for (var i = 0; i < features.length; i++) {
      this.addFeature(features[i], crs);
      var tmpBox = Utils.getBBox(features[i].geometry);
      bbox[0] = Math.min(bbox[0], tmpBox.west);
      bbox[1] = Math.min(bbox[1], tmpBox.south);
      bbox[2] = Math.max(bbox[2], tmpBox.east);
      bbox[3] = Math.max(bbox[3], tmpBox.north);
    }
    // When there is an altitude for a geometry type as point, set this option to make possible
    // intersection algorithm
    if (_hasPointAltitude(features[0].geometry)) {
      this.pickingNoDEM = true;
    }
    this.options.properties = {
      bbox: bbox,
      initialRa: (bbox[0] + bbox[2]) * 0.5,
      initialDec: (bbox[1] + bbox[3]) * 0.5
    };
    this.properties = this.options.properties;
  }
};

/**
 * Set data type of the GeoJSON : Point or LineString
 * @param feature
 * @memberof GeoJsonLayer#
 * @private
 */
GeoJsonLayer.prototype._setDataType = function (feature) {
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
 * @memberof GeoJsonLayer.prototype
 * @param {GeoJSON} feature Feature
 */
GeoJsonLayer.prototype.addFeature = function (feature, globalCrs) {
  //feature.properties.style = this.style;
  _checkValidGeoJson.call(this, feature);

  feature = _setCrs.call(this, feature, globalCrs);

  feature = _setID.call(this, feature);

  this._setDataType(feature);

  AbstractVectorLayer.prototype.addFeature.call(this, feature);
};

export default GeoJsonLayer;
