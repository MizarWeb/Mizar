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
define(function () {

    var Constants = function () {
    };


    /**
     * @namespace
     * ANIMATION
     * @property {String} Inertia - Inertia animation
     * @property {String} Interpolated - Interpolated animation
     * @property {String} Path - Path animation
     * @property {String} Segmented - Segmented animation
     */
    Constants.ANIMATION = {
        "Inertia": "Inertia",
        "Interpolated": "Interpolated",
        "Path": "Path",
        "Segmented": "Segmented"
    };


    /**
     * @namespace
     * CONTEXT
     * @property {String} Planet - Planet context
     * @property {String} Sky - Sky context
     */
    Constants.CONTEXT = {
        "Planet": "Planet",
        "Sky": "Sky"
    };

    /**
     * @namespace
     * GLOBE
     * @property {String} Planet - Planet
     * @property {String} Sky - Sky
     */
    Constants.GLOBE = {
        "Planet": "Planet",
        "Sky": "Sky"
    };

    /**
     * @namespace
     * LAYER
     * @property {String} WMS - Web Map Service
     * @property {String} WMTS - Web Map Tile Service
     * @property {String} WMSElevation - Web Map Service for elevation
     * @property {String} WCSElevation - Web Map Coverage for elevation
     * @property {String} GeoJSON - GeoJSON
     * @property {String} Vector - Vector
     * @property {String} Atmosphere - Atmosphere
     * @property {String} Bing - Microsoft BING
     * @property {String} GroundOverlay - GroundOverlay
     * @property {String} OSM - Open Street Map
     * @property {String} TileWireframe - TileWireframe
     * @property {String} HipsGrid - HipsGrid
     * @property {String} CoordinateGrid - CoordinateGrid
     * @property {String} Hips - Hierarchical Progressive Survey for images
     * @property {String} HipsCat - Hierarchical Progressive Survey for catalogue
     * @property {String} HipsFits - Hierarchical Progressive Survey for FITS
     * @property {String} Moc - Multiple Order Coverage
     * @property {String} OpenSearch - Open Search
     * @property {String} Planet - Planet
     */
    Constants.LAYER = {
        "WMS": "WMS",
        "WMTS": "WMTS",
        "WMSElevation": "WMSElevation",
        "WCSElevation": "WCSElevation",
        "GeoJSON": "GeoJSON",
        "Vector": "Vector",
        "Atmosphere": "Atmosphere",
        "Bing": "Bing",
        "GroundOverlay": "GroundOverlay",
        "OSM": "OSM",
        "TileWireframe": "TileWireframe",
        "HipsGrid": "HipsGrid",
        "CoordinateGrid": "CoordinateGrid",
        "HipsFits": "HipsFits",
        "Hips": "Hips",
        "HipsCat": "HipsCat",
        "Moc": "Moc",
        "OpenSearch": "OpenSearch",
        "Planet": "Planet"
    };

    /**
     * @namespace
     * GEOMETRY
     * @property {String} Point - Point
     * @property {String} MultiPoint - MultiPoint
     * @property {String} LineString - LineString
     * @property {String} MultiLineString - MultiLineString
     * @property {String} Polygon - Polygon
     * @property {String} MultiPolygon - MultiPolygon
     * @property {String} GeometryCollection - GeometryCollection
     */
    Constants.GEOMETRY = {
        "Point": "Point",
        "MultiPoint": "MultiPoint",
        "LineString": "LineString",
        "MultiLineString": "MultiLineString",
        "Polygon": "Polygon",
        "MultiPolygon": "MultiPolygon",
        "GeometryCollection": "GeometryCollection"
    };

    /**
     * @namespace
     * PROJECTION
     * @property {String} Aitoff - Aitoff projection
     * @property {String} August - August projection
     * @property {String} Mercator - Mercator projection
     * @property {String} Mollweide - Mollweide projection
     * @property {String} Plate - Plate Carrée projection
     * @property {String} Azimuth - Azimuthal projection
     */
    Constants.PROJECTION = {
        "Aitoff": "Aitoff",
        "August": "August",
        "Mercator": "Mercator",
        "Mollweide": "Mollweide",
        "Plate": "Plate",
        "Azimuth": "Azimuth"
    };

    /**
     * @namespace
     * CRS
     * @property {String} Equatorial - Equatorial coordinate reference system
     * @property {String} Galactic - Galactic coordinate reference system
     * @property {String} WGS84 - EPSG:4326 coordinate reference system
     * @property {String} Mars_2000 - IAU2000:49901 coordinate reference system
     * @property {String} Mars_2000_old - IAU2000:49900 coordinate reference system
     * @property {String} Moon_2000 - IAU2000:30101 coordinate reference system
     * @property {String} Moon_2000_old - IAU2000:30100 coordinate reference system
     */
    Constants.CRS = {
        "Equatorial": "Equatorial",
        "Galactic": "Galactic",
        "WGS84": "EPSG:4326",
        "Mars_2000": "IAU2000:49901",
        "Mars_2000_old": "IAU2000:49900",
        "Moon_2000": "IAU2000:30101",
        "Moon_2000_old": "IAU2000:30100"
    };

    /**
     * @namespace
     * NAVIGATION
     * @property {String} AstroNavigation - 3D Navigation for sky
     * @property {String} PlanetNavigation - 3D Navigation for planet
     * @property {String} FlatNavigation - 2D Navigation for planet
     */
    Constants.NAVIGATION = {
        "AstroNavigation": "AstroNavigation",
        "PlanetNavigation": "PlanetNavigation",
        "FlatNavigation": "FlatNavigation"
    };

    /**
     * @namespace
     * SERVICE
     * @property {String} FitsVisu - FITS visualization
     * @property {String} Histogram - Histogram values from a FITS file
     * @property {String} ImageProcessing - Image processing
     * @property {String} MeasureToolSky - Tool to measure the distance between two points on the sky
     * @property {String} MeasureToolPlanet - Tool to measure the distance between two points on a planet
     * @property {String} MocBase - MOC service
     * @property {String} MollweideViewer - Mollweide Viewer
     * @property {String} PickingManager - Picking Manager
     * @property {String} Samp - Samp
     * @property {String} SelectionTool - Selection Tool
     * @property {String} NameResolver - NameResolver
     * @property {String} ReverseNameResolver - ReverseNameResolver
     * @property {String} ExportTool - ExportTool
     */
    Constants.SERVICE = {
        "FitsVisu": "FitsVisu",
        "Histogram": "Histogram",
        "ImageProcessing" : "ImageProcessing",
        "MeasureToolSky" : "MeasureToolSky",
        "MeasureToolPlanet" : "MeasureToolPlanet",
        "MocBase" : "MocBase",
        "MollweideViewer" : "MollweideViewer",
        "PickingManager" : "PickingManager",
        "Samp" : "Samp",
        "SelectionTool" : "SelectionTool",
        "NameResolver" : "NameResolver",
        "ReverseNameResolver" : "ReverseNameResolver",
        "ExportTool" : "ExportTool"
    };

    /**
     * @namespace
     * HANDLER
     * @property {String} Touch - Touch device
     * @property {String} Keyboard - Keyboard device
     * @property {String} Mouse - Mouse device
     * @property {String} GoogleMouse - GoogleMouse device
     */
    Constants.HANDLER = {
        "Touch" : "Touch",
        "Keyboard" : "Keyboard",
        "Mouse" : "Mouse",
        "GoogleMouse" : "GoogleMouse"
    };

    /**
     * @namespace
     * PROVIDER
     * @property {String} Constellation - Constellation
     * @property {String} Json - Json
     * @property {String} OpenSearch - OpenSearch
     * @property {String} Planet - Planet
     * @property {String} Star - Star
     */
    Constants.PROVIDER = {
        "Constellation" : "Constellation",
        "OpenSearch" : "OpenSearch",
        "Planet" : "Planet",
        "Star" : "Star",
        "Crater" : "Crater"
    };

    /**
     * @namespace
     * MappingCrsHips2Mizar
     * @property {String} equatorial - Equatorial
     * @property {String} galactic - Galactic
     * @property {String} ecliptic - Ecliptic
     */
    Constants.MappingCrsHips2Mizar = {
        "equatorial": "Equatorial",
        "galactic": "Galactic",
        "ecliptic": "Ecliptic"
    };

    /**
     * @namespace
     * UTILITY
     * @property {String} Fits - Fits utility
     * @property {String} Intersection - Intersection utility
     * @property {String} CreateStyle - CreateStyle utility
     * @property {String} FeatureStyle - FeatureStyle utility
     */
    Constants.UTILITY = {
        "Fits" : "Fits",
        "Intersection" : "Intersection",
        "Numeric" : "Numeric",
        "CreateStyle" : "CreateStyle",
        "FeatureStyle" : "FeatureStyle"
    };

    /**
     * @namespace
     * ANIMATION_STATUS
     * @property {String} STOPPED - animation is stopped
     * @property {String} RUNNING - animation is running
     * @property {String} PAUSED - animation is paused
     */
    Constants.ANIMATION_STATUS = {
        "STOPPED" : "STOPPED",
        "RUNNING" : "RUNNING",
        "PAUSED" : "PAUSED"
    };

    /**************************************************************************************************************/

    return Constants;

});
