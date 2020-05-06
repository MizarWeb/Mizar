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
import $ from "jquery";
import "jquery-ui-bundle";

// The main div for error
const crsInfo = '<div id="crsInfo" style="text-align: left" title="Coordinate Reference System information"></div>';

// Create the div, use jQuery UI dialog

let $text = "";

const $crsInfo = $(crsInfo).appendTo("body").dialog({
  autoOpen: false,
  width: 500,
  minHeight: 300,
  maxHeight: 500,
  dialogClass: "crsBox"
  //beforeClose: function( event, ui ) { $text = ""; }
});
let $active = false;

export default {
  /**
   *    Open dialog
   *
   *    @param html HTML text
   */
  open: function (crs) {
    if (this.isActive()) {
      this.destroy();
    }
    const geoBound = crs.getGeoBound();
    $text += "<p align='center'><u><i><b>" + crs.getName() + " CRS description </b></i></u></p>";
    $text += "<p align='justify'>" + crs.getDescription() + "</p>";
    $text +=
      "<table>" +
      "<caption><i>Sphere parameters</i></caption>" +
      "<tr><th>Parameter</th><th>Value</th></tr>" +
      "<tr><td>Projection</td><td>" +
      (crs.isProjected() ? crs.getProjection().getName() : "3D") +
      "</td></tr>" +
      "<tr><td>radius (meters)</td><td>" +
      crs.getGeoide().getRealPlanetRadius() +
      "</td></tr>" +
      "<tr><td>" +
      crs.getLongitudeLabel() +
      "</td><td>[" +
      geoBound.getWest() +
      "&deg; , " +
      geoBound.getEast() +
      "&deg;]</td></tr>" +
      "<tr><td>" +
      crs.getLatitudeLabel() +
      "</td><td>[" +
      geoBound.getSouth() +
      "&deg; , " +
      geoBound.getNorth() +
      "&deg;]</td></tr>" +
      "</table>";
    $crsInfo.on("dialogclose", function (event) {
      $active = false;
    });
  },
  view: function () {
    $crsInfo.html($text).dialog("open");

    $crsInfo.scrollTop(5000);
    $active = true;
  },
  hide: function () {
    $crsInfo.dialog("close");
    $active = false;
  },
  isActive: function () {
    return $active;
  },
  destroy: function () {
    this.hide();
    $text = "";
    $active = false;
  }
};
