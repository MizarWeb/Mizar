/*******************************************************************************
 * Copyright 2017 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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

define( ['../Utils/Constants','../Utils/Utils', '../Utils/Numeric', './VectorRenderer','./VectorRendererManager','./Program','./BatchRenderable'],
	function(Constants,Utils,Numeric,VectorRenderer,VectorRendererManager,Program,BatchRenderable) {

/**************************************************************************************************************/

 /**
 	@name LineRenderer
 	@class
 	 Basic renderer to animate lines with gradient color texture
 	@param {AbstractGlobe} globe AbstractGlobe
 	@constructor
 	*/
var LineRenderer = function(globe)
{
	VectorRenderer.prototype.constructor.call( this, globe );
	this.maxTilePerGeometry = 2;
	this.renderContext = globe.getRenderContext();

	this.defaultVertexShader = "attribute vec4 vertex;\n";
	this.defaultVertexShader+= "uniform mat4 mvp;\n";
	this.defaultVertexShader+= "varying float s;\n";
	this.defaultVertexShader+= "void main(void) \n";
	this.defaultVertexShader+= "{\n";
	this.defaultVertexShader+= "	s = vertex.w;\n";
	this.defaultVertexShader+= "	gl_Position = mvp * vec4(vertex.xyz, 1.0);\n";
	this.defaultVertexShader+= "}\n";

	this.fragmentShader = "precision lowp float; \n";
	this.fragmentShader+= "uniform vec4 u_color;\n";
	this.fragmentShader+= "uniform float speed;\n";
	this.fragmentShader+= "uniform float time;\n";
	this.fragmentShader+= "uniform float gradientLength;\n";
	this.fragmentShader+= "varying float s;\n";
	this.fragmentShader+= "uniform sampler2D colorTexture;\n";
	this.fragmentShader+= "void main(void)\n";
	this.fragmentShader+= "{\n";
	this.fragmentShader+= "	// 0.5 is a time scale parameter, parametrize it ?\n";
	this.fragmentShader+= "	float m = speed * time * 0.5;\n";
	this.fragmentShader+= "	float u = (-s+m)/gradientLength;\n";
	this.fragmentShader+= "	gl_FragColor.rgb = texture2D(colorTexture, vec2(u,0.)).rgb;\n";
	this.fragmentShader+= "	// TODO: handle appereance of rivers\n";
	this.fragmentShader+= "	if ( s < m )\n";
	this.fragmentShader+= "	{\n";
	this.fragmentShader+= "		gl_FragColor.a = 1.0;\n";
	this.fragmentShader+= "	}\n";
	this.fragmentShader+= "	else\n";
	this.fragmentShader+= "	{\n";
	this.fragmentShader+= "		gl_FragColor.a = 0.0;\n";
	this.fragmentShader+= "	}\n";
  this.fragmentShader+= "}\n";

	this.program = new Program(globe.renderContext);
	this.program.createFromSource(this.defaultVertexShader, this.fragmentShader);

	this.time = Date.now() / 1000; // Store it in seconds
	this.palette = null; // Palette is an array containing two colors(start/end and the middle one)
	this.colorTexture = this.generateTexture([[0.0,0.0,255.0],[0.0,200.0,255.0]]);
};

/**************************************************************************************************************/

Utils.inherits(VectorRenderer,LineRenderer);

/**************************************************************************************************************/

/**
 * Generate color texture from palette
 * The generated gradient is of type : start color -> middle color -> start color
 * @function generateTexture
 * @memberof LineRenderer.prototype
 * @param palette
 */
LineRenderer.prototype.generateTexture = function(palette)
{
	var startColor = palette[0];
	var middleColor = palette[1];
  	var i,r,g,b;
	var pixels = [];
	var gl = this.globe.renderContext.gl;
	this.colorTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);

	for ( i=0; i<128; i++ )
	{
		r = Numeric.coserp( i/128, startColor[0], middleColor[0] );
		g = Numeric.coserp( i/128, startColor[1], middleColor[1] );
		b = Numeric.coserp( i/128, startColor[2], middleColor[2] );
		pixels.push(r);
		pixels.push(g);
		pixels.push(b);
		pixels.push(255);
	}
	for ( i=0; i<128; i++ )
	{
		r = Numeric.coserp( i/128, middleColor[0], startColor[0] );
		g = Numeric.coserp( i/128, middleColor[1], startColor[1] );
		b = Numeric.coserp( i/128, middleColor[2], startColor[2] );
		pixels.push(r);
		pixels.push(g);
		pixels.push(b);
		pixels.push(255);
	}
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pixels.length / 4, 1, 0,
	              gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixels));
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

	this.palette = palette;
};

/**************************************************************************************************************/
 /**
 	@name LineRenderable
 	@class
 	 Renderable constructor for Line
 	@param {Bucket} bucket Bucket
	@augments BatchRenderable
 	@constructor
 	*/

var LineRenderable = function(bucket)
{
	BatchRenderable.prototype.constructor.call( this, bucket );

	this.vertexSize = 4;

	// TODO : remove matrix ??
	this.matrix = mat4.create();
	mat4.identity(this.matrix);
};

/**************************************************************************************************************/

Utils.inherits(BatchRenderable,LineRenderable);

/**************************************************************************************************************/

/**
 * Build vertices and indices for the given geometry
 * @function build
 * @memberof LineRenderable.prototype
 * @param geometry
 */
LineRenderable.prototype.build = function(geometry)
{
	var renderer = this.bucket.renderer;
	var style = this.bucket.style;
  var i,n;

	var lines =  (geometry.type === Constants.GEOMETRY.MultiLineString) ? geometry.coordinates : [geometry.coordinates];

	var currentPoint = vec3.create();
	var previousPoint = vec3.create();

	for ( n=0; n < lines.length; n++ ) {

		var coords = lines[n];

		var lastIndex = this.vertices.length / 4;
		var coordinateSystem = renderer.globe.getCoordinateSystem();

		// Build line vertices
		var offset = lastIndex * 4;
		var s = 0;
		for ( i=0; i < coords.length; i++)
		{
			coordinateSystem.get3DFromWorldInCrs(coords[i], geometry.crs.properties.name, currentPoint);
			this.vertices[offset] = currentPoint[0];
			this.vertices[offset+1] = currentPoint[1];
			this.vertices[offset+2] = currentPoint[2];
			// Compute s(length) between two points
			if ( i > 0 )
			{
				s += vec3.dist(currentPoint, previousPoint);
			}

			// Update previous point(do it by swapping with current cuz it's the same object)
			var tmp = previousPoint;
			previousPoint = currentPoint;
			currentPoint = tmp;

			this.vertices[offset+3] = s;
			offset += 4;
		}

		// Build line indices
		for ( i = 0; i < coords.length-1; i++ )
		{
			this.lineIndices.push( lastIndex + i, lastIndex + i + 1 );
		}
	}
	// Geometry is always added contrary to tiled renderables
	return true;
};

/**************************************************************************************************************/
 /**
 	@name LineBucket
 	@class
 	 Bucket constructor for LineRenderer
 	@param layer
	@param style
 	@constructor
 	*/
var LineBucket = function(layer,style)
{
	this.layer = layer;
	this.style = style;
	this.renderer = null;
};

/**************************************************************************************************************/

/**
 * Create a renderable for this bucket
 * @function createRenderable
 * @memberof LineBucket.prototype
 */
LineBucket.prototype.createRenderable = function()
{
	return new LineRenderable(this);
};

/**************************************************************************************************************/

/**
 * Check if a bucket is compatible
 * @function is Compatible
 * @memberof LineBucket.prototype
 * @param style
 * @return {Boolean} Is compatible ?
 */
LineBucket.prototype.isCompatible = function(style)
{
	return this.style === style;
};

/**************************************************************************************************************/

/**
 * 	Render all the polygons
 * @function render
 * @memberof LineRenderer.prototype
 * @param renderables
 * @param {Integer} start Start index
 * @param {Integer} end End index
 */
LineRenderer.prototype.render = function(renderables, start, end)
{
	var renderContext = this.globe.renderContext;
	var gl = renderContext.gl;

	gl.enable(gl.BLEND);
	gl.blendEquation(gl.FUNC_ADD);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.depthFunc(gl.LEQUAL);
	//gl.enable(gl.POLYGON_OFFSET_FILL);
	//gl.polygonOffset(-2.0,-2.0);
	//gl.disable(gl.DEPTH_TEST);

	// Compute the viewProj matrix
	var viewProjMatrix = mat4.create();
	mat4.multiply(renderContext.projectionMatrix, renderContext.viewMatrix, viewProjMatrix);
	var modelViewProjMatrix = mat4.create();

	this.program.apply();

	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(this.program.uniforms.colorTexture, 0);
	gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);

	for ( var n = start; n < end; n++ )
	{
		var renderable = renderables[n];
		var style = renderable.bucket.style;

		mat4.multiply(viewProjMatrix,renderable.matrix,modelViewProjMatrix);
		gl.uniformMatrix4fv(this.program.uniforms.mvp, false, modelViewProjMatrix);

		if ( style.palette && style.palette !== this.palette )
		{
			// Generate new color texture(create an array of color textures per bucket ?)
			gl.deleteTexture( this.colorTexture );
			this.generateTexture(style.palette);
		}

		gl.lineWidth( style.strokeWidth );

		// Update uniforms
		gl.uniform4f(this.program.uniforms.color, style.strokeColor[0], style.strokeColor[1], style.strokeColor[2], style.strokeColor[3] * renderable.bucket.layer.getOpacity());
		gl.uniform1f(this.program.uniforms.speed, style.hasOwnProperty('speed') ? style.speed : 1.0);
		gl.uniform1f(this.program.uniforms.time, Date.now()/1000 - this.time);
		gl.uniform1f(this.program.uniforms.gradientLength, style.hasOwnProperty('gradientLength') ? style.gradientLength : 10.0);

		renderable.bindBuffers( renderContext );

		gl.vertexAttribPointer(this.program.attributes.vertex, 4, gl.FLOAT, false, 0, 0);

		// Draw
		gl.drawElements( gl.LINES, renderable.lineIndices.length, renderable.indexType, 0);
	}

	// Revert to default
	gl.lineWidth(1);

	//gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.POLYGON_OFFSET_FILL);
	gl.depthFunc(gl.LESS);
	gl.disable(gl.BLEND);
};

/**************************************************************************************************************/

/**
 * Check if renderer is applicable
 * @function canApply
 * @memberof LineRenderer.prototype
 * @return {Boolean} Can apply ?
 */
LineRenderer.prototype.canApply = function(type,style)
{
	return (type === Constants.GEOMETRY.LineString || type === Constants.GEOMETRY.MultiLineString) && style.gradientLength;
};

/**************************************************************************************************************/

/**
 * Create a bucket
 * @function createBucket
 * @memberof LineRenderer.prototype
 * @param layer
 * @param style
 * @return {LineBucket} Line bucket
 */
LineRenderer.prototype.createBucket = function(layer,style)
{
	return new LineBucket(layer,style);
};

/**************************************************************************************************************/

// Register the renderer
VectorRendererManager.factory.push( function(globe) { return new LineRenderer(globe); } );

});
