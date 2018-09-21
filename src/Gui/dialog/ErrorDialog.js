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
/*global define: false */

/**
 * Error dialog module
 */
define(["../../Utils/Constants", "jquery", "jquery.ui"], function(Constants, $) {
    // The main div for error
    var errorDiv =
        '<div id="errorDiv" style="text-align: left" title="Error"></div>';

    // Create the div, use jQuery UI dialog

    var $text = "";
    var $buttonName = "";

    var $errorDiv = $(errorDiv)
        .appendTo("body")
        .dialog({
            autoOpen: false,
            width: 500,
            minHeight: 300,
            maxHeight: 500,
            dialogClass: "errorBox",
            beforeClose: function(event, ui) {
                $text = "";
            }
        });
    var $active = false;

    _recordError = function(html) {
        $text += html + "<br/>";
        if ($("#warningContainer")) {
            $("#warningContainer").show();
            $errorDiv.on("dialogclose", function(event) {
                if ($buttonName) {
                    $buttonName.hide();
                }
            });
        }
        if ($active === true) {
            $errorDiv.html($text).dialog("open");
            $errorDiv.scrollTop(5000);
        }
    };

    return {
        /**
         * Open dialog
         * @param {LEVEL} LEVEL Log level
         * @param {string} title error title
         * @param {string} description error description   
         */
        open: function(LEVEL, title, description) {
            var message = "";
            if (LEVEL === Constants.LEVEL.WARNING) {
                message = message+"<font style='color:orange'>Warning : " + title+"</font>";
            } else if (LEVEL === Constants.LEVEL.ERROR) {
                message = message+"<font style='color:red'>Error : " + title+"</font>";
            } else {
                message = "";
            }

            if(description != null) {
                message = message +" - <font style='color:white'>";
                if (typeof(description) === 'object') {
                    message = message + JSON.stringify(description);        
                } else {
                    message = message + description;
                }
                
                message = message +"</font>";
            }     
    
            _recordError(message);
        },
        /**
         * View the messages in the GUI.
         */
        view: function() {
            $errorDiv.html($text).dialog("open");
            $errorDiv.scrollTop(5000);
            $active = true;
        },
        /**
         * Hides the GUI
         */
        hide: function() {
            $errorDiv.dialog("close");
            $active = false;
        },
        /**
         * GUI is active ?
         * @return {boolean} true when the GUI is shown otherwise false
         */
        isActive: function() {
            return $active;
        },
        /**
         * Sets the icon.
         * @param {string} ID
         */
        setIcon: function(buttonName) {
            $buttonName = $(buttonName);
        },
        /**
         * Has error.
         * @returns {boolean} true when error otherise false
         */
        hasError : function() {
            return $text.length > 0;
        },
        /**
         * Returns the message
         * @returns {string} the message
         */
        getTxt : function() {
            return $text;
        }
    };
});