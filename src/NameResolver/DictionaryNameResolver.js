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
define(["jquery", "underscore-min", "../Utils/Utils", "./AbstractNameResolver","../Layer/VectorLayer", "../Renderer/FeatureStyle","../Utils/Constants"],
    function ($, _, Utils, AbstractNameResolver, VectorLayer, FeatureStyle, Constants) {

      var dictionary;

      /**
       * In case if base url isn't a service but a json containing all known places
       * this method allows to retrieve it
       */
      var retrieveDictionary = function (context) {
          var containsDictionary = context.getContextConfiguration().nameResolver.baseUrl.indexOf("json") >= 0;
          if (containsDictionary) {
              // Dictionary as json
              var marsResolverUrl = context.getContextConfiguration().nameResolver.baseUrl;//.replace('mizar_gui', 'mizar_lite');
              $.ajax({
                  type: "GET",
                  dataType : "json",
                  url: marsResolverUrl,
                  success: function (response) {
                      dictionary = response;
                      //nameResolverLayer = new VectorLayer();
                      //for (var i = 0; i < response.features.length; i++) {
                      //    var feature = response.features[i];
                      //    feature.properties.style = new FeatureStyle({
                      //        label: feature.properties.Name,
                      //        fillColor: [1, 0.7, 0, 1]
                      //    });
                      //}
                      //nameResolverLayer.addFeatureCollection(response);
                      //context.globe.addLayer(nameResolverLayer);
                  },
                  error: function (thrownError) {
                      console.error(thrownError);
                  }
              });
          }
          else {
              dictionary = null;
          }
      };

      /**************************************************************************************************************/
         /**
          @name DictionaryNameResolver
          @class
              Plugin to access to the dictionary name resolver
          @augments AbstractNameResolver
          @param {Context} options - Configuration properties
          @memberOf module:NameResolver
          */
        var DictionaryNameResolver = function (options) {
            AbstractNameResolver.prototype.constructor.call(this, options);
            dictionary = retrieveDictionary(options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractNameResolver, DictionaryNameResolver);


        /**
         * Queries the GeoJSON passed in parameter in the Mizar options
         * @function handle
         * @memberOf DictionaryNameResolver#
         */
        DictionaryNameResolver.prototype.handle = function (options) {
            var context = this.ctx;
            var objectName = options.objectName;
            var onError = options.onError;
            var onComplete = options.onComplete;
            var onSuccess = options.onSuccess;
            var searchLayer = options.searchLayer;
            var zoomTo = options.zoomTo;

            // Planet resolver(Mars only currently)
            var feature = _.find(dictionary.features, function (f) {
                return f.properties.Name.toLowerCase() === objectName.toLowerCase();
            });

            if (feature) {
                var lon = parseFloat(feature.properties.center_lon);
                var lat = parseFloat(feature.properties.center_lat);
                feature.geometry.crs = {
                    type: "name",
                    properties: {
                        name: context.getCoordinateSystem().getGeoideName()
                    }
                };
                var zoomToCallback = function () {
                    searchLayer(objectName, onSuccess, onError, {features: [feature]});
                };                

                zoomTo(lon, lat, Constants.CRS.Mars_2000, zoomToCallback, {features: [feature]});
            }
            else {
                searchLayer(objectName, onSuccess, onError);
            }
        };

        /**
         * Code to execute when remove
         * @function remove
         * @memberof DictionaryNameResolver#
         */
        DictionaryNameResolver.prototype.remove = function () {
            dictionary = null;
        };

        return DictionaryNameResolver;
    });
