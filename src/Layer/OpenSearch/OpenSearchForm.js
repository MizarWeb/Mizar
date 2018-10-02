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
define(["jquery","./OpenSearchParam", "./OpenSearchUtils"], function(
    $,
    OpenSearchParam,
    OpenSearchUtils
) {
    /**
     * @name OpenSearchForm
     * @class
     * All informations describing an OpenSearch form
     * @param {Object} paramsJson a json object describing the form
     * @param {string} type form to load (application/json or application/atom+xml)
     * @memberof module:Layer
     */
    var OpenSearchForm = function(paramsJson, type) {
        // init all values
        this.type = null; // type of form (only application/json supported)
        this.template = null; // url template with params
        this.parameters = []; // list of params

        this.ignoredParameters = [];
        this.ignoredParameters.push("searchTerms");
        this.ignoredParameters.push("count");
        this.ignoredParameters.push("startIndex");
        this.ignoredParameters.push("startPage");
        this.ignoredParameters.push("language");
        this.ignoredParameters.push("inputEncoding");
        this.ignoredParameters.push("outputEncoding");

        var elts = _parseJson.call(this, paramsJson, type, this.ignoredParameters);
        if (elts !== null) {
            this.type = elts.type;
            this.template = elts.template;
            this.parameters = elts.parameters;
        } 
    };

    /**
     * Parse the json
     * @param {Object} paramsJson Parameteres
     * @param {string} type Type
     * @param {Array} ignoredParameters parameters to ignore    
     * @return {{type:string, template:Object, parameters:OpenSearchParam[]}|null} 
     * @private
     */
    function _parseJson(paramsJson, type, ignoredParameters) {
        var elts;
        if (Array.isArray(paramsJson)) {
            // Management of an array
            for (var i = 0; i < paramsJson.length; i++) {
                elts = _parseUrl.call(this, paramsJson[i], type, ignoredParameters);
                if(elts !== null) {
                    break;
                } else {
                    elts = null;
                }
            }
        } else {
            elts = _parseUrl.call(this, paramsJson, type, ignoredParameters);
        }
        return elts;
    }    

    /**
     * Parse url for request
     * @param {Objet} urlJson Json urls founded
     * @param {type} type Url type searched
     * @param {Array} ignoredParameters parameters to ignore
     * @return {{type:string, template:Object, parameters:OpenSearchParam[]}|null} 
     * @private     
     */
    function _parseUrl(urlJson, type, ignoredParameters) {
        var elts;
        var typeValue = OpenSearchUtils.getAttributeValue(urlJson, "type");
        if (typeValue !== type) {
            // Not the good type, do not take it into account
            elts = null;
        } else {
            elts = {
                type : typeValue,
                template : OpenSearchUtils.getAttributeValue(urlJson, "template"),
                parameters : _parseParameters.call(this, urlJson.Parameter, ignoredParameters)
            };
        }
        return elts;
    }

    /**
     * Parses parameters
     * @param {Objer[]} listParameters list of Opensearch parameters
     * @param {String[]} ignoredParameters parameters to not parse
     * @return {OpenSearchParam[]} List of OpenSearch parameters 
     * @private
     */
    function _parseParameters(listParameters, ignoredParameters) {
        var parameters = [];
        if (Array.isArray(listParameters)) {
            for (var i = 0; i < listParameters.length; i++) {
                var param = new OpenSearchParam(listParameters[i]);
                param.isDisplayed = true;
                for (var j = 0; j < ignoredParameters.length; j++) {
                    if (param.value === "{" + ignoredParameters[j] + "}") {
                        param.isDisplayed = false;
                    }
                }
                if (param.value.startsWith("{geo:")) {
                    param.isDisplayed = false;
                }
                parameters.push(param);
            }
        } else {
            parameters.push(new OpenSearchParam(listParameters));
        }
        return parameters;
    }


    /**
     * Get a string representation of the form
     * @function toString
     * @memberof OpenSearchForm#
     * @return {string} String representation of the form
     */
    OpenSearchForm.prototype.toString = function() {
        var res = "";
        res += "  type : " + this.type + "\n";
        res += "  template : " + this.template + "\n";
        res += "  parameters :\n";
        for (var i = 0; i < this.parameters.length; i++) {
            res += this.parameters[i].toString() + "\n";
        }
        return res;
    };

    /**
     * Update form parameters from GUI form
     * @function updateFromGUI
     * @memberof OpenSearchForm#
     */
    OpenSearchForm.prototype.updateFromGUI = function() {
        for (var i = 0; i < this.parameters.length; i++) {
            var param = this.parameters[i];
            var val = $("#p_" + param.name).val();
            if (val !== "") {
                param.currentValue = val;
            } else {
                param.currentValue = null;
            }
        }
    };

    /*************************************************************************************************************/

    return OpenSearchForm;
});
