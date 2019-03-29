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
define([
    "jquery",
    "./AbstractTracker",
    "../../Utils/Utils",
    "../../Utils/Numeric"
], function($, AbstractTracker, Utils, Numeric) {
    var self;

    /**
     * @name ElevationTracker
     * @class
     *   Elevation Tracker
     * @augments AbstractTracker
     * @param {AbstractTracker_elevation_configuration} options - Elevation tracker configuration
     * @constructor
     * @memberof module:Tracker
     */
    var ElevationTracker = function(options) {
        AbstractTracker.prototype.constructor.call(this, options);
        this.scale = null;
        if (options.elevationLayer != null) {
            this.scale = options.elevationLayer.getScale();
        }
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractTracker, ElevationTracker);

    /**************************************************************************************************************/

    /**
     * Sets the scale layer taken from the elevationLayer
     * @param {WCSElevationLayer}elevationLayer
     */
    ElevationTracker.prototype.setScaleLayer = function(elevationLayer) {
        this.scale = elevationLayer.getScale();
        this.options.elevationLayer = elevationLayer;
    };

    /**
     * @function update
     * @memberof AbstractTracker.prototype
     */
    ElevationTracker.prototype.update = function(event) {
        if (event.type.search("touch") >= 0) {
            event.offsetX = event.changedTouches[0].offsetX;
            event.offsetY = event.changedTouches[0].offsetY;
        }
        if (document.getElementById(self._getElement()) && self.options.elevationLayer && self.options.elevationLayer.isRequested()) {
            var geoPos = self
                ._getGlobe()
                .getLonLatFromPixel(event.offsetX, event.offsetY);
            if (geoPos && self.scale) {
                var elevation = self.compute([geoPos[0], geoPos[1]]);
                document.getElementById(self._getElement()).innerHTML =
                    "Elevation : " +
                    Numeric.roundNumber(elevation / self.scale, 0) +
                    " meters";
            } else {
                document.getElementById(self._getElement()).innerHTML = "";
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * @function compute
     * @memberof ElevationTracker#
     */
    ElevationTracker.prototype.compute = function(geoPosition) {
        return this._getGlobe().getElevation(geoPosition[0], geoPosition[1]);
    };

    /**
     * @function attachTo
     * @memberof ElevationTracker#
     */
    ElevationTracker.prototype.attachTo = function(context) {
        AbstractTracker.prototype.attachTo.call(this, context);
        self = this;
    };

    /**
     * @function detach
     * @memberof ElevationTracker#
     */
    ElevationTracker.prototype.detach = function() {
        AbstractTracker.prototype.detach.call(this);
        self = null;
    };

    /**
     * @function destroy
     * @memberof ElevationTracker#
     */
    ElevationTracker.prototype.destroy = function() {
        this.detach.call(this);
        AbstractTracker.prototype.destroy.call(this);
        this.scale = null;
        self = null;
    };

    /**************************************************************************************************************/

    return ElevationTracker;
});
