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

/**
 * Reverse Name resolver module : API allowing to retrieve information from a geo picking
 * @module ReverseNameResolver
 * @implements {ReverseNameResolver}
 */
define([
    "jquery",
    "underscore-min",
    "../Utils/Constants",
    "../Utils/Utils",
    "./AbstractReverseNameResolver",
    "../Tiling/HEALPixBase"
], function($, _, Constants, Utils, AbstractReverseNameResolver, HEALPixBase) {
    /**************************************************************************************************************/

    var HOUR_TO_DEG = 15.0;
    var lastCallTime = null;
    var callTimeInterval = 6000;

    /**
     * @name CDSReverseNameResolver
     * @class
     *   Plugin to access to CDS reverse name resolver
     * @augments AbstractReverseNameResolver
     * @param {Context} options - Context
     * @memberof module:ReverseNameResolver
     */
    var CDSReverseNameResolver = function(options) {
        AbstractReverseNameResolver.prototype.constructor.call(this, options);
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractReverseNameResolver, CDSReverseNameResolver);

    /**************************************************************************************************************/

    /**
     * Queries the CDS reverse name resolver
     * @function handle
     * @memberof CDSReverseNameResolver#
     * @param {Object} options - parameters
     * @param {int} options.maxOrder - Max Hips order
     * @param {float[]} options.pos - position
     * @param {Mizar} options.mizarAPI - mizar API
     * @param {Function} options.error - error function
     * @param {Function} options.success - success function
     */
    CDSReverseNameResolver.prototype.handle = function(options) {
        //Do not call the service to often
        var now = Date.now();
        var diff = now - callTimeInterval;
        if (lastCallTime !== null && diff <= lastCallTime) {
            if (options && options.error) {
                options.error({
                    status: 503
                });
            }
            return;
        }

        var self = this;

        var maxOrder = options.maxOrder;
        var pos = options.pos;
        var mizarAPI = options.mizarAPI;
        pos = mizarAPI
            .getCrs()
            .convert(
                pos,
                mizarAPI.getCrs().getGeoideName(),
                Constants.CRS.Equatorial
            );

        var equatorialCoordinates = [];
        mizarAPI.getCrs().getSexagesimalFromDeg(pos, equatorialCoordinates);

        // Format to equatorial coordinates
        equatorialCoordinates[0] = equatorialCoordinates[0].replace("h ", ":");
        equatorialCoordinates[0] = equatorialCoordinates[0].replace("m ", ":");
        equatorialCoordinates[0] = equatorialCoordinates[0].replace("s", "");

        equatorialCoordinates[1] = equatorialCoordinates[1].replace("° ", ":");
        equatorialCoordinates[1] = equatorialCoordinates[1].replace("' ", ":");
        equatorialCoordinates[1] = equatorialCoordinates[1].replace('"', "");

        //BEGINING OF SPECIFIC PROCESSING
        //DO IT WITHOUT REQUESTING SITOOLS
        /**
         * Arsec 2 degree conversion.
         */
        var ARCSEC_2_DEG = 1 / 3600.0;
        /**
         * MAX radius of a cone in arcsec.
         */
        var MAX_RADIUS = 1800.0;

        var nside = Math.pow(2, maxOrder);

        var pixRes = HEALPixBase.getPixRes(nside);
        var radius = pixRes > MAX_RADIUS ? MAX_RADIUS : pixRes / 2;
        radius *= ARCSEC_2_DEG;

        var requestUrl = mizarAPI
            .getActivatedContext()
            .getContextConfiguration().reverseNameResolver.baseUrl;

        requestUrl = requestUrl.replace(
            "{coordinates}",
            equatorialCoordinates[0] + " " + equatorialCoordinates[1]
        );
        requestUrl = requestUrl.replace("{radius}", radius);

        Utils.requestUrl(requestUrl, 'text', 'text/plain', null, function(response){
            lastCallTime = Date.now();

            // we parse the message that is returned by the server
            var posParenthesis = response.indexOf("(");
            var posComma = response.indexOf(",");
            var posSlash = response.indexOf("/");
            var position = response.substring(0, posSlash);
            var name = response.substring(posSlash + 1, posParenthesis);

            var magnitude = parseFloat(
                response.substring(posParenthesis + 1, posComma)
            );
            var objectType = response.substring(
                posComma + 1,
                response.length - 2
            );

            var positionElts = position.split(" ");

            //GET HMS
            var hours = parseFloat(positionElts[0]);
            var min = parseFloat(positionElts[1]);
            var sec = parseFloat(positionElts[2]);

            var degrees = parseFloat(positionElts[3]);
            var min2 = parseFloat(positionElts[4]);
            var sec2 = parseFloat(positionElts[5]);

            var ra = self._parseRa(hours, min, sec);
            var dec = self._parseDec(degrees, min2, sec2);

            var features = {
                totalResults: 1,
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            coordinates: [ra, dec],
                            type: Constants.GEOMETRY.Point,
                            crs: {
                                type: "name",
                                properties: {
                                    name: Constants.CRS.Equatorial
                                }
                            }
                        },
                        properties: {
                            title: name,
                            magnitude: magnitude,
                            credits: "CDS",
                            seeAlso:
                                "http://simbad.u-strasbg.fr/simbad/sim-id?Ident=" +
                                name,
                            type: objectType,
                            identifier: name
                        }
                    }
                ]
            };

            if (options && options.success) {
                options.success(features);
            }
            //END OF SPECIFIC PROCESSING
        }, function(err){
            if (options && options.error) {
                options.error(err);
            }
        });
    };

    /**
     * Parse RA.
     * @function _parseRa
     * @memberof CDSReverseNameResolver#
     * @param hours
     * @param min
     * @param sec
     * @returns {number}
     * @private
     */
    CDSReverseNameResolver.prototype._parseRa = function(hours, min, sec) {
        var intHours = parseInt(hours, 10);
        var val = (sec / 60.0 + min) / 60.0;

        if (hours < 0.0 || parseFloat(hours) === -0.0) {
            val = hours - val;
            intHours = -intHours;
        } else {
            val = intHours + val;
        }
        return val * HOUR_TO_DEG;
    };

    /**
     * Parse dec
     * @function _parseDec
     * @memberof CDSReverseNameResolver#
     * @param degrees
     * @param min
     * @param sec
     * @returns {number}
     * @private
     */
    CDSReverseNameResolver.prototype._parseDec = function(degrees, min, sec) {
        var intDegrees = parseInt(degrees, 10);

        var val = (sec / 60.0 + min) / 60.0;

        if (degrees < 0.0 || parseFloat(degrees) === -0.0) {
            val = degrees - val;
            intDegrees = -intDegrees;
        } else {
            val = intDegrees + val;
        }
        return val;
    };

    /**
     * @function remove
     * @memberof CDSReverseNameResolver#
     */
    CDSReverseNameResolver.prototype.remove = function() {};

    /**************************************************************************************************************/

    return CDSReverseNameResolver;
});
