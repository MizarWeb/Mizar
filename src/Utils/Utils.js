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

define(function () {

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
        xOk = Utils.isValueBetween(a.west, b.west, b.east) ||
            Utils.isValueBetween(a.east, b.west, b.east) ||
            ((a.west <= b.west) && (a.east >= b.east));

        yOk = Utils.isValueBetween(a.north, b.south, b.north) ||
            Utils.isValueBetween(a.south, b.south, b.north) ||
            ((a.south <= b.south) && (a.north >= b.north));

        return xOk && yOk;
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
     * @memberOf AbstractLayer#
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

    return Utils;

});
