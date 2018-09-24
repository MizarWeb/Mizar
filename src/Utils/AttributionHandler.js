/*******************************************************************************
 * Copyright 2017, 2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
 *
 * This file is part of MIZAR.
 *
 * MIZAR is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MIZAR is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

define(function() {
    /**
     * Default div ID for attribution.
     */
    const ATTIBUTION_ID_DEFAULT = "attribution";

    /**
     * Create HTML attribution.
     */
    function _createHTMLAttribution(layer) {
        var attribution;
        var title = layer.getAck() != null ? layer.getAck() : "";
        if (
            layer.getCopyrightUrl() !== "" &&
            layer.getCopyrightUrl() !== undefined
        ) {
            attribution =
                "<a class=\"whiteLink\" href=\"" +
                layer.getCopyrightUrl() +
                "\" target=\"_blank\" title=\"" +
                title +
                "\">" +
                layer.getAttribution() +
                "</a>";
        } else {
            attribution = layer.getAttribution();
        }
        return attribution;
    }

    /**
        @name AttributionHandler
        @class
        Manage the attributions
        @param {Globe} globe Globe
        @param options Configuration properties
        <ul>
        <li>element : the HTML element to show attributions, can be a string (the ID) or the DOM element itself</li>
        </ul>
    */
    var AttributionHandler = function(globe, options) {
        // Search for the element to use
        var elt = options ? options.element : undefined;
        if (elt) {
            if (typeof elt === "string") {
                this.element = document.getElementById(elt);
            } else {
                this.element = elt;
            }
            if (this.element && !elt.hasOwnProperty(this.element)) {
                this.element.id = ATTIBUTION_ID_DEFAULT;
            }
        }

        // Only add the attribution handler to the globe if element is not null
        if (this.element) {
            globe.attributionHandler = this;
        }
    };

    /**
     * Remove attribution from HTML
     * @function removeAttribution
     * @memberof AttributionHandler.prototype
     * @param {Layer} layer Layer
     */
    AttributionHandler.prototype.removeAttribution = function(layer) {
        if (this.element) {
            var div = document.getElementById(this.element.id + "_" + layer.id);
            if (div) {
                this.element.removeChild(div);
            }
        }
    };

    /**
     * Add attribution in HTML
     * @function addAttribution
     * @memberof AttributionHandler.prototype
     * @param {Layer} layer Layer
     */
    AttributionHandler.prototype.addAttribution = function(layer) {
        if (this.element) {
            var div = document.createElement("div");
            div.innerHTML = _createHTMLAttribution.call(this, layer);
            div.id = this.element.id + "_" + layer.id;

            if (layer.id === 0) {
                // Background layer
                this.element.insertBefore(div, this.element.firstChild);
            } else {
                this.element.appendChild(div);
            }
        }
    };

    /**
     * Enables all HTML attribution.
     * @function enable
     * @memberof AttributionHandler.prototype
     * @param {Layer} layer Layer
     */
    AttributionHandler.prototype.enable = function(layer) {
        if (this.element && layer && layer.isVisible()) {
            var div = document.getElementById(this.element.id + "_" + layer.id);
            if (div) {
                div.style.display = "block";
            }
        }
    };

    /**
     * Disables all HTML attribution.
     * @function disable
     * @memberof AttributionHandler.prototype
     * @param {Layer} layer Layer
     */
    AttributionHandler.prototype.disable = function(layer) {
        if (this.element && layer && layer.isVisible()) {
            var div = document.getElementById(this.element.id + "_" + layer.id);
            if (div) {
                div.style.display = "none";
            }
        }
    };

    /**
     * Toggle attribution
     * @function toggleAttribution
     * @memberof AttributionHandler.prototype
     * @param {Layer} layer Layer
     */
    AttributionHandler.prototype.toggleAttribution = function(layer) {
        if (this.element) {
            var div = document.getElementById(this.element.id + "_" + layer.id);
            if (div) {
                this.removeAttribution(layer);
            } else {
                this.addAttribution(layer);
            }
        }
    };

    /**************************************************************************************************************/

    return AttributionHandler;
});
