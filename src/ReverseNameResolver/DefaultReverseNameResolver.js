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

define(["jquery", "underscore-min", "../Utils/Utils", "./AbstractReverseNameResolver"],
    function ($, _, Utils, AbstractReverseNameResolver) {

        /**************************************************************************************************************/

        /**
         * @name DefaultReverseNameResolver
         * @class
         *   Plugin to access to Default reverse name resolver
         * @augments AbstractReverseNameResolver
         * @param {Context} options - Context
         * @memberOf module:ReverseNameResolver
         */
        var DefaultReverseNameResolver = function (options) {
            AbstractReverseNameResolver.prototype.constructor.call(this, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractReverseNameResolver, DefaultReverseNameResolver);

        /**************************************************************************************************************/

        /**
         * @function handle
         * @memberOf DefaultReverseNameResolver#
         * @param {Object} options
         */
        DefaultReverseNameResolver.prototype.handle = function (options) {
            var self = this;

            var maxOrder = options.maxOrder;
            var equatorialCoordinates = options.equatorialCoordinates;
            var context = options.context;

            var requestUrl = context.getMizarConfiguration().reverseNameResolver.baseUrl + '/EQUATORIAL/' + equatorialCoordinates[0] + " " + equatorialCoordinates[1] + ";" + maxOrder;

            $.ajax({
                type: "GET",
                url: requestUrl,
                success: function (response) {
                    if (options && options.success) {
                        options.success(response);
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    if (options && options.error) {
                        options.error(xhr);
                    }
                }
            });
        };

        /**
         * @function remove
         * @memberOf DefaultReverseNameResolver#
         */
        DefaultReverseNameResolver.prototype.remove = function (options) {
        };

        /**************************************************************************************************************/

        return DefaultReverseNameResolver;

    });
