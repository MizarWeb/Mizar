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
define(["./utils", "./abstractNode","./converter/base64","./tabledata"], function (Utils, AbstractNode, Base64, TableData) {

    /**
     * Constructs the Stream object.
     *
     * STREAM can be local or remote, encoded or not
     *
     * @example <caption>Stream schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Stream">
     *      <xs:simpleContent>
     *          <xs:extension base="xs:string">
     *              <xs:attribute name="type" default="locator">
     *                  <xs:simpleType>
     *                      <xs:restriction base="xs:NMTOKEN">
     *                          <xs:enumeration value="locator"/>
     *                          <xs:enumeration value="other"/>
     *                      </xs:restriction>
     *                  </xs:simpleType>
     *              </xs:attribute>
     *              <xs:attribute name="href" type="xs:anyURI"/>
     *              <xs:attribute name="actuate" default="onRequest">
     *                  <xs:simpleType>
     *                      <xs:restriction base="xs:NMTOKEN">
     *                          <xs:enumeration value="onLoad"/>
     *                          <xs:enumeration value="onRequest"/>
     *                          <xs:enumeration value="other"/>
     *                          <xs:enumeration value="none"/>
     *                      </xs:restriction>
     *                  </xs:simpleType>
     *              </xs:attribute>
     *              <xs:attribute name="encoding" type="encodingType" default="none"/>
     *              <xs:attribute name="expires" type="xs:dateTime"/>
     *              <xs:attribute name="rights" type="xs:token"/>
     *          </xs:extension>
     *      </xs:simpleContent>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the Stream node
     * @exports Stream
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Stream = function (childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        this.value = childNode.textContent;
    };

    Utils.inherits(AbstractNode, Stream);

    /**
     * Returns the type value.
     * @returns {?String} the type value or null when no type attribute.
     */
    Stream.prototype.type = function () {
        return this.attributes["type"];
    };

    /**
     * Returns the href value.
     * @returns {?String} the href value or null when no href attribute.
     */
    Stream.prototype.href = function () {
        return this.attributes["href"];
    };

    /**
     * Returns the actuate value.
     * @returns {?String} the actuate value or null when no actuate attribute.
     */
    Stream.prototype.actuate = function () {
        return this.attributes["actuate"];
    };

    /**
     * Returns the encoding value.
     * @returns {!String} the encoding value or null when no encoding attribute.
     */
    Stream.prototype.encoding = function () {
        return this.attributes["encoding"];
    };

    /**
     * Returns the expires value.
     * @returns {?String} the expires value or null when no expires attribute.
     */
    Stream.prototype.expires = function () {
        return this.attributes["expires"];
    };

    /**
     * Returns the rights value.
     * @returns {?String} the rights value or null when no rights attribute.
     */
    Stream.prototype.rights = function () {
        return this.attributes["rights"];
    };

    /**
     * Returns the content.
     * @returns {!String} the content
     */
    Stream.prototype.getContent = function (decode, fields) {
        var result;
        if (decode == null || decode == false) {
            result = this.value;
        } else {
            var base64 = new Base64(fields);
            result = new TableData(null,base64.decode(this.value));
        }
        return result;
    };




    return Stream;
});