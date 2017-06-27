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
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
define(["jquery", "underscore-min", "../Utils/Utils", "./AbstractNameResolver"],
    function ($, _, Utils, AbstractNameResolver) {

        /**************************************************************************************************************/

         /**
          * @name DefaultNameResolver
          * @class
          *  Plugin to access to default name resolver
          * @augments AbstractNameResolver
          * @param {Context} options - Context
          * @memberOf module:NameResolver          
          */
        var DefaultNameResolver = function (options) {
            AbstractNameResolver.prototype.constructor.call(this, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractNameResolver, DefaultNameResolver);

        /**************************************************************************************************************/

        /**
         * Convert passed url into an url understandable by the service (input transformer)
         * @function handle
         * @memberOf DefaultNameResolver#
         */
        DefaultNameResolver.prototype.handle = function (options) {
            var context = this.ctx;
            var objectName = options.objectName;
            var onError = options.onError;
            var onComplete = options.onComplete;
            var onSuccess = options.onSuccess;
            var searchLayer = options.searchLayer;
            var zoomTo = options.zoomTo;

            var url = context.getMizarConfiguration().nameResolver.baseUrl + "/" + objectName + "/EQUATORIAL";
            $.ajax({
                type: "GET",
                url: url,
                success: function (response) {
                    // Check if response contains features
                    if (response.type === "FeatureCollection") {
                        var firstFeature = response.features[0];
                        var zoomToCallback = function() {
                            searchLayer(objectName, onSuccess, onError, response);
                        };
                        zoomTo(firstFeature.geometry.coordinates[0], firstFeature.geometry.coordinates[1], zoomToCallback, response);

                    } else {
                        onError();
                    }
                },
                error: function (xhr) {
                    searchLayer(objectName, onSuccess, onError);
                    console.error(xhr.responseText);
                },
                complete: function (xhr, textStatus) {
                    if (onComplete) {
                        onComplete(xhr);
                    }
                }
            });
        };

        /**
         * @function remove
         * @memberOf DefaultNameResolver#
         */
        DefaultNameResolver.prototype.remove = function() {
        };        

        /**************************************************************************************************************/

        return DefaultNameResolver;

    });
