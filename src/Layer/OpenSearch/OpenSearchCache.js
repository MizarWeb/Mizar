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
define(["underscore-min","../../Utils/Constants", "../../Gui/dialog/ErrorDialog"], function(_, Constants, ErrorDialog) {
    /**
     * @name OpenSearchCache
     * @class
     * Manage the OpenSearch cache
     * @memberof module:Layer
     */

    var OpenSearchCache = function() {
        this.maxTiles = 120;
        this.tileArray = [];
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchCache", "[New] " + this.getCacheStatus());
    };

    /**************************************************************************************************************/

    /**
     * Get cache status
     * @function getCacheStatus
     * @memberof OpenSearchCache#
     * @return {string} Status
     */

    OpenSearchCache.prototype.getCacheStatus = function() {
        var message = "";
        message +=
            "Cache : " +
            this.tileArray.length +
            "/" +
            this.maxTiles +
            " (size:" +
            this.getSize() +
            ")";
        return message;
    };


    /*************************************************************************************************************/

    /**
     * Get tile cache size (in term of number of features)
     * @function getTileSize
     * @memberof OpenSearchCache#
     * @param {Tile} tile Tile
     * @return {Integer} Number of features associated to the tile
     */

    OpenSearchCache.prototype.getTileSize = function(tile) {
        return tile.features.length;
    };

    /*************************************************************************************************************/

    /**
     * Get cache size (in term of number of features)
     * @function getSize
     * @memberof OpenSearchCache#
     * @return {Integer} Number of features associated to the cache
     */

    OpenSearchCache.prototype.getSize = function() {
        var nb = 0;
        for (var i = 0; i < this.tileArray.length; i++) {
            nb += this.getTileSize(this.tileArray[i]);
        }
        return nb;
    };


    OpenSearchCache.prototype.storeInCache = function(url, features, total) {
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchCache", "[addTile]" + this.getCacheStatus());

        var myTile = {
            key: url,
            features: features.slice(),
            total: total
        };
        // If cache is full, remove first element
        if (this.tileArray.length === this.maxTiles) {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchCache", "Cache full, remove oldest");
            this.tileArray.splice(0, 1);
        }
        this.tileArray.push(myTile);
    };

    OpenSearchCache.prototype.getCacheFromKey = function(url){
        var result =_.find(this.tileArray, function(tile) {
            return tile.key === url;
        });
        return (result === undefined) ? null: Object.assign({}, result);
    };


    /*************************************************************************************************************/

    /**
     * Reset the cache
     * @function reset
     * @memberof OpenSearchCache#
     */

    OpenSearchCache.prototype.reset = function() {
        ErrorDialog.open(Constants.LEVEL.DEBUG, "OpenSearchCache", "[reset]");
        this.tileArray.length = 0;
    };

    /*************************************************************************************************************/

    return OpenSearchCache;
});
