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

define([
    "../Utils/Utils",
    "./AbstractLayer",
    "../Utils/Constants",
    "../Renderer/GeoBound",
    "../Renderer/GroundOverlayRenderer",
    "../Utils/Proxy"
], function(Utils, AbstractLayer, Constants, GeoBound, GroundOverlayRenderer, Proxy) {
    /**
     * GroundOverlay Layer configuration
     * @typedef {AbstractLayer.configuration} AbstractLayer.groundOverlay_configuration
     * @param {float[]} quad  - An array of 4 points to define the area on the terrain to drape the image
     * @param {Object|String} image - the image to drape on the terrain, can be an Image element or a string (url of the image)
     * @param {boolean} [flipY=true] - flip or not the image
     */

    /**
     * @name GroundOverlayLayer
     * @class
     * This layer draws an image overlay draped onto the terrain
     * @augments AbstractLayer
     * @param {AbstractLayer.groundOverlay_configuration} options - Ground overlay configuration
     * @constructor
     * @memberof module:Layer
     */
    var GroundOverlayLayer = function(options) {
        options.zIndex = options.zIndex || Constants.DISPLAY.DEFAULT_RASTER;
        AbstractLayer.prototype.constructor.call(
            this,
            Constants.LAYER.GroundOverlay,
            options
        );

        this.geoBound = null;
        this.image = null;
        this.globe = null;
        this.flipY = null;

        this.quad = options.quad;
        if (typeof options.flipY === "undefined") {
            this.flipY = true;
        } else {
            this.flipY = options.flipY;
        }

        if (this.quad !== null && typeof this.quad !== "undefined") {
            // Compute the geo bound of the ground overlay
            this.geoBound = new GeoBound();
            this.geoBound.computeFromCoordinates(this.quad);
        }

        if (typeof options.image === "string") {
            this.image = new Image();
            this.image.crossOrigin = "";
            this.image.src = Proxy.proxify(options.image);
        } else if (options.image instanceof HTMLImageElement) {
            this.image = options.image;
        }
        this.image.layer = this;

        this.image.onload = function() {
            this.layer.getGlobe().refresh();
        };
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractLayer, GroundOverlayLayer);

    /**************************************************************************************************************/

    /**
     * @function getInformationType
     * @memberof GroundOverlayLayer#
     */
    GroundOverlayLayer.prototype.getInformationType = function() {
        return Constants.INFORMATION_TYPE.RASTER;
    };

    /**
     * Loads a global overview if available. Only use for sky rendering currently
     * @function loadOverview
     * @memberof GroundOverlayLayer#
     */
    GroundOverlayLayer.prototype.loadOverview = function() {};

    /**
     * Attaches layer to the globe.
     * @function _attach
     * @memberof GroundOverlayLayer#
     * @param {AbstractGlobe} planet - Globe to attach
     * @private
     */
    GroundOverlayLayer.prototype._attach = function(planet) {
        // Add layer to ground overlay renderer, create one if needed
        var renderer = planet.groundOverlayRenderer;
        if (!renderer) {
            renderer = new GroundOverlayRenderer(planet.getTileManager());
            planet.getTileManager().addPostRenderer(renderer);
            planet.groundOverlayRenderer = renderer;
        }
        renderer.groundOverlays.push(this);

        this.globe = planet;

        this.computeTransform();
    };

    //*************************************************************************

    /**
     * Update
     * @function update
     * @memberof GroundOverlayLayer#
     * @param {JSon} quad Quad coordinates
     * @param {string} url Url of image
     */
    GroundOverlayLayer.prototype.update = function(quad, url) {
        this.getGlobe().groundOverlayRenderer.enabled = true;

        this.geoBound = null;
        this.geoBound = new GeoBound();

        this.geoBound.computeFromCoordinates(this.quad);

        this.image = null;
        this.image = new Image();

        this.image.crossOrigin = "";
        this.image.src = Proxy.proxify(url);
        this.image.layer = this;

        this.computeTransform();

        this.image.onload = function() {
            this.layer.getGlobe().refresh();
        };
    };

    //*************************************************************************

    /**
     * Detaches layer from the globe.
     * @function _detach
     * @memberof GroundOverlayLayer#
     * @param {AbstractGlobe} globe - globe to detach
     * @private
     */
    GroundOverlayLayer.prototype._detach = function(planet) {
        // Remove layer from the planet renderer for ground overlay
        var prevRenderer = this.getGlobe().groundOverlayRenderer;
        if (prevRenderer) {
            var index = prevRenderer.groundOverlays.indexOf(this);
            if (index !== -1) {
                prevRenderer.groundOverlays.splice(index, 1);

                if (prevRenderer.groundOverlays.length === 0) {
                    this.getGlobe()
                        .getTileManager()
                        .removePostRenderer(prevRenderer);
                    this.getGlobe().groundOverlayRenderer = null;
                }
            }
        }
    };

    //*************************************************************************

    /**
     * Computes the inverse transform from unit square to geo position
     * Code taken from QTransform
     * @function computeInverse
     * @memberof GroundOverlayLayer#
     */
    GroundOverlayLayer.prototype.computeInverse = function() {
        var det =
            this.transform[0] *
                (this.transform[8] * this.transform[4] -
                    this.transform[5] * this.transform[7]) -
            this.transform[3] *
                (this.transform[8] * this.transform[1] - this.transform[7]) *
                this.transform[3] +
            this.transform[6] *
                (this.transform[5] * this.transform[1] -
                    this.transform[4] * this.transform[2]);

        var h11, h12, h13, h21, h22, h23, h31, h32, h33;
        h11 =
            this.transform[4] * this.transform[8] -
            this.transform[5] * this.transform[7];
        h21 =
            this.transform[5] * this.transform[6] -
            this.transform[3] * this.transform[8];
        h31 =
            this.transform[3] * this.transform[7] -
            this.transform[4] * this.transform[6];
        h12 =
            this.transform[2] * this.transform[7] -
            this.transform[1] * this.transform[8];
        h22 =
            this.transform[0] * this.transform[8] -
            this.transform[2] * this.transform[6];
        h32 =
            this.transform[1] * this.transform[6] -
            this.transform[0] * this.transform[7];
        h13 =
            this.transform[1] * this.transform[5] -
            this.transform[2] * this.transform[4];
        h23 =
            this.transform[2] * this.transform[3] -
            this.transform[0] * this.transform[5];
        h33 =
            this.transform[0] * this.transform[4] -
            this.transform[1] * this.transform[3];

        this.inverseTransform = [
            h11 / det,
            h12 / det,
            h13 / det,
            h21 / det,
            h22 / det,
            h23 / det,
            h31 / det,
            h32 / det,
            h33 / det
        ];
    };

    //*************************************************************************

    /**
     * Computes the transform from geo position to unit square
     * Code taken from QTransform
     * @function computeTransform
     * @memberof GroundOverlayLayer#
     */
    GroundOverlayLayer.prototype.computeTransform = function() {
        if (this.quad === null) {
            // Sleeping mode, no compute
            return;
        }

        var q1 = this.quad[0];
        var q2 = this.quad[1];
        var q3 = this.quad[2];
        var q4 = this.quad[3];

        var tileConfig = this.getGlobe().getTileManager().tileConfig;
        if (tileConfig.srs !== "CRS:84") {
            q1 = tileConfig.project(q1);
            q2 = tileConfig.project(q2);
            q3 = tileConfig.project(q3);
            q4 = tileConfig.project(q4);
        }

        var dx0 = q1[0];
        var dx1 = q2[0];
        var dx2 = q3[0];
        var dx3 = q4[0];

        var dy0 = q1[1];
        var dy1 = q2[1];
        var dy2 = q3[1];
        var dy3 = q4[1];

        var ax = dx0 - dx1 + dx2 - dx3;
        var ay = dy0 - dy1 + dy2 - dy3;

        if (!ax && !ay) {
            //afine transform
            this.transform = [
                dx1 - dx0,
                dy1 - dy0,
                0,
                dx2 - dx1,
                dy2 - dy1,
                0,
                dx0,
                dy0,
                1
            ];
        } else {
            var ax1 = dx1 - dx2;
            var ax2 = dx3 - dx2;
            var ay1 = dy1 - dy2;
            var ay2 = dy3 - dy2;

            /*determinants */
            var gtop = ax * ay2 - ax2 * ay;
            var htop = ax1 * ay - ax * ay1;
            var bottom = ax1 * ay2 - ax2 * ay1;

            var a, b, c, d, e, f, g, h;
            /*i is always 1*/

            if (!bottom) {
                return;
            }

            g = gtop / bottom;
            h = htop / bottom;

            a = dx1 - dx0 + g * dx1;
            b = dx3 - dx0 + h * dx3;
            c = dx0;
            d = dy1 - dy0 + g * dy1;
            e = dy3 - dy0 + h * dy3;
            f = dy0;

            this.transform = [a, d, g, b, e, h, c, f, 1.0];
        }

        this.computeInverse();
    };

    //*************************************************************************

    return GroundOverlayLayer;
});
