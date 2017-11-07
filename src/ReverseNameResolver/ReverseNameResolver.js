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
/*global define: false */

/**
 * Name resolver module : search object name from its coordinates
 * TODO : move _handleMouseDown&Up to View ?
 */
define(["jquery", "../Utils/Constants",
        "./CDSReverseNameResolver","./DefaultReverseNameResolver"],
        function ($, Constants) {

    var mizarAPI;
    var context;

    var reverseNameResolverImplementation = null;

    return {
        init: function (m) {
            mizarAPI = m;
            this.setContext(mizarAPI.getActivatedContext());
        },

        /**************************************************************************************************************/

        /**
         *    Send request to reverse name resolver service for the given gepoint
         *    @param geoPick    Geographic position of point of interest
         *    @param options
         *        <li>success: Function called on success with the response of server as argument</li>
         *        <li>error: Function called on error with the xhr object as argument</li>
         *    @fires Mizar#plugin:not_found  
         */
        sendRequest: function (geoPick, options) {
            var self = this;
            // TODO: depending on context, send the request
            // Currently only sky context is handled
            if (mizarAPI.getActivatedContext().getMode() === Constants.CONTEXT.Sky) {
                // Find max order
                var maxOrder = 3;
                mizarAPI.getActivatedContext().getTileManager().visitTiles(function (tile) {
                    if (maxOrder < tile.order) {
                      maxOrder = tile.order;
                    }
                });

                options.maxOrder = maxOrder;
                options.pos = geoPick;
                options.mizarAPI = mizarAPI;

                if (reverseNameResolverImplementation) {
                    reverseNameResolverImplementation.handle(options);
                } else {
                    mizarAPI.publish("plugin:not_found", "No reserve name resolver found");
                }
                
            }
            else {
                console.error("Not implemented yet");
                if (options && options.error) {
                    options.error();
                }
            }
        },

        /**************************************************************************************************************/

        /**
         *    Set new context
         */
        setContext: function (ctx) {
            context = ctx;

            //instantiate reverse name resolver nameResolverImplementation object
            var reverseNameResolverClass;
            if (typeof context.getContextConfiguration().reverseNameResolver !== 'undefined') {
                reverseNameResolverClass = require(context.getContextConfiguration().reverseNameResolver.jsObject);
            }
            else {
                //Use default reverse name resolver if none defined...
                reverseNameResolverClass = require("gw/ReverseNameResolver/DefaultReverseNameResolver");
            }

            reverseNameResolverImplementation = new reverseNameResolverClass(context);
        }
    };

});
