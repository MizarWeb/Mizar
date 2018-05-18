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
/*global define: false */

/**
 * Time travel module : time control 
 */
define(["jquery", "moment", "../Utils/Constants"], function ($, Moment, Constants) {

    /**
     * @name TimeTravelParams
     * @class
     * Management of time travel
     */
    var TimeTravelParams = function () {
        this.startDate = new Date();
        this.endDate = new Date();

        this.currentDate = new Date();

        this.stepKind = Constants.TIME_STEP.DAY;
        this.stepValue = 1;

        this.ctx = null;

        this.enumeratedValues = null;

        // TODO: internationalized
        Moment.locale('fr');
    };

    /**************************************************************************************************************/

    /**
     * Set the context
     * @function setContext
     * @param ctx Context context
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setContext = function (ctx) {
        this.ctx = ctx;
        this.apply();
    };

    /**************************************************************************************************************/

    /**
     * Set the start date
     * @function setStartDate
     * @param date Date start date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setStartDate = function (date) {
        this.startDate = Moment(date);
    };

    /**************************************************************************************************************/
    
    /**
     * Set the end date
     * @function setEndDate
     * @param date Date end date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setEndDate = function (date) {
        this.endDate = Moment(date);
    };

    /**************************************************************************************************************/

    /**
     * Set the current date
     * @function setCurrentDate
     * @param date Date current date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setCurrentDate = function (date) {
        this.currentDate = Moment(date);
    };

    /**************************************************************************************************************/

    /**
     * Get the start date
     * @function getStartDate
     * @return Date start date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getStartDate = function () {
        return this.startDate;
    };

    /**************************************************************************************************************/

    /**
     * Get the end date
     * @function getEndDate
     * @return Date end date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getEndDate = function () {
        return this.endDate;
    };

    /**************************************************************************************************************/

    /**
     * Get the current date
     * @function getCurrentDate
     * @return Date current date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getCurrentDate = function () {
        return this.currentDate;
    };

    /**************************************************************************************************************/

    /**
     * Get the current index
     * @function getCurrentIndex
     * @return Integer Current index
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getCurrentIndex = function () {
        return this.currentIndex;
    };

    /**************************************************************************************************************/

    /**
     * Get the current period
     * @function getCurrentPeriod
     * @return {Json} period { "from", "to" }
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getCurrentPeriod = function() {
        var fromDate = null;
        var toDate = null;
       

        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            return this.enumeratedValues[this.currentIndex].period;
        }
        
        fromDate = this.currentDate;
        toDate = Moment(this.currentDate).add(this.stepValue,this.stepKind).subtract(1,Constants.TIME_STEP.MILLISECOND);

        var result = {
            "from" : fromDate, 
            "to" : toDate
        };
        return result;
    };

    /**************************************************************************************************************/

    /**
     * Set step
     * @function setStep
     * @param String kind Constant for time step kind
     * @param Integer value Number a step to do
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setStep = function (kind,value) {
        this.stepKind = kind;
        this.stepValue = value;
    };

    /**************************************************************************************************************/

    /**
     * Parse date
     * @function parseDate
     * @param String value Date to parse
     * @return {Json} date { "date", "display", "period" { "from", "to" } }
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.parseDate = function (value) {
        value = value.trim();
        var date = null;
        var period = null;

        var regExpYear = /^\d{4}$/;
        var regExpMonth = /^\d{4}\-\d{2}$/;
        var regExpDay = /^\d{4}\-\d{2}\-\d{2}$/;
        if (typeof value === "string") {
            // Year management
            if (regExpYear.test(value)) {
                date = Moment(value,"YYYY");
                period = {};
                period.from = date;
                period.to = Moment(period.from).add(1,Constants.TIME_STEP.YEAR).subtract(1,Constants.TIME_STEP.MILLISECOND);
            }
            // Month management
            if (regExpMonth.test(value)) {
                date = Moment(value,"YYYY-MM");
                period = {};
                period.from = date;
                period.to = Moment(period.from).add(1,Constants.TIME_STEP.MONTH).subtract(1,Constants.TIME_STEP.MILLISECOND);
            }
            // Day management
            if (regExpDay.test(value)) {
                date = Moment(value,"YYYY-MM-DD");
                period = {};
                period.from = date;
                period.to = Moment(period.from).add(1,Constants.TIME_STEP.DAY).subtract(1,Constants.TIME_STEP.MILLISECOND);
            }
            if (date === null) {
                date = Moment(value);
            }
        } else {
            date = Moment(value);
        }
        return {
                    "date" : date,
                    "display" : value,
                    "period" : period
            };
    };

    /**************************************************************************************************************/

    /**
     * Sort enumerated values by date
     * @function sortTime
     * @param Date a First date
     * @param Date b Second date
     */
    function sortTime(a,b){ 
        return a.date>b.date?1:-1;
    }

    /**************************************************************************************************************/

    /**
     * Add date to enumerated values (check if still present)
     * @function addDateToEnumeratedValues
     * @param Json date Date
     * @param String ID Id
     * @memberOf TimeTravelParams#
     * @private
     */
     TimeTravelParams.prototype.addDateToEnumeratedValues = function (date,ID) {
        if (this.enumeratedValues === null) {
            this.enumeratedValues = [];
        }

        for (var i=0;i<this.enumeratedValues.length;i++) {
            if (this.enumeratedValues[i].display === date.display) {
                // Still found : add only id
                if ( (this.enumeratedValues[i].ids) && (this.enumeratedValues[i].ids.length) ) {
                    this.enumeratedValues[i].ids.push(ID);
                    return;
                }
            }
        }
        // Not found, add all
        date.ids = [];
        date.ids.push(ID);
        this.enumeratedValues.push(date);
    };

    /**************************************************************************************************************/

    /**
     * Remove enumerated values for ID
     * @function removeEnumeratedValuesForID
     * @param String ID Id
     * @memberOf TimeTravelParams#
     * @private
     */
    TimeTravelParams.prototype.removeEnumeratedValuesForID = function (ID) {
        if (ID === null) {
            ID = TimeTravelParams.NO_ID;
        }
        for (var i=this.enumeratedValues.length-1;i>=0;i--) {
            if ( (this.enumeratedValues[i].ids) && (this.enumeratedValues[i].ids.length) ) {
                var index = this.enumeratedValues[i].ids.indexOf(ID);
                if (index !== -1) {
                    this.enumeratedValues[i].ids.splice(index, 1);
                }
                if (this.enumeratedValues[i].ids.length === 0) {
                    this.enumeratedValues.splice(i,1);
                }
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Add enumerated values for ID
     * @function addEnumeratedValuesForID
     * @param Array(String) values Array of enumerated values
     * @param String ID Id
     * @memberOf TimeTravelParams#
     * @private
     */
    TimeTravelParams.prototype.addEnumeratedValuesForID = function (values,ID) {
        if (values === null) {
            // By pass
            return;
        }
        if (ID === null) {
            ID = TimeTravelParams.NO_ID;
        }

        
        // TODO soon : check format, need conversion ?
        for (var i=0;i<values.length;i++) {
            date = this.parseDate(values[i]);
            this.addDateToEnumeratedValues(date,ID);
        }
        
        // sort tab
        this.enumeratedValues.sort(sortTime);

        // when enumerated, erase all others params
        this.startDate   = 0;
        this.endDate     = this.enumeratedValues.length-1;
        this.stepKind    = Constants.TIME_STEP.ENUMERATED;
        this.stepValue   = 1;
        this.currentIndex = 0;
        this.currentDate = this.enumeratedValues[this.currentIndex].date;
    };

    /**************************************************************************************************************/

    /**
     * Add values
     * @function add values
     * @param {Json} parameters Parameters
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.addValues = function (parameters) {
        if (!parameters) {
            return;
        }
        if (parameters.enumeratedValues) {
            this.addEnumeratedValuesForID(parameters.enumeratedValues,parameters.ID);
        }
    };

    /**************************************************************************************************************/

    /**
     * Remove values
     * @function remove values
     * @param {Json} parameters Parameters
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.removeValues = function (parameters) {
        if (!parameters) {
            return;
        }
        if (parameters.ID) {
            this.removeEnumeratedValuesForID(parameters.ID);
        }
    };

    /**************************************************************************************************************/

    /**
     * Update
     * @function update
     * @param {Json} parameters Parameters
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.update = function (parameters) {
        if (!parameters) {
            return;
        }
        if (parameters.add) {
            this.addValues(parameters.add);
        }
        if (parameters.remove) {
            this.removeValues(parameters.remove);
        }
        this.apply();
    };

    /**************************************************************************************************************/

    /**
     * Reset values
     * @function reset
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.reset = function() {
        this.startDate          = null;
        this.endDate            = null;
        this.stepKind           = null;
        this.stepValue          = null;
        this.currentIndex       = null;
        this.currentDate        = null;
        this.enumeratedValues   = null;
    };

    /**************************************************************************************************************/

    /**
     * Add values for ID
     * @function addValuesForID
     * @param {JSON} values Values 
     * @param String ID Id of layer
     * @memberOf TimeTravelParams#
     * @private
     */
    TimeTravelParams.prototype.addValuesForID = function(values,ID) {
        if (ID === null) {
            ID = TimeTravelParams.NO_ID;
        }
        if (values.enumeratedValues) {
            this.addEnumeratedValuesForID(values.enumeratedValues,ID);
            // add enumerated values
        } else {
            this.startDate = Moment(values.start);
            this.endDate = Moment(values.end);
            this.stepKind = values.stepKind;
            this.stepValue = values.stepValue;
            // compile data with previous, manage ID
            // TODO FL

        }
    };

    /**************************************************************************************************************/

    /**
     * Remove values for ID
     * @function resetValues
     * @param String ID Id of layer
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.removeValuesForID = function(ID) {
        if (ID === null) {
            ID = TimeTravelParams.NO_ID;
        }
        if ( (this.enumeratedValues) && (this.enumeratedValues.length>0) ) {
            this.removeEnumeratedValuesForID(ID);
            // add enumerated values
        } else {
            // nothing to do
        }
    };

    /**************************************************************************************************************/

    /**
     * Apply current date to IHM (launch event)
     * @function apply
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.apply = function () {
        var details = {
            date:this.currentDate,
            display:this.getCurrentDisplayDate(),
            period : this.getCurrentPeriod()
        };
        this.ctx.publish(Constants.EVENT_MSG.GLOBAL_TIME_CHANGED,details);
    };

    /**************************************************************************************************************/

    /**
     * Rewind to previous time step
     * @function rewind
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.rewind = function () {
        // Special : enumerated values
        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            if (this.currentIndex>0) {
                this.currentIndex--;
                this.currentDate = this.enumeratedValues[this.currentIndex];
                this.apply();
                return;
            }
        }
         
        oldCurrentDate = this.currentDate;

        this.currentDate = Moment(this.currentDate).subtract(this.stepValue,this.stepKind);

        if (this.currentDate < this.startDate) {
            this.currentDate = oldCurrentDate;
        } else {
            this.apply();
        }
    };

    /**************************************************************************************************************/

    /**
     * Forward to next time step
     * @function forward
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.forward = function () {
        // Special : enumerated values
        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            if (this.currentIndex<(this.enumeratedValues.length-1)) {
                this.currentIndex++;
                this.currentDate = this.enumeratedValues[this.currentIndex];
                this.apply();
                return;
            }
        }



        oldCurrentDate = this.currentDate;

        this.currentDate = Moment(this.currentDate).add(this.stepValue,this.stepKind);

        if (this.currentDate > this.endDate) {
            this.currentDate = oldCurrentDate;
        } else {
            this.apply();
        }
    };

    /**************************************************************************************************************/

    /**
     * Get date formated (when there is no enumerated values)
     * @function getDateFormated
     * @param Date date Date
     * @return String Date formated
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getDateFormated = function (date) {
            // Check with STEP kind value
            var formatPattern = "LLLL";
            if (this.stepKind === Constants.TIME_STEP.YEAR) {
                formatPattern = "Y";
            } else if ( (this.stepKind === Constants.TIME_STEP.QUARTER) || (this.stepKind === Constants.TIME_STEP.MONTH) ) {
                formatPattern = "MMM Y";
            } else if ( (this.stepKind === Constants.TIME_STEP.WEEK) || (this.stepKind === Constants.TIME_STEP.DAY) ) {
                formatPattern = "Do MMM Y";
            } else if ( (this.stepKind === Constants.TIME_STEP.HOUR) || (this.stepKind === Constants.TIME_STEP.MINUTE) ) {
                formatPattern = "Do MMM Y HH:mm";
            } else if ( this.stepKind === Constants.TIME_STEP.SECOND) {
                formatPattern = "Do MMM Y   HH:mm:ss";
            } else {
                formatPattern = "Do MMM Y   HH:mm:ss.SSS";
            }    
            return Moment(this.currentDate).format(formatPattern);
    };

    /**************************************************************************************************************/

    /**
     * Return date to display on IHM
     * @function getCurrentDisplayDate
     * @return String Date formated
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getCurrentDisplayDate = function() {
        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            return this.enumeratedValues[this.currentIndex].display;
        } else {
            return this.getDateFormated(this.currentDate);
        }
    };

    /**
     * Is current date the first ?
     * @function isCurrentDateTheFirst
     * @return boolean If the current date is the first of range
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.isCurrentDateTheFirst = function() {
        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            return (this.currentIndex === 0);
        } else {
            return this.currentDate === this.startDate;
        }
        return false;
    };

    /**
     * Is current date the last ?
     * @function isCurrentDateTheLast
     * @return boolean If the current date is the last of range
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.isCurrentDateTheLast = function() {
        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            return (this.currentIndex === (this.enumeratedValues.length-1));
        } else {
            nextDate = Moment(this.currentDate).add(this.stepValue,this.stepKind);
            return (nextDate > this.endDate);
        }
    };

    TimeTravelParams.NO_ID = "NO_ID";

    return TimeTravelParams;
});



