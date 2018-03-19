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
/*global define: false */

/**
 *    Moc base module
 */
define(["jquery", "../Renderer/FeatureStyle", "../Layer/MocLayer", "../Utils/Constants", "../Utils/Numeric"],
    function ($, FeatureStyle, MocLayer, Constants, Numeric) {
        var mizarAPI;
        var coverageServiceUrl;


        /**************************************************************************************************************/

        /**
         *    Create moc sublayer
         *
         *    @param layer Parent layer
         */
        function createMocSublayer(layer, successCallback, errorCallback) {
            var ID;
            if (layer.getBaseUrl()) {
                ID = handleMocLayer(layer, layer.getBaseUrl());
                var mocLayer = mizarAPI.getLayerByID(ID);
                if(layer.skyFraction) {
                    mocLayer.coverage = Numeric.roundNumber(parseFloat(layer.skyFraction)*100, 2)+"%";
                } else {
                    mocLayer.coverage = "Not available";
                }
                successCallback(mocLayer);
            } else {
                errorCallback(layer);
            }
            return ID;
        }


        /**************************************************************************************************************/

        /**
         *    Handle moc layer as a sublayer
         *
         *    @param layer Parent layer
         *    @param mocServiceUrl Url to moc service
         */
        function handleMocLayer(layer, mocServiceUrl) {
            var style;
            // checks if style is defined
            if (layer.getStyle()) {
                style = layer.getStyle();
                style.fill = true;
                if (style.hasOwnProperty('fillColor')) {
                    // add transparency when fill color is defined
                    style.fillColor[3] = 0.3;
                } else {
                    // no predefined color, set one
                    style.fillColor = [1.0, 0.0, 0.0, 0.3];
                }
            } else {
                // no style, create a new one.
                style = new FeatureStyle({
                    rendererHint: "Basic",
                    fill: true,
                    fillColor: [1.0, 0.0, 0.0, 0.3]
                });
            }

            var ID = mizarAPI.addLayer({
                type: Constants.LAYER.Moc,
                baseUrl: mocServiceUrl,
                style: style,
                visible: false
            });
            return ID;
        }

        /**************************************************************************************************************/

        /**
         *    Search moc sublayer
         *    @return    Moc layer if found, null otherwise
         */
        function findMocSublayer(layerID) {
            return mizarAPI.getLayerByID(layerID);
        }

        /**************************************************************************************************************/

        /**
         *    Intersect layers
         */
        function intersectLayers(layersToIntersect) {
            // Construct url & layerNames
            var url = coverageServiceUrl;
            var layerNames = "";
            for (var i = 0; i < layersToIntersect.length; i++) {
                var layer = layersToIntersect[i];

                layerNames += layer.getName();
                url += layer.describeUrl;
                if (i !== layersToIntersect.length - 1) {
                    url += ';';
                    layerNames += ' x ';
                }
            }

            // Create intersection MOC layer
            intersectionLayer = new MocLayer({
                name: "Intersection( " + layerNames + " )",
                serviceUrl: url + "&media=json",
                style: new FeatureStyle({
                    rendererHint: "Basic",
                    fill: true,
                    fillColor: [1.0, 0.0, 0.0, 0.3]
                }),
                visible: false
            });
            mizarAPI.getSkyContext().globe.addLayer(intersectionLayer);

            intersectionLayer.describeUrl = url;

            return intersectionLayer;
        }

        /**************************************************************************************************************/

        return {
            init: function (m, options) {
                mizarAPI = m;
                //coverageServiceUrl = "TODO must use AbstractLayer to get info";//options.coverageService.baseUrl;
                //TODO must use AbstractLayer to get this information
            },
            createMocSublayer: createMocSublayer,
            findMocSublayer: findMocSublayer,
            //getSkyCoverage: getSkyCoverage,
            //requestSkyCoverage: requestSkyCoverage,
            intersectLayers: intersectLayers
        }

    });
