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
/**
 * @name LayerFactory
 * @class
 * Factory to create a layer
 * @memberOf module:Layer
 */
define(["jquery","../Utils/Constants", "./WMSLayer", "./WMTSLayer", "./WCSElevationLayer", "./VectorLayer",
        "./AtmosphereLayer", "./BingLayer", "./GroundOverlayLayer", "./OSMLayer",
        "./TileWireframeLayer", "./CoordinateGridLayer",
        "./HipsFitsLayer",
        "./HipsGraphicLayer",
        "./MocLayer",
        "./OpenSearchLayer",
        "./WMSElevationLayer","./HipsMetadata","./HipsCatLayer", "./GeoJsonLayer"
    ],
    function ($, Constants, WMSLayer, WMTSLayer, WCSElevationLayer, VectorLayer, AtmosphereLayer,
              BingLayer, GroundOverlayLayer, OSMLayer, TileWireframeLayer, CoordinateGridLayer,
              HipsFitsLayer,
              HipsGraphicLayer,
              MocLayer,
              OpenSearchLayer,
              WMSElevationLayer, HipsMetadata, HipsCatLayer, GeoJsonLayer) {

        this.proxy = {
          url : null,
          use : false
        };


        function createHips(hipsMetadata, options) {
            options.proxy = this.proxy;
            var hipsProperties;
            if(typeof hipsMetadata === 'undefined') {
                hipsProperties = new HipsMetadata(options.baseUrl);
            } else if( hipsMetadata instanceof HipsMetadata)  {
                hipsProperties = hipsMetadata;
            } else {
                hipsProperties = new HipsMetadata();
                hipsProperties.setMetadata(hipsMetadata);
            }

            var metadata = hipsProperties.getHipsMetadata();

            var formats = options.hasOwnProperty('hips_tile_format') ? options.hips_tile_format : metadata.hips_tile_format;
            var dataProducts = options.hasOwnProperty('dataproduct_type') ? options.dataproduct_type : metadata.dataproduct_type;

            var layer;

            switch(dataProducts) {
                case hipsProperties.DataProductType.catalog:
                    layer =  createHipsCats(metadata, options);
                    break;
                case hipsProperties.DataProductType.cube:
                    throw new RangeError("Hips : cannot handle cube dataproduct", "LayerFactor.js");
                    break;
                case hipsProperties.DataProductType.image:
                    options.category = options.hasOwnProperty('category') ? options.category : "Image";
                    var hasPNG = ($.inArray(hipsProperties.HipsTileFormat.png, formats) !== -1);
                    var hasJPEG = ($.inArray(hipsProperties.HipsTileFormat.jpeg, formats) !== -1);
                    var hasFits = ($.inArray(hipsProperties.HipsTileFormat.fits, formats) !== -1);
                    if(options.format) {
                        switch(options.format){
                            case hipsProperties.HipsTileFormat.png:
                                layer = createHipsGraphic(metadata, options);
                                break;
                            case "jpg":
                                layer = createHipsGraphic(metadata, options);
                                break;
                            case hipsProperties.HipsTileFormat.fits:
                                layer = createHipsFits(metadata, options);
                                break;
                            default :
                            // try to get one by default => try jpeg ... maybe I am lucky
                                layer = createHipsGraphic(metadata, options);
                        }
                    } else {
                        if (hasPNG) {
                            options.format = hipsProperties.HipsTileFormat.png;
                            layer = createHipsGraphic(metadata, options);
                        } else if (hasJPEG) {
                            options.format = "jpg"; // the right extension should be "jpeg" but jpg is used
                            layer = createHipsGraphic(metadata, options);
                        } else if (hasFits) {
                            options.format = hipsProperties.HipsTileFormat.fits;
                            layer = createHipsFits(metadata, options);
                        } else {
                            // try to get one by default => it happens for old Hips version ... maybe I am lucky
                            options.format = "jpg";
                            layer = createHipsGraphic(metadata, options);
                        }
                    }
                    break;
                case hipsProperties.DataProductType.meta:
                    throw new RangeError("Hips : cannot handle META dataproduct", "LayerFactor.js");
                    break;
                default:
                    throw new RangeError("Hips : Unknown dataproduct type", "LayerFactor.js");
            }
            //if(fileExists(options.baseUrl+"/Moc.fits") === 200) {
            //    options.serviceUrl = options.baseUrl+"/Moc.fits";
            //    layer.services.push(this.createMoc(options));
            //}
            return layer;
        }

        function createHipsFits(hipsMetadata, options) {
            options.proxy = this.proxy;
            return new HipsFitsLayer(hipsMetadata, options);
        }

        function createHipsGraphic(hipsMetadata, options) {
            options.proxy = this.proxy;
            return new HipsGraphicLayer(hipsMetadata, options);
        }

        function createHipsCats(hipsMetadata, options) {
            options.proxy = this.proxy;
            return new HipsCatLayer(hipsMetadata, options);
        }


        /**
         Create and get a MOC Layer
         @function createMoc
         @private
         @memberOf LayerFactory.prototype
         @param options Configuration properties for the MOC layer. See {@link MocLayer} for properties
         @return {MocLayer} layer
         */
        function createMoc(options) {
            options.proxy = this.proxy;
            options.style.fill = true;
            options.style.fillColor[3] = 0.3; // make transparent
            var layer = new MocLayer(options);
            layer.dataType = "line";
            return layer;
        }

        /**
         Create and get an OpenSearch Layer
         @function createOpenSearch
         @private
         @memberOf LayerFactory.prototype
         @param options Configuration properties for the OpenSearch layer. See {@link OpenSearchLayer} for properties
         @return {OpenSearchLayer} layer
         */
        function createOpenSearch(options) {
            options.proxy = this.proxy;
            var layer = new OpenSearchLayer(options);
            if (options.displayProperties) {
                layer.displayProperties = options.displayProperties;
            }
            layer.pickable = options.hasOwnProperty('pickable') ? options.pickable : true;            
            return layer;
        }


        return {
            /**
             * Factory for Layer.
             * @param {Object} options - See the base properties {@link AbstractLayer.configuration} and specific properties for specific layers
             * @param {string} options.type - one of the following value {Constants.Layer}
             * @return {AbstractLayer} - Object to handle Layer
             * @alias module:Layer.LayerFactory.create
             * @throws RangeError - "Unable to create the layer"
             * @see {@link module:Layer.AtmosphereLayer AtmosphereLayer} : A layer to create an atmosphere on a planet.
             * @see {@link module:Layer.BingLayer BingLayer}: The Microsoft service proving a WMTS server.
             * @see {@link module:Layer.CoordinateGridLayer CoordinateGridLayer} : A layer to create a grid on the sky
             * @see {@link module:Layer.GeoJsonLayer GeoJSONLayer} : A layer to add a GeoJSON on the globe
             * @see {@link module:Layer.GroundOverlayLayer GroundOverlayLayer} : A layer to draw an image overlay draped onto the terrain
             * @see {@link module:Layer.HipsCatLayer HipsCatLayer} : A layer to draw a HIPS catalogue
             * @see {@link module:Layer.HipsFitsLayer HipsFitsLayer} : A layer to draw an Hips Fits
             * @see {@link module:Layer.HipsGraphicLayer HipsGraphicLayer} : A layer to draw a Hips JPEG/PNG
             * @see {@link module:Layer.MocLayer MocLayer} : A layer to draw a multi-order-coverage index
             * @see {@link module:Layer.OpenSearchLayer OpenSearchLayer} : A layer to draw the result from an open search service
             * @see {@link module:Layer.OSMLayer OSMLayer} : A layer to display data coming from OpenStreetMap server
             * @see {@link module:Layer.TileWireframeLayer TileWireframeLayer} : A layer to draw a grid on the planet
             * @see {@link module:Layer.VectorLayer VectorLayer} : A layer to draw a vector
             * @see {@link module:Layer.WCSElevationLayer WCSElevationLayer} : A layer to draw the elevation
             * @see {@link module:Layer.WMSElevationLayer WMSElevationLayer} : A layer to draw the elevation
             * @see {@link module:Layer.WMSLayer WMSLayer} : A layer to draw images coming from the WMS server
             * @see {@link module:Layer.WMTSLayer WMTSLayer} : A layer to draw predefined tiles coming from a WMTS server
             */
            create: function (options) {
                var proxy = this.proxy;
                options.proxy = this.proxy;
                var layer;
                switch (options.type) {
                    case Constants.LAYER.WMS :
                        layer = new WMSLayer(options);
                        break;
                    case Constants.LAYER.WMTS :
                        layer = new WMTSLayer(options);
                        break;
                    case Constants.LAYER.WMSElevation :
                        layer = new WMSElevationLayer(options);
                        break;
                    case Constants.LAYER.WCSElevation :
                        layer = new WCSElevationLayer(options);
                        break;
                    case Constants.LAYER.GeoJSON:
                        layer = new GeoJsonLayer(options);
                        layer.pickable = options.hasOwnProperty('pickable') ? options.pickable : true;
                        break;
                    case Constants.LAYER.Vector :
                        layer = new VectorLayer(options);
                        layer.pickable = options.hasOwnProperty('pickable') ? options.pickable : true;
                        layer.deletable = options.hasOwnProperty('deletable') ? options.deletable : false;
                        break;
                    case Constants.LAYER.Atmosphere :
                        layer = new AtmosphereLayer(options);
                        break;
                    case Constants.LAYER.Bing :
                        layer = new BingLayer(options);
                        break;
                    case Constants.LAYER.GroundOverlay :
                        layer = new GroundOverlayLayer(options);
                        break;
                    case Constants.LAYER.OSM :
                        layer = new OSMLayer(options);
                        break;
                    case Constants.LAYER.HipsGrid:
                    case Constants.LAYER.TileWireframe :
                        layer = new TileWireframeLayer(options);
                        break;
                    case Constants.LAYER.HipsCat:
                        layer = new HipsCatLayer(options.hipsMetadata, options);
                        break;
                    case Constants.LAYER.CoordinateGrid :
                        layer = new CoordinateGridLayer(options);
                        break;
                    case Constants.LAYER.Hips :
                        layer = createHips(options.hipsMetadata, options);
                        break;
                    case Constants.LAYER.Moc :
                        layer = createMoc(options);
                        break;
                    case Constants.LAYER.OpenSearch :
                        layer = createOpenSearch(options);
                        break;
                    default :
                        throw new RangeError("Unable to create the layer " + options.type, "LayerFactor.js");
                }
                return layer;

            }

        }
    });
