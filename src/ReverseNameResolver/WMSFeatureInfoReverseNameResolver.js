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
    "../Utils/Utils",
    "./AbstractReverseNameResolver",
    "../Layer/LayerFactory",
    "../Registry/WMSServer",
    "../Utils/Numeric",
    "../Utils/Constants",
    "../Utils/UtilsIntersection",
    "../Time/Time"
], function (Utils, AbstractReverseNameResolver, LayerFactory, WMSServer, Numeric, Constants, UtilsIntersection, Time) {
    /**************************************************************************************************************/

    /**
     * @name WMSFeatureInfoReverseNameResolver
     * @class
     *   Plugin to access to Default reverse name resolver
     * @augments AbstractReverseNameResolver
     * @param {Context} options - Context
     * @memberof module:ReverseNameResolver
     */
    var WMSFeatureInfoReverseNameResolver = function (options) {
        AbstractReverseNameResolver.prototype.constructor.call(this, options);
    };

    /**
     * Retrieve all visible WMS layers
     * @param {AbstractContext} context
     * @param {double[]} position
     * @returns {Layer[]} layers
     */
    function _getAllVisibleWMSLayer(context, pos) {
        var layersByWMSServer = {};
        for (var i = 0; i < context.getLayers().length; i++) {
            var layer = context.getLayers()[i];
            var bbox = layer.getProperties().bbox;
            var time;
            if(layer.containsDimension("time")) {
                time = Time.parse(layer.time);
            } else {
                time = null;
            }
            if (layer.type === Constants.LAYER.WMS && layer.isVisible() 
            && UtilsIntersection.isValueBetween(pos[0], bbox[0], bbox[2]) 
            && UtilsIntersection.isValueBetween(pos[1], bbox[1], bbox[3])
            && (time === null || (time !== null && time.isInTimeDefinition(layer.getDimensions().time.value)))) {
                var baseUrl = layer.baseUrl;
                if (!layersByWMSServer.hasOwnProperty(baseUrl)) {
                    layersByWMSServer[baseUrl] = [];
                }
                layersByWMSServer[baseUrl] = layersByWMSServer[baseUrl].concat(layer.layers.split(","));
            }
        }
        return layersByWMSServer;
    }

    /**
     * Draw area on map based on a coordinate and number of pixels of the rectangle
     * @param {AbstractContext} context     
     * @param {float[]} coord - coordinate on the center of the rectangle
     * @param {[]} nbPixels -  of pixels on the map along longitude and latitude
     * @param {Object} resolution - Resolution in degree/pixel along longitude, latitude 
     */
    function _drawAreaOnMap(context, coord, nbPixels, resolution) {
        var vectorLayer = LayerFactory.create({
            type: "Vector",
            visible: true
        });
        context.addDraw(vectorLayer);

        var feature = {
            id: "view0",
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [[
                    [-nbPixels[0] * resolution.x + coord[0], -nbPixels[1] * resolution.y + coord[1]],
                    [nbPixels[0] * resolution.x + coord[0], -nbPixels[1] * resolution.y + coord[1]],
                    [nbPixels[0] * resolution.x + coord[0], nbPixels[1] * resolution.y + coord[1]],
                    [-nbPixels[0] * resolution.x + coord[0], nbPixels[1] * resolution.y + coord[1]],
                    [-nbPixels[0] * resolution.x + coord[0], -nbPixels[1] * resolution.y + coord[1]]
                ]]
            }
        };
        vectorLayer.addFeature(feature);
        setTimeout(
            function () {
                vectorLayer.removeFeature(feature);
            }, 2000
        );
    }

    /**************************************************************************************************************/

    Utils.inherits(AbstractReverseNameResolver, WMSFeatureInfoReverseNameResolver);

    /**************************************************************************************************************/

    /**
     * @function handle
     * @memberof WMSFeatureInfoReverseNameResolver#
     * @param {Object} options
     */
    WMSFeatureInfoReverseNameResolver.prototype.handle = function (options) {
        var pos = options.pos;
        var mizarAPI = options.mizarAPI;
        var ctx = mizarAPI.getActivatedContext();
        var nbPixels = [50, 25];
        var layersByWMSServer = _getAllVisibleWMSLayer.call(this, ctx, pos);
        var featuresInfo = [];
        var start = 0;
        var keys = Object.keys(layersByWMSServer);
        var end = keys.length;


        function getQueryableLayers(url, options) {
            Utils.requestUrl(url, "text", "text/plain", null,
                function (response) {
                    var feature = WMSServer.getXmlFeatureToJson(response);
                    feature.properties.title = "Layer Information";
                    featuresInfo.push(feature);
                    start++;
                    if (start < end) {
                        url = layersByWMSServer[keys[start]];
                        getQueryableLayers(url);
                    } else {
                        if (options && options.success) {
                            options.success({ copyright : "MIZAR", features: featuresInfo });
                        }
                    }
                },
                function (err) {
                    if (options && options.error) {
                        options.error(err);
                    }
                }
            );
        }

        var response;
        if (pos != null) {
            var renderCtx = ctx.getRenderContext();
            var fov = renderCtx.getFov();
            var distance = ctx.getNavigation().getDistance();
            var x = Math.tan(Numeric.toRadian(fov) * 0.5) * distance;
            var alpha = Numeric.toDegree(Math.asin(0.5 * x / ctx.getCoordinateSystem().getGeoide().getRealPlanetRadius()));
            var resolution = {
                x: alpha / renderCtx.getCanvas().width,
                y: alpha / renderCtx.getCanvas().height
            };
            _drawAreaOnMap.call(this, ctx, pos, nbPixels, resolution);
            var bbox = [
                pos[0] - resolution.x * nbPixels[0],
                pos[1] - resolution.y * nbPixels[1],
                pos[0] + resolution.x * nbPixels[0],
                pos[1] + resolution.y * nbPixels[1]
            ];
            var url = WMSServer.getFeatureInfo(keys[start], bbox, layersByWMSServer[keys[start]]);
            getQueryableLayers(url, options);
        } else {
            if (options && options.error) {
                options.error("error");
            }
        }
    };

    /**
     * @function remove
     * @memberof WMSFeatureInfoReverseNameResolver#
     */
    WMSFeatureInfoReverseNameResolver.prototype.remove = function (options) { };

    /**************************************************************************************************************/

    return WMSFeatureInfoReverseNameResolver;
});