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

define(['../Utils/Utils', './AbstractRasterLayer', '../Utils/Constants'],
    function (Utils, AbstractRasterLayer, Constants) {
        /**
         * Configuration parameters to query a Web Map Tile Service (WMTS)
         * @typedef {AbstractRasterLayer} AbstractRasterLayer.wmts_configuration
         * @property {string} [version = "1.0.0"] WMTS version
         * @property {string} layer - basic unit of geographic information that may be requested as a map from a server
         * @property {string} matrixSet - The name of pyramidal images
         * @property {int} startLevel - Start level of the index
         * @property {string} [style] - Styled Layers Descriptor
         */
        /**
         * @name WMTSLayer
         * @class
         *    Creates a layer for imagery data using WMTS protocol.
         *    <br/>
         *    WMTS protocol provides tiles with a resolution of <i>tilePixelSize</i><br/>
         *    based on a GeoTiling(4, 2)<br/>
         *    <img src="../doc/images/wmts_tile.png"/><br/>
         *    <br/
         *    Example of a WMTS request:
         *    <code>
         *            http://example.com/wmts?LAYER=MyLayer1,MyLayer2&
         *            EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&
         *            VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&
         *            TILEMATRIXSET=PM&TILEMATRIX=18&TILEROW=90241&TILECOL=132877&
         *    </code>
         *    <br/><br/>
         *    The parameters of a WMTS server are the following:
         *    <ul>
         *        <li><b>TILEMATRIXSET</b>: The name of pyramidal images</li>
         *        <li><b>TILEMATRIX</b>: The name of the matrix that contains the tile</li>
         *        <li><b>TILEROW</b>: The line number from the top left corner from the tile</li>
         *        <li><b>TILECOL</b>: The column number from the top left corner from the tile</li>
         *    </ul>
         *    <img src="../doc/images/wmts_pixel.png"/>
         *
         * @augments AbstractRasterLayer
         * @param {AbstractRasterLayer.configuration} options - WMTS configuration
         * @property {int} [tilePixelSize = 256] - tile in pixels
         * @property {int} [numberOfLevels = 21] - number of levels
         * @property {string} [version = "1.0.0"] - WMS version
         * @property {string} [transparent]
         * @property {string} [time] - Time dimension
         * @property {string} [format = "image/png"] - output image format
         * @constructor
         * @memberOf module:Layer
         * @see {@link http://www.opengeospatial.org/standards/wmts WMTS} standard
         * @see {@link http://www.opengeospatial.org/standards/sld SLD} standard
         */
        var WMTSLayer = function (options) {
            AbstractRasterLayer.prototype.constructor.call(this, Constants.LAYER.WMTS, options);

            this.startLevel = options.startLevel || 1;

            // Build the base GetTile URL
            var url = this.baseUrl;
            if (url.indexOf('?', 0) === -1) {
                url += '?service=wmts';
            }
            else {
                url += '&service=wmts';
            }
            url += "&version=";
            url += options.version || '1.0.0';
            url += "&request=GetTile";
            url += "&layer=" + options.layer;
            url += "&tilematrixset=" + options.matrixSet;
            if (options.style) {
                url += "&style=" + options.style;
            }
            url += "&format=";
            this.format = options.hasOwnProperty('format') ? options.format : 'image/png';
            url += this.format;
            if (options.time) {
                url += "&time=" + options.time;
            }

            this.getTileBaseUrl = this._proxifyUrl(url);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractRasterLayer, WMTSLayer);

        /**************************************************************************************************************/

        /**
         * Returns an url for the given tile
         * @function getUrl
         * @memberOf WMTSLayer#
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        WMTSLayer.prototype.getUrl = function (tile) {
            var url = this.getTileBaseUrl;
            url += "&tilematrix=";
            url += tile.level + this.startLevel;
            url += "&tilecol=" + tile.x;
            url += "&tilerow=" + tile.y;

            return url;
        };

        /**
         * @function getBaseURl
         * @memberOf WMTSLayer#
         */
        WMTSLayer.prototype.getBaseURl = function() {
            return this.getTileBaseUrl;
        };

        /**************************************************************************************************************/

        return WMTSLayer;

    });
