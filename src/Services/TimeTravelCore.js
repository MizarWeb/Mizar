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
define(["jquery","./TimeTravelParams","../Utils/Constants"], function ($, TimeTravelParams, Constants) {

    /**
     *    Private variables
     */
    
    var params = new TimeTravelParams();

    var parentElement = null;
    var ctx = null;

    /**************************************************************************************************************/

    /**
     *    Go Rewind
     *    
     */
    function goRewind() {
        params.rewind();
    }

    /**
     *    Go Forward
     *    
     */
    function goForward() {
        params.forward();
    }

    /**
     *    Choose time
     *    
     */
    function chooseTime() {
    }

    /**************************************************************************************************************/

    /**
     *    Remove time travel element
     *    
     */
    function remove() {
        ctx.unsubscribe(Constants.EVENT_MSG.GLOBAL_TIME_FORWARD);
        ctx.unsubscribe(Constants.EVENT_MSG.GLOBAL_TIME_REWIND);
        ctx.unsubscribe(Constants.EVENT_MSG.GLOBAL_TIME_SET);
        ctx.unsubscribe(Constants.EVENT_MSG.GLOBAL_TIME_INIT);
        document.getElementById(parentElement).innerHTML = '';
    }

    /**************************************************************************************************************/

    /**
     *    reset values
     *    
     */
    function reset() {
        params.reset();
    }

    /**
     *    update
     *    
     */
    function update(parameters) {
        params.update(parameters);
    }

    /**
     *    get start value (return 0 if isEnumerated)
     *    
     */
    function getStart() {
        return params.getStartDate();
    }

    /**
     *    get end value (return length-1 if isEnumerated)
     *    
     */

    function getEnd() {
        return params.getStartDate();
    }

    /**
     *    get current date
     *    
     */
    function getCurrentDate() {
        return params.getCurrentDate();
    }

    /**
     *    get current index
     *    
     */
    function getCurrentIndex() {
        return params.getCurrentIndex();
    }

    /**
     *    return if dates are enumerated
     *    
     */
    function isEnumerated() {
        return (params.stepKind === Constants.TIME_STEP.ENUMERATED);
    }

    function isCurrentDateTheFirst() {
        return params.isCurrentDateTheFirst();
    }

    function isCurrentDateTheLast() {
        return params.isCurrentDateTheLast();
    }

    /**************************************************************************************************************/

    return {
        init: function (options) {
            parentElement = options.element;
            ctx = options.ctx;

            params.setContext(ctx);
            
            // subscribe
            if (ctx) {
                ctx.subscribe(Constants.EVENT_MSG.GLOBAL_TIME_FORWARD,goForward);
                ctx.subscribe(Constants.EVENT_MSG.GLOBAL_TIME_REWIND,goRewind);
                ctx.subscribe(Constants.EVENT_MSG.GLOBAL_TIME_SET,chooseTime);
            }
        },
        reset                 : reset,
        update                : update,
        goForward             : goForward,
        goRewind              : goRewind,
        isCurrentDateTheFirst : isCurrentDateTheFirst,
        isCurrentDateTheLast  : isCurrentDateTheLast,
        chooseTime            : chooseTime,
        remove                : remove,
        getStart              : getStart,
        getEnd                : getEnd,
        getCurrentDate        : getCurrentDate,
        getCurrentIndex       : getCurrentIndex,
        isEnumerated          : isEnumerated
    };
});
