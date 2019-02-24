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
    "jquery",
    "underscore-min",
    "../Utils/Utils",
    "../Utils/Numeric",
    "./AbstractNameResolver",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog"
], function(
    $,
    _,
    Utils,
    Numeric,
    AbstractNameResolver,
    Constants,
    ErrorDialog
) {
    var dictionary;

    /**
     * In case if base url isn't a service but a json containing all known places
     * this method allows to retrieve it
     */
    var retrieveDictionary = function(context) {
        var containsDictionary = context.getContextConfiguration().nameResolver.baseUrl.indexOf("json") >= 0;
        if (containsDictionary) {
            // Dictionary as json
            var marsResolverUrl = context.getContextConfiguration().nameResolver.baseUrl;             

            Utils.requestUrl(marsResolverUrl, "json", "application/json",null,
                function(response) {
                    dictionary = response;
                },
                function(err) {
                    ErrorDialog.open(
                        Constants.LEVEL.ERROR,
                        "Failed ot request " + marsResolverUrl,
                        err
                    );
                }
            );
        } else {
            dictionary = null;
        }
    };

    /**************************************************************************************************************/
    /**
     * @name DictionaryNameResolver
     * @class
     *      Plugin to access to the dictionary name resolver
     * @augments AbstractNameResolver
     * @param {Context} options - Configuration properties
     * @memberof module:NameResolver
     * @constructor
     */
    var DictionaryNameResolver = function(options) {
        AbstractNameResolver.prototype.constructor.call(this, options);
        retrieveDictionary(options);
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractNameResolver, DictionaryNameResolver);

    function _computeDistance(pt1, pt2) {
        var pt = [
            parseFloat(pt2[0]) - parseFloat(pt1[0]),
            parseFloat(pt2[1]) - parseFloat(pt1[1])
        ];
        return Math.sqrt(pt[0] * pt[0] + pt[1] * pt[1]);
    }

    function _farestDistance(center, pts) {
        var distance = 0;
        for (var i = 0; i < pts.length; i++) {
            var newDistance = _computeDistance.call(this, center, pts[i]);
            if (newDistance > distance) {
                distance = newDistance;
            }
        }
        return distance;
    }

    function _computeFarestDistanceAlongLineString(center, pts) {
        return _farestDistance.call(this, center, pts);
    }

    function _addPoint(p1, p2) {
        return [
            parseFloat(p1[0]) + parseFloat(p2[0]),
            parseFloat(p1[1]) + parseFloat(p2[1])
        ];
    }

    function _computeLineStringBarycenter(pts) {
        var center = pts[0];
        for (var i = 1; i < pts.length; i++) {
            center = _addPoint.call(this, center, pts[i]);
        }
        center = [center[0] / pts.length, center[1] / pts.length];
        return center;
    }

    function _computeBarycenterAndDistance(geometry) {
        var type = geometry.type;
        var coordinates = geometry.coordinates;
        var center;
        var distance;
        var nbPts = null;
        var tmpCenter = null;
        var newDistance = null;
        switch (type) {
        case "Point":
            center = coordinates;
            distance = null;
            break;
        case "LineString":
            center = _computeLineStringBarycenter.call(this, coordinates);
            distance = _computeFarestDistanceAlongLineString.call(
                this,
                center,
                coordinates
            );
            break;
        case "Polygon":
            var exteriorRing = coordinates[0];
            center = _computeLineStringBarycenter.call(this, exteriorRing);
            distance = _computeFarestDistanceAlongLineString.call(
                this,
                center,
                exteriorRing
            );
            break;
        case "MultiPoint":
            center = _computeLineStringBarycenter.call(this, coordinates);
            distance = _computeFarestDistanceAlongLineString.call(
                this,
                center,
                coordinates
            );
            break;
        case "MultiLineString":
            var lineStringArray = coordinates[0];
            center = _computeLineStringBarycenter.call(
                this,
                lineStringArray[0]
            );
            center[0] = center[0] * lineStringArray[0].length;
            center[1] = center[1] * lineStringArray[0].length;
            nbPts = 0;
            for (var i = 1; i < lineStringArray.length; i++) {
                tmpCenter = _computeLineStringBarycenter.call(
                    this,
                    lineStringArray[i]
                );
                tmpCenter[0] = tmpCenter[0] * lineStringArray[i].length;
                tmpCenter[1] = tmpCenter[1] * lineStringArray[i].length;
                nbPts = nbPts + lineStringArray[i].length;
                center = _addPoint(center, tmpCenter);
            }
            center[0] = center[0] / nbPts;
            center[1] = center[1] / nbPts;

            distance = 0;
            for (i = 0; i < lineStringArray.length; i++) {
                newDistance = _farestDistance.call(
                    this,
                    center,
                    lineStringArray[i]
                );
                if (newDistance > distance) {
                    distance = newDistance;
                }
            }
            break;
        case "MultiPolygon":
            var polygonArray = coordinates[0];
            center = _computeLineStringBarycenter.call(
                this,
                polygonArray[0][0]
            );
            center[0] = center[0] * polygonArray[0][0].length;
            center[1] = center[1] * polygonArray[0][0].length;
            nbPts = 0;
            for (i = 1; i < polygonArray.length; i++) {
                tmpCenter = _computeLineStringBarycenter.call(
                    this,
                    polygonArray[i][0]
                );
                tmpCenter[0] = tmpCenter[0] * polygonArray[i][0].length;
                tmpCenter[1] = tmpCenter[1] * polygonArray[i][0].length;
                nbPts = nbPts + polygonArray[i][0].length;
                center = _addPoint.call(this, center, tmpCenter);
            }
            center[0] = center[0] / nbPts;
            center[1] = center[1] / nbPts;
            distance = 0;
            for (i = 0; i < polygonArray.length; i++) {
                newDistance = _farestDistance.call(
                    this,
                    center,
                    polygonArray[i][0]
                );
                if (newDistance > distance) {
                    distance = newDistance;
                }
            }
            break;
        default:
            throw "geometry " + type + " is not supported";
        }
        return [center, distance];
    }

    /**
     * Queries the GeoJSON passed in parameter in the Mizar options
     * @function handle
     * @memberof DictionaryNameResolver#
     */
    DictionaryNameResolver.prototype.handle = function(options) {
        var context = this.ctx;
        var crs = this.ctx.getCoordinateSystem();
        var objectName = options.objectName;
        var onError = options.onError;
        //var onComplete = options.onComplete;
        var onSuccess = options.onSuccess;
        var searchLayer = options.searchLayer;
        var zoomTo = options.zoomTo;

        // Planet resolver(Mars only currently)
        var feature = _.find(dictionary.features, function(f) {
            var name = f.properties.Name == undefined ? f.properties.name : f.properties.Name;
            var isFound;
            if (name == null) {
                isFound = false;
            } else {
                isFound = name.toLowerCase() === objectName.toLowerCase();
            }
            return isFound;
        });

        if (feature) {
            var lon;
            var lat;
            var distance;
            if (feature.properties.center_lon == undefined || feature.properties.center_lat == undefined) {
                var centerAndDistance = _computeBarycenterAndDistance.call(
                    this,
                    feature.geometry
                );
                lon = parseFloat(centerAndDistance[0][0]);
                lat = parseFloat(centerAndDistance[0][1]);
                distance = centerAndDistance[1];
            } else {
                lon = parseFloat(feature.properties.center_lon);
                lat = parseFloat(feature.properties.center_lat);
                distance = null;
            }

            feature.geometry.crs = {
                type: "name",
                properties: {
                    name: context.getCoordinateSystem().getGeoideName()
                }
            };
            var zoomToCallback = function() {
                searchLayer(objectName, onSuccess, onError, {
                    features: [feature]
                });
            };

            var fov = context.getRenderContext().getFov();

            var distanceCamera;
            if (distance == null) {
                distanceCamera = null;
            } else {
                distance = distance > 180.0 ? 180.0 : distance;
                // aproximation of the distance in meters
                distance =(2 * Math.PI * crs.getGeoide().getRealPlanetRadius() * distance) / 360;
                distanceCamera = distance / Math.tan(Numeric.toRadian(0.5 * fov));
            }

            zoomTo(
                lon,
                lat,
                distanceCamera,
                crs.getGeoideName(),
                zoomToCallback,
                { features: [feature] }
            );
        } else {
            searchLayer(objectName, onSuccess, onError);
        }
    };

    /**
     * Code to execute when remove
     * @function remove
     * @memberof DictionaryNameResolver#
     */
    DictionaryNameResolver.prototype.remove = function() {
        dictionary = null;
    };

    return DictionaryNameResolver;
});
