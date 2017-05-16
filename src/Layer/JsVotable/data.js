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
define(["./utils","./abstractNode","./tabledata","./binary","./binary2","./fits","./info"],
    function(Utils, AbstractNode, TableData, Binary, Binary2, Fits, Info) {

    /**
     * Constructs a Data object.
     *
     * @example <caption>Data schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Data">
     *      <xs:sequence>
     *          <xs:choice>
     *              <xs:element name="TABLEDATA" type="TableData"/>
     *              <xs:element name="BINARY" type="Binary"/>
     *              <xs:element name="BINARY2" type="Binary2"/>
     *              <xs:element name="FITS" type="FITS"/>
     *          </xs:choice>
     *          <xs:element name="INFO" type="Info" minOccurs="0" maxOccurs="unbounded"/>
     *      </xs:sequence>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the Data node
     * @exports Data
     * @augments AbstractData
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Data = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        var result = parseData(childNode);
        this.data = result[0];
        this.infos = result[1];
    };

    /**
     * Parses the Data node.
     * @param {NodeList} childNode the Data node
     * @returns {Object.<TableData|Binary|Binary2|Fits, Info[]>} the data
     */
    var parseData = function(childNode) {
        var data;
        var infos = [];

        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                switch (nodeName) {
                    case "TABLEDATA":
                        data = new TableData(element);
                        break;
                    case "BINARY":
                        data = new Binary(element);
                        break;
                    case "BINARY2":
                        data = new Binary2(element);
                        break;
                    case "FITS":
                        data = new Fits(element);
                        break;
                    case "INFO":
                        infos.push(new Info(element));
                        break;
                    default:
                        this.getCache().addWarning("unknown element " + nodeName + " in Data node");
                }
            }
        }
        return [data, infos];
    };
        
    Utils.inherits(AbstractNode , Data );

    /**
     * Returns the data.
     * @returns {!TableData|Binary|Binary2|Fits}
     */
    Data.prototype.getData = function() {
        return this.data;
    };

    /**
     * Returns the name of the data implementation.
     * @returns {!string} the name of the data implementation
     */
    Data.prototype.getDataImplementationName = function() {
        return this.data.getName();
    };

    /**
     * Returns the Infos object.
     * @returns {?Info[]} the Infos object or 0 length when no Info node.
     */
    Data.prototype.getInfos = function() {
        return this.infos;
    };

    return Data;
});