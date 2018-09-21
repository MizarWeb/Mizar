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

define([
    "jquery",
    "./AbstractProvider",
    "../Renderer/FeatureStyle",
    "../Utils/Utils",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog"
], function($, AbstractProvider, FeatureStyle, Utils, Constants, ErrorDialog) {
    var namesFile;
    var catalogueFile;
    var self;

    /*
         * 	Failure function
         */
    function failure() {
        ErrorDialog.open(Constants.LEVEL.ERROR, 'Failed ot load files in StarProvider');
    }

    /**
     * @name StarProvider
     * @class
     *    Specific star catalogue provider of the Brightest Stars (Ochsenbein+ 1988) from VizieR database
     * @param {object} options
     * @augments AbstractProvider
     * @constructor
     * @memberof module:Provider
     * @see Search Catalogue of the Brightest Stars (Ochsenbein+ 1988) in VizieR database for more details
     */
    var StarProvider = function(options) {
        AbstractProvider.prototype.constructor.call(this, options);
        self = this;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractProvider, StarProvider);

    /**************************************************************************************************************/

    /**
     * Asynchronous requests to load star database
     * @function loadFiles
     * @memberof StarProvider.prototype
     * @param {Layer} mizarLayer - Mizar layer
     * @param {Object} configuration - Configuration options
     * @param {string} configuration.nameUrl - Url providing the stars name data
     * @param {string} configuration.catalogueUrl - Url providing all information about each star
     */
    StarProvider.prototype.loadFiles = function(mizarLayer, configuration) {
        if (configuration.nameUrl && configuration.catalogueUrl) {
            var nameRequest = {
                type: "GET",
                url: configuration.nameUrl,
                success: function(response) {
                    namesFile = response;
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    ErrorDialog.open(Constants.LEVEL.ERROR, 'Failed ot request '+configuration.nameUrl, xhr.responseText);
                }
            };

            var catalogueRequest = {
                type: "GET",
                url: configuration.catalogueUrl,
                success: function(response) {
                    catalogueFile = response;
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    ErrorDialog.open(Constants.LEVEL.ERROR, 'Failed ot request '+configuration.catalogueUrl, xhr.responseText);
                }
            };

            // Synchronizing two asynchronious requests with the same callback
            $.proxy(
                $.when($.ajax(nameRequest), $.ajax(catalogueRequest)).then(
                    function() {
                        self.handleFeatures(mizarLayer);
                    },
                    failure
                )
            );
        } else {
            ErrorDialog.open(Contants.LEVEL.WARNING, "Not valid options for StarProvider", "nameUrl and catalogueUrl attributes must be passed"); 
            return false;
        }
    };

    /**
     * @function handleFeatures
     * @memberof StarProvider#
     */
    StarProvider.prototype.handleFeatures = function(mizarLayer) {
        // Extract the table data
        var tmpTab = namesFile.slice(
            namesFile.indexOf("897;Acamar"),
            namesFile.indexOf("1231;Zaurak") + 11
        );
        var namesTab = tmpTab.split("\n");
        tmpTab = catalogueFile.slice(
            catalogueFile.indexOf("001."),
            catalogueFile.indexOf("4.98;K3Ibv") + 10
        );
        var catalogueTab = tmpTab.split("\n");
        var pois = [];

        // For each known star
        for (var i = 0; i < namesTab.length; i++) {
            var word = namesTab[i].split(";"); // word[0] = HR, word[1] = name;
            var HR = parseInt(word[0], 10);
            var starName = word[1];

            // Search corresponding HR in catalogue
            for (var j = 0; j < catalogueTab.length; j++) {
                word = catalogueTab[j].split(";");
                if (parseInt(word[2], 10) === HR) {
                    // Star found in the catalogue

                    var raString = word[6]; // right ascension format : "hours minutes seconds"
                    var declString = word[7]; // declinaton format : "degrees minutes seconds"

                    var geo = [];
                    mizarLayer.globe
                        .getCoordinateSystem()
                        .getDecimalDegFromSexagesimal(
                            [raString, declString],
                            geo
                        );

                    // Add poi layer
                    var poi = {
                        geometry: {
                            type: Constants.GEOMETRY.Point,
                            gid: "star_" + starName,
                            coordinates: [geo[0], geo[1]],
                            crs: {
                                type: "name",
                                properties: {
                                    name: Constants.CRS.Equatorial
                                }
                            }
                        },
                        properties: {
                            name: starName,
                            style: new FeatureStyle({
                                label: starName,
                                fillColor: [1.0, 1.0, 1.0, 1.0]
                            })
                        }
                    };
                    pois.push(poi);
                }
            }
        }

        // Create feature collection
        var poiFeatureCollection = {
            type: "FeatureCollection",
            features: pois
        };

        mizarLayer.addFeatureCollection(poiFeatureCollection);
    };

    /**************************************************************************************************************/

    return StarProvider;
});
