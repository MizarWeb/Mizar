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
define(["./utils", "./abstractNode"], function(Utils, AbstractNode) {

    /**
     * Stores the name of the data implementation
     * @param {NodeList} childNode XML node
     * @param {String} name name of the data implementation
     * @exports AbstractData
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var AbstractData = function(childNode, name) {
        AbstractNode.prototype.constructor.call(this, childNode);
        this.name = name;
    };

    Utils.inherits(AbstractNode , AbstractData );

    AbstractData.prototype.getName = function() {
        return this.name;
    };

    return AbstractData;
});
