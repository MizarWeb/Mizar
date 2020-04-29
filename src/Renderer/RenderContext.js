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

import $ from "jquery";
import Frustum from "./Frustum";
import "./glMatrix";
/**************************************************************************************************************/
/**
     @name RenderContext
     @class
         RenderContext constructor
     @param options Configuration properties for the Planet :
     <ul>
     <li>shadersPath : Shaders directory path ( "../shaders/" as default)</li>
     <li>tileErrorTreshold : Tile error treshold (4 as default)</li>
     <li>lighting : Lighting ? (false as default))</li>
     <li>continuousRendering : Have to continuously render ? (false as default)</li>
     </ul>
     @constructor
     */
var RenderContext = function (options) {
  this.activeAnimations = [];
  this.shadersPath = options.shadersPath || "../shaders/";
  this.tileErrorTreshold = options.tileErrorTreshold || 4;
  this.lighting = options.lighting || false;
  this.continuousRendering = options.continuousRendering || false;
  this.stats = null;
  this.isActive = true;

  // Init GL
  var canvas = null;

  // Check canvas options
  if (!options.canvas) {
    throw new ReferenceError("Mizar : no canvas in options");
  }

  if (typeof options.canvas === "string") {
    //canvas = document.getElementById(options.canvas);
    canvas = $(options.canvas);
  } else {
    canvas = options.canvas;
  }
  // Check canvas is valid
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new TypeError("Mizar : invalid canvas");
  }

  // Create the webl context
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var gl = null;
  for (var ii = 0; ii < names.length && gl === null; ++ii) {
    try {
      gl = canvas.getContext(names[ii], RenderContext.contextAttributes);
    } catch (e) {
      /* continue regardless of error */
    }
  }

  if (gl === null) {
    throw new ReferenceError("Mizar : WebGL context cannot be initialized");
  }

  if (options.backgroundColor) {
    var color = options.backgroundColor;
    gl.clearColor(color[0], color[1], color[2], color[3]);
  } else {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  }

  gl.getExtension("OES_element_index_uint");

  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  // Store local variable into static object
  this.viewMatrix = mat4.create();
  this.modelViewMatrix = mat4.create();
  this.projectionMatrix = mat4.create();
  this.viewProjectionMatrix = mat4.create();
  this.gl = gl;
  this.canvas = canvas;
  this.frustum = new Frustum();
  this.worldFrustum = new Frustum();
  this.localFrustum = new Frustum();
  this.eyePosition = vec3.create();
  this.eyeDirection = vec3.create();
  this.minNear = options.minNear || 1e-10;
  this.minFar = options.minFar || 0; // No limit on far
  this.near = 1.0;
  this.far = 6.0;
  this.numActiveAttribArray = 0;
  this.frameRequested = false;
  this.fov = 45;
  this.renderers = [];
  this.cameraUpdateFunction = null;

  this.lastFrameTime = null;
  this.currentFrameTime = null;
  this.totalElapsedTime = 0.0;
  this.deltaTime = 0.0;

  // Initialize the window requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function () {
      return (
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback, element) {
          window.setTimeout(callback, 1000 / 60);
        }
      );
    })();
  }

  var self = this;
  this.frameCallback = function () {
    self.frame();
  };
};

/**************************************************************************************************************/

/**
     The context attributes used when creating WebGL context, see WebGL specification.
     Can be changed by the renderers if needed, or by an external interface.
     */
RenderContext.contextAttributes = {};

/**************************************************************************************************************/

/**
 * Request a frame
 * @function requestFrame
 * @memberof RenderContext.prototype
 */
RenderContext.prototype.requestFrame = function () {
  if (!this.frameRequested) {
    window.requestAnimationFrame(this.frameCallback);
    this.frameRequested = true;
  }
};

/**************************************************************************************************************/

/**
 * Deactivate render context
 * @function deactivate
 * @memberof RenderContext.prototype
 */
RenderContext.prototype.deactivate = function () {
  this.isActive = false;
  this.frameRequested = false;
};

/**************************************************************************************************************/

/**
 * Activate render context
 * @function activate
 * @memberof RenderContext.prototype
 */
RenderContext.prototype.activate = function () {
  this.isActive = true;
};

/**************************************************************************************************************/

/**
 * Frame of the application
 * @function frame
 * @memberof RenderContext.prototype
 * @fires Context#startLoad
 * @fires Context#endLoad
 * @fires Context#baseLayersReady
 * @fires Context#baseLayersError
 * @fires Context#startBackgroundLoad
 * @fires Context#endBackgroundLoad
 * @fires Context#features:added
 */
RenderContext.prototype.frame = function () {
  if (this.isActive) {
    // Reset frame requested flag first
    this.frameRequested = false;

    var gl = this.gl;
    var i;

    if (this.stats) {
      this.stats.start("globalRenderTime");
    }

    // Update frame time infos
    this.lastFrameTime = this.currentFrameTime;
    this.currentFrameTime = Date.now();
    if (!this.lastFrameTime) {
      this.lastFrameTime = this.currentFrameTime;
    }

    const dt = this.currentFrameTime - this.lastFrameTime;
    this.totalElapsedTime += dt;
    this.deltaTime = dt;

    // Update active animations
    if (this.activeAnimations.length > 0) {
      for (i = 0; i < this.activeAnimations.length; i++) {
        this.activeAnimations[i].update(this.currentFrameTime);
      }
    }

    // Clear the buffer
    if (RenderContext.contextAttributes.stencil) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    } else {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    // Check canvas size is valid
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      return;
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.enable(WebGLRenderingContext.SCISSOR_TEST);
    gl.scissor(0, 0, this.canvas.width, this.canvas.height);

    // Update view dependent properties to be used during rendering : view matrix, frustum, projection, etc...
    if (this.cameraUpdateFunction) {
      this.cameraUpdateFunction();
    }
    this.updateViewDependentProperties();

    // Call render method of all registered renderers
    for (i = 0; i < this.renderers.length; i++) {
      this.renderers[i].render();
    }

    if (this.stats) {
      this.stats.end("globalRenderTime");
    }

    // Request next frame
    if (this.continuousRendering) {
      this.requestFrame();
    } else if (this.activeAnimations.length > 0) {
      this.requestFrame();
    }
  }
};

/**************************************************************************************************************/

/**
 * Update properies that depends on the view matrix
 * @function updateViewDependentProperties
 * @memberof RenderContext.prototype
 */
RenderContext.prototype.updateViewDependentProperties = function () {
  var inverseViewMatrix = mat4.create();
  mat4.inverse(this.viewMatrix, inverseViewMatrix);

  vec3.set([0.0, 0.0, 0.0], this.eyePosition);
  mat4.multiplyVec3(inverseViewMatrix, this.eyePosition);

  vec3.set([0.0, 0.0, -1.0], this.eyeDirection);
  mat4.rotateVec3(inverseViewMatrix, this.eyeDirection);

  // Init projection matrix
  mat4.perspective(this.fov, this.canvas.width / this.canvas.height, this.near, this.far, this.projectionMatrix);

  // No need to do this computation every time
  mat4.multiply(this.projectionMatrix, this.viewMatrix, this.viewProjectionMatrix);
  // Compute the frustum from the projection matrix
  this.frustum.compute(this.projectionMatrix);

  // Compute the world frustum
  this.worldFrustum.inverseTransform(this.frustum, this.viewMatrix);

  // Compute the pixel size vector from the current view/projection matrix
  this.pixelSizeVector = this.computePixelSizeVector();
};

/**************************************************************************************************************/

/**
 * Get mouse coordinates relative to the canvas element
 * @function getXYRelativeToCanvas
 * @memberof RenderContext.prototype
 * @param event
 * @return Coordinates
 */
RenderContext.prototype.getXYRelativeToCanvas = function (event) {
  // cf. http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
  var pos = [];
  if (event.pageX || event.pageY) {
    pos[0] = event.pageX;
    pos[1] = event.pageY;
  } else {
    pos[0] = event.offsetX + document.body.scrollLeft + document.documentElement.scrollLeft;
    pos[1] = event.offsetY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  var element = this.canvas;
  while (element) {
    pos[0] -= element.offsetLeft;
    pos[1] -= element.offsetTop;
    element = element.offsetParent;
  }

  return pos;
};

/**************************************************************************************************************/

/**
 * Compute the pixel size vector
 * @function computePixelSizeVector
 * @memberof RenderContext.prototype
 * @param mv
 * @return pixelSizeVector
 */
RenderContext.prototype.computePixelSizeVector = function (mv) {
  // pre adjust P00,P20,P23,P33 by multiplying them by the viewport window matrix.
  // here we do it in short hand with the knowledge of how the window matrix is formed
  // note P23,P33 are multiplied by an implicit 1 which would come from the window matrix.
  // Robert Osfield, June 2002.

  var width = this.canvas.width;
  var height = this.canvas.height;
  var P = this.projectionMatrix;
  var V = mv || this.viewMatrix;

  // scaling for horizontal pixels
  var P00 = P[0] * width * 0.5;
  var P20_00 = P[8] * width * 0.5 + P[11] * width * 0.5;
  var scale_00 = [V[0] * P00 + V[2] * P20_00, V[4] * P00 + V[6] * P20_00, V[8] * P00 + V[10] * P20_00];

  // scaling for vertical pixels
  var P10 = P[5] * height * 0.5;
  var P20_10 = P[9] * height * 0.5 + P[11] * height * 0.5;
  var scale_10 = [V[1] * P10 + V[2] * P20_10, V[5] * P10 + V[6] * P20_10, V[9] * P10 + V[10] * P20_10];

  var P23 = P[11];
  var P33 = P[15];
  var pixelSizeVector = [V[2] * P23, V[6] * P23, V[10] * P23, V[14] * P23 + V[15] * P33];

  var scaleRatio = 0.7071067811 / Math.sqrt(vec3.dot(scale_00, scale_00) + vec3.dot(scale_10, scale_10));
  pixelSizeVector[0] *= scaleRatio;
  pixelSizeVector[1] *= scaleRatio;
  pixelSizeVector[2] *= scaleRatio;
  pixelSizeVector[3] *= scaleRatio;

  return pixelSizeVector;
};

/**************************************************************************************************************/

/**
 * Get pixel from 3D
 * TODO: move it to Planet/Sky too ?
 * @function getPixelFrom3D
 * @memberof RenderContext.prototype
 * @param x
 * @param y
 * @param z
 * @return {Array} Point as array of 2 float
 */
RenderContext.prototype.getPixelFrom3D = function (x, y, z) {
  var viewProjectionMatrix = mat4.create();
  mat4.multiply(this.projectionMatrix, this.viewMatrix, viewProjectionMatrix);

  // transform world to clipping coordinates
  var point3D = [x, y, z, 1];
  mat4.project(viewProjectionMatrix, point3D);

  // transform clipping to window coordinates
  var winX = Math.round((1 + point3D[0]) * 0.5 * this.canvas.width);

  // reverse y because (0,0) is top left but opengl's normalized
  // device coordinate (-1,-1) is bottom left
  var winY = Math.round((1 - point3D[1]) * 0.5 * this.canvas.height);

  return [winX, winY];
};

/**************************************************************************************************************/

/**
 * Create a non power of two texture from an image
 * @function createNonPowerOfTwoTextureFromImage
 * @memberof RenderContext.prototype
 * @param image
 * @param invertY
 * @return Texture
 */
RenderContext.prototype.createNonPowerOfTwoTextureFromImage = function (image, invertY) {
  var gl = this.gl;
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, invertY);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Restore to default
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  return tex;
};

/**
 * Returns the canvas
 * @returns {Object} canvas
 */
RenderContext.prototype.getCanvas = function () {
  return this.canvas;
};

/**
 * Returns the field of view in decimal degree.
 * @returns {Object} field of view
 */
RenderContext.prototype.getFov = function () {
  return this.fov;
};

/**
 * Sets the field of fiew in decimal degree.
 * @param fov field of view
 */
RenderContext.prototype.setFov = function (fov) {
  this.fov = fov;
};

/**
 * Returns the world frustum.
 * @returns {Frustum} frustum
 */
RenderContext.prototype.getWorldFrustum = function () {
  return this.worldFrustum;
};

/**
 * Returns the view matrix.
 * @returns {mat4}
 */
RenderContext.prototype.getViewMatrix = function () {
  return this.viewMatrix;
};

/**
 * Sets the view matrix.
 * @param {mat4} mat4 the matrix
 */
RenderContext.prototype.setViewMatrix = function (mat4) {
  this.viewMatrix = mat4;
};

/**************************************************************************************************************/

export default RenderContext;
