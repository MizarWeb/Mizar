define(["moment"], function(Moment) {
    /**
     * @class
     * Store time sample
     * @constructor
     */
    var TimeSample = function() {
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
     * @memberof TimeSample#
     */
    TimeSample.prototype.getStart = function() {
        return this.start;
    };

    /**************************************************************************************************************/

    /**
     * Set the start date of sample
     * @function setStart
     * @param {Date} date Start date
     * @memberof TimeSample#
     */
    TimeSample.prototype.setStart = function(date) {
        this.start = Moment.utc(date);
    };

    /**************************************************************************************************************/

    /**
     * Get the end date
     * @function getEnd
     * @return {Date} End date
     * @memberof TimeSample#
     */
    TimeSample.prototype.getEnd = function() {
        return this.end;
    };

    /**************************************************************************************************************/

    /**
     * Set the end date
     * @function setEnd
     * @param {Date} date End date
     * @memberof TimeSample#
     */
    TimeSample.prototype.setEnd = function(date) {
        this.end = Moment.utc(date);
    };

    /**************************************************************************************************************/

    /**
     * Get the step value
     * @function getStepValue
     * @return {Integer} Step value
     * @memberof TimeSample#
     */
    TimeSample.prototype.getStepValue = function() {
        return this.stepValue;
    };

    /**************************************************************************************************************/

    /**
     * Set the step value
     * @function setStepValue
     * @param {Integer} stepValue Step value
     * @memberof TimeSample#
     */
    TimeSample.prototype.setStepValue = function(stepValue) {
        this.stepValue = stepValue;
    };

    /**************************************************************************************************************/

    /**
     * Get the step kind
     * @function getStepKind
     * @return {string} Step kind
     * @memberof TimeSample#
     */
    TimeSample.prototype.getStepKind = function() {
        return this.stepKind;
    };

    /**************************************************************************************************************/

    /**
     * Set the step kind
     * @function setStepKind
     * @param {string} stepKind Step kind
     * @memberof TimeSample#
     */
    TimeSample.prototype.setStepKind = function(stepKind) {
        this.stepKind = stepKind;
    };

    /**************************************************************************************************************/

    /**
     * Set the layer ID
     * @function setLayerID
     * @param {string} layerID Layer ID
     * @memberof TimeSample#
     */
    TimeSample.prototype.setLayerID = function(layerID) {
        this.layerID = layerID;
    };

    /**************************************************************************************************************/

    /**
     * Get the layer ID
     * @function getLayerID
     * @return {string} Layer ID
     * @memberof TimeSample#
     */
    TimeSample.prototype.getLayerID = function() {
        return this.layerID;
    };

    /**************************************************************************************************************/

    /**
     * Get next date
     * @function getNextDate
     * @return {Date} Next date
     * @memberof TimeSample#
     */
    TimeSample.prototype.getNextDate = function(date) {
        var nextDate = null;
        nextDate = Moment.utc(date).add(this.stepValue, this.stepKind);
        if (nextDate > this.end) {
            nextDate = null;
        }
        return nextDate;
    };

    /**************************************************************************************************************/

    /**
     * Get previous date
     * @function getPreviousDate
     * @return {Date} Previous date
     * @memberof TimeSample#
     */
    TimeSample.prototype.getPreviousDate = function(date) {
        var previousDate = null;
        previousDate = Moment.utc(date).subtract(this.stepValue, this.stepKind);
        if (previousDate < this.start) {
            previousDate = null;
        }
        return previousDate;
    };

    /**************************************************************************************************************/

    /**
     * Get first date AFTER a specified date
     * @function getFirstDateAfter
     * @param {Date} date Date
     * @memberof TimeSample#
     */
    TimeSample.prototype.getFirstDateAfter = function(date) {
        var foundDate = null;
        var foundPeriod = { from: null, to: null };
        var foundDisplay = null;

        if (date < this.start) {
            // trivial case, first date is after !
            foundDate = this.start;
            foundDisplay = Moment(foundDate.toISOString()).format(
                Moment(foundDate).creationData().format
            );
        } else if (date > this.end) {
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
                if (currentDate > date) {
                    isDone = true;
                    foundDate = currentDate;
                }
            }
        }

        if (foundDate !== null) {
            foundPeriod.from = foundDate;
            foundPeriod.to = foundDate;
            foundDisplay = Moment(foundDate.toISOString()).format(
                Moment(foundDate).creationData().format
            );
        }

        return {
            date: foundDate,
            period: foundPeriod,
            display: foundDisplay
        };
    };

    /**************************************************************************************************************/

    /**
     * Get first date BEFORE a specified date
     * @function getFirstDateBefore
     * @param {Date} date Date
     * @memberof TimeSample#
     */
    TimeSample.prototype.getFirstDateBefore = function(date) {
        var foundDate = null;
        var foundPeriod = { from: null, to: null };
        var foundDisplay = null;

        if (date > this.end) {
            // trivial case, end date is before !
            foundDate = this.end;
            foundDisplay = Moment(foundDate.toISOString()).format(
                Moment(foundDate).creationData().format
            );
        } else if (date < this.start) {
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
                if (currentDate > date) {
                    isDone = true;
                    foundDate = previousDate;
                }
            }
        }
        if (foundDate !== null) {
            foundDisplay = Moment(foundDate.toISOString()).format(
                Moment(foundDate).creationData().format
            );
            foundPeriod.from = foundDate;
            foundPeriod.to = foundDate;
        }
        return {
            date: foundDate,
            period: foundPeriod,
            display: foundDisplay
        };
    };

    /**************************************************************************************************************/

    /**
     * Get min date
     * @function getMinDate
     * @return {Date} Min date or null
     * @memberof TimeSample#
     */
    TimeSample.prototype.getMinDate = function() {
        return this.getStart();
    };

    /**************************************************************************************************************/

    /**
     * Get max date
     * @function getMaxDate
     * @return {Date} Max date or null
     * @memberof TimeSample#
     */
    TimeSample.prototype.getMaxDate = function() {
        return this.getEnd();
    };

    /**************************************************************************************************************/

    /**
     * Get string representation
     * @function toString
     * @return {string} String representation
     * @memberof TimeSample#
     */
    TimeSample.prototype.toString = function() {
        return (
            Moment(this.start) +
            " / " +
            Moment(this.end) +
            " / " +
            this.stepValue +
            this.stepKind +
            " / ID=" +
            this.layerID
        );
    };

    return TimeSample;
});
