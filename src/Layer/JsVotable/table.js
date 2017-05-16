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
define(["./utils", "./abstractNode", "./description", "./field", "./param", "./group", "./link", "./data", "./info"],
    function(Utils, AbstractNode, Description, Field, Param, Group, Link, Data, Info) {

    /**
     * Constructs the Table object.
     *
     * A TABLE is a sequence of FIELD/PARAMs and LINKS and DESCRIPTION, possibly followed by a DATA section
     *
     * @example <caption>Table schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Table">
     *      <xs:sequence>
     *          <xs:element name="DESCRIPTION" type="anyTEXT" minOccurs="0"/>
     *          <xs:element name="INFO" type="Info" minOccurs="0" maxOccurs="unbounded"/>
     *          <xs:choice minOccurs="1" maxOccurs="unbounded">
     *              <xs:element name="FIELD" type="Field"/>
     *              <xs:element name="PARAM" type="Param"/>
     *              <xs:element name="GROUP" type="Group"/>
     *          </xs:choice>
     *          <xs:element name="DATA" type="Data" minOccurs="0"/>
     *          <xs:element name="INFO" type="Info" minOccurs="0" maxOccurs="unbounded"/>
     *      </xs:sequence>
     *      <xs:attribute name="ID"   type="xs:ID"/>
     *      <xs:attribute name="name" type="xs:token"/>
     *      <xs:attribute name="ref"  type="xs:IDREF"/>
     *      <xs:attribute name="ucd"  type="ucdType"/>
     *      <xs:attribute name="utype" type="xs:string"/>
     *      <xs:attribute name="nrows" type="xs:nonNegativeInteger"/>
     *  </xs:complexType>
     * @param {NodeList} childNode the Table node
     * @exports Table
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Table = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);

        var result = parseTable(childNode);
        this.fields = result[0];
        this.params = result[1];
        this.groups = result[2];
        this.links = result[3];
        this.data = result[4];
        this.description = result[5];
        this.infos = result[6];
    };

    /**
     * Parses the Table node.
     * @param {NodeList} childNodes the Table node
     * @returns {Object.<Field[],Param[],Group[],Link[],Data,Description,Info[]>} an array of fields, params, groups, links, data, description, infos
     */
    var parseTable = function(childNodes) {
        var fields = [];
        var params = [];
        var groups = [];
        var links = [];
        var data;
        var description;
        var infos = [];
        for(var i = 0; childNodes!=null && i< childNodes.childNodes.length; i++){
            var element = childNodes.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                switch (nodeName) {
                    case "DESCRIPTION":
                        description = new Description(element);
                        break;
                    case "FIELD":
                        fields.push(new Field(element));
                        break;
                    case "PARAM":
                        params.push(new Param(element));
                        break;
                    case "GROUP":
                        groups.push(new Group(element));
                        break;
                    case "LINK":
                        links.push(new Link(element));
                        break;
                    case "DATA":
                        data = new Data(element);
                        break;
                    case "INFO":
                        infos.push(new Info(element));
                        break;
                    default:
                        this.getCache().addWarning("unknown element "+nodeName+" in Table node");
                }
            }
        }
        return [fields, params, groups, links, data, description, infos];
    };

    Utils.inherits(AbstractNode , Table );

    /**
     * Returns the ID value of the attribute.
     * @returns {?String} the ID value or null when no ID attribute.
     */
    Table.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the name value of the attribute.
     * @returns {?String} the name value or null when no name attribute.
     */
    Table.prototype.name = function() {
        return this.attributes["name"];
    };

    /**
     * Returns the ref value of the attribute.
     * @returns {?String} the ref value or null when no ref attribute.
     */
    Table.prototype.ref = function() {
        return this.attributes["ref"];
    };

    /**
     * Returns the ucd value of the attribute.
     * @returns {?String} the ucd value or null when no ucd attribute.
     */
    Table.prototype.ucd = function() {
        return this.attributes["ucd"];
    };

    /**
     * Returns the utype value of the attribute.
     * @returns {?String} the utype value or null when no utype attribute.
     */
    Table.prototype.utype = function() {
        return this.attributes["utype"];
    };

    /**
     * Returns the nrows value of the attribute.
     * @returns {?String} the nrows value or null when no nrows attribute.
     */
    Table.prototype.nrows = function() {
        return this.attributes["nrows"];
    };

    /**
     * Returns the list of Field objects.
     *
     * Field is one of the sequence element of the Table node.
     *
     * @returns {!Field[]} the list of Field objects or 0 length when no Field node.
     */
    Table.prototype.getFields = function() {
        return this.fields
    };

    /**
     * Returns the list of Param objects.
     *
     * Param is one of the sequence element of the Table node.
     *
     * @returns {!Param[]} the list of Param objects
     */
    Table.prototype.getParams = function() {
        return this.params;
    };

    /**
     * Returns the list of Group objects.
     *
     * Group is one of the sequence element of the Table node.
     *
     * @returns {!Group[]} the list of Group objects
     */
    Table.prototype.getGroups = function() {
        return this.groups;
    };

    /**
     * Returns the list of Link objects.
     *
     * Link is one of the sequence element of the Table node.
     *
     * @returns {?Link[]} the list of Link objects or 0 length when no Link node
     */
    Table.prototype.getLinks = function() {
        return this.links;
    };

    /**
     * Returns the Data object
     *
     * Data is one of the sequence element of the Table node.
     *
     * @returns {?Data} the Data object or null when no Data node.
     */
    Table.prototype.getData = function() {
        return this.data;
    };

    /**
     * Returns the list of Info objects.
     *
     * Info is one of the sequence element of the Table node.
     *
     * @returns {?Info[]} the list of Info objects or 0 length when non Info node.
     */
    Table.prototype.getInfos = function() {
        return this.infos;
    };

    /**
     * Returns the description.
     *
     * Description is one of the sequence element of the Table node.
     *
     * @returns {string} the description.
     */
    Table.prototype.getDescription = function() {
        return this.description;
    };

    return Table;
});
