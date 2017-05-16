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
define(["./utils","./abstractNode"], function(Utils, AbstractNode) {

    /**
     * Creates a Description object.
     * @param {NodeList} childNode
     * @exports Description
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Description = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        this.value;
        var element = childNode.childNodes[0];
        if (element!= null && element.nodeType == 3) {
            this.value = (element.textContent == null) ? null : element.textContent.trim();
        }

    };

    Utils.inherits(AbstractNode , Description);

    /**
     * Returns the content.
     * @returns {!String} the content
     */
    Description.prototype.getContent = function() {
        return this.value;
    };


    return Description;
});