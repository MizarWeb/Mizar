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

    /*************************************************************************************************************/
        
    /**
     * Get the attribute value
     * @function getAttributeValue
     * @memberof OpenSearchUtils#
     * @param {Object} object Object describing the parameter
     * @param {String} name Name of the parameter
     * @return {String} Value
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

    /*************************************************************************************************************/
        
    /**
     * Get the value
     * @function getValue
     * @memberof OpenSearchUtils#
     * @param {Object} object Object describing the parameter
     * @param {String} name Name of the parameter
     * @return {String} Value
     */
    OpenSearchUtils.getValue = function (object,name) {
      if (typeof object[name] !== 'undefined') {
        if (typeof object[name]._text !== 'undefined') {
          return object[name]._text;
        }
      }
      return null;
    };

    /*************************************************************************************************************/
        
    /**
     * Set the current value of a parameter
     * @function setCurrentValueToParam
     * @memberof OpenSearchUtils#
     * @param {OpenSearchFrom} form Form
     * @param {String} name Name of the parameter
     * @param {String} value Value to set
     */
    OpenSearchUtils.setCurrentValueToParam = function (form,name,value) {
      var param;          // param managed
      for (var i=0;i<form.parameters.length;i++) {
          param = form.parameters[i];
          if (param.name === name) {
            param.currentValue = value;
            $("#p_"+name).val(value);
            break;
          }
      }
    }

    /*************************************************************************************************************/
        
    /**
     * Get the current value of a parameter
     * @function getCurrentValue
     * @memberof OpenSearchUtils#
     * @param {OpenSearchFrom} form Form
     * @param {String} name Name of the parameter
     * @return {String} Current value
     */
    OpenSearchUtils.getCurrentValue = function (form,name) {
      var param;          // param managed
      for (var i=0;i<form.parameters.length;i++) {
          param = form.parameters[i];
          if (param.name === name) {
            return param.currentValue;
            break;
          }
      }
    }

    /*************************************************************************************************************/
        
    /**
     * Init navigation values
     * @function initNavigationValues
     * @memberof OpenSearchUtils#
     * @param {OpenSearchFrom} form Form
     */
    OpenSearchUtils.initNavigationValues = function (form) {
      var param;          // param managed
      for (var i=0;i<form.parameters.length;i++) {
          param = form.parameters[i];
          if (param.name === "maxRecords") {
            //param.currentValue = Math.ceil(param.maxInclusive * 0.2);
            param.currentValue = 1;

          } else if (param.name === "page") {
            param.currentValue = 1;
          }
      }
    }

    /*************************************************************************************************************/
        
    return OpenSearchUtils;
});
