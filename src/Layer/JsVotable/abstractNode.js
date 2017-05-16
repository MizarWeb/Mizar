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

define(["./utils", "./cache"], function(Utils, Cache) {

    /**
     * Abstract node.
     *
     * Parses the attributes.
     *
     * @param {NodeList} childNode XML node
     * @exports AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var AbstractNode = function(childNode) {
        this.attributes = {};
        if (childNode!=null && childNode.nodeType == 1) {
            for(var i = 0, l = childNode.attributes.length; i < l; i++) {
                var attribute = childNode.attributes[i];
                this.attributes[attribute.name] = attribute.value;
            }
            if (this.attributes.hasOwnProperty("ID")) {
                var cache = Singleton.getInstance();
                cache.addEntryID(this.attributes["ID"], this);
            }
            if (this.attributes.hasOwnProperty("name")) {
                var cache = Singleton.getInstance();
                cache.addEntryName(this.attributes["name"], this);
            }
        }
    };

    /**
     * Returns the attributes of a tag.
     * @returns {String[]} the attributes
     */
    AbstractNode.prototype.getAttributes = function() {
        return this.attributes;
    };

    /**
     * Checks if the tag has the "name" as attribute
     * @param name the attribute name to test
     * @returns {boolean} true when the attribute is defined otherwose false
     */
    AbstractNode.prototype.hasAttribute = function(name) {
        return this.attributes.hasOwnProperty(name);
    };

    /**
     * Checks if the tag has attributes
     * @returns {boolean} true when the tag has at least one attribute otherwise false.
     */
    AbstractNode.prototype.hasAttributes = function() {
        return (Object.keys(this.attributes).length == 0) ? false : true;
    };

    /**
     * Returns the cache.
     * @returns {Cache}
     */
    AbstractNode.prototype.getCache = function() {
        return Singleton.getInstance();
    };

    /**
     * Creates a singeton for the cache.
     * @type {{getInstance}}
     */
    var Singleton = (function () {
        var instance;

        function createInstance() {
            var object = new Cache();
            return object;
        }

        return {
            getInstance: function () {
                if (!instance) {
                    instance = createInstance();
                }
                return instance;
            }
        };
    })();

    return AbstractNode;
});