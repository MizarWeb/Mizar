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

define(["./utils","./stream","./abstractData"], function(Utils, Stream, AbstractData) {

    /**
     * Constructs the Binary object.
     *
     * @example <caption>Binary schema</caption>
     * {@lang xml}     
     *  <xs:complexType name="Binary">
     *      <xs:sequence>
     *          <xs:element name="STREAM" type="Stream"/>
     *      </xs:sequence>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the Binary node
     * @exports Binary
     * @augments AbstractData
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Binary = function(childNode) {
        AbstractData.prototype.constructor.call(this, childNode, "Binary");
        this.stream = parseBinary(childNode);
    };

    /**
     * Parses the Binary node.
     * @param {NodeList} childNode the Binary node
     * @returns {!Stream} the Stream
     * @throws "Unknown element"
     */
    var parseBinary = function(childNode) {
        var stream;
        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                if (nodeName == "STREAM") {
                    stream = new Stream(element);
                } else {
                    throw "Unknown element";
                }
            }
        }
        return stream;
    };

    Utils.inherits(AbstractData , Binary );


    /**
     * Returns the Stream object.
     * @returns {!Stream} the Stream object
     */
    Binary.prototype.getStream = function(){
        return this.stream;
    };

    return Binary;
});