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
define(["jquery", "moment", "./TimeSample","./TimeEnumerated","../Utils/Constants"], function ($, Moment, TimeSample, TimeEnumerated, Constants) {

    /**
     * @name TimeTravelParams
     * @class
     * Management of time travel
     */
    var TimeTravelParams = function () {
        this.currentDate = new Date();
        
        this.currentPeriod = {
            "from" : null,
            "to" : null
        };

        this.currentDisplayDate = "<=>";

        this.ctx = null;
        // List of samples
        this.samples = [];
        // Enumerated values
        this.enumeratedValues = new TimeEnumerated();

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
     * Set the current date
     * @function setCurrentDate
     * @param date Date current date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setCurrentDate = function (date) {
        this.currentDate = Moment.utc(date);
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
     * Get the current period
     * @function getCurrentPeriod
     * @return {Json} period { "from", "to" }
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getCurrentPeriod = function() {
        return this.currentPeriod;
    };

    /**************************************************************************************************************/

    /**
     * Add a sample
     * @function addSample
     * @param {Date} start Start date
     * @param {Date} end End date
     * @param {String} stepKind Step kind
     * @param {Integer} stepValue Step value
     * @param {String} ID Layer ID
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.addSample = function (start,end,stepKind,stepValue,ID) {
        var sample = new TimeSample();
        sample.setStart(start);
        sample.setEnd(end);
        sample.setStepKind(stepKind);
        sample.setStepValue(stepValue);
        sample.setID(ID);
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
        var saveCurrentValue = this.currentDate;

        if (parameters.enumeratedValues) {
            // Add to enumerated
            this.enumeratedValues.addEnumeratedValuesForID(parameters.enumeratedValues,parameters.ID);
        } else if (parameters.start && parameters.end && parameters.stepKind && parameters.stepValue && parameters.ID) {
            // Add a new sample
            this.addSample(parameters.start,parameters.end,parameters.stepKind,parameters.stepValue,parameters.ID);
        } else {
            console.log("Can't understand add values for time travel with parameters",parameters);
        }

        this.setToNearestValue(saveCurrentValue);
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
        var saveCurrentValue = this.currentDate;

        if (parameters.ID) {
            // Remove values into enumerated values
            this.removeEnumeratedValuesForID(parameters.ID);

            // Remove samples with ID
            var newSamples = [];
            for (var i=0;i<this.samples.length;i++) {
                if (this.samples[i].getLayerID() !== paramters.ID) {
                    newSamples.push(samples[i]);
                }
            }
            this.samples = newsamples;
        }
        this.setToNearestValue(saveCurrentValue);
    };

    /**************************************************************************************************************/

    /**
     * Set to nearest value (call only for enumerated)
     * @function setToNearestValue
     * @param {Date} date date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setToNearestValue = function (date) {
        var minDeltaIndex = null;
        var minDelta = null;        
        var delta = null;

        for (var i=0;i<this.enumeratedValues.length;i++) {
            delta = Math.abs(date-this.enumeratedValues[i].date);
            if ( (minDelta === null) || (delta<minDelta) ) {
                // found value more near
                minDeltaIndex = i;
                minDelta = delta;
            }
        }
        if (minDeltaIndex !== null)  {
            // go to this value
            this.currentIndex = minDeltaIndex;
            this.currentDate = this.enumeratedValues[this.currentIndex].date;
        } else {
            this.currentDate = new Date();
            this.currentIndex = null;
        }
        this.apply();
    };

    /**************************************************************************************************************/

    /**
     * Update
     * @function update
     * @param {Json} parameters Parameters
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.update = function (parameters) {
        console.log("update",parameters);
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

        console.log("toString ! "+this.toString());
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
                this.currentDate = this.enumeratedValues[this.currentIndex].date;
                this.apply();
                return;
            }
        }
         
        var oldCurrentDate = this.currentDate;

        this.currentDate = Moment.utc(this.currentDate).subtract(this.stepValue,this.stepKind);

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
                this.currentDate = this.enumeratedValues[this.currentIndex].date;
                this.apply();
                return;
            }
        }



        var oldCurrentDate = this.currentDate;

        this.currentDate = Moment.utc(this.currentDate).add(this.stepValue,this.stepKind);

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
     * @param {Date} date Date
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
            } else if ( (this.stepKind === Constants.TIME_STEP.WEEK) || (this.stepKind === Constants.TIME_STEP.DAY) || (this.stepKind === Constants.TIME_STEP.ENUMERATED)) {
                formatPattern = "Do MMM Y";
            } else if ( (this.stepKind === Constants.TIME_STEP.HOUR) || (this.stepKind === Constants.TIME_STEP.MINUTE) ) {
                formatPattern = "Do MMM Y HH:mm";
            } else if ( this.stepKind === Constants.TIME_STEP.SECOND) {
                formatPattern = "Do MMM Y   HH:mm:ss";
            } else {
                formatPattern = "Do MMM Y   HH:mm:ss.SSS";
            }    
            return Moment.utc(this.currentDate).format(formatPattern);
    };

    /**************************************************************************************************************/

    /**
     * Return date to display on IHM
     * @function getCurrentDisplayDate
     * @return String Date formated
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getCurrentDisplayDate = function() {
        return this.currentDisplayDate;
        /*
        var result = null;
        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            if (this.enumeratedValues.length>0) {
                result = this.enumeratedValues[this.currentIndex].display;
            } else {
                result = this.getDateFormated(new Date());
            }
        } else {
            result = this.getDateFormated(this.currentDate);
        }
        return result;
        */
    };

    /**
     * Is current date the first ?
     * @function isCurrentDateTheFirst
     * @return boolean If the current date is the first of range
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.isCurrentDateTheFirst = function() {
        return false;
        /*if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            return (this.currentIndex === 0);
        } else {
            return this.currentDate === this.startDate;
        }*/
    };

    /**
     * Is current date the last ?
     * @function isCurrentDateTheLast
     * @return boolean If the current date is the last of range
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.isCurrentDateTheLast = function() {
        return false;
        /*
        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            return (this.currentIndex === (this.enumeratedValues.length-1));
        } else {
            var nextDate = Moment.utc(this.currentDate).add(this.stepValue,this.stepKind);
            return (nextDate > this.endDate);
        }
        */
    };

    /**
     * Get string representation
     * @function toString
     * @return {String} String representation
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.toString = function() {
        var res = "";
        
        if (this.samples) {
            for (var i=0;i<this.samples.length;i++) {
                res += "Sample : "+this.samples[i].toString()+"\n";
            }
        }

        if (this.enumeratedValues) {
            res += "Enumerated : "+this.enumeratedValues.toString()+"\n";
        }

        return res;
    };
    

    return TimeTravelParams;
});



