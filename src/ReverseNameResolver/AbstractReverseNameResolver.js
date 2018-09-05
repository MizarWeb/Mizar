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

define([],
    function () {

        /**************************************************************************************************************/

        /**
         *   Abstract Wrapper constructor
         *   @param {Context} options - context
         *   @constructor
         *   @implements {ReverseNameResolver}
         */
        var AbstractReverseNameResolver = function (options) {
            this.ctx = options;
        };

        /**************************************************************************************************************/

        /**
         * @function handle
         * @memberOf AbstractReverseNameResolver#
         * @abstract
         */
        AbstractReverseNameResolver.prototype.handle = function () {
            throw new SyntaxError("handle from AbstractReverseNameResolver not implemented", "AbstractReverseNameResolver.js");
        };


        /**
         * @function remove
         * @memberOf AbstractReverseNameResolver#
         * @abstract
         */
        AbstractReverseNameResolver.prototype.remove = function () {
            throw new SyntaxError("remove from AbstractReverseNameResolver not implemented", "AbstractReverseNameResolver.js");
        };

        /**************************************************************************************************************/

        ///**
        // *    Extract HealpixId, order from url
        // */
        //AbstractReverseNameResolver.prototype.extractFilters = function (url) {
        //    var filtersUrl = url.substring(url.indexOf('?') + 1, url.length);
        //
        //    var filtersParts = filtersUrl.split('&');
        //
        //    var startOrder, startHealpixID;
        //    var order, healpixID;
        //    _.each(filtersParts, function (part) {
        //
        //        var keyAndValue = part.split('=');
        //
        //        if (keyAndValue[0] === "order") {
        //            order = keyAndValue[1];
        //        }
        //        if (keyAndValue[0] === "healpix") {
        //            healpixID = keyAndValue[1];
        //        }
        //    });
        //
        //    return this.filters = {
        //        "healpixID": healpixID,
        //        "order": order
        //    };
        //};

        return AbstractReverseNameResolver;
    });
