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
     * Constructs a CoordinateSystem object.
     *
     * @example <caption>CoordinateSystem schema</caption>
     * {@lang xml}
     *  <xs:complexType name="CoordinateSystem">
     *      <xs:simpleContent>
     *          <xs:extension base="xs:string">
     *              <xs:attribute name="ID" type="xs:ID" use="required"/>
     *              <xs:attribute name="equinox" type="astroYear"/>
     *              <xs:attribute name="epoch" type="astroYear"/>
     *              <xs:attribute name="system" default="eq_FK5">
     *                  <xs:simpleType>
     *                      <xs:restriction base="xs:NMTOKEN">
     *                          <xs:enumeration value="eq_FK4"/>
     *                          <xs:enumeration value="eq_FK5"/>
     *                          <xs:enumeration value="ICRS"/>
     *                          <xs:enumeration value="ecl_FK4"/>
     *                          <xs:enumeration value="ecl_FK5"/>
     *                          <xs:enumeration value="galactic"/>
     *                          <xs:enumeration value="supergalactic"/>
     *                          <xs:enumeration value="xy"/>
     *                          <xs:enumeration value="barycentric"/>
     *                          <xs:enumeration value="geo_app"/>
     *                      </xs:restriction>
     *                  </xs:simpleType>
     *              </xs:attribute>
     *          </xs:extension>
     *      </xs:simpleContent>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the CoordinateSystem node
     * @exports Coosys
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Coosys = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        this.value = parseCoordinateSystem(childNode);
    };

    Utils.inherits(AbstractNode , Coosys );

    /**
     * Parses the CoordinateSystem node.
     * @param {NodeList} childNode the CoordinateSystem node
     * @returns {String} the content of CoordinateSysem node
     */
    var parseCoordinateSystem = function(childNode) {
        var value;
        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element!=null && element.nodeType == 3) {
                value = (element.textContent == null) ? null : element.textContent.trim();
            } else {
                this.getCache().addWarning("unknown element "+element+" in Coosys node");
            }
        }
        return value;
    };

    /**
     * Returns the ID value.
     * @returns {!String} the ID value
     */
    Coosys.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the equinox value.
     * @returns {?String} the equinox value or null when no equinox attribute.
     */
    Coosys.prototype.equinox = function() {
        return this.attributes["equinox"];
    };

    /**
     * Returns the epoch value.
     * @returns {?String} the epoch value or null when no epoch attribute.
     */
    Coosys.prototype.epoch = function() {
        return this.attributes["epoch"];
    };

    /**
     * Returns the system value.
     * @returns {?String} the system value or null when no system attribute.
     */
    Coosys.prototype.system = function() {
        return this.attributes["system"];
    };

    /**
     * Returns the content of CoordinateSystem.
     * @returns {String} the content of CoordinateSystem.
     */
    Coosys.prototype.getContent = function() {
        return this.value;
    };

    return Coosys;
});