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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/


define(function () {

    /**
     * @name AbstractAnimation
     * @class
     * AbstractAnimation is an abstract class for all animation contexts which allow
     * an application to create an animation of the camera around the globe.
     * @implements {Animation}
     * @todo Describes here and link to the tutos about Animation
     */
    var AbstractAnimation = function () {
        this.startTime = -1;
        this.pauseTime = -1;
        this.renderContext = null;
    };

    /**
     * @function getRenderContext
     * @memberOf AbstractAnimation#
     */
    AbstractAnimation.prototype.getRenderContext = function () {
        return this.renderContext;
    };

    /**
     * Unregisters animation.
     * @function _unregisterActive
     * @memberOf AbstractAnimation#
     * @private
     */
    AbstractAnimation.prototype._unregisterActive = function () {
        var index = this.renderContext.activeAnimations.indexOf(this);
        if (index >= 0) {
            this.renderContext.activeAnimations.splice(index, 1);
        }
    };


    /**
     * @function getStatus
     * @memberOf AbstractAnimation#
     */
    AbstractAnimation.prototype.getStatus = function () {
        if (this.startTime === -1) {
            return "STOPPED";
        } else {
            return this.pauseTime === -1 ? "RUNNING" : "PAUSED";
        }
    };
    
    /**
     * @function start
     * @memberOf AbstractAnimation#
     */
    AbstractAnimation.prototype.start = function () {
        if (!this.renderContext) {
            return;
        }

        if (this.startTime === -1 || this.pauseTime !== -1) {
            var now = Date.now();
            if (this.startTime === -1) {
                this.startTime = now;
            }
            else {
                // resume after pause
                this.startTime += now - this.pauseTime;
                this.pauseTime = -1;
            }

            // Register animation as active
            this.renderContext.activeAnimations.push(this);
            this.renderContext.requestFrame();
        }
    };

    /**
     * @function pause
     * @memberOf AbstractAnimation#
     */
    AbstractAnimation.prototype.pause = function () {
        if (!this.renderContext) {
            return;
        }

        if (this.startTime !== -1 && this.pauseTime === -1) {
            this.pauseTime = Date.now();
            this._unregisterActive(this);
        }
    };

    /**
     * @function stop
     * @memberOf AbstractAnimation#
     */
    AbstractAnimation.prototype.stop = function () {
        this.startTime = -1;
        this.pauseTime = -1;

        if (this.onstop) {
            this.onstop();
        }

        // Unregister animation
        this._unregisterActive(this);
    };

    /**************************************************************************************************************/

    return AbstractAnimation;

});
