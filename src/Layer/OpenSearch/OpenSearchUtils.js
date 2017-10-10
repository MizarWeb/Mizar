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
define(function () {

    var OpenSearchUtils = {};

    /**
     *    Get attribute values from json
     */
    OpenSearchUtils.getAttributeValue = function (object,name) {
      var reconstructedName = "_attr"+name;
      if (typeof object[reconstructedName] !== 'undefined') {
        if (typeof object[reconstructedName]._value != 'undefined') {
          return object[reconstructedName]._value;
        }
      }
      return null;
    };

    OpenSearchUtils.getValue = function (object,name) {
      if (typeof object[name] !== 'undefined') {
        if (typeof object[name]._text !== 'undefined') {
          return object[name]._text;
        }
      }
      return null;
    };

    return OpenSearchUtils;

});
