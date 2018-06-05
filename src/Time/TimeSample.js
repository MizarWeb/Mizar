define(["jquery", "moment", "../Utils/Constants", "../Utils/Utils"], function ($, Moment, Constants, Utils) {

    /**
     * Store time sample
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
     * @return {Date} Start date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getStart = function () {
        return this.start;
    };

    /**************************************************************************************************************/

    /**
     * Set the start date of sample
     * @function setStart
     * @param {Date} date Start date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.setStart = function (date) {
        this.start = Moment.utc(date);
    };

    /**************************************************************************************************************/

    /**
     * Get the end date
     * @function getEnd
     * @return {Date} End date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getEnd = function () {
        return this.end;
    };

    /**************************************************************************************************************/
    
    /**
     * Set the end date
     * @function setEnd
     * @param {Date} date End date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.setEnd = function (date) {
        this.end = Moment.utc(date);
    };

    /**************************************************************************************************************/

    /**
     * Get the step value
     * @function getStepValue
     * @return {Integer} Step value
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getStepValue = function () {
        return this.stepValue;
    };

    /**************************************************************************************************************/
    
    /**
     * Set the step value
     * @function setStepValue
     * @param {Integer} stepValue Step value
     * @memberOf TimeSample#
     */
    TimeSample.prototype.setStepValue = function (stepValue) {
        this.stepValue = stepValue;
    }; 

    /**************************************************************************************************************/

    /**
     * Get the step kind
     * @function getStepKind
     * @return {String} Step kind
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getStepKind = function () {
        return this.stepKind;
    };

    /**************************************************************************************************************/

    /**
     * Set the step kind
     * @function setStepKind
     * @param {String} stepKind Step kind
     * @memberOf TimeSample#
     */
    TimeSample.prototype.setStepKind = function (stepKind) {
        this.stepKind = stepKind;
    };

    /**************************************************************************************************************/
    
    /**
     * Set the layer ID
     * @function setLayerID
     * @param {String} layerID Layer ID
     * @memberOf TimeSample#
     */
    TimeSample.prototype.setLayerID = function (layerID) {
        this.layerID = layerID;
    }; 

    /**************************************************************************************************************/

    /**
     * Get the layer ID
     * @function getLayerID
     * @return {String} Layer ID
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getLayerID = function () {
        return this.layerID;
    };

    /**************************************************************************************************************/

    /**
     * Get next date 
     * @function getNextDate
     * @return {Date} Next date
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
     * @return {Date} Previous date
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
     * Convert date in json object
     * @function convertDate
     * @return {JSon} date
     * @private
     * @memberOf TimeSample#
     */
    TimeSample.prototype.convertDate = function (date) {
        var result = {
            "date" : date,
            "period" :
                { 
                  "from" : date ,
                  "to" : date
                }
        };
        return result;
    };

    /**************************************************************************************************************/
    
    /**
     * Get first date AFTER a specified date
     * @function getFirstDateAfter
     * @param {Date} date Date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getFirstDateAfter = function (date) {
        var foundDate = null;
        if (date<this.start) {
            // trivial case, first date is after !
            foundDate = this.convertDate(this.start);
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
                    foundDate = this.convertDate(currentDate);
                }
            }
        }

        return foundDate;
    }; 

    /**************************************************************************************************************/
    
    /**
     * Get first date BEFORE a specified date
     * @function getFirstDateBefore
     * @param {Date} date Date
     * @memberOf TimeSample#
     */
    TimeSample.prototype.getFirstDateBefore = function (date) {
        var foundDate = null;
        if (date>this.end) {
            // trivial case, end date is before !
            foundDate = this.convertDate(this.end);
        } else if (date<this.start) {
            // trivial case, date is before the first date
            foundDate = null;
        } else {
            // go to search
            var currentDate = this.start;
            var previousDate = null;
            var isDone = false;
            var nextDate = null;
            
            while (!isDone) {
                previousDate = currentDate;
                currentDate = this.getNextDate(currentDate);
                if (currentDate === null) {
                    // Null found, no more date, stop it whith found date set to null
                    isDone = true;
                    foundDate = previousDate;
                }
                if (currentDate>date) {
                    isDone = true;
                    foundDate = this.convertDate(previousDate);
                }
            }
        }

        return foundDate;
    }; 

    return TimeSample;
});