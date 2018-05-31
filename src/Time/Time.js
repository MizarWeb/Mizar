define(["jquery", "moment", "../Utils/Constants", "../Utils/Utils"], function($, Moment, Constants, Utils) {

    var Time = function(time) {
        this.date = time.date;
        this.display = time.display;
        this.period = time.period;
    };

    function _isTimeTravel(value) {
        return value.hasOwnProperty('date') && value.hasOwnProperty('display') && value.hasOwnProperty('period');
    }

    function _isPeriod(value) {
        return value.hasOwnProperty('from') && value.hasOwnProperty('to');
    }

    function _isOpenedInterval(value) {
        return value.hasOwnProperty('from');
    }

    function _isDateString(value) {
        return typeof value === "string";
    }

    function _isNumeric(value) {
        return !isNaN(value);
    }

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

    function _isSampling (timeDefinition) {
        return timeDefinition.indexOf('/') !== -1
    }

    function _isDistinctValue(timeDefinition) {
        return !_isSampling(timeDefinition);
    }

   function _isEqual (startTime, stopTime, singleTimeDefinition) {
        var format = singleTimeDefinition.creationData().format ? singleTimeDefinition.creationData().format : "YYYY";
        var timeResolution = Time._lowestFormatResolution(format);
        var minTimeDefinition = Moment(singleTimeDefinition).startOf(timeResolution);
        var maxTimeDefinition = Moment(singleTimeDefinition).endOf(timeResolution);
        return startTime <= singleTimeDefinition && singleTimeDefinition <= stopTime ||
               minTimeDefinition <= startTime && startTime <= maxTimeDefinition ||
               minTimeDefinition <= stopTime && stopTime <= maxTimeDefinition;
    }

    /**
     *
     * @param {moment} requestedTime
     * @param {moment} startDate
     * @param {int} nbValues
     * @param {int} stepTime
     * @param {Constants.UNIT_TIME_WMS} unitTime
     * @return {*}
     */
    function _binarySearch(requestedTime, startTime, stopTime, nbValues, stepTime, unitTime) {
        var guess, start, currentDate,
            min = 0,
            max = nbValues;

        while(min <= max){
            guess = Math.floor((min + max) /2);
            currentDate = Moment(requestedTime);
            currentDate.add(guess * stepTime, unitTime);
            if(_isEqual(startTime, stopTime, currentDate))
                return guess;
            else if(startTime < currentDate)
                min = guess + 1;
            else
                max = guess - 1;
        }
        return -1;
    }

    Time._templateTimeTravel = function(date, display, from, to, computed) {
        return {
            date : Moment.utc(date),
            display : display,
            period : {
                from: Moment.utc(from),
                to: Moment.utc(to)
            },
            computed: computed
        }
    };


    Time._lowestFormatResolution = function(format) {
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
    };

    Time.parse = function(time) {
        var result;
        if(_isTimeTravel(time)) {
            result = time;
            result.computed = true;
        } else if (_isPeriod(time)) {
            result = Time._templateTimeTravel(time.from, time.from, time.from, time.to, false);
        } else if (_isOpenedInterval(time)) {
            result = Time._templateTimeTravel(time.from, time.from, time.from, Moment(), false)
        } else if (_isDateString(time)) {
            var timeRequested = _isNumeric(time) ? Moment.utc(parseInt([time])) : Moment.utc(time);
            var format = timeRequested.creationData().format ? timeRequested.creationData().format : "YYYY";
            var timeResolution = Time._lowestFormatResolution(format);
            var from = Moment.utc(time).startOf(timeResolution);
            var to = Moment.utc(time).endOf(timeResolution);
            result = Time._templateTimeTravel(time, time, from, to, false)
        } else {
            throw new Error("Unsupported time format");
        }
        return new Time(result);
    };


    /**
     *
     * @param {moment} singleTimeDefinition
     * @return {boolean}
     */
    Time.prototype.isEqual = function(singleTimeDefinition) {
        var isEqual = _isEqual(this.period.from, this.period.to, singleTimeDefinition);
        if(isEqual) {
            this.display = singleTimeDefinition._i;
        }
        return isEqual;
    };

    /**
     *
     * @param {moment} requestedTime
     * @param {moment} startDate
     * @param {moment} stopDate
     * @param stepDate
     */
    Time.prototype.isInSampling = function (samplingTimeDefinition) {
        samplingTimeDefinition = samplingTimeDefinition.trim();
        var minMaxStepTimeDef = samplingTimeDefinition.split("/");
        var startDateTimeDef = Moment.utc(minMaxStepTimeDef[0]);
        var stopDateTimeDef = Moment.utc(minMaxStepTimeDef[1]);
        var stepDateTimeDef = minMaxStepTimeDef[2];
        var timeResolutionDef = _timeResolution(stepDateTimeDef);
        var nbValues = Math.floor(stopDateTimeDef.diff(startDateTimeDef, timeResolutionDef.unit) / parseInt(timeResolutionDef.step));
        var idx = _binarySearch(this.date, startDateTimeDef, stopDateTimeDef, nbValues, timeResolutionDef.step, timeResolutionDef.unit);
        var isFound;
        if(idx === -1) {
            isFound = false;
        } else {
            isFound = true;
            this.display = Moment.utc(this.date).add(idx * timeResolutionDef.step, timeResolutionDef.unit)._i;
        }
        return idx !== -1;
    };

    /**
     *
     * @param {string[]} timeDefinition
     * @return {boolean}
     */
    Time.prototype.isInTimeDefinition = function(timeDefinition) {
        timeDefinition = timeDefinition.trim();
        var dataTime, momentDataTime, timeIdx;
        var isInside = false;
        var times = timeDefinition.split(",");
        for (timeIdx = 0; timeIdx < times.length && !isInside; timeIdx++) {
            dataTime = times[timeIdx].trim();
            if (_isDistinctValue(dataTime)) {
                momentDataTime = Moment.utc(dataTime);
                isInside = this.isEqual(momentDataTime);
            } else if (_isSampling(dataTime)){
                isInside = this.isInSampling(dataTime);
            } else {
                throw new Error("Unknown timeDefinition format");
            }
        }
        return isInside;
    };

    Time.prototype.getDisplayValue = function() {
        return this.display;
    };



    return Time;
});