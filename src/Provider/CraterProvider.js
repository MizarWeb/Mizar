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
    "./AbstractProvider",
    "../Utils/Utils",
    "../Renderer/FeatureStyle",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog"
], function($, AbstractProvider, Utils, FeatureStyle, Constants, ErrorDialog) {
    const DEFAULT_STROKE_COLOR = [1.0, 1.0, 1.0, 1.0];

    var self;
    var featureCollection;

    /**
     * @name CraterProvider
     * @class
     *   Displays the name of the crater
     * @param {object} options
     * @augments AbstractProvider
     * @constructor
     * @memberof module:Provider
     */
    var CraterProvider = function(options) {
        AbstractProvider.prototype.constructor.call(this, options);
        self = this;
    };

    /*******************************************************************************/
    Utils.inherits(AbstractProvider, CraterProvider);
    /*******************************************************************************/

    /**
     * @function loadFiles
     * @param {Layer} layer - mizar Layer
     * @param {Object} configuration - configuration
     * @param {string} configuration.url - URL of the GeoJSON file
     * @memberof CraterProvider#
     */
    CraterProvider.prototype.loadFiles = function(layer, configuration) {
        Utils.requestUrl(
            configuration.url,
            "text",
            "text/plain",
            null,
            function(response) {
                if (typeof response === "string") {
                    featureCollection = JSON.parse(response);
                } else {
                    featureCollection = response;
                }
                self.handleFeatures(layer);
            },
            function(err) {
                ErrorDialog.open(
                    Constants.LEVEL.ERROR,
                    "Failed ot request " + configuration.url,
                    err
                );
            }
        );
    };

    /**
     * @function handleFeatures
     * @memberof CraterProvider#
     */
    CraterProvider.prototype.handleFeatures = function(layer) {
        var crs = featureCollection.crs;
        var features = featureCollection.features;
        var ptMaxSize = layer.options.pointMaxSize
            ? layer.options.pointMaxSize
            : 20;
        var strokeColor = layer.getStyle().getStrokeColor()
            ? layer.getStyle().getStrokeColor()
            : DEFAULT_STROKE_COLOR;
        for (var i = 0; i < features.length; i++) {
            var currentFeature = features[i];
            currentFeature.geometry.crs = crs;
            var craterName = currentFeature.properties.name;
            currentFeature.properties.style = new FeatureStyle({
                label: craterName,
                strokeColor: strokeColor,
                pointMaxSize: ptMaxSize
            });
        }
        layer.addFeatureCollection(featureCollection);
    };

    return CraterProvider;
});
