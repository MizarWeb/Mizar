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

define(function() {
    /**************************************************************************************************************/

    /**
     * @name AbstractProvider
     * @class
     *  Abstract Provider constructor
     * @param {object} options
     * @implements {Provider}
     */
    var AbstractProvider = function(options) {
        this.options = options;
    };

    /**
     * @function loadFiles
     * @memberof Provider#
     * @abstract
     */
    AbstractProvider.prototype.loadFiles = function(layer, configuration) {};

    /**
     * @function handleFeatures
     * @memberof Provider#
     */
    AbstractProvider.prototype.handleFeatures = function(layer) {};

    /**************************************************************************************************************/

    return AbstractProvider;
});
