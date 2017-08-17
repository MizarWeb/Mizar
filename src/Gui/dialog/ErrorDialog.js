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
    var errorDiv = '<div id="errorDiv" style="text-align: left" title="Error"></div>';

// Create the div, use jQuery UI dialog

  var $text = "";

  var $errorDiv = $(errorDiv)
        .appendTo('body')
        .dialog({
          autoOpen: false,
          width: 700,
          minHeight: 300,
          maxHeight: 500,
          dialogClass: 'errorBox',
          beforeClose: function( event, ui ) { $text = ""; }
        });

    return {
        /**
         *    Open dialog
         *
         *    @param html HTML text
         */
        open: function (html) {
            $text += html + "<br/>";
            $errorDiv
                .html($text)
                .dialog("open");
            $errorDiv.scrollTop(5000);

        }
    };

});
