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

define(["jquery", "./AbstractProvider", "../Parser/JsonProcessor"],
    function ($, AbstractProvider, JsonProcessor) {

        var self;

         /**
          * @name OpenSearchProvider
          * @class
          *   OpenSearchProvider context constructor
          * @param {object} options
          * @augments AbstractProvider
          * @constructor
          * @memberOf module:Provider
          */
        var OpenSearchProvider = function (options) {
            self = this;
            AbstractProvider.prototype.constructor.call(this, options);
        };

        /***************************************************************************************************/

        /**
         * Load JSON file and call handleFeatures
         * @function loadFiles
         * @memberOf OpenSearchProvider.prototype
         * @param mizarLayer Mizar layer
         * @param configuration Url to JSON containing feature collection in equatorial coordinates
         */
        OpenSearchProvider.prototype.loadFiles = function (mizarLayer, configuration, startIndex) {
            $.ajax({
                type: "GET",
                url: configuration.url + "startIndex=" + startIndex + "&count=500",
                success: function (response) {
                    self.handleFeatures(mizarLayer, configuration, startIndex, response)
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.error(xhr.responseText);
                }
            });
        };

        /***************************************************************************************************/

        /**
         * Transform response into GeoJSON format and add to the layer
         * @function handleFeatures
         * @memberOf OpenSearchProvider.prototype
         * @param {object} mizarLayer
         * @param {object} response
         */
        OpenSearchProvider.prototype.handleFeatures = function (mizarLayer, configuration, startIndex, response) {
            JsonProcessor.handleFeatureCollection(mizarLayer, response);
            mizarLayer.addFeatureCollection(response);
            if (startIndex + response.features.length < response.totalResults) {
                self.loadFiles(mizarLayer, configuration.url, startIndex + response.features.length);
            }
        };

        /***************************************************************************************************/

        return OpenSearchProvider;

    });
