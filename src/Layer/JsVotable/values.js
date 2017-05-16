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
define(["./utils","./abstractNode","./min","./max","./option"], function(Utils, AbstractNode, Min, Max, Option) {

    /**
     * Constructs VALUES object.
     *
     * VALUES expresses the values that can be taken by the data in a column or by a parameter.
     *
     * @example <caption>Values schema</caption>
     * {@lang xml}
     * <xs:complexType name="Values">
     *  <xs:sequence>
     *      <xs:element name="MIN" type="Min" minOccurs="0"/>
     *      <xs:element name="MAX" type="Max" minOccurs="0"/>
     *      <xs:element name="OPTION" type="Option" minOccurs="0" maxOccurs="unbounded"/>
     *  </xs:sequence>
     *  <xs:attribute name="ID" type="xs:ID"/>
     *  <xs:attribute name="type" default="legal">
     *  <xs:simpleType>
     *      <xs:restriction base="xs:NMTOKEN">
     *          <xs:enumeration value="legal"/>
     *          <xs:enumeration value="actual"/>
     *      </xs:restriction>
     *  </xs:simpleType>
     *  </xs:attribute>
     *  <xs:attribute name="null" type="xs:token"/>
     *  <xs:attribute name="ref"  type="xs:IDREF"/>
     * </xs:complexType>
     *
     * @param {NodeList} childNode the VALUES node
     * @exports Values
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Values = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        var result = parseValuesTag(childNode);
        this.min = result[0];
        this.max = result[1];
        this.options = result[2];
    };


    /**
     * Parses the VALUES node.
     *
     * @param {NodeList} childNode the VALUES node
     * @returns {Object.<Min,Max,Option[]>} the values
     */
    var parseValuesTag = function(childNode) {
        var min;
        var max;
        var options = [];
        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                switch (nodeName) {
                    case "MIN":
                        min = new Min(element);
                        break;
                    case "MAX":
                        max = new Max(element);
                        break;
                    case "OPTION":
                        options.push(new Option(element));
                        break;
                    default:
                        this.getCache().addWarning("unknown element "+nodeName+" in Values node");
                }
            }
        }
        return [min, max, options];
    };

    Utils.inherits(AbstractNode , Values );

    /**
     * Returns the ID value of the attribute.
     * @returns {?String} ID value or null when no ID attribute.
     */
    Values.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the type value of the attribute.
     * type attribute can get the following values:
     * <ul>
     *     <li>legal</li>
     *     <li>actual</li>
     * </ul>
     * @returns {!String} the type value.
     */
    Values.prototype.type = function() {
        return this.attributes["type"];
    };

    /**
     * Returns the null value of the attribute.
     * @returns {?String} the null value or null when no null attribute.
     */
    Values.prototype.null = function() {
        return this.attributes["null"];
    };

    /**
     * Returns the ref value of the attribute.
     * @returns {?String} the ref value or null when no ref attribute.
     */
    Values.prototype.ref = function() {
        return this.attributes["ref"];
    };

    /**
     * Returns the Min object of the attribute.
     * @returns {?Min} the Min object or null when no Min node.
     */
    Values.prototype.getMin = function() {
        return this.min;
    };

    /**
     * Returns the Max object of the attribute.
     * @returns {?Max} the Max object or null when no Max node.
     */
    Values.prototype.getMax = function() {
        return this.max;
    };

    /**
     * Returns the list of Options objects.
     * 
     * Option is a sequence element of the Values node.
     * 
     * @returns {?Option[]} the list of Option objects or 0 length when no Option node.
     */
    Values.prototype.getOptions = function() {
        return this.options;
    };

    return Values;
});