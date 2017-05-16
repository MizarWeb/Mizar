/*******************************************************************************
 * Copyright 2016 - Jean-Christophe Malapert
 *
 * This file is part of JsVotable.
 *
 * JsVotable is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * JsVotable is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JVotable.  If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/

define(function() {

    /**
     * Cache system for VOTable.
     * @exports Cache
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Cache = function () {
        this.nodeID = {};
        this.nodeName = {};
        this.warnings = [];
    };

    /**
     * Returns the cache of all nodes having an attribute ID.
     * @returns {Object.<String, AbstractNode>} the cache
     */
    Cache.prototype.getEltsByID = function() {
        return this.nodeID;
    };

    /**
     * Returns the cache of all nodes having an attribute name.
     * @returns {Object.<String, AbstractNode[]>} the cache
     */
    Cache.prototype.getEltsByName = function() {
        return this.nodeName;
    };

    /**
     * Returns the warnings.
     * @returns {String[]} the warnings
     */
    Cache.prototype.getWarnings = function() {
        return this.warnings;
    };

    /**
     * Add an entry to the cache.
     * @param {String} id the identifier of the VOTable element
     * @param {AbstractNode} node VOTable element
     */
    Cache.prototype.addEntryID = function(id, node) {
        this.nodeID[id] = node;
    };

    /**
     * Add an entry to the cache.
     * @param {String} name the identifier of the VOTable element
     * @param {AbstractNode} node VOTable element
     */
    Cache.prototype.addEntryName = function(name, node) {
        if(this.nodeName.hasOwnProperty(name)) {
            this.nodeName[name].push(node);
        } else {
            this.nodeName[name] = [];
            this.nodeName[name].push(node);
        }
    };

    /**
     * Stores a new warning;
     * @param warning warning
     */
    Cache.prototype.addWarning = function(warning) {
        this.warnings.push(warning);
    };

    return Cache;
});
