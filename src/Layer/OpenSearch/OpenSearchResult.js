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
 * @name OpenSearchResult
 * @class
 * This layer stock the metadata information of an openSearch result
 * @memberof module:Layer
 */
var OpenSearchResult = function () {
  this.nbFound = 0;
  this.startIndex = 0;
  this.nbReturned = 0;
  // For ihm display on layer manager view
  this.featuresLoaded = 0;
  this.featuresTotal = 0;

  document.myOpenSearchResult = this;
};

/*************************************************************************************************************/

/**
 * Parse response
 * @function parseResponse
 * @memberof OpenSearchResult#
 * @param {Object} response Response returned by distant server
 * @return {Int} Nb features founds (total)
 */
OpenSearchResult.prototype.parseResponse = function (response) {
  this.nbFound = response.properties.totalResults;
  this.nbReturned = response.features.length;
  this.startIndex = response.properties.startIndex;
  this.nbItemsPerPage = response.properties.itemsPerPage;

  this.featuresLoaded += this.nbReturned;
  this.featuresTotal += this.nbFound;

  // Number of pages
  this.nbPages = Math.ceil(this.nbFound / this.nbItemsPerPage);
  // Current page
  this.currentPage = Math.floor((this.startIndex - 1) / this.nbItemsPerPage) + 1;

  return this.nbFound;
};

/*************************************************************************************************************/

export default OpenSearchResult;
