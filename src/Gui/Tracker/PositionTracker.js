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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/

/**
 * Tracker to display on the screen :
 * <ul>
 *     <li>{@link module:Tracker.PositionTracker PositionTracker}: Displays the coordinates</li>
 *     <li>{@link module:Tracker.ElevationTracker ElevationTracker} : Displays the elevation</li>
 * </ul>
 *
 * See {@tutorial getting-started-tracker} for an example of tracker position.
 *
 * @module Tracker
 * @implements {Tracker}
 *
 */
define([
    "jquery",
    "./AbstractTracker",
    "../dialog/CrsDialog",
    "../../Utils/Utils"
], function($, AbstractTracker, CrsDialog, Utils) {
    var self;
    var posTrackerInfoHTML = "<input type=\"button\" id=\"posTrackerInfoButton\"/>";

    /**
     * @name PositionTracker
     * @class
     *    Position Tracker
     * @augments AbstractTracker
     * @param {AbstractTracker_position_configuration} options - Position tracker configuration
     * @constructor
     * @memberof module:Tracker
     */
    var PositionTracker = function(options) {
        AbstractTracker.prototype.constructor.call(this, options);
    };
    /**************************************************************************************************************/

    Utils.inherits(AbstractTracker, PositionTracker);

    /**************************************************************************************************************/

    /**
     * @function update
     * @memberof PositionTracker#
     */
    PositionTracker.prototype.update = function(event) {
        if (event.type.search("touch") >= 0) {
            event.offsetX = event.changedTouches[0].offsetX;
            event.offsetY = event.changedTouches[0].offsetY;
        }

        if (document.getElementById(self._getElement())) {
            var $crsInfo = $("#" + self._getElement() + "Info");
            var geoPos = self
                ._getGlobe()
                .getLonLatFromPixel(event.offsetX, event.offsetY);
            if (geoPos) {
                var astro = self.compute([geoPos[0], geoPos[1]]);
                document.getElementById(self._getElement()).innerHTML =
                    astro[0] + " x " + astro[1];
                if ($crsInfo.css("display") == "none") {
                    $crsInfo.show();
                }
            } else {
                document.getElementById(self._getElement()).innerHTML = "";
                if ($crsInfo.css("display") != "none") {
                    $crsInfo.hide();
                }
            }
        }
    };

    /**
     * @function compute
     * @memberof PositionTracker#
     */
    PositionTracker.prototype.compute = function(geoPosition) {
        return this._getGlobe()
            .getCoordinateSystem()
            .formatCoordinates([geoPosition[0], geoPosition[1]]);
    };

    /**
     * Attachs the tracker to the context.
     *
     * Attachs the tracker to the context by calling the attachTo method from the AbstractTracker. Then, the CrsDialog
     * is filled with Crs information. Finally, the onClick event is set to get the Crs information. The onClick event
     * is enabled on the <i>#posTrackerInfoButton</i> ID
     *
     * @function attachTo
     * @memberof PositionTracker#
     * @param {Context} context context
     * @see {@link CrsDialog}
     * @see {@link AbstrackTracker#attachTo}
     */
    PositionTracker.prototype.attachTo = function(context) {
        AbstractTracker.prototype.attachTo.call(this, context);
        $(posTrackerInfoHTML).appendTo("#" + this._getElement() + "Info");
        CrsDialog.open(context._getGlobe().getCoordinateSystem());
        $("#posTrackerInfoButton").on("click", function() {
            if (CrsDialog.isActive() === true) {
                CrsDialog.hide();
            } else {
                CrsDialog.view();
            }
        });
        self = this;
    };

    /**
     * Detaches the tracker.
     *
     * Detaches the tracker from the glob by calling the detach method from the AbstractTracker. Then, the onClick
     * event is removed and the CrsDialog is destroyed as well.
     *
     * @function detach
     * @memberof PositionTracker#
     */
    PositionTracker.prototype.detach = function() {
        $("#posTrackerInfoButton").off("click");
        $("#" + this._getElement() + "Info").empty();
        CrsDialog.destroy();
        AbstractTracker.prototype.detach.call(this);
        self = null;
    };

    /**
     * Destroys the position tracker.
     * @function destroy
     * @memberof AbstractTracker.prototype
     */
    PositionTracker.prototype.destroy = function() {
        this.detach(this);
        AbstractTracker.prototype.destroy.call(this);
        self = null;
    };

    /**************************************************************************************************************/

    return PositionTracker;
});
