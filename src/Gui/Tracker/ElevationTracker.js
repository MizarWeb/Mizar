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
define(["jquery", "./AbstractTracker", "../../Utils/Utils", "../../Utils/Numeric"],
    function ($, AbstractTracker, Utils, Numeric) {

        var globe;
        var element;
        var scale;
        var self;

        /**
         * Elevation tracker configuration
         * @typedef {AbstractTracker.position_configuration} AbstractTracker.elevation_configuration
         * @property {Layer} [elevationLayer] - elevationLayer
         */

        /**
         * @name ElevationTracker
         * @class
         *   ElevationTracker context constructor
         * @augments AbstractTracker
         * @param {AbstractTracker.elevation_configuration} options - Elevation tracker configuration
         * @constructor
         */
        var ElevationTracker = function (options) {
            AbstractTracker.prototype.constructor.call(this, options);

            self = this;
            element = options.element;
            if (options.position) {
                $("#" + element).css(options.position, "2px");
            }
            if (options.elevationLayer !== null && options.elevationLayer !== undefined) {
                scale = options.elevationLayer.hasOwnProperty('scale') ? options.elevationLayer.scale : 1;
            }

        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractTracker, ElevationTracker);

        /**************************************************************************************************************/

        /**
         * Sets the scale layer taken from the elevationLayer
         * @param elevationLayer
         */
        ElevationTracker.prototype.setScaleLayer = function (elevationLayer) {
            scale = elevationLayer.hasOwnProperty('scale') ? elevationLayer.scale : 1;
        };

        /**
         * Att
         * @param globeContext
         */
        ElevationTracker.prototype.attachTo = function (globeContext) {
            globe = globeContext;
            globe.renderContext.canvas.addEventListener('mousemove', self.update);
            if (this.options.isMobile) {
                globe.renderContext.canvas.addEventListener('touchmove', self.update);
            }

        };

        ElevationTracker.prototype.detach = function () {
            globe.renderContext.canvas.removeEventListener('mousemove', self.update);
            if (this.options.isMobile) {
                globe.renderContext.canvas.removeEventListener('touchmove', self.update);
            }
        };

        /**
         * Update the tracker
         * @function update
         * @memberof AbstractTracker.prototype
         * @param {object} event
         */
        ElevationTracker.prototype.update = function (event) {
            if (event.type.search("touch") >= 0) {
                event.clientX = event.changedTouches[0].clientX;
                event.clientY = event.changedTouches[0].clientY;
            }
            if (document.getElementById(element)) {
                var geoPos = globe.getLonLatFromPixel(event.clientX, event.clientY);
                if (geoPos && scale) {
                    var elevation = self.compute([geoPos[0], geoPos[1]]);
                    document.getElementById(element).innerHTML = "Elevation : " + Numeric.roundNumber(elevation / scale, 0) + " meters";
                } else {
                    document.getElementById(element).innerHTML = "";
                }
            }

        };

        /**************************************************************************************************************/

        /**
         * Compute elevation from a specific point
         * @function compute
         * @memberof AbstractTracker.prototype
         * @param geoPosition
         * @returns {number} elevation
         */
        ElevationTracker.prototype.compute = function (geoPosition) {
            return globe.getElevation(geoPosition[0], geoPosition[1]);
        };

        /**************************************************************************************************************/

        return ElevationTracker;

    });
