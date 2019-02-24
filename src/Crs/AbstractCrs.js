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

define([
    "../Utils/Numeric",
    "./Geoide",
    "../Utils/Constants",
    "./AstroCoordTransform",
    "../Gui/dialog/ErrorDialog",
    "../Renderer/glMatrix"
], function(Numeric, Geoide, Constants, AstroCoordTransform, ErrorDialog) {
    /**
     * Abstract coordinate reference system configuration
     * @typedef {AbstractCrs.geoide_configuration} AbstractCrs.configuration
     * @property {CRS} geoideName - name of the coordinate reference system
     * @property {CONTEXT} type - Type of the CRS
     * @property {GeoBound} geoBound - Geographical bounding box
     */

    /**
     * @name AbstractCrs
     * @class
     * Creates an coordinate reference system for a globe and data.
     *
     * A coordinate reference system is a coordinate system that is related to an object
     * by a {@link Geoide geodetic datum}.
     *
     * A coordinate system is a set of mathematical rules for specifying how coordinates are to be assigned to points
     * @param {AbstractCrs.configuration} options - Options for the coordinate reference system.
     * @throws {ReferenceError} Will throw when option.geoideName, options.geoBound and options.type are not defined
     * @implements {Crs}
     */
    var AbstractCrs = function(options) {
        this.flat = false;
        this.geoide = null;
        this.type = null;
        this.geoBound = null;

        // If geoideName is specified, use it
        if (options && options.geoideName && options.type && options.geoBound) {
            this.geoide = new Geoide(options);
            this.geoideName = options.geoideName;
            this.type = options.type;
            this.geoBound = options.geoBound;
        } else {
            throw new ReferenceError(
                "The geoide's parameters, the geoBound and the type of context must be defined",
                AbstractCrs.js
            );
        }
    };

    /**
     * @function isFlat
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.isFlat = function() {
        return this.flat;
    };

    /**
     * @function getVerticalAt3D
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getVerticalAt3D = function(pos, dest) {
        if (!dest) {
            dest = new Array(3);
        }
        if (this.isFlat()) {
            dest[0] = 0.0;
            dest[1] = 0.0;
            dest[2] = 1.0;
        } else {
            vec3.normalize(pos, dest);
        }
        return dest;
    };

    /**
     * @function fromGeoTo3D
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.fromGeoTo3D = function(geo, dest) {
        if (!dest) {
            dest = new Array(3);
        }
        if (!geo || geo.length < 2) {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "AbstractCrs.js", "geo is 2D or does not exist");
            dest[0] = 0;
            dest[1] = 0;
            dest[2] = 0;
            return dest;
        }
        var longInRad = Numeric.toRadian(geo[0]);
        var latInRad = Numeric.toRadian(geo[1]);
        var cosLat = Math.cos(latInRad);

        // Take height into account
        var height = geo.length > 2 ? this.geoide.getHeightScale() * geo[2] : 0;
        var radius = this.geoide.getRadius() + height;

        dest[0] = radius * Math.cos(longInRad) * cosLat;
        dest[1] = radius * Math.sin(longInRad) * cosLat;
        dest[2] = radius * Math.sin(latInRad);

        return dest;
    };

    /**
     * @function from3DToGeo
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.from3DToGeo = function(position3d, dest) {
        if (!dest) {
            dest = new Array(3);
        }

        var r = Math.sqrt(
            position3d[0] * position3d[0] +
                position3d[1] * position3d[1] +
                position3d[2] * position3d[2]
        );
        var lon = Math.atan2(position3d[1] / r, position3d[0] / r);
        var lat = Math.asin(position3d[2] / r);
        dest[0] = Numeric.toDegree(lon);
        dest[1] = Numeric.toDegree(lat);
        dest[2] =
            this.geoide.getRealPlanetRadius() * (r - this.geoide.getRadius());
        return dest;
    };

    /**
     * @function getLocalTransform
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getLocalTransform = function(geo, dest) {
        if (!dest) {
            dest = mat4.create();
        }

        var longitude = Numeric.toRadian(geo[0]);
        var latitude = Numeric.toRadian(geo[1]);

        var up = [
            Math.cos(longitude) * Math.cos(latitude),
            Math.sin(longitude) * Math.cos(latitude),
            Math.sin(latitude)
        ];
        var east = [-Math.sin(longitude), Math.cos(longitude), 0];
        var north = vec3.create();
        vec3.cross(up, east, north);

        dest[0] = east[0];
        dest[1] = east[1];
        dest[2] = east[2];
        dest[3] = 0.0;

        dest[4] = north[0];
        dest[5] = north[1];
        dest[6] = north[2];
        dest[7] = 0.0;

        dest[8] = up[0];
        dest[9] = up[1];
        dest[10] = up[2];
        dest[11] = 0.0;

        dest[12] = 0.0;
        dest[13] = 0.0;
        dest[14] = 0.0;
        dest[15] = 1.0;

        return dest;
    };

    /**
     * @function getLHVTransform
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getLHVTransform = function(geo, dest) {
        if (!dest) {
            dest = mat4.create();
        }

        var longitude = Numeric.toRadian(geo[0]);
        var latitude = Numeric.toRadian(geo[1]);

        var up = [
            Math.cos(longitude) * Math.cos(latitude),
            Math.sin(longitude) * Math.cos(latitude),
            Math.sin(latitude)
        ];
        var east = [-Math.sin(longitude), Math.cos(longitude), 0];
        var north = vec3.create();
        vec3.cross(up, east, north);

        var pt = this.get3DFromWorld(geo);

        dest[0] = east[0];
        dest[1] = east[1];
        dest[2] = east[2];
        dest[3] = 0.0;

        dest[4] = north[0];
        dest[5] = north[1];
        dest[6] = north[2];
        dest[7] = 0.0;

        dest[8] = up[0];
        dest[9] = up[1];
        dest[10] = up[2];
        dest[11] = 0.0;

        dest[12] = pt[0];
        dest[13] = pt[1];
        dest[14] = pt[2];
        dest[15] = 1.0;

        return dest;
    };

    /**
     * @function getSideVector
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getSideVector = function(matrix, v) {
        v[0] = matrix[0];
        v[1] = matrix[1];
        v[2] = matrix[2];
        return v;
    };

    /**
     * @function getFrontVector
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getFrontVector = function(matrix, v) {
        v[0] = matrix[4];
        v[1] = matrix[5];
        v[2] = matrix[6];

        return v;
    };

    /**
     * @function getUpVector
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getUpVector = function(matrix, v) {
        v[0] = matrix[8];
        v[1] = matrix[9];
        v[2] = matrix[10];

        return v;
    };

    /**
     * @function formatCoordinates
     * @memberof AbstractCrs#
     * @abstract
     */
    AbstractCrs.prototype.formatCoordinates = function(geo) {
        throw new SyntaxError("Not implemented");
    };

    /**
     * @function getGeoide
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getGeoide = function() {
        return this.geoide;
    };

    /**
     * @function getGeoideName
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getGeoideName = function() {
        return this.geoideName;
    };

    /**
     * @function getType
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getType = function() {
        return this.type;
    };

    /**
     * @function getElevation
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getElevation = function(globe, geoPos) {
        return globe.getElevation(geoPos.coordinates[0], geoPos.coordinates[1]);
    };

    /**
     * @function getWorldFrom3D
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getWorldFrom3D = function(position3d, dest) {
        if (!dest) {
            dest = new Array(3);
        }
        var geoPos = this.from3DToGeo(position3d);
        this._setupPosAfterTrans(geoPos);
        dest[0] = geoPos[0];
        dest[1] = geoPos[1];
        dest[2] = geoPos.length > 2 ? geoPos[2] : 0;
        return dest;
    };

    /**
     * @function get3DFromWorld
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.get3DFromWorld = function(posWorld, dest) {
        if (!dest) {
            dest = vec3.create();
        }
        var pos = posWorld.slice(0);
        this._setupPosBeforeTrans(pos);
        this.fromGeoTo3D(pos, dest);
        return dest;
    };

    /**
     * @function get3DFromWorldInCrs
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.get3DFromWorldInCrs = function(
        posWorld,
        posCrsID,
        dest
    ) {
        if (!dest) {
            dest = vec3.create();
        }
        var posWorldInCurrentCrs = this.convert(
            posWorld,
            posCrsID,
            this.getGeoideName()
        );
        this.get3DFromWorld(posWorldInCurrentCrs, dest);
        return dest;
    };

    /**
     * @function getSexagesimalFromDeg
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getSexagesimalFromDeg = function(degPos, dest) {
        dest = dest || [];

        var deg = degPos[0];
        // RA
        if (deg < 0) {
            deg += 360;
        }

        dest[0] = this.fromDegreesToHMS(deg);
        dest[1] = this.fromDegreesToDMS(degPos[1]);

        return dest;
    };

    /**
     * @function getDecimalDegFromSexagesimal
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getDecimalDegFromSexagesimal = function(
        sexagesimalPos,
        dest
    ) {
        dest = dest || [];

        // we use string because : parseFloat("-0") returns 0..
        function sign(stringDegree) {
            return stringDegree[0] === "-" ? -1 : 1;
        }

        var longitude = sexagesimalPos[0].split(" ");
        // long
        var deg = parseFloat(longitude[0]);
        var min = parseFloat(longitude[1]);
        var sec = parseFloat(longitude[2]);

        dest[0] = (deg + min / 60 + sec / 3600) * 15.0;

        var latitude = sexagesimalPos[1].split(" ");
        // lat
        deg = parseFloat(latitude[0]);
        min = parseFloat(latitude[1]);
        sec = parseFloat(latitude[2]);

        dest[1] = sign(latitude[0]) * (Math.abs(deg) + min / 60 + sec / 3600);

        return dest;
    };

    /**
     * @function convert
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.convert = function(geo, from, to) {
        // No conversion needed
        if (from === to) {
            return geo;
        }

        var convertedGeo = null;
        var convertType = null;
        switch (from + "2" + to) {
        case Constants.CRS.Galactic + "2" + Constants.CRS.Equatorial:
            convertType = AstroCoordTransform.Type.GAL2EQ;
            convertedGeo = AstroCoordTransform.transformInDeg(
                geo,
                convertType
            );
            break;
        case Constants.CRS.Equatorial + "2" + Constants.CRS.Galactic:
            convertType = AstroCoordTransform.Type.EQ2GAL;
            convertedGeo = AstroCoordTransform.transformInDeg(
                geo,
                convertType
            );
            if (convertedGeo[0] < 0) {
                // TODO : Check if convertedGeo can be negative
                ErrorDialog.open(Constants.LEVEL.DEBUG, "AbstractCRs.js", "EQ2GAL transformation returned negative value");
                convertedGeo[0] += 360;
            }
            break;
        case Constants.CRS.Mars_2000 + "2" + Constants.CRS.Mars_2000_old:
        case Constants.CRS.Mars_2000_old + "2" + Constants.CRS.Mars_2000:
            convertedGeo = geo;
            break;
        case Constants.CRS.Moon_2000 + "2" + Constants.CRS.Moon_2000_old:
        case Constants.CRS.Moon_2000_old + "2" + Constants.CRS.Moon_2000:
            convertedGeo = geo;
            break;
        default:
            throw new RangeError(
                "Conversion " + from + " to " + to + " is not implemented",
                "AbstractCrs.js"
            );
        }

        return convertedGeo;
    };

    /**
     * Adds a zero before the number < 10
     * @function _pad2Digits
     * @param number number to format
     * @returns {string}
     * @private
     */
    AbstractCrs.prototype._pad2Digits = function(number) {
        return number < 10 ? "0" + number : number;
    };

    /**
     * @function fromDegreesToHMS
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.fromDegreesToHMS = function(degree) {
        var localDegree = degree / 15;

        var absLon = Math.abs(localDegree);
        var hours = Math.floor(absLon);
        var decimal = (absLon - hours) * 60;
        var min = Math.floor(decimal);
        var sec = (decimal - min) * 60;

        return (
            this._pad2Digits(hours) +
            "h " +
            this._pad2Digits(min) +
            "m " +
            this._pad2Digits(Numeric.roundNumber(sec, 2)) +
            "s"
        );
    };

    /**
     * @function fromDegreesToDMS
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.fromDegreesToDMS = function(degree) {
        function stringSign(val) {
            return val >= 0 ? "+" : "-";
        }

        var absLat = Math.abs(degree);
        var deg = Math.floor(absLat);
        var decimal = (absLat - deg) * 60;
        var min = Math.floor(decimal);
        var sec = (decimal - min) * 60;

        return (
            stringSign(degree) +
            this._pad2Digits(deg) +
            String.fromCharCode(176) +
            " " +
            this._pad2Digits(min) +
            "' " +
            this._pad2Digits(Numeric.roundNumber(sec, 2)) +
            "\""
        );
    };

    /**
     * @function _setupPosBeforeTrans
     * @memberof AbstractCrs#
     * @abstract
     */
    AbstractCrs.prototype._setupPosBeforeTrans = function(posWorld) {
        throw new SyntaxError("Not implemented");
    };

    /**
     * @function _setupPosAfterTrans
     * @memberof AbstractCrs#
     * @bastract
     */
    AbstractCrs.prototype._setupPosAfterTrans = function(posWorld) {
        throw new SyntaxError("Not implemented");
    };

    /**
     * @function getGeoBound
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.getGeoBound = function() {
        return this.geoBound;
    };

    /**
     * @function getName
     * @memberof AbstractCrs#
     * @abstract
     */
    AbstractCrs.prototype.getName = function() {
        throw new SyntaxError("Not implemented");
    };

    /**
     * @function getDescription
     * @memberof AbstractCrs#
     * @abstract
     */
    AbstractCrs.prototype.getDescription = function() {
        throw new SyntaxError("Not implemented");
    };

    /**
     * @function getLongitudeLabel
     * @memberof AbstractCrs#
     * @abstract
     */
    AbstractCrs.prototype.getLongitudeLabel = function() {
        throw new SyntaxError("Not implemented");
    };

    /**
     * @function getLatitudeLabel
     * @memberof AbstractCrs#
     * @abstract
     */
    AbstractCrs.prototype.getLatitudeLabel = function() {
        throw new SyntaxError("Not implemented");
    };

    /**
     * @function isProjected
     * @memberof AbstractCrs#
     * @return {boolean} true when the Crs is projected in 2D otherwise false.
     */
    AbstractCrs.prototype.isProjected = function() {
        return false;
    };

    /**
     * @function destroy
     * @memberof AbstractCrs#
     */
    AbstractCrs.prototype.destroy = function() {
        this.flat = null;
        this.geoide = null;
        this.type = null;
        this.geoBound = null;
        this.projected = null;
    };

    /**************************************************************************************************************/
    return AbstractCrs;
});
