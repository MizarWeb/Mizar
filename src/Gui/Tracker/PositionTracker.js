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
define(["jquery", "./AbstractTracker", "../dialog/CrsDialog","../../Utils/Utils"],
    function ($, AbstractTracker, CrsDialog, Utils) {

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
        };
        /**************************************************************************************************************/

        Utils.inherits(AbstractTracker, PositionTracker);

        /**************************************************************************************************************/

        PositionTracker.prototype._updateTracker = function(tracker) {
            self = tracker;
            CrsDialog.open(tracker._getGlobe().getCoordinateSystem());
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

            if (document.getElementById(self._getElement())) {
                var $crsInfo = $("#" + self._getElement()+"Info");
                var geoPos = self._getGlobe().getLonLatFromPixel(event.clientX, event.clientY);
                if (geoPos) {
                    var astro = self.compute([geoPos[0], geoPos[1]]);
                    document.getElementById(self._getElement()).innerHTML = astro[0] + " x " + astro[1];
                    if( $crsInfo.css('display') == 'none' ){
                        $crsInfo.show();
                    }
                } else {
                    document.getElementById(self._getElement()).innerHTML = "";
                    if( $crsInfo.css('display') != 'none' ){
                        $crsInfo.hide();
                    }
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
            return this._getGlobe().getCoordinateSystem().formatCoordinates([geoPosition[0], geoPosition[1]]);
        };

        /**
         * @function attachTo
         * @memberOf PositionTracker#
         */
        PositionTracker.prototype.attachTo = function (globeContext) {
            AbstractTracker.prototype.attachTo.call(this, globeContext);
            CrsDialog.open(globeContext.getCoordinateSystem());
            $('#posTrackerInfoButton').on('click', function () {
                if (CrsDialog.isActive() === true) {
                    CrsDialog.hide();
                } else {
                    CrsDialog.view();
                }
            });
            self = this;
        };

        /**
         * @function detach
         * @memberOf PositionTracker#
         */
        PositionTracker.prototype.detach = function () {
            AbstractTracker.prototype.detach.call(this);
            $("#posTrackerInfoButton").off("click");
            CrsDialog.destroy();
        };

        /**
         * Destroy the elevation tracker.
         * @function destroy
         * @memberOf AbstractTracker.prototype
         */
        PositionTracker.prototype.destroy = function() {
            this.detach(this);
            //AbstractTracker.prototype.destroy.call(this);
        };


        /**************************************************************************************************************/

        return PositionTracker;

    });
