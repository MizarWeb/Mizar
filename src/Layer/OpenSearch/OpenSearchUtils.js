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
define(["jquery"],function($) {
    var OpenSearchUtils = {};

    /*************************************************************************************************************/

    /**
     * Get the attribute value
     * @function getAttributeValue
     * @memberof OpenSearchUtils#
     * @param {Object} object Object describing the parameter
     * @param {string} name Name of the parameter
     * @return {string} Value
     */
    OpenSearchUtils.getAttributeValue = function(object, name) {
        var reconstructedName = "_attr" + name;
        if (typeof object[reconstructedName] !== "undefined") {
            if (typeof object[reconstructedName]._value != "undefined") {
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
     * @param {string} name Name of the parameter
     * @return {string} Value
     */
    OpenSearchUtils.getValue = function(object, name) {
        if (typeof object[name] !== "undefined") {
            if (typeof object[name]._text !== "undefined") {
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
     * @param {string} name Name of the parameter
     * @param {string} value Value to set
     */
    OpenSearchUtils.setCurrentValueToParam = function(form, name, value) {
        var param; // param managed
        for (var i = 0; i < form.parameters.length; i++) {
            param = form.parameters[i];
            if (param.value === "{"+name+"}") {
                param.currentValue = value;
                $("#p_" + name).val(value);
                break;
            }
        }
    };

    /*************************************************************************************************************/

    /**
     * Get the current value of a parameter
     * @function getCurrentValue
     * @memberof OpenSearchUtils#
     * @param {OpenSearchFrom} form Form
     * @param {string} name Name of the parameter
     * @return {string} Current value
     */
    OpenSearchUtils.getCurrentValue = function(form, name) {
        var param; // param managed
        for (var i = 0; i < form.parameters.length; i++) {
            param = form.parameters[i];
            if (param.value === "{"+name+"}") {
                return param.currentValue;
            }
        }
    };

    /*************************************************************************************************************/

    /**
     * Init navigation values
     * @function initNavigationValues
     * @memberof OpenSearchUtils#
     * @param {OpenSearchFrom} form Form
     */
    OpenSearchUtils.initNavigationValues = function(form) {
        var param; // param managed
        for (var i = 0; i < form.parameters.length; i++) {
            param = form.parameters[i];
            if (param.name === "maxRecords") {
                param.currentValue = Math.ceil(param.maxInclusive * 0.2);
                //param.currentValue = Math.ceil(param.maxInclusive * 1);
                //param.currentValue = 20;
            } else if (param.name === "page") {
                param.currentValue = 1;
            } else {
                //console.log(param.name,param);
            }
        }
    };

    /*************************************************************************************************************/

    return OpenSearchUtils;
});
