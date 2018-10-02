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
define(["./OpenSearchUtils"], function(OpenSearchUtils) {
    /**
     * @name OpenSearchParam
     * @class
     * All informations describing a parameter in an OpenSearch form
     * @param {Object} a json object describing the param
     * @memberof module:Layer
     */
    var OpenSearchParam = function(paramJson) {
        // init all values
        this.name = null; // Name of parameters
        this.value = null; // Value identifying the parameters
        this.title = null; // Title of parameter (for display)
        this.minInclusive = null; // (Level 1 Control - Number) Min value inclusive
        this.maxInclusive = null; // (Level 1 Control - Number) Max value inclusive
        this.pattern = null; // (Level 1 Control - String) Pattern
        this.options = null; // List of values if list provided
        this.currentValue = null; // Value to pass to parameter
        this.defaultValue = null; // Default value
        this.displayValue = ""; // Display value

        this.parseJson(paramJson);
    };

    /**************************************************************************************************************/

    /**
     * Parse Json
     * @function parseJson
     * @memberof OpenSearchParam#
     * @param {Object} paramJson Json object
     */

    OpenSearchParam.prototype.parseJson = function(paramJson) {
        this.name = OpenSearchUtils.getAttributeValue(paramJson, "name");
        this.name = this.name.replace(/\./g, "_");
        this.value = OpenSearchUtils.getAttributeValue(paramJson, "value");
        this.title = OpenSearchUtils.getAttributeValue(paramJson, "title");
        this.minInclusive = OpenSearchUtils.getAttributeValue(
            paramJson,
            "minInclusive"
        );
        this.maxInclusive = OpenSearchUtils.getAttributeValue(
            paramJson,
            "maxInclusive"
        );
        this.pattern = OpenSearchUtils.getAttributeValue(paramJson, "pattern");

        if (this.pattern === null) {
            this.patternAttribute = "";
        } else {
            this.patternAttribute = "pattern=\"" + this.pattern + "\" ";
        }

        if (paramJson.Options !== undefined) {
            this.options = [];
            if (paramJson.Options.length !== undefined) {
                for (var i = 0; i < paramJson.Options.length; i++) {
                    this.options.push(
                        OpenSearchUtils.getAttributeValue(
                            paramJson.Options[i],
                            "value"
                        )
                    );
                }
            } else {
                this.options.push(
                    OpenSearchUtils.getAttributeValue(paramJson.Options, "value")
                );
            }
        }

        if (this.options !== null) {
            this.type = "options";
        } else if (this.minInclusive !== null || this.maxInclusive !== null) {
            this.type = "number";
            if (this.title === null) {
                this.title = "";
            }
            if (this.maxInclusive === null) {
                this.title += "( >= " + this.minInclusive + " )";
            } else if (this.minInclusive === null) {
                this.title += "( <= " + this.maxInclusive + " )";
            } else {
                this.title +=
                    "( between " +
                    this.minInclusive +
                    " and " +
                    this.maxInclusive +
                    " )";
            }
        } else if (this.value.startsWith("{time:") === true) {
            this.type = "datetime";
        } else {
            this.type = "text";
        }

        if (this.title === null) {
            this.titleAttribute = "";
        } else {
            this.titleAttribute = "title=\"" + this.title + "\" ";
        }
    };

    /**************************************************************************************************************/

    /**
     * Return string representation
     * @function toString
     * @memberof OpenSearchParam#
     * @return {string} String representation
     */

    OpenSearchParam.prototype.toString = function() {
        var res = "";

        if (this.name !== null) {
            res += "     name : " + this.name + "\n";
        }

        if (this.value !== null) {
            res += "     value : " + this.value + "\n";
        }

        if (this.title !== null) {
            res += "     title : " + this.title + "\n";
        }

        if (this.minInclusive !== null) {
            res += "     minInclusive : " + this.minInclusive + "\n";
        }

        if (this.maxInclusive !== null) {
            res += "     maxInclusive : " + this.maxInclusive + "\n";
        }

        if (this.pattern !== null) {
            res += "     pattern : " + this.pattern + "\n";
        }

        if (this.options != null) {
            res += "     options : ";
            for (var i = 0; i < this.options.length; i++) {
                res += this.options[i] + ", ";
            }
            res += "\n";
        }
        return res;
    };

    /**************************************************************************************************************/

    /**
     * Get current value transformed (from IHM to Request)
     * @function currentValueTransformed
     * @memberof OpenSearchParam#
     * @return {string} Current value transformed
     */

    OpenSearchParam.prototype.currentValueTransformed = function() {
        // Only for date time, all other : no change
        if (this.type !== "datetime") {
            return this.currentValue;
        }

        if (
            this.currentValue === null ||
            typeof this.currentValue === "undefined"
        ) {
            return this.currentValue;
        }

        var deb = this.currentValue.substr(0, 10);
        var fin = this.currentValue.substr(-5);
        var res = deb + "T" + fin + ":00.00";
        return res;
    };

    /*************************************************************************************************************/

    return OpenSearchParam;
});
