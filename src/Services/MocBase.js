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
/*global define: false */

/**
 *    Moc base module
 */
define(["jquery", "../Renderer/FeatureStyle", "../Layer/MocLayer", "../Utils/Numeric", "../Layer/FitsLoader", "../Tiling/HEALPixBase"],
    function ($, FeatureStyle, MocLayer, Numeric, FitsLoader, HEALPixBase) {
        var mizarAPI;
        var coverageServiceUrl;

        /**************************************************************************************************************/

        /**
         *    Request moc description for the given layer
         */
        function requestMocDesc(layer, successCallback, errorCallback) {
            // Get moc template

            // case moc url service return a fits file
            if (layer.serviceUrl && layer.serviceUrl.search(/[/.fits]+$/g) !== 1) {
                layer.describeUrl = layer.serviceUrl;
                successCallback(layer);
            } else {
                $.ajax({
                    type: "GET",
                    url: layer.serviceUrl,
                    //dataType: "xml",
                    success: function (xml) {
                        var mocdesc = $(xml).find('Url[rel="mocdesc"]');
                        var describeUrl = $(mocdesc).attr("template");
                        if (describeUrl) {
                            // Cut request parameters if exists
                            var splitIndex = describeUrl.indexOf("?q=");
                            if (splitIndex !== -1) {
                                describeUrl = describeUrl.substring(0, splitIndex);
                            }
                            layer.describeUrl = describeUrl;
                            successCallback(layer);

                        }
                        else {
                            layer.describeUrl = "Not available";
                            layer.coverage = "Not available";
                            if (errorCallback) {
                                errorCallback(layer);
                            }
                        }
                    },
                    error: function (xhr) {
                        layer.describeUrl = "Not available";
                        layer.coverage = "Not available";
                        if (errorCallback) {
                            errorCallback(layer);
                        }
                    }
                });
            }
        }

        /**************************************************************************************************************/

        /**
         * Request moc layer for the given layer
         * @param {Layer} layer
         * @param {Function} callback
         */
        function requestMoc(layer, callback) {
            var mocLayer = this.findMocSublayer(layer);
            layer.globe = this.scene;

            // Create if doesn't exist
            if (!mocLayer) {
                MocBase.createMocSublayer(layer, function (layer) {
                    callback(this.findMocSublayer(layer));
                }, function (layer) {
                    callback(this.findMocSublayer(layer));
                });
            } else {
                callback(mocLayer);
            }
        }

        /**************************************************************************************************************/

        /**
         *    Get moc sky coverage information
         */
        function getSkyCoverage(layer, successCallback, errorCallback) {
            if (layer.coverage !== "Not available") {
                var media = "?media=txt";
                if (!layer.describeUrl) {
                    requestMocDesc(layer, function (layer) {
                        if (layer.describeUrl.lastIndexOf("?") > 0) {
                            media = "&media=txt";
                        }
                        requestSkyCoverage(layer, layer.describeUrl + media, successCallback);
                    }, errorCallback);
                }
                else {
                    if (layer.describeUrl.lastIndexOf("?") > 0) {
                        media = "&media=txt";
                    }
                    requestSkyCoverage(layer, layer.describeUrl + media, successCallback);
                }
            }
            else {
                errorCallback(layer);
            }
        }

        /**************************************************************************************************************/

        /**
         * Request sky coverage based on moc
         * @param layer
         * @param callback
         */
       function requestSkyCoverage (layer, callback) {
            this.getSkyCoverage(layer, function (layer) {
                callback(layer.coverage);
            }, function (layer) {
                callback(layer.coverage);
            });
        }

        /**************************************************************************************************************/

        /**
         *    Create moc sublayer
         *
         *    @param layer Parent layer
         */
        function createMocSublayer(layer, successCallback, errorCallback) {
            if (layer.describeUrl !== "Not available") {
                if (!layer.describeUrl) {
                    requestMocDesc(layer, function (layer) {
                        handleMocLayer(layer, layer.describeUrl);
                        var url = layer.describeUrl;
                        if (!String(url).endsWith(".fits")) {
                            url+="?media=txt"
                        }
                        requestSkyCoverage(layer, url, successCallback);
                    }, errorCallback);
                }
                else {
                    handleMocLayer(layer, layer.describeUrl);
                    var url = layer.describeUrl;
                    if (!String(url).endsWith(".fits")) {
                        url+="?media=txt"
                    }
                    requestSkyCoverage(layer, url, successCallback);
                }
            }
            else {
                errorCallback(layer);
            }
        }

        /**************************************************************************************************************/

        /**
         *    Requesting moc sky coverage information and stock it as layer parameter
         */
        function requestSkyCoverage(layer, mocServiceUrl, successCallback) {
            if(layer.hasOwnProperty("properties") && layer.properties.hasOwnProperty("mocCoverage")){
                layer.coverage = Numeric.roundNumber(parseFloat(layer.properties.mocCoverage) * 100, 5) + "%";
            }

            if (!layer.coverage) {

                if (String(mocServiceUrl).endsWith(".fits")) {
                    FitsLoader.loadFits(mocServiceUrl, function (fits) {
                        var healpixMoc = {};
                        var binaryTable = fits.getHDU(1).data;

                        // setting startOrder with first order in dataTable
                        //self.startOrder = uniq2hpix(binaryTable.getRow(0)[binaryTable.columns[0]])[0];

                        for(var i = 0; i < binaryTable.rows; i++) {
                            var uniq = binaryTable.getRow(i);
                            var hpix = HEALPixBase.uniq2hpix(uniq[binaryTable.columns[0]]);

                            var order = hpix[0];
                            if (healpixMoc[order] === undefined) {
                                healpixMoc[order] = [];
                            }
                            healpixMoc[order].push(hpix[1]);
                        }

                        var maxOrder;
                        _.each(healpixMoc, function(pixels, order) {
                           maxOrder = parseInt(order);
                        });
                        var nOrder = maxOrder+1;

                        if (_.isNumber(response)) {
                            layer.coverage = Numeric.roundNumber(getCoverage(nOrder, healpixMoc) * 100, 5) + "%";
                        }
                        else {
                            layer.coverage = "Not available";
                        }
                        if (successCallback) {
                            successCallback(layer);
                        }
                    });

                } else {
                    // Request MOC space coverage
                    $.ajax({
                        type: "GET",
                        url: mocServiceUrl,
                        success: function (response) {
                            if (_.isNumber(response)) {
                                layer.coverage = Numeric.roundNumber(parseFloat(response), 5) + "%";
                            }
                            else {
                                layer.coverage = "Not available";
                            }
                            if (successCallback) {
                                successCallback(layer);
                            }
                        }
                    });
                }
            }
            else {
                successCallback(layer);
            }
        }

        /**************************************************************************************************************/

        /**
         *    Handle moc layer as a sublayer
         *
         *    @param layer Parent layer
         *    @param mocServiceUrl Url to moc service
         */
        function handleMocLayer(layer, mocServiceUrl) {
            var style = layer.style;
            var serviceLayer = new MocLayer({
                serviceUrl: mocServiceUrl,
                style: layer.style,
                visible: false
            });

            serviceLayer.style.fill = true;
            serviceLayer.style.fillColor[3] = 0.3;
            // TODO: think about attachement of moc layer
            // if ( layer.globe && layer.isVisible() )
            // {
            // Add sublayer to engine
            layer.globe.addLayer(serviceLayer);
            // }

            if (!layer.subLayers) {
                layer.subLayers = [];
            }

            layer.subLayers.push(serviceLayer);
        }

        /**************************************************************************************************************/

        /**
         *    Search moc sublayer
         *    @return    Moc layer if found, null otherwise
         */
        function findMocSublayer(layer) {
            if (layer.subLayers) {
                for (var j = 0; j < layer.subLayers.length; j++) {
                    if (layer.subLayers[j] instanceof MocLayer) {
                        return layer.subLayers[j];
                    }
                }
            }
            return null;
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

                layerNames += layer.name;
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
            mizarAPI.getContextManager().getSkyContext().globe.addLayer(intersectionLayer);

            intersectionLayer.describeUrl = url;

            return intersectionLayer;
        }

        /** Return the fraction of the sky covered by the Moc [0..1] */
        function getCoverage(nOrder, healpixMoc) {
            var area = getArea(nOrder);
            if( area === 0 ) {
              return 0.0;
            }
            return getUsedArea(nOrder, healpixMoc) / area;
        }

        /** Return the number of low level pixels of the Moc  */
        function getUsedArea(nOrder, healpixMoc) {
            var n=0;
            var sizeCell = 1;
            for( var order=nOrder-1; order>=0; order--, sizeCell*=4) {
              n += getSize(order, healpixMoc)*sizeCell;
            }
            return n;
        }

        /** return the area of the Moc computed in pixels at the most low level */
        function getArea(nOrder) {
            if( nOrder === 0 ) {
              return 0;
            }
            var nside = pow2(nOrder-1);
            return 12*nside*nside;
        }

        /** Provide the number of Healpix pixels for a dedicated order */
        function getSize(order, healpixMoc) {
            if(healpixMoc[order]) {
                return healpixMoc[order].length;
            }
            else {
                return 0;
            }
        }

        function pow2(order) {
           return 1 << order;
        }

        /**************************************************************************************************************/

        return {
            init: function (m, options) {
                mizarAPI = m;
                coverageServiceUrl = "TODO must use AbstractLayer to get info";//options.coverageService.baseUrl;
                //TODO must use AbstractLayer to get this information
            },
            createMocSublayer: createMocSublayer,
            findMocSublayer: findMocSublayer,
            getSkyCoverage: getSkyCoverage,
            requestSkyCoverage: requestSkyCoverage,
            intersectLayers: intersectLayers
        }

    });
