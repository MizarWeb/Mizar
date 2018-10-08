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
    "./Tile",
    "./HEALPixBase",
    "../Renderer/GeoBound",
    "../Utils/Numeric",
    "../Utils/Constants",
    "../Gui/dialog/ErrorDialog"
], function(Tile, HEALPixBase, GeoBound, Numeric, Constants, ErrorDialog) {
    /**
         Tile constructor

         Quadrilateral which composes one tile of HEALPix sphere

         nside : 2^order
         order : log2(nside);
         pix : pixel index number
         face : face number = [0..11]
         @constructor
         */
    var HEALPixTile = function(order, pix, face) {
        // Call ancestor constructor
        Tile.prototype.constructor.call(this);

        this.level = this.order = order;        
        this.nside = Math.pow(2, this.order);
        this.pixelIndex = pix;
        this.face = face;

        this.key = this.level+"#"+this.pixelIndex;
        this.type = Constants.TILE.HEALPIX_TILE; 

        // Compute texture transform
        /*	var width = 1728/64;
             var height = 1856/64;
             this.texTransform = [64/1728, 64/1856, ((this.pixelIndex % width))/width, ((Math.floor(this.pixelIndex/width))/height)];*/

        this.geoBound = null;
    };

    /**************************************************************************************************************/

    /** inherits from Tile */
    HEALPixTile.prototype = new Tile();

    /**************************************************************************************************************/

    HEALPixTile.prototype.getKey = function() {
        return this.key;
    };

    /**
         Create the children
         */
    HEALPixTile.prototype.createChildren = function() {
        // Create the children

        var child00 = new HEALPixTile(
            this.order + 1,
            this.pixelIndex * 4,
            this.face
        );
        var child10 = new HEALPixTile(
            this.order + 1,
            this.pixelIndex * 4 + 2,
            this.face
        );
        var child01 = new HEALPixTile(
            this.order + 1,
            this.pixelIndex * 4 + 1,
            this.face
        );
        var child11 = new HEALPixTile(
            this.order + 1,
            this.pixelIndex * 4 + 3,
            this.face
        );

        child00.initFromParent(this, 0, 0);
        child10.initFromParent(this, 1, 0);
        child01.initFromParent(this, 0, 1);
        child11.initFromParent(this, 1, 1);

        this.children = [child00, child10, child01, child11];
    };

    /**************************************************************************************************************/

    /**
         Compute the local matrix for the tile
         */
    HEALPixTile.prototype.computeLocalMatrix = function(vertices) {
        var matrix = mat4.create();

        var east = vec3.create();
        var north = vec3.create();
        var up = vec3.create();

        var mx = 0;
        var my = 0;
        var mz = 0;
        for (var i = 0; i < vertices.length; i++) {
            mx += vertices[i][0];
            my += vertices[i][1];
            mz += vertices[i][2];
        }
        var barycenter = vec3.create([
            mx / vertices.length,
            my / vertices.length,
            mz / vertices.length
        ]);

        vec3.set(barycenter, up);
        vec3.normalize(up);

        vec3.subtract(vertices[0], vertices[3], north);

        vec3.cross(up, north, east);
        vec3.normalize(east);
        vec3.cross(up, east, north);
        vec3.normalize(north);

        matrix[0] = east[0];
        matrix[1] = east[1];
        matrix[2] = east[2];
        matrix[3] = 0.0;

        matrix[4] = north[0];
        matrix[5] = north[1];
        matrix[6] = north[2];
        matrix[7] = 0.0;

        matrix[8] = up[0];
        matrix[9] = up[1];
        matrix[10] = up[2];
        matrix[11] = 0.0;

        matrix[12] = barycenter[0];
        matrix[13] = barycenter[1];
        matrix[14] = barycenter[2];
        matrix[15] = 1.0;

        return matrix;
    };

    /**************************************************************************************************************/

    function _computeWorldSpaceVertices(config, nside, pixelIndex, face) {
        // Build the vertices
        var size = config.tesselation;
        var worldSpaceVertices = [];
        var step = 1.0 / (size - 1);

        // xyf calculation
        var pix = pixelIndex & (nside * nside - 1);
        var ix = HEALPixBase.compress_bits(pix);
        var iy = HEALPixBase.compress_bits(pix >>> 1);
        // Compute array of worldspace coordinates
        for (var u = 0; u < size; u++) {
            for (var v = 0; v < size; v++) {
                var vertice = HEALPixBase.fxyf(
                    (ix + u * step) / nside,
                    (iy + v * step) / nside,
                    face
                );

                // Take sphere radius into account
                vertice[0] *= config.coordinateSystem.getGeoide().getRadius();
                vertice[1] *= config.coordinateSystem.getGeoide().getRadius();
                vertice[2] *= config.coordinateSystem.getGeoide().getRadius();
                //TODO a modifier
                if (config.coordinateSystem.getGeoideName() !== Constants.CRS.Equatorial) {
                    var geo = config.coordinateSystem.getWorldFrom3D(vertice);
                    var eq = config.coordinateSystem.convert(
                        geo,
                        config.coordinateSystem.getGeoideName(),
                        Constants.CRS.Equatorial
                    );
                    worldSpaceVertices[u * size + v] = config.coordinateSystem.get3DFromWorld(eq);
                } else {
                    worldSpaceVertices[u * size + v] = vertice;
                }
            }
        }  
        return worldSpaceVertices;      
    }

    function _computeCorners(config, worldSpaceVertices) {
        var corners = [];
        var size = config.tesselation;
        corners.push(config.coordinateSystem.getWorldFrom3D(worldSpaceVertices[0]));
        corners.push(config.coordinateSystem.getWorldFrom3D(worldSpaceVertices[size - 1]));
        corners.push(config.coordinateSystem.getWorldFrom3D(worldSpaceVertices[size * (size - 1)]));
        corners.push(config.coordinateSystem.getWorldFrom3D(worldSpaceVertices[size * size - 1]));
        return corners;
    }

    HEALPixTile.prototype.getCorners = function() {
        var worldSpaceVertices = _computeWorldSpaceVertices(this.config, this.nside, this.pixelIndex, this.face);
        var corners = _computeCorners(this.config, worldSpaceVertices);
        return corners;
    }; 

    /**
         Generate vertices for tile
         */
    HEALPixTile.prototype.generateVertices = function() {
        var size = this.config.tesselation;
        var worldSpaceVertices = _computeWorldSpaceVertices(this.config, this.nside, this.pixelIndex, this.face);
        var corners = _computeCorners(this.config, worldSpaceVertices);
        // Compute geoBound using corners of tile
        this.geoBound = new GeoBound();
        this.geoBound.computeFromCoordinates(corners);

        // Compute tile matrix
        this.matrix = this.computeLocalMatrix(worldSpaceVertices);
        var invMatrix = mat4.create();
        mat4.inverse(this.matrix, invMatrix);
        this.inverseMatrix = invMatrix;

        // Compute tile matrix
        /*var center = HEALPixBase.fxyf((ix+0.5)/this.nside, (iy+0.5)/this.nside, face);
             var geoCenter = coordinateSystem.getWorldFrom3D(center);
             this.matrix = coordinateSystem.getLHVTransform( geoCenter );
             var invMatrix = mat4.create();
             mat4.inverse( this.matrix, invMatrix );
             this.inverseMatrix = invMatrix;*/

        // Build the vertices
        var vertices = new Float32Array(3 * size * size);

        // Vertex coordinates in local space
        var vertexOffset = 0;
        for (var i = 0; i < worldSpaceVertices.length; i++) {
            vertices[vertexOffset] =
                invMatrix[0] * worldSpaceVertices[i][0] +
                invMatrix[4] * worldSpaceVertices[i][1] +
                invMatrix[8] * worldSpaceVertices[i][2] +
                invMatrix[12];
            vertices[vertexOffset + 1] =
                invMatrix[1] * worldSpaceVertices[i][0] +
                invMatrix[5] * worldSpaceVertices[i][1] +
                invMatrix[9] * worldSpaceVertices[i][2] +
                invMatrix[13];
            vertices[vertexOffset + 2] =
                invMatrix[2] * worldSpaceVertices[i][0] +
                invMatrix[6] * worldSpaceVertices[i][1] +
                invMatrix[10] * worldSpaceVertices[i][2] +
                invMatrix[14];
            vertexOffset += 3;
        }

        return vertices;
    };

    /**************************************************************************************************************/

    /**
     *    HEALPixTiling constructor
     *    @name HEALPixTiling
     *
     *    @param order Starting tiling order
     *    @param options Options
     *        <ul>
     *            <li>coordSystem: Coordinate system of the given tiling</li>
     *        </ul>
     *    @constructor
     */
    var HEALPixTiling = function(order, options) {
        this.order = order;
        this.nside = Math.pow(2, this.order);
        this.coordinateSystem = options.coordinateSystem;
        // TODO undefined coord system
    };

    /**************************************************************************************************************/

    /**
         Generate the tiles for level zero
         */
    HEALPixTiling.prototype.generateLevelZeroTiles = function(
        config,
        tilePool
    ) {
        config.skirt = false;
        config.cullSign = -1;
        config.tesselation = 5;
        // TODO : change name to avoid ambiguity
        config.coordinateSystem = this.coordinateSystem;
        this.coordinateSystem = config.coordinateSystem;
        var level0Tiles = [];

        var qpf = Math.pow(this.nside, 2); // quad per face
        var nFaces = 12;
        var nQuads = nFaces * qpf;

        for (var i = 0; i < nQuads; i++) {
            var face = Math.floor(i / qpf);
            var tile = new HEALPixTile(this.order, i, face);
            tile.config = config;
            level0Tiles.push(tile);
        }

        return level0Tiles;
    };

    // Get all the coordinates of a geometry
    var _getGeometryCoordinates = function(geometry) {
        var coords, n;
        switch (geometry.type) {
        case Constants.GEOMETRY.Point:
            coords = [];
            coords.push(geometry.coordinates);
            break;
        case Constants.GEOMETRY.MultiPoint:
        case Constants.GEOMETRY.LineString:
            coords = geometry.coordinates;
            break;
        case Constants.GEOMETRY.MultiLineString:
            coords = [];
            for (n = 0; n < geometry.coordinates.length; n++) {
                coords = coords.concat(geometry.coordinates[n]);
            }
            break;
        case Constants.GEOMETRY.Polygon:
            coords = geometry.coordinates[0];
            break;
        case Constants.GEOMETRY.MultiPolygon:
            coords = [];
            for (n = 0; n < geometry.coordinates.length; n++) {
                coords = coords.concat(geometry.coordinates[n][0]);
            }
            break;
        case Constants.GEOMETRY.GeometryCollection:
            coords = [];
            for (n = 0; n < geometry.geometries.length; n++) {
                coords = coords.concat(
                    _getGeometryCoordinates(geometry.geometries[n])
                );
            }
            break;
        }
        return coords;
    };

    /**************************************************************************************************************/

    /**
         Get the level zero tiles that overlaps the given geometry
         */
    HEALPixTiling.prototype.getOverlappedLevelZeroTiles = function(geometry) {
        var tileIndices = [];

        var coords = _getGeometryCoordinates(geometry);
        if (!coords) {
            ErrorDialog.open(Constants.LEVEL.DEBUG, "HEALPixTiling.js", "Invalid geometry type or not supported.");
            return tileIndices;
        }

        var indexMap = {};
        for (var i = 0; i < coords.length; i++) {
            var index = this.lonlat2LevelZeroIndex(coords[i][0], coords[i][1]);
            if (!indexMap[index]) {
                indexMap[index] = true;
                tileIndices.push(index);
            }
        }

        return tileIndices;
    };

    /**************************************************************************************************************/

    /**
         Locate a level zero tile
         */
    HEALPixTiling.prototype.lonlat2LevelZeroIndex = function(lon, lat) {
        //var geo = this.coordinateSystem.convert([lon, lat], Constants.CRS.Equatorial, this.coordinateSystem.getGeoideName());
        //lon = geo[0];
        //lat = geo[1];
        return HEALPixBase.lonLat2pix(this.order, lon, lat);
    };

    /**************************************************************************************************************/

    /**
         Return tile of given longitude/latitude from tiles array if exists, null otherwise
         */
    HEALPixTiling.prototype.findInsideTile = function(lon, lat, tiles) {
        //var geo = this.coordinateSystem.convert([lon, lat], Constants.CRS.Equatorial, this.coordinateSystem.getGeoideName());
        //lon = geo[0];
        //lat = geo[1];
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            var index = HEALPixBase.lonLat2pix(tile.order, lon, lat);
            if (index === tile.pixelIndex) {
                return tile;
            }
        }
        return null;
    };

    /**************************************************************************************************************/

    /**************************************************************************************************************/

    return HEALPixTiling;
});
