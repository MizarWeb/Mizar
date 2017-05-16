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
/*global define: false */

/**
 * Error dialog module
 */
define(["jquery", "jquery.ui"], function ($) {

// The main div for error
    var errorDiv = '<div id="errorDiv" style="text-align: justify" title="Error"></div>';

// Create the div, use jQuery UI dialog
    var $errorDiv = $(errorDiv)
        .appendTo('body')
        .dialog({
            autoOpen: false,
            resizable: false,
            draggable: false,
            width: '300px',
            minHeight: 'auto',
            dialogClass: 'errorBox'
        });

    return {
        /**
         *    Open dialog
         *
         *    @param html HTML text
         */
        open: function (html) {
            $errorDiv
                .html(html)
                .dialog("open");
        }
    };

});
