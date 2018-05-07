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

    TimeTravelParams.STEP = {
        YEAR        : "years",
        QUARTER     : "quarters",
        MONTH       : "months",
        WEEK        : "weeks",
        DAY         : "days",
        HOUR        : "hours",
        MINUTE      : "minutes",
        SECOND      : "seconds",
        MILLISECOND : "milliseconds",
        ENUMERATED  : null
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
        this.stepKind    = TimeTravelParams.STEP.ENUMERATED;
        this.stepValue   = 1;
        this.currentDate = 0;
    };

    TimeTravelParams.prototype.rewind = function () {
        oldCurrentDate = this.currentDate;
        if (this.stepKing === null) {
            this.currentDate -= this.step;
        } else {
            this.currentDate = Moment(this.currentDate).subtract(this.stepKind,this.stepValue);
        }
        if (this.currentDate < this.startDate) {
            console.log("can't go before...");
            this.currentDate = oldCurrentDate;
        } else {
            this.ctx.publish(Constants.EVENT_MSG.GLOBAL_TIME_CHANGED,{date:this.currentDate,display:this.getCurrentDisplayDate()});
        }
    };

    TimeTravelParams.prototype.forward = function () {
        oldCurrentDate = this.currentDate;
        if (this.stepKing === null) {
            this.currentDate += this.step;
        } else {
            this.currentDate = Moment(this.currentDate).add(this.stepKind,this.stepValue);
        }
        if (this.currentDate > this.endDate) {
            console.log("can't go after...");
            this.currentDate = oldCurrentDate;
        } else {
            this.ctx.publish(Constants.EVENT_MSG.GLOBAL_TIME_CHANGED,{date:this.currentDate,display:this.getCurrentDisplayDate()});
        }
    };

    TimeTravelParams.prototype.toString = function() {
        var str = "start :"+this.startDate.format("LLLL")+"\n";
        str+= "end : "+this.endDate.format("LLLL")+"\n";
        str+= "current : "+this.currentDate.format("LLLL")+"\n";

        return str;
    };

    TimeTravelParams.prototype.getCurrentDisplayDate = function() {
        if (this.enumeratedValues !== null) {
            return Moment(this.enumeratedValues[this.currentDate]).format("LLLL");
        } else {
            return Moment(this.currentDate).format("LLLL");
        }
    };

    return TimeTravelParams;
});
