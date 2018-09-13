define(["jquery", "moment", "../Utils/Constants", "../Utils/Utils"], function(
    $,
    Moment,
    Constants,
    Utils
) {
    /**
     * Stock time sample
     * @constructor
     */
    var TimeEnumerated = function() {
        // Array of enumerated values
        this.enumeratedValues = null;
        this.currentIndex = null;
    };

    /**************************************************************************************************************/

    /**
     * Sort enumerated values by date
     * @function sortTime
     * @param {Date} a First date
     * @param {Date} b Second date
     */
    function sortTime(a, b) {
        return a.date > b.date ? 1 : -1;
    }

    /**************************************************************************************************************/

    /**
     * Get the current index
     * @function getCurrentIndex
     * @return Integer Current index
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.getCurrentIndex = function() {
        return this.currentIndex;
    };

    /**************************************************************************************************************/

    /**
     * Parse date
     * @function parseDate
     * @param {String} value Date to parse
     * @return {Json} date { "date", "display", "period" { "from", "to" } }
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.parseDate = function(value) {
        value = value.trim();
        var date = null;
        var period = null;

        var regExpYear = /^\d{4}$/;
        var regExpMonth = /^\d{4}\-\d{2}$/;
        var regExpDay = /^\d{4}\-\d{2}\-\d{2}$/;
        if (typeof value === "string") {
            // Year management
            if (regExpYear.test(value)) {
                date = Moment.utc(value, "YYYY");
                period = {};
                period.from = date;
                period.to = Moment.utc(period.from).endOf(
                    Constants.TIME_STEP.YEAR
                );
            }
            // Month management
            if (regExpMonth.test(value)) {
                date = Moment.utc(value, "YYYY-MM");
                period = {};
                period.from = date;
                period.to = Moment.utc(period.from).endOf(
                    Constants.TIME_STEP.MONTH
                );
            }
            // Day management
            if (regExpDay.test(value)) {
                date = Moment.utc(value, "YYYY-MM-DD");
                period = {};
                period.from = date;
                period.to = Moment.utc(period.from).endOf(
                    Constants.TIME_STEP.DAY
                );
            }
            if (date === null) {
                date = Moment.utc(value);
            }
        } else {
            date = Moment.utc(value);
        }
        return {
            date: date,
            display: value,
            period: period
        };
    };

    /**************************************************************************************************************/

    /**
     * Add date to enumerated values (check if still present)
     * @function addDateToEnumeratedValues
     * @param {Json} date Date
     * @param {String} ID Id
     * @memberof TimeEnumerated#
     * @private
     */
    TimeEnumerated.prototype.addDateToEnumeratedValues = function(date, ID) {
        if (this.enumeratedValues === null) {
            this.enumeratedValues = [];
        }

        for (var i = 0; i < this.enumeratedValues.length; i++) {
            if (this.enumeratedValues[i].display === date.display) {
                // Still found : add only id
                if (
                    this.enumeratedValues[i].ids &&
                    this.enumeratedValues[i].ids.length
                ) {
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
     * @param {String} ID Id
     * @memberof TimeEnumerated#
     * @private
     */
    TimeEnumerated.prototype.removeEnumeratedValuesForID = function(ID) {
        if (ID === null) {
            ID = TimeTravelParams.NO_ID;
        }
        if (this.enumeratedValues) {
            for (var i = this.enumeratedValues.length - 1; i >= 0; i--) {
                if (
                    this.enumeratedValues[i].ids &&
                    this.enumeratedValues[i].ids.length
                ) {
                    var index = this.enumeratedValues[i].ids.indexOf(ID);
                    if (index !== -1) {
                        this.enumeratedValues[i].ids.splice(index, 1);
                    }
                    if (this.enumeratedValues[i].ids.length === 0) {
                        this.enumeratedValues.splice(i, 1);
                    }
                }
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Add enumerated values for ID
     * @function addEnumeratedValuesForID
     * @param {Array<String>} values Array of enumerated values
     * @param {String} ID Id
     * @memberof TimeEnumerated#
     * @private
     */
    TimeEnumerated.prototype.addEnumeratedValuesForID = function(values, ID) {
        if (values === null) {
            // By pass
            return;
        }
        if (ID === null) {
            ID = TimeTravelParams.NO_ID;
        }

        // TODO soon : check format, need conversion ?
        var date = null;
        for (var i = 0; i < values.length; i++) {
            date = this.parseDate(values[i]);
            this.addDateToEnumeratedValues(date, ID);
        }

        // sort tab
        this.enumeratedValues.sort(sortTime);

        this.currentIndex = 0;
        this.currentDate = this.enumeratedValues[this.currentIndex].date;
    };

    /**************************************************************************************************************/

    /**
     * Get first date AFTER a specified date
     * @function getFirstDateAfter
     * @param Date date date
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.getFirstDateAfter = function(date) {
        var foundDate = null;
        return foundDate;
    };

    /**************************************************************************************************************/

    /**
     * Get first date BEFORE a specified date
     * @function getFirstDateBefore
     * @param Date date date
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.getFirstDateBefore = function(date) {
        var foundDate = null;
        return foundDate;
    };

    /**************************************************************************************************************/

    /**
     * Get first date AFTER a specified date
     * @function getFirstDateAfter
     * @param {Date} date Date
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.getFirstDateAfter = function(date) {
        var foundDate = null;
        var foundPeriod = { from: null, to: null };
        var foundDisplay = null;

        if (this.enumeratedValues && this.enumeratedValues.length > 0) {
            if (date < this.enumeratedValues[0].date) {
                // trivial case, first date is before the first element
                foundDate = this.enumeratedValues[0].date;
                foundPeriod = this.enumeratedValues[0].period;
                foundDisplay = this.enumeratedValues[0].display;
            } else if (
                date >
                this.enumeratedValues[this.enumeratedValues.length - 1].date
            ) {
                // trivial case, date is after the last date
                foundDate = null;
            } else {
                // go to search
                var cpt = 0;
                var isDone = false;
                while (!isDone) {
                    currentDate = this.enumeratedValues[cpt].date;
                    if (currentDate > date) {
                        isDone = true;
                        foundDate = this.enumeratedValues[cpt].date;
                        foundPeriod = this.enumeratedValues[cpt].period;
                        foundDisplay = this.enumeratedValues[cpt].display;
                    }
                    cpt++;
                    isDone = isDone || cpt >= this.enumeratedValues.length;
                }
            }
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
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.getFirstDateBefore = function(date) {
        var foundDate = null;
        var foundPeriod = { from: null, to: null };
        var foundDisplay = null;

        if (this.enumeratedValues && this.enumeratedValues.length > 0) {
            if (
                date >
                this.enumeratedValues[this.enumeratedValues.length - 1].date
            ) {
                // trivial case, end date is before !
                foundDate = this.enumeratedValues[
                    this.enumeratedValues.length - 1
                ].date;
                foundPeriod = this.enumeratedValues[
                    this.enumeratedValues.length - 1
                ].period;
                foundDisplay = this.enumeratedValues[
                    this.enumeratedValues.length - 1
                ].display;
            } else if (date < this.enumeratedValues[0].date) {
                // trivial case, date is before the first date
                foundDate = null;
            } else {
                // go to search
                var cpt = this.enumeratedValues.length - 1;
                var isDone = false;

                while (!isDone) {
                    while (!isDone) {
                        currentDate = this.enumeratedValues[cpt].date;
                        if (currentDate < date) {
                            isDone = true;
                            foundDate = this.enumeratedValues[cpt].date;
                            foundPeriod = this.enumeratedValues[cpt].period;
                            foundDisplay = this.enumeratedValues[cpt].display;
                        }
                        cpt--;
                        isDone = isDone || cpt < 0;
                    }
                }
            }
        }

        return {
            date: foundDate,
            period: foundPeriod,
            display: foundDisplay
        };
    };

    /**************************************************************************************************************/

    /**
     * Get string representation
     * @function toString
     * @return {String} String representation
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.toString = function() {
        var res = "";
        if (this.enumeratedValues) {
            for (var i = 0; i < this.enumeratedValues.length; i++) {
                res += this.enumeratedValues[i].display + " / ";
            }
        }
        return res;
    };

    /**************************************************************************************************************/

    /**
     * Is empty ?
     * @function isEmpty
     * @return {Boolean} is empty ?
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.isEmpty = function() {
        return !(this.enumeratedValues && this.enumeratedValues.length > 0);
    };

    /**************************************************************************************************************/

    /**
     * Get min date
     * @function getMinDate
     * @return {Date} Min date or null
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.getMinDate = function() {
        var result = null;
        if (this.enumeratedValues && this.enumeratedValues.length > 0) {
            result = this.enumeratedValues[0].date;
        }
        return result;
    };

    /**************************************************************************************************************/

    /**
     * Get max date
     * @function getMaxDate
     * @return {Date} Max date or null
     * @memberof TimeEnumerated#
     */
    TimeEnumerated.prototype.getMaxDate = function() {
        var result = null;
        if (this.enumeratedValues && this.enumeratedValues.length > 0) {
            result = this.enumeratedValues[this.enumeratedValues.length - 1]
                .date;
        }
        return result;
    };

    return TimeEnumerated;
});
