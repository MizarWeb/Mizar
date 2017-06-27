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

/**
 * Planet renderer/layer module
 */
define(["jquery", "underscore-min", "./AbstractLayer", "../Crs/CoordinateSystemFactory","./WMSLayer", "./WCSElevationLayer", "../Utils/Utils", "../Services/ServiceFactory", "../Utils/Constants"],
    function ($, _, AbstractLayer, CoordinateSystemFactory, WMSLayer, WCSElevationLayer, Utils, ServiceFactory, Constants) {

        /**
         * Planet layer.
         * @param options - See {AbstractLayer} for base properties
         * @param {Object} options.elevation
         * @constructor
         * @memberOf module:Layer
         */
        var PlanetLayer = function (options) {
            options.coordinateSystem = options.hasOwnProperty('coordinateSystem') ? CoordinateSystemFactory.create(options.coordinateSystem) : CoordinateSystemFactory.create({geoideName: Constants.CRS.WGS84});
            AbstractLayer.prototype.constructor.call(this, Constants.LAYER.Planet, options);
            this.name = options.name;
            this.baseImageries = [];
            this.layers = [];
            this.category = "Planets";
            this.nameResolver = options.nameResolver;

            this.typeLayer = "Planet";

            for (var i = 0; i < options.baseImageries.length; i++) {
                var planetDesc = options.baseImageries[i];
                planetDesc = $.extend({}, options, planetDesc);
                var gwLayer = new WMSLayer(planetDesc);
                gwLayer.background = true;
                gwLayer.category = "background";
                gwLayer.type = "WMS";
                this.baseImageries.push(gwLayer);
            }
            if (options.elevation) {
                this.elevationLayer = new WCSElevationLayer(options.elevation);
            }
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractLayer, PlanetLayer);

        /**************************************************************************************************************/

        /**
         * Attach to a planet
         * @param {Planet} g Planet
         * @private
         */

        PlanetLayer.prototype._attach = function (g) {
            AbstractLayer.prototype._attach.call(this, g);
            var baseImagery = _.findWhere(this.baseImageries, {visible: true});
            // Set first WMS layer as base imagery
            if (!baseImagery) {
                baseImagery = this.baseImageries[0];
            }
            this.globe.setBaseImagery(baseImagery);
            // Set elevation if exists
            if (this.elevationLayer) {
                this.globe.setBaseElevation(this.elevationLayer);
            }
            baseImagery.setVisible(true);

            for (var i = 0; i < this.layers.length; i++) {
                this.globe.addLayer(this.layers[i]);
            }
        };

        /**************************************************************************************************************/

        /**
         * Detach
         * @private
         */
        PlanetLayer.prototype._detach = function () {
            this.globe.setBaseImagery(null);
            for (var i = 0; i < this.layers.length; i++) {
                this.globe.removeLayer(this.layers[i]);
            }
            AbstractLayer.prototype._detach.call(this);
        };

        /**************************************************************************************************************/

        return PlanetLayer;

    });
