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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/**
 * @name NameResolver
 * @class
 * Name resolver
 * @memberOf module:NameResolver
 */
define(["jquery", "underscore-min",
        "../Renderer/FeatureStyle", "../Layer/VectorLayer", "../Tiling/HEALPixBase",
        "jquery.ui", "./CDSNameResolver", "./DictionaryNameResolver", "./IMCCENameResolver", "./DefaultNameResolver"],
    function ($, _, FeatureStyle, VectorLayer, HEALPixBase) {

        // Name resolver globals
        var mizarAPI;
        var context;

        // Name resolver properties
        var duration;
        var zoomFov;
        var targetLayer; 			  // Layer containing target feature(cross) on zoom
        var targetFeature;			  // Zooming destination feature

        //Wrapper Object
        var nameResolverImplementation = null;

        /**************************************************************************************************************/

        /**
         *    Update targetFeature and add it to the target layer
         *
         *    @param lon Destination longitude/right ascension in degrees
         *    @param lat Destination latitude/declination in degrees
         *    @param crs coordinate reference system of the (longitude,latitude)
         */
        function addTarget(lon, lat, crs) {
            targetFeature = {
                geometry: {
                    coordinates: [
                        lon,
                        lat
                    ],
                    type: mizarAPI.GEOMETRY.Point,
                    crs: {
                        type: "name",
                        properties: {
                            name: crs
                        }
                    }
                },
                type: "Feature"
            };

            targetLayer.addFeature(targetFeature);
        }

        /**************************************************************************************************************/

        /**
         *    Search for object name
         *    Object name could be:
         *        * Degree in "HMS DMS" or "deg deg"
         *        * Object name as "Mars", "m31", "Mizar"
         *        * For debug : healpix(order,pixelIndex)
         *    @fires Mizar#plugin:not_found
         */
        function search(objectName, onSuccess, onError, onComplete) {
            var geoPos;
            // regexp used only to distinct equatorial coordinates and objects
            // TODO more accurate ( "x < 24h", "x < 60mn", etc.. )
            objectName = objectName.replace(/\s{2,}/g, ' '); // Replace multiple spaces by a single one
            var coordinatesExp = new RegExp("\\d{1,2}[h|:]\\d{1,2}[m|:]\\d{1,2}([\\.]\\d+)?s?\\s[-+]?[\\d]+[°|:]\\d{1,2}['|:]\\d{1,2}([\\.]\\d+)?\"?", "g");
            var healpixRE = /^healpix\((\d)+,(\d+)\)/;
            var degRE = /^(-?\d+(\.\d+)?),?\s(-?\d+(\.\d+)?)/;
            var layerRE = /^layer:(.)*?/;
            var matchHealpix = healpixRE.exec(objectName);
            var matchDegree = degRE.exec(objectName);
            var matchLayer = layerRE.exec(objectName);
            if (matchHealpix) {
                var order = parseInt(matchHealpix[1], 10);
                var pixelIndex = parseInt(matchHealpix[2], 10);

                // Compute vertices
                var nside = Math.pow(2, order);
                /*jslint bitwise: true */
                var pix = pixelIndex & (nside * nside - 1);
                var ix = HEALPixBase.compress_bits(pix);
                /*jslint bitwise: true */
                var iy = HEALPixBase.compress_bits(pix >>> 1);
                /*jslint bitwise: true */
                var face = (pixelIndex >>> (2 * order));

                var i = 0.5;
                var j = 0.5;
                var vert = HEALPixBase.fxyf((ix + i) / nside, (iy + j) / nside, face);
                geoPos = [];
                mizarAPI.getContextManager().getCrs().getWorldFrom3D(vert, geoPos);
                zoomTo(geoPos[0], geoPos[1], mizarAPI.getContextManager().getCrs().getGeoideName(), onSuccess);
            }
            else if (objectName.match(coordinatesExp)) {
                // Format to equatorial coordinates
                var word = objectName.split(" "); // [RA, Dec]

                word[0] = word[0].replace(/h|m|:/g, " ");
                word[0] = word[0].replace("s", "");
                word[1] = word[1].replace(/°|'|:/g, " ");
                word[1] = word[1].replace("\"", "");

                // Convert to geo and zoom
                geoPos = [];
                mizarAPI.getContextManager().getCrs().getDecimalDegFromSexagesimal([word[0], word[1]], geoPos);
                zoomTo(geoPos[0], geoPos[1], mizarAPI.getContextManager().getCrs().getGeoideName(), onSuccess);
            }
            else if (matchDegree) {
                var lon = parseFloat(matchDegree[1]);
                var lat = parseFloat(matchDegree[3]);
                var geo = [lon, lat];
                zoomTo(geo[0], geo[1], mizarAPI.getContextManager().getCrs().getGeoideName(), onSuccess);
            }
            else {
                var options = {
                    objectName: objectName,
                    onError: onError,
                    onComplete: onComplete,
                    onSuccess: onSuccess,
                    searchLayer: searchLayer,
                    zoomTo: zoomTo
                };

                if (nameResolverImplementation) {
                    nameResolverImplementation.handle(options);
                } else {
                    mizarAPI.publish("plugin:not_found", "No name resolver found");
                }
            }
        }


        function searchLayer(objectName, onSuccess, onError, response) {
            var layers = mizarAPI.getLayerManager().searchOnLayerDescription(objectName, mizarAPI.getContextManager().getMode());
            if (layers.length === 0 && (!response || response.totalResults === 0)) {
                if (onError) {
                    onError();
                }
                return;
            }

            layers = _.sortBy(layers, function (layer) {
                return (layer.category === "background") ? 0 : 1;
            });


            var results;
            // Check if response contains features
            if (response && response.type === "FeatureCollection") {
                results = response;
            } else {
                results = {};
                results.type = "FeatureCollection";
                results.features = [];
            }

            _.each(layers, function (layer) {
                results.features.push(
                    {
                        type: 'Feature',
                        properties: {
                            type: 'layer',
                            name: layer.name,
                            description: layer.description,
                            layerType: layer.type,
                            visible: layer.visible,
                            background: layer.category === "background"
                        }
                    }
                )
            });

            onSuccess(results);
        }

        /**************************************************************************************************************/

        /**
         *    Zoom to the given longitude/latitude and add target at the end
         *    @param lon Longitude
         *    @param lat Latitude
         *    @param crs coordinate reference system of the (longitude, latitude)
         *    @param callback Callback once animation is over
         *    @param args Callback arguments
         */
        function zoomTo(lon, lat, crs, callback, args) {

            if (args !== null && typeof args !== 'undefined') {
                // updates the coordinates, which is displayed at the screen in the current CRS
                var idx = 0;
                while (idx < args.features.length) {
                    args.features[idx].geometry.coordinates = mizarAPI.getContextManager().getCrs().convert(args.features[idx].geometry.coordinates, crs, mizarAPI.getContextManager().getCrs().getGeoideName());
                    args.features[idx].geometry.crs.properties.name = crs;
                    idx++;
                }
            }

            // Add target feature on animation stop
            var addTargetCallback = function () {
                addTarget(lon, lat, crs);
                if (callback) {
                    callback.call(this, args);
                }
            };
            [lon, lat] = mizarAPI.getContextManager().getCrs().convert([lon, lat], crs, mizarAPI.getContextManager().getCrs().getGeoideName());
            if (mizarAPI.getContextManager().getMode() === mizarAPI.CONTEXT.Sky) {
                mizarAPI.getContextManager().getNavigation().zoomTo([lon, lat], {
                    fov: zoomFov,
                    duration: duration,
                    callback: addTargetCallback
                });
            }
            else {
                var distance = mizarAPI.getContextManager().getNavigation().getDistance();
                mizarAPI.getContextManager().getNavigation().zoomTo([lon, lat], {
                    distance: distance,
                    duration: duration,
                    callback: addTargetCallback
                });
            }
        }

        /**************************************************************************************************************/

        /**
         *    Delete target image
         */
        function removeTarget() {
            if (targetFeature) {
                targetLayer.removeFeature(targetFeature);
                targetFeature = null;
            }
        }

        /**************************************************************************************************************/


        /**************************************************************************************************************/

        return {
            /**
             * Init name resolver
             * @param {Mizar} m - Mizar API
             * @alias module:NameResolver.NameResolver.init
             */
            init: function (m) {
                if (!context) {
                    mizarAPI = m;
                    this.setContext(mizarAPI.getContextManager().getActivatedContext());
                } else {
                    console.error("Name resolver is already initialized");
                }
            },

            /**
             * Unregisters all event handlers
             * @alias module:NameResolver.NameResolver.remove
             */
            remove: function () {
                if (context) {
                    mizarAPI.getContextManager().getActivatedContext().globe.removeLayer(targetLayer);
                    if (nameResolverImplementation !== undefined) {
                        nameResolverImplementation.remove();
                    }
                    mizarAPI.getContextManager().getActivatedContext().unsubscribe("modifiedNavigation", removeTarget);
                    context = null;
                }
            },

            /**
             *    Search for object name
             *    Object name could be:
             *    <ul>
             *        <li>Degree in "HMS DMS" or "deg deg"</li>
             *        <li>Object name as "Mars", "m31", "Mizar"</li>
             *        <li>For debug : healpix(order,pixelIndex)</li>
             *    </ul>
             *    @alias module:NameResolver.NameResolver.goTo
             *    @fires Mizar#plugin:not_found
             */
            goTo: search,

            /**
             *    Zoom to the given longitude/latitude and add target at the end
             *    @param lon Longitude
             *    @param lat Latitude
             *    @param crs coordinate reference system of the (longitude, latitude)
             *    @param callback Callback once animation is over
             *    @param args Callback arguments
             *    @alias module:NameResolver.NameResolver.zoomTo
             */
            zoomTo: zoomTo,

            /**
             *    Set context
             *    @alias module:NameResolver.NameResolver.setContext
             *    @listens Context#modifiedNavigation
             */
            setContext: function (ctx) {
                // Remove previous context
                this.remove();
                context = ctx;

                //instantiate name resolver nameResolverImplementation object
                var isDefaultNameResolver;
                var nameResolverClass;
                if (typeof context.getContextConfiguration().nameResolver !== 'undefined') {
                    nameResolverClass = require(context.getContextConfiguration().nameResolver.jsObject);
                    isDefaultNameResolver = false;
                }
                else {
                    //Use default name resolver if none defined...
                    nameResolverClass = require("gw/NameResolver/DefaultNameResolver");
                    isDefaultNameResolver = true;
                }

                nameResolverImplementation = new nameResolverClass(context);

                var style = new FeatureStyle({
                    iconUrl: ctx.getMizarConfiguration().mizarBaseUrl + "css/images/target.png",
                    fillColor: [1, 1, 1, 1]
                });
                targetLayer = new VectorLayer({style: style, visible: true});

                mizarAPI.getContextManager().getActivatedContext().globe.addLayer(targetLayer);

                // Update name resolver properties
                duration = isDefaultNameResolver ? 3000 : context.getContextConfiguration().nameResolver.duration;
                zoomFov = isDefaultNameResolver ? 15 : context.getContextConfiguration().nameResolver.zoomFov;

                ctx.subscribe("modifiedNavigation", removeTarget);
            }
        };

    });
