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
    "../Renderer/Program",
    "../Tiling/Tile"
], function(Utils, AbstractLayer, Constants, Program, Tile) {
    /**
     * TileWireFrameLayer configuration
     * @typedef {AbstractLayer.configuration} AbstractLayer.tileWireFrame_configuration
     * @property [outline=false]
     */

    /**
     * @name TileWireframeLayer
     * @class
     *    This layer draws an TileWireframe  layer
     * @augments AbstractLayer
     * @param {AbstractLayer.tileWireFrame_configuration} options - TileWireFrame configuration
     * @memberof module:Layer
     * @constructor
     */
    var TileWireframeLayer = function(options) {
        options.zIndex = Constants.DISPLAY.RENDERING;
        AbstractLayer.prototype.constructor.call(
            this,
            Constants.LAYER.TileWireframe,
            options
        );
        this.outline = options && options.outline ? options.outline : false;
        this.globe = null;
        this.program = null;
        this.indexBuffer = null;
        this.subIndexBuffer = [null, null, null, null];
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractLayer, TileWireframeLayer);

    /**************************************************************************************************************/

    /**
     * @function getInformationType
     * @memberof TileWireframeLayer#
     */
    TileWireframeLayer.prototype.getInformationType = function() {
        return Constants.INFORMATION_TYPE.VECTOR;
    };

    /**
     * Build the index buffer
     * @function buildIndexBuffer
     * @memberof TileWireframeLayer#
     */
    TileWireframeLayer.prototype.buildIndexBuffer = function() {
        var gl = this.getGlobe().getRenderContext().gl;
        var size = this.getGlobe().getTileManager().tileConfig.tesselation;
        var indices = [];
        var i, j, ii, n, k;
        var step = this.outline ? size - 1 : 1;
        var ib;

        // Build horizontal lines
        for (j = 0; j < size; j += step) {
            for (i = 0; i < size - 1; i++) {
                indices.push(j * size + i);
                indices.push(j * size + i + 1);
            }
        }

        // Build vertical lines
        for (j = 0; j < size; j += step) {
            for (i = 0; i < size - 1; i++) {
                indices.push(i * size + j);
                indices.push((i + 1) * size + j);
            }
        }

        ib = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            gl.STATIC_DRAW
        );

        ib.numIndices = indices.length;
        this.indexBuffer = ib;

        var halfTesselation = (size - 1) / 2;
        step = this.outline ? halfTesselation : 1;
        for (ii = 0; ii < 4; ii++) {
            i = ii % 2;
            j = Math.floor(ii / 2);

            // Build the sub grid for 'inside' tile
            indices = [];
            for (
                n = halfTesselation * j;
                n < halfTesselation * (j + 1) + 1;
                n += step
            ) {
                for (
                    k = halfTesselation * i;
                    k < halfTesselation * (i + 1);
                    k++
                ) {
                    indices.push(n * size + k);
                    indices.push(n * size + k + 1);
                }
            }
            for (
                n = halfTesselation * i;
                n < halfTesselation * (i + 1) + 1;
                n += step
            ) {
                for (
                    k = halfTesselation * j;
                    k < halfTesselation * (j + 1);
                    k++
                ) {
                    indices.push(k * size + n);
                    indices.push((k + 1) * size + n);
                }
            }

            ib = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(indices),
                gl.STATIC_DRAW
            );
            ib.numIndices = indices.length;
            this.subIndexBuffer[ii] = ib;
        }
    };

    /**************************************************************************************************************/
    /**
     * Attaches the layer to the planet
     * @function _attach
     * @memberof TileWireframeLayer#
     * @param {AbstractGlobe} g globe
     * @private
     */
    TileWireframeLayer.prototype._attach = function(g) {
        AbstractLayer.prototype._attach.call(this, g);

        if (this.isVisible()) {
            this.getGlobe()
                .getTileManager()
                .addPostRenderer(this);
        }

        if (!this.program) {
            var vertexShader = "attribute vec3 vertex;\n";
            vertexShader += "uniform mat4 modelViewMatrix;\n";
            vertexShader += "uniform mat4 projectionMatrix;\n";
            vertexShader += "void main(void) \n";
            vertexShader += "{\n";
            vertexShader +=
                "	gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex, 1.0);\n";
            vertexShader += "}\n";

            var fragmentShader = "precision highp float; \n";
            fragmentShader += "uniform vec3 color; \n";
            fragmentShader += "uniform float alpha; \n";
            fragmentShader += "void main(void)\n";
            fragmentShader += "{\n";
            fragmentShader += "	gl_FragColor = vec4(color,alpha);\n";
            fragmentShader += "}\n";

            this.program = new Program(this.getGlobe().getRenderContext());
            this.program.createFromSource(vertexShader, fragmentShader);

            this.buildIndexBuffer();
        }
    };

    /**************************************************************************************************************/

    /**
     * Detaches the layer from the planet
     * @function _detach
     * @memberof TileWireframeLayer#
     * @private
     */
    TileWireframeLayer.prototype._detach = function() {
        this.getGlobe()
            .getTileManager()
            .removePostRenderer(this);
        AbstractLayer.prototype._detach.call(this);
    };

    /**************************************************************************************************************/

    /**
     * Renders the tiles outline
     * @function render
     * @memberof TileWireframeLayer#
     * @param {Array} tiles Array of Tile
     */
    TileWireframeLayer.prototype.render = function(tiles) {
        var rc = this.getGlobe().getRenderContext();
        var gl = rc.gl;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthFunc(gl.LEQUAL);

        // Setup program
        this.program.apply();
        gl.uniformMatrix4fv(
            this.program.uniforms.projectionMatrix,
            false,
            rc.projectionMatrix
        );

        var vertexAttribute = this.program.attributes.vertex;
        var currentIB = null;

        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];

            var isLoaded = tile.state === Tile.State.LOADED;
            var isLevelZero = tile.parentIndex === -1;

            // Update uniforms for modelview matrix
            mat4.multiply(rc.viewMatrix, tile.matrix, rc.modelViewMatrix);
            gl.uniformMatrix4fv(
                this.program.uniforms.modelViewMatrix,
                false,
                rc.modelViewMatrix
            );
            var color = this.getStyle().getStrokeColor();
            gl.uniform3f(
                this.program.uniforms.color,
                color[0],
                color[1],
                color[2]
            );
            gl.uniform1f(this.program.uniforms.alpha, this.getOpacity());

            // Bind the vertex buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, tile.vertexBuffer);
            gl.vertexAttribPointer(
                vertexAttribute,
                3,
                gl.FLOAT,
                false,
                4 * tile.config.vertexSize,
                0
            );
            var indexBuffer =
                isLoaded || isLevelZero
                    ? this.indexBuffer
                    : this.subIndexBuffer[tile.parentIndex];
            // Bind the index buffer only if different (index buffer is shared between tiles)
            if (currentIB !== indexBuffer) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                currentIB = indexBuffer;
            }

            // Draw the tiles in wireframe mode
            var numIndices = currentIB.numIndices;
            gl.drawElements(gl.LINES, numIndices, gl.UNSIGNED_SHORT, 0);
        }

        gl.disable(gl.BLEND);
        gl.depthFunc(gl.LESS);
    };

    /**************************************************************************************************************/

    /**
     * Get/Set visibility of the layer
     * @function setVisible
     * @memberof TileWireframeLayer#
     * @param {boolean} arg Visiblity
     */
    TileWireframeLayer.prototype.setVisible = function(arg) {
        AbstractLayer.prototype.setVisible.call(this, arg);

        if (typeof arg === "boolean") {
            if (this.isVisible()) {
                this.getGlobe()
                    .getTileManager()
                    .addPostRenderer(this);
            } else {
                this.getGlobe()
                    .getTileManager()
                    .removePostRenderer(this);
            }
        }

        return this.isVisible();
    };

    return TileWireframeLayer;
});
