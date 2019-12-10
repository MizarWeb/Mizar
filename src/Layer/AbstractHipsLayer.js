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
define([
    "underscore-min",
    "./AbstractRasterLayer",
    "../Utils/Utils",
    "../Utils/Constants",
    "../Tiling/HEALPixTiling",
    "../Crs/CoordinateSystemFactory",
    "./HipsMetadata"
], function(
    _,
    AbstractRasterLayer,
    Utils,
    Constants,
    HEALPixTiling,
    CoordinateSystemFactory,
    HipsMetadata
) {
    /**
     * AbstractHipsLayer configuration
     * @typedef {AbstractLayer.configuration} AbstractHipsLayer.configuration
     * @property {Crs} [coordinateSystem = CoordinateSystemFactory.create({geoideName: Constants.MappingCrsHips2Mizar[this.hipsMetadata.hips_frame]})] - Coordinate reference system
     * @property {int} [tilePixelSize = hipsMetadata['hips_tile_width'] - Tiles width in pixels
     * @property {int} [baseLevel = 2] - min HiPS order
     * @property {HEALPixTiling} [tiling = new HEALPixTiling(options.baseLevel, {coordinateSystem: options.coordinateSystem})] - Tiling
     * @property {int} [numberOfLevels = hipsMetadata['hips_order']] - Deepest order min
     * @property {string} [name = hipsMetadata['obs_title']] - Data set title
     * @property {string} [attribution = <a href=\"" + this.hipsMetadata['obs_copyright_url'] + "\" target=\"_blank\">" + this.hipsMetadata['obs_copyright'] + "</a>"] - URL to a copyright mention
     * @property {string} [ack = hipsMetadata['obs_ack']] - Acknowledgment mention
     * @property {string} [icon = ""] - icon used as metadata representation on the map
     * @property {string} [description = hipsMetadata['obs_description']] - Data set description
     * @property {boolean} [visible = false] visibility by default on the map
     * @property {Object} properties - other metadata
     * @property {float} [properties.initialRa = undefined] - Initial RA
     * @property {float} [properties.initialDec = undefined] - Initial DEC
     * @property {float} [properties.initialFov = undefined] - Initial field of view
     * @property {float} [properties.mocCoverage = undefined] - Sky fraction coverage
     * @property {boolean} [pickable = false] - Pickable layer
     * @property {Array} [availableServices = {}] - List of services related to the layer
     * @property {Array} [format = hipsMetadata['hips_tile_format']] - List of available tile formats
     * @property {string} [baseUrl =  hipsMetadata['hips_service_url']] - Endpoint service
     * @property {string} [category = Image] - Default category
     * @property {boolean} background - Tell if the layer is set as background
     */

    /**
     * @name AbstractHipsLayer
     * @class
     * Abstract class for HIPS
     * @augments AbstractRasterLayer
     * @param {HipsMetadata} hipsMetadata
     * @param {AbstractHipsLayer.configuration} options - AbstractHipsLayer configuration
     * @see {@link http://www.ivoa.net/documents/HiPS/20170406/index.html Hips standard}
     * @throws ReferenceError - Some required parameters are missing
     * @constructor
     */
    var AbstractHipsLayer = function(hipsMetadata, options) {
        _checkAndSetDefaultOptions.call(this, options);
        this.hipsMetadata = _createMetadata.call(
            this,
            hipsMetadata,
            options.baseUrl
        );
        
        _overloadHipsMetataByConfiguration.call(
            this,
            options,
            this.hipsMetadata
        );

        options.tiling = new HEALPixTiling(options.baseLevel || 0, {
            coordinateSystem: options.coordinateSystem
        });
        options.icon = options.hasOwnProperty("icon")
            ? options.icon
            : options.mizarBaseUrl
                ? options.mizarBaseUrl + "css/images/star.png"
                : "";
        options.visible = options.hasOwnProperty("visible")
            ? options.visible
            : false;
        options.properties = options.hasOwnProperty("properties")
            ? options.properties
            : {};
        options.pickable = options.hasOwnProperty("pickable")
            ? options.pickable
            : false;
        options.services = options.hasOwnProperty("services")
            ? options.services
            : {};

        options.category = options.hasOwnProperty("category")
            ? options.category
            : "Image"; //this.hipsMetadata.client_category;

        if (this.hipsMetadata.hasOwnProperty("moc_access_url")) {
            options.services.Moc = {
                baseUrl: this.hipsMetadata.moc_access_url,
                skyFraction: this.hipsMetadata.moc_sky_fraction
            };
        }

        //Hack : set Galactic layer as background because only background owns two grids (equetorial and galactic)
        if (
            options.coordinateSystem.getGeoideName() === Constants.CRS.Galactic
        ) {
            options.background = true;
        }

        AbstractRasterLayer.prototype.constructor.call(
            this,
            Constants.LAYER.Hips,
            options
        );

        this.fitsSupported = _.contains(
            this.hipsMetadata.hips_tile_format,
            "fits"
        );
    };

    /**
     * Check options.
     * @param options
     * @throws ReferenceError - Some required parameters are missing
     * @private
     */
    function _checkAndSetDefaultOptions(options) {
        if (!options) {
            throw new ReferenceError(
                "Some required parameters are missing",
                "AbstractHipsLayer.js"
            );
        } else {
            options.category = options.category || "Image";
            options.pickable = options.pickable || false;
        }
    }

    /**
     * Creates metadata.
     * @param hipsMetadata
     * @param baseUrl
     * @returns {*}
     * @private
     */
    function _createMetadata(hipsMetadata, baseUrl) {
        var metadata = hipsMetadata;
        if (typeof metadata === "undefined") {
            var hipsProperties = new HipsMetadata(baseUrl);
            metadata = hipsProperties.getHipsMetadata();
        }
        return metadata;
    }

    /**
     *
     * @param options
     * @param hipsMetadata
     * @private
     */
    function _overloadHipsMetataByConfiguration(options, hipsMetadata) {
        options.coordinateSystem = options.hasOwnProperty("coordinateSystem")
            ? CoordinateSystemFactory.create(options.coordinateSystem)
            : CoordinateSystemFactory.create({
                geoideName:
                      Constants.MappingCrsHips2Mizar[hipsMetadata.hips_frame]
            });
        options.tilePixelSize = options.hasOwnProperty("tilePixelSize")
            ? options.tilePixelSize
            : hipsMetadata.hips_tile_width;
        options.baseLevel = options.hasOwnProperty("baseLevel")
            ? options.baseLevel
            : hipsMetadata.hasOwnProperty("hips_order_min") && hipsMetadata.hips_order_min >= 2
                ? parseInt(hipsMetadata.hips_order_min)
                : 0;
        options.numberOfLevels = options.hasOwnProperty("numberOfLevels")
            ? options.numberOfLevels
            : parseInt(hipsMetadata.hips_order);
        options.name = options.hasOwnProperty("name")
            ? options.name
            : hipsMetadata.obs_title;
        options.attribution = options.hasOwnProperty("attribution")
            ? options.attribution
            : "<a href=\"" +
              hipsMetadata.obs_copyright_url +
              "\" target=\"_blank\">" +
              hipsMetadata.obs_copyright +
              "</a>";
        options.copyrightUrl = options.hasOwnProperty("copyrightUrl")
            ? options.copyrightUrl
            : hipsMetadata.obs_copyright_url;
        options.ack = options.hasOwnProperty("ack")
            ? options.ack
            : hipsMetadata.obs_ack;
        options.description = options.hasOwnProperty("description")
            ? options.description
            : hipsMetadata.obs_description;
        options.format = options.hasOwnProperty("format")
            ? options.format
            : hipsMetadata.hips_tile_format;
        options.baseUrl = options.hasOwnProperty("baseUrl")
            ? options.baseUrl
            : hipsMetadata.hips_service_url;
        options.properties = options.hasOwnProperty("properties")
            ? options.properties
            : {};
        if (hipsMetadata.hasOwnProperty("obs_initial_ra")) {
            options.properties.initialRa = parseFloat(
                hipsMetadata.obs_initial_ra
            );
        }
        if (hipsMetadata.hasOwnProperty("obs_initial_dec")) {
            options.properties.initialDec = parseFloat(
                hipsMetadata.obs_initial_dec
            );
        }
        if (hipsMetadata.hasOwnProperty("obs_initial_fov")) {
            options.properties.initialFov = Math.sqrt( 360 * 360 / Math.PI * parseFloat(
                hipsMetadata.obs_initial_fov)
            );
        }
        if (hipsMetadata.hasOwnProperty("moc_sky_fraction")) {
            options.properties.moc_sky_fraction = parseFloat(
                hipsMetadata.moc_sky_fraction
            );
        }
    }

    /**************************************************************************************************************/

    Utils.inherits(AbstractRasterLayer, AbstractHipsLayer);

    /**************************************************************************************************************/

    /**
     * Returns the Metadata related to Hips protocol.
     * @return {Object}
     * @memberof AbstractHipsLayer#
     */
    AbstractHipsLayer.prototype.getHipsMetadata = function() {
        return this.hipsMetadata;
    };

    return AbstractHipsLayer;
});
