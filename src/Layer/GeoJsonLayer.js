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
define([
    "../Utils/Utils",
    "./AbstractVectorLayer",
    "../Utils/Constants"
], function(Utils, AbstractVectorLayer, Constants) {
    /**
     * @name GeoJsonLayer
     * @class
     *    Create a layer to display vector data in GeoJSON format.
     * @augments AbstractVectorLayer
     * @param {AbstractLayer.geojson_configuration} options - GeoJsonLayer configuration
     * @constructor
     * @memberof module:Layer
     */
    var GeoJsonLayer = function(options) {
        AbstractVectorLayer.prototype.constructor.call(
            this,
            Constants.LAYER.GeoJSON,
            options
        );
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
        feature.geometry.gid = "GeoJSON_" + this.gid;
        this.gid++;
        return feature;
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
    GeoJsonLayer.prototype.addFeatureCollection = function(featureCollection) {
        // Note : use property defined as ['']  to avoid renaming when compiled in advanced mode with the closure compiler
        if (featureCollection == null) {
            throw new ReferenceError(
                "Error, featureCollection is null",
                "GeoJsonLayer.js"
            );
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
            for (var i = 0; i < features.length; i++) {
                this.addFeature(features[i], crs);
            }
        }
    };

    /**
     * Set data type of the GeoJSON : Point or LineString
     * @param feature
     * @memberof GeoJsonLayer#
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
     * @memberof GeoJsonLayer.prototype
     * @param {GeoJSON} feature Feature
     */
    GeoJsonLayer.prototype.addFeature = function(feature, globalCrs) {
        //feature.properties.style = this.style;
        _checkValidGeoJson.call(this, feature);

        feature = _setCrs.call(this, feature, globalCrs);

        feature = _setID.call(this, feature);

        this._setDataType(feature);

        AbstractVectorLayer.prototype.addFeature.call(this, feature);
    };

    return GeoJsonLayer;
});
