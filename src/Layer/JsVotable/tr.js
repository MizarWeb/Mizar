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
define(["./utils","./abstractNode","./td"], function(Utils, AbstractNode, Td) {

    /**
     * Constructs the Tr object.
     *
     * @example <caption>Tr schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Tr">
     *      <xs:annotation><xs:documentation>
     *      The ID attribute is added here to the TR tag to avoid
     *      problems of code generators which do not properly
     *      interpret the TR/TD structures
     *      </xs:documentation></xs:annotation>
     *      <xs:sequence>
     *          <xs:element name="TD" type="Td" maxOccurs="unbounded"/>
     *      </xs:sequence>
     *      <xs:attribute name="ID" type="xs:ID"/>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the Tr node
     * @param {Array} options the tds provided while parsing a base64 stream
     * @exports Tr
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Tr = function(childNode, options) {
        AbstractNode.prototype.constructor.call(this, childNode);
        if (options == null) {
            this.tds = parseTr(childNode);
        } else {
            this.tds = [];
            for (var i=0;i<options.length;i++) {
                this.tds.push(new Td(null, options[i]));
            }
        }
    };

    /**
     * Parses the Tr node.
     * @param {NodeList} childNode the Tr node
     * @returns {!Td[]} an array of Td
     */
    var parseTr = function(childNode) {
        var tds = [];
        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                if (nodeName == "TD") {
                    tds.push(new Td(element));
                }  else {
                    this.getCache().addWarning("unknown element "+nodeName+" in Tr node");
                }
            }
        }
        return tds;
    };

    Utils.inherits(AbstractNode , Tr );

    /**
     * Returns the ID value of the attribute.
     * @returns {?String} the ID value or null when no ID attribute.
     */
    Tr.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the list of Td objects.
     *
     * Td is the sequence element of the Tr node.
     *
     * @returns {Td[]} the list of Td objects or 0 length when no TD node.
     */
    Tr.prototype.getTds = function() {
        return this.tds;
    };

    return Tr;
});