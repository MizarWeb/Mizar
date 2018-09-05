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
	 @name Program
	 @class
	   Program constructor
	 @param renderContext
	 @constructor
	 */
    var Program = function(renderContext) {
        this.renderContext = renderContext;
        this.glProgram = null;
        this.attributes = {};
        this.uniforms = {};
        this.numActiveAttribArray = 0;
    };

    /**************************************************************************************************************/

    /**
     * Creates a shader of the given type from the given source string
     * @function createShader
     * @memberof Program.prototype
     * @param type
     * @param source
     * @return Shader
     */
    Program.prototype.createShader = function(type, source) {
        var gl = this.renderContext.gl;
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(
                "Shader compilation error: " + gl.getShaderInfoLog(shader)
            );
            console.error(source);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    };

    /**************************************************************************************************************/

    /**
     * Create the program from source shaders
     * @function createFromSource
     * @memberof Program.prototype
     * @param vertexSource
     * @param fragmentSource
     * @return {Boolean}
     */
    Program.prototype.createFromSource = function(
        vertexSource,
        fragmentSource
    ) {
        var gl = this.renderContext.gl;

        //  Create the gl shaders from the source
        var vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        var fragmentShader = this.createShader(
            gl.FRAGMENT_SHADER,
            fragmentSource
        );
        if (vertexShader === null || fragmentShader === null) {
            return false;
        }

        var i;

        // Create the program and attach the shaderss
        this.glProgram = gl.createProgram();
        gl.attachShader(this.glProgram, vertexShader);
        gl.attachShader(this.glProgram, fragmentShader);

        // Link and test the program is ok
        gl.linkProgram(this.glProgram);
        if (!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
            console.log(
                "Program link error: " + gl.getProgramInfoLog(this.glProgram)
            );
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(this.glProgram);
            this.glProgram = null;
            return false;
        }

        // Get vertex attributes used in the program, stored them in an attributes object
        var attributeCount = gl.getProgramParameter(
            this.glProgram,
            gl.ACTIVE_ATTRIBUTES
        );
        this.numActiveAttribArray = 0;
        for (i = 0; i < attributeCount; ++i) {
            var attribute = gl.getActiveAttrib(this.glProgram, i);
            var loc = gl.getAttribLocation(this.glProgram, attribute.name);
            this.attributes[attribute.name] = loc;

            if (loc + 1 > this.numActiveAttribArray) {
                this.numActiveAttribArray = loc + 1;
            }
        }

        // Get uniforms used in the program, stored them in an uniforms object
        var uniformCount = gl.getProgramParameter(
            this.glProgram,
            gl.ACTIVE_UNIFORMS
        );
        for (i = 0; i < uniformCount; ++i) {
            var uniform = gl.getActiveUniform(this.glProgram, i);
            this.uniforms[uniform.name] = gl.getUniformLocation(
                this.glProgram,
                uniform.name
            );
        }

        return true;
    };

    /**************************************************************************************************************/

    /**
     * Load from file (must be located on the server)
     * @function loadFromFile
     * @memberof Program.prototype
     * @param vertexFile
     * @param fragmentFile
     * @return {Boolean}
     */
    Program.prototype.loadFromFile = function(vertexFile, fragmentFile) {
        var xhr = new XMLHttpRequest();
        xhr.open("get", this.renderContext.shadersPath + vertexFile, false);
        xhr.send(null);

        var vertexSource = xhr.responseText;
        xhr.open("get", this.renderContext.shadersPath + fragmentFile, false);
        xhr.send(null);
        var fragmentSource = xhr.responseText;

        return this.createFromSource(vertexSource, fragmentSource);
    };

    /**************************************************************************************************************/

    /**
     * Apply the programs
     * @function apply
     * @memberof Program.prototype
     */
    Program.prototype.apply = function() {
        var rc = this.renderContext;
        var gl = rc.gl;
        var i;

        // Bind program
        gl.useProgram(this.glProgram);

        for (i = rc.numActiveAttribArray; i < this.numActiveAttribArray; i++) {
            gl.enableVertexAttribArray(i);
        }
        for (i = this.numActiveAttribArray; i < rc.numActiveAttribArray; i++) {
            gl.disableVertexAttribArray(i);
        }
        rc.numActiveAttribArray = this.numActiveAttribArray;
    };

    /**************************************************************************************************************/

    /**
     * Dispose the program
     * @function dispose
     * @memberof Program.prototype
     */
    Program.prototype.dispose = function() {
        this.renderContext.gl.deleteProgram(this.glProgram);
    };

    /**************************************************************************************************************/

    return Program;
});
