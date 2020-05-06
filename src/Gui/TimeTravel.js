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
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/*global define: false */

/**
 * globalTime:set.<br/>
 * Called when the time is set
 * @event Context#globalTime:set
 * @type {Context}
 */

/**
 * globalTime:rewind.<br/>
 * Called when the time is set to rewind
 * @event Context#globalTime:rewind
 * @type {Context}
 */

/**
 * globalTime:forward.<br/>
 * Called when the time is set to forward
 * @event Context#globalTime:forward
 * @type {Context}
 */

/**
 * Compass module : map control with "north" composant
 */
import $ from "jquery";
import Constants from "../Utils/Constants";
import TimeTravelCore from "../Services/TimeTravelCore";
/**
 *    Private variables
 */
var parentElement = null;
var ctx = null;

const REWIND_SVG =
  "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTExIDE4VjZsLTguNSA2IDguNSA2em0uNS02bDguNSA2VjZsLTguNSA2eiIvPiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PC9zdmc+";
const FORWARD_SVG =
  "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTQgMThsOC41LTZMNCA2djEyem05LTEydjEybDguNS02TDEzIDZ6Ii8+ICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
const HOUR_GLASS_SVG =
  "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTYgMnY2aC4wMUw2IDguMDEgMTAgMTJsLTQgNCAuMDEuMDFINlYyMmgxMnYtNS45OWgtLjAxTDE4IDE2bC00LTQgNC0zLjk5LS4wMS0uMDFIMThWMkg2em0xMCAxNC41VjIwSDh2LTMuNWw0LTQgNCA0em0tNC01bC00LTRWNGg4djMuNWwtNCA0eiIvPiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDBWMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

/**
 * Create a time travel Widget
 * @param options
 * @throws {ReferenceError} Can't get the Div to insert the time tracker
 * @throws {ReferenceError} Can't get the element name
 * @constructor
 * @fires Context#globalTime:set
 * @fires Context#globalTime:rewind
 * @fires Context#globalTime:forward
 */
var TimeTravel = function (options) {
  parentElement = options.element;
  ctx = options.ctx;

  // Add compass object to parent element
  // Don't use <object> HTML tag due to cross-origin nature of svg
  if (parentElement == null) {
    throw new ReferenceError("Can't get the element name from the options parameters");
  } else if (document.getElementById(options.element) == null) {
    throw new ReferenceError(
      "Can' get the div " + parentElement + " in the web page to insert " + this.constructor.name
    );
  } else {
    // OK
  }

  var svgRewindDoc = null;
  var svgForwardDoc = null;
  var svgHourGlassDoc = null;

  document.getElementById(parentElement).innerHTML =
    '<div id="objectForward"></div><div id="objectHourGlass"></div><div id="objectRewind"></div>';

  var _handleMouseUp = function (name) {
    ctx.publish(name, ctx);
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

  ctx.subscribe(Constants.EVENT_MSG.GLOBAL_TIME_CHANGED, this.updateDisplayDate);

  TimeTravelCore.init(options);

  $.get(
    HOUR_GLASS_SVG,
    function (response) {
      // Import contents of the svg document into this document
      svgHourGlassDoc = document.importNode(response.documentElement, true);

      // Update width/height
      svgHourGlassDoc.height.baseVal.value = 32;
      svgHourGlassDoc.width.baseVal.value = 32;

      // Append the imported SVG root element to the appropriate HTML element
      $("#objectHourGlass").append(svgHourGlassDoc);

      options.svgHourGlassDoc = svgHourGlassDoc;
      $("#objectHourGlass svg").css({
        float: "right",
        fill: TimeTravelCore.isCurrentDateTheFirst() && TimeTravelCore.isCurrentDateTheLast() ? "#333333" : "white"
      });

      svgHourGlassDoc.addEventListener("mouseup", _handleMouseUpSet);

      if (svgRewindDoc && svgForwardDoc && svgHourGlassDoc) {
        $("#" + parentElement).css("display", "block");
      }
    },
    "xml"
  );
  $.get(
    REWIND_SVG,
    function (response) {
      // Import contents of the svg document into this document
      svgRewindDoc = document.importNode(response.documentElement, true);

      // Update width/height
      svgRewindDoc.height.baseVal.value = 32;
      svgRewindDoc.width.baseVal.value = 32;

      // Append the imported SVG root element to the appropriate HTML element
      $("#objectRewind").append(svgRewindDoc);
      $("#objectRewind svg").css({
        float: "right",
        fill: TimeTravelCore.isCurrentDateTheFirst() ? "#333333" : "white"
      });

      options.svgRewindDoc = svgRewindDoc;
      svgRewindDoc.addEventListener("mouseup", _handleMouseUpRewind);

      if (svgRewindDoc && svgForwardDoc && svgHourGlassDoc) {
        $("#" + parentElement).css("display", "block");
      }
    },
    "xml"
  );
  $.get(
    FORWARD_SVG,
    function (response) {
      // Import contents of the svg document into this document
      svgForwardDoc = document.importNode(response.documentElement, true);

      // Update width/height
      svgForwardDoc.height.baseVal.value = 32;
      svgForwardDoc.width.baseVal.value = 32;

      // Append the imported SVG root element to the appropriate HTML element
      $("#objectForward").append(svgForwardDoc);
      $("#objectForward svg").css({
        float: "right",
        fill: TimeTravelCore.isCurrentDateTheLast() ? "#333333" : "white"
      });

      options.svgForwardDoc = svgForwardDoc;
      svgForwardDoc.addEventListener("mouseup", _handleMouseUpForward);

      if (svgRewindDoc && svgForwardDoc && svgHourGlassDoc) {
        $("#" + parentElement).css("display", "block");
      }
    },
    "xml"
  );
};

/**************************************************************************************************************/

/**
 * Update display date and send current date to context
 * @function updateDisplayDate
 * @param {Time.configuration} date Time configuration
 * @memberof TimeTravel#
 */
TimeTravel.prototype.updateDisplayDate = function (date) {
  if (document.getElementById("textTimeTravelDiv") !== null) {
    if (TimeTravelCore.isCurrentDateTheFirst() && TimeTravelCore.isCurrentDateTheLast()) {
      document.getElementById("textTimeTravelDiv").innerHTML = "";
    } else {
      document.getElementById("textTimeTravelDiv").innerHTML = date.display;
    }
  }

  ctx.setTime(date);

  var theColorRewind = $("#objectRewind:hover svg").css("fill") === "rgb(255, 0, 0)" ? "red" : "white";
  var theColorForward = $("#objectForward:hover svg").css("fill") === "rgb(255, 0, 0)" ? "red" : "white";

  $("#objectRewind svg").css({
    float: "right",
    fill: TimeTravelCore.isCurrentDateTheFirst() ? "#333333" : theColorRewind
  });
  $("#objectForward svg").css({
    float: "right",
    fill: TimeTravelCore.isCurrentDateTheLast() ? "#333333" : theColorForward
  });
  $("#objectHourGlass svg").css({
    float: "right",
    fill: TimeTravelCore.isCurrentDateTheFirst() && TimeTravelCore.isCurrentDateTheLast() ? "#333333" : "white"
  });

  $("#objectRewind svg")
    .mouseover(function () {
      if (TimeTravelCore.isCurrentDateTheFirst()) {
        $(this).css("fill", "#333333");
      } else {
        $(this).css("fill", "red");
      }
    })
    .mouseout(function () {
      if (TimeTravelCore.isCurrentDateTheFirst()) {
        $(this).css("fill", "#333333");
      } else {
        $(this).css("fill", "white");
      }
    });

  $("#objectForward svg")
    .mouseover(function () {
      if (TimeTravelCore.isCurrentDateTheLast()) {
        $(this).css("fill", "#333333");
      } else {
        $(this).css("fill", "red");
      }
    })
    .mouseout(function () {
      if (TimeTravelCore.isCurrentDateTheLast()) {
        $(this).css("fill", "#333333");
      } else {
        $(this).css("fill", "white");
      }
    });

  $("#objectHourGlass svg")
    .mouseover(function () {
      if (TimeTravelCore.isCurrentDateTheFirst() && TimeTravelCore.isCurrentDateTheLast()) {
        $(this).css("fill", "#333333");
      } else {
        $(this).css("fill", "red");
      }
    })
    .mouseout(function () {
      if (TimeTravelCore.isCurrentDateTheFirst() && TimeTravelCore.isCurrentDateTheLast()) {
        $(this).css("fill", "#333333");
      } else {
        $(this).css("fill", "white");
      }
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

export default TimeTravel;
