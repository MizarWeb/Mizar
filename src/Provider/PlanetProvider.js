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

/**
 * Mizar is able to load a whole file as GeoJson format for vectorial data. If the data format is not in GeoJson then a Provider must be applied.
 * <ul>
 *     <li>{@link module:Provider.ConstellationProvider ConstellationProvider}: Loads constellation data</li>
 *     <li>{@link module:Provider.CraterProvider CraterProvider} : Loads craters</li>
 *     <li>{@link module:Provider.PlanetProvider PlanetProvider} : Loads planets position on the sky</li>
 *     <li>{@link module:Provider.StarProvider StarProvider} : Loads stars name on the sky</li>
 *     <li>{@link module:Provider.TrajectoryProvider TrajectoryProvider} : Loads a file to display a trajectory</li>
 * </ul>
 *
 * In addition to the classes, a {@link module:Provider.ProviderFactory factory} is available to help for creating
 * provider. Once the provider is created, the client can handle it by the use of its {@link Provider interface}.
 *
 * @module Provider
 * @implements {Provider}
 * @todo Describes here and link to the tutos about Animation
 */
define([
    "jquery",
    "./AbstractProvider",
    "../Renderer/FeatureStyle",
    "../Utils/Constants",
    "../Utils/Numeric"
], function($, AbstractProvider, FeatureStyle, Constants, Numeric) {
    var self;
    var interval;
    var poiFeatureCollection;
    var RADS = Math.PI / 180; // convert degrees to radians
    var EPS = 1.0e-12; // machine error constant
    var pname = new Array(
        "Mercury",
        "Venus",
        "Sun",
        "Mars",
        "Jupiter",
        "Saturn",
        "Uranus",
        "Neptune",
        "Pluto"
    );

    function frealstr(num, width, fract) {
        var str = num.toFixed(fract);
        var len = str.length;
        var real = "";
        var i;

        for (i = 0; i < width - len; i++) {
            // append leading spaces
            real += " ";
        }

        for (i = 0; i < len; i++) {
            // append digits
            real += str.charAt(i);
        }

        return real;
    }

    /*
     * Json template for a point
    */
    function poiDesc(mizarLayer, type, name, obj) {
        var style;
        if (type === Constants.GEOMETRY.Point) {
            style = new FeatureStyle({
                iconUrl: mizarLayer.style.iconUrl,
                strokeColor: FeatureStyle.fromStringToColor(obj.color),
                fillColor: FeatureStyle.fromStringToColor(obj.color)
            });
        } else {
            style = new FeatureStyle({
                label: name,
                strokeColor: FeatureStyle.fromStringToColor(obj.color),
                fillColor: FeatureStyle.fromStringToColor(obj.color)
            });
        }
        return {
            geometry: {
                type: Constants.GEOMETRY.Point,
                gid: "planet" + type + "_" + name,
                coordinates: [obj.ra, obj.dec],
                crs: {
                    type: "name",
                    properties: {
                        name: Constants.CRS.Equatorial
                    }
                }
            },
            properties: {
                name: name,
                distance: frealstr(obj.rvec, 9, 6) + " AU",
                style: style
            }
        };
    }

    // right ascension, declination coordinate structure
    function Coord() {
        this.ra = parseFloat("0"); // right ascension [deg]
        this.dec = parseFloat("0"); // declination [deg]
        this.rvec = parseFloat("0"); // distance [AU]
    }

    // day number to/from J2000 (Jan 1.5, 2000)
    function day_number(y, m, d, hour, mins) {
        var h = hour + mins / 60;
        return (
            367 * y -
            Math.floor((7 * (y + Math.floor((m + 9) / 12))) / 4) +
            Math.floor((275 * m) / 9) +
            d -
            730531.5 +
            h / 24
        );
    }

    /**************************************************************************************************************/

    // orbital element structure
    function Elem() {
        this.color = ""; // color of the planet
        this.a = parseFloat("0"); // semi-major axis [AU]
        this.e = parseFloat("0"); // eccentricity of orbit
        this.i = parseFloat("0"); // inclination of orbit [deg]
        this.O = parseFloat("0"); // longitude of the ascending node [deg]
        this.w = parseFloat("0"); // longitude of perihelion [deg]
        this.L = parseFloat("0"); // mean longitude [deg]
    }

    // return the integer part of a number
    function abs_floor(x) {
        var r;
        if (x >= 0.0) {
            r = Math.floor(x);
        } else {
            r = Math.ceil(x);
        }
        return r;
    }

    // return an angle in the range 0 to 2pi radians
    function mod2pi(x) {
        var b = x / (2 * Math.PI);
        var a = 2 * Math.PI * (b - abs_floor(b));
        if (a < 0) {
            a = 2 * Math.PI + a;
        }
        return a;
    }

    // compute the true anomaly from mean anomaly using iteration
    //  M - mean anomaly in radians
    //  e - orbit eccentricity
    function true_anomaly(M, e) {
        var V, E1;

        // initial approximation of eccentric anomaly
        var E = M + e * Math.sin(M) * (1.0 + e * Math.cos(M));

        do // iterate to improve accuracy
        {
            E1 = E;
            E = E1 - (E1 - e * Math.sin(E1) - M) / (1 - e * Math.cos(E1));
        } while (Math.abs(E - E1) > EPS);

        // convert eccentric anomaly to true anomaly
        V = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(0.5 * E));

        if (V < 0) {
            V = V + 2 * Math.PI;
        } // modulo 2pi

        return V;
    }

    /**
     * Computes the elements of the orbit for planet-i at day number-d
     * @param p - result
     * @param i - planet-i
     * @param d - day number
     * @throws {RangeError} function mean_elements() failed!
     */
    function mean_elements(p, i, d) {
        var cy = d / 36525; // centuries since J2000

        switch (i) {
        case 0: // Mercury
            p.color = "rgb(170,150,170)";
            p.a = 0.38709893 + 0.00000066 * cy;
            p.e = 0.20563069 + 0.00002527 * cy;
            p.i = Numeric.toRadian(7.00487 - (23.51 * cy) / 3600);
            p.O = Numeric.toRadian(48.33167 - (446.3 * cy) / 3600);
            p.w = Numeric.toRadian(77.45645 + (573.57 * cy) / 3600);
            p.L = mod2pi(Numeric.toRadian(252.25084 + (538101628.29 * cy) / 3600));
            break;
        case 1: // Venus
            p.color = "rgb(245,222,179)";
            p.a = 0.72333199 + 0.00000092 * cy;
            p.e = 0.00677323 - 0.00004938 * cy;
            p.i = Numeric.toRadian(3.39471 - (2.86 * cy) / 3600);
            p.O = Numeric.toRadian(76.68069 - (996.89 * cy) / 3600);
            p.w = Numeric.toRadian(131.53298 - (108.8 * cy) / 3600);
            p.L = mod2pi(Numeric.toRadian(181.97973 + (210664136.06 * cy) / 3600));
            break;
        case 2: // Earth/Sun
            p.color = "rgb(255,193,37)";
            p.a = 1.00000011 - 0.00000005 * cy;
            p.e = 0.01671022 - 0.00003804 * cy;
            p.i = Numeric.toRadian(0.00005 - (46.94 * cy) / 3600);
            p.O = Numeric.toRadian(-11.26064 - (18228.25 * cy) / 3600);
            p.w = Numeric.toRadian(102.94719 + (1198.28 * cy) / 3600);
            p.L = mod2pi(Numeric.toRadian(100.46435 + (129597740.63 * cy) / 3600));
            break;
        case 3: // Mars
            p.color = "rgb(255,50,50)";
            p.a = 1.52366231 - 0.00007221 * cy;
            p.e = 0.09341233 + 0.00011902 * cy;
            p.i = Numeric.toRadian(1.85061 - (25.47 * cy) / 3600);
            p.O = Numeric.toRadian(49.57854 - (1020.19 * cy) / 3600);
            p.w = Numeric.toRadian(336.04084 + (1560.78 * cy) / 3600);
            p.L = mod2pi(Numeric.toRadian(355.45332 + (68905103.78 * cy) / 3600));
            break;
        case 4: // Jupiter
            p.color = "rgb(255,150,150)";
            p.a = 5.20336301 + 0.00060737 * cy;
            p.e = 0.04839266 - 0.0001288 * cy;
            p.i = Numeric.toRadian(1.3053 - (4.15 * cy) / 3600);
            p.O = Numeric.toRadian(100.55615 + (1217.17 * cy) / 3600);
            p.w = Numeric.toRadian(14.75385 + (839.93 * cy) / 3600);
            p.L = mod2pi(Numeric.toRadian(34.40438 + (10925078.35 * cy) / 3600));
            break;
        case 5: // Saturn
            p.color = "rgb(200,150,150)";
            p.a = 9.53707032 - 0.0030153 * cy;
            p.e = 0.0541506 - 0.00036762 * cy;
            p.i = Numeric.toRadian(2.48446 + (6.11 * cy) / 3600);
            p.O = Numeric.toRadian(113.71504 - (1591.05 * cy) / 3600);
            p.w = Numeric.toRadian(92.43194 - (1948.89 * cy) / 3600);
            p.L = mod2pi(Numeric.toRadian(49.94432 + (4401052.95 * cy) / 3600));
            break;
        case 6: // Uranus
            p.color = "rgb(130,150,255)";
            p.a = 19.19126393 + 0.00152025 * cy;
            p.e = 0.04716771 - 0.0001915 * cy;
            p.i = Numeric.toRadian(0.76986 - (2.09 * cy) / 3600);
            p.O = Numeric.toRadian(74.22988 - (1681.4 * cy) / 3600);
            p.w = Numeric.toRadian(170.96424 + (1312.56 * cy) / 3600);
            p.L = mod2pi(Numeric.toRadian(313.23218 + (1542547.79 * cy) / 3600));
            break;
        case 7: // Neptune
            p.color = "rgb(100,100,255)";
            p.a = 30.06896348 - 0.00125196 * cy;
            p.e = 0.00858587 + 0.0000251 * cy;
            p.i = Numeric.toRadian(1.76917 - (3.64 * cy) / 3600);
            p.O = Numeric.toRadian(131.72169 - (151.25 * cy) / 3600);
            p.w = Numeric.toRadian(44.97135 - (844.43 * cy) / 3600);
            p.L = mod2pi(Numeric.toRadian(304.88003 + (786449.21 * cy) / 3600));
            break;
        case 8: // Pluto
            p.color = "rgb(100,100,255)";
            p.a = 39.48168677 - 0.00076912 * cy;
            p.e = 0.24880766 + 0.00006465 * cy;
            p.i = Numeric.toRadian(17.14175 + (11.07 * cy) / 3600);
            p.O = Numeric.toRadian(110.30347 - (37.33 * cy) / 3600);
            p.w = Numeric.toRadian(224.06676 - (132.25 * cy) / 3600);
            p.L = mod2pi(Numeric.toRadian(238.92881 + (522747.9 * cy) / 3600));
            break;
        default:
            throw RangeError(
                "function mean_elements() failed!",
                "PlanetProvider.js"
            );
        }
    }

    // compute RA, DEC, and distance of planet-p for day number-d
    // result returned in structure obj in degrees and astronomical units
    function get_coord(obj, p, d) {
        var planet = new Elem();
        mean_elements(planet, p, d);
        var ap = planet.a;
        var ep = planet.e;
        var ip = planet.i;
        var op = planet.O;
        var pp = planet.w;
        var lp = planet.L;

        var earth = new Elem();
        mean_elements(earth, 2, d);
        var ae = earth.a;
        var ee = earth.e;
        //var ie = earth.i;
        //var oe = earth.O;
        var pe = earth.w;
        var le = earth.L;

        // position of Earth in its orbit
        var me = mod2pi(le - pe);
        var ve = true_anomaly(me, ee);
        var re = (ae * (1 - ee * ee)) / (1 + ee * Math.cos(ve));

        // heliocentric rectangular coordinates of Earth
        var xe = re * Math.cos(ve + pe);
        var ye = re * Math.sin(ve + pe);
        var ze = 0.0;

        // position of planet in its orbit
        var mp = mod2pi(lp - pp);
        var vp = true_anomaly(mp, planet.e);
        var rp = (ap * (1 - ep * ep)) / (1 + ep * Math.cos(vp));

        // heliocentric rectangular coordinates of planet
        var xh =
            rp *
            (Math.cos(op) * Math.cos(vp + pp - op) -
                Math.sin(op) * Math.sin(vp + pp - op) * Math.cos(ip));
        var yh =
            rp *
            (Math.sin(op) * Math.cos(vp + pp - op) +
                Math.cos(op) * Math.sin(vp + pp - op) * Math.cos(ip));
        var zh = rp * (Math.sin(vp + pp - op) * Math.sin(ip));

        if (p === 2) {
            // earth --> compute sun
            xh = 0;
            yh = 0;
            zh = 0;
        }

        // convert to geocentric rectangular coordinates
        var xg = xh - xe;
        var yg = yh - ye;
        var zg = zh - ze;

        // rotate around x axis from ecliptic to equatorial coords
        var ecl = 23.439281 * RADS; //value for J2000.0 frame
        var xeq = xg;
        var yeq = yg * Math.cos(ecl) - zg * Math.sin(ecl);
        var zeq = yg * Math.sin(ecl) + zg * Math.cos(ecl);

        // find the RA and DEC from the rectangular equatorial coords
        obj.ra = Numeric.toDegree(mod2pi(Math.atan2(yeq, xeq)));
        obj.dec = Numeric.toDegree(Math.atan(zeq / Math.sqrt(xeq * xeq + yeq * yeq)));
        obj.rvec = Math.sqrt(xeq * xeq + yeq * yeq + zeq * zeq);
        obj.color = planet.color;
    }

    /**
     *    Handle features on layer
     */
    var computePositions = function(mizarLayer) {
        var pois = [];
        var now = new Date();
        var year = now.getUTCFullYear();
        var month = now.getUTCMonth() + 1;
        var day = now.getUTCDate();
        var hour = now.getUTCHours();
        var mins = now.getUTCMinutes();
        var secs = now.getUTCSeconds();

        // compute day number for date/time
        var dn = day_number(year, month, day, hour, mins + secs / 60);
        var obj = new Coord();
        // compute location of objects
        for (var p = 0; p < 9; p++) {
            get_coord(obj, p, dn);
            // Add label
            var poi_label = poiDesc(mizarLayer, "Label", pname[p], obj);
            pois.push(poi_label);

            // Add point itself
            var poi_point = poiDesc(
                mizarLayer,
                Constants.GEOMETRY.Point,
                pname[p],
                obj
            );
            pois.push(poi_point);
        }

        // Create feature collection
        poiFeatureCollection = {
            type: "FeatureCollection",
            features: pois,
        };

        mizarLayer.addFeatureCollection(poiFeatureCollection);
    };

    /**************************************************************************************************************/

    /**
     * @name PlanetProvider
     * @class
     *    Providing planet positions based on ephemeris computations
     * @param {Object} options
     * @augments AbstractProvider
     * @constructor
     * @memberof module:Provider
     * @see http://www.abecedarical.com/javascript/script_planet_orbits.html
     */
    var PlanetProvider = function(options) {
        AbstractProvider.prototype.constructor.call(this, options);
        self = this;
    };

    /**
     * Loads files
     * @param {Layer} layer - Mizar layer
     * @param {Object} configuration - configuration
     * @param {int} [configuration.interval = 60000] - Recomputes planet position every minute if not defined
     * @memberof PlanetProvider#
     */
    PlanetProvider.prototype.loadFiles = function(layer, configuration) {
        interval = configuration.interval ? configuration.interval : 60000;
        self.handleFeatures(layer);
    };

    /**
     * Calculate planets position and add them to the passed layer
     * @function handleFeatures
     * @memberof PlanetProvider#
     * @param {Layer} layer
     */
    PlanetProvider.prototype.handleFeatures = function(layer) {
        computePositions(layer);
        setInterval(function() {
            layer.removeFeatureCollection(poiFeatureCollection);
            computePositions(layer);
        }, interval);
    };

    /**
     * Returns the Sun position at the date.
     * @param {date} date
     * @returns {float[]} the Sun position
     */
    PlanetProvider.prototype.getSunPosition = function(date) {
        var year = date.getUTCFullYear();
        var month = date.getUTCMonth() + 1;
        var day = date.getUTCDate();
        var hour = date.getUTCHours();
        var mins = date.getUTCMinutes();
        var secs = date.getUTCSeconds();
        // compute day number for date/time
        var dn = day_number(year, month, day, hour, mins + secs / 60);
        var obj = new Coord();
        get_coord(obj, 2, dn);
        return obj;
    };

    return PlanetProvider;
});
