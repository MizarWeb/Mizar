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
    "../Utils/Constants",
    "./RenderContext",
    "./VectorRenderer",
    "./RendererManager",
    "./Program",
    "./pnltri",
    "../Gui/dialog/ErrorDialog"
], function(
    Utils,
    Constants,
    RenderContext,
    VectorRenderer,
    RendererManager,
    Program,
    PNLTRI,
    ErrorDialog
) {
    /**************************************************************************************************************/
    /**
  @name StencilPolygonRenderer
  @class
	  Basic renderer for polygon
  @param {AbstractGlobe} globe AbstractGlobe
  @constructor
  */
    var StencilPolygonRenderer = function(globe) {
        VectorRenderer.prototype.constructor.call(this, globe);
        this.maxTilePerGeometry = 0;

        this.vertexShader = "attribute vec3 vertex;\n";
        this.vertexShader += "uniform mat4 viewProjectionMatrix;\n";
        this.vertexShader += "void main(void) \n";
        this.vertexShader += "{\n";
        this.vertexShader +=
            "	gl_Position = viewProjectionMatrix * vec4(vertex, 1.0);\n";
        this.vertexShader += "}\n";

        var fragmentShader = "precision lowp float; \n";
        fragmentShader += "uniform vec4 u_color;\n";
        fragmentShader += "void main(void)\n";
        fragmentShader += "{\n";
        fragmentShader += "	gl_FragColor = u_color;\n";
        fragmentShader += "}\n";

        this.program = new Program(globe.renderContext);
        this.program.createFromSource(this.vertexShader, fragmentShader);
    };

    Utils.inherits(VectorRenderer, StencilPolygonRenderer);

    /**************************************************************************************************************/
    /**
   @name PolygonRenderable
   @class
 	  Renderable constructor for Polygon
   @param {Bucket} bucket Bucket
   @constructor
   */
    var PolygonRenderable = function(bucket) {
        this.bucket = bucket;
        this.geometry = null;
        this.vertexBuffer = null;
        this.indexBuffer = null;
    };

    /**************************************************************************************************************/

    /**
     * Add polygon to renderer
     * @function add
     * @memberof PolygonRenderable.prototype
     * @param geometry
     */
    PolygonRenderable.prototype.add = function(geometry) {
        this.geometry = geometry;

        var renderer = this.bucket.renderer;
        var gl = renderer.tileManager.renderContext.gl;

        var polygons =
            geometry.type === Constants.GEOMETRY.MultiPolygon
                ? geometry.coordinates
                : [geometry.coordinates];

        var vertices = [];
        var indices = [];
        var pos3d = [];
        var i, n;
        for (n = 0; n < polygons.length; n++) {
            // Only contour
            var coords = polygons[n][0];

            var indexOffset = indices.length;
            var vertexOffset = vertices.length / 3;

            var topIndex = vertexOffset;
            var bottomIndex = (vertexOffset + coords.length) * 3;
            for (i = 0; i < coords.length; i++) {
                var coord = [coords[i][0], coords[i][1], 50000];
                renderer.globe
                    .getCoordinateSystem()
                    .get3DFromWorldInCrs(
                        coord,
                        geometry.crs.properties.name,
                        pos3d
                    );
                vertices[topIndex] = pos3d[0];
                vertices[topIndex + 1] = pos3d[1];
                vertices[topIndex + 2] = pos3d[2];

                coord[2] = -50000;

                renderer.globe
                    .getCoordinateSystem()
                    .get3DFromWorldInCrs(
                        coord,
                        geometry.crs.properties.name,
                        pos3d
                    );
                vertices[bottomIndex] = pos3d[0];
                vertices[bottomIndex + 1] = pos3d[1];
                vertices[bottomIndex + 2] = pos3d[2];

                topIndex += 3;
                bottomIndex += 3;
            }

            // Build triangle indices for upper polygon
            var triangulator = new PNLTRI.Triangulator();
            var contour = coords.map(function(value) {
                return { x: value[0], y: value[1] };
            });
            var triangList = triangulator.triangulate_polygon([contour]);
            for (i = 0; i < triangList.length; i++) {
                indices.push(
                    vertexOffset + triangList[i][0],
                    vertexOffset + triangList[i][1],
                    vertexOffset + triangList[i][2]
                );
            }

            if (indices.length === 0) {
                ErrorDialog.open(Constants.LEVEL.DEBUG, "StencilPolygonRenderer.js", "Triangulation error ! Check if your GeoJSON geometry is valid");
                return false;
            }

            var numTopIndices = indices.length;

            // Add side
            topIndex = vertexOffset;
            bottomIndex = vertexOffset + coords.length;
            for (i = 0; i < coords.length - 1; i++) {
                indices.push(topIndex, bottomIndex, topIndex + 1);
                indices.push(topIndex + 1, bottomIndex, bottomIndex + 1);
                //indices.push( topIndex, topIndex + 1, bottomIndex  );
                //indices.push( topIndex + 1, bottomIndex + 1, bottomIndex );

                topIndex++;
                bottomIndex++;
            }

            // Add bottom : invert top indices and add offset
            for (i = 0; i < numTopIndices; i += 3) {
                indices.push(
                    indices[indexOffset + i] + coords.length,
                    indices[indexOffset + i + 2] + coords.length,
                    indices[indexOffset + i + 1] + coords.length
                );
            }
        }

        this.numTriIndices = indices.length;

        // Create vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(vertices),
            gl.STATIC_DRAW
        );

        // Create index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            gl.STATIC_DRAW
        );
    };

    /**************************************************************************************************************/

    /**
 * Remove a geometry from the renderable
 * @function remove
 * @memberof PolygonRenderable.prototype
 * @param geometry

 */
    PolygonRenderable.prototype.remove = function(geometry) {
        if (this.geometry === geometry) {
            this.geometry = null;
            // Since there is only one geometry per bucket
            // return 0 to dispose geometry resources
            return 0;
        }
    };

    /**************************************************************************************************************/

    /**
     * Dispose the renderable
     * @function dispose
     * @memberof PolygonRenderable.prototype
     * @param renderContext
     */
    PolygonRenderable.prototype.dispose = function(renderContext) {
        var gl = renderContext.gl;
        if (this.vertexBuffer) {
            gl.deleteBuffer(this.vertexBuffer);
        }
        if (this.indexBuffer) {
            gl.deleteBuffer(this.indexBuffer);
        }
    };

    /**************************************************************************************************************/
    /**
   @name PolygonBucket
   @class
 	  Bucket constructor for PolygonRenderer
   @param layer
	 @param style
   @constructor
   */
    var PolygonBucket = function(layer, style) {
        this.layer = layer;
        this.style = style;
        this.renderer = null;
    };

    /**************************************************************************************************************/

    /**
     * Create a renderable for this bucket
     * @function createRenderable
     * @memberof PolygonBucket.prototype
     * @return {PolygonRenderable} Renderable
     */
    PolygonBucket.prototype.createRenderable = function() {
        return new PolygonRenderable(this);
    };

    /**************************************************************************************************************/

    /**
     * Check if a bucket is compatible
     * @function isCompatible
     * @memberof PolygonBucket.prototype
     * @param style
     * @return {Boolean} Is compatible ?
     */
    PolygonBucket.prototype.isCompatible = function(style) {
        return false;
    };

    /**************************************************************************************************************/

    /**
     * Render all the polygons
     * @function render
     * @memberof StencilPolygonRenderer.prototype
     * @param renderables
     * @param {Integer} start Start index
     * @param {Integer} end End index
     */
    StencilPolygonRenderer.prototype.render = function(
        renderables,
        start,
        end
    ) {
        var renderContext = this.globe.renderContext;
        var gl = renderContext.gl;

        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Configure stencil
        gl.enable(gl.STENCIL_TEST);
        gl.stencilMask(255);
        gl.depthMask(false);

        this.program.apply();

        // The shader only needs the viewProjection matrix, use GlobWeb.modelViewMatrix as a temporary storage
        mat4.multiply(
            renderContext.projectionMatrix,
            renderContext.viewMatrix,
            renderContext.modelViewMatrix
        );
        gl.uniformMatrix4fv(
            this.program.uniforms.viewProjectionMatrix,
            false,
            renderContext.modelViewMatrix
        );

        for (var n = start; n < end; n++) {
            var renderable = renderables[n];

            var style = renderable.bucket.style;
            gl.uniform4f(
                this.program.uniforms.u_color,
                style.fillColor[0],
                style.fillColor[1],
                style.fillColor[2],
                style.fillColor[3] * renderable.bucket.layer.getOpacity()
            ); // use fillColor

            gl.bindBuffer(gl.ARRAY_BUFFER, renderable.vertexBuffer);
            gl.vertexAttribPointer(
                this.program.attributes.vertex,
                3,
                gl.FLOAT,
                false,
                0,
                0
            );

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderable.indexBuffer);

            //create the mask
            gl.disable(gl.CULL_FACE);
            gl.colorMask(false, false, false, false);
            gl.depthFunc(gl.LESS);
            gl.stencilFunc(gl.ALWAYS, 0, 0);
            gl.disable(gl.CULL_FACE);
            //set the stencil buffer operation
            gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.INCR_WRAP, gl.KEEP);
            gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.DECR_WRAP, gl.KEEP);
            // draw the vector data
            gl.drawElements(
                gl.TRIANGLES,
                renderable.numTriIndices,
                gl.UNSIGNED_SHORT,
                0
            );

            // render the color
            gl.colorMask(true, true, true, true);
            gl.disable(gl.DEPTH_TEST);
            //set the stencil buffer operation
            gl.stencilFunc(gl.NOTEQUAL, 0, 1);
            gl.stencilOp(gl.ZERO, gl.ZERO, gl.ZERO);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);

            gl.drawElements(
                gl.TRIANGLES,
                renderable.numTriIndices,
                gl.UNSIGNED_SHORT,
                0
            );
            gl.enable(gl.DEPTH_TEST);
        }

        gl.depthMask(true);
        gl.disable(gl.STENCIL_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
    };

    /**************************************************************************************************************/

    /**
     * Check if renderer is applicable
     * @function canApply
     * @memberof StencilPolygonRenderer.prototype
     * @param type
     * @param style
     * @return {Boolean} Can apply ?
     */
    StencilPolygonRenderer.prototype.canApply = function(type, style) {
        return (
            (type === Constants.GEOMETRY.Polygon ||
                type === Constants.GEOMETRY.MultiPolygon) &&
            style.fill
        );
    };

    /**************************************************************************************************************/

    /**
     * Create a bucket
     * @function createBucket
     * @memberof StencilPolygonRenderer.prototype
     * @param layer
     * @param style
     * @return {PolygonBucket} Bucket
     */
    StencilPolygonRenderer.prototype.createBucket = function(layer, style) {
        return new PolygonBucket(layer, style);
    };

    /**************************************************************************************************************/

    // Add stencil for default context attributes
    RenderContext.contextAttributes.stencil = true;

    // Register the renderer
    RendererManager.factory.push(function(globe) {
        return new StencilPolygonRenderer(globe);
    });
});
