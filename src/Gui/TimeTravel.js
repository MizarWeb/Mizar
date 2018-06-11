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
 * Compass module : map control with "north" composant
 */
define(["jquery", "../Utils/Constants","../Services/TimeTravelCore"],
    function ($, Constants, TimeTravelCore) {

    /**
     *    Private variables
     */
    var parentElement = null;
    var ctx = null;
    var svgDoc;

    /**
     * Create a time travel Widget
     * @param options
     * @constructor
     * @fires AbstractContext#GLOBAL_TIME_CHANGED
     */
    var TimeTravel = function (options) {

        parentElement = options.element;
        ctx = options.ctx;

        // Add compass object to parent element
        // Don't use <object> HTML tag due to cross-origin nature of svg
        if (document.getElementById(parentElement) === null) {
            console.log("Warning, the div specified (" + parentElement + ") do not exist");
            return;
        }
        var svgRewind = "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTExIDE4VjZsLTguNSA2IDguNSA2em0uNS02bDguNSA2VjZsLTguNSA2eiIvPiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PC9zdmc+";
        var svgForward = "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTQgMThsOC41LTZMNCA2djEyem05LTEydjEybDguNS02TDEzIDZ6Ii8+ICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
        var svgHourGlass = "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTYgMnY2aC4wMUw2IDguMDEgMTAgMTJsLTQgNCAuMDEuMDFINlYyMmgxMnYtNS45OWgtLjAxTDE4IDE2bC00LTQgNC0zLjk5LS4wMS0uMDFIMThWMkg2em0xMCAxNC41VjIwSDh2LTMuNWw0LTQgNCA0em0tNC01bC00LTRWNGg4djMuNWwtNCA0eiIvPiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDBWMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

        svgRewindDoc = null;
        svgForwardDoc = null;
        svgHourGlassDoc = null;

        document.getElementById(parentElement).innerHTML = '<div id="objectForward"></div><div id="objectHourGlass"></div><div id="objectRewind"></div>';

        var _handleMouseUp = function (name) {
            ctx.publish(name,ctx);
        };

        var _handleMouseUpSet = function (event) {
            _handleMouseUp(Constants.EVENT_MSG.GLOBAL_TIME_SET);
        };

        var _handleMouseUpForward = function (event) {
            _handleMouseUp(Constants.EVENT_MSG.GLOBAL_TIME_FORWARD);
        };
        
        var _handleMouseUpRewind = function (event) {
            _handleMouseUp(Constants.EVENT_MSG.GLOBAL_TIME_REWIND);
        };

        ctx.subscribe(Constants.EVENT_MSG.GLOBAL_TIME_CHANGED,this.updateDisplayDate);

        TimeTravelCore.init(options);

        $.get(svgHourGlass,
            function (response) {
                // Import contents of the svg document into this document
                svgHourGlassDoc = document.importNode(response.documentElement, true);

                // Update width/height
                svgHourGlassDoc.height.baseVal.value = 32;
                svgHourGlassDoc.width.baseVal.value = 32;

                // Append the imported SVG root element to the appropriate HTML element
                $("#objectHourGlass").append(svgHourGlassDoc);

                options.svgHourGlassDoc = svgHourGlassDoc;

                svgHourGlassDoc.addEventListener('mouseup', _handleMouseUpSet);

                if (svgRewindDoc && svgForwardDoc && svgHourGlassDoc) {
                    $('#' + parentElement).css("display", "block");
                }
            },
            "xml");
            $.get(svgRewind,
                function (response) {
                    // Import contents of the svg document into this document
                    svgRewindDoc = document.importNode(response.documentElement, true);
    
                    // Update width/height
                    svgRewindDoc.height.baseVal.value = 32;
                    svgRewindDoc.width.baseVal.value = 32;

                    // Append the imported SVG root element to the appropriate HTML element
                    $("#objectRewind").append(svgRewindDoc);
    
                    options.svgRewindDoc = svgRewindDoc;
                    svgRewindDoc.addEventListener('mouseup', _handleMouseUpRewind);
    
                    if (svgRewindDoc && svgForwardDoc && svgHourGlassDoc) {
                        $('#' + parentElement).css("display", "block");
                    }
                },
                "xml");
            $.get(svgForward,
                function (response) {
                    // Import contents of the svg document into this document
                    svgForwardDoc = document.importNode(response.documentElement, true);
    
                    // Update width/height
                    svgForwardDoc.height.baseVal.value = 32;
                    svgForwardDoc.width.baseVal.value = 32;

                    // Append the imported SVG root element to the appropriate HTML element
                    $("#objectForward").append(svgForwardDoc);
    
                    options.svgForwardDoc = svgForwardDoc;
                    svgForwardDoc.addEventListener('mouseup', _handleMouseUpForward);
    
                    if (svgRewindDoc && svgForwardDoc && svgHourGlassDoc) {
                        $('#' + parentElement).css("display", "block");
                    }
                },
                "xml");
    
    };

    /**************************************************************************************************************/

    /**
     * Update display date and send current date to contexte
     * @function updateDisplayDate
     * @param Json date { "date" , "display", "period" { "from","to" } }
     * @memberOf TimeTravel#
     */
    TimeTravel.prototype.updateDisplayDate = function (date) {
        if (document.getElementById("textTimeTravelDiv") !== null) {
            document.getElementById("textTimeTravelDiv").innerHTML = date.display;
        }
        ctx.setTime(date);
        
        $('#objectRewind svg').css({
            "float": "right",
            "fill" : (TimeTravelCore.isCurrentDateTheFirst() === true) ? "#333333" : "white"
        });
        $('#objectForward svg').css({
            "float": "right",
            "fill" : (TimeTravelCore.isCurrentDateTheLast() === true) ? "#333333" : "white"
        });

    };

    /**
     *    functions
     */
    TimeTravel.prototype.remove = TimeTravelCore.remove;
    TimeTravel.prototype.goRewind = TimeTravelCore.goRewind;
    TimeTravel.prototype.goForward = TimeTravelCore.goForward;
    TimeTravel.prototype.chooseTime = TimeTravelCore.chooseTime;

    /**************************************************************************************************************/

    return TimeTravel;

});
