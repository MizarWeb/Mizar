define(["jquery", "moment", "../Utils/Constants", "../Utils/Utils"], function ($, Moment, Constants, Utils) {

    /**
     * Time parameter
     * @typedef {Object} Time.time
     * @property {moment} date - Date of the event
     * @property {moment} display - date as defined in the server level
     * @property {Time.period} period - period of the event
     */

    /**
     * Period parameter
     * @typedef {Object} Time.period
     * @property {moment} from - Start date
     * @property {moment} to - Stop date
     */

    /**
     * Handles time.
     * @param {Time.time} time
     * @constructor
     */
    var Time = function (time) {
        this.date = time.date;
        this.display = time.display;
        this.period = time.period;
    };

    /**
     * Tests if the time input parameter is based on TimeTravel.
     * @param {Time.time} value time
     * @return {boolean} True when TimeTravel parameter is used otherwise False
     * @private
     */
    function _isTimeTravel(value) {
        return value.hasOwnProperty('date') && value.hasOwnProperty('display') && value.hasOwnProperty('period');
    }

    /**
     * Tests if the time input parameter is based on a period
     * @param {Time.period} value time
     * @return {boolean} True when period parameter is used otherwise False
     * @private
     */
    function _isPeriod(value) {
        return value.hasOwnProperty('from') && value.hasOwnProperty('to');
    }

    /**
     * Tests if the time input parameter is based on a semi-period (to not defined)
     * @param {Time.period} value time
     * @return {boolean} True when period parameter is used otherwise False
     * @private
     */
    function _isOpenedInterval(value) {
        return value.hasOwnProperty('from');
    }

    /**
     * Tests if the time input parameter is based on a string
     * @param {string} value time
     * @return {boolean} True when a string used to define the date
     * @private
     */
    function _isDateString(value) {
        return typeof value === "string";
    }

    /**
     * Tests is value is a numeric value.
     * @param value value to test
     * @return {boolean} True when value is a numeric otherwise False
     * @private
     */
    function _isNumeric(value) {
        return !isNaN(value);
    }

    /**
     * Returns the unit (year, mont, day) of the date
     * @param {UNIT_TIME_WMS} unit
     * @return {TIME_STEP} the unit
     * @private
     */
    function _unitWithoutTime(unit) {
        var unitTime;
        switch (unit) {
            case Constants.UNIT_TIME_WMS.YEAR:
                unitTime = Constants.TIME_STEP.YEAR;
                break;
            case Constants.UNIT_TIME_WMS.MONTH:
                unitTime = Constants.TIME_STEP.MONTH;
                break;
            case Constants.UNIT_TIME_WMS.DAY:
                unitTime = Constants.TIME_STEP.DAY;
                break;
            default:
                throw new Error("Unknown date format");
        }
        return unitTime;
    }

    /**
     * Returns the unit (hour, minute, second) of the time.
     * @param {UNIT_TIME_WMS} unit unit of the time
     * @return {TIME_STEP} Unit of the time
     * @private
     */
    function _unitWithTime(unit) {
        var unitTime;
        switch (unit) {
            case Constants.UNIT_TIME_WMS.HOUR:
                unitTime = Constants.TIME_STEP.HOUR;
                break;
            case Constants.UNIT_TIME_WMS.MINUTE:
                unitTime = Constants.TIME_STEP.MINUTE;
                break;
            case Constants.UNIT_TIME_WMS.SECONDE:
                unitTime = Constants.TIME_STEP.SECONDE;
                break;
            default:
                throw new Error("Onknown time format");
        }
        return unitTime;
    }

    /**
     * Parses the resolution returned by the server side.
     * @param resolution
     * @return {{step: *, unit: *}} The resolution of the temporal step
     * @private
     */
    function _timeResolution(resolution) {
        var stepTime, unitTime;
        var unit = resolution.slice(-1);
        if (resolution.startsWith(Constants.UNIT_RESOLUTION_WMS.TIME)) {
            //time => hour, min, sec
            stepTime = resolution.substring(2, resolution.length - 1);
            unitTime = _unitWithTime(unit);
        } else if (resolution.startsWith(Constants.UNIT_RESOLUTION_WMS.NOT_TIME)) {
            //day, month year
            stepTime = resolution.substring(1, resolution.length - 1);
            unitTime = _unitWithoutTime(unit);
        } else {
            throw new Error("Unknown resolution");
        }

        return {
            step: stepTime,
            unit: unitTime
        };
    }

    /**
     * Tests if the time definition is a sampling (min/max/step)
     * @param {string} timeDefinition
     * @return {boolean} True when timeDefinition is a sampling
     * @private
     */
    function _isSampling(timeDefinition) {
        return timeDefinition.indexOf('/') !== -1
    }

    /**
     * Tests if the time definition is a single value
     * @param {string} timeDefinition
     * @return {boolean} True when timeDefinition is a discrete value
     * @private
     */
    function _isDistinctValue(timeDefinition) {
        return !_isSampling(timeDefinition) && timeDefinition.indexOf(",") === -1;
    }

    /**
     * Tests if two dates are equals
     * @param {moment} date1
     * @param {moment} date2
     * @return {boolean} True when dates are equals otherwise False
     * @private
     */
    function _isEqual(date1, date2) {
        var format1 = date1.creationData().format ? date1.creationData().format : "YYYY";
        var format2 = date2.creationData().format ? date2.creationData().format : "YYYY";
        var timeResolution1 = _lowestFormatResolution(format1);
        var timeResolution2 = _lowestFormatResolution(format2);
        var min1 = Moment(date1).startOf(timeResolution1);
        var max1 = Moment(date1).endOf(timeResolution1);
        var min2 = Moment(date2).startOf(timeResolution2);
        var max2 = Moment(date2).endOf(timeResolution2);
        return min2 <= min1 && min1 <= max2 || min2 <= max1 && max1 <= max2 ||
               min1 <= min2 && min2 <= max1 || min1 <= max2 && max2 <= max1
    }

    /**
     * Binary Search to find the date in min/max/resolution for which the date is equal to requestedTime
     * @param {moment} requestedTime requested time
     * @param {moment} startTime start date
     * @param {moment} stopTime stop date
     * @param {int} nbValues number of value between startDate/stopDate
     * @param {number} stepTime Step time
     * @param {Constants.UNIT_TIME_WMS} unitTime
     * @return {number} -1 when the requestedTime is not find in the binarySearch otherwise False
     */
    function _binarySearch(requestedTime, startTime, stopTime, nbValues, stepTime, unitTime) {
        var guess, start, currentDate,
            min = 0,
            max = nbValues;

        while (min <= max) {
            guess = Math.floor((min + max) / 2);
            currentDate = Moment(startTime);
            currentDate.add(guess * stepTime, unitTime);
            if (_isEqual(requestedTime, currentDate))
                return guess;
            else if (requestedTime > currentDate)
                min = guess + 1;
            else
                max = guess - 1;
        }
        return -1;
    }

    /**
     * Lowest format resolution.
     * @param {string} format
     * @return The time moment unit
     * @private
     */
    function _lowestFormatResolution(format) {
        var timeResolution;
        if (Utils.aContainsB.call(this, format, 'ss')) {
            timeResolution = Constants.TIME_MOMENT_STEP.SECOND;
        } else if (Utils.aContainsB.call(this, format, 'mm')) {
            timeResolution = Constants.TIME_MOMENT_STEP.MINUTE;
        } else if (Utils.aContainsB.call(this, format, "HH")) {
            timeResolution = Constants.TIME_MOMENT_STEP.HOUR;
        } else if (Utils.aContainsB.call(this, format, 'DD')) {
            timeResolution = Constants.TIME_MOMENT_STEP.DAY;
        } else if (Utils.aContainsB.call(this, format, "MM")) {
            timeResolution = Constants.TIME_MOMENT_STEP.MONTH;
        } else if (Utils.aContainsB.call(this, format, "YYYY")) {
            timeResolution = Constants.TIME_MOMENT_STEP.YEAR;
        } else {
            throw new Error();
        }
        return timeResolution;
    }

    /**
     * Template for time travel
     * @param {string} date date
     * @param {string} display the real value from the server
     * @param {string} from start date
     * @param {string} to stop date
     * @param {boolean} computed True when we do not find the real date from the server
     * @return {{date: *, display: *, period: {from: *, to: *}, computed: *}}
     * @private
     */
    function _templateTimeTravel (date, display, from, to, computed) {
        return {
            date: Moment.utc(date),
            display: display,
            period: {
                from: Moment.utc(from),
                to: Moment.utc(to)
            },
            computed: computed
        }
    }

    /**
     * Lowest format resolution.
     * @param {string} format
     * @return The time moment unit
     */
    Time.lowestFormatResolution = function (format) {
        return _lowestFormatResolution(format);
    };

    /**
     * Parses the resolution returned by the server side.
     * @param resolution
     * @return {{step: *, unit: *}} The resolution of the temporal step
     */
    Time.timeResolution = function(resolution) {
        return _timeResolution(resolution);
    };

    /**
     * Tests if the time definition is a sampling (min/max/step)
     * @param {string} timeDefinition
     * @return {boolean} True when timeDefinition is a sampling
     */
    Time.isSampling = function(timeDefinition) {
        return _isSampling(timeDefinition);
    };

    /**
     * Tests if the time definition is a single value
     * @param {string} timeDefinition
     * @return {boolean} True when timeDefinition is a discrete value
     */
    Time.isDistinctValue = function(timeDefinition) {
        return _isDistinctValue(timeDefinition);
    };

    /**
     * Parses the date and returns Time.
     * @param {Time.time|Time.period|string} time
     * @return {Time} time object
     */
    Time.parse = function (time) {
        var result;
        if (_isTimeTravel(time)) {
            result = time;
            result.computed = true;
        } else if (_isPeriod(time)) {
            result = _templateTimeTravel(time.from, time.from, time.from, time.to, false);
        } else if (_isOpenedInterval(time)) {
            result = _templateTimeTravel(time.from, time.from, time.from, Moment(), false)
        } else if (_isDateString(time)) {
            var timeRequested = _isNumeric(time) ? Moment.utc(parseInt([time])) : Moment.utc(time);
            var format = timeRequested.creationData().format ? timeRequested.creationData().format : "YYYY";
            var timeResolution = _lowestFormatResolution(format);
            var from = Moment.utc(time).startOf(timeResolution);
            var to = Moment.utc(time).endOf(timeResolution);
            result = _templateTimeTravel(time, time, from, to, false)
        } else {
            throw new Error("Unsupported time format");
        }
        return new Time(result);
    };


    /**
     * Tests if the singleDefinition is equal to the time object.
     * @param {moment} singleTimeDefinition
     * @return {boolean} True when the singleDefinition is equal to the time object otherwise False
     */
    Time.prototype.isEqual = function (singleTimeDefinition) {
        var isEqual = _isEqual(Moment.utc(this.date), singleTimeDefinition);
        if (isEqual) {
            this.display = singleTimeDefinition._i;
        }
        return isEqual;
    };

    /**
     * Tests if the samplingDefinition is in the sample.
     * @param {string} samplingTimeDefinition
     * @return {boolean} True when the samplingDefinition is in the sample otherwise False.
     */
    Time.prototype.isInSampling = function (samplingTimeDefinition) {
        samplingTimeDefinition = samplingTimeDefinition.trim();
        var minMaxStepTimeDef = samplingTimeDefinition.split("/");
        var startDateTimeDef = Moment.utc(minMaxStepTimeDef[0]);
        var stopDateTimeDef = Moment.utc(minMaxStepTimeDef[1]);
        var stepDateTimeDef = minMaxStepTimeDef[2];
        var timeResolutionDef = _timeResolution(stepDateTimeDef);
        var nbValues = Math.floor(stopDateTimeDef.diff(startDateTimeDef, timeResolutionDef.unit) / parseInt(timeResolutionDef.step));
        var idx = _binarySearch(Moment.utc(this.date), startDateTimeDef, stopDateTimeDef, nbValues, timeResolutionDef.step, timeResolutionDef.unit);
        var isFound;
        if (idx === -1) {
            isFound = false;
        } else {
            isFound = true;
            var format = startDateTimeDef.creationData().format ? startDateTimeDef.creationData().format : "YYYY";
            this.display = Moment.utc(startDateTimeDef).add(idx * timeResolutionDef.step, timeResolutionDef.unit).format(format);
        }
        return isFound;
    };

    /**
     * Tests if the timeDefinition is in Time definition.
     * TimeDefinition can be a sample of discrete values and/or start/stop/resolution
     * @param {string} timeDefinition
     * @return {boolean} True when the timeDefinition is in Time definition otherwise False
     */
    Time.prototype.isInTimeDefinition = function (timeDefinition) {
        timeDefinition = timeDefinition.trim();
        var dataTime, momentDataTime, timeIdx;
        var isInside = false;
        var times = timeDefinition.split(",");
        for (timeIdx = 0; timeIdx < times.length && !isInside; timeIdx++) {
            dataTime = times[timeIdx].trim();
            if (_isDistinctValue(dataTime)) {
                momentDataTime = Moment.utc(dataTime);
                isInside = this.isEqual(momentDataTime);
            } else if (_isSampling(dataTime)) {
                isInside = this.isInSampling(dataTime);
            } else {
                throw new Error("Unknown timeDefinition format");
            }
        }
        return isInside;
    };

    /**
     * Returns the real value coming from the server.
     * @return {string} the real value coming from the server
     */
    Time.prototype.getDisplayValue = function () {
        return this.display;
    };


    return Time;
});