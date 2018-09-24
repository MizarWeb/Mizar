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

define(["../Utils/Constants","../Gui/dialog/ErrorDialog"],function(Constants, ErrorDialog) {
    /**
     @name Tuning
     @class
         Get some statistics
     @constructor
    */
    var Tuning = function() {
        var self = this;
    };

    /**************************************************************************************************************/

    /**
     Start measuring time
     */
    Tuning.prototype.start = function(name, index) {
        var completeName = name;
        if (typeof index !== "undefined") {
            completeName += index;
        }

        this[completeName] = Date.now();
    };

    /**************************************************************************************************************/

    /**
     End measuring time
     */
    Tuning.prototype.end = function(name, index) {
        var completeName = name;
        var isIndex = typeof index !== "undefined";
        if (isIndex) {
            completeName += index;
        }

        var time = Date.now() - this[completeName];
        this[completeName] = time;

        if (isIndex) {
            if (typeof this["sum" + name] === "undefined") {
                this["sum" + name] = 0;
                this["nb" + name] = 0;
            }
            this["sum" + name] += time;
            this["nb" + name]++;
        }

        return time;
    };

    /**************************************************************************************************************/

    /**
     Print stats in an HTML element
     */
    Tuning.prototype.print = function(name, index) {
        var completeName = name;
        var isIndex = typeof index !== "undefined";
        if (isIndex) {
            completeName = name += index;
        }
        ErrorDialog.open(Constants.LEVEL.DEBUG, "Elapsed [" + completeName + "] = " + this[completeName]);

        if (!isIndex) {
            if (typeof this["sum" + name] !== "undefined") {
                var avg = this["sum" + name] / this["nb" + name];
                ErrorDialog.open(Constants.LEVEL.DEBUG,
                    "Average [" +
                        name +
                        "] = " +
                        avg +
                        " (" +
                        this["nb" + name] +
                        " / " +
                        this["sum" + name] +
                        ")"
                );
            }
        }
    };

    /**************************************************************************************************************/

    return Tuning;
});
