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
define([],
function () {

    /**
     * @name OpenSearchRequestPool
     * @class
     * This layer manage the request pool of OpenSearch
     * @memberOf module:Layer
     */
      var OpenSearchRequestPool = function (layer) {
        this.maxRunningRequests = 6;
        this.maxPoolingRequests = 50;

        this.debugMode = false;

        // Running requests
        this.runningRequests = [];

        this.layer = layer;

        // Atomic management when reseting
        this.resetMode = false;

        // Pooling requests
        this.freeRequests = [];
        this.poolingRequests = [];

        // Build all free requests
        for (var i = 0; i < this.maxPoolingRequests; i++) {
            var xhr = new XMLHttpRequest();
            xhr.numRequest = i;
            this.freeRequests.push(xhr);
        }

        this.debug("[New] "+this.getPoolsStatus());
    };

    /**************************************************************************************************************/

    OpenSearchRequestPool.prototype.init = function () {
    }

    /**************************************************************************************************************/

    OpenSearchRequestPool.prototype.debug = function (message) {
        if (this.debugMode === true) {
            console.log("Pool:"+message);
        }
    }

    /**************************************************************************************************************/

    OpenSearchRequestPool.prototype.getPoolsStatus = function () {
        var message = "";
        message += "Run : "+this.runningRequests.length+"/"+this.maxRunningRequests+ " , ";
        message += "Wait : "+this.poolingRequests.length+"/"+this.maxPoolingRequests;
        return message;
    }
    
    /*************************************************************************************************************/

    OpenSearchRequestPool.prototype.getFreeRequest = function () {
        this.debug("[getFreeRequest]");
        if (this.freeRequests.length === 0) {
            // Take oldest request in pool and use it
            xhr = this.poolingRequests.splice(0,1)[0];
            this.debug("Oldest pooling request cancel and reused");
            return xhr;
        } else {
            this.debug("Take one request from pool");
            return this.freeRequests.pop();
        }
    }

    /*************************************************************************************************************/

    /**
     * Add a query to the pool,
     *  TODO : what to do if pool if full ? => remove old elements ?
     *  Note : Query is ALWAYS ADDED at the end of the pool, the it's a FILO queue
     */
        
    
    OpenSearchRequestPool.prototype.addQuery = function (url,tile,key) {
        this.debug("[addQuery]");
        if (this.resetMode === true) {
            console.log("addQuery halt, reset mode");
            return;
        }
        
        var bound = tile.bound;
        // First check if query is style wanted
        if (this.isQueryStillWanted(key)) {
            // Query still in pool or running, so do not add it again
            return;
        }

        // get query slot
        var xhr = this.getFreeRequest();

        // set value for managing
        self = this;

        // Associate the key
        xhr.key = key;

        xhr.onreadystatechange = function (e) {
            var i,feature;
            var response;
            var alreadyAdded;
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    response = JSON.parse(xhr.response);
                    self.layer.result.parseResponse(response);
                    self.layer.cache.addTile(bound,response.features);
                    self.layer.manageFeaturesResponse(response.features,tile);
                }
                else if (xhr.status >= 400) {
                    //tileData.complete = true;
                    console.error(xhr.responseText);
                    return;
                }

                self.manageFinishedRequest(xhr);

                // Publish event that layer have received new features
                if (response !== undefined && response.features !== null && response.features.length > 0) {
                    self.layer.globe.publishEvent("features:added", {layer: self.layer, features: response.features});
                }
            }
        };
        xhr.open("GET", url);

        // Add request to pooling (last position)
        this.poolingRequests.push(xhr);

        // Check if request can be done
        this.checkPool();
    }

    /*************************************************************************************************************/

    OpenSearchRequestPool.prototype.checkPool = function () {
        this.debug("[checkPool]"+this.getPoolsStatus());
        
        if (this.resetMode === true) {
            console.log("checkPool halt, reset mode");
            return;
        }

        this.layer.updateGUI();

        if (this.poolingRequests.length === 0) {
            // No request in pool
            this.debug("no request in pool");

            if (this.runningRequests.length === 0) {
                // no request running, stop ihm indicator
                this.layer.globe.publishEvent("endLoad", this.layer);
            }
            return;
        }

        if (this.runningRequests.length === this.maxRunningRequests) {
            // Running pool is full, wait for a free slot
            this.debug("no running slot available, wait");
            return;
        }

        // There is at least one slot free
        this.debug("before : "+this.getPoolsStatus());

        // Remove it from pool
        var xhr = this.poolingRequests.pop();

        // Place it into running
        this.runningRequests.push(xhr);

        // Start ihm indicator
        this.layer.globe.publishEvent("startLoad", this.layer);
        
        // Launch request
        xhr.send();

        this.debug("after : "+this.getPoolsStatus());
        
        // check for another request
        this.checkPool();
    }
    

    /*************************************************************************************************************/

    OpenSearchRequestPool.prototype.manageFinishedRequest = function (xhr) {
        this.debug("[manageFinishedRequest]");
        
        if (this.resetMode === true) {
            console.log("manageFinishedRequest halt, reset mode");
            return;
        }

        this.debug("before : "+this.getPoolsStatus());

        // Get index of ended request
        var index = -1;
        for (var i=0;i<this.runningRequests.length;i++) {
            if (this.runningRequests[i].numRequest === xhr.numRequest) {
                index = i;
            }
        }

        // Remove the query
        if (index>=-1) {
            this.runningRequests.splice(index,1);
        }

        // Set it into pool
        this.freeRequests.push(xhr);

        this.debug("after : "+this.getPoolsStatus());

        this.checkPool();
    }

    /*************************************************************************************************************/

    /**
     * Check if query (based on bound) is still wanted (in pool or running)
     */

    OpenSearchRequestPool.prototype.isQueryStillWanted = function (key) {
        this.debug("[isQueryStillWanted]");
        for (var i=0;i<this.runningRequests.length;i++) {
            // Recheck if runningRequests is modified outside
            if (i<this.runningRequests.length) {
                if (this.runningRequests[i].key === key) {
                    return true;
                }

            }
        }
        for (var i=0;i<this.poolingRequests.length;i++) {
            // Recheck if poolingRequests is modified outside
            if (i<this.poolingRequests.length) {
                if (this.poolingRequests[i].key === key) {
                    return true;
                }

            }
        }
        return false;
    }

    /*************************************************************************************************************/

    /**
     * Reset the pool 
     */

    OpenSearchRequestPool.prototype.resetPool = function () {
        this.resetMode = true;
        this.debug("[resetPool]");
        this.removeRunningQueries();
        this.removePoolQueries();
        this.resetMode = false;
    }

    /*************************************************************************************************************/

    /**
     * Remove runnings queries
     */
    
    OpenSearchRequestPool.prototype.removeRunningQueries = function () {
        this.debug("[removeRunningQueries]");
        
        var xhr = this.runningRequests.pop();
        while ((xhr !== null) && (typeof xhr !== "undefined")) {
            xhr.abort();
            this.freeRequests.push(xhr);
            xhr = this.runningRequests.pop();
        }
    }

    /**
     * Remove pool queries
     */
    
    OpenSearchRequestPool.prototype.removePoolQueries = function () {
        this.debug("[removePoolQueries]");
        
        var xhr = this.poolingRequests.pop();
        while ((xhr !== null) && (typeof xhr !== "undefined")) {
            this.freeRequests.push(xhr);
            xhr = this.poolingRequests.pop();
        }
    }

    /*************************************************************************************************************/

    return OpenSearchRequestPool;
});
