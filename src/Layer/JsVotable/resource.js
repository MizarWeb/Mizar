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
define(["./utils","./abstractNode","./description","./info","./table","./link","./coosys","./param","./group"], 
    function(Utils, AbstractNode, Description, Info, Table, Link, Coosys, Param, Group) {

    /**
     * Constructs the Resource object.
     *
     * RESOURCES can contain DESCRIPTION, (INFO|PARAM|COSYS), LINK, TABLEs
     *
     * @example <caption>Resource schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Resource">
     *      <xs:sequence>
     *          <xs:element name="DESCRIPTION" type="anyTEXT" minOccurs="0"/>
     *          <xs:element name="INFO" type="Info" minOccurs="0" maxOccurs="unbounded"/>
     *          <xs:choice minOccurs="0" maxOccurs="unbounded">
     *              <xs:element name="COOSYS" type="CoordinateSystem"/><!-- Deprecated in V1.2 -->
     *              <xs:element name="GROUP" type="Group" />
     *              <xs:element name="PARAM" type="Param" />
     *          </xs:choice>
     *          <xs:sequence minOccurs="0" maxOccurs="unbounded">
     *              <xs:element name="LINK" type="Link" minOccurs="0" maxOccurs="unbounded"/>
     *              <xs:choice>
     *                  <xs:element name="TABLE" type="Table" />
     *                  <xs:element name="RESOURCE" type="Resource" />
     *              </xs:choice>
     *              <xs:element name="INFO" type="Info" minOccurs="0" maxOccurs="unbounded"/>
     *          </xs:sequence>
     *          <!-- Suggested Doug Tody, to include new RESOURCE types -->
     *          <xs:any namespace="##other" processContents="lax" minOccurs="0" maxOccurs="unbounded"/>
     *      </xs:sequence>
     *      <xs:attribute name="name" type="xs:token"/>
     *      <xs:attribute name="ID"   type="xs:ID"/>
     *      <xs:attribute name="utype" type="xs:string"/>
     *      <xs:attribute name="type" default="results">
     *          <xs:simpleType>
     *              <xs:restriction base="xs:NMTOKEN">
     *                  <xs:enumeration value="results"/>
     *                  <xs:enumeration value="meta"/>
     *              </xs:restriction>
     *          </xs:simpleType>
     *      </xs:attribute>
     *      <!-- Suggested Doug Tody, to include new RESOURCE attributes -->
     *      <xs:anyAttribute namespace="##other" processContents="lax"/>
     *  </xs:complexType>
     *  
     *  @example <caption>Get a table</caption>
     *  var listResourcesOrTable = resource.getResourcesOrTables();
     *  var resourceOrTable = listResourcesOrTable[0];
     *  var table = resourceOrTable["TABLE"];
     *
     * @param {NodeList} childNode The Resource node
     * @exports Resource
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Resource = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        var result = parseResource(childNode);
        this.description = result[0];
        this.infos = result[1];
        this.coosyss = result[2];
        this.params = result[3];
        this.groups = result[4];
        this.abstractSequences = result[5];
    };

    /**
     * Parses the Resource node.
     * @param {NodeList} childNode the Resource node
     * @returns {Object.<Description,Info[],Coosys[],Param[],Group[],Object>} an array of description, infos, coosyss, params, groups, abstractSequences
     */
    var parseResource = function(childNode) {
        var description;
        var infos = [];
        var coosyss = [];
        var groups = [];
        var params = [];
        var abstractSequences = [];
        var end = 0;
        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++) {
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                switch (nodeName) {
                    case "DESCRIPTION":
                        description = new Description(element);
                        break;
                    case "INFO":
                        infos.push(new Info(element));
                        break;
                    case "COOSYS":
                        coosyss.push(new Coosys);
                        break;
                    case "GROUP":
                        groups.push(new Group);
                        break;
                    case "PARAM":
                        params.push(new Param);
                        break;
                    default:
                        end = i;
                }
            }
            if (end!=0) {
                break;
            }
        }
        var seqElts = {};
        var seqLinks = [];
        var seqInfos = [];
        for(var i = end; childNode!=null && i< childNode.childNodes.length; i++) {
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                switch (nodeName) {
                    case "LINK":
                        if (seqElts.hasOwnProperty("TABLE") || seqElts.hasOwnProperty("RESOURCE")) {
                            seqElts["LINKS"] = seqLinks;
                            seqElts["INFOS"] = seqInfos;
                            abstractSequences.push(seqElts);
                            seqElts = {};
                            seqLinks = [];
                            seqInfos = [];
                        } else {
                            seqLinks.push(new Link(element));
                        }
                        break;
                    case "TABLE":
                        seqElts["TABLE"] = new Table(element);
                        break;
                    case "RESOURCE":
                        seqElts["RESOURCE"] = new Resource(element);
                        break;
                    case "INFO":
                        seqInfos.push(new Info(element));
                        break;
                    default:
                        this.getCache().addWarning("Unkknown element "+nodeName+" in RESOURCE node");
                }
            }
        }
        if(Object.keys(seqElts).length != 0) {
            abstractSequences.push(seqElts);
        }
        return [description, infos, coosyss, params, groups, abstractSequences];
    };

    Utils.inherits(AbstractNode , Resource );

    /**
     * Returns the ID value.
     * @returns {?String} the ID value or null when no ID attribute.
     */
    Resource.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the name value.
     * @returns {?String} the name value or null when no name attribute.
     */
    Resource.prototype.name = function() {
        return this.attributes["name"];
    };

    /**
     * Returns the utype value.
     * @returns {?String} the utype value or null when no utype attribute.
     */
    Resource.prototype.utype = function() {
        return this.attributes["utype"];
    };

    /**
     * Returns the type value.
     * @returns {?String} the type value or null when no type attribute.
     */
    Resource.prototype.type = function() {
        return this.attributes["type"];
    };

    /**
     * Returns the Description object.
     *
     * Description is one of the sequence element of the Resource node.
     *
     * @returns {?Description} the Description object or null when no Description node.
     */
    Resource.prototype.getDescription = function() {
        return this.description;
    };

    /**
     * Returns the list of Info objects.
     *
     * Info is one of the sequence element of the Resource node.
     *
     * @returns {?Info[]} the list of Info objects or 0 length when no Info node
     */
    Resource.prototype.getInfos = function() {
        return this.infos;
    };

    /**
     * Returns the list of Coosys objects.
     *
     * Coosys is one of the sequence element of the Resource node.
     *
     * @returns {?Coosys[]} the list of Coosys objects or 0 length when no Coosys value.
     */
    Resource.prototype.getCoosyss = function() {
        return this.coosyss;
    };

    /**
     * Returns the list of Group objects.
     *
     * Group is one of the sequence element of the Resource node.
     *
     * @returns {?Group[]} the list of Group objects or 0 length when no Group node.
     */
    Resource.prototype.getGroups = function() {
        return this.groups;
    };

    /**
     * Returns the list of Param objects.
     *
     * Param is one of the sequence element of the Resource node.
     *
     * @returns {?Param[]} the list of Param objects or 0 length when no Param node.
     */
    Resource.prototype.getParams = function() {
        return this.params;
    };

    /**
     * Returns the list of Resource or Table objects.
     * @returns {?Object.<Description,Info[],Coosys[],Param[],Group[],Resource[]|Table[]>} the list of Resource or Table objects
     */
    Resource.prototype.getResourcesOrTables = function() {
        return this.abstractSequences;
    };

    return Resource;
});
