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
define(function() {
    var Constants = function() {};

    /**
     * @namespace
     * API
     * @property {string} version - API version
     */
    Constants.API = {
        version: "[VERSION_API]"
    };

    /**
     * @namespace
     * LEVEL
     * @property {string} WARNING - Warning level
     * @property {string} ERROR - Error level
     * @property {string} DEBUG - Error level     
     */
    Constants.LEVEL = {
        WARNING: "warning",
        ERROR: "error",
        DEBUG: "debug"
    };

    /**
     * @namespace
     * ANIMATION
     * @property {string} Inertia - Inertia animation
     * @property {string} Interpolated - Interpolated animation
     * @property {string} Path - Path animation
     * @property {string} Segmented - Segmented animation
     */
    Constants.ANIMATION = {
        Inertia: "Inertia",
        Interpolated: "Interpolated",
        Path: "Path",
        Segmented: "Segmented"
    };

    /**
     * @namespace
     * CONTEXT
     * @property {string} Planet - Planet context
     * @property {string} Sky - Sky context
     * @property {string} Ground - Ground context
     */
    Constants.CONTEXT = {
        Planet: "Planet",
        Sky: "Sky",
        Ground: "Ground"
    };

    /**
     * @namespace
     * GLOBE
     * @property {string} Planet - Planet
     * @property {string} Sky - Sky
     */
    Constants.GLOBE = {
        Planet: "Planet",
        Sky: "Sky"
    };

    /**
     * @namespace
     * LAYER
     * @property {string} WMS - Web Map Service
     * @property {string} WMTS - Web Map Tile Service
     * @property {string} WMSElevation - Web Map Service for elevation
     * @property {string} WCSElevation - Web Map Coverage for elevation
     * @property {string} GeoJSON - GeoJSON
     * @property {string} Vector - Vector
     * @property {string} Atmosphere - Atmosphere
     * @property {string} Bing - Microsoft BING
     * @property {string} GroundOverlay - GroundOverlay
     * @property {string} OSM - Open Street Map
     * @property {string} TileWireframe - TileWireframe
     * @property {string} HipsGrid - HipsGrid
     * @property {string} CoordinateGrid - CoordinateGrid
     * @property {string} Hips - Hierarchical Progressive Survey for images
     * @property {string} HipsCat - Hierarchical Progressive Survey for catalogue
     * @property {string} HipsFits - Hierarchical Progressive Survey for FITS
     * @property {string} Moc - Multiple Order Coverage
     * @property {string} OpenSearch - Open Search
     */
    Constants.LAYER = {
        AsynchroneWMS: "AsynchroneWMS",
        WMS: "WMS",
        WMTS: "WMTS",
        WMSElevation: "WMSElevation",
        WCSElevation: "WCSElevation",
        GeoJSON: "GeoJSON",
        Vector: "Vector",
        Atmosphere: "Atmosphere",
        Bing: "Bing",
        GroundOverlay: "GroundOverlay",
        OSM: "OSM",
        TileWireframe: "TileWireframe",
        HipsGrid: "HipsGrid",
        CoordinateGrid: "CoordinateGrid",
        HipsFits: "HipsFits",
        Hips: "Hips",
        HipsCat: "HipsCat",
        Moc: "Moc",
        OpenSearch: "OpenSearch"
    };

    /**
     * @namespace
     * GEOMETRY
     * @property {string} Point - Point
     * @property {string} MultiPoint - MultiPoint
     * @property {string} LineString - LineString
     * @property {string} MultiLineString - MultiLineString
     * @property {string} Polygon - Polygon
     * @property {string} MultiPolygon - MultiPolygon
     * @property {string} GeometryCollection - GeometryCollection
     */
    Constants.GEOMETRY = {
        Point: "Point",
        MultiPoint: "MultiPoint",
        LineString: "LineString",
        MultiLineString: "MultiLineString",
        Polygon: "Polygon",
        MultiPolygon: "MultiPolygon",
        GeometryCollection: "GeometryCollection"
    };

    /**
     * @namespace
     * PROJECTION
     * @property {string} Aitoff - Aitoff projection
     * @property {string} August - August projection
     * @property {string} Mercator - Mercator projection
     * @property {string} Mollweide - Mollweide projection
     * @property {string} Plate - Plate Carrée projection
     * @property {string} Azimuth - Azimuthal projection
     */
    Constants.PROJECTION = {
        Aitoff: "Aitoff",
        August: "August",
        Mercator: "Mercator",
        Mollweide: "Mollweide",
        Plate: "Plate Carrée",
        Azimuth: "Azimuth"
    };

    /**
     * @namespace
     * CRS
     * @property {string} Equatorial - Equatorial coordinate reference system
     * @property {string} Galactic - Galactic coordinate reference system
     * @property {string} WGS84 - CRS:84 coordinate reference system
     * @property {string} Mars_2000 - IAU2000:49901 coordinate reference system
     * @property {string} Mars_2000_old - IAU2000:49900 coordinate reference system
     * @property {string} Moon_2000 - IAU2000:30101 coordinate reference system
     * @property {string} Moon_2000_old - IAU2000:30100 coordinate reference system
     * @property {string} HorizontalLocal - Local reference system based on horizontal coordinates
     * @property {string} Sun - Sun Coordinate reference system
     */
    Constants.CRS = {
        Equatorial: "Equatorial",
        Galactic: "Galactic",
        WGS84: "CRS:84",
        Mars_2000: "IAU2000:49901",
        Mars_2000_old: "IAU2000:49900",
        Moon_2000: "IAU2000:30101",
        Moon_2000_old: "IAU2000:30100",
        HorizontalLocal: "HorizontalLocal",
        Sun: "IAU:Sun"
    };

    /**
     * @namespace
     * CRS_TO_CONTEXT
     * @property {string} Equatorial - Sky context
     * @property {string} Galactic - Sky context
     * @property {string} WGS84 - Planet context
     * @property {string} Mars_2000 - Planet context
     * @property {string} Mars_2000_old - Planet context
     * @property {string} Moon_2000 - Planet context
     * @property {string} Moon_2000_old - Planet context
     * @property {string} HorizontalLocal - Ground context
     * @property {string} Sun - Sun Coordinate reference system
     */
    Constants.CRS_TO_CONTEXT = {
        Equatorial: "Sky",
        Galactic: "Sky",
        "CRS:84": "Planet",
        "IAU2000:49901": "Planet",
        "IAU2000:49900": "Planet",
        "IAU2000:30101": "Planet",
        "IAU2000:30100": "Planet",
        HorizontalLocal: "Ground",
        "IAU:Sun": "Planet"
    };

    /**
     * @namespace
     * NAVIGATION
     * @property {string} AstroNavigation - 3D Navigation for sky
     * @property {string} PlanetNavigation - 3D Navigation for planet
     * @property {string} FlatNavigation - 2D Navigation for planet
     * @property {string} GroundNavigation - 3D Navigation for ground visualization
     */
    Constants.NAVIGATION = {
        AstroNavigation: "AstroNavigation",
        PlanetNavigation: "PlanetNavigation",
        FlatNavigation: "FlatNavigation",
        GroundNavigation: "GroundNavigation"
    };

    /**
     * @namespace
     * SERVICE
     * @property {string} FitsVisu - FITS visualization
     * @property {string} Histogram - Histogram values from a FITS file
     * @property {string} ImageProcessing - Image processing
     * @property {string} MeasureToolSky - Tool to measure the distance between two points on the sky
     * @property {string} MeasureToolPlanet - Tool to measure the distance between two points on a planet
     * @property {string} MocBase - MOC service
     * @property {string} MollweideViewer - Mollweide Viewer
     * @property {string} PickingManager - Picking Manager
     * @property {string} Samp - Samp
     * @property {string} SelectionTool - Selection Tool
     * @property {string} NameResolver - NameResolver
     * @property {string} ReverseNameResolver - ReverseNameResolver
     * @property {string} ExportTool - ExportTool
     */
    Constants.SERVICE = {
        FitsHips: "FitsHips",
        FitsVisu: "FitsVisu",
        Histogram: "Histogram",
        ImageProcessing: "ImageProcessing",
        MeasureToolSky: "MeasureToolSky",
        MeasureToolPlanet: "MeasureToolPlanet",
        MocBase: "MocBase",
        MollweideViewer: "MollweideViewer",
        PickingManager: "PickingManager",
        Samp: "Samp",
        SelectionTool: "SelectionTool",
        NameResolver: "NameResolver",
        ReverseNameResolver: "ReverseNameResolver",
        ExportTool: "ExportTool",
        TimeTravel: "TimeTravel"
    };

    /**
     * @namespace
     * HANDLER
     * @property {string} Touch - Touch device
     * @property {string} Keyboard - Keyboard device
     * @property {string} Mouse - Mouse device
     * @property {string} GoogleMouse - GoogleMouse device
     */
    Constants.HANDLER = {
        Touch: "Touch",
        Keyboard: "Keyboard",
        Mouse: "Mouse",
        GoogleMouse: "GoogleMouse"
    };

    /**
     * @namespace
     * PROVIDER
     * @property {string} Constellation - Constellation
     * @property {string} Json - Json
     * @property {string} Planet - Planet
     * @property {string} Star - Star
     * @property {string} Trajectory - Trajectory
     */
    Constants.PROVIDER = {
        Constellation: "Constellation",
        Planet: "Planet",
        Star: "Star",
        Crater: "Crater",
        Trajectory: "Trajectory"
    };

    /**
     * @namespace
     * MappingCrsHips2Mizar
     * @property {string} equatorial - Equatorial
     * @property {string} galactic - Galactic
     * @property {string} ecliptic - Ecliptic
     * @property {string} horizontalLocal - Equatorial
     */
    Constants.MappingCrsHips2Mizar = {
        equatorial: "Equatorial",
        galactic: "Galactic",
        ecliptic: "Ecliptic",
        "mars-panstimson": "Equatorial",
        horizontalLocal: "Equatorial"
    };

    /**
     * @namespace
     * UTILITY
     * @property {string} Fits - Fits utility
     * @property {string} Intersection - Intersection utility
     * @property {string} CreateStyle - CreateStyle utility
     * @property {string} FeatureStyle - FeatureStyle utility
     */
    Constants.UTILITY = {
        Fits: "Fits",
        Intersection: "Intersection",
        Numeric: "Numeric",
        CreateStyle: "CreateStyle",
        FeatureStyle: "FeatureStyle"
    };

    /**
     * @namespace
     * ANIMATION_STATUS
     * @property {string} STOPPED - animation is stopped
     * @property {string} RUNNING - animation is running
     * @property {string} PAUSED - animation is paused
     */
    Constants.ANIMATION_STATUS = {
        STOPPED: "STOPPED",
        RUNNING: "RUNNING",
        PAUSED: "PAUSED"
    };

    /**
     * @namespace
     * EVENT_MSG
     * @property {string} PLUGIN_NOT_FOUND - Plugin not found
     * @property {string} MIZAR_MODE_TOGGLE - Mizar mode, one value among {Constants.CONTEXT}
     * @property {string} LAYER_BACKGROUND_ADDED - Background Layer added
     * @property {string} LAYER_BACKGROUND_CHANGED - Background Layer changed
     * @property {string} LAYER_ADDED - Layer added
     * @property {string} LAYER_REMOVED - Layer removed
     * @property {string} LAYER_VISIBILITY_CHANGED - Visibility Layer changed
     * @property {string} LAYER_OPACITY_CHANGED - Opacity Layer changed
     * @property {string} LAYER_START_LOAD - Overlay rasters or vectors start to load
     * @property {string} LAYER_END_LOAD - Overlay rasters  or vectors finish to load
     * @property {string} LAYER_START_BACKGROUND_LOAD - Background rasters start to load
     * @property {string} LAYER_END_BACKGROUND_LOAD - Background rasters finish to load
     * @property {string} BASE_LAYERS_ERROR - Error at the initialisation of layer to render
     * @property {string} BASE_LAYERS_READY - Initialisation of the rendering is fine
     * @property {string} CRS_MODIFIED - Coordinate reference system is modified
     * @property {string} NAVIGATION_STARTED - Navigation started
     * @property {string} NAVIGATION_ENDED - Navigation ended
     * @property {string} NAVIGATION_MODIFIED - Navigation modified
     * @property {string} NAVIGATION_CHANGED_DISTANCE - Distance of the camera from the planet has changed
     * @property {string} IMAGE_DOWNLOADED - Image downloaded
     * @property {string} IMAGE_REMOVED - Image removed
     * @property {string} IMAGE_ADDED - Image added
     * @property {string} FEATURED_ADDED - Feature added
     * @property {string} GLOBAL_TIME_REWIND - global time is rewinded
     * @property {string} GLOBAL_TIME_FORWARD - global time is forwarded
     * @property {string} GLOBAL_TIME_SET - global time is set
     * @property {string} GLOBAL_TIME_CHANGED - global time has changed

     */
    Constants.EVENT_MSG = {
        PLUGIN_NOT_FOUND: "plugin:not_found",
        MIZAR_MODE_TOGGLE: "mizarMode:toggle",
        LAYER_BACKGROUND_ERROR: "backgroundLayer:error",
        LAYER_BACKGROUND_ADDED: "backgroundLayer:added",
        LAYER_BACKGROUND_CHANGED: "backgroundLayer:changed",
        LAYER_ADDED: "layer:added",
        LAYER_REMOVED: "layer:removed",
        LAYER_VISIBILITY_CHANGED: "visibility:changed",
        LAYER_OPACITY_CHANGED: "opacity:changed",
        LAYER_START_LOAD: "startLoad",
        LAYER_END_LOAD: "endLoad",
        LAYER_START_BACKGROUND_LOAD: "startBackgroundLoad",
        LAYER_END_BACKGROUND_LOAD: "endBackgroundLoad",
        LAYER_UPDATE_STATS_ATTRIBUTES: "updateStatsAttribute",
        LAYER_TOGGLE_WMS: "toggleWMS",
        BASE_LAYERS_ERROR: "baseLayersError",
        BASE_LAYERS_READY: "baseLayersReady",
        CRS_MODIFIED: "modifiedCrs",
        NAVIGATION_STARTED: "startNavigation",
        NAVIGATION_ENDED: "endNavigation",
        NAVIGATION_MODIFIED: "modifiedNavigation",
        NAVIGATION_CHANGED_DISTANCE: "navigation:changedDistance",
        IMAGE_DOWNLOADED: "image:downloaded",
        IMAGE_REMOVED: "image:removed",
        IMAGE_ADDED: "image:added",
        FEATURED_ADDED: "features:added",
        GLOBAL_TIME_REWIND: "globalTime:rewind",
        GLOBAL_TIME_FORWARD: "globalTime:forward",
        GLOBAL_TIME_SET: "globalTime:set",
        GLOBAL_TIME_CHANGED: "globalTime:changed" // temporary, need to be link to LAYERS_TIME_CHANGED after dev
    };

    /**
     * @namespace
     * DISPLAY_ORDER
     * @property {string} RENDERING - Special rendering index
     * @property {string} DEFAULT_RASTER - Default layer index (specially images)
     * @property {string} SELECTED_RASTER - Selected layer index (specially images)
     * @property {string} DEFAULT_VECTOR - Default vector index
     * @property {string} SELECTED_VECTOR - Selected vector index
     * @property {string} SERVICE_VECTOR - Service index
     */
    Constants.DISPLAY = {
        RENDERING: -1,
        DEFAULT_RASTER: 0,
        SELECTED_RASTER: 10,
        DEFAULT_VECTOR: 20,
        SELECTED_VECTOR: 30,
        SERVICE_VECTOR: 40
    };

    /**
     * @namespace
     * INFORMATION_TYPE
     * @property {string} ATMOSPHERE - atmosphere data
     * @property {string} RASTER - raster data
     * @property {string} VECTOR - vector data
     */
    Constants.INFORMATION_TYPE = {
        ATMOSPHERE: "ATMOSPHERE",
        RASTER: "RASTER",
        VECTOR: "VECTOR"
    };

    /**
     * @namespace
     * TIME_STEP
     * @property {string} YEAR - years
     * @property {string} QUARTER - quarters
     * @property {string} MONTH - months
     * @property {string} WEEK - weeks
     * @property {string} DAY - days
     * @property {string} HOUR - hours
     * @property {string} MINUTE - minutes
     * @property {string} SECOND - seconds
     * @property {string} MILLISECOND - milliseconds
     * @property {string} ENUMERATED - null
     */
    Constants.TIME_STEP = {
        YEAR: "years",
        QUARTER: "quarters",
        MONTH: "months",
        WEEK: "weeks",
        DAY: "days",
        HOUR: "hours",
        MINUTE: "minutes",
        SECOND: "seconds",
        MILLISECOND: "milliseconds",
        ENUMERATED: null
    };

    /**
     * @namespace
     * TIME_MOMENT_STEP
     * @property {string} YEAR - year
     * @property {string} MONTH - month
     * @property {string} DAY - day
     * @property {string} HOUR - hour
     * @property {string} MINUTE - minute
     * @property {string} SECOND - second
     */

    Constants.TIME_MOMENT_STEP = {
        YEAR: "year",
        MONTH: "month",
        DAY: "day",
        HOUR: "hour",
        MINUTE: "minute",
        SECOND: "second"
    };

    /**
     * @namespace
     * UNIT_TIME_WMS
     * @property {string} YEAR - Y
     * @property {string} MONTH - M
     * @property {string} DAY - D
     * @property {string} HOUR - H
     * @property {string} MINUTE - M
     * @property {string} SECOND - S
     */

    Constants.UNIT_TIME_WMS = {
        YEAR: "Y",
        MONTH: "M",
        DAY: "D",
        HOUR: "H",
        MINUTE: "M",
        SECONDE: "S"
    };

    /**
     * @namespace
     * UNIT_RESOLUTION_WMS
     * @property {string} TIME - PT
     * @property {string} NOT_TIME - P
     */

    Constants.UNIT_RESOLUTION_WMS = {
        TIME: "PT",
        NOT_TIME: "P"
    };

    /**
     * @namespace
     * TIME
     * @property {string} DEFAULT_FORMAT - Do MMM Y HH:mm
     */

    Constants.TIME = {
        DEFAULT_FORMAT: "Do MMM Y HH:mm"
    };

    /**
     * @namespace
     * TILE
     * @property {string} GEO_TILE - GeoTile
     * @property {string} MERCATOR_TILE - MercatorTile
     * @property {string} HEALPIX_TILE - HealpixTile          
     */    
    Constants.TILE = {
        GEO_TILE: "GeoTile",
        MERCATOR_TILE: "MercatorTile",
        HEALPIX_TILE: "HealpixTile"
    };

    /**************************************************************************************************************/

    return Constants;
});
