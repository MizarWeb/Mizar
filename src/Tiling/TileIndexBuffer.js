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
    /**************************************************************************************************************/

    /**
     @constructor TileIndexBuffer
     TileIndexBuffer
     */
    var TileIndexBuffer = function(renderContext, config) {
        this.renderContext = renderContext;
        this.config = config;
        this.solidIndexBuffer = null;
        this.indices = null;
        this.subSolidIndexBuffer = [null, null, null, null];
        this.subIndices = [null, null, null, null];
    };

    /**************************************************************************************************************/

    /**
     * Reset the index buffers.
     */
    TileIndexBuffer.prototype.reset = function() {
        var gl = this.renderContext.gl;
        for (var i = 0; i < 4; i++) {
            if (this.subSolidIndexBuffer[i]) {
                gl.deleteBuffer(this.subSolidIndexBuffer[i]);
                this.subSolidIndexBuffer[i] = null;
            }
        }
        if (this.solidIndexBuffer) {
            gl.deleteBuffer(this.solidIndexBuffer);
            this.solidIndexBuffer = null;
        }
    };

    /**************************************************************************************************************/

    /**
     *    Get index buffer for sub solid
     */
    TileIndexBuffer.prototype.getSubSolid = function(ii) {
        if (this.subSolidIndexBuffer[ii] === null) {
            var i = ii % 2;
            var j = Math.floor(ii / 2);
            var n, k;

            var size = this.config.tesselation;
            var halfTesselation = (size - 1) / 2;

            // Build the sub grid for 'inside' tile
            var indices = [];
            for (n = halfTesselation * j; n < halfTesselation * (j + 1); n++) {
                for (
                    k = halfTesselation * i;
                    k < halfTesselation * (i + 1);
                    k++
                ) {
                    indices.push(n * size + k);
                    indices.push((n + 1) * size + k);
                    indices.push(n * size + k + 1);

                    indices.push(n * size + k + 1);
                    indices.push((n + 1) * size + k);
                    indices.push((n + 1) * size + k + 1);
                }
            }

            this.subIndices[ii] = indices;

            if (this.config.skirt) {
                // Build skirts
                // Top skirt
                var start = j === 0 ? size * size : size * size + 4 * size;
                var src = j === 0 ? 0 : halfTesselation * size;
                for (
                    n = halfTesselation * i;
                    n < halfTesselation * (i + 1);
                    n++
                ) {
                    indices.push(start + n);
                    indices.push(src + n);
                    indices.push(start + n + 1);

                    indices.push(start + n + 1);
                    indices.push(src + n);
                    indices.push(src + n + 1);
                }

                // Bottom skirt
                start = j === 0 ? size * size + 4 * size : size * size + size;
                src = j === 0 ? halfTesselation * size : (size - 1) * size;
                for (
                    n = halfTesselation * i;
                    n < halfTesselation * (i + 1);
                    n++
                ) {
                    indices.push(src + n);
                    indices.push(start + n);
                    indices.push(src + n + 1);

                    indices.push(src + n + 1);
                    indices.push(start + n);
                    indices.push(start + n + 1);
                }

                // Left skirt
                start =
                    i === 0 ? size * size + 2 * size : size * size + 5 * size;
                src = i === 0 ? 0 : halfTesselation;
                for (
                    k = halfTesselation * j;
                    k < halfTesselation * (j + 1);
                    k++
                ) {
                    indices.push(start + k);
                    indices.push(start + k + 1);
                    indices.push(src + k * size);

                    indices.push(src + k * size);
                    indices.push(start + k + 1);
                    indices.push(src + (k + 1) * size);
                }

                // Right skirt
                start =
                    i === 0 ? size * size + 5 * size : size * size + 3 * size;
                src = i === 0 ? halfTesselation : size - 1;
                for (
                    k = halfTesselation * j;
                    k < halfTesselation * (j + 1);
                    k++
                ) {
                    indices.push(k * size + src);
                    indices.push((k + 1) * size + src);
                    indices.push(start + k);

                    indices.push(start + k);
                    indices.push((k + 1) * size + src);
                    indices.push(start + k + 1);
                }
            }

            var gl = this.renderContext.gl;
            var ib = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(indices),
                gl.STATIC_DRAW
            );
            ib.numIndices = indices.length;
            this.subSolidIndexBuffer[ii] = ib;
        }

        return this.subSolidIndexBuffer[ii];
    };

    /**************************************************************************************************************/

    /*
     Build index buffer
     */
    TileIndexBuffer.prototype.getSolid = function() {
        if (this.solidIndexBuffer === null) {
            var i, j;
            var size = this.config.tesselation;
            this.indices = [];
            // Build the grid
            for (j = 0; j < size - 1; j++) {
                for (i = 0; i < size - 1; i++) {
                    this.indices.push(j * size + i);
                    this.indices.push((j + 1) * size + i);
                    this.indices.push(j * size + i + 1);

                    this.indices.push(j * size + i + 1);
                    this.indices.push((j + 1) * size + i);
                    this.indices.push((j + 1) * size + i + 1);
                }
            }

            if (this.config.skirt) {
                // Top skirt
                var start = size * size;
                for (i = 0; i < size - 1; i++) {
                    this.indices.push(start + i);
                    this.indices.push(i);
                    this.indices.push(start + i + 1);

                    this.indices.push(start + i + 1);
                    this.indices.push(i);
                    this.indices.push(i + 1);
                }

                // Bottom skirt
                start += size;
                for (i = 0; i < size - 1; i++) {
                    this.indices.push((size - 1) * size + i);
                    this.indices.push(start + i);
                    this.indices.push((size - 1) * size + i + 1);

                    this.indices.push((size - 1) * size + i + 1);
                    this.indices.push(start + i);
                    this.indices.push(start + i + 1);
                }

                // Left skirt
                start += size;
                for (j = 0; j < size - 1; j++) {
                    this.indices.push(start + j);
                    this.indices.push(start + j + 1);
                    this.indices.push(j * size);

                    this.indices.push(j * size);
                    this.indices.push(start + j + 1);
                    this.indices.push((j + 1) * size);
                }

                // Right skirt
                start += size;
                for (j = 0; j < size - 1; j++) {
                    this.indices.push(j * size + size - 1);
                    this.indices.push((j + 1) * size + size - 1);
                    this.indices.push(start + j);

                    this.indices.push(start + j);
                    this.indices.push((j + 1) * size + size - 1);
                    this.indices.push(start + j + 1);
                }
            }

            var gl = this.renderContext.gl;
            var ib = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(this.indices),
                gl.STATIC_DRAW
            );
            this.numIndices = this.indices.length;

            this.solidIndexBuffer = ib;
            this.solidIndexBuffer.numIndices = this.indices.length;
        }

        return this.solidIndexBuffer;
    };

    /**************************************************************************************************************/

    return TileIndexBuffer;
});
