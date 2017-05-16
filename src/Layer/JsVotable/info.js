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
     * Constructs the Info object.
     *
     * @example <caption>Info schema</caption>
     * {@lang xml}
     * <xs:complexType name="Info">
     *      <xs:simpleContent>
     *          <xs:extension base="xs:string">
     *              <xs:attribute name="ID" type="xs:ID"/>
     *              <xs:attribute name="name"  type="xs:token" use="required"/>
     *              <xs:attribute name="value" type="xs:string" use="required"/>
     *              <xs:attribute name="unit"  type="xs:token"/>
     *              <xs:attribute name="xtype" type="xs:token"/>
     *              <xs:attribute name="ref"   type="xs:IDREF"/>
     *              <xs:attribute name="ucd"   type="ucdType"/>
     *              <xs:attribute name="utype" type="xs:string"/>
     *          </xs:extension>
     *      </xs:simpleContent>
     *  </xs:complexType>
     * @param {NodeList} childNode the Info node
     * @exports Info
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Info = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        var element = childNode.childNodes[0];
        if (element!=null && element.nodeType == 3) {
            this.value = (element.textContent == null) ? null : element.textContent.trim();
        }
    };

    /**
     * Returns the name value.
     * @returns {!String} the name value
     */
    Info.prototype.name = function() {
        return this.attributes["name"];
    };

    /**
     * Returns the value value.
     * @returns {!String} the value value
     */
    Info.prototype.value = function() {
        return this.attributes["value"];
    };

    /**
     * Returns the ID value.
     * @returns {?String} the ID value or null when no ID attribute.
     */
    Info.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the unit value.
     * @returns {?String} the unit value or null when no unit attribute.
     */
    Info.prototype.unit = function() {
        return this.attributes["unit"];
    };

    /**
     * Returns the xtype value.
     * @returns {?String} the xtype value or null when no xtype attribute.
     */
    Info.prototype.xtype = function() {
        return this.attributes["xtype"];
    };

    /**
     * Returns the ref value.
     * @returns {?String} the ref value or null when no ref attribute.
     */
    Info.prototype.ref = function() {
        return this.attributes["ref"];
    };

    /**
     * Returns the ucd value.
     * @returns {?String} the ucd value or null when no ucd attribute.
     */
    Info.prototype.ucd = function() {
        return this.attributes["ucd"];
    };

    /**
     * Returns the utype value.
     * @returns {?String} the utype value or null when no utype attribute.
     */
    Info.prototype.utype = function() {
        return this.attributes["utype"];
    };

    /**
     * Returns the content of INFO node.
     * @returns {?String} the content of INFO node
     */
    Info.prototype.getContent = function() {
        return this.value;
    };

    return Info;
});