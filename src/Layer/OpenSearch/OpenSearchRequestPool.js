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
define(["../../Utils/Constants","../../Gui/dialog/ErrorDialog","../../Utils/Proxy"], function(Constants, ErrorDialog, Proxy) {
    /**
     * @name OpenSearchRequestPool
     * @class
     * This class manages the request pool of OpenSearch
     * @memberof module:Layer
     */
    var OpenSearchRequestPool = function() {
        this.maxRunningRequests = 4;
        this.maxPoolingRequests = 50;

        // Running requests
        this.runningRequests = [];

        // Atomic management when reseting
        this.resetMode = false;

        // Pooling requests
        this.freeRequests = [];
        this.poolingRequests = [];

        this.layers = [];

        // Build all free requests
        for (var i = 0; i < this.maxPoolingRequests; i++) {
            var xhr = new XMLHttpRequest();
            xhr.numRequest = i;
            this.freeRequests.push(xhr);
        }

        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "[New] " + this.getPoolsStatus());
    };

    /**************************************************************************************************************/

    /**
     * Return the pool status
     * @function getPoolStatus
     * @memberof OpenSearchRequestPool#
     * @return {string} Pool status
     */

    OpenSearchRequestPool.prototype.getPoolsStatus = function() {
        var message = "";
        message +=
            "Run : " +
            this.runningRequests.length +
            "/" +
            this.maxRunningRequests +
            " , ";
        message +=
            "Wait : " +
            this.poolingRequests.length +
            "/" +
            this.maxPoolingRequests;
        return message;
    };

    /**************************************************************************************************************/

    /**
     * Get a free request
     * @function getFreeRequest
     * @memberof OpenSearchRequestPool#
     * @return {Object} Free request
     */

    OpenSearchRequestPool.prototype.getFreeRequest = function() {
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "[getFreeRequest]");

        if (this.freeRequests.length === 0) {
            // Take oldest request in pool and use it
            var xhr = this.poolingRequests.splice(0, 1)[0];
            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "Oldest pooling request cancel and reused");
            return xhr;
        } else {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "Take one request from pool");
            return this.freeRequests.pop();
        }
    };

    /**************************************************************************************************************/

    /**
     * Add a query to the pool
     *  Note : Query is ALWAYS ADDED at the end of the pool, the it's a FILO queue
     * @function addQuery
     * @memberof OpenSearchRequestPool#
     * @param {string} url Url query to get
     * @param {Tile} tile Tile associated with the query
     * @param {Layer} layer
     */
    OpenSearchRequestPool.prototype.addQuery = function(url, tile, layer) {
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "[addQuery]");
        if (this.resetMode === true) {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "addQuery halt, reset mode");
            return;
        }

        var key = layer.cache.getKey(tile);

        // Add layer to list
        if (typeof this.layers[layer.getID()] === "undefined") {
            this.layers[layer.getID()] = layer;
        }

        // First check if query is style wanted
        if (this.isQueryStillWanted(key, layer.getID())) {
            // Query still in pool or running, so do not add it again
            return;
        }

        // get query slot
        var xhr = this.getFreeRequest();

        // set value for managing
        var self = this;

        // Associate the key
        xhr.key = key;
        xhr.layer = layer;

        xhr.onreadystatechange = function(e) {
            var i, feature;
            var response;
            var alreadyAdded;
            if (xhr.readyState === 4) {
                if (xhr.status === 200 && xhr.response !== null) {
                    response = JSON.parse(xhr.response);
                    var nbFound = xhr.layer.result.parseResponse(response);
                    //xhr.layer.cache.addTile(tile,response.features,nbFound);
                    xhr.layer.manageFeaturesResponse(response.features, tile);
                    if (!xhr.layer._isTileLoaded(xhr.layer.tilesLoaded, key)) {
                        xhr.layer.tilesLoaded.push({
                            key: key,
                            tile: tile
                        });
                    }                    
                } else if (xhr.status >= 400) {
                    //tileData.complete = true;
                    ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", xhr.responseText);
                    return;
                }

                self.manageFinishedRequest(xhr);

                // Publish event that layer have received new features
                if (
                    response !== undefined &&
                    response.features !== null &&
                    response.features.length > 0
                ) {
                    xhr.layer
                        .getGlobe()
                        .publishEvent(Constants.EVENT_MSG.FEATURED_ADDED, {
                            layer: xhr.layer,
                            features: response.features
                        });
                }
            }
        };
        xhr.open("GET", Proxy.proxify(url));
        xhr.setRequestHeader("Accept", "application/json");

        // Add request to pooling (last position)
        this.poolingRequests.push(xhr);

        // Check if request can be done
        this.checkPool();
    };

    /**
     * Check for each layer if there is remaining load needed
o     * Check if there is any remaining query in the pool 
     * @function checkPool
     * @memberof OpenSearchRequestPool#
     */
    OpenSearchRequestPool.prototype.checkEachLayerFinished = function() {
        for (var key in this.layers) {
            var current = this.layers[key];
            for (var i = 0; i < this.runningRequests.length; i++) {
                if (
                    typeof this.runningRequests[i].layer !== "undefined" &&
                    this.runningRequests[i].layer.getID() === key
                ) {
                    return;
                }
            }
            for (i = 0; i < this.poolingRequests.length; i++) {
                if (
                    typeof this.poolingRequests[i].layer !== "undefined" &&
                    this.poolingRequests[i].layer.getID() === key
                ) {
                    return;
                }
            }
            // no request running, stop ihm indicator
            current
                .getGlobe()
                .publishEvent(Constants.EVENT_MSG.LAYER_END_LOAD, current);
        }
    };

    /**************************************************************************************************************/

    /**
     * Check if there is any remaining query in the pool
     * @function checkPool
     * @memberof OpenSearchRequestPool#
     */
    OpenSearchRequestPool.prototype.checkPool = function() {
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "[checkPool]" + this.getPoolsStatus());

        if (this.resetMode === true) {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "checkPool halt, reset mode");
            return;
        }

        if (this.runningRequests.length === this.maxRunningRequests) {
            // Running pool is full, wait for a free slot
            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "no running slot available, wait");
            return;
        }

        this.checkEachLayerFinished();

        // There is at least one slot free
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "before : " + this.getPoolsStatus());

        // Remove it from pool
        var xhr = this.poolingRequests.pop();

        if (typeof xhr !== "undefined") {
            // Place it into running
            this.runningRequests.push(xhr);

            // Start ihm indicator
            xhr.layer.getGlobe().publishEvent(Constants.EVENT_MSG.LAYER_START_LOAD, xhr.layer);

            // Launch request
            xhr.send();

            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "after : " + this.getPoolsStatus());

            // check for another request
            this.checkPool();
        }
    };

    /**************************************************************************************************************/

    /**
     * Manage data returned by a query
     * @function manageFinishedRequest
     * @memberof OpenSearchRequestPool#
     * @param {Object} xhr Query
     */
    OpenSearchRequestPool.prototype.manageFinishedRequest = function(xhr) {
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "[manageFinishedRequest]");
        if (this.resetMode === true) {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "manageFinishedRequest halt, reset mode");
            return;
        }
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "before : " + this.getPoolsStatus());

        // Get index of ended request
        var index = -1;
        for (var i = 0; i < this.runningRequests.length; i++) {
            if (this.runningRequests[i].numRequest === xhr.numRequest) {
                index = i;
            }
        }

        // Remove the query
        if (index >= -1) {
            this.runningRequests.splice(index, 1);
        }

        // Set it into pool
        this.freeRequests.push(xhr);

        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "after : " + this.getPoolsStatus());

        this.checkPool();
    };

    /**************************************************************************************************************/

    /**
     * Check if query (based on bound) is still wanted (in pool or running)
     * @function isQueryStillWanted
     * @memberof OpenSearchRequestPool#
     * @param {string} key Key of the query
     * @return {Boolean} true if query is still in pool
     */
    OpenSearchRequestPool.prototype.isQueryStillWanted = function(key,layerID) {
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "[isQueryStillWanted]");
        for (var i = 0; i < this.runningRequests.length; i++) {
            // Recheck if runningRequests is modified outside
            if (
                typeof this.runningRequests[i] !== "undefined" &&
                this.runningRequests[i].key === key &&
                this.runningRequests[i].layer.getID() === layerID
            ) {
                return true;
            }
        }
        for (i = 0; i < this.poolingRequests.length; i++) {
            // Recheck if poolingRequests is modified outside
            if (
                typeof this.poolingRequests[i] !== "undefined" &&
                this.poolingRequests[i].key === key
            ) {
                return true;
            }
        }
        return false;
    };

    /**************************************************************************************************************/

    /**
     * Reset the pool
     * @function reset
     * @memberof OpenSearchRequestPool#
     */
    OpenSearchRequestPool.prototype.resetPool = function() {
        this.resetMode = true;
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "[resetPool]");
        this.removeRunningQueries();
        this.removePoolQueries();
        this.resetMode = false;
    };

    /**************************************************************************************************************/

    /**
     * Remove running queries
     * @function removeRunningQueries
     * @memberof OpenSearchRequestPool#
     */
    OpenSearchRequestPool.prototype.removeRunningQueries = function() {
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "[removeRunningQueries]");
        var xhr = this.runningRequests.pop();
        while (xhr !== null && typeof xhr !== "undefined") {
            xhr.abort();
            this.freeRequests.push(xhr);
            xhr = this.runningRequests.pop();            
        }
    };

    /**************************************************************************************************************/

    /**
     * Remove pool queries
     * @function removePoolQueries
     * @memberof OpenSearchRequestPool#
     */
    OpenSearchRequestPool.prototype.removePoolQueries = function() {
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchRequestPool", "[removePoolQueries]");
        var xhr = this.poolingRequests.pop();
        while (xhr !== null && typeof xhr !== "undefined") {
            this.freeRequests.push(xhr);
            xhr = this.poolingRequests.pop();
        }
    };

    /*************************************************************************************************************/

    return OpenSearchRequestPool;
});
