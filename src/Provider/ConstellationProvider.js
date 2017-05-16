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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
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

define(["jquery", "./AbstractProvider", "../Renderer/FeatureStyle", "../Utils/Utils","../Utils/Constants"],
    function ($, AbstractProvider, FeatureStyle, Utils, Constants) {

        /**************************************************************************************************************/

        var namesFile;
        var catalogueFile;

        var constellations = {};
        var self;

        /**
         *    Extract information in "constellation" variables
         */
        function extractDatabase(mizarLayer) {
            var constellationNamesTab = namesFile.split("\n");
            var catalogueTab = catalogueFile.split("\n");

            // For each constellation point
            for (var i = 0; i < catalogueTab.length; i++) {
                var word = catalogueTab[i].replace("  ", " ");
                word = word.split(" "); // word = "RA Decl Abbreviation "I"/"O"(Inerpolated/Original(Corner))"
                var RA = parseFloat(word[0]);
                var Decl = parseFloat(word[1]);
                var currentAbb = word[2];
                var IO = word[3];

                // Convert hours to degrees
                RA *= 15;

                // If abbreviation doesn't exist
                if (!constellations[currentAbb]) {
                    // Find constellation name
                    for (var j = 0; j < constellationNamesTab.length; j++) {
                        word = constellationNamesTab[j].split(";"); // word[0] = abbreviation, word[1] = name;
                        var abb = word[0];

                        if (abb === currentAbb) {
                            var name = word[1];

                            // Add new constellation as a property
                            constellations[currentAbb] = {
                                coord: [],
                                name: name,

                                // Values used to calculate the position of the center of constellation
                                x: 0.0,
                                y: 0.0,
                                z: 0.0,
                                nbStars: 0
                            };
                            break;
                        }
                    }
                }

                // Convert to default coordinate system
                var posGeo = [RA, Decl];

                // Calculate the center of constillation
                var pos3d = [];
                // Need to convert to 3D because of 0h -> 24h notation
                mizarLayer.globe.getCoordinateSystem().get3DFromWorldInCrs(posGeo, Constants.CRS.Equatorial, pos3d);
                constellations[currentAbb].x += pos3d[0];
                constellations[currentAbb].y += pos3d[1];
                constellations[currentAbb].z += pos3d[2];
                constellations[currentAbb].nbStars++;

                constellations[currentAbb].coord.push(posGeo);
            }
        }

        /*
         * 	Failure function
         */
        function failure() {
            console.error("Failed to load files");
        }
        
        /**
         * @name ConstellationProvider
         * @class
         *   ConstellationProvider context constructor
         * @param {object} options
         * @augments AbstractProvider
         * @constructor
         * @memberOf module:Provider
         */
        var ConstellationProvider = function (options) {
            AbstractProvider.prototype.constructor.call(this, options);
            self = this;
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractProvider, ConstellationProvider);

        /**************************************************************************************************************/

        /**
         * Asynchronous request to load constellation data
         * @function loadFiles
         * @memberOf ConstellationProvider#
         * @param {Layer} layer - Mizar layer
         * @param {Object} configuration - Configuration options
         * @param {string} configuration.nameUrl - Url providing the constellations name data
         * @param {string} configuration.catalogueUrl - Url providing all information about each constellation
         * @see http://vizier.cfa.harvard.edu/viz-bin/ftp-index?VI/49
         */
        ConstellationProvider.prototype.loadFiles = function (layer, configuration) {
            var mizarLayer = layer;
            if (configuration.nameUrl && configuration.catalogueUrl) {
                // loadFiles( configuration.nameUrl, configuration.catalogueUrl );
                var nameRequest = {
                    type: "GET",
                    url: configuration.nameUrl,
                    success: function (response) {
                        namesFile = response;
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.error(xhr.responseText);
                    }
                };

                var catalogueRequest = {
                    type: "GET",
                    url: configuration.catalogueUrl,
                    success: function (response) {
                        catalogueFile = response;
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.error(xhr.responseText);
                    }
                };

                // Synchronizing two asynchronious requests with the same callback
                $.when($.ajax(nameRequest), $.ajax(catalogueRequest))
                    .then(function () {
                        extractDatabase(mizarLayer);
                        self.handleFeatures(mizarLayer);
                    }, failure);
            }
            else {
                console.error("Not valid options");
                return false;
            }
        };

        
        ConstellationProvider.prototype.handleFeatures = function (mizarLayer) {

            var constellationNamesFeatures = [];
            var constellationShapesFeatures = [];

            // Fill constellationShapes & constellationNames
            for (var i in constellations) {
                if (constellations.hasOwnProperty(i)) {
                    var current = constellations[i];

                    // Close the polygon
                    current.coord.push(current.coord[0]);

                    var constellationShape = {
                        geometry: {
                            type: Constants.GEOMETRY.Polygon,
                            gid: "constellationShape_" + current.name,
                            coordinates: [current.coord],
                            crs: {
                                type: "name",
                                properties: {
                                    name: Constants.CRS.Equatorial
                                }
                            }
                        },
                        properties: {
                            name: current.name
                        }
                    };

                    constellationShapesFeatures.push(constellationShape);

                    // Compute mean value to show the constellation name in the center of constellation..
                    // .. sometimes out of constellation's perimeter because of the awkward constellation's shape(ex. "Hydra" or "Draco" constellations)
                    var geoPos = [];
                    mizarLayer.globe.getCoordinateSystem().getWorldFrom3D([current.x / current.nbStars, current.y / current.nbStars, current.z / current.nbStars], geoPos);

                    var constellationName = {
                        geometry: {
                            type: Constants.GEOMETRY.Point,
                            gid: "constellationName_" + current.name,
                            coordinates: [geoPos[0], geoPos[1]],
                            crs: {
                                type: "name",
                                properties: {
                                    name: Constants.CRS.Equatorial
                                }
                            }
                        },
                        properties: {
                            name: current.name,
                            style: new FeatureStyle({
                                textColor: '#083BA8',
                                fillColor: [1.0, 1.0, 1.0, 1.0],
                                label: current.name
                            })
                        }
                    };
                    constellationNamesFeatures.push(constellationName);
                }
            }

            // Create feature collections
            var constellationShapesFeatureCollection = {
                type: "FeatureCollection",
                features: constellationShapesFeatures
            };
            var constellationNameFeatureCollection = {
                type: "FeatureCollection",
                features: constellationNamesFeatures
            };

            // Add shapes&names to the layer
            mizarLayer.addFeatureCollection(constellationShapesFeatureCollection);
            mizarLayer.addFeatureCollection(constellationNameFeatureCollection);
        };

        /**************************************************************************************************************/

        return ConstellationProvider;

    });
