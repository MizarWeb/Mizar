/*******************************************************************************
 * Copyright 2017 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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

define(['../Utils/Utils', './AbstractVectorLayer', '../Utils/Constants'],
    function (Utils, AbstractVectorLayer, Constants) {
        /**
         * Vector layer configuration
         * @typedef {AbstractLayer.configuration} AbstractLayer.vector_configuration
         * @property {string} url - the url of json data to load when attaching to globe
         * @property {int} [minLevel = 0] - minimum rendering level depending on tile level
         * @property {int} [maxLevel = 15] - maximum rendering level depending on tile level
         * @property {function} [callback] - the callback function called when data are loaded. Data loaded are passed in parameter of the function.
         */
        /**
         * @name VectorLayer
         * @class
         *    Create a layer to display vector data in GeoJSON format.
         * @augments AbstractVectorLayer
         * @param {AbstractLayer.vector_configuration} options - Vector configuration
         * @constructor
         * @memberOf module:Layer
         */
        var VectorLayer = function (options) {
            AbstractVectorLayer.prototype.constructor.call(this, Constants.LAYER.Vector, options);
        };

        /**************************************************************************************************************/

        Utils.inherits(AbstractVectorLayer, VectorLayer);

        /**************************************************************************************************************/

        return VectorLayer;

    });
