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

/**
 * A layer is an information that can be superimposed on another information.
 * <img src="../doc/images/gis_layers.gif">
 * It exists different natures of layer,
 * which are listed as below :
 * <ul>
 *     <li>{@link module:Layer.AtmosphereLayer AtmosphereLayer} : A layer to create an atmosphere on a planet.</li>
 *     <li>{@link module:Layer.BingLayer BingLayer}: The Microsoft service proving a WMTS server.</li>
 *     <li>{@link module:Layer.CoordinateGridLayer CoordinateGridLayer} : A layer to create a grid on the sky</li>
 *     <li>{@link module:Layer.GeoJsonLayer GeoJSONLayer} : A layer to add a GeoJSON on the globe</li>
 *     <li>{@link module:Layer.GroundOverlayLayer GroundOverlayLayer} : A layer to draw an image overlay draped onto the terrain</li>
 *     <li>{@link module:Layer.HipsCatLayer HipsCatLayer} : A layer to draw a HIPS catalogue</li>
 *     <li>{@link module:Layer.HipsFitsLayer HipsFitsLayer} : A layer to draw an Hips Fits</li>
 *     <li>{@link module:Layer.HipsGraphicLayer HipsGraphicLayer} : A layer to draw a Hips JPEG/PNG</li>
 *     <li>{@link module:Layer.MocLayer MocLayer} : A layer to draw a multi-order-coverage index</li>
 *     <li>{@link module:Layer.OpenSearchLayer OpenSearchLayer} : A layer to draw the result from an open search service</li>
 *     <li>{@link module:Layer.OSMLayer OSMLayer} : A layer to display data coming from OpenStreetMap server</li>
 *     <li>{@link module:Layer.TileWireframeLayer TileWireframeLayer} : A layer to draw a grid on the planet</li>
 *     <li>{@link module:Layer.VectorLayer VectorLayer} : A layer to draw a vector</li>
 *     <li>{@link module:Layer.WCSElevationLayer WCSElevationLayer} : A layer to draw the elevation</li>
 *     <li>{@link module:Layer.WMSElevationLayer WMSElevationLayer} : A layer to draw the elevation</li>
 *     <li>{@link module:Layer.WMSLayer WMSLayer} : A layer to draw images coming from the WMS server</li>
 *     <li>{@link module:Layer.WMTSLayer WMTSLayer} : A layer to draw predefined tiles coming from a WMTS server</li>
 * </ul>
 * <br/>
 * In addition to the classes, a {@link module:Layer.LayerFactory factory} is available to help for creating layer.
 * Once the layer is created, the client can handle it by the use of its {@link Layer interface}.
 * @implements {Layer}
 * @module Layer
 */
define([
    "../Utils/Utils",
    "./AbstractLayer",
    "../Utils/Constants",
    "../Provider/PlanetProvider",
    "../Renderer/Program",
    "../Time/Time"
], function(Utils, AbstractLayer, Constants, PlanetProvider, Program, Time) {
    /**
     * Atmosphere layer configuration
     * @typedef {AbstractLayer.configuration} AbstractLayer.atmosphere_configuration
     * @property {float} [kr=0.0025] the rayleigh parameter
     * @property {float} [km=0.0015] the mie parameter
     * @property {float} [sunBrightness=15] The Sun brightness
     * @property {float} [exposure=2.0] the exposure, use for basic high dynamic range
     * @property {float[]} [wavelength=[0.650, 0.570, 0.475]] the RGB color of the sun
     * @property {float[]} [lightDir=[1, 0, 0]] The location of the light in (x,y,z)
     */

    /**
     * @name AtmosphereLayer
     * @class
     * Creates an atmosphere on the planet.
     * @augments AbstractLayer
     * @param {AbstractLayer.atmosphere_configuration} options - Atmosphere configuration.
     * @constructor
     * @memberof module:Layer
     */
    var AtmosphereLayer = function(options) {
        var currentDate = new Date();
        var tomorrow = new Date();
        tomorrow.setDate(currentDate.getDate() + 1);
        options.dimension = {
            time: {
                units: "ISO8601",
                unitSymbol: null,
                default: null,
                multipleValues: null,
                nearestValue: null,
                current: null,
                value:
                    currentDate.toISOString() +
                    "/" +
                    tomorrow.toISOString() +
                    "/PT1H"
            }
        };
        // For rendering
        options.zIndex = Constants.DISPLAY.RENDERING;

        AbstractLayer.prototype.constructor.call(
            this,
            Constants.LAYER.Atmosphere,
            options
        );
        if (!this.name) {
            this.name = "Atmosphere";
        }
        this.kr = options.kr || 0.0025;
        this.km = options.km || 0.0015;
        this.sunBrightness = options.sunBrightness || 15.0;
        this.exposure = options.exposure || 2.0;
        this.wavelength = options.wavelength || [
            0.65,
            0.57,
            0.475
        ];
        this.lightDir = options.lightDir || _computeLightDir.call(this, new Date());

        // internal properties
        this._skyProgram = null;
        this._groundProgram = null;
        this._originalProgram = null;
        this._isValid = false;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractLayer, AtmosphereLayer);

    /**************************************************************************************************************/

    /**
     * Computes light direction
     * @param date date
     * @returns {number[]} [x, y, z]
     * @private
     */
    function _computeLightDir(date) {
        var sunProvider = new PlanetProvider();
        var sunPosition = sunProvider.getSunPosition(date);
        var latitude = sunPosition.dec;
        var longitude = -Utils.GHA(date, sunPosition.ra);
        var coords = Utils.longLat2XYZ(longitude, latitude);
        return [coords.x, coords.y, coords.z];
    }

    /**
     * @function getInformationType
     * @memberof AtmosphereLayer#
     */
    AtmosphereLayer.prototype.getInformationType = function() {
        return Constants.INFORMATION_TYPE.ATMOSPHERE;
    };

    /**
     * Attaches the atmosphere layer to the planet.
     * @function _attach
     * @memberof AtmosphereLayer#
     * @param {Planet} g Planet
     * @private
     */
    AtmosphereLayer.prototype._attach = function(g) {
        this.globe = g;
        this._innerRadius = this.getGlobe()
            .getCoordinateSystem()
            .getGeoide()
            .getRadius();
        this._outerRadius = this._innerRadius * 1.005;
        var renderContext = g.getRenderContext();

        // Setup program, uniform now that we have the render context

        this._skyFromSpaceProgram = new Program(renderContext);
        this._skyFromSpaceProgram.loadFromFile(
            "SkyFromSpaceVert.glsl",
            "SkyFrag.glsl"
        );
        this._skyFromAtmosphereProgram = new Program(renderContext);
        this._skyFromAtmosphereProgram.loadFromFile(
            "SkyFromAtmosphereVert.glsl",
            "SkyFrag.glsl"
        );

        this._groundFromSpaceProgram = new Program(renderContext);
        this._groundFromSpaceProgram.loadFromFile(
            "GroundFromSpaceVert.glsl",
            "GroundFrag.glsl"
        );

        this._groundFromAtmosphereProgram = new Program(renderContext);
        this._groundFromAtmosphereProgram.loadFromFile(
            "GroundFromAtmosphereVert.glsl",
            "GroundFrag.glsl"
        );

        // Check if the atmosphre is valid : all programs must be OK
        this._isValid =
            this._skyFromSpaceProgram.glProgram !== null &&
            this._skyFromAtmosphereProgram.glProgram !== null &&
            this._groundFromSpaceProgram.glProgram !== null &&
            this._groundFromAtmosphereProgram.glProgram !== null;

        if (!this._isValid) {
            return;
        }
        this._skyFromSpaceProgram.apply();
        this._initUniforms(this._skyFromSpaceProgram.uniforms);
        this._skyFromAtmosphereProgram.apply();
        this._initUniforms(this._skyFromAtmosphereProgram.uniforms);
        this._groundFromSpaceProgram.apply();
        this._initUniforms(this._groundFromSpaceProgram.uniforms);
        this._groundFromAtmosphereProgram.apply();
        this._initUniforms(this._groundFromAtmosphereProgram.uniforms);

        // Create the sphere
        var vertices = [];
        var indices = [];

        var nbEl = 72;
        var nbAz = 144;

        // Create the vertices
        var el;
        var az;
        for (el = -nbEl; el <= nbEl; el++) {
            var elevation = (el * (Math.PI * 0.5)) / nbEl;
            for (az = -nbAz; az <= nbAz; az++) {
                var azimuth = (az * Math.PI) / nbAz;

                var x =
                    this._outerRadius * Math.cos(azimuth) * Math.cos(elevation);
                var y =
                    this._outerRadius * Math.sin(azimuth) * Math.cos(elevation);
                var z = this._outerRadius * Math.sin(elevation);

                vertices.push(x);
                vertices.push(y);
                vertices.push(z);
            }
        }

        // build the sphere triangles
        for (el = 0; el < 2 * nbEl; el++) {
            for (az = 0; az < 2 * nbAz; az++) {
                indices.push(el * (2 * nbAz + 1) + az);
                indices.push((el + 1) * (2 * nbAz + 1) + az + 1);
                indices.push(el * (2 * nbAz + 1) + az + 1);

                indices.push((el + 1) * (2 * nbAz + 1) + az + 1);
                indices.push(el * (2 * nbAz + 1) + az);
                indices.push((el + 1) * (2 * nbAz + 1) + az);
            }
        }

        var gl = renderContext.gl;
        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(vertices),
            gl.STATIC_DRAW
        );

        this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            gl.STATIC_DRAW
        );
        this._numIndices = indices.length;

        this._originalProgram = g.getTileManager().program;

        g.preRenderers.push(this);
        g.getTileManager().addPostRenderer(this);
    };

    /**************************************************************************************************************/

    /**
     * Initializes uniforms.
     * @function _initUniforms
     * @memberof AtmosphereLayer#
     * @param uniforms
     * @private
     */
    AtmosphereLayer.prototype._initUniforms = function(uniforms) {
        var gl = this.getGlobe().getRenderContext().gl;

        var g = -0.95; // The Mie phase asymmetry factor
        var scale = 1.0 / (this._outerRadius - this._innerRadius);
        var rayleighScaleDepth = 0.25;
        //var mieScaleDepth = 0.1;

        vec3.normalize(this.lightDir);

        gl.uniform1f(uniforms.fKrESun, this.kr * this.sunBrightness);
        gl.uniform1f(uniforms.fKmESun, this.kr * this.sunBrightness);
        gl.uniform1f(uniforms.fKr4PI, this.kr * 4.0 * Math.PI);
        gl.uniform1f(uniforms.fKm4PI, this.km * 4.0 * Math.PI);
        gl.uniform1f(uniforms.fExposure, this.exposure);

        var wavelength = [
            Math.pow(this.wavelength[0], 4.0),
            Math.pow(this.wavelength[1], 4.0),
            Math.pow(this.wavelength[2], 4.0)
        ];
        gl.uniform3f(
            uniforms.v3InvWavelength,
            1.0 / wavelength[0],
            1.0 / wavelength[1],
            1.0 / wavelength[2]
        );

        gl.uniform3f(
            uniforms.v3LightPos,
            this.lightDir[0],
            this.lightDir[1],
            this.lightDir[2]
        );
        gl.uniform1f(uniforms.fInnerRadius, this._innerRadius);
        gl.uniform1f(
            uniforms.fInnerRadius2,
            this._innerRadius * this._innerRadius
        );
        gl.uniform1f(uniforms.fOuterRadius, this._outerRadius);
        gl.uniform1f(
            uniforms.fOuterRadius2,
            this._outerRadius * this._outerRadius
        );
        gl.uniform1f(uniforms.fScale, scale);
        gl.uniform1f(uniforms.fScaleDepth, rayleighScaleDepth);
        gl.uniform1f(uniforms.fScaleOverScaleDepth, scale / rayleighScaleDepth);
        gl.uniform1f(uniforms.g, g);
        gl.uniform1f(uniforms.g2, g * g);
    };

    /**************************************************************************************************************/

    /**
     * Pre-rendesr the atmoshpere.
     * @function preRender
     * @memberof AtmosphereLayer#
     */
    AtmosphereLayer.prototype.preRender = function() {
        if (!this._isValid) {
            return;
        }
        var tileManager = this.getGlobe().getTileManager();
        if (!this.isVisible()) {
            tileManager.program = this._originalProgram;
            return;
        }

        var rc = this.getGlobe().getRenderContext();
        var gl = rc.gl;
        var x, y, z;

        // Compute the eye position from the view matrix : the eye position is equals to [0,0,0] * inv(viewMatrix)
        // Optimized to avoid to compute the view matrix inverse
        var vm = rc.viewMatrix;
        x = vm[12];
        y = vm[13];
        z = vm[14];
        var eyePos = [
            -(vm[0] * x + vm[1] * y + vm[2] * z),
            -(vm[4] * x + vm[5] * y + vm[6] * z),
            -(vm[8] * x + vm[9] * y + vm[10] * z)
        ];
        var eyeHeight = vec3.length(eyePos);

        this._skyProgram =
            eyeHeight < this._outerRadius
                ? this._skyFromAtmosphereProgram
                : this._skyFromSpaceProgram;
        this._groundProgram =
            eyeHeight < this._outerRadius
                ? this._groundFromAtmosphereProgram
                : this._groundFromSpaceProgram;

        this._skyProgram.apply();

        gl.uniform3f(
            this._skyProgram.uniforms.v3CameraPos,
            eyePos[0],
            eyePos[1],
            eyePos[2]
        );
        gl.uniform1f(
            this._skyProgram.uniforms.fCameraHeight2,
            eyeHeight * eyeHeight
        );
        gl.uniform1f(this._skyProgram.uniforms.fCameraHeight, eyeHeight);

        this._groundProgram.apply();

        var earthCenter = [0.0, 0.0, 0.0];
        mat4.multiplyVec3(rc.viewMatrix, earthCenter);
        gl.uniform3f(
            this._groundProgram.uniforms.earthCenter,
            earthCenter[0],
            earthCenter[1],
            earthCenter[2]
        );

        vec3.normalize(this.lightDir);
        x = this.lightDir[0];
        y = this.lightDir[1];
        z = this.lightDir[2];
        var mat = rc.viewMatrix;
        var lightDirUpdated = [];
        lightDirUpdated[0] = mat[0] * x + mat[4] * y + mat[8] * z;
        lightDirUpdated[1] = mat[1] * x + mat[5] * y + mat[9] * z;
        lightDirUpdated[2] = mat[2] * x + mat[6] * y + mat[10] * z;
        gl.uniform3f(
            this._groundProgram.uniforms.lightDir,
            lightDirUpdated[0],
            lightDirUpdated[1],
            lightDirUpdated[2]
        );

        gl.uniform3f(
            this._groundProgram.uniforms.v3CameraPos,
            eyePos[0],
            eyePos[1],
            eyePos[2]
        );
        gl.uniform1f(
            this._groundProgram.uniforms.fCameraHeight2,
            eyeHeight * eyeHeight
        );
        gl.uniform1f(this._groundProgram.uniforms.fCameraHeight, eyeHeight);

        tileManager.program = this._groundProgram;

        //	rc.minFar = 2.0;
    };

    /**************************************************************************************************************/

    /**
     * Renders the atmosphere.
     * @function render
     * @memberof AtmosphereLayer#
     */
    AtmosphereLayer.prototype.render = function() {
        if (!this._isValid || !this.isVisible() || !this.getGlobe()) {
            return;
        }
        var rc = this.getGlobe().getRenderContext();
        var gl = rc.gl;

        gl.enable(gl.CULL_FACE);

        this._skyProgram.apply();

        gl.uniformMatrix4fv(
            this._skyProgram.uniforms.projectionMatrix,
            false,
            rc.projectionMatrix
        );
        gl.uniformMatrix4fv(
            this._skyProgram.uniforms.viewMatrix,
            false,
            rc.viewMatrix
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.vertexAttribPointer(
            this._skyProgram.attributes.vertex,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.drawElements(gl.TRIANGLES, this._numIndices, gl.UNSIGNED_SHORT, 0);

        gl.disable(gl.CULL_FACE);
    };

    AtmosphereLayer.prototype.setTime = function(time) {
        this.setParameter("time", time);
    };

    AtmosphereLayer.prototype.setParameter = function(param, value) {
        if (param === "time") {
            var time = Time.parse(value);
            this.time = time;
            var date = new Date(time.date);
            this.lightDir = _computeLightDir.call(this, date);
            this._skyFromSpaceProgram.apply();
            this._initUniforms(this._skyFromSpaceProgram.uniforms);
            this._skyFromAtmosphereProgram.apply();
            this._initUniforms(this._skyFromAtmosphereProgram.uniforms);
            this._groundFromSpaceProgram.apply();
            this._initUniforms(this._groundFromSpaceProgram.uniforms);
            this._groundFromAtmosphereProgram.apply();
            this._initUniforms(this._groundFromAtmosphereProgram.uniforms);
            this.forceRefresh();
        }
    };

    /**************************************************************************************************************/

    return AtmosphereLayer;
});
