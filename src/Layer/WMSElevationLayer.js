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

define(["../Utils/Utils", "./WMSLayer"], function(Utils, WMSLayer) {
    /**
     * WCSElevation configuration
     * @typedef {AbstractRasterLayer.wms_configuration} AbstractRasterLayer.wmsElevation_configuration
     * @property {int} [tilePixelSize = 33]
     */

    /**
     * @name WMSElevationLayer
     * @class
     *    Creates a layer for elevation data using WMS protocol based on a GeoTiling(4, 2)
     *    with a pixelSize = 33 by default. The only supported format is currently image/x-aaigrid.
     * @augments WMSLayer
     * @param {AbstractLayer.wmsElevation_configuration} options - WMSElevation configuration
     * @constructor
     * @memberof module:Layer
     */
    var WMSElevationLayer = function(options) {
        options.format = "image/x-aaigrid";
        options.tilePixelSize = options.tilePixelSize || 33;
        WMSLayer.prototype.constructor.call(this, options);
    };

    /**************************************************************************************************************/

    Utils.inherits(WMSLayer, WMSElevationLayer);

    /**************************************************************************************************************/

    /**
     * Parse a elevation response
     * @function parseElevations
     * @memberof WMSElevationLayer#
     * @param {string} text Response as text
     * @return {float[]} Array of float
     */
    WMSElevationLayer.prototype.parseElevations = function(text) {
        var elevations = [];
        var lines = text.trim().split("\n");

        for (var i = 5; i < lines.length; i++) {
            var elts = lines[i].trim().split(/\s+/);
            for (var n = 0; n < elts.length; n++) {
                elevations.push(parseInt(elts[n], 10));
            }
        }

        return elevations;
    };

    /**************************************************************************************************************/

    return WMSElevationLayer;
});
