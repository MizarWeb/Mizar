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
/**
 * @name NavigationHandlerFactory
 * @class
 * Factory to create a device for the control of the camera.
 * @memberOf module:Navigation
 */
define(["../Utils/Constants","./GoogleMouseNavigationHandler","./KeyboardNavigationHandler","./MouseNavigationHandler","./TouchNavigationHandler"],
    function(Constants, GoogleMouseNavigationHandler, KeyboardNavigationHandler, MouseNavigationHandler, TouchNavigationHandler) {

        return {
            /**
             * Creates a specific navigation based on its type (e.g Astro, Flat, Sky).
             * @param {HANDLER} type - the type of navigation
             * @param {AbstractNavigation.touch_configuration|AbstractNavigation.mouse_configuration|AbstractNavigation.googleMouse_configuration|AbstractNavigation.keyboard_configuration} options - see the handlers.
             * @return {Object} one of the handler
             * @alias module:Navigation.NavigationHandlerFactory.create
             * @see {@link GoogleMouseNavigationHandler} - Control the camera with mouse as Google movement
             * @see {@link KeyboardNavigationHandler} - Control the camera with the keyboard
             * @see {@link MouseNavigationHandler} - Control the camera with the mouse
             * @see {@link TouchNavigationHandler} - Control the camera with the smartphone
             * @throws {RangeError} Type not valid - a valid type is included in the list {@link HANDLER}
             */
            create : function(type, options) {
                var obj;
                switch (type) {
                    case Constants.HANDLER.GoogleMouse:
                        obj = new GoogleMouseNavigationHandler(options);
                        break;
                    case Constants.HANDLER.Keyboard:
                        obj = new KeyboardNavigationHandler(options);
                        break;
                    case Constants.HANDLER.Mouse:
                        obj = new MouseNavigationHandler(options);
                        break;
                    case Constants.HANDLER.Touch:
                        obj = new TouchNavigationHandler(options);
                        break;
                    default:
                        throw RangeError("The type "+type+" is not allowed, A valid type is included in the list Constants.HANDLER", "NavigationHandlerFactory.js");
                }
                return obj;
            }
    }});
 