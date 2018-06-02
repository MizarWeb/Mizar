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

    const REGEXP_YEAR = /^\d{4}$/;

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
        var interval1 = _createPeriod(date1);
        var interval2 = _createPeriod(date2);
        return interval2.from <= interval1.from && interval1.from <= interval2.to ||
               interval2.from <= interval1.to && interval1.to <= interval2.to ||
               interval1.from <= interval2.from && interval2.from <= interval1.to ||
               interval1.from <= interval2.to && interval2.to <= interval1.to
    }

    /**
     * Create a period from a given date
     * @param {moment} date
     * @return {{from, to}} the period
     * @private
     */
    function _createPeriod(date) {
        var format = date.creationData().format;
        var timeResolution = _lowestFormatResolution(format);
        return {
            from: Moment(date).startOf(timeResolution),
            to: Moment(date).endOf(timeResolution)
        }
    }

    function _isIntersect(period1, date2) {
        var interval2 = _createPeriod(date2);
        return interval2.from <= period1.from && period1.from <= interval2.to ||
            interval2.from <= period1.to && period1.to <= interval2.to ||
            period1.from <= interval2.from && interval2.from <= period1.to ||
            period1.from <= interval2.to && interval2.to <= period1.to

    }

    /**
     * Binary Search to find the date in min/max/resolution for which the date is equal to requestedTime
     * @param {moment} requestedTime requested time
     * @param {{from,to}} requestedPeriodTime requested period time
     * @param {moment} startTime start date
     * @param {int} nbValues number of value between startDate/stopDate
     * @param {{step,unit}} timeResolution time resolution
     * @return {number} -1 when the requestedTime is not find in the binarySearch otherwise False
     */
    function _binarySearch(requestedTime, requestedPeriodTime, startTime, nbValues, timeResolution) {
        var guess, start, currentDate,
            min = 0,
            max = nbValues;

        while (min <= max) {
            guess = Math.floor((min + max) / 2);
            currentDate = Moment(startTime);
            currentDate.add(guess * timeResolution.step, timeResolution.unit);
            if (_isEqual(requestedTime, currentDate) || _isIntersect(requestedPeriodTime, currentDate))
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
            date: _convertMoment(date),
            display: display,
            period: {
                from: _convertMoment(from),
                to: _convertMoment(to)
            },
            computed: computed
        }
    }

    function _convertMoment(date) {
        var time;
        if(REGEXP_YEAR.test(date)) {
            time = Moment.utc(date,'YYYY');
        } else if(date instanceof Date) {
            time = Moment.utc(date.toISOString());
        } else {
            time = Moment.utc(date);
        }
        return time;
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
            result = _templateTimeTravel(time.date, time.display, time.period.from, time.period.to, true);
        } else if (_isPeriod(time)) {
            result = _templateTimeTravel(time.from, time.from, time.from, time.to, false);
        } else if (_isOpenedInterval(time)) {
            result = _templateTimeTravel(time.from, time.from, time.from, Moment(), false)
        } else if (_isDateString(time)) {
            var timeRequested = _convertMoment(time);
            var format = timeRequested.creationData().format;
            var timeResolution = _lowestFormatResolution(format);
            var from = Moment.utc(timeRequested).startOf(timeResolution);
            var to = Moment.utc(timeRequested).endOf(timeResolution);
            result = _templateTimeTravel(time, time, from, to, false)
        } else {
            throw new Error("Unsupported time format");
        }
        return new Time(result);
    };


    /**
     * Tests if the singleDefinition is equal to the time object.
     * @param {string} singleTimeDefinition
     * @return {boolean} True when the singleDefinition is equal to the time object otherwise False
     */
    Time.prototype.isEqual = function (singleTimeDefinition) {
        var singleTimeMoment = _convertMoment(singleTimeDefinition);
        var isEqual = _isEqual(this.date, singleTimeMoment);
        if (isEqual) {
            var format = singleTimeMoment.creationData().format;
            this.display = singleTimeMoment.format(format);
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
        var startDateTimeDef = _convertMoment(minMaxStepTimeDef[0]);
        var stopDateTimeDef = _convertMoment(minMaxStepTimeDef[1]);
        var stepDateTimeDef = minMaxStepTimeDef[2];
        var timeResolutionDef = _timeResolution(stepDateTimeDef);
        var nbValues = Math.floor(stopDateTimeDef.diff(startDateTimeDef, timeResolutionDef.unit) / parseInt(timeResolutionDef.step));
        var idx = _binarySearch(this.date, this.period, startDateTimeDef, nbValues, timeResolutionDef);
        var isFound;
        if (idx === -1) {
            isFound = false;
        } else {
            isFound = true;
            var format = startDateTimeDef.creationData().format;
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
                isInside = this.isEqual(dataTime);
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