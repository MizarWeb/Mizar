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

/**
 * NameResolver is used to get the coordinate of a target. When the target is found, the camera is redirected to this point:
 * <ul>
 *     <li>{@link module:NameResolver.CDSNameResolver CDSNameResolver}: Name resolver from CDS</li>
 *     <li>{@link module:NameResolver.DefaultNameResolver DefaultNameResolver} : Deprecated</li>
 *     <li>{@link module:NameResolver.DictionaryNameResolver DictionaryNameResolver} : Name resolver on a GeoJson file</li>
 *     <li>{@link module:NameResolver.IMCCENameResolver IMCCENameResolver} : Name resolver from IMCCE</li>
 *     <li>{@link module:NameResolver.NameResolver NameResolver} : NameResolver object</li>
 * </ul>
 *
 * @module NameResolver
 * @implements {NameResolver}
 */

define([
    "../Utils/Utils",
    "./AbstractNameResolver"
], function(Utils, AbstractNameResolver) {
    /**************************************************************************************************************/

    /**
     * @name DefaultNameResolver
     * @class
     *  Plugin to access to default name resolver
     * @augments AbstractNameResolver
     * @param {Context} options - Context
     * @memberof module:NameResolver
     * @constructor
     */
    var DefaultNameResolver = function(options) {
        AbstractNameResolver.prototype.constructor.call(this, options);
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractNameResolver, DefaultNameResolver);

    /**************************************************************************************************************/

    /**
     * Convert passed url into an url understandable by the service (input transformer)
     * @function handle
     * @memberof DefaultNameResolver#
     */
    DefaultNameResolver.prototype.handle = function(options) {
        var context = this.ctx;
        var objectName = options.objectName;
        var onError = options.onError;
        var onComplete = options.onComplete;
        var onSuccess = options.onSuccess;
        var searchLayer = options.searchLayer;
        var zoomTo = options.zoomTo;

        var url =
            context.getMizarConfiguration().nameResolver.baseUrl +
            "/" +
            objectName +
            "/EQUATORIAL";
        Utils.requestUrl(
            url,
            "text",
            "text/plain",
            null,
            function(response) {
                // Check if response contains features
                if (response.type === "FeatureCollection") {
                    var firstFeature = response.features[0];
                    var zoomToCallback = function() {
                        searchLayer(objectName, onSuccess, onError, response);
                    };
                    zoomTo(
                        firstFeature.geometry.coordinates[0],
                        firstFeature.geometry.coordinates[1],
                        null,
                        zoomToCallback,
                        response
                    );
                } else {
                    onError();
                }
            },
            function(err) {
                searchLayer(objectName, onSuccess, onError);
            },
            function(xhr, textStatus) {
                if (onComplete) {
                    onComplete(xhr);
                }
            }
        );
    };

    /**
     * @function remove
     * @memberof DefaultNameResolver#
     */
    DefaultNameResolver.prototype.remove = function() {};

    /**************************************************************************************************************/

    return DefaultNameResolver;
});
