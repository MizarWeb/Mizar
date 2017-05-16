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
     * Constructs the Link object.
     *
     * @example <caption>Link schema</caption>
     * {@lang xml}
     * The LINK is a URL (href) or some other kind of reference (gref)
     * <xs:complexType name="Link">
     *      <xs:attribute name="ID" type="xs:ID"/>
     *      <xs:attribute name="content-role" type="xs:token"/>
     *      <xs:attribute name="content-type" type="xs:token"/>
     *      <xs:attribute name="title" type="xs:string"/>
     *      <xs:attribute name="value" type="xs:string"/>
     *      <xs:attribute name="href" type="xs:anyURI"/>
     *      <xs:attribute name="gref" type="xs:token"/>
     *      <xs:attribute name="action" type="xs:anyURI"/>
     * </xs:complexType>
     * 
     * @param {NodeList} childNode the Link node
     * @exports Link
     * @augments AbstractNode
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Link = function(childNode) {
        AbstractNode.prototype.constructor.call(this, childNode);
    };

    Utils.inherits(AbstractNode , Link );

    /**
     * Returns the ID value.
     * @returns {?String} the ID value or null when no ID attribute.
     */
    Link.prototype.ID = function() {
        return this.attributes["ID"];
    };

    /**
     * Returns the content-role value.
     * @returns {?String} the content-role value or null when no content-role attribute.
     */
    Link.prototype.content_role = function() {
        return this.attributes["content-role"];
    };

    /**
     * Returns the content-type value.
     * @returns {?String} the content-type value or null when no content-type attribute.
     */
    Link.prototype.content_type = function() {
        return this.attributes["content-type"];
    };

    /**
     * Returns the title value.
     * @returns {?String} the title value or null when no title attribute.
     */
    Link.prototype.title = function() {
        return this.attributes["title"];
    };

    /**
     * Returns the value value.
     * @returns {?String} the value value or null when no value attribute.
     */
    Link.prototype.value = function() {
        return this.attributes["value"];
    };

    /**
     * Returns the href value.
     * @returns {?String} the href value or null when no href attribute.
     */
    Link.prototype.href = function() {
        return this.attributes["href"];
    };

    /**
     * Returns the gref value.
     * @returns {?String} the gref value or null when no gref attribute.
     */
    Link.prototype.gref = function() {
        return this.attributes["gref"];
    };

    /**
     * Returns the action value.
     * @returns {?String} the action value or null when no action attribute.
     */
    Link.prototype.action = function() {
        return this.attributes["action"];
    };

    return Link;
});