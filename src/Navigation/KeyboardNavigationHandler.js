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

define(function () {

    /**
     * Keyboard navigation handler configuration
     * @typedef {Object} AbstractNavigation.keyboard_configuration
     * @property {float} [panFactor = 10.0] - Factor for panning within the scene
     * @property {float} [zoomFactor = 1.0] - Factor for zooming into the scene
     * @property {boolean} [installOnDocument = false] -True to install the event listener on the document and not on the canvas
     */

    /**
     * @name KeyboardNavigationHandler
     * @class
     * KeyboardNavigationHandler constructor.<br/>
     * The keyboard shortcuts are the following :
     * <ul>
     *     <li><i>space bar</i> : Stop all animations when an event is received</li>
     *     <li><i>+</i> : zoom in the camera</li>
     *     <li><i>-</i> : zoom out the camera</li>
     *     <li><i>Left arrow</i> : pan the camera left</li>
     *     <li><i>shift + left arrow</i> : rotate the camera counterclockwise</li>
     *     <li><i>Right arrow</i> : pan the camera right</li>
     *     <li><i>shift + right arrow</i> : rotate the camera clockwise</li>
     *     <li><i>Up arrow</i> : pan the camera up</li>
     *     <li><i>shift + up arrow</i> : rotate the camera up</li>
     *     <li><i>Down arrow</i> : pan the camera down</li>
     *     <li><i>shift + down arrow</i> : rotate the camera down</li>
     * </ul>
     *
     * @param {AbstractNavigation.keyboard_configuration} options - Keyboard navigation configuration
     * @constructor
     * @memberOf module:Navigation
     */
    var KeyboardNavigationHandler = function (options) {

        /**************************************************************************************************************/

        /**
         * Private variables
         */
        var _navigation = null;
        var self = this;

        /**
         * Public variables
         */
        this.panFactor = 10.0;
        this.zoomFactor = 1.0;

        // Setup options
        if (options) {
            if (options.panFactor && typeof options.panFactor === 'number') {
                this.panFactor = options.panFactor;
            }
            if (options.zoomFactor && typeof options.zoomFactor === 'number') {
                this.zoomFactor = options.zoomFactor;
            }
        }

        /**************************************************************************************************************/

        /**
         * Private methods
         */

        /**
         * Set focus
         */
        var _setFocus = function (event) {
            this.focus();
            return false;
        };

        /**
         * Event handler for key down.
         * @param event
         * @private
         */
        var _handleKeyDown = function (event) {
            switch (event.keyCode) {
                case 32 :
                    // space bar
                    // Stop all animations when an event is received
                    _navigation.stopAnimations();
                    break;
                case 187 :
                // + on Safari
                // falls through
                case 61 :
                // +(=) on Firefox and Opera
                // falls through
                case 107 :
                    // + on other
                    _navigation.zoom(-self.zoomFactor);
                    break;
                case 189 :
                // - on Safari
                // falls through
                case 54 :
                // -(6) on Firefox and Opera
                // falls through
                case 109 :
                    // - on other
                    _navigation.zoom(self.zoomFactor);
                    break;
                case 81 :
                // q
                // falls through
                case 37 :
                    // Left arrow
                    if (event.shiftKey) {
                        _navigation.rotate(self.panFactor, 0);
                    }
                    else {
                        _navigation.pan(self.panFactor, 0);
                    }
                    break;
                case 90 :
                // z
                // falls through
                case 38 :
                    // Up arrow
                    if (event.shiftKey) {
                        _navigation.rotate(0, self.panFactor);
                    }
                    else {
                        _navigation.pan(0, self.panFactor);
                    }
                    break;
                case 68 :
                // d
                // falls through
                case 39 :
                    // Right arrow
                    if (event.shiftKey) {
                        _navigation.rotate(-self.panFactor, 0);
                    }
                    else {
                        _navigation.pan(-self.panFactor, 0);
                    }
                    break;
                case 83 :
                // s
                // falls through
                case 40 :
                    // Down arrow
                    if (event.shiftKey) {
                        _navigation.rotate(0, -self.panFactor);
                    }
                    else {
                        _navigation.pan(0, -self.panFactor);
                    }
                    break;
            }
        };

        var _handleKeyUp = function (event) {
            _navigation.donePanning();
            _navigation.doneRotating();
        };

        /**************************************************************************************************************/

        /**
         * Public methods
         */

        /**
         Setup the default event handlers for the navigation
         */
        this.install = function (navigation) {
            // Setup the keyboard event handlers
            _navigation = navigation;

            if (options && options.installOnDocument) {
                document.addEventListener("keydown", _handleKeyDown);
                document.addEventListener("keyup", _handleKeyUp);
            }
            else {
                var canvas = _navigation.renderContext.canvas;
                canvas.addEventListener("keydown", _handleKeyDown);
                canvas.addEventListener("keyup", _handleKeyUp);
                // Setup focus handling to receive keyboard event on canvas
                canvas.tabIndex = "0";
                canvas.addEventListener("mousedown", _setFocus);
            }
        };

        /**
         Remove the default event handlers for the navigation
         */
        this.uninstall = function () {
            if (options && options.installOnDocument) {
                document.removeEventListener("keydown", _handleKeyDown);
                document.removeEventListener("keyup", _handleKeyUp);
            }
            else {
                var canvas = _navigation.renderContext.canvas;
                canvas.removeEventListener("keydown", _handleKeyDown);
                canvas.removeEventListener("keyup", _handleKeyUp);
                canvas.removeEventListener("mousedown", _setFocus);
            }
        };

    };

    return KeyboardNavigationHandler;

});
