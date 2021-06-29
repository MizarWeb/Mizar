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
// import "../external/wcsjs/wcs";

import wcs from "../../external/wcsjs/wcs";
var UtilsFits = {};

function createCoordinate(x, y) {
  var coordinate = wcs.pixelToCoordinate([x, y]);
  return [coordinate.ra, coordinate.dec];
}

/**
 *    Get GeoJson polygon coordinates representing fits using wcs data from header
 */
UtilsFits.getPolygonCoordinatesFromFits = function (fits) {
  var hdu = fits.getHDU();
  var fitsData = hdu.data;

  // Create mapper
  //   var wcs = new WCS.Mapper(hdu.header);
  var coords = [];

  // Find coordinates of coming fits
  coords.push(createCoordinate(0, fitsData.height));
  coords.push(createCoordinate(fitsData.width, fitsData.height));
  coords.push(createCoordinate(fitsData.width, 0));
  coords.push(createCoordinate(0, 0));
  // Close the polygon
  coords.push(coords[0]);
  return coords;
};

export default UtilsFits;
