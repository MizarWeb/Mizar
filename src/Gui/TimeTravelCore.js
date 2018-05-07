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
 * Compass module : map control with "north" component
 */
define(["jquery","../Utils/Constants"], function ($, Constants) {

    /**
     *    Private variables
     */
    var parentElement = null;
    var ctx = null;
    var svgHourGlassDoc;
    var svgRewingDoc;
    var svgForwardDoc;

    /**************************************************************************************************************/

    /**
     *    Remove time travel element
     *    
     */
    function remove() {
        document.getElementById(parentElement).innerHTML = '';
    }

    /**************************************************************************************************************/

    return {
        init: function (options) {
            parentElement = options.element;
            ctx = options.ctx;
            crs = options.crs;
            svgHourGlassDoc = options.svgHourGlassDoc;
            svgRewindDoc = options.svgRewindDoc;
            svgForwardDoc = options.svgForwardDoc;
        },
        remove: remove

    };
});
