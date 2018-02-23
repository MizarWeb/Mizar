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
/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

define(['../Utils/Utils', './AbstractRasterLayer', '../Utils/Constants', '../Tiling/GeoTiling'],
    function (Utils, AbstractRasterLayer, Constants, GeoTiling) {


        /**
         * Configuration parameters to query a Web Map Service (WMS)
         * @typedef {AbstractRasterLayer.configuration} AbstractRasterLayer.wms_configuration
         * @property {int} [tilePixelSize = 256] - tile in pixels
         * @property {int} [numberOfLevels = 21] - number of levels
         * @property {string} [version = "1.1.1"] - WMS version
         * @property {string} [transparent]
         * @property {string} [time] - Time dimension
         * @property {string} [format = "image/jpeg"] - output image format
         * @property {string} layers - names of the layer
         * @property {string} [styles] - Styled Layers Descriptor for each layer
         */

        /**
         * @name WMSLayer
         * @class
         *    Creates a layer for imagery data using WMS (Web Map Service) protocol
         *    based on a GeoTiling(4, 2) with a pixelSize = 256 by default.<br/>
         *    WMS provides a standard interface for requesting a geospatial map image.
         *    The standard guarantees that these images can all be overlaid on one another.
         *    <br/><br/>
         *    Example of a WMS request<br/>
         *    <code>
         *        http://example.com/wms?request=GetMap&service=WMS&version=1.1.1&layers=MyLayer
         *        &styles=population&srs=EPSG:4326&bbox=-145.15104058007,21.731919794922,-57.154894212888,58.961058642578&
         *        &width=780&height=330&format=image/png
         *    </code>
         *
         * @augments AbstractRasterLayer
         * @param {AbstractRasterLayer.wms_configuration} options - WMS Configuration
         * @constructor
         * @memberOf module:Layer
         * @see {@link http://www.opengeospatial.org/standards/wms WMS} standard
         */
        var WMSLayer = function (options) {

            options.tilePixelSize = options.tilePixelSize || 256;
            options.tiling = new GeoTiling(4, 2);
            options.numberOfLevels = options.numberOfLevels || 21;

            this.restrictTo = options.restrictTo;

            AbstractRasterLayer.prototype.constructor.call(this, Constants.LAYER.WMS, options);

            this.addGetCapabilitiesParameter("service","WMS");
            this.addGetCapabilitiesParameter("request","getCapabilities");
            this.addGetCapabilitiesParameter("version",options.hasOwnProperty('version') ? options.version : '1.1.1');

            this.getMapBaseUrl = this.getGetMapUrl();

            if (options.byPass === true) {
              // Build the base GetMap URL
              this.addGetMapParameter("service","wms");
              this.addGetMapParameter("version",options.hasOwnProperty('version') ? options.version : '1.1.1');
              this.addGetMapParameter("request","getMap");
              this.addGetMapParameter("layers",options.layers);
              this.addGetMapParameter("styles",options.hasOwnProperty('styles') ? options.styles : "");
              this.addGetMapParameter("format",options.hasOwnProperty('format') ? options.format : 'image/jpeg');
              if (options.hasOwnProperty('transparent')) {
                this.addGetMapParameter("transparent",options.transparent);
              }
              this.addGetMapParameter("width",this.tilePixelSize);
              this.addGetMapParameter("height",this.tilePixelSize);
              if (options.hasOwnProperty('time')) {
                this.addGetMapParameter("time=",options.time);
              }
              this.layers = options.layers;
            } else {
              this.loadGetCapabilities(this.manageCapabilities,this.getCapabilitiesRaw,this);
              this.layers = options.layers;
            }


        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractRasterLayer, WMSLayer);

        /**************************************************************************************************************/

        /**
         * Returns the list of layers to load
         * @function getLisLayersToLoad
         * @memberOf WMSLayer#
         * @param {Json} foundLayers
         * @param {Array/String} searchLayers
         * @return {Array} Array of layers name
         */
        WMSLayer.prototype.getListLayersToLoad = function (foundLayers,searchLayers,onlyFirst) {
          // Trivial case : no layers specified, so need to load all
          var isLoadAll = ( (searchLayers === "") || (searchLayers === null) || (typeof searchLayers === "undefined"));
          var isOnlyFirst = ( (onlyFirst !== null) && (typeof onlyFirst !== "undefined") && (onlyFirst === true));

          if (isLoadAll === false) {
            // Get array of layers search
            var arrSearchLayers = searchLayers.split(",");
          }

          if (typeof foundLayers.length === "undefined") {
            // If we found only one element, set it into array
            foundLayers = [foundLayers];
          }

          var toLoadLayers = [];
          for (var i=0;i<foundLayers.length;i++) {
            foundName = foundLayers[i].Name["_text"];
            if (isLoadAll === true) {
              toLoadLayers.push(foundName);
            } else {
              for (var j=0;j<arrSearchLayers.length;j++) {
                if (foundName === arrSearchLayers[j]) {
                  toLoadLayers.push(foundName);
                }
              }
            }
          }

          if ( (onlyFirst) && (toLoadLayers.length>1) ) {
            toLoadLayers = [toLoadLayers[0]];
          }
          return toLoadLayers;
        }

        /**************************************************************************************************************/

        /**
         * When getCapabilities is loading, manage it
         * @function manageCapabilities
         * @memberof WMSLayer#
         * @param json Json object
         * @param sourceObject Object where data is stored
         * @private
         */
        
         WMSLayer.prototype.manageCapabilities = function (json,sourceObject) {
          jsRoot = json.WMT_MS_Capabilities;
          jsCapability = jsRoot.Capability;
          jsLayers = jsCapability.Layer.Layer;
          var toLoadLayers = sourceObject.getListLayersToLoad(jsLayers,sourceObject.options.layers,sourceObject.options.onlyFirst);
          if (toLoadLayers.length === 1) {
            // only one layer to load !
            sourceObject.options.layers = toLoadLayers[0];
          } else {
            // More than one layer, duplicate config
            for (var i=0;i<toLoadLayers.length;i++) {
              layerName = toLoadLayers[i];
              var newConfig = Object.assign({}, sourceObject.options);
              newConfig.layers = layerName;
              newConfig.name += " : "+layerName;
              newConfig.byPass = true;
              sourceObject.multiLayers.push(newConfig);
            }
            if ((sourceObject.callbackContext !== null) && (typeof sourceObject.callbackContext !== "undefined")) {
              sourceObject.callbackContext.addLayerFromObject(sourceObject,sourceObject.options);
            }
            // stop all !
            return;
          }

          var options = sourceObject.options;

          // Build the base GetMap URL
          sourceObject.addGetMapParameter("service","wms");
          sourceObject.addGetMapParameter("version",options.hasOwnProperty('version') ? options.version : '1.1.1');
          sourceObject.addGetMapParameter("request","getMap");
          sourceObject.addGetMapParameter("layers",options.layers);
          sourceObject.addGetMapParameter("styles",options.hasOwnProperty('styles') ? options.styles : "");
          sourceObject.addGetMapParameter("format",options.hasOwnProperty('format') ? options.format : 'image/jpeg');
          if (options.hasOwnProperty('transparent')) {
            sourceObject.addGetMapParameter("transparent",options.transparent);
          }
          sourceObject.addGetMapParameter("width",sourceObject.tilePixelSize);
          sourceObject.addGetMapParameter("height",sourceObject.tilePixelSize);
          if (options.hasOwnProperty('time')) {
            sourceObject.addGetMapParameter("time=",options.time);
          }

          sourceObject.getCapabilitiesEnabled = false;

          if ((sourceObject.callbackContext !== null) && (typeof sourceObject.callbackContext !== "undefined")) {
            sourceObject.callbackContext.addLayerFromObject(sourceObject,sourceObject.options);
          }
        }

        /**
         * Returns the url for the given tile
         * @function getUrl
         * @memberOf WMSLayer#
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        WMSLayer.prototype.getUrl = function (tile) {
          // Just add the bounding box to the GetMap URL
            var bound = tile.bound;
            var bbox = bound.west + "," + bound.south + "," + bound.east + "," + bound.north;

          if ((this.restrictTo !== null) && (typeof this.restrictTo !== "undefined" )) {
            // check if tile is inside restrict zone
            inside = Utils.boundsIntersects(bound,this.restrictTo);
            if ( inside === false) {
              // bypass !
              return null;
            }
          }

            var url = this.getMapRaw;
            url = this.addParameterTo(url,"srs",tile.config.srs);
            url = this.addParameterTo(url,"bbox",bbox);

            return this.proxify(url);
        };

        /**
         * @function getBaseURl
         * @memberOf WMSLayer#
         */
        WMSLayer.prototype.getBaseURl = function() {
            return this.getMapBaseUrl;
        };

        /**************************************************************************************************************/

        return WMSLayer;

    });
