/*******************************************************************************
 * Copyright 2017, 2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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

/**
 * Compass module : map control with "north" component
 */
import TimeTravelParams from "../Time/TimeTravelParams";
import Constants from "../Utils/Constants";
/**
 *    Private variables
 */

var params = new TimeTravelParams();

var parentElement = null;
var ctx = null;

/**************************************************************************************************************/

/**
 * Go Rewind
 * @fires Context#globalTime:changed
 */
function goRewind() {
  params.rewind();
}

/**
 * Go Forward
 * @fires Context#globalTime:changed
 */
function goForward() {
  params.forward();
}

/**
 * Choose time
 *
 */
function chooseTime(date) {
  if (date instanceof Date || typeof date === "string") {
    params.setCurrentDate(date);
  }
}

/**************************************************************************************************************/

/**
 *    Remove time travel element
 *
 */
function remove() {
  ctx.unsubscribe(Constants.EVENT_MSG.GLOBAL_TIME_FORWARD, goForward);
  ctx.unsubscribe(Constants.EVENT_MSG.GLOBAL_TIME_REWIND, goRewind);
  ctx.unsubscribe(Constants.EVENT_MSG.GLOBAL_TIME_SET, chooseTime);
  document.getElementById(parentElement).innerHTML = "";
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
 *    get current date
 *
 */
function getCurrentDate() {
  return params.getCurrentDate();
}

function isCurrentDateTheFirst() {
  return params.isCurrentDateTheFirst();
}

function isCurrentDateTheLast() {
  return params.isCurrentDateTheLast();
}

/**************************************************************************************************************/

export default {
  init: function (options) {
    parentElement = options.element;
    ctx = options.ctx;
    params.setContext(ctx);

    // subscribe
    if (ctx) {
      ctx.subscribe(Constants.EVENT_MSG.GLOBAL_TIME_FORWARD, goForward);
      ctx.subscribe(Constants.EVENT_MSG.GLOBAL_TIME_REWIND, goRewind);
      ctx.subscribe(Constants.EVENT_MSG.GLOBAL_TIME_SET, chooseTime);
    }
  },
  reset: reset,
  update: update,
  goForward: goForward,
  goRewind: goRewind,
  isCurrentDateTheFirst: isCurrentDateTheFirst,
  isCurrentDateTheLast: isCurrentDateTheLast,
  chooseTime: chooseTime,
  remove: remove,
  getCurrentDate: getCurrentDate
};
