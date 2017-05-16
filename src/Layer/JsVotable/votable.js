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

define(["./utils","./abstractNode", "./definitions","./info","./resource", "./description","./coosys","./group","./param","./converter/geojson"],
    function(Utils, AbstractNode, Definitions, Info, Resource, Description, Coosys, Group, Param, GeoJson) {

    /**
     * Contructs a Votable object.
     *
     * @example <caption>VOTable schema</caption>
     * {@lang xml}
     * <xs:element name="VOTABLE">
     *      <xs:complexType>
     *          <xs:sequence>
     *              <xs:element name="DESCRIPTION" type="anyTEXT" minOccurs="0"/>
     *              <xs:element name="DEFINITIONS" type="Definitions" minOccurs="0"/><!-- Deprecated -->
     *                  <xs:choice minOccurs="0" maxOccurs="unbounded">
     *                      <xs:element name="COOSYS" type="CoordinateSystem"/><!-- Deprecated in V1.2 -->
     *                      <xs:element name="GROUP" type="Group" />
     *                      <xs:element name="PARAM" type="Param" />
     *                      <xs:element name="INFO" type="Info" minOccurs="0" maxOccurs="unbounded"/>
     *                  </xs:choice>
     *              <xs:element name="RESOURCE" type="Resource" minOccurs="1" maxOccurs="unbounded"/>
     *              <xs:element name="INFO" type="Info" minOccurs="0" maxOccurs="unbounded"/>
     *          </xs:sequence>
     *          <xs:attribute name="ID" type="xs:ID"/>
     *          <xs:attribute name="version">
     *              <xs:simpleType>
     *                  <xs:restriction base="xs:NMTOKEN">
     *                      <xs:enumeration value="1.3"/>
     *                  </xs:restriction>
     *              </xs:simpleType>
     *          </xs:attribute>
     *      </xs:complexType>
     *  </xs:element>
     *
     *
     * @example <caption>How to load a VOTable</caption>
     * var httpRequest = Utils.makeHttpObject();
     * httpRequest.open("GET", '"http://axel.u-strasbg.fr/HiPSCatService/I/284/out/metadata.xml', false);
     * httpRequest.send(null);
     * var xml = httpRequest.responseXML;
     * var votable = new Votable(xml);
     * @exports Votable
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     * @throws {Error} can be one of the following errors : "xml cannot be null", "This object is not supported", "his input is not a VOTable"
     */
    var Votable = function(xml) {
        xml = checkInputFormat(xml);
        var childNode = xml.documentElement;
        AbstractNode.prototype.constructor.call(this, childNode);
        var result = parseVotableTag(childNode);
        this.definitions = result[0];
        this.infos = result[1];
        this.resources = result[2];
        this.description = result[3];
        this.coosyss = result[4];
        this.groups = result[5];
        this.params = result[6];
    };

    /**
     * Checks the xml format and converts the xml in a XMLDocument.
     * The different tests applied to the format are :
     * <ul>
     *     <li>checking for a null value</li>
     *     <li>checking for the type of the input<li>
     *     <li>checking for VOTABLE tag</li>
     * </ul>
     * @param {Object} xml the input
     * @returns {XMLDocument} the xml document
     * @throws {Error} can be one of the following errors : "xml cannot be null", "This object is not supported", "his input is not a VOTable"
     */
    function checkInputFormat(xml) {
        if(xml == null) {
            throw new Error("xml cannot be null");
        } else if (typeof xml === "string") {
            var parser = new DOMParser();
            xml = parser.parseFromString(xml, "application/xml");
        } else if (xml.documentElement != null) {
            // everything is fine
        } else {
            throw new Error("This object is not supported");
        }
        var tag = xml.documentElement.localName;
        if(tag != 'VOTABLE') {
            throw new Error("This input is not a VOTable");
        }
        return xml;
    }

    /**
     * Parses the VOTable elements and returns the VOTable sequence elements.
     *
     * The VOTable sequence elements are the following :
     * <ul>
     *     <li>the DEFINITIONS element,</li>
     *     <li>the list of INFO elements,</li>
     *     <li>the list of RESOURCE elements,</li>
     *     <li>the DESCRIPTION element</li>
     *     <li>the list of COOSYS elements</li>
     *     <li>the list of GROUP elements</li>
     *     <li>the list of PARAM elements</li>
     * </ul>
     *
     * @param {NodeList} childNode The VOTable node
     * @returns {Object.<Definitions,Info[],Resource[],Description,Coosys[],Group[],Param[]>} The sequence which has been parsed
     */
    var parseVotableTag = function(childNode) {
        var root = childNode;
        var definitions;
        var infos = [];
        var resources = [];
        var description;
        var coosyss = [];
        var groups = [];
        var params = [];

        for(var i = 0; i< root.childNodes.length; i++){
            var element = root.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                switch (nodeName) {
                    case "DEFINITIONS":
                        definitions = new Definitions(element);
                        break;
                    case "INFO":
                        infos.push(new Info(element));
                        break;
                    case "RESOURCE":
                        resources.push(new Resource(element));
                        break;
                    case "DESCRIPTION":
                        description = new Description(element);
                        break;
                    case "COOSYS":
                        coosyss.push(new Coosys(element));
                        break;
                    case "GROUP":
                        groups.push(new Group(element));
                        break;
                    case "PARAM":
                        params.push(new Param(element));
                        break;
                    default:
                        this.getCache().addWarning("unknown element "+nodeName+" in Votable node");
                }
            }
        }
        return [definitions, infos, resources, description, coosyss, groups, params];

    };

    Utils.inherits(AbstractNode , Votable );

    /**
      * Returns the ID value of the attribute.
     * @returns {?String} the ID value
     */
    Votable.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the version value of the attribute.
     * @returns {?String} the version value
     */
    Votable.prototype.version = function() {
        return this.attributes["version"];
    };

    /**
     * Returns the list of Info objects.
     *
     * Info is one of the sequence element of the VOTable node.
     *
     * @returns {?Array.<Info>} the list of Info objects or 0 length when no Info node.
     */
    Votable.prototype.getInfos = function() {
        return this.infos;
    };

    /**
     * Returns the list of Definitions object.
     *
     * Definitions is one of the sequence element of the VOTable node.
     *
     * @returns {?Array.<Definitions>} the list of Definitions object or 0 length when no Definitions node.
     */
    Votable.prototype.getDefinitions = function() {
        return this.definitions;
    };

    /**
     * Returns the list of Resource objects.
     *
     * Resource is one of the sequence element of the VOTable node.
     *
     * @returns {!Array.<Resource>} the list of Resource objects
     */
    Votable.prototype.getResources = function() {
        return this.resources;
    };

    /**
     * Returns the list of Coosys objects.
     *
     * Coosys is one of the sequence element of the VOTable node.
     *
     * @returns {?Array.<Coosys>} the list of Coosys objects or 0 length when no Coosys node.
     */
    Votable.prototype.getCoosyss = function() {
        return this.coosyss;
    };

    /**
     * Returns the list of Group objects.
     *
     * Group is one of the sequence element of the VOTable node.
     *
     * @returns {?Array.<Group>} the list of Group objects or 0 length when no Group node.
     */
    Votable.prototype.getGroups = function() {
        return this.groups;
    };

    /**
     * Returns the list of Param objects.
     *
     * Param is one of the sequence element of the VOTable node.
     *
     * @returns {?Array.<Param>} the list of Param objects or 0 length when no Param node.
     */
    Votable.prototype.getParams = function() {
        return this.params;
    };

    /**
     * Returns the Description object.
     *
     * Description is one of the sequence element of the VOTable node.
     *
     * @returns {?Description} the Description object or null when no Description node.
     */
    Votable.prototype.getDescription = function() {
        return this.description;
    };

    /**
     * Returns the VOTable element by its identifier.
     * @param {String] ID identifier of the VOTable element
     * @returns {?AbstractNode} the VOTable element or null when the ID is not found.
     */
    Votable.prototype.getVotableEltByID = function(ID) {
        return this.getCache().getEltsByID()[ID];
    };

    /**
     * Returns the VOTable elements by its name.
     * @param {String} name name of the VOTable element
     * @returns {AbstractNode[]} the VOTable elements or null when the name is not found.
     */
    Votable.prototype.getVotableEltsByName = function(name) {
        return this.getCache().getEltsByName()[name];
    };

    /**
     * Converts the VOTable to GeoJSON.
     * @param {Boolean} option sets to true to get a pretty output of the GeoJSON. By default, option is set to false
     * @returns {String} the GeoJson output of the VOTable
     */
    Votable.prototype.convertToGeoJSon = function(option) {
        var geoJson = new GeoJson(this);
        return geoJson.getGeoJSon(option);
    };

    return Votable;
});