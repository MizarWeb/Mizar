define(["jquery", "moment", "../Utils/Constants", "../Utils/Utils"], function ($, Moment, Constants, Utils) {

    /**
     * Stock time sample
     * @constructor
     */
    var TimeEnumerated = function () {
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
    function sortTime(a,b){ 
        return a.date>b.date?1:-1;
    }

    /**************************************************************************************************************/

    /**
     * Get the current index
     * @function getCurrentIndex
     * @return Integer Current index
     * @memberOf TimeEnumerated#
     */
    TimeEnumerated.prototype.getCurrentIndex = function () {
        return this.currentIndex;
    };

    /**************************************************************************************************************/

    /**
     * Parse date
     * @function parseDate
     * @param {String} value Date to parse
     * @return {Json} date { "date", "display", "period" { "from", "to" } }
     * @memberOf TimeEnumerated#
     */
    TimeEnumerated.prototype.parseDate = function (value) {
        value = value.trim();
        var date = null;
        var period = null;

        var regExpYear = /^\d{4}$/;
        var regExpMonth = /^\d{4}\-\d{2}$/;
        var regExpDay = /^\d{4}\-\d{2}\-\d{2}$/;
        if (typeof value === "string") {
            // Year management
            if (regExpYear.test(value)) {
                date = Moment.utc(value,"YYYY");
                period = {};
                period.from = date;
                period.to = Moment.utc(period.from).endOf(Constants.TIME_STEP.YEAR);
            }
            // Month management
            if (regExpMonth.test(value)) {
                date = Moment.utc(value,"YYYY-MM");
                period = {};
                period.from = date;
                period.to = Moment.utc(period.from).endOf(Constants.TIME_STEP.MONTH);
            }
            // Day management
            if (regExpDay.test(value)) {
                date = Moment.utc(value,"YYYY-MM-DD");
                period = {};
                period.from = date;
                period.to = Moment.utc(period.from).endOf(Constants.TIME_STEP.DAY);
            }
            if (date === null) {
                date = Moment.utc(value);
            }
        } else {
            date = Moment.utc(value);
        }
        return {
                    "date" : date,
                    "display" : value,
                    "period" : period
            };
    };

    /**************************************************************************************************************/

    /**
     * Add date to enumerated values (check if still present)
     * @function addDateToEnumeratedValues
     * @param {Json} date Date
     * @param {String} ID Id
     * @memberOf TimeEnumerated#
     * @private
     */
    TimeEnumerated.prototype.addDateToEnumeratedValues = function (date,ID) {
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
     * @param {String} ID Id
     * @memberOf TimeEnumerated#
     * @private
     */
    TimeEnumerated.prototype.removeEnumeratedValuesForID = function (ID) {
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
     * @param {Array<String>} values Array of enumerated values
     * @param {String} ID Id
     * @memberOf TimeEnumerated#
     * @private
     */
    TimeEnumerated.prototype.addEnumeratedValuesForID = function (values,ID) {
        if (values === null) {
            // By pass
            return;
        }
        if (ID === null) {
            ID = TimeTravelParams.NO_ID;
        }

        
        // TODO soon : check format, need conversion ?
        var date = null;
        for (var i=0;i<values.length;i++) {
            date = this.parseDate(values[i]);
            this.addDateToEnumeratedValues(date,ID);
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
     * @memberOf TimeEnumerated#
     */
    TimeEnumerated.prototype.getFirstDateAfter = function (date) {
        var foundDate = null;
        return foundDate;
    }; 

    /**************************************************************************************************************/
    
    /**
     * Get first date BEFORE a specified date
     * @function getFirstDateBefore
     * @param Date date date
     * @memberOf TimeEnumerated#
     */
    TimeEnumerated.prototype.getFirstDateBefore = function (date) {
        var foundDate = null;
        return foundDate;
    }; 

    /**************************************************************************************************************/

    /**
     * Get string representation
     * @function toString
     * @return {String} String representation
     * @memberOf TimeEnumerated#
     */
    TimeEnumerated.prototype.toString = function () {
        var res = "";
        if (this.enumeratedValues) {
            for (var i=0;i<this.enumeratedValues.length;i++) {
                res += this.enumeratedValues[i].display + " / ";
            }
        }
        return res;
    };

    return TimeEnumerated;
});