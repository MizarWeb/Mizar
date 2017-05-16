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
define(["./utils","./abstractNode"], function(Utils, AbstractNode) {

    /**
     * Construct the Td object.
     *
     * @example <caption>Td schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Td">
     *      <xs:simpleContent>
     *          <xs:extension base="xs:string">
     *              <!-- xs:attribute name="ref" type="xs:IDREF"/ -->
                    <xs:annotation><xs:documentation>
     *                  The 'encoding' attribute is added here to avoid
     *                  problems of code generators which do not properly
     *                  interpret the TR/TD structures.
     *                  'encoding' was chosen because it appears in
     *                  appendix A.5
     *              </xs:documentation></xs:annotation>
     *              <xs:attribute name="encoding" type="encodingType"/>
     *          </xs:extension>
     *      </xs:simpleContent>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the Td node
     * @exports Td
     * @augments AbstractNode
     * @param {string} options the value provided while parsing a base64 stream
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Td = function(childNode,options) {
        AbstractNode.prototype.constructor.call(this, childNode);
        if (options == null) {
            this.value = (childNode.textContent == null) ? "" : childNode.textContent.trim();
        } else {
            this.value = (options == null) ? "" : options.trim();
        }
    };

    Utils.inherits(AbstractNode , Td );

    /**
     * Returns the encoding value.
     * @returns {?String} the encoding value or null when no encoding attribute.
     */
    Td.prototype.encoding = function() {
        return this.attributes["encoding"];
    };

    /**
     * Returns the content of the name.
     * @returns {string} the content
     */
    Td.prototype.getContent = function() {
        return this.value;
    }

    return Td;
});