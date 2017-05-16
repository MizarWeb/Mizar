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
define(["./utils","./tr","./abstractData"], function(Utils, Tr, AbstractData) {

    /**
     * Construct a TableData object.
     *
     * @example <caption>Tabledata schema</caption>
     * {@lang xml}
     *  <xs:complexType name="TableData">
     *      <xs:sequence>
     *          <xs:element name="TR" type="Tr" minOccurs="0" maxOccurs="unbounded"/>
     *      </xs:sequence>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the TableData node
     * @param {Array} options the trs provided by {@link Base64#decode} while parsing a base64 stream
     * @exports TableData
     * @augments AbstractData
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var TableData = function(childNode, options) {
        AbstractData.prototype.constructor.call(this, childNode, "TableData");
        if (options == null) {
            this.trs = parseTableData(childNode);
        } else {
            this.trs = [];
            for(var i=0;i<options.length; i++) {
                this.trs.push(new Tr(null, options[i]));
            }
        }
    };

    /**
     * Parses the TableData node.
     * @param {NodeList} childNode the TableData node
     * @returns {Tr[]} A list of Tr object
     */
    var parseTableData = function(childNode) {
        var trs = [];
        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                if (nodeName == "TR") {
                    trs.push(new Tr(element));
                }  else {
                    this.getCache().addWarning("unknown element "+nodeName+" in TableData node");
                }
            }
        }
        return trs;
    };

    Utils.inherits(AbstractData , TableData );

    /**
     * Returns the list of Tr objects.
     *
     * Tr is the sequence element of the TableData node.
     *
     * @returns {?Tr[]} the list of Tr objects or 0 length when no Tr node.
     */
    TableData.prototype.getTrs = function() {
        return this.trs;
    };

    return TableData;
});