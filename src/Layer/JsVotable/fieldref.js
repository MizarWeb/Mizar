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
     * Construct the Fieldref object.
     *
     * @example <caption>Fieldref schema</caption>
     * {@lang xml}
     *  <xs:complexType name="FieldRef">
     *      <xs:attribute name="ref" type="xs:IDREF" use="required"/>
     *      <xs:attribute name="ucd"  type="ucdType"/>
     *      <xs:attribute name="utype" type="xs:string"/>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the FieldRef node
     * @exports Fieldref
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Fieldref = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
    };

    Utils.inherits(AbstractNode , Fieldref );

    /**
     * Returns the ref value.
     * this attribute is required.
     * @returns {!String} the ref value
     */
    Fieldref.prototype.ref = function() {
        return this.attributes["ref"];
    };

    /**
     * Returns the ucd value.
     * @returns {?String} the ucd value or null when no ucd attribute.
     */
    Fieldref.prototype.ucd = function() {
        return this.attributes["ucd"];
    };

    /**
     * Returns the utype value.
     * @returns {?String} the utype value or null when no utype attribute.
     */
    Fieldref.prototype.utype = function() {
        return this.attributes["utype"];
    };

    return Fieldref;
});