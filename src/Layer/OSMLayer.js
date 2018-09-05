/*******************************************************************************
 * Copyright 2017, 2018 CNES8 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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

define(['../Utils/Utils', './AbstractRasterLayer', '../Utils/Constants', '../Tiling/MercatorTiling'],
    function (Utils, AbstractRasterLayer, Constants, MercatorTiling) {

        /**************************************************************************************************************/

        /**
         * Open Street Map configuration
         * @typedef {AbstractRasterLayer.configuration} AbstractRasterLayer.osm_configuration
         * @property {int} [tilePixelSize=256]
         * @property {int} [baseLevel=2]
         * @property {int} [numberOfLevels=21]
         */
        /**
         * @name OSMLayer
         * @class
         *    A layer to display data coming from OpenStreetMap server. OpenStreetMap (OSM) is a collaborative project to
         * create a free editable map of the world
         * @augments AbstractRasterLayer
         * @param {AbstractRasterLayer.osm_configuration} options - OSM Configuration
         * @memberOf module:Layer
         */
        var OSMLayer = function (options) {
            options.tilePixelSize = options.tilePixelSize || 256;
            options.tiling = new MercatorTiling(options.baseLevel || 2);
            options.numberOfLevels = options.numberOfLevels || 21;
            AbstractRasterLayer.prototype.constructor.call(this, Constants.LAYER.OSM, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractRasterLayer, OSMLayer);

        /**************************************************************************************************************/

        /**
         * Returns an url for the given tile.
         * @function getUrl
         * @memberof OSMLayer#
         * @param {Tile} tile Tile
         * @return {String} Url
         */
        OSMLayer.prototype.getUrl = function (tile) {
            var url =  this.baseUrl + '/' + tile.level + '/' + tile.x + '/' + tile.y + '.png';
            return this.proxify(url, tile.level);
        };


        /**************************************************************************************************************/

        return OSMLayer;

    });
