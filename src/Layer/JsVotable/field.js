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
define(["./utils","./abstractNode","./description","./values","./link"], 
    function(Utils, AbstractNode, Description, Values, Link) {

    /**
     * Constructs the Field object.
     *
     * FIELD is the definition of what is in a column of the table.
     *
     * @example <caption>Field schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Field">
     *      <xs:sequence> <!-- minOccurs="0" maxOccurs="unbounded" -->
     *          <xs:element name="DESCRIPTION" type="anyTEXT" minOccurs="0"/>
     *          <xs:element name="VALUES" type="Values" minOccurs="0"/> <!-- maxOccurs="2" -->
     *          <xs:element name="LINK" type="Link" minOccurs="0" maxOccurs="unbounded"/>
     *      </xs:sequence>
     *      <xs:attribute name="ID" type="xs:ID"/>
     *      <xs:attribute name="unit" type="xs:token"/>
     *      <xs:attribute name="datatype" type="dataType" use="required"/>
     *      <xs:attribute name="precision" type="precType"/>
     *      <xs:attribute name="width" type="xs:positiveInteger"/>
     *      <xs:attribute name="xtype" type="xs:token"/>
     *      <xs:attribute name="ref" type="xs:IDREF"/>
     *      <xs:attribute name="name" type="xs:token" use="required"/>
     *      <xs:attribute name="ucd" type="ucdType"/>
     *      <xs:attribute name="utype" type="xs:string"/>
     *      <xs:attribute name="arraysize" type="xs:string"/>
     *      <xs:attribute name="type">
     *          <xs:simpleType>
     *              <xs:restriction base="xs:NMTOKEN">
     *                  <xs:enumeration value="hidden"/>
     *                  <xs:enumeration value="no_query"/>
     *                  <xs:enumeration value="trigger"/>
     *                  <xs:enumeration value="location"/>
     *              </xs:restriction>
     *          </xs:simpleType>
     *      </xs:attribute>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the FIELD node
     * @exports Field
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Field = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        var result = parseField(childNode);
        this.description = result[0];
        this.values = result[1];
        this.links = result[2];
    };

    /**
     * Parses the FIELD node.
     * @param {NodeList} childNode the FIELD node
     * @returns {Object.<Description,Values,Link[]>} an array of description, values, link
     */
    var parseField = function(childNode) {
        var description;
        var values;
        var links = [];
        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                switch (nodeName) {
                    case "DESCRIPTION":
                        description = new Description(element);
                        break;
                    case "VALUES":
                        values = new Values(element);
                        break;
                    case "LINK":
                        links.push(new Link(element));
                        break;
                    default:
                        this.getCache().addWarning("unknown element "+nodeName+" in Field node");
                }
            }
        }
        return [description, values, links];
    };

    Utils.inherits(AbstractNode , Field );

    /**
     * Returns the ID value.
     * @returns {?String} the ID value or null when no ID attribute.
     */
    Field.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the unit value.
     * @returns {?String} the unit value or null when no unit attribute.
     */
    Field.prototype.unit = function() {
        return this.attributes["unit"];
    };

    /**
     * Returns the datatype value.
     * @returns {!String} the datatype value
     */
    Field.prototype.datatype = function() {
        return this.attributes["datatype"];
    };

    /**
     * Returns the precision value.
     * @returns {?String} the precision value or null when no precision attribute.
     */
    Field.prototype.precision = function() {
        return this.attributes["precision"];
    };

    /**
     * Returns the width value.
     * @returns {?String} the width value or null when no width attribute.
     */
    Field.prototype.width = function() {
        return this.attributes["width"];
    };

    /**
     * Returns the xtype value.
     * @returns {?String} the xtype value or null when no xtype attribute.
     */
    Field.prototype.xtype = function() {
        return this.attributes["xtype"];
    };

    /**
     * Returns the ref value.
     * @returns {?String} the ref value or null when no ref attribute.
     */
    Field.prototype.ref = function() {
        return this.attributes["ref"];
    };

    /**
     * Returns the name value.
     * @returns {!String} the name value.
     */
    Field.prototype.name = function() {
        return this.attributes["name"];
    };

    /**
     * Returns the ucd value.
     * @returns {?String} the ucd value or null when no ucd attribute.
     */
    Field.prototype.ucd = function() {
        return this.attributes["ucd"];
    };

    /**
     * Returns the utype value.
     * @returns {?String} the utype value or null when no utype attribute.
     */
    Field.prototype.utype = function() {
        return this.attributes["utype"];
    };

    /**
     * Returns the arraysize value.
     * @returns {?String} the arraysize value or null when no arraysize attribute.
     */
    Field.prototype.arraysize = function() {
        return this.attributes["arraysize"];
    };

    /**
     * Returns the type value.
     * @returns {?String} the type value or null when no type attribute.
     */
    Field.prototype.type = function() {
        return this.attributes["type"];
    };

    /**
     * Returns the Description object
     * @returns {?Description} the Description object or null when no Description node.
     */
    Field.prototype.getDescription = function() {
        return this.description;
    };

    /**
     * Returns the Values object.
     * @returns {?Values} the Values object or null when no Values node.
     */
    Field.prototype.getValues = function() {
        return this.values;
    };

    /**
     * Returns the set of Link objects.
     * @returns {?Link} the set of Link objects or null when no Link node
     */
    Field.prototype.getLinks = function() {
        return this.links;
    };

    return Field;
});
