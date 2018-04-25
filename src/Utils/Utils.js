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

define(["jquery"], function ($) {

    var Utils = {};

    /**
     * Inherits from an object
     */
    Utils.inherits = function (base, sub) {
        function tempCtor() {
        }

        tempCtor.prototype = base.prototype;
        sub.prototype = new tempCtor();
        sub.prototype.constructor = sub;
    };

    /**
     *    HSV values in [0..1[
     *    returns [r, g, b] values from 0 to 255
     */
    function hsv_to_rgb(h, s, v) {
        var h_i = Math.floor(h * 6);
        var f = h * 6 - h_i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);
        var r;
        var g;
        var b;
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
     *    Generate eye-friendly color based on hsv
     */
    Utils.generateColor = function () {
        //use golden ratio
        var golden_ratio_conjugate = 0.618033988749895;
        var h = Math.random();
        h += golden_ratio_conjugate;
        h %= 1;
        return hsv_to_rgb(h, 0.5, 0.95);
    };

    /**
     *    Format the given feature identifier to remove special caracters(as ?, [, ], ., etc..) which cannot be used as HTML id's
     */
    Utils.formatId = function (id) {
        if (typeof id === 'string') {
            return id.replace(/\s{1,}|\.{1,}|\[{1,}|\]{1,}|\({1,}|\){1,}|\~{1,}|\+{1,}|\°{1,}|\-{1,}|\'{1,}|\"{1,}/g, "");
        } else {
            return id;
        }
    };

    /**
     *    Return if v is [min;max]
     */
    Utils.isValueBetween = function (v, min, max) {
        return ((v >= min) && (v <= max));
    };

    /**
     *     Return if 2 bounds (north,south,east,west) intersects
     */
    Utils.boundsIntersects = function (a, b) {
        if ( (a === null) || (b === null)) {
            return false;
        }
        if ((a.north === null) || (typeof a.north === "undefined") || (b.north === null) || (typeof b.north === "undefined")) {
            return false;
        }
        xOk = Utils.isValueBetween(a.west, b.west, b.east) ||
            Utils.isValueBetween(a.east, b.west, b.east) ||
            ((a.west <= b.west) && (a.east >= b.east));

        yOk = Utils.isValueBetween(a.north, b.south, b.north) ||
            Utils.isValueBetween(a.south, b.south, b.north) ||
            ((a.south <= b.south) && (a.north >= b.north));

        return xOk && yOk;
    };

    /**
     *     Return if 2 bounds (north,south,east,west) intersects
     */
    Utils.getBBoxFromCoordinateArray = function (array) {
        if (typeof array.length === "undefined") {
            return null;
        }
        var result = {
            north : -90,
            south : 90,
            east : -90,
            west : 90
        };
        for (var i=0;i<array.length;i++) {
            lon = array[i][0];
            lat = array[i][1];
            result.north = ( lat > result.north ) ? lat : result.north;
            result.south = ( lat < result.south ) ? lat : result.south;
            result.east  = ( lon > result.east  ) ? lon : result.east;
            result.west  = ( lon < result.west  ) ? lon : result.west;
        }
        return result;
    };


    Utils.computeBaseUrlFromCapabilities = function (capabilitiesUrl, parameters) {
        if (typeof capabilitiesUrl != "string" || capabilitiesUrl.length == 0 || !Array.isArray(parameters)) return null;

        var url = capabilitiesUrl;
        if (url.indexOf("?") > -1) {
            url = url.substr(0, url.indexOf("?"));
        }
        // url cannot be undefined because we need to query a getCapabilities or something else with a parameter
        var queryString = capabilitiesUrl.replace(url + "?", "") || capabilitiesUrl;
        var query = Utils.parseQuery(queryString);
        // we delete all parameters required by a standard.
        for (var i = 0; i < parameters.length; i++) {
            var parameter = parameters[i];
            delete query[parameter];
        }
        // we build the new Url with remaining parameters.
        var nbParameter = 0;
        for (var key in query) {
            var value = query[key];
            if (nbParameter == 0) {
                url = url + "?" + key + "=" + value;
            } else {
                url = url + "&" + key + "=" + value;
            }
            nbParameter++;
        }

        return url;
    };

    Utils.parseQuery = function(str) {
        if (typeof str != "string" || str.length == 0) return {};
        var s = str.split("&");
        var s_length = s.length;
        var bit, query = {}, first, second;
        for (var i = 0; i < s_length; i++) {
            bit = s[i].split("=");
            first = decodeURIComponent(bit[0]);
            if (first.length == 0) continue;
            second = decodeURIComponent(bit[1]);
            if (typeof query[first] == "undefined") query[first] = second;
            else if (query[first] instanceof Array) query[first].push(second);
            else query[first] = [query[first], second];
        }
        return query;
    };

    /**
     * Add parameter to
     * @function addParameterTo
     * @param {String} url - parameter url
     * @param {String} name - parameter name
     * @param {String} value - parameter value
     * @return {String} url updated
     */
    Utils.addParameterTo = function (url, name, value) {
        var separator = "&";
        if ((typeof url !== "string") || (url.indexOf('?', 0) === -1)) {
            separator = "?";
        }
        return url + separator + name + "=" + value;
    };

    Utils.parseBaseURL = function(url) {
        var result;
        var index = url.indexOf('?');
        if (index == -1) {
            result = url;
        } else {
            result = url.substring(0, url.indexOf('?')+1);
        }
        return result;
    };

    Utils.parseQueryString = function (url) {
        var queryString = url.substring(url.indexOf('?')+1).split('&');
        var params = {};
        var pair;
        // march and parse
        for (var i = queryString.length - 1; i >= 0; i--) {
            pair = queryString[i].split('=');
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return params;
    };

    Utils.requestUrl = function (url, datatype, options, callback, fallBack) {
        $.ajax({
            type: "GET",
            url: url,
            dataType: datatype,
            success: function (response) {
                if(callback) {
                    callback(response, options);
                }
            },
            error: function (request, status, error) {
                if(fallBack) {
                    fallBack(request, status, error, options);
                }
            }
        });
    };


    Utils.proxify = function (url, proxy) {
        if (typeof url !== 'string') {
            return url;
        }
        var proxifiedUrl = url;
        var proxyDone = false;
        if (proxy) {
            if (proxy.use === true) {
                proxyDone = true;
                if (url.toLowerCase().startsWith("http") === false) {
                    proxifiedUrl = url;
                } else if (url.startsWith(proxy.url)) {
                    proxifiedUrl = url; // No change, proxy always set
                } else {
                    proxifiedUrl = proxy.url + encodeURIComponent(url); // Add proxy redirection
                }
            }
        }
        return proxifiedUrl;
    };

    /**
     * Check if the time is valid ISO8601
     * @param time
     * @returns {boolean} True when the is valid ISO8601 otherwise false
     */
    Utils.isValidISO8601 = function(time) {
        var date = Date.parse(time);
        return !isNaN(unixTimeZero);
    };

    /**
     * Converts UTC hms from date to hours.
     * @param date date
     * @returns {number} hours
     * @private
     */
    Utils._UT = function(date) {
        var hour = date.getUTCHours();
        var min = date.getUTCMinutes();
        var sec = date.getUTCSeconds();
        return hour + min/60 + sec/3600;
    };

    /**
     * Computes Julian day number at 0 hr UT
     * @param date date
     * @returns {number} Julian day number at 0 hr UT
     * @private
     */
    Utils._J0 = function(date) {
        var year = date.getUTCFullYear();
        var month = date.getUTCMonth()+1;
        var day = date.getUTCDate();
        var UT = Utils._UT(date);
        var J0 = 367*year - Math.floor(7/4*(year + Math.floor((month+9)/12)))
            + Math.floor(275*month/9) + day + 1721013.5;
        //TODO check 1721013.5 should be -730531.5 !!!
        return J0;
    };

    /**
     * Computes Julian day.
     * @param date date
     * @returns {number} julian day
     * @private
     */
    Utils.JD = function(date) {
        return Utils._J0(date) + Utils._UT(date)/24;
    };

    /**
     * Computes the Greenwich sidereal time at 0 hr UT.
     * See equation [Seidelmann,1992]
     * @param date date
     * @returns {number} the Greenwich sidereal time at 0 hr UT
     * @private
     */
    Utils._GST0 = function(date) {
        //JC is Julian centuries between the Julian day J0 and J2000(2,451,545.0)
        var julianCentury = (Utils._J0(date) - 2451545.0)/36525;
        var GST0 = 100.4606184 + 36000.77004*julianCentury
            + 0.000387933*julianCentury*julianCentury
            - 2.583e-8*julianCentury*julianCentury*julianCentury;
        return GST0%360;
    };

    /**
     * Computes the Greenwich sidereal time at any other UT time.
     * @param date date
     * @returns {number} the Greenwich sidereal time at any other UT time
     */
    Utils.GST = function(date) {
        return (Utils._GST0(date) + 360.98564724*Utils._UT(date)/24)%360;
    };

    /**
     * Computes the local sidereal time.
     * @param date date
     * @param longitude longitude
     * @returns {number}
     */
    Utils.LST = function( date, longitude ) {
        return (Utils.GST(date) + longitude)%360;
    };

    /**
     * Computes the Sidereal Hour Angle
     * @param ra right ascension in decimal degree
     * @returns {number} SHA in decimal degree
     */
    Utils.SHA = function(ra) {
        return 360.0 - 15.0 * ra * 24.0 / 360.0;
    };

    /**
     * Computes the GHA (Greenwich Hour Angle).
     * GHA indicates the position past the plane of the Greenwich meridian measured in degrees. Equivalent to longitude on earth.
     * @param date date
     * @param ra right ascension in decimal degree
     * @returns {number} Greenwich Hour Angle in decimal degree
     */
    Utils.GHA = function(date, ra) {
        var GHA_Aries = 15.0 * Utils.GST(date) * 24.0 / 360.0;
        return (Utils.SHA(ra) + GHA_Aries)%360;
    };

    /**
     * Converts longitude/latitude to XYZ
     * @param longitude longitude in decimal degree
     * @param latitude latitude in decimal degree
     * @returns {{x: number, y: number, z: number}}
     */
    Utils.longLat2XYZ = function(longitude, latitude) {
        var cosLat = Math.cos(latitude*Math.PI/180);
        return {
            x:cosLat * Math.cos(longitude*Math.PI/180),
            y:cosLat * Math.sin(longitude*Math.PI/180),
            z:Math.sin(latitude*Math.PI/180)
        };
    };


    return Utils;

});
