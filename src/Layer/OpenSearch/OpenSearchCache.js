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
      var OpenSearchCache = function () {
        this.maxTiles = 120;
        this.tileArray = [];

        this.debugMode = false;

        this.debug("[New] "+this.getCacheStatus());
    };

    /**************************************************************************************************************/

    OpenSearchCache.prototype.init = function () {
    }

    /**************************************************************************************************************/

    OpenSearchCache.prototype.debug = function (message) {
        if (this.debugMode === true) {
            console.log("Cache:"+message);
        }
    }

    /**************************************************************************************************************/

    OpenSearchCache.prototype.getCacheStatus = function () {
        var message = "";
        message += "Cache : "+this.tileArray.length+"/"+this.maxTiles+ " (size:"+this.getSize()+")";
        return message;
    }
    /*************************************************************************************************************/

    /**
     * Get bound key
     */
    OpenSearchCache.prototype.getKey = function (bound) {
        var key = bound.north+":"+bound.east+":"+bound.south+":"+bound.west;
        return key;
    }
    
    /*************************************************************************************************************/

    /**
     * Get array bound key
     */
    OpenSearchCache.prototype.getArrayBoundKey = function (tiles) {
        var key = "";
        if ((tiles === null) || (typeof tiles === "undefined")) {
            return "";
        }
        for (var i=0;i<tiles.length;i++) {
            key += this.getKey(tiles[i].bound);
        }
        return key;
    }
    
    /*************************************************************************************************************/

    /**
     * Get tile cache size (in term of number of features)
     */
    OpenSearchCache.prototype.getTileSize = function (tile) {
       return tile.features.length; 
    }    

    /*************************************************************************************************************/

    /**
     * Get cache size (in term of number of features)
     */
    OpenSearchCache.prototype.getSize = function () {
        var nb = 0;
        for (var i=0;i<this.tileArray.length;i++) {
            nb += this.getTileSize(this.tileArray[i]);
        }
        return nb; 
     }    
     
    /*************************************************************************************************************/

    /**
     * Add a tile to the cache
     */
    OpenSearchCache.prototype.addTile = function (bound,features) {
        this.debug("[addTile]"+this.getCacheStatus());

        var key = this.getKey(bound);
        var tile = {
            "key": key,
            "features" : features
        };
        // If cache is full, remove first element
        if (this.tileArray.length === this.maxTiles) {
            this.debug("Cache full, remove oldest");
            this.tileArray.splice(0,1);
        }
        this.tileArray.push(tile);
    }

    /*************************************************************************************************************/

    /**
     * Update a tile to the cache
     */
    OpenSearchCache.prototype.updateTile = function (tile,features) {
        this.debug("[update]"+this.getCacheStatus());

        tile.features = tile.features.concat(features);
    }


    /*************************************************************************************************************/

    /**
     * Get a tile from the cache
     */
    OpenSearchCache.prototype.getTile = function (bound) {
        this.debug("[getTile]"+this.getCacheStatus());

        var key = this.getKey(bound);

        
        for (var i=0;i<this.tileArray.length;i++) { // TODO : try in reverse order, best performance ?
            if (this.tileArray[i].key === key) {
                return this.tileArray[i].features;
            }
        }
        return null;
    }

    /*************************************************************************************************************/
    
    OpenSearchCache.prototype.reset = function () {
        this.debug("[reset]");
        this.tileArray.length = 0;
    }

    /*************************************************************************************************************/

    return OpenSearchCache;
});
