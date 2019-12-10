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

define([
    "../Utils/Utils",
    "./AbstractHipsLayer",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog"
], function(Utils, AbstractHipsLayer, Constants, ErrorDialog) {
    /**************************************************************************************************************/

    /**
     * HipsFits configuration
     * @typedef {AbstractHipsLayer.configuration} AbstractHipsLayer.graphic_configuration
     * @property {Function} onready - Callback function
     */

    /**
     * @name HipsGraphicLayer
     * @class
     * This layer draws an Hips Image
     * @augments AbstractHipsLayer
     * @param {HipsMetadata} hipsMetadata
     * @param {AbstractHipsLayer.graphic_configuration} options - HipsGraphic configuration
     * @memberof module:Layer
     * @see {@link http://www.ivoa.net/documents/HiPS/20170406/index.html Hips standard}
     * @fires Context#baseLayersError
     */
    var HipsGraphicLayer = function(hipsMetadata, options) {
        //options.format = options.format || "jpg";
        AbstractHipsLayer.prototype.constructor.call(
            this,
            hipsMetadata,
            options
        );

    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractHipsLayer, HipsGraphicLayer);

    /**************************************************************************************************************/

    /**
     * Returns an url from a given tile.
     * @function getUrl
     * @memberof HipsGraphicLayer#
     * @param {Tile} tile Tile
     * @return {string} Url
     */
    HipsGraphicLayer.prototype.getUrl = function(tile) {
        var url = this.baseUrl;

        url += "/Norder";
        url += tile.order;
        
        url += "/Dir";
        var indexDirectory = Math.floor(tile.pixelIndex / 10000.0) * 10000.0;
        url += indexDirectory;

        url += "/Npix";
        url += tile.pixelIndex;
        url += "." + this.format;

        return this.allowRequest(url);
    };

    /**************************************************************************************************************/

    return HipsGraphicLayer;
});
