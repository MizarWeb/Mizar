/*******************************************************************************
 * Copyright 2012-2015 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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
/*global define: false */

/**
 * Tool designed to select areas on planet
 */

define(["jquery", "underscore-min", "jszip", "saveAs","../Gui/dialog/ErrorDialog", "../Utils/Constants"],
    function ($, _, JSZip, saveAs, ErrorDialog, Constants) {

        var self, mizarAPI, layers, availableLayers;

        /**************************************************************************************************************/

        /**
         *    Keep only layers having available searching services
         */
        function filterServicesAvailableOnLayers() {
            availableLayers = [];
            _.each(layers, function (layer) {
                if (layer.isVisible() && layer.category !== "Other" && layer.category !== "Solar System" &&
                    layer.getName() !== "SAMP" && layer.getName() !== "Planets") {
                    layer.layerId = _.uniqueId('layer_');
                    availableLayers.push(layer);
                }
            });
            return availableLayers;
        }

        /**************************************************************************************************************/

        /**
         * Export data included in the passed coordinates selection
         *
         * @param event.data = coordinates
         */
        function exportSelection(event) {

            self.coordinates = event.data;

            $("body").mask('Exporting data...');

            var JSZip = require("jszip");

            // creating empty archive
            var zip = new JSZip();

            // getting all visible and displayed layers
            var backgroundLayers = [];
            var dataLayers = [];
            _.each(availableLayers, function (layer) {
                if ($('#' + layer.layerId).is(':checked')) {
                    if (layer.getType() === Constants.LAYER.OpenSearch || layer.getType() === Constants.LAYER.GeoJSON) {
                        //if (layer.type === "DynamicOpenSearch") {
                        dataLayers.push(layer);
                    } else if (layer.getType() === Constants.LAYER.Hips || layer.getType() === Constants.LAYER.HipsCat) {
                        backgroundLayers.push(layer);
                    }
                }
            });

            // Adding a middle point the bbox to be sure no data/image will be omitted
            var middlePoint = [
                (self.coordinates[0][1] + self.coordinates[1][1]) / 2,
                (self.coordinates[0][0] + self.coordinates[3][0]) / 2,
                0
            ];
            self.coordinates.push(middlePoint);

            // getting data url from layer using tile and bbox coordinates
            var tileLayerFeatures = [];
            _.each(dataLayers, function (dataLayer, index) {
                for (var i = 0; i < self.coordinates.length; i++) {
                    var tile = mizarAPI.getActivatedContext().getTileManager().getVisibleTile(self.coordinates[i][0], self.coordinates[i][1]);

                    if (_.isEmpty(tile)) {
                        return;
                    }

                    var osData = tile.extension[dataLayer.extId];

                    if (!_.isEmpty(osData) && !_.isEmpty(osData.featureIds)) {
                        _.each(osData.featureIds, function (fId) {
                            var featureSet = dataLayer.featuresSet[fId];
                            if (!_.isEmpty(featureSet)) {
                                var feature = dataLayer.features[featureSet.index];

                                var isIncluded = true;
                                switch (feature.geometry.type) {
                                    case Constants.GEOMETRY.Point:
                                        isIncluded = self.checkIfPointInBbox(feature.geometry.coordinates, self.coordinates);
                                        break;

                                    case Constants.GEOMETRY.Polygon:
                                        for (var i = 0; i < feature.geometry.coordinates.length; i++) {
                                            if (!isIncluded) {
                                                return;
                                            }
                                            isIncluded = self.checkIfPointInBbox(feature.geometry.coordinates[0][i], self.coordinates);
                                        }
                                        break;
                                }
                                if (isIncluded) {
                                    // Adding layer information in order to rank data in archive
                                    feature.parentInformation = {
                                        copyright: dataLayer.copyright || "",
                                        copyrightUrl: dataLayer.copyrightUrl || "",
                                        category: dataLayer.category,
                                        name: dataLayer.name
                                    };
                                    tileLayerFeatures.push(feature);
                                }
                            }
                        });
                    }
                }
            });

            // Adding features archive
            _.each(tileLayerFeatures, function (feature) {
                var folder = zip.folder(feature.parentInformation.category + "/" + feature.parentInformation.name);

                // Adding a copyright file into each folder
                if (!_.isEmpty(feature.parentInformation.copyright) || !_.isEmpty(feature.parentInformation.copyrightUrl)) {
                    var copyright = "Copyright : " + feature.parentInformation.copyright + " - link : " + feature.parentInformation.copyrightUrl;
                    folder.file(feature.parentInformation.name + ".txt", copyright);
                }

                var featureToStringify = {
                    geometry: {
                        coordinates: feature.geometry.coordinates,
                        gid: feature.geometry.gid,
                        type: feature.geometry.type,
                        crs: {
                            type: "name",
                            properties: {
                                name: mizarAPI.getCrs().getGeoideName()
                            }
                        }
                    },
                    id: feature.id,
                    properties: feature.properties,
                    type: feature.type
                };

                folder.file(feature.properties.identifier + ".json", JSON.stringify(featureToStringify, null, '\t'));
            });


            if (backgroundLayers.length === 0) {
                self.downloadArchive(zip);
            } else {
                var numberOfImages = 0;
                var imageNotFound = false;
                // get images url from Background layer
                _.each(backgroundLayers, function (backgroundLayer, index) {
                    backgroundLayer.urlImages = [];
                    backgroundLayer.images = [];

                    for (var i = 0; i < self.coordinates.length; i++) {

                        // Retrieve the tile according to a
                        var tile = mizarAPI.getActivatedContext().getTileManager().getVisibleTile(self.coordinates[i][0], self.coordinates[i][1]);

                        if (_.isEmpty(tile)) {
                            return;
                        }

                        numberOfImages++;
                        var url = backgroundLayer.getUrl(tile);

                        var image = new Image();
                        image.aborted = false;
                        image.crossOrigin = '';
                        image.backgroundName = backgroundLayer.name;
                        image.parentFolder = backgroundLayer.category + "/" + backgroundLayer.name + "/images";
                        image.imageName = url.substring(url.lastIndexOf('/') + 1, url.length);

                        image.onload = function () {
                            self.addImageToArchive(this, zip);
                            numberOfImages--;

                            if (numberOfImages == 0) {
                                self.downloadArchive(zip);
                            }
                        };
                        image.onerror = function () {
                            imageNotFound = true;
                            console.dir('Error while retrieving image : ' + this.imageName);
                            numberOfImages--;
                            if (numberOfImages == 0) {
                                if (imageNotFound) {
                                    ErrorDialog.open("Some images not found. Change zoom level and retry downloading");
                                }

                                self.downloadArchive(zip);
                            }
                        };
                        image.src = url;
                    }
                });
            }
        }

        /**************************************************************************************************************/

        /**
         * Create a zip file containing data + readme file and download it
         *
         * @param zip
         */
        function downloadArchive(zip) {
            var saveAs = require("saveAs");

            var date = new Date();
            var currentDate = $.datepicker.formatDate('yy/mm/dd ' + date.getHours() + ":" + date.getMinutes(), date);
            var readme = "Date : " + currentDate + "\n" +
                "Query :" + JSON.stringify(self.coordinates, null, '\t') + "\n" +
                "Copyright : Generated by MIZAR";

            zip.file("README.txt", readme);

            var content = zip.generate({type: "blob"});
            saveAs(content, "archive_" + currentDate + ".zip");
            $("body").unmask();
        }

        /**************************************************************************************************************/

        /**
         * Check if given is included into the drawn bbox
         * @param point
         * @param bbox
         * @returns {boolean}
         */
        function checkIfPointInBbox(point, bbox) {
            if((point[1] >= bbox[0][1] && point[1] <= bbox[1][1]) && 
                (point[0] <= bbox[0][0] && 
                point[0] >= bbox[3][0])) {
                return true;
            } else {
                return false;
            }
        }

        /**************************************************************************************************************/

        /**
         * Add an image into the passed archive
         * @param img
         * @param zip
         */
        function addImageToArchive(img, zip) {
            var folder = zip.folder(img.parentFolder);
            folder.file(img.imageName, self.getBase64Image(img), {base64: true});
        }

        /**************************************************************************************************************/

        /**
         * Convert an image into base64
         * @param img
         * @returns {string}
         */
        function getBase64Image(img) {
            // Create an empty canvas element
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            // Copy the image contents to the canvas
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            // Get the data-URL formatted image
            // Firefox supports PNG and JPEG. You could check img.src to
            // guess the original format, but be aware the using "image/jpg"
            // will re-encode the image.
            var dataURL = canvas.toDataURL("image/png");

            return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        }

        /**************************************************************************************************************/

        return {
            /**
             *    @constructor
             *    @param options Configuration options
             *        <ul>
             *            <li>planet: planet</li>
             *            <li>layers: Layers</li>
             *        </ul>
             */
            init: function (mizar, options) {
                // Required options
                mizarAPI = mizar;
                layers = mizarAPI.getLayers(Constants.CONTEXT.Sky);
                self = this;
            },
            exportSelection: exportSelection,
            addImageToArchive: addImageToArchive,
            downloadArchive: downloadArchive,
            getBase64Image: getBase64Image,
            filterServicesAvailableOnLayers: filterServicesAvailableOnLayers
        };
    });
