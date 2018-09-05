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
 * CRS is an interface to handle the coordinate reference system, which allows a {@link Context} :
 * <ul>
 *     <li>to convert 3D position from/to world coordinates</li>
 *     <li>to compute the local transformation matrix and vectors from this matrix</li>
 * </ul>
 * Mizar currently supports the following coordinates reference systems :
 * <table border="1">
 *     <tr>
 *         <td><img src="../doc/images/equatorial.png" width="200px"/></td>
 *         <td>{@link module:Crs.EquatorialCrs EquatorialCrs}</td>
 *         <td>Provides an equatorial coordinate reference system</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/galactic.png" width="200px"/></td>
 *         <td>{@link module:Crs.GalacticCrs GalacticCrs}</td>
 *         <td>Provides a galactic coordinate reference system</td>
 *     </tr>
 *     <tr>
 *         <td></td>
 *         <td>{@link module:Crs.Mars2000Crs Mars2000Crs}</td>
 *         <td>Provides a coordinate reference system base on the Mars geoide</td>
 *     </tr>
 *     <tr>
 *         <td></td>
 *         <td>{@link module:Crs.Moon2000Crs Moon2000Crs}</td>
 *         <td>Provides a coordinate reference system base on the spherical Moon</td>
 *     </tr>
 *     <tr>
 *         <td><img src="../doc/images/earth.jpg" width="200px"/></td>
 *         <td>{@link module:Crs.WGS84Crs WGS84Crs}</td>
 *         <td>Provides a coordinate reference system base on the Earth geoide</td>
 *     </tr>
 *     <tr>
 *         <td></td>
 *         <td>{@link module:Crs.ProjectedCrs ProjectedCrs}</td>
 *         <td>Provides a projected coordinate reference system on a map</td>
 *     </tr>
 *     <tr>
 *         <td></td>
 *         <td>{@link module:Crs.HorizontalLocalCrs HorizontalLocalCrs}</td>
 *         <td>Provides a local coordinate reference system based on horizontal coordinates</td>
 *     </tr>
 * </table>
 * 
 * In addition to the classes, a {@link module:Crs.CoordinateSystemFactory factory} is available to help for creating
 * animation. Once the crs is created, the client can handle it by the use of its {@link Crs interface}. 
 * @see {@link module:Crs the coordinate reference system package}
 * @interface
 */
function Crs() {
}

/**
 * Checks when the CRS is a {@link ProjectedCrs}.
 * A {@link ProjectedCrs} projects data on a 2D map.
 *
 * @returns True when the CRS is 2D otherwise False
 */
Crs.prototype.isFlat = function () {
};

/**
 * Computes the direction or vertical as a unit vector of the same direction as the provided pos.
 * @param {float[]} pos - the position as a 3D vector
 * @param {float[]} dest - the direction as a 3D vector
 */
Crs.prototype.getVerticalAt3D = function (pos, dest) {
};

/**
 * Converts a geographic position to a 3D vector.
 * @param {float[]} geo - geographical position as a (longitude in degree, latitude in degree, distance from surface in meter)
 * @param {float[]} dest - 3D vector
 * @return {float[]} a 3D vector
 */
Crs.prototype.fromGeoTo3D = function (geo, dest) {
};


/**
 * Converts a 3D vector to geographical position.
 * @param {float[]} position3d - 3D position
 * @param {float[]} dest - geographical position [long, lat, distance from earth surface]
 * @return {float[]} geographical position [long, lat, distance from earth surface]
 */
Crs.prototype.from3DToGeo = function (position3d, dest) {
};

/**
 * Returns the local transformation.
 * @param {float[]} geo - geographical position
 * @param {float[]} dest - Matrix as 16 values
 * @return {float[]} Matrix as 16 values
 */
Crs.prototype.getLocalTransform = function (geo, dest) {
};

/**
 * Returns the LHV transformation.
 * @param {float[]} geo - geographical position
 * @param {float[]} dest - Matrix as 16 values
 * @return {float[]} Matrix as 16 values
 */
Crs.prototype.getLHVTransform = function (geo, dest) {
};

/**
 * Returns the side (i.e. X) vector from a local transformation
 * @param {float[]} matrix - Matrix as 16 values
 * @param {float[]} v - Vector as 3 values
 * @return {float[]} Vector as 3 values
 */
Crs.prototype.getSideVector = function (matrix, v) {
};

/**
 * Returns the front (i.e. Y) vector from a local transformation
 * @param {float[]} matrix - Matrix as 16 values
 * @param {float[]} v - Vector as 3 values
 * @return {float[]} Vector as 3 values
 */
Crs.prototype.getFrontVector = function (matrix, v) {
};

/**
 * Returns the up (i.e. Z) vector from a local transformation
 * @param {float[]} matrix - Matrix as 16 values
 * @param {float[]} v - Vector as 3 values
 * @return {float[]} Vector as 3 values
 */
Crs.prototype.getUpVector = function (matrix, v) {
};

/**
 * Formats the coordinates according to the coordinate reference system.
 * @param {string[]} geo - position on the globe in decimal degree
 */
Crs.prototype.formatCoordinates = function (geo) {
};

/**
 * Returns the geoide.
 * @return {Geoide} the geoide
 */
Crs.prototype.getGeoide = function () {
};

/**
 * Returns the geoide name.
 * @return {string} the geoide name
 */
Crs.prototype.getGeoideName = function () {
};

/**
 * Returns the name of the coordinate reference system.
 * @return {CRS} name of the coordinate reference system
 */
Crs.prototype.getType = function () {
};

/**
 * Returns the elevation in meters at a given position.
 * @param {AbstractGlobe} globe - globe
 * @param {float[]} geoPos - position on the globe in decimal degree
 * @return {float} the elevation in meters
 */
Crs.prototype.getElevation = function (globe, geoPos) {
};

/**
 * Returns the position in the defined CRS from a 3D position.
 * @param {float[]} position3d - 3D position
 * @param {float[]} dest - the position in the defined coordinate reference system
 * @return {float[]} the position in the defined coordinate reference system
 */
Crs.prototype.getWorldFrom3D = function (position3d, dest) {
};

/**
 * Returns the 3D position from the defined CRS.
 * @param {float[]} posWorld - the position in the defined CRS
 * @param {float[]} dest - the 3D position
 * @return {float[]} the 3D position
 */
Crs.prototype.get3DFromWorld = function (posWorld, dest) {
};

/**
 * Converts the 3D position from geo position in the current CRS to another CRS.
 * @param {float[]} posWorld - geo position in the current coordinate reference system
 * @param {CRS} posCrsID - ID of the target CRS
 * @param {float[]} dest - the 3D position
 * @return {float[]} the 3D position
 */
Crs.prototype.get3DFromWorldInCrs = function (posWorld, posCrsID, dest) {
};

/**
 * Returns the position in degree to sexagesimal format.
 * @param {float[]} degPos - the geo position in decimal degree
 * @param {string[]} dest - the angle in sexagesimal format
 * @return {string[]} the angle in sexagesimal format
 */
Crs.prototype.getSexagesimalFromDeg = function (degPos, dest) {
};

/**
 * Returns the geo position in decimal degree from sexagesimal format.
 * @param {string[]} sexagesimalPos - sexagesimal geo position
 * @param {float[]} dest - the geo position in decimal degree
 * @return {float[]} the geo position in decimal degree
 */
Crs.prototype.getDecimalDegFromSexagesimal = function (sexagesimalPos, dest) {
};

/**
 * Converts a position from a CRS to another CRS.
 * @param {float[]} geo - geo position
 * @param {CRS} from - the source CRS
 * @param {CRS} to - the target CRS
 * @return {float[]} the position in the target CRS
 */
Crs.prototype.convert = function (geo, from, to) {
};

/**
 * Converts an angle to HMS.
 * @param degree - an angle in decimal degree
 * @return {string} HMS
 */
Crs.prototype.fromDegreesToHMS = function (degree) {
};

/**
 * Converts an angle to DMS
 * @param degree - an angle in decimal degree
 * @return {string} DMS
 */
Crs.prototype.fromDegreesToDMS = function (degree) {
};

/**
 * Setups the position before the transformation.
 * posWorld is changed.
 * @param {float[]} posWorld
 * @protected
 */
Crs.prototype._setupPosBeforeTrans = function (posWorld) {
};

/**
 * Setups the position after the transformation.
 * posWorld is changed.
 * @param {float[]} posWorld
 * @protected
 */
Crs.prototype._setupPosAfterTrans = function (posWorld) {
};

/**
 * Returns the geo bound of the given coordinate reference system
 * @return {GeoBound} the geo bound
 */
Crs.prototype.getGeoBound = function () {
};

/**
 * Returns the CRS name
 * @return {CRS} the CRS name
 */
Crs.prototype.getName = function () {
};

/**
 * Returns the CRS description
 * @return {string} the CRS description
 */
Crs.prototype.getDescription = function () {
};

/**
 * Returns True when the CRS is bases on a projection otherwise False
 * @return {boolean} the CRS name
 */
Crs.prototype.isProjected = function () {
};

/**
 * Returns the longitude label.
 * @return {string} the longitude label
 */
Crs.prototype.getLongitudeLabel = function () {
};

/**
 * Returns the latitude label.
 * @return {string} the latitude label
 */
Crs.prototype.getLatitudeLabel = function () {
};