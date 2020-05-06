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
let _proxyUse = false;
let _proxyUrl = "";

export default {
  /**
   * Sets the use of the proxy.
   * @function setProxyUse
   * @param {boolean} proxyUse Set to true to use a defined proxy otherwise false.
   * @throws {TypeError} proxyUse must be a boolean
   */
  setProxyUse: function (proxyUse) {
    if (typeof proxyUse !== "boolean") {
      throw new TypeError("Proxy.js: proxyUse must be a boolean");
    }
    _proxyUse = proxyUse;
  },
  /**
   * Sets the proxy URL.
   * The proxy should look like http://localhost:8081/?url=
   * @function setProxyUrl
   * @param {string} proxyUrl proxy URL;
   * @throws {TypeError} proxyUrl must be a string
   */
  setProxyUrl: function (proxyUrl) {
    if (typeof proxyUrl !== "string") {
      throw new TypeError("Proxy.js: proxyUrl must be a string");
    }
    _proxyUrl = proxyUrl;
  },

  /**
   * Proxyfy the url is the proxy is used.
   * @function proxify
   * @param {string} url URL to proxify
   * @returns {string} the proxified URL.
   */
  proxify: function (url) {
    if (typeof url !== "string") {
      return url;
    }
    let proxifiedUrl;
    if (_proxyUse === true) {
      if (url.toLowerCase().startsWith("http") === false) {
        proxifiedUrl = url;
      } else if (url.startsWith(_proxyUrl)) {
        proxifiedUrl = url; // No change, proxy always set
      } else {
        proxifiedUrl = _proxyUrl + encodeURIComponent(url); // Add proxy redirection
      }
    } else {
      proxifiedUrl = url;
    }

    return proxifiedUrl;
  }
};
