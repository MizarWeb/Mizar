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
define(["./utils","./field"], function(Utils, Field) {

    /**
     * Constructs the Param object.
     *
     * @example <caption>Param schema</caption>
     * {@lang xml}
     *  <xs:complexType name="Param">
     *      <xs:complexContent>
     *          <xs:extension base="Field">
     *              <xs:attribute name="value" type="xs:string" use="required"/>
     *          </xs:extension>
     *      </xs:complexContent>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the Param node
     * @exports Param
     * @augments Field
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Param = function(childNode) {
        Field.prototype.constructor.call(this, childNode);
    };

    Utils.inherits(Field , Param );

    /**
     * Returns the value value.
     * @returns {!String} the value value or null when no value attribute.
     */
    Param.prototype.value = function() {
        return this.attributes["value"];
    };

    return Param;
});