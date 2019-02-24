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
    "./Constants",
    "./UtilsFits",
    "./Numeric",
    "./UtilsIntersection",
    "./Utils",
    "../Renderer/FeatureStyle"
], function(Constants, UtilsFits, Numeric, UtilsIntersection, Utils, FeatureStyle) {
    return {
        create: function(type, options) {
            var obj;
            switch (type) {
            case Constants.UTILITY.Fits:
                obj = UtilsFits;
                break;
            case Constants.UTILITY.Intersection:
                obj = UtilsIntersection;
                break;
            case Constants.UTILITY.Numeric:
                obj = Numeric;
                break;
            case Constants.UTILITY.CreateStyle:
                obj = new FeatureStyle(options);
                break;
            case Constants.UTILITY.FeatureStyle:
                obj = FeatureStyle;
                break;
            case Constants.UTILITY.Utils:
                obj = Utils;
                break;
            default:
                throw new RangeError(
                    "Cannot create the utility " + type,
                    "UtilityFactory.js"
                );
            }
            return obj;
        }
    };
});
