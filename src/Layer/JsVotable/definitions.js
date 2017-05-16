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
define(["./utils","./abstractNode","./group","./param","./coosys"], function (Utils, AbstractNode, Group, Param, Coosys) {

    /**
     * Constructs a Definitions object.
     *
     * @example <caption>Definitions schema</caption>
     * {@lang xml}     
     *  <xs:complexType name="Definitions">
     *      <xs:choice minOccurs="0" maxOccurs="unbounded">
     *          <xs:element name="COOSYS" type="CoordinateSystem"/>
     *          <xs:element name="PARAM" type="Param"/>
     *      </xs:choice>
     *  </xs:complexType>
     *  
     * @param {NodeList} childNode the DEFINITIONS node
     * @exports Definitions
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Definitions = function (childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        var result = parseDefinitions(childNode);
        this.coosys = result[0];
        this.param = result[1];
    };

    /**
     * Parses the DEFINITIONS node
     * @param {NodeList} childNode the DEFINITIONS node
     * @returns {Object.<Coosys[],Param[]>} Returns coosyss, params
     */
    var parseDefinitions = function(childNode) {
        var coosyss = [];
        var params = [];

        for (var i = 0; childNode!=null && i < childNode.childNodes.length; i++) {
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                switch (nodeName) {
                    case "COOSYS":
                        coosyss.push(new Coosys(element));
                        break;
                    case "PARAM":
                        params.push(new Param(element));
                        break;
                    default:
                        this.getCache().addWarning("unknown element "+nodeName+" in Definitions node");
                }
                if (nodeName == "COOSYS") {
                    coosyss.push(new Coosys(element));
                } else if (nodeName == "PARAM") {
                    params.push(new Param(element));
                } else {
                    this.getCache().addWarning("unknown element "+nodeName+" in Definitions node");

                }
            }
        }
        return [coosyss, params];
    };

    Utils.inherits(AbstractNode , Definitions );

    /**
     * Returns the list of Coosys objects.
     * @returns {?Coosys[]} the list of Coosys objects or 0 length when no Coosys node.
     */
    Definitions.prototype.getCoosyss = function() {
        return this.coosys;
    };

    /**
     * Returns the list of Param objects.
     * @returns {?Param[]} the list of Param objects or 0 length when no Param node.
     */
    Definitions.prototype.getParams = function() {
        return this.param;
    };

    return Definitions;
});