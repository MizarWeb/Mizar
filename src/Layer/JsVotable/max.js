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
     * Constructs the Max object
     *
     * @example <caption>Max schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Max">
     *      <xs:attribute name="value" type="xs:string" use="required"/>
     *      <xs:attribute name="inclusive" type="yesno" default="yes"/>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the Max node
     * @exports Max
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Max = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
    };

    Utils.inherits(AbstractNode , Max );

    /**
     * Returns the value value.
     * @returns {!String} the value value.
     */
    Max.prototype.value = function() {
        return this.attributes["value"];
    };

    /**
     * Returns the inclusive value.
     * @returns {?String} the inclusive value or null when no inclusive attribute.
     */
    Max.prototype.inclusive = function() {
        return this.attributes["inclusive"];
    };

    return Max;
});