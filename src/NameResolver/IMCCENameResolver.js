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
    "./AbstractNameResolver",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog"
], function($, _, Utils, AbstractNameResolver, Constants, ErrorDialog) {
    /**************************************************************************************************************/

    /**
     * @name IMCCENameResolver
     * @class
     *     Plugin to access to IMCCE name resolver
     * @augments AbstractNameResolver
     * @param {Context} options - Context
     * @memberof module:NameResolver
     * @constructor
     */
    var IMCCENameResolver = function(options) {
        AbstractNameResolver.prototype.constructor.call(this, options);
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractNameResolver, IMCCENameResolver);

    /**************************************************************************************************************/

    /**
     * Queries SSODnet using this URL https://api.ssodnet.imcce.fr/quaero/1/sso?q=<i>objectName</i>
     * and the layers
     * @function handle
     * @memberof IMCCENameResolver#
     */
    IMCCENameResolver.prototype.handle = function(options) {
        //TODO refactor AJAX request
        var objectName = options.objectName;
        var onError = options.onError;
        var onComplete = options.onComplete;
        var onSuccess = options.onSuccess;
        var searchLayer = options.searchLayer;
        var zoomTo = options.zoomTo;
        var url =
            "https://api.ssodnet.imcce.fr/quaero/1/sso?q=" +
            objectName +
            "&from=Mizar";
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            beforeSend(xhr) {
                xhr.setRequestHeader("Accept", "application/json");
            },             
            success: function(jsonResponse) {
                var data = jsonResponse.data;
                parseResponse(data, createsGeoJsonResponse);

                function parseResponse(data, callback) {
                    var features = [];
                    var i = 0;
                    var dataLength = data.length;
                    if (dataLength === 0) {
                        onError();
                    } else {
                        _.each(data, function(data) {
                            parseItem(data, function(feature) {
                                i++;
                                if (!_.isEmpty(feature)) {
                                    features.push(feature);
                                }
                                if (i === dataLength) {
                                    callback(features);
                                }
                            });
                        });
                    }
                }

                function parseItem(data, callback) {
                    var type = data.type;
                    var id = data.id;
                    var name = data.name;
                    if (
                        $.inArray(type, [
                            "Planet",
                            "Asteroid",
                            "Satellite",
                            "Star",
                            "Comet"
                        ]) !== -1
                    ) {
                        var url =
                            "https://api.ssodnet.imcce.fr/quaero/1/sso/" +
                            id +
                            "/resolver";
                        Utils.requestUrl(url, 'json', 'application/json', null, function(data){
                            var coordinates = data.geometry.coordinates;
                            var ra = (coordinates[0] * 360) / 24;
                            var dec = coordinates[1];
                            if (_.isNumber(ra) && _.isNumber(dec)) {
                                ra = parseFloat(ra);
                                dec = parseFloat(dec);
                                var feature = {};
                                feature.ra = ra;
                                feature.dec = dec;
                                feature.credits =
                                    'Powered by <a href="http://vo.imcce.fr/webservices/ssodnet/?quaero" target="_blank">SsODNet/Quaero API</a>.';
                                feature.id = id;
                                feature.type = type;
                                feature.name = name;
                                callback(feature);
                            }
                        }, function(err){
                            ErrorDialog.open(Constants.LEVEL.ERROR, 'Failed ot request '+url, err);
                        });
                    } else {
                        callback();
                    }
                }

                function createsGeoJsonResponse(features) {
                    var response = {
                        totalResults: features.length,
                        type: "FeatureCollection",
                        features: []
                    };
                    _.each(features, function(feature) {
                        response.features.push({
                            type: "Feature",
                            geometry: {
                                coordinates: [feature.ra, feature.dec],
                                type: "Point",
                                crs: {
                                    type: "name",
                                    properties: {
                                        name: Constants.CRS.Equatorial
                                    }
                                }
                            },
                            properties: {
                                identifier: feature.id,
                                type: feature.type,
                                name: feature.name,
                                credits: feature.credits
                            }
                        });
                    });
                    if (
                        response.type === "FeatureCollection" &&
                        response.features.length > 0
                    ) {
                        var firstFeature = response.features[0];
                        var zoomToCallback = function() {
                            searchLayer(
                                objectName,
                                onSuccess,
                                onError,
                                response
                            );
                        };
                        zoomTo(
                            firstFeature.geometry.coordinates[0],
                            firstFeature.geometry.coordinates[1],
                            null,
                            Constants.CRS.Equatorial,
                            zoomToCallback,
                            response
                        );
                    } else {
                        onError();
                    }
                }
            },
            error: function(xhr) {
                searchLayer(objectName, onSuccess, onError);
                if (onError) {
                    //TODO : network problem
                }
                console.error(xhr.responseText);
            },
            complete: function(xhr) {
                if (onComplete) {
                    onComplete(xhr);
                }
            }
        });
    };

    /**
     * @function remove
     * @memberof IMCCENameResolver#
     */
    IMCCENameResolver.prototype.remove = function() {};

    return IMCCENameResolver;
});
