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
     * Constructs the Option object.
     *
     * @example <caption>Option schema</caption>
     * {@lang xml}     
     *  <xs:complexType name="Option">
     *      <xs:sequence>
     *          <xs:element name="OPTION" type="Option" minOccurs="0" maxOccurs="unbounded"/>
     *      </xs:sequence>
     *      <xs:attribute name="name" type="xs:token"/>
     *      <xs:attribute name="value" type="xs:string" use="required"/>
     *  </xs:complexType>
     *
     * @param {NodeList} childNode the Option node
     * @exports Option
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Option = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
        this.options = parseOptionTag(childNode);
    };

    /**
     * Parses the Option node.
     * @param childNode the option node.
     * @returns {Option[]} the list of options
     */
    var parseOptionTag = function(childNode) {
        var options = [];
        for(var i = 0; childNode!=null && i< childNode.childNodes.length; i++){
            var element = childNode.childNodes[i];
            if (element.nodeType == 1) {
                var nodeName = element.localName;
                if (nodeName == "OPTION") {
                    options.push(new Option(element));
                }  else {
                    this.getCache().addWarning("unknown element "+nodeName+" in Option node");
                }
            }
        }
        return options;
    };

    Utils.inherits(AbstractNode , Option );

    /**
     * Returns the name value.
     * @returns {?String} the name value or null when no name attribute.
     */
    Option.prototype.name = function() {
        return this.attributes["name"];
    };

    /**
     * Returns the value value.
     * @returns {!String} the value value.
     */
    Option.prototype.value = function() {
        return this.attributes["value"];
    };

    /**
     * Returns the list of OPTION nodes.
     * @returns {?Option[]} the list of OPTION nodes or 0 length when no OPTION node.
     */
    Option.prototype.getOptions = function() {
        return this.options;
    };

    return Option;
});