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
 * Compass module : map control with "north" component
 */
define(["jquery", "moment", "../Utils/Constants"], function ($, Moment, Constants) {

    var TimeTravelParams = function () {
        this.startDate = null;
        this.endDate = null;

        this.currentDate = null;

        this.step = null;

        this.ctx = null;

        this.enumeratedValues = null;

        // TODO: internationalized
        Moment.locale('fr');
    };


    TimeTravelParams.prototype.setContext = function (ctx) {
        this.ctx = ctx;
    }

    TimeTravelParams.prototype.setStartDate = function (date) {
        this.startDate = Moment(date);
    };

    TimeTravelParams.prototype.setEndDate = function (date) {
        this.endDate = Moment(date);
    };

    TimeTravelParams.prototype.setCurrentDate = function (date) {
        this.currentDate = Moment(date);
    };

    TimeTravelParams.prototype.getStartDate = function () {
        return this.startDate;
    };

    TimeTravelParams.prototype.getEndDate = function () {
        return this.endDate;
    };

    TimeTravelParams.prototype.getCurrentDate = function () {
        return this.currentDate;
    };

    TimeTravelParams.prototype.getCurrentPeriod = function() {
        var fromDate = null;
        var toDate = null;
       

        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            fromDate = this.enumeratedValues[this.currentDate];
            toDate = fromDate;
        } else {
            fromDate = this.currentDate;
            toDate = Moment(this.currentDate).add(this.stepValue,this.stepKind);
            toDate = Moment(toDate).subtract(1,Constants.TIME_STEP.SECOND);
        }
        var result = {
            "from" : fromDate, 
            "to" : toDate
        };
        return result;
    };

    TimeTravelParams.prototype.setStep = function (kind,value) {
        this.stepKind = kind;
        this.stepValue = value;
    };

    TimeTravelParams.prototype.setEnumeratedValues = function (values) {
        // TODO soon : check format, need conversion ?
        this.enumeratedValues = values;
        
        // when enumerated, erase all others params
        this.startDate   = 0;
        this.endDate     = values.length-1;
        this.stepKind    = Constants.TIME_STEP.ENUMERATED;
        this.stepValue   = 1;
        this.currentDate = 0;
    };

    TimeTravelParams.prototype.apply = function () {
        this.ctx.publish(Constants.EVENT_MSG.GLOBAL_TIME_CHANGED,
            {
                date:this.currentDate,
                display:this.getCurrentDisplayDate(),
                period : this.getCurrentPeriod()
            });
    };

    TimeTravelParams.prototype.rewind = function () {
        oldCurrentDate = this.currentDate;
        if (this.stepKind === null) {
            this.currentDate -= this.step;
        } else {
            this.currentDate = Moment(this.currentDate).subtract(this.stepValue,this.stepKind);
        }
        if (this.currentDate < this.startDate) {
            console.log("can't go before...");
            this.currentDate = oldCurrentDate;
        } else {
            this.apply();
        }
    };

    TimeTravelParams.prototype.forward = function () {
        oldCurrentDate = this.currentDate;
        if (this.stepKind === null) {
            this.currentDate += this.step;
        } else {
            this.currentDate = Moment(this.currentDate).add(this.stepValue,this.stepKind);
        }
        if (this.currentDate > this.endDate) {
            console.log("can't go after...");
            this.currentDate = oldCurrentDate;
        } else {
            this.apply();
        }
    };

    TimeTravelParams.prototype.toString = function() {
        var str = "start :"+this.startDate.format("LLLL")+"\n";
        str+= "end : "+this.endDate.format("LLLL")+"\n";
        str+= "current : "+this.currentDate.format("LLLL")+"\n";

        return str;
    };

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

    TimeTravelParams.prototype.getCurrentDisplayDate = function() {
        if (this.enumeratedValues !== null) {
            return Moment(this.enumeratedValues[this.currentDate]).format("LLLL");
        } else {
            return this.getDateFormated(this.currentDate);
        }
    };

    return TimeTravelParams;
});
