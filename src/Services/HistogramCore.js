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
/*global define: false */

/**
 * Histogram module : create histogram to the given image
 */
define(["./Triangle"], function(Triangle) {
    // Private variables
    var nbBins;
    var self;

    var canvas;
    var hist = [];
    var hmax; // histogram max to scale in image space

    // Origin histogram point
    var originX;
    var originY;
    var hwidth;
    var paddingBottom;
    var triangleHalfWidth;

    /**************************************************************************************************************/

    /**
     * Get mouse position on canvas
     * @param {HTMLElement} canvas
     * @param {Event} evt
     * @returns {{x: number, y: number}}
     */
    function _getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function _handleMouseDown(evt) {
        var mousePos = _getMousePos(canvas, evt);

        if (self.minThreshold.contains([mousePos.x, mousePos.y, 0])) {
            self.minThreshold.dragging = true;
            self.minThreshold.draw(self.ctx);
        }

        if (self.maxThreshold.contains([mousePos.x, mousePos.y, 0])) {
            self.maxThreshold.dragging = true;
            self.maxThreshold.draw(self.ctx);
        }
    }

    /**************************************************************************************************************/

    function _handleMouseUp(evt) {
        self.minThreshold.dragging = false;
        self.maxThreshold.dragging = false;

        if (self.onUpdate) {
            var min = self.getHistValue(self.minThreshold.a);
            var max = self.getHistValue(self.maxThreshold.a);

            self.minThreshold.reset();
            self.maxThreshold.reset();

            self.onUpdate(min, max);
        }
    }

    /**************************************************************************************************************/

    function _handleMouseMove(evt) {
        var mousePos = _getMousePos(canvas, evt);

        self.ctx.clearRect(0.0, originY, canvas.width, paddingBottom);

        self.minThreshold.hover = self.minThreshold.contains([
            mousePos.x,
            mousePos.y,
            0
        ]);

        self.maxThreshold.hover = self.maxThreshold.contains([
            mousePos.x,
            mousePos.y,
            0
        ]);

        // Draw threshold controls
        if (
            self.minThreshold.dragging &&
            mousePos.x >= self.minThreshold.initA[0] &&
            mousePos.x < self.maxThreshold.a[0]
        ) {
            self.minThreshold.modifyPosition([
                mousePos.x,
                self.minThreshold.a[1]
            ]);
        }

        if (
            self.maxThreshold.dragging &&
            mousePos.x <= self.maxThreshold.initA[0] &&
            mousePos.x > self.minThreshold.a[0]
        ) {
            self.maxThreshold.modifyPosition([
                mousePos.x,
                self.maxThreshold.a[1]
            ]);
        }
        self.drawThresholdControls();

        // Don't draw histogram values if the mouse is out of histogram canvas
        if (
            mousePos.y > canvas.height ||
            mousePos.y < 0.0 ||
            mousePos.x > originX + nbBins ||
            mousePos.x < originX
        ) {
            return;
        }

        // Draw the text indicating the histogram value on mouse position
        self.ctx.font = "8pt Calibri";
        self.ctx.fillStyle = "yellow";
        var thresholdValue = self.getHistValue([mousePos.x, mousePos.y]);
        self.ctx.fillText(
            thresholdValue,
            canvas.width / 2 - 15.0,
            originY + paddingBottom
        );
        // Draw a tiny line indicating the mouse position on X-axis
        self.ctx.fillRect(mousePos.x, originY, 1, 2);
    }

    /**************************************************************************************************************/

    /**
     * Get histogram value from the given X-position on canvas
     * @param {Array} position
     * @returns {number} value
     */
    function getHistValue(position) {
        return (
            Math.floor(
                (((position[0] - originX) / 256.0) *
                    (this.image.tmax - this.image.tmin) +
                    this.image.tmin) *
                    Math.pow(10, this.accuracy)
            ) / Math.pow(10, this.accuracy)
        );
    }

    /**************************************************************************************************************/

    /**
     * Init Thresholds by creating to
     */
    function initThresholds() {
        originY = canvas.height - paddingBottom;
        hwidth =
            nbBins + originX > canvas.width ? canvas.width : nbBins + originX;

        this.minThreshold = new Triangle(
            [originX, originY + 1, 0],
            [originX - triangleHalfWidth, originY + paddingBottom - 1, 0],
            [originX + triangleHalfWidth, originY + paddingBottom - 1, 0]
        );

        this.maxThreshold = new Triangle(
            [hwidth, originY + 1, 0],
            [hwidth - triangleHalfWidth, originY + paddingBottom - 1, 0],
            [hwidth + triangleHalfWidth, originY + paddingBottom - 1, 0]
        );
    }

    /**************************************************************************************************************/

    function drawThresholdControls() {
        this.minThreshold.draw(this.ctx, {});
        this.maxThreshold.draw(this.ctx, {});
    }

    /**************************************************************************************************************/

    /**
     * Draw histogram
     * @param {Object} options
     *        <ul>
     *            <li>color: inside graph color</li>
     *        </ul>
     *
     */
    function drawHistogram(options) {
        if (options == null) {
            options = {};
        }
        this.ctx.fillStyle = options.color || "blue";
        for (var i = 0; i < hist.length; i++) {
            // Scale to y-axis height
            var rectHeight = (hist[i] / hmax) * originY;
            this.ctx.fillRect(originX + i, originY, 1, -rectHeight);
        }
    }

    /**************************************************************************************************************/

    /**
     *    Draw histogram axis
     */
    function drawAxes() {
        var leftY, rightX;
        leftY = 0;
        rightX = originX + hwidth;
        // Draw y axis.
        this.ctx.beginPath();
        this.ctx.moveTo(originX, leftY);
        this.ctx.lineTo(originX, originY);

        // Draw x axis.
        this.ctx.moveTo(originX, originY);
        this.ctx.lineTo(rightX, originY);

        // Define style and stroke lines.
        this.ctx.closePath();
        this.ctx.strokeStyle = "#fff";
        this.ctx.stroke();
    }

    /**************************************************************************************************************/

    /**
     *    Draw transfer function(linear, log, asin, sqrt, sqr)
     *    @param {Object} options
     *        <ul>
     *            <li>color: transfer stroke color</li>
     *        </ul>
     */
    function drawTransferFunction(options) {
        // Draw transfer functions
        // "Grey" colormap for now(luminance curve only)
        if (options == null) {
            options = {};
        }
        this.ctx.fillStyle = options.color || "red";
        for (var i = 0; i < nbBins; i++) {
            var value = i;
            var posX = originX + value;

            var scaledValue;
            switch (this.image.transferFn) {
                case "linear":
                    scaledValue = (value / nbBins) * originY;
                    break;
                case "log":
                    scaledValue =
                        (Math.log(value / 10.0 + 1) /
                            Math.log(nbBins / 10.0 + 1)) *
                        originY;
                    break;
                case "sqrt":
                    scaledValue =
                        (Math.sqrt(value / 10.0) / Math.sqrt(nbBins / 10.0)) *
                        originY;
                    break;
                case "sqr":
                    scaledValue =
                        (Math.pow(value, 2) / Math.pow(nbBins, 2)) * originY;
                    break;
                case "asin":
                    scaledValue =
                        (Math.log(value + Math.sqrt(Math.pow(value, 2) + 1.0)) /
                            Math.log(
                                nbBins + Math.sqrt(Math.pow(nbBins, 2) + 1.0)
                            )) *
                        originY;
                    break;
                default:
                    break;
            }

            if (!this.image.inverse) {
                scaledValue = originY - scaledValue;
            }
            this.ctx.fillRect(posX, scaledValue, 1, 1);
        }
    }

    /**************************************************************************************************************/

    /**
     *    Draw the histogram in canvas
     */
    function draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.drawHistogram();
        this.drawTransferFunction();
        this.drawAxes();
        this.drawThresholdControls();
    }

    /**************************************************************************************************************/

    /**
     *    TODO : create different module
     *    Compute histogram values
     */
    function compute() {
        var image = this.image;
        // Initialize histogram
        hist = new Array(nbBins);
        for (var i = 0; i < hist.length; i++) {
            hist[i] = 0;
        }

        // Compute histogram
        hmax = Number.MIN_VALUE;
        for (i = 0; i < image.pixels.length; i++) {
            var val = image.pixels[i];

            // Skip NaN
            if (isNaN(val)) {
                continue;
            }
            // Take only values which belongs to the interval [tmin,tmax]
            if (val < image.tmin) {
                continue;
            }
            if (val >= image.tmax) {
                continue;
            }

            // Scale to [0,255]
            var bin = Math.floor(
                (nbBins * (val - image.tmin)) / (image.tmax - image.tmin)
            );
            hist[bin]++;

            // Compute histogram max value
            if (hist[bin] > hmax) {
                hmax = hist[bin];
            }
        }

        // Logarithmic scale for better layout
        for (i = 0; i < hist.length; i++) {
            hist[i] = Math.log(1 + hist[i]);
        }
        hmax = Math.log(1 + hmax);
    }

    /**************************************************************************************************************/

    /**
     *    Set image
     *    @param {Image} image
     */
    function setImage(image) {
        this.image = image;
    }

    function getCanvas() {
        return canvas;
    }

    /**************************************************************************************************************/

    return {
        /**
         *    Histogram contructor
         *    @param options Histogram options
         *        <ul>
         *            <li>canvas: The canvas context where to draw Histogram</li>
         *            <li>image: The image which is represented by current histogram(required)</li>
         *            <li>nbBins: Number of bins, representing the sampling of histogram(optional)</li>
         *            <li>onUpdate: On update callback
         *            <li>accuracy: The accuracy of histogram(numbers after floating point)
         *            <li>paddingBottom: space at the bottom
         *            <li>triangleHalfWidth: half width of the triangle to draw
         *            <li>originX
         *        </ul>
         */
        init: function(options) {
            this.image = options.image;
            this.onUpdate = options.onUpdate;
            this.accuracy = options.accuracy || 6;

            self = this;
            nbBins = options.nbBins || 256;
            paddingBottom = options.paddingBottom || 15.0;
            originX = options.originX || 5.0;
            triangleHalfWidth = options.triangleHalfWidth || 5;

            // Init canvas
            canvas = document.getElementById(options.canvas);
            canvas.addEventListener("mousemove", _handleMouseMove);

            // Handle threshold controller selection
            canvas.addEventListener("mousedown", _handleMouseDown);

            // Update histogram on mouseup
            canvas.addEventListener("mouseup", _handleMouseUp);
            this.ctx = canvas.getContext("2d");

            this.initThresholds();
        },
        initThresholds: initThresholds,
        getHistValue: getHistValue,
        drawThresholdControls: drawThresholdControls,
        drawHistogram: drawHistogram,
        drawAxes: drawAxes,
        drawTransferFunction: drawTransferFunction,
        draw: draw,
        compute: compute,
        setImage: setImage,
        getCanvas: getCanvas
    };
});
