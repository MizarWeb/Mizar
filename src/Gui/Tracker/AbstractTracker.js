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
define(["jquery"],
    function ($) {

        /**
         * @name AbstractTracker
         * @class
         *    Abstract class for tracker (position, elevation...)
         * @param {object} options
         * @constructor
         * @implements {Tracker}
         */
        var AbstractTracker = function (options) {
            this.options = options;
            this.context = null;
            this.navigation = null;
            this.element = options.element;
            //if (document.getElementById(this.element)) {
                document.getElementById(this.element).innerHTML = "";
            //} else {
            //    console.log("Can't get div "+this.element);
            //}
            if (options.position) {
                //if ($("#" + this.element)) {
                    $("#" + this.element).css(options.position, "2px");
                //} else {
                //    console.log("Can't get div "+this.element);                    
                //}
            }
        };

        /**
         * Returns the navigation.
         * @function _getNavigation
         * @memberOf AbstractTracker#
         */
        AbstractTracker.prototype._getNavigation = function () {
            return this.navigation;
        };

        /**
         * Sets the navigation
         * @function _setNavigation
         * @memberOf AbstractTracker#
         */
        AbstractTracker.prototype._setNavigation = function (navigation) {
            this.navigation = navigation;
        };

        /**
         * Returns the globe.
         * @function _getGlobe
         * @memberOf AbstractTracker#
         */
        AbstractTracker.prototype._getGlobe = function () {
            return this.globe;
        };

        /**
         * Sets the globe
         * @function _setGlobe
         * @memberOf AbstractTracker#
         */
        AbstractTracker.prototype._setGlobe = function (globe) {
            this.globe = globe;
        };

        /**
         * Returns the DIV element in which the result is written.
         * @function _getElement
         * @memberOf AbstractTracker#
         */
        AbstractTracker.prototype._getElement = function () {
            return this.element;
        };

        /**
         * Updates the tracker.
         * @function update
         * @memberOf AbstractTracker#
         * @abstract
         */
        AbstractTracker.prototype.update = function (event) {
            throw new SyntaxError("update from AbstractTracker not implemented", "AbstractTracker.js");
        };

        /**
         * @function compute
         * @memberOf AbstractTracker#
         * @abstract
         */
        AbstractTracker.prototype.compute = function (geoPosition) {
            throw new SyntaxError("compute from AbstractTracker not implemented", "AbstractTracker.js");
        };

        /**
         * Attachs the tracker to the globe.
         * @function attachTo
         * @memberOf AbstractTracker#
         */
        AbstractTracker.prototype.attachTo = function (context) {
            this._setGlobe(context._getGlobe());
            this._setNavigation(context.getNavigation());
            this._getGlobe().getRenderContext().canvas.addEventListener('mousemove', this.update);
            if (this.options.isMobile) {
                this._getGlobe().getRenderContext().canvas.addEventListener('touchmove', this.update, {passive: true});
            }
        };

        /**
         * Detachs the tracker from the globe.
         * @function detach
         * @memberOf AbstractTracker#
         */
        AbstractTracker.prototype.detach = function () {
            document.getElementById(this._getElement()).innerHTML = "";
            this._getGlobe().getRenderContext().canvas.removeEventListener('mousemove', this.update);
            if (this.options.isMobile) {
                this._getGlobe().getRenderContext().canvas.removeEventListener('touchmove', this.update);
            }
        };

        /**
         * Destroys the elements.
         * @function destroy
         * @memberOf AbstractTracker#
         */
        AbstractTracker.prototype.destroy = function () {
            document.getElementById(this._getElement()).innerHTML = "";
            this.element = null;
            this.options = null;
            // we do do not destroy the globe now. It will be destroyed later on in the context
        };


        return AbstractTracker;
    });
