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
define(["jquery", "./AbstractTracker", "../../Utils/Utils"],
    function ($, AbstractTracker, Utils) {

        var globe;
        var element;
        var self;

        /**
         * Position tracker configuration
         * @typedef {Object} AbstractTracker.position_configuration
         * @property {string} element - tracker div element
         * @property {string} position - tracker position in the GUI
         * @property {boolean} [isMobile = false] - Mobile device         
         */

        /**
         * @name PositionTracker
         * @class
         *    PositionTracker constructor
         * @augments AbstractTracker
         * @param {AbstractTracker.position_configuration} options - Position tracker configuration
         * @constructor
         */
        var PositionTracker = function (options) {
            AbstractTracker.prototype.constructor.call(this, options);

            self = this;
            element = options.element;
            if (options.position) {
                $("#" + element).css(options.position, "2px");
            }
        };
        /**************************************************************************************************************/

        Utils.inherits(AbstractTracker, PositionTracker);

        /**************************************************************************************************************/

        /**
         * Attaches the tracker to the globe.
         * @function attachTo
         * @memberOf PositionTracker#
         * @param {Globe} globeContext - globe
         */
        PositionTracker.prototype.attachTo = function (globeContext) {
            globe = globeContext;
            globe.renderContext.canvas.addEventListener('mousemove', self.update);
            if (this.options.isMobile) {
                globe.renderContext.canvas.addEventListener('touchmove', self.update);
            }
        };

        /**
         * Detaches the tracker from the globe
         * @function detach
         * @memberOf PositionTracker#
         */
        PositionTracker.prototype.detach = function () {
            globe.renderContext.canvas.removeEventListener('mousemove', self.update);
            if (this.options.isMobile) {
                globe.renderContext.canvas.removeEventListener('touchmove', self.update);
            }
        };

        /**
         * Update the tracker
         * @function update
         * @memberOf PositionTracker#
         * @param {object} event
         */
        PositionTracker.prototype.update = function (event) {
            if (event.type.search("touch") >= 0) {
                event.clientX = event.changedTouches[0].clientX;
                event.clientY = event.changedTouches[0].clientY;
            }

            if (document.getElementById(element)) {
                var geoPos = globe.getLonLatFromPixel(event.clientX, event.clientY);
                if (geoPos) {
                    var astro = self.compute([geoPos[0], geoPos[1]]);
                    document.getElementById(element).innerHTML = astro[0] + " x " + astro[1];
                } else {
                    document.getElementById(element).innerHTML = "";

                }
            }
        };


        /**
         * Compute position from a specific point
         * @function compute
         * @memberOf PositionTracker#
         * @param geoPosition
         * @returns {number} coordinates
         */
        PositionTracker.prototype.compute = function (geoPosition) {
            return globe.getCoordinateSystem().formatCoordinates([geoPosition[0], geoPosition[1]]);
        };

        /**************************************************************************************************************/

        return PositionTracker;

    });
