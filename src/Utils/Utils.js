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
/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

import $ from "jquery";
import Moment from "moment";
import Numeric from "./Numeric";
import UtilsIntersection from "./UtilsIntersection";
import Constants from "./Constants";
import NetworkError from "../Error/NetworkError";
import Proxy from "../Utils/Proxy";
const Utils = {};

/**
 * Inherits from an object
 */
Utils.inherits = function (base, sub) {
  function tempCtor() {}

  tempCtor.prototype = base.prototype;
  sub.prototype = new tempCtor();
  sub.prototype.constructor = sub;
};

/**
 *    HSV values in [0..1[
 *    returns [r, g, b] values from 0 to 255
 */
function hsv_to_rgb(h, s, v) {
  const h_i = Math.floor(h * 6);
  const f = h * 6 - h_i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r;
  let g;
  let b;
  switch (h_i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    default:
      r = 1;
      g = 1;
      b = 1;
  }
  return [r, g, b];
}

/**
 * Generates eye-friendly color based on hsv.
 * @return {int[]} rgb array
 */
Utils.generateColor = function () {
  //use golden ratio
  const golden_ratio_conjugate = 0.618033988749895;
  let h = Math.random();
  h += golden_ratio_conjugate;
  h %= 1;
  return hsv_to_rgb(h, 0.5, 0.95);
};

/**
 * Format the given feature identifier to remove special caracters(as ?, [, ], ., etc..) which cannot be used as HTML id's
 * @param {string} id - identifier
 * @return {string} HTML identifier
 */
Utils.formatId = function (id) {
  let result;
  if (typeof id === "string") {
    result = id.replace(/\s{1,}|\.{1,}|\[{1,}|\]{1,}|\({1,}|\){1,}|~{1,}|\+{1,}|°{1,}|-{1,}|'{1,}|"{1,}/g, "");
  } else {
    result = id;
  }
  return result;
};

/**
 * Checks if a value v is between the interval [min, max].
 * @function isValueBetween
 * @param {float} v - value
 * @param {float} min - min value
 * @param {float} max - max value
 * @return {boolean} true when v is between min and max otherwise false
 */
Utils.isValueBetween = function (v, min, max) {
  return v >= min && v <= max;
};

/**
 * Computes base URL from getCapabilities URL.
 * @function computeBaseUrlFromCapabilities
 * @param {string} capabilitiesUrl - getCapabilities URL
 * @param {string[]} parameters - parameters of the getCapabilities
 * @return {string} base URL
 */
Utils.computeBaseUrlFromCapabilities = function (capabilitiesUrl, parameters) {
  Utils.assert(capabilitiesUrl !== null && capabilitiesUrl.length > 0, "capabilitiesUrl must not be empty", "Utils.js");

  let url = capabilitiesUrl;
  if (url.indexOf("?") > -1) {
    url = url.substr(0, url.indexOf("?"));
  }
  // url cannot be undefined because we need to query a getCapabilities or something else with a parameter
  const queryString = capabilitiesUrl.replace(url + "?", "") || capabilitiesUrl;
  const query = Utils.parseQuery(queryString);
  // we delete all parameters required by a standard.
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i];
    delete query[parameter];
  }
  // we build the new Url with remaining parameters.
  let nbParameter = 0;
  for (const key in query) {
    const value = query[key];
    if (nbParameter == 0) {
      url = url + "?" + key + "=" + value;
    } else {
      url = url + "&" + key + "=" + value;
    }
    nbParameter++;
  }

  return url;
};

/**
 * Parse query url.
 * @function parseQuery
 * @param {string} str - url
 * @return {{}} a hash of parameter/value
 */
Utils.parseQuery = function (str) {
  if (typeof str !== "string" || str.length == 0) return {};
  const s = str.split("&");
  const s_length = s.length;
  let bit,
    query = {},
    first,
    second;
  for (let i = 0; i < s_length; i++) {
    bit = s[i].split("=");
    first = decodeURIComponent(bit[0]);
    if (first.length == 0) continue;
    second = decodeURIComponent(bit[1]);
    if (typeof query[first] === "undefined") query[first] = second;
    else if (query[first] instanceof Array) query[first].push(second);
    else query[first] = [query[first], second];
  }
  return query;
};

/**
 * Add parameter to
 * @function addParameterTo
 * @param {string} url - parameter url
 * @param {string} name - parameter name
 * @param {string} value - parameter value
 * @return {string} url updated
 */
Utils.addParameterTo = function (url, name, value) {
  let separator = "&";
  if (typeof url !== "string" || url.indexOf("?", 0) === -1) {
    separator = "?";
  }
  return url + separator + name + "=" + value;
};

/**
 * Parses the base URL.
 * @function parseBaseURL
 * @param {string} url - the URL
 * @return {string} the base URL
 */
Utils.parseBaseURL = function (url) {
  let result;
  const index = url.indexOf("?");
  if (index == -1) {
    result = url;
  } else {
    result = url.substring(0, url.indexOf("?") + 1);
  }
  return result;
};

/**
 * Parses the query string and returns the parameters of the URL.
 * @function parseQueryString
 * @param {string} url - query string
 * @return {{}} parameters of the query string
 */
Utils.parseQueryString = function (url) {
  const queryString = url.substring(url.indexOf("?") + 1).split("&");
  const params = {};
  let pair;
  // march and parse
  for (let i = queryString.length - 1; i >= 0; i--) {
    pair = queryString[i].split("=");
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return params;
};

/**
 * Request an URL.
 * @function requestUrl
 * @param {string} url - URL to request
 * @param {string} datatype - datatype of the response
 * @param {string} acceptDatatype - value for the Accept keyword in the header
 * @param {Object} options - options for callback (set to null if no options)
 * @param {Utils~requestCallback} callback - The callback that handles the response.
 * @param {Utils~requestFallback} [fallBack] - The fallback that handles the error.
 * @param {Utils~requestComplete} [complete] - The completeback that is executed afet the callback/fallback
 */
Utils.requestUrl = function (url, datatype, acceptDatatype, options, callback, fallBack, complete) {
  $.ajax({
    type: "GET",
    url: Proxy.proxify(url),
    dataType: datatype,
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Accept", acceptDatatype);
    },
    success: function (response) {
      if (callback) {
        callback(response, options);
      }
    },
    error: function (xhr, ajaxOptions, thrownError) {
      let message;
      let code;
      if (xhr.status === 0) {
        message = "Unreachable URL or No 'Access-Control-Allow-Origin' header is present on the " + url;
        code = 0;
      } else {
        message = thrownError.message ? thrownError.message : thrownError;
        code = thrownError.code ? thrownError.code : -1;
        if (typeof ajaxOptions === "string") {
          message = ajaxOptions + ": " + message;
        }
      }
      if (fallBack) {
        fallBack(new NetworkError(message, "Utils.js", code));
      }
    },
    complete: function (xhr, textSatus) {
      if (complete) {
        complete(xhr, textSatus);
      }
    }
  });
};

/**
 * This callback process the response when the request is a success.
 * @callback Utils~requestCallback
 * @param {Object} response - the response of the server
 * @param {Object} options - options
 */

/**
 * This fallback process the error of the server.
 * @callback Utils~requestFallback
 * @param {string} error
 */

/**
 * A function to be called when the request finishes (after success and error callbacks are executed).
 * The function gets passed two arguments: The jqXHR (in jQuery 1.4.x, XMLHTTPRequest) object and a
 * string categorizing the status of the request ("success", "notmodified", "nocontent", "error",
 * "timeout", "abort", or "parsererror").
 * @callback Utils~requestComplete
 * @param {Object} xhr - xhr object
 * @param {string} status - status text
 */

/**
 * Converts UTC hms from date to hours.
 * @function _UT
 * @param {date} date - date
 * @returns {number} hours
 * @private
 */
function _UT(date) {
  const hour = date.getUTCHours();
  const min = date.getUTCMinutes();
  const sec = date.getUTCSeconds();
  return hour + min / 60 + sec / 3600;
}

/**
 * Computes Julian day number at 0 hr UT.
 * @function _J0
 * @param {date} date - date
 * @returns {number} Julian day number at 0 hr UT
 * @private
 */
function _J0(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  //var UT = _UT(date);
  //TODO check 1721013.5 should be -730531.5 !!!
  return (
    367 * year -
    Math.floor((7 / 4) * (year + Math.floor((month + 9) / 12))) +
    Math.floor((275 * month) / 9) +
    day +
    1721013.5
  );
}

/**
 * Computes Julian day.
 * @function JD
 * @param {date} date - date
 * @returns {number} julian day
 * @private
 */
Utils.JD = function (date) {
  return _J0(date) + _UT(date) / 24;
};

/**
 * Computes the Greenwich sidereal time at 0 hr UT.
 * See equation [Seidelmann,1992]
 * @function _GST0
 * @param date date
 * @returns {number} the Greenwich sidereal time at 0 hr UT
 * @private
 */
function _GST0(date) {
  //JC is Julian centuries between the Julian day J0 and J2000(2,451,545.0)
  const julianCentury = (_J0(date) - 2451545.0) / 36525;
  const GST0 =
    100.4606184 +
    36000.77004 * julianCentury +
    0.000387933 * julianCentury * julianCentury -
    2.583e-8 * julianCentury * julianCentury * julianCentury;
  return GST0 % 360;
}

/**
 * Computes the Greenwich sidereal time at any other UT time.
 * @function GST
 * @param {date} date - date
 * @returns {number} the Greenwich sidereal time at any other UT time
 */
Utils.GST = function (date) {
  return (_GST0(date) + (360.98564724 * _UT(date)) / 24) % 360;
};

/**
 * Computes the local sidereal time.
 * @function LST
 * @param {date} date - date
 * @param {float} longitude - longitude
 * @returns {number}
 */
Utils.LST = function (date, longitude) {
  return (Utils.GST(date) + longitude) % 360;
};

/**
 * Computes the Sidereal Hour Angle
 * @function SHA
 * @param {float} ra - right ascension in decimal degree
 * @returns {number} SHA in decimal degree
 */
Utils.SHA = function (ra) {
  return 360.0 - (15.0 * ra * 24.0) / 360.0;
};

/**
 * Computes the GHA (Greenwich Hour Angle).
 * GHA indicates the position past the plane of the Greenwich meridian measured in degrees. Equivalent to longitude on earth.
 * @function GHA
 * @param {date} date - date
 * @param {float} ra - right ascension in decimal degree
 * @returns {number} Greenwich Hour Angle in decimal degree
 */
Utils.GHA = function (date, ra) {
  const GHA_Aries = (15.0 * Utils.GST(date) * 24.0) / 360.0;
  return (Utils.SHA(ra) + GHA_Aries) % 360;
};

/**
 * Converts longitude/latitude to XYZ
 * @function longLat2XYZ
 * @param {float} longitude - longitude in decimal degree
 * @param {float} latitude - latitude in decimal degree
 * @returns {{x: float, y: float, z: float}} the cartesian coordinates
 */
Utils.longLat2XYZ = function (longitude, latitude) {
  const latInRadians = Numeric.toRadian(latitude);
  const longInRadians = Numeric.toRadian(longitude);
  const cosLat = Math.cos(latInRadians);
  return {
    x: cosLat * Math.cos(longInRadians),
    y: cosLat * Math.sin(longInRadians),
    z: Math.sin(latInRadians)
  };
};

/**
 * Computes the distance of the camera in meters for which the bbox of the target is the camera FOV.
 * @function computeDistanceCameraFromBbox
 * @param {float[]} bbox - bbox of the target
 * @param {float} fov - camera FOV
 * @param {float} planetRadius - planet radius in meters
 * @param {boolean} isFlat - is it a projected CRS
 * @return {float} the distance of the camera in meters.
 */
Utils.computeDistanceCameraFromBbox = function (bbox, fov, planetRadius, isFlat) {
  const angularDistance1 = Math.abs(bbox[2] - bbox[0]);
  const angularDistance2 = Math.abs(bbox[3] - bbox[1]);
  const angularDistance = Math.max(angularDistance1, angularDistance2);

  let visibleAngularDistance;
  if (isFlat) {
    visibleAngularDistance = angularDistance;
  } else if (angularDistance > 180) {
    visibleAngularDistance = 180;
  } else {
    visibleAngularDistance = angularDistance;
  }

  //     *            *Center       *
  //      *         * |  *         *
  //        *     *   | a  *     *
  //          * * --b------ *  *
  //           * *          **
  //            *   *   *  *
  //             *    | distance surface/camera
  //               *  |  *
  //                 * *
  //                  Camera

  const a = planetRadius * Math.cos(Numeric.toRadian(0.5 * visibleAngularDistance));
  const b = planetRadius * Math.sin(Numeric.toRadian(0.5 * visibleAngularDistance));
  const c = b / Math.tan(Numeric.toRadian(0.5 * fov));
  const distance = c - (planetRadius - a);
  return distance;
};

/**
 * Returns the time format based on time pattern.
 * @function formatResolution
 * @param {string} time pattern
 * @return {TIME_STEP} time format
 * @throws {Error} pattern not supported
 */
Utils.formatResolution = function (format) {
  let timeResolution;
  if (Utils.aContainsB.call(this, format, "ss")) {
    timeResolution = Constants.TIME_STEP.SECOND;
  } else if (Utils.aContainsB.call(this, format, "mm")) {
    timeResolution = Constants.TIME_STEP.MINUTE;
  } else if (Utils.aContainsB.call(this, format, "HH")) {
    timeResolution = Constants.TIME_STEP.HOUR;
  } else if (Utils.aContainsB.call(this, format, "DD")) {
    timeResolution = Constants.TIME_STEP.DAY;
  } else if (Utils.aContainsB.call(this, format, "MM")) {
    timeResolution = Constants.TIME_STEP.MONTH;
  } else if (Utils.aContainsB.call(this, format, "YYYY")) {
    timeResolution = Constants.TIME_STEP.YEAR;
  } else {
    throw new Error("Pattern not supported", "Utils.js");
  }
  return timeResolution;
};

/**
 * Checks if a is contained in the array b.
 * @function aContainsB
 * @param {object} a - element
 * @param {Array} b - array
 * @return true when a is contained in b otherwise false
 */
Utils.aContainsB = function (a, b) {
  return a.indexOf(b) >= 0;
};

/**
 * Convers the time to Moment js.
 * @function convertToMoment
 * @param {Moment|Date} time - time to convert
 * @return {Moment} time as Moment js
 */
Utils.convertToMoment = function (time) {
  return time instanceof Moment() ? time : Moment().utc(time);
};

/**
 * Checks if "passive" is supported by.
 * @function isPassiveSupported
 * @return {Boolean} true when "passive" mode is supported otherwise false
 */
Utils.isPassiveSupported = function () {
  let passiveSupported = false;

  try {
    const options = Object.defineProperty({}, "passive", {
      get: function () {
        passiveSupported = true;
        return passiveSupported;
      }
    });

    window.addEventListener("test", options, options);
    window.removeEventListener("test", options, options);
  } catch (err) {
    passiveSupported = false;
  }
  return passiveSupported;
};

/**
 * Assert function.
 * @param {Boolean} condition test condition
 * @param {string} message Output when the assert is not true
 * @param {string} [filename] where the error occurs
 * @throws {Error} sent message when the condition is false
 */
Utils.assert = function (condition, message, filename) {
  if (!condition) {
    if (filename == null) {
      message = filename + ": " + message;
    }
    throw new Error("Assert failed" + (typeof message !== "undefined" ? " - " + message : ""));
  }
};

/**
 * Process all geometries excepted a point.
 * @param {Object} geometry - geometry
 * @returns {Object|undefined} bbox - The bounding box of the geometry when a problem happens with the geometry.
 * @returns {number} bbox.north - The northest latitude.
 * @returns {number} bbox.south - The southest latitude.
 * @returns {number} bbox.west - The westest longitude.
 * @returns {number} bbox.east - The eastest longitude.
 * @throws ReferenceError - Unknown geometry type
 */
function _processBboxForShape(geometry) {
  let coords;
  let checkDateLine;
  const numOuterRings =
    geometry.type === Constants.GEOMETRY.MultiPolygon || geometry.type === Constants.GEOMETRY.MultiLineString
      ? geometry.coordinates.length
      : 1;
  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let maxX = -1 * Number.MAX_VALUE;
  let maxY = -1 * Number.MAX_VALUE;
  for (let j = 0; j < numOuterRings; j++) {
    switch (geometry.type) {
      case Constants.GEOMETRY.MultiPoint:
        coords = geometry.coordinates;
        checkDateLine = false;
        break;
      case Constants.GEOMETRY.Polygon:
        coords = geometry.coordinates[0];
        checkDateLine = true;
        break;
      case Constants.GEOMETRY.MultiPolygon:
        coords = geometry.coordinates[j][0];
        checkDateLine = true;
        break;
      case Constants.GEOMETRY.LineString:
        coords = geometry.coordinates;
        checkDateLine = true;
        break;
      case Constants.GEOMETRY.MultiLineString:
        coords = geometry.coordinates[j];
        checkDateLine = true;
        break;
      default:
        throw new ReferenceError("Utils.js: Unknown geometry type : " + geometry.type);
    }
    for (let i = 0; i < coords.length; i++) {
      minX = Math.min(minX, coords[i][0]);
      minY = Math.min(minY, coords[i][1]);
      maxX = Math.max(maxX, coords[i][0]);
      maxY = Math.max(maxY, coords[i][1]);

      // Check if the coordinates cross dateline
      if (checkDateLine && i > 0 && UtilsIntersection.isCrossDateLine(coords[i - 1][0], coords[i][0])) {
        minX = -180;
        maxX = 180;
      }
    }
  }
  return {
    north: maxY,
    south: minY,
    west: minX,
    east: maxX
  };
}

/**
 * Computes the bounding box of the geometry.
 * @param {Object} geometry
 * @returns {Object} bbox - The bounding box of the geometry
 * when a problem happens with the geometry.
 * @returns {number} bbox.north - The northest latitude.
 * @returns {number} bbox.south - The southest latitude.
 * @returns {number} bbox.west - The westest longitude.
 * @returns {number} bbox.east - The eastest longitude.
 * @throws ReferenceError - Unknown geometry type
 */
Utils.getBBox = function (geometry) {
  Utils.assert(
    geometry && geometry.type && geometry.coordinates && geometry.coordinates.length > 0,
    "coordinates and type must be provided in the geometry",
    "Utils.js"
  );
  let bbox;
  if (geometry.type === Constants.GEOMETRY.Point) {
    const coords = geometry.coordinates;
    bbox = {
      west: coords[0],
      north: coords[1],
      east: coords[0],
      south: coords[1]
    };
  } else {
    bbox = _processBboxForShape(geometry);
  }
  return bbox;
};

/*	This work is licensed under Creative Commons GNU LGPL License.

    License: http://creativecommons.org/licenses/LGPL/2.1/
Version: 0.9
    Author:  Stefan Goessner/2006
    Web:     http://goessner.net/ 
*/
function parseXml(xml) {
  let dom = null;
  if (window.DOMParser) {
    try {
      dom = new DOMParser().parseFromString(xml, "text/xml");
    } catch (e) {
      dom = null;
    }
  } else if (window.ActiveXObject) {
    try {
      dom = new window.ActiveXObject("Microsoft.XMLDOM");
      dom.async = false;
      if (!dom.loadXML(xml))
        // parse error ..

        window.alert(dom.parseError.reason + dom.parseError.srcText);
    } catch (e) {
      dom = null;
    }
  } else alert("cannot parse xml string!");
  return dom;
}

/*	This work is licensed under Creative Commons GNU LGPL License.

    License: http://creativecommons.org/licenses/LGPL/2.1/
Version: 0.9
    Author:  Stefan Goessner/2006
    Web:     http://goessner.net/ 
*/
Utils.xml2json = function (xmlString, tab) {
  let xml = parseXml(xmlString);
  var X = {
    toObj: function (xml) {
      let o = {};
      if (xml.nodeType == 1) {
        // element node ..
        if (xml.attributes.length)
          // element with attributes  ..
          for (let i = 0; i < xml.attributes.length; i++)
            o["@" + xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue || "").toString();
        if (xml.firstChild) {
          // element has child nodes ..
          let textChild = 0,
            cdataChild = 0,
            hasElementChild = false;
          for (var n = xml.firstChild; n; n = n.nextSibling) {
            if (n.nodeType == 1) hasElementChild = true;
            else if (n.nodeType == 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++;
            // non-whitespace text
            else if (n.nodeType == 4) cdataChild++; // cdata section node
          }
          if (hasElementChild) {
            if (textChild < 2 && cdataChild < 2) {
              // structured element with evtl. a single text or/and cdata node ..
              X.removeWhite(xml);
              for (n = xml.firstChild; n; n = n.nextSibling) {
                if (n.nodeType == 3)
                  // text node
                  o["#text"] = X.escape(n.nodeValue);
                else if (n.nodeType == 4)
                  // cdata node
                  o["#cdata"] = X.escape(n.nodeValue);
                else if (o[n.nodeName]) {
                  // multiple occurence of element ..
                  if (o[n.nodeName] instanceof Array) o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                  else o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
                } // first occurence of element..
                else o[n.nodeName] = X.toObj(n);
              }
            } else {
              // mixed content
              if (!xml.attributes.length) o = X.escape(X.innerXml(xml));
              else o["#text"] = X.escape(X.innerXml(xml));
            }
          } else if (textChild) {
            // pure text
            if (!xml.attributes.length) o = X.escape(X.innerXml(xml));
            else o["#text"] = X.escape(X.innerXml(xml));
          } else if (cdataChild) {
            // cdata
            if (cdataChild > 1) o = X.escape(X.innerXml(xml));
            else for (n = xml.firstChild; n; n = n.nextSibling) o["#cdata"] = X.escape(n.nodeValue);
          }
        }
        if (!xml.attributes.length && !xml.firstChild) o = null;
      } else if (xml.nodeType == 9) {
        // document.node
        o = X.toObj(xml.documentElement);
      } else alert("unhandled node type: " + xml.nodeType);
      return o;
    },
    toJson: function (o, name, ind) {
      let json = name ? '"' + name + '"' : "";
      if (o instanceof Array) {
        for (let i = 0, n = o.length; i < n; i++) o[i] = X.toJson(o[i], "", ind + "\t");
        json +=
          (name ? ":[" : "[") +
          (o.length > 1 ? "\n" + ind + "\t" + o.join(",\n" + ind + "\t") + "\n" + ind : o.join("")) +
          "]";
      } else if (o == null) json += (name && ":") + "null";
      else if (typeof o === "object") {
        const arr = [];
        for (const m in o) arr[arr.length] = X.toJson(o[m], m, ind + "\t");
        json +=
          (name ? ":{" : "{") +
          (arr.length > 1 ? "\n" + ind + "\t" + arr.join(",\n" + ind + "\t") + "\n" + ind : arr.join("")) +
          "}";
      } else if (typeof o === "string") json += (name && ":") + '"' + o.toString() + '"';
      else json += (name && ":") + o.toString();
      return json;
    },
    innerXml: function (node) {
      let s = "";
      if ("innerHTML" in node) s = node.innerHTML;
      else {
        var asXml = function (n) {
          let s = "";
          if (n.nodeType == 1) {
            s += "<" + n.nodeName;
            for (let i = 0; i < n.attributes.length; i++)
              s += " " + n.attributes[i].nodeName + '="' + (n.attributes[i].nodeValue || "").toString() + '"';
            if (n.firstChild) {
              s += ">";
              for (let c = n.firstChild; c; c = c.nextSibling) s += asXml(c);
              s += "</" + n.nodeName + ">";
            } else s += "/>";
          } else if (n.nodeType == 3) s += n.nodeValue;
          else if (n.nodeType == 4) s += "<![CDATA[" + n.nodeValue + "]]>";
          return s;
        };
        for (let c = node.firstChild; c; c = c.nextSibling) s += asXml(c);
      }
      return s;
    },
    escape: function (txt) {
      return txt.replace(/[\\]/g, "\\\\").replace(/[\"]/g, '\\"').replace(/[\n]/g, "\\n").replace(/[\r]/g, "\\r");
    },
    removeWhite: function (e) {
      e.normalize();
      for (let n = e.firstChild; n; ) {
        if (n.nodeType == 3) {
          // text node
          if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) {
            // pure whitespace text node
            const nxt = n.nextSibling;
            e.removeChild(n);
            n = nxt;
          } else n = n.nextSibling;
        } else if (n.nodeType == 1) {
          // element node
          X.removeWhite(n);
          n = n.nextSibling;
        } // any other node
        else n = n.nextSibling;
      }
      return e;
    }
  };
  if (xml.nodeType == 9)
    // document node
    xml = xml.documentElement;
  const json = X.toObj(X.removeWhite(xml));
  return json;
};

export default Utils;
