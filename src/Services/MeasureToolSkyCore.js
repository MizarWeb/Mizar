/*******************************************************************************
 * Copyright 2017, 2018 CNES8 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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
 * Tool designed to measure the distance between two points in planet mode
 */

define([
    "jquery",
    "underscore-min",
    "../Utils/Numeric",
    "../Utils/Constants",
    "../Layer/VectorLayer",
    "../Renderer/Ray",
    "../Renderer/FeatureStyle",
    "../Renderer/glMatrix"
], function($, _, Numeric, Constants, VectorLayer, Ray, FeatureStyle) {
    var mizarAPI, navigation, onselect, measureLayer, self, dragging;

    /**********************************************************************************************/

    /**
     * Get first Geo pick point in terms of cursor position
     * @param event
     * @returns {Array} geoPickPoint geo position on the planet
     */
    function _handleMouseDown(event) {
        event.preventDefault();
        if (!self.activated) {
            return;
        }

        self.distance = 0;
        // Disable standard navigation events
        navigation.stop();

        dragging = true;
        self.elevations = [];

        if (event.type.search("touch") >= 0) {
            self.pickPoint = [
                event.changedTouches[0].clientX,
                event.changedTouches[0].clientY
            ];
        } else {
            self.pickPoint = [event.layerX, event.layerY];
        }
        self.geoPickPoint = mizarAPI
            .getActivatedContext()
            .getLonLatFromPixel(self.pickPoint[0], self.pickPoint[1]);
    }

    /**
     * Close the measure with the last point
     * @param event
     */
    function _handleMouseUp(event) {
        event.preventDefault();
        if (!self.activated) {
            return;
        }

        // Compute geo radius
        var stopPickPoint;
        if (event.type.search("touch") >= 0) {
            stopPickPoint = mizarAPI
                .getActivatedContext()
                .getLonLatFromPixel(
                    event.changedTouches[0].clientX,
                    event.changedTouches[0].clientY
                );
        } else {
            stopPickPoint = mizarAPI
                .getActivatedContext()
                .getLonLatFromPixel(event.layerX, event.layerY);
        }

        // Find angle between start and stop vectors which is in fact the radius
        var dotProduct = vec3.dot(
            vec3.normalize(mizarAPI.getCrs().get3DFromWorld(stopPickPoint)),
            vec3.normalize(mizarAPI.getCrs().get3DFromWorld(self.geoPickPoint))
        );
        var theta = Math.acos(dotProduct);
        self.geoDistance = Numeric.toDegree(theta);

        if (onselect) {
            onselect();
        }

        // Enable standard navigation events
        navigation.start();
        dragging = false;
    }

    /**
     * Update drawing and label in terms of current point
     * @param event
     */
    function _handleMouseMove(event) {
        event.preventDefault();
        if (!self.activated || !dragging) {
            return;
        }
        if (event.type.search("touch") >= 0) {
            self.secondPickPoint = [
                event.changedTouches[0].clientX,
                event.changedTouches[0].clientY
            ];
        } else {
            self.secondPickPoint = [event.layerX, event.layerY];
        }

        self.secondGeoPickPoint = mizarAPI
            .getActivatedContext()
            .getLonLatFromPixel(
                self.secondPickPoint[0],
                self.secondPickPoint[1]
            );

        //self.storeDistanceAndElevation(self.geoPickPoint, self.secondGeoPickPoint);

        // Update radius
        self.distance = Math.sqrt(
            Math.pow(self.secondPickPoint[0] - self.pickPoint[0], 2) +
                Math.pow(self.secondPickPoint[1] - self.pickPoint[1], 2)
        );
        var dotProduct = vec3.dot(
            vec3.normalize(
                mizarAPI.getCrs().get3DFromWorld(self.secondGeoPickPoint)
            ),
            vec3.normalize(mizarAPI.getCrs().get3DFromWorld(self.geoPickPoint))
        );

        var theta = Math.acos(dotProduct);
        self.geoDistance = Numeric.toDegree(theta);

        self.updateMeasure();
    }

    /**************************************************************************************************************/

    /**
     * Transform coordinates to the right world space dimension
     * @param points
     * @returns {Array} points  points transformed
     */
    function computeIntersection(points) {
        var rc = self.renderContext;
        var tmpMat = mat4.create();

        // Computes eye in world space
        mat4.inverse(rc.viewMatrix, tmpMat);
        var eye = [tmpMat[12], tmpMat[13], tmpMat[14]];

        // Computes the inverse of view/proj matrix
        mat4.multiply(rc.projectionMatrix, rc.viewMatrix, tmpMat);
        mat4.inverse(tmpMat);

        // Transforms the four corners of measured shape into world space
        // and then for each corner computes the intersection of ray starting from the eye to the sphere
        var worldCenter = [0, 0, 0];
        for (var i = 0; i < points.length; i++) {
            mat4.multiplyVec4(tmpMat, points[i]);
            vec3.scale(points[i], 1.0 / points[i][3]);
            vec3.subtract(points[i], eye, points[i]);
            vec3.normalize(points[i]);

            var ray = new Ray(eye, points[i]);
            var pos3d = ray.computePoint(
                ray.sphereIntersect(
                    worldCenter,
                    mizarAPI
                        .getCrs()
                        .getGeoide()
                        .getRadius()
                )
            );
            points[i] = mizarAPI.getCrs().getWorldFrom3D(pos3d);
        }

        return points;
    }

    /**********************************************************************************************/

    function rotateVector2D(vec, theta) {
        theta = (theta * Math.PI) / 180;
        var cs = Math.cos(theta);
        var sn = Math.sin(theta);

        return [vec[0] * cs - vec[1] * sn, vec[0] * sn + vec[1] * cs];
    }

    function normalize2D(vec, dest) {
        if (!dest) {
            dest = vec;
        }

        var length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
        dest[0] = vec[0] / length;
        dest[1] = vec[1] / length;
        return dest;
    }

    /**********************************************************************************************/

    /**
     * Computes the measure for the given pick point depending on the second point (used to draw)
     * @returns {Array} points to draw
     */
    function computeMeasure() {
        var rc = self.renderContext;
        // Scale to [-1,1]
        var widthScale = 2 / rc.canvas.width;
        var heightScale = 2 / rc.canvas.height;

        var diff = [
            self.secondPickPoint[0] - self.pickPoint[0],
            self.secondPickPoint[1] - self.pickPoint[1]
        ];
        normalize2D(diff);

        // First arrow
        var arrow = rotateVector2D(diff, 30);
        var arrow2 = rotateVector2D(diff, -30);
        arrow = [
            self.pickPoint[0] + 10 * arrow[0],
            self.pickPoint[1] + 10 * arrow[1]
        ];
        arrow2 = [
            self.pickPoint[0] + 10 * arrow2[0],
            self.pickPoint[1] + 10 * arrow2[1]
        ];

        var diff2 = [-diff[0], -diff[1]];
        var arrow3 = rotateVector2D(diff2, 30);
        var arrow4 = rotateVector2D(diff2, -30);
        arrow3 = [
            self.secondPickPoint[0] + 10 * arrow3[0],
            self.secondPickPoint[1] + 10 * arrow3[1]
        ];
        arrow4 = [
            self.secondPickPoint[0] + 10 * arrow4[0],
            self.secondPickPoint[1] + 10 * arrow4[1]
        ];

        var points = [
            [
                self.pickPoint[0] * widthScale - 1,
                (rc.canvas.height - self.pickPoint[1]) * heightScale - 1,
                1,
                1
            ],
            [
                arrow[0] * widthScale - 1,
                (rc.canvas.height - arrow[1]) * heightScale - 1,
                1,
                1
            ],
            [
                self.pickPoint[0] * widthScale - 1,
                (rc.canvas.height - self.pickPoint[1]) * heightScale - 1,
                1,
                1
            ],
            [
                arrow2[0] * widthScale - 1,
                (rc.canvas.height - arrow2[1]) * heightScale - 1,
                1,
                1
            ],
            [
                self.pickPoint[0] * widthScale - 1,
                (rc.canvas.height - self.pickPoint[1]) * heightScale - 1,
                1,
                1
            ],
            [
                self.secondPickPoint[0] * widthScale - 1,
                (rc.canvas.height - self.secondPickPoint[1]) * heightScale - 1,
                1,
                1
            ],
            [
                arrow3[0] * widthScale - 1,
                (rc.canvas.height - arrow3[1]) * heightScale - 1,
                1,
                1
            ],
            [
                self.secondPickPoint[0] * widthScale - 1,
                (rc.canvas.height - self.secondPickPoint[1]) * heightScale - 1,
                1,
                1
            ],
            [
                arrow4[0] * widthScale - 1,
                (rc.canvas.height - arrow4[1]) * heightScale - 1,
                1,
                1
            ],
            [
                self.secondPickPoint[0] * widthScale - 1,
                (rc.canvas.height - self.secondPickPoint[1]) * heightScale - 1,
                1,
                1
            ]
        ];

        this.computeIntersection(points);
        return points;
    }

    /**********************************************************************************************/

    /**
     *    Updates measure coordinates
     */
    function updateMeasure() {
        self.clear();

        var coordinates = self.computeMeasure();

        // Close the polygon
        coordinates.push(coordinates[0]);

        self.measureFeature = {
            geometry: {
                gid: "measureShape",
                coordinates: [coordinates],
                type: Constants.GEOMETRY.Polygon,
                crs: {
                    type: "name",
                    properties: {
                        name: mizarAPI.getCrs().getGeoideName()
                    }
                }
            },
            properties: {
                style: new FeatureStyle({
                    zIndex: Constants.DISPLAY.SERVICE_VECTOR,
                    fillColor: [1, 0, 0, 1]
                })
            },
            type: "Feature"
        };

        var center = [
            (self.secondPickPoint[0] + self.pickPoint[0]) / 2,
            (self.secondPickPoint[1] + self.pickPoint[1]) / 2
        ];
        var geoCenter = mizarAPI
            .getActivatedContext()
            .getLonLatFromPixel(center[0], center[1]);
        self.measureLabel = {
            geometry: {
                type: Constants.GEOMETRY.Point,
                gid: "measureShape",
                coordinates: geoCenter,
                crs: {
                    type: "name",
                    properties: {
                        name: mizarAPI.getCrs().getGeoideName()
                    }
                }
            },
            properties: {
                style: new FeatureStyle({
                    label: mizarAPI.getCrs().fromDegreesToDMS(self.geoDistance),
                    fillColor: [1, 1, 1, 1],
                    zIndex: Constants.DISPLAY.SERVICE_VECTOR
                })
            }
        };
        measureLayer.addFeature(self.measureFeature);
        measureLayer.addFeature(self.measureLabel);
    }

    /**************************************************************************************************************/

    /**
     *    Clear measureFeature and measureLabel
     */
    function clear() {
        if (self.measureFeature) {
            measureLayer.removeFeature(self.measureFeature);
        }
        if (self.measureLabel) {
            measureLayer.removeFeature(self.measureLabel);
        }
    }

    function remove() {
        self.clear();
        mizarAPI.getSkyContext().removeDraw(measureLayer);
    }

    return {
        /**
         * @fires Context#backgroundLayer:added
         * @fires Context#layer:added
         */
        init: function(options) {
            mizarAPI = options.mizar;
            navigation = mizarAPI.getActivatedContext().getNavigation();
            onselect = options.onselect;
            self = this;
            dragging = false;

            // Layer containing measure feature
            measureLayer = mizarAPI.LayerFactory.create({
                type: Constants.LAYER.Vector,
                visible: true
            });
            mizarAPI.getSkyContext().addDraw(measureLayer);

            this.activated = false;
            this.renderContext = mizarAPI.getRenderContext();

            // Measure attributes
            /*this.pickPoint; // Window pick point
                this.secondPickPoint; // Window second pick point
                this.geoPickPoint; // Pick point in geographic reference
                this.secondGeoPickPoint; // Pick point in geographic reference
                this.measureLabel;
                */
            this.elevations = [];
            this.measureFeature = null;
        },
        _handleMouseDown: _handleMouseDown,
        _handleMouseUp: _handleMouseUp,
        _handleMouseMove: _handleMouseMove,
        updateMeasure: updateMeasure,
        clear: clear,
        remove: remove,
        computeMeasure: computeMeasure,
        computeIntersection: computeIntersection
    };
});
