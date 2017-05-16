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

define(["./utils","./abstractNode","./description","./fieldref","./paramref","./param"],
    function(Utils, AbstractNode, Description, Fieldref, Paramref, Param) {

    /**
     * Constructs the Group object.
     *
     * @example <caption>Group schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Group">
     *      <xs:sequence>
     *          <xs:element name="DESCRIPTION" type="anyTEXT" minOccurs="0"/>
     *          <xs:choice minOccurs="0" maxOccurs="unbounded">
     *              <xs:element name="FIELDref" type="FieldRef"/>
     *              <xs:element name="PARAMref" type="ParamRef"/>
     *              <xs:element name="PARAM" type="Param"/>
     *              <xs:element name="GROUP" type="Group"/>
     *          </xs:choice>
     *      </xs:sequence>
     *      <xs:attribute name="ID"   type="xs:ID"/>
     *      <xs:attribute name="name" type="xs:token"/>
     *      <xs:attribute name="ref"  type="xs:IDREF"/>
     *      <xs:attribute name="ucd"  type="ucdType"/>
     *      <xs:attribute name="utype" type="xs:string"/>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the GROUP node
     * @exports Group
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Group = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        var result = parseGroup(childNode);
        this.description = result[0];
        this.fieldrefs = result[1];
        this.paramrefs = result[2];
        this.params = result[3];
        this.groups = result[4];
    };

    /**
     * Parses the GROUP node.
     * @param childNode the GROUP node
     * @returns {Object.<Description, Fieldref[], Paramref[], Param[], Group[]>} An array of description, fieldrefs, paramrefs, params, groups
     */
    var parseGroup = function(childNode) {
        var description;
        var fieldrefs = [];
        var paramrefs = [];
        var params = [];
        var groups = [];

        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                switch (nodeName) {
                    case "DESCRIPTION":
                        description = new Description(element);
                        break;
                    case "FIELDref":
                        fieldrefs.push(new Fieldref(element));
                        break;
                    case "PARAMref":
                        paramrefs.push(new Paramref(element));
                        break;
                    case "PARAM":
                        params.push(new Param(element));
                        break;
                    case "GROUP":
                        groups.push(new Group(element));
                        break;
                    default:
                        this.getCache().addWarning("unknown element "+nodeName+" in Group node");
                }
            }
        }
        return [description, fieldrefs, paramrefs, params, groups];

    };

    Utils.inherits(AbstractNode , Group );

    /**
     * Returns the ID value.
     * @returns {?String} the ID value or null when no ID attribute.
     */
    Group.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the name value.
     * @returns {?String} the name value or null when no name attribute.
     */
    Group.prototype.name = function() {
        return this.attributes["name"];
    };

    /**
     * Returns the ref value.
     * @returns {?String} the ref value or null when no ref attribute.
     */
    Group.prototype.ref = function() {
        return this.attributes["ref"];
    };

    /**
     * Returns the ucd value.
     * @returns {?String} the ucd value or null when no ucd attribute.
     */
    Group.prototype.ucd = function() {
        return this.attributes["ucd"];
    };

    /**
     * Returns the utype value.
     * @returns {?String} the utype value or null when no utype attribute.
     */
    Group.prototype.utype = function() {
        return this.attributes["utype"];
    };

    /**
     * Returns the Description object.
     * @returns {?Description} the Description object or null when no Description node.
     */
    Group.prototype.getDescription = function() {
        return this.description;
    };

    /**
     * Returns the set of Fieldref objects.
     * @returns {?Fieldref[]} the set of Fieldref objects or 0 length when no Fieldref node.
     */
    Group.prototype.getFieldrefs = function() {
        return this.fieldrefs;
    };

    /**
     * Returns the set of Paramref objects.
     * @returns {?Paramref[]} the set of Paramref objects or 0 length when no Paramref node.
     */
    Group.prototype.getParamrefs = function() {
        return this.paramrefs;
    };

    /**
     * Returns the set of Param objects.
     * @returns {?Param[]} the set of Param objects or 0 length when no Param node.
     */
    Group.prototype.getParams = function() {
        return this.params;
    };

    /**
     * Returns the set of Group objects.
     * @returns {?Group[]} the set of Group objects or 0 length when non Group node.
     */
    Group.prototype.getGroups = function() {
        return this.groups;
    };

    return Group;
});
