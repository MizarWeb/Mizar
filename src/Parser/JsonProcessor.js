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

/*global define: false */

/**
 *    JSON processor module
 *
 *    Module processing feature collection
 *
 */
define([
    "../Layer/HipsGraphicLayer",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog",
    "../Crs/CoordinateSystemFactory"
], function(HipsLayer, Constants, ErrorDialog, CoordinateSystemFactory) {
    var gid = 0;

    /**
     * Handle services of feature
     * @fires Context#layer:add
     */
    function handleServices(gwLayer, feature) {
        for (var x in feature.services) {
            var service = feature.services[x];
            if (!gwLayer.subLayers) {
                gwLayer.subLayers = [];
            }
            switch (service.type) {
            case Constants.LAYER.Hips:
                service.layer = new HipsLayer({
                    format: service.format,
                    baseUrl: service.url,
                    name: service.name,
                    visible: false,
                    coordinates: feature.geometry.coordinates[0]
                });
                gwLayer.subLayers.push(service.layer);
                if (gwLayer.planet && gwLayer.visible()) {
                    // Add sublayer to engine
                    gwLayer.planet.addLayer(service.layer);
                }
                break;
            default:
                break;
            }
        }
    }

    return {
        /**
         *    Handles feature collection
         *    Recompute geometry from equatorial coordinates to geo for each feature
         *    Handle feature services
         *    Add gid
         *
         *    @param gwLayer Layer of feature
         *    @param featureCollection GeoJSON FeatureCollection
         *    @fires Context#layer:add
         *
         */
        handleFeatureCollection: function(gwLayer, featureCollection) {
            // Default CRS according to GeoJSON specification
            var defaultCrs = {
                type: "name",
                properties: {
                    name: Constants.CRS.WGS84
                }
            };

            if (featureCollection === null || featureCollection === undefined) {
                throw new ReferenceError(
                    "Error, featureCollection is null",
                    "JsonProcessor.js"
                );
            }

            //check if crs is global at the featureCollection
            var crs = featureCollection.crs
                ? featureCollection.crs
                : defaultCrs;

            gwLayer.coordinateSystem = CoordinateSystemFactory.create({
                geoideName: crs.properties.name
            });

            var features = featureCollection.features;
            if (features === null || features === undefined) {
                ErrorDialog.open(Constants.LEVEL.ERROR, "Error, no feature in featureCollection : ", featureCollection);
                return;
            }
            var i, j, r;

            for (i = 0; i < features.length; i++) {
                var currentFeature = features[i];

                switch (currentFeature.geometry.type) {
                case Constants.GEOMETRY.Point:
                    if (!gwLayer.dataType) {
                        gwLayer.dataType = "point";
                    } else {
                        if (gwLayer.dataType !== "point") {
                            gwLayer.dataType = "none";
                        }
                    }
                    break;
                case Constants.GEOMETRY.Polygon:
                case Constants.GEOMETRY.MultiPolygon:
                    if (!gwLayer.dataType) {
                        gwLayer.dataType = "line";
                    } else {
                        if (gwLayer.dataType !== "line") {
                            gwLayer.dataType = "none";
                        }
                    }

                    if (currentFeature.properties._imageCoordinates) {
                        // Set _imageCoordinates as geometry's property (may be modified later)
                        currentFeature.geometry._imageCoordinates =
                                currentFeature.properties._imageCoordinates;
                    }

                    break;
                default:
                    break;
                }
                if (!currentFeature.geometry.crs) {
                    currentFeature.geometry.crs = crs;
                }
                currentFeature.geometry.gid = "jsonProc_" + gid;
                gid++;

                if (currentFeature.services) {
                    handleServices(gwLayer, currentFeature);
                }
            }
        }
    };
});
