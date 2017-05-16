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
define(["./utils","./abstractData","./stream"], function(Utils, AbstractData, Stream) {

    /**
     * Constructs the Fits object.
     *
     * @example <caption>Fits schema</caption>
     * {@lang xml}
     *  <xs:complexType name="FITS">
     *      <xs:sequence>
     *          <xs:element name="STREAM" type="Stream"/>
     *      </xs:sequence>
     *      <xs:attribute name="extnum" type="xs:positiveInteger"/>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the Fits node
     * @exports Fits
     * @augments AbstractData
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Fits = function(childNode) {
        AbstractData.prototype.constructor.call(this, childNode, "Fits");
        this.stream = parseFits(childNode);
    };

    /**
     * Parses the Fits node.
     * @param childNode the Fits node
     * @returns {Stream} the stream
     */
    var parseFits = function(childNode) {
        var stream;
        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                if (nodeName == "STREAM") {
                    stream = new Definitions(element);
                } else {
                    this.getCache().addWarning("unknown element "+nodeName+" in Fits node");
                }
            }
        }
        return stream;
    }

    Utils.inherits(AbstractData , Fits );

    /**
     * Returns the Stream object.
     * @returns {!Stream} the Stream object.
     */
    Fits.prototype.getStream = function(){
        return this.stream;
    };

    /**
     * Returns te extnum value.
     * @returns {!String} the extnum value.
     */
    Fits.prototype.extnum = function(){
        return this.attributes['extnum'];
    };

    return Fits;
});