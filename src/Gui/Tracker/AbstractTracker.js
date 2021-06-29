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
import $ from "jquery";
import Utils from "../../Utils/Utils";
/**
 * @name AbstractTracker
 * @class
 *    Abstract class for tracker (position, elevation...)
 * @param {Object} options
 * @param {string} options.element DIV ID where the element is inserted
 * @param {string} [options.position] position of thetracker
 * @throws {ReferenceError} Can't get the Div to insert the tracker
 * @throws {ReferenceError} Can't get the element name
 * @implements {Tracker}
 */
var AbstractTracker = function (options) {
  this.options = options;
  this.context = null;
  this.navigation = null;
  this.element = options.element;
  if (this.element == null) {
    throw new ReferenceError("Can't get the element name from the options parameters");
  } else if (document.getElementById(this.element) == null) {
    throw new ReferenceError(
      "Can' get the div " + this.element + " in the web page to insert " + this.constructor.name
    );
  } else {
    document.getElementById(this.element).innerHTML = "";
    if (options.position) {
      $("#" + this.element).css(options.position, "2px");
    }
  }
};

/**
 * Returns the navigation.
 * @function _getNavigation
 * @memberof AbstractTracker#
 * @private
 */
AbstractTracker.prototype._getNavigation = function () {
  return this.navigation;
};

/**
 * Sets the navigation
 * @function _setNavigation
 * @memberof AbstractTracker#
 */
AbstractTracker.prototype._setNavigation = function (navigation) {
  this.navigation = navigation;
};

/**
 * Returns the globe.
 * @function _getGlobe
 * @memberof AbstractTracker#
 * @private
 */
AbstractTracker.prototype._getGlobe = function () {
  return this.globe;
};

/**
 * Sets the globe
 * @function _setGlobe
 * @memberof AbstractTracker#
 * @private
 */
AbstractTracker.prototype._setGlobe = function (globe) {
  this.globe = globe;
};

/**
 * Returns the DIV element in which the result is written.
 * @function _getElement
 * @memberof AbstractTracker#
 * @private
 */
AbstractTracker.prototype._getElement = function () {
  return this.element;
};

/**
 * Updates the tracker.
 * @function update
 * @memberof AbstractTracker#
 * @abstract
 */
AbstractTracker.prototype.update = function (event) {
  throw new SyntaxError("AbstractTracker.js: update from AbstractTracker not implemented");
};

/**
 * @function compute
 * @memberof AbstractTracker#
 * @abstract
 */
AbstractTracker.prototype.compute = function (geoPosition) {
  throw new SyntaxError("AbstractTracker.js: compute from AbstractTracker not implemented");
};

/**
 * @function attachTo
 * @memberof AbstractTracker#
 */
AbstractTracker.prototype.attachTo = function (context) {
  this._setGlobe(context._getGlobe());
  this._setNavigation(context.getNavigation());
  this._getGlobe().getRenderContext().canvas.addEventListener("mousemove", this.update);
  if (this.options.isMobile) {
    var passiveSupported = Utils.isPassiveSupported();
    this._getGlobe()
      .getRenderContext()
      .canvas.addEventListener(
        "touchmove",
        this.update,
        passiveSupported
          ? {
              passive: true
            }
          : false
      );
  }
};

/**
 * @function detach
 * @memberof AbstractTracker#
 */
AbstractTracker.prototype.detach = function () {
  document.getElementById(this._getElement()).innerHTML = "";
  this._getGlobe().getRenderContext().canvas.removeEventListener("mousemove", this.update);
  if (this.options.isMobile) {
    this._getGlobe().getRenderContext().canvas.removeEventListener("touchmove", this.update);
  }
};

/**
 * @function destroy
 * @memberof AbstractTracker#
 */
AbstractTracker.prototype.destroy = function () {
  document.getElementById(this._getElement()).innerHTML = "";
  this.element = null;
  this.options = null;
  // we do do not destroy the globe now. It will be destroyed later on in the context
};

export default AbstractTracker;
