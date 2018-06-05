define(["jquery", "moment", "../Utils/Constants", "../Utils/Utils"], function ($, Moment, Constants, Utils) {

    /**
     * Stock time sample
     * @constructor
     */
    var TimeSample = function () {
        this.start = null;
        this.end = null;
        this.stepValue = null;
        this.stepKind = null;
        this.layerID = null;
    };

    /**************************************************************************************************************/

    /**
     * Get the start date
     * @function getStart
     * @return Date start date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getStart = function () {
        return this.start;
    };

    /**************************************************************************************************************/

    /**
     * Set the start date of sample
     * @function setStart
     * @param date Date start date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.setStart = function (date) {
        this.start = Moment.utc(date);
    };

    /**************************************************************************************************************/

    /**
     * Get the end date
     * @function getEnd
     * @return Date end date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getEnd = function () {
        return this.end;
    };

    /**************************************************************************************************************/
    
    /**
     * Set the end date
     * @function setEnd
     * @param date Date end date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.setEnd = function (date) {
        this.end = Moment.utc(date);
    };

    /**************************************************************************************************************/

    /**
     * Get the step value
     * @function getStepValue
     * @return Integer step value
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getStepValue = function () {
        return this.stepValue;
    };

    /**************************************************************************************************************/
    
    /**
     * Set the step value
     * @function setStepValue
     * @param Integer stepValue step value
     * @memberOf TimeSample#
     */
    TimeSample.prototype.setStepValue = function (stepValue) {
        this.stepValue = stepValue;
    }; 

    /**************************************************************************************************************/

    /**
     * Get the step kind
     * @function getStepKind
     * @return String step kind
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getStepKind = function () {
        return this.stepKind;
    };

    /**************************************************************************************************************/
    
    /**
     * Set the step kind
     * @function setStepKind
     * @param String stepKind step kind
     * @memberOf TimeSample#
     */
    TimeSample.prototype.setStepKind = function (stepKind) {
        this.stepKind = stepKind;
    }; 

    /**************************************************************************************************************/

    /**
     * Get next date 
     * @function getNextDate
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getNextDate = function (date) {
        var nextDate = null;
        nextDate = Moment.utc(date).add(this.stepValue,this.stepKind);
        if (nextDate>this.end) {
            nextDate = null;
        }
        return nextDate;
    };

    /**************************************************************************************************************/

    /**
     * Get previous date 
     * @function getPreviousDate
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getPreviousDate = function (date) {
        var previousDate = null;
        previousDate = Moment.utc(date).substract(this.stepValue,this.stepKind);
        if (previousDate<this.start) {
            previousDate = null;
        }
        return previousDate;
    };

    /**************************************************************************************************************/
    
    /**
     * Get first date AFTER a specified date
     * @function getFirstDateAfter
     * @param Date date date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getFirstDateAfter = function (date) {
        var foundDate = null;
        if (date<this.start) {
            // trivial case, first date is after !
            foundDate = this.start;
        } else if (date>this.end) {
            // trivial case, date is after the last date
            foundDate = null;
        } else {
            // go to search
            var currentDate = this.start;
            var isDone = false;
            var nextDate = null;
            while (!isDone) {
                currentDate = this.getNextDate(currentDate);
                if (currentDate === null) {
                    // Null found, no more date, stop it whith found date set to null
                    isDone = true;
                    foundDate = null;
                }
                if (currentDate>date) {
                    isDone = true;
                    foundDate = currentDate;
                }
            }
        }

        return foundDate;
    }; 

    /**************************************************************************************************************/
    
    /**
     * Get first date BEFORE a specified date
     * @function getFirstDateBefore
     * @param Date date date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getFirstBeforeAfter = function (date) {
        var foundDate = null;
        if (date>this.end) {
            // trivial case, end date is before !
            foundDate = this.end;
        } else if (date<this.start) {
            // trivial case, date is before the first date
            foundDate = null;
        } else {
            // go to search
            var currentDate = this.start;
            var isDone = false;
            var nextDate = null;
            while (!isDone) {
                currentDate = this.getNextDate(currentDate);
                if (currentDate === null) {
                    // Null found, no more date, stop it whith found date set to null
                    isDone = true;
                    foundDate = null;
                }
                if (currentDate>date) {
                    isDone = true;
                    foundDate = currentDate;
                }
            }
        }

        return foundDate;
    }; 

    return TimeSample;
});