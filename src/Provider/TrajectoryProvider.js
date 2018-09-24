/*******************************************************************************
 * Copyright 2017-2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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

define([
    "jquery",
    "./AbstractProvider",
    "../Renderer/FeatureStyle",
    "../Utils/Utils",
    "../Utils/Constants",
    "../Services/MeasureToolPlanetCore",
    "../Gui/dialog/ErrorDialog"
], function(
    $,
    AbstractProvider,
    FeatureStyle,
    Utils,
    Constants,
    MeasureToolPlanetCore,
    ErrorDialog
) {
    var self;
    var interval;
    var poiFeatureCollection;
    var url;
    var data;

    /**
     * Parses the files
     * @param {string} response  response
     * @returns {Object} the points of the trafectory
     */
    function _parseFile(response) {
        var pois = [];
        var lines = response.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            // skip comments
            if (line.startsWith("#")) {
                continue;
            }
            var data = line.split(",");
            if (data.length > 1) {
                var long = parseFloat(data[0]);
                var lat = parseFloat(data[1]);
                var date = data[2];
                pois.push([long, lat, date]);
            }
        }
        return pois;
    }

    /**
     * Ceates lines from the set of points
     * @param {Object} pois pois
     * @returns {string} the geometry
     */
    function _createLines(pois) {
        var geom = [];
        for (var j = 1; j < pois.length; j++) {
            var line = [];
            line.push(pois[j - 1]);
            line.push(pois[j]);
            geom.push(line);
        }
        return geom;
    }

    /**
     * ExtractDates from the set of points
     * @param {Object} Set of points
     * @returns Object range date as [date min, date max]
     */
    function _extractDates(pois) {
        var dateMin = pois[0][2];
        var dateMax = pois[pois.length - 1][2];
        return [dateMin, dateMax];
    }

    /**
     * Computes the trajectory.
     * @param {Layer} mizarLayer
     */
    var computePositions = function(mizarLayer) {
        Utils.requestUrl(
            url,
            "text",
            "plain/text",
            null,
            function(response) {
                var pois = _parseFile(response);
                var geom = _createLines(pois);
                var dates = _extractDates(pois);

                var style = new FeatureStyle({
                    iconUrl: "css/images/lander.png",
                    strokeColor: FeatureStyle.fromStringToColor("white"),
                    fillColor: FeatureStyle.fromStringToColor("white")
                });

                var trajectory = createTrajectory(
                    mizarLayer,
                    Constants.GEOMETRY.MultiLineString,
                    mizarLayer.name,
                    { trajectory: geom, color: "white", dates: dates }
                );
                // Create feature collection
                poiFeatureCollection = {
                    type: "FeatureCollection",
                    crs: {
                        type: "name",
                        properties: {
                            name: "IAU2000:30101"
                        }
                    },
                    features: [
                        trajectory,
                        {
                            type: "Feature",
                            properties: {
                                title: "Landing site",
                                style: style,
                                thumbnail:
                                    "http://space.skyrocket.de/img_sat/team-indus__1.jpg",
                                abstract:
                                    "The <a href=\"http://www.teamindus.in/mission/\" class=\"selectValue\">Team Indus Lunar Lander</a> is a lunar lander developed by the Indian nonprofit organisation Team Indus. It is an entry to win the Google Lunar XPRIZE (GLXP).<p>The Team Indus Lunar Lander is a lunar lander, which has a propulsion system to enable itself to leave earth orbit and to enter a trajectory to the moon. After landing it will deploy the Indian ECA (Ek Choti si Asha) rover, which will move to a distance of at least 500 m to satisfy the rules of the GLXP. <p>The propulsion system is bipropellant, consisting of a single 440 N prime thruster and sixteen 22 N thrusters. <p>Once deployed from the rocket, the spacecraft will orbit the earth twice. In a manoeuvre called the trans-lunar injection by which it will successfully leave Earth’s orbit, the rocket engines will be fired to set course to the Moon. At this point, the craft will be traveling at the maximum speed of 10.5 km/s—almost 39600 km/h for the distance of 384400 km within 10 days. When roughly 100 km from the Moon, it will perform another manoeuvre called the Lunar Orbit Capture to eventually settle into a parking orbit. By now, the craft will have decelerated to 800 m/s. These extreme variations in speed will consume most of the spacecraft’s fuel.The landing phase of the mission will be initiated at a 100 km × 100 km orbit around the Moon. The entire process will be controlled by software onboard the spacecraft using data collected from laser sensors. These sensors will detect and analysis the surface, orienting the craft accordingly. Considering that manual control of the craft at this point is impossible, automation and preprogramming is the only way to go. At a time optimised to coincide with the lunar dawn on Mare Imbrium, the spacecraft thrusters will be fired again to decrease the orbit for a soft touchdown.The Team Indus Lunar Lander is a lunar lander developed by the Indian nonprofit organisation Team Indus. It is an entry to win the Google Lunar XPRIZE (GLXP).The Team Indus Lunar Lander is a lunar lander, which has a propulsion system to enable itself to leave earth orbit and to enter a trajectory to the moon. After landing it will deploy the Indian ECA (Ek Choti si Asha) rover, which will move to a distance of at least 500 m to satisfy the rules of the GLXP.The propulsion system is bipropellant, consisting of a single 440 N prime thruster and sixteen 22 N thrusters.Once deployed from the rocket, the spacecraft will orbit the earth twice. In a manoeuvre called the trans-lunar injection by which it will successfully leave Earth’s orbit, the rocket engines will be fired to set course to the Moon. At this point, the craft will be traveling at the maximum speed of 10.5 km/s—almost 39600 km/h for the distance of 384400 km within 10 days. When roughly 100 km from the Moon, it will perform another manoeuvre called the Lunar Orbit Capture to eventually settle into a parking orbit. By now, the craft will have decelerated to 800 m/s. These extreme variations in speed will consume most of the spacecraft’s fuel.The landing phase of the mission will be initiated at a 100 km × 100 km orbit around the Moon. The entire process will be controlled by software onboard the spacecraft using data collected from laser sensors. These sensors will detect and analysis the surface, orienting the craft accordingly. Considering that manual control of the craft at this point is impossible, automation and preprogramming is the only way to go. At a time optimised to coincide with the lunar dawn on <a href=\"https://en.wikipedia.org/wiki/Mare_Imbrium\" class=\"selectValue\">Mare Imbrium</a>, the spacecraft thrusters will be fired again to decrease the orbit for a soft touchdown."
                            },
                            geometry: {
                                type: "Point",
                                coordinates: [-25.680079147, 29.5212266285]
                            }
                        }
                    ]
                };

                mizarLayer.addFeatureCollection(poiFeatureCollection);
            },
            function(err) {
                ErrorDialog.open(
                    Constants.LEVEL.ERROR,
                    "Failed ot request " + url,
                    err
                );
            }
        );
    };

    /*
     * Json template for a point
     * @param 
     */
    function createTrajectory(mizarLayer, type, name, obj) {
        function _computeDistance(trajectory) {
            var distance = 0;
            var line = trajectory[0];
            for (var i = 1; i < trajectory.length; i++) {
                var lineNext = trajectory[i];
                distance += MeasureToolPlanetCore.calculateDistanceElevation(
                    line[0],
                    lineNext[0]
                );
                line = lineNext;
            }
            return distance * 1000;
        }

        return {
            type: "Feature",
            geometry: {
                type: Constants.GEOMETRY.MultiLineString,
                gid: "trajectory" + type + "_" + name,
                coordinates: obj.trajectory
            },
            properties: {
                title: name,
                thumbnail: data.thumbnailPath,
                abstract: data.abstractPath,
                startDate: obj.dates[0],
                endDate: obj.dates[1],
                distance: _computeDistance(obj.trajectory).toFixed() + " meters"
            }
        };
    }

    /**
     * @name TrajectoryProvider
     * @class
     *    Create a trajectory, which can be refreshed
     * @param {object} options
     * @augments AbstractProvider
     * @constructor
     * @memberof module:Provider
     */
    var TrajectoryProvider = function(options) {
        AbstractProvider.prototype.constructor.call(this, options);
        self = this;
    };

    /**************************************************************************************************************/

    Utils.inherits(AbstractProvider, TrajectoryProvider);

    /**************************************************************************************************************/

    /**
     * Asynchronous requests to reload trajectory at some time interval
     * @function loadFiles
     * @memberof TrajectoryProvider#
     * @param {Layer} mizarLayer - Mizar layer
     * @param {Object} configuration - Configuration options
     * @param {string} configuration.url - Url providing the trajectory
     * @param {string} configuration.interval - time in ms where the trajectory is reloaded
     */

    TrajectoryProvider.prototype.loadFiles = function(layer, configuration) {
        data = configuration;
        interval = configuration.interval ? configuration.interval : 60000;
        url = configuration.url;
        self.handleFeatures(layer);
    };

    /**
     * @function handleFeatures
     * @memberof TrajectoryProvider#
     */

    TrajectoryProvider.prototype.handleFeatures = function(layer) {
        computePositions(layer);
        setInterval(function() {
            layer.removeFeatureCollection(poiFeatureCollection);
            computePositions(layer);
        }, interval);
    };

    return TrajectoryProvider;
});
