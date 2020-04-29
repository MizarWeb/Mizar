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

/*global define: false */

import Constants from "../Utils/Constants";
import ErrorDialog from "../Gui/dialog/ErrorDialog";
import Proxy from "../Utils/Proxy";
// import "fitsjs";
import astro from "../external/fitsjs/fits";

/**
 *    Parse fits file
 *
 *    @param response XHR response containing fits
 *
 *    @return Parsed data
 */
function parseFits(response) {
  var FITS = astro.FITS;
  // Initialize the FITS.File object using
  // the array buffer returned from the XHR
  var fits = new FITS.File(response);
  // Grab the first HDU with a data unit
  var hdu = fits.getHDU();
  var data = hdu.data;

  var swapPixels = new Uint8Array(data.view.buffer, data.begin, data.length); // with gl.UNSIGNED_byte

  var bpe;
  if (data.arrayType) {
    bpe = data.arrayType.BYTES_PER_ELEMENT;
  } else {
    bpe = Math.abs(hdu.header.BITPIX) / 8;
  }
  for (var i = 0; i < swapPixels.length; i += bpe) {
    var temp;
    // Swap to little-endian
    for (var j = 0; j < bpe / 2; j++) {
      temp = swapPixels[i + j];
      swapPixels[i + j] = swapPixels[i + bpe - 1 - j];
      swapPixels[i + bpe - 1 - j] = temp;
    }
  }

  return fits;
}

var loadFits = function (url, successCallback, failCallback, onprogressCallback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        if (xhr.response) {
          var fits = parseFits(xhr.response);
          if (successCallback) {
            successCallback(fits);
          }
        }
      } else {
        ErrorDialog.open(Constants.LEVEL.ERROR, "Error while loading " + url);
        if (failCallback) {
          failCallback();
        }
      }
    }
  };

  // Define default on progress function, otherwise
  // Firefox won't take Content-length header into account
  // so evt.lengthComputable will be always set to false..
  xhr.onprogress = function (evt) {};
  xhr.open("GET", Proxy.proxify(url));
  xhr.responseType = "arraybuffer";
  xhr.send();
  return xhr;
};

export default {
  loadFits: loadFits,
  parseFits: parseFits
};
