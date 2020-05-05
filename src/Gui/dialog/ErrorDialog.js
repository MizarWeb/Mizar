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
/*eslint no-console: ["error", { allow: ["warn", "error","log"] }] */

/**
 * Error dialog module
 */
import Constants from "../../Utils/Constants";
import $ from "jquery";
import "jquery-ui-bundle";
let isDebug = false;

// The main div for error
const errorDiv = '<div id="errorDiv" style="text-align: left" title="Error"></div>';

// Create the div, use jQuery UI dialog

let $text = "";
let $buttonName = "";

const $errorDiv = $(errorDiv)
  .appendTo("body")
  .dialog({
    autoOpen: false,
    width: 500,
    minHeight: 300,
    maxHeight: 500,
    dialogClass: "errorBox",
    beforeClose: function (event, ui) {
      $text = "";
    }
  });
let $active = false;

const _consoleError = function (txt) {
  if (isDebug) {
    console.error(txt);
  }
};

const _consoleWarn = function (txt) {
  if (isDebug) {
    console.warn(txt);
  }
};

const _consoleLog = function (txt) {
  if (isDebug) {
    console.log(txt);
  }
};

const _recordError = function (html) {
  $text += html + "<br/>";
  if ($("#warningContainer")) {
    $("#warningContainer").show();
    $errorDiv.on("dialogclose", function (event) {
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

const _computeMessageHTML = function (message, description) {
  if (description != null && message != null) {
    message = message + " - <font style='color:white'>";
    if (typeof description === "string") {
      message = message + description;
    } else if (description.message) {
      message = message + description.message;
    } else {
      message = message + JSON.stringify(description);
    }
    message = message + "</font>";
  }
  return message;
};

const _computeMessageASCII = function (message, description) {
  if (description != null && message != null) {
    if (typeof description === "string") {
      message = message + ":" + description;
    } else if (description.message) {
      message = message + ":" + description.message;
    } else {
      message = message + ":" + JSON.stringify(description);
    }
  }
  return message;
};

export default {
  /**
   * Open dialog
   * @param {LEVEL} LEVEL Log level
   * @param {string} title error title
   * @param {string} description error description
   */
  open: function (LEVEL, title, description) {
    let message = "";
    if (LEVEL === Constants.LEVEL.WARNING) {
      message = message + "<font style='color:orange'>Warning : " + title + "</font>";
      _consoleWarn(_computeMessageASCII(title, description));
      _recordError(_computeMessageHTML(message, description));
    } else if (LEVEL === Constants.LEVEL.ERROR) {
      message = message + "<font style='color:red'>Error : " + title + "</font>";
      _consoleError(_computeMessageASCII(title, description));
      _recordError(_computeMessageHTML(message, description));
    } else if (LEVEL === Constants.LEVEL.DEBUG) {
      _consoleLog(_computeMessageASCII(title, description));
    } else {
      throw new TypeError("LEVEL must be set with a valid value", "ErrorDialog.js");
    }
  },
  /**
   * View the messages in the GUI.
   */
  view: function () {
    $errorDiv.html($text).dialog("open");
    $errorDiv.scrollTop(5000);
    $active = true;
  },
  /**
   * Hides the GUI
   */
  hide: function () {
    $errorDiv.dialog("close");
    $active = false;
  },
  /**
   * GUI is active ?
   * @return {boolean} true when the GUI is shown otherwise false
   */
  isActive: function () {
    return $active;
  },
  /**
   * Sets the icon.
   * @param {string} ID
   */
  setIcon: function (buttonName) {
    $buttonName = $(buttonName);
  },
  /**
   * Has error.
   * @returns {boolean} true when error otherise false
   */
  hasError: function () {
    return $text.length > 0;
  },
  /**
   * Returns the message
   * @returns {string} the message
   */
  getTxt: function () {
    return $text;
  },
  /**
   * Sets debug enable/disable.
   * By default debug is disable.
   * @param {boolean} debug Set to true to show debug message in the console otherwise False
   */
  setDebug: function (debug) {
    isDebug = debug;
  }
};
