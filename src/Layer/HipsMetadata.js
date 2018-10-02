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

define(["jquery", "../Utils/Constants", "../Gui/dialog/ErrorDialog", "../Utils/Proxy"], function(
    $,
    Constants,
    ErrorDialog,
    Proxy
) {
    /**
     * @namespace
     * GENERAL_WAVELENGTH
     * @property {string} Radio - Radio
     * @property {string} Millimeter - Millimeter
     * @property {string} Infrared - Infrared
     * @property {string} Optical - Optical
     * @property {string} UV - UV
     * @property {string} EUV - EUV
     * @property {string} X-ray - X-ray
     * @property {string} Gamma-ray - Gamma-ray
     */
    var GENERAL_WAVELENGTH = {
        Radio: "Radio",
        Millimeter: "Millimeter",
        Infrared: "Infrared",
        Optical: "Optical",
        UV: "UV",
        EUV: "EUV",
        "X-ray": "X-ray",
        "Gamma-ray": "Gamma-ray"
    };

    /**
     * @namespace
     * HIPS_FRAME
     * @property {string} equatorial - equatorial
     * @property {string} galactic - galactic
     * @property {string} ecliptic - ecliptic
     * @property {string} horizontalLocal - horizontalLocal
     */
    var HIPS_FRAME = {
        equatorial: Constants.CRS.Equatorial,
        galactic: Constants.CRS.Galactic,
        ecliptic: "ecliptic",
        horizontalLocal: Constants.CRS.HorizontalLocal
    };

    /**
     * @namespace
     * HIPS_TILE_FORMAT
     * @property {string} jpeg - jpeg
     * @property {string} png - png
     * @property {string} fits - fits
     * @property {string} tsv - tsv
     */
    var HIPS_TILE_FORMAT = {
        jpeg: "jpeg",
        png: "png",
        fits: "fits",
        tsv: "tsv"
    };

    /**
     * @namespace
     * SAMPLING
     * @property {string} none - none
     * @property {string} nearest - nearest
     * @property {string} bilinear - bilinear
     */
    var SAMPLING = {
        none: "non",
        nearest: "nearest",
        bilinear: "bilinear"
    };

    /**
     * @namespace
     * PIXEL_OVERLAY
     * @property {string} add - add
     * @property {string} mean - mean
     * @property {string} first - first
     * @property {string} border_fading - border_fading
     * @property {string} custom - custom
     */
    var PIXEL_OVERLAY = {
        add: "add",
        mean: "mean",
        first: "first",
        border_fading: "border_fading",
        custom: "custom"
    };

    /**
     * @namespace
     * SKY_VAL
     * @property {string} none - none
     * @property {string} hips_estimation - hips_estimation
     * @property {string} fits_keyword - fits_keyword
     */
    var SKY_VAL = {
        none: "none",
        hips_estimation: "hips_estimation",
        fits_keyword: "fits_keyword"
    };

    /**
     * @namespace
     * DATA_PRODUCT_TYPE
     * @property {string} image - image
     * @property {string} cube - cube
     * @property {string} catalog - catalog
     * @property {string} meta - meta
     */
    var DATA_PRODUCT_TYPE = {
        image: "image",
        cube: "cube",
        catalog: "catalog",
        meta: "meta"
    };

    /**
     * @namespace
     * SUB_TYPE_DATA
     * @property {string} color - color
     * @property {string} live - live
     */
    var SUB_TYPE_DATA = {
        color: "color",
        live: "live"
    };

    /**
     * Hips data model
     * Mandatory, description, isMultiple, default value, distinctvalue, isArray
     * @namespace
     * HIPS_METADATA
     * @property {string} creator_did - Unique ID of the HiPS - Format: IVOID - Ex : ivo://CDS/P/2MASS/J
     * @property {string} [publisher_id] - Unique ID of the HiPS publisher – Format: IVOID - Ex : ivo://CDS
     * @property {string} [obs_collection] - Short name of original data set – Format: one word – Ex : 2MASS
     * @property {string} obs_title - Data set title – Format: free text, one line – Ex : HST F110W observations
     * @property {string} [obs_description] - Data set description – Format: free text, longer free text description of the dataset
     * @property {string} [obs_ack] - Acknowledgment mention"
     * @property {string} [prov_progenitor] - Provenance of the original data – Format: free text
     * @property {string} [bib_reference] - Bibliographic reference
     * @property {string} [bib_reference_url] - URL to bibliographic reference
     * @property {string} [obs_copyright] - Copyright mention – Format: free text
     * @property {string} [obs_copyright_url] - URL to a copyright mention
     * @property {GENERAL_WAVELENGTH} [obs_regime] - General wavelength
     * @property {string} [data_ucd] - UCD describing data contents
     * @property {string} hips_version="1.4" - Number of HiPS version – Format: number
     * @property {string} [hips_builder] - Name and version of the tool used for building the HiPS – Format: free text
     * @property {string} [hips_publisher] - Institute or person who built the HiPS – Format: free text – Ex : CDS (T.Boch)
     * @property {string} [hips_creation_date] - HiPS first creation date - Format: ISO 8601 => YYYY-mm-ddTHH:MMZ
     * @property {string} hips_release_date - Last HiPS update date - Format: ISO 8601 => YYYY-mm-ddTHH:MMZ
     * @property {string} [hips_service_url] - HiPS access url – Format: URL
     * @property {string} hips_status - HiPS status
     * @property {string} [hips_estsize] - HiPS size estimation – Format: positive integer – Unit : KB
     * @property {HIPS_FRAME} hips_frame - Coordinate frame reference
     * @property {int} hips_order - Deepest HiPS order – Format: positive integer
     * @property {int} [hips_tile_width=512] - Tiles width in pixels – Format: positive integer
     * @property {HIPS_TILE_FORMAT} hips_tile_format - List of available tile formats
     * @property {string} [hips_pixel_cut] - Suggested pixel display cut range (physical values) – Format: min max
     * @property {string} [hips_data_range] - Pixel data range taken into account during the HiPS generation (physical values) – Format: min max – Ex : -18.5 510.5
     * @property {SAMPLING} [hips_sampling] - Sampling applied for the HiPS generation
     * @property {PIXEL_OVERLAY} [hips_overlay] - Pixel composition method applied on the image overlay region during HiPS generation
     * @property {SKY_VAL} [hips_skyval] - Sky background subtraction method applied during HiPS generation
     * @property {string} [hips_pixel_bitpix] - Fits tile BITPIX code
     * @property {string} [data_pixel_bitpix] - Original data BITPIX code
     * @property {DATA_PRODUCT_TYPE} dataproduct_type - Type of data
     * @property {SUB_TYPE_DATA} [dataproduct_subtype] - Subtype of data
     * @property {string} [hips_progenitor_url] - URL to an associated progenitor HiPS
     * @property {int} [hips_cat_nrows] -  Number of rows of the HiPS catalog
     * @property {int} [hips_cube_depth] - Number of frames of the HiPS cube
     * @property {int} [hips_cube_firstframe=0] - Initial first index frame to display for a HiPS cube
     * @property {float} [data_cube_crpix3] - Coef for computing physical channel value
     * @property {float} [data_cube_crval3] - Coef for computing physical channel value
     * @property {float} [data_cube_cdelt3] - Coef for computing physical channel value
     * @property {string} [data_cube_bunit3] - Third axis unit
     * @property {float} [hips_initial_ra] - Default RA display position (ICRS frame) – Unit : degrees
     * @property {float} [hips_initial_dec] - Default DEC display position (ICRS frame) – Unit : degrees
     * @property {float} [hips_initial_fov] - Default display size – Unit : degrees
     * @property {float} [hips_pixel_scale] - HiPS pixel angular resolution at the highest order – Unit : degrees
     * @property {float} [s_pixel_scale] - Best pixel angular resolution of the original images – Unit : degrees
     * @property {float} [t_min] - Start time of the observations - Representation: MJD
     * @property {float} [t_max] - Stop time of the observations - Representation: MJD
     * @property {float} [em_min] - Start in spectral coordinates – Unit: meters
     * @property {float} [em_max] - Stop in spectral coordinates – Unit: meters
     * @property {string} [client_category] - / separated keywords suggesting a display hierarchy to the client – Ex : Image/InfraRed
     * @property {string} [client_sort_key] - Sort key suggesting a display order to the client inside a client_category – Sort : alphanumeric
     * @property {string} [addendum_did] - In case of “live” HiPS, creator_did of the added HiPS
     * @property {float} [moc_sky_fraction] - Fraction of the sky covers by the MOC associated to the HiPS – Format: real between 0 and 1
     */
    var HipsVersion_1_4 = {
        creator_did: [
            "R",
            "Unique ID of the HiPS - Format: IVOID - Ex : ivo://CDS/P/2MASS/J",
            false,
            null,
            null,
            false
        ],
        publisher_id: [
            null,
            "Unique ID of the HiPS publisher – Format: IVOID - Ex : ivo://CDS",
            false,
            null,
            null,
            false
        ],
        obs_collection: [
            null,
            "Short name of original data set – Format: one word – Ex : 2MASS",
            false,
            null,
            null,
            false
        ],
        obs_title: [
            "R",
            "Data set title – Format: free text, one line – Ex : HST F110W observations",
            false,
            null,
            null,
            false
        ],
        obs_description: [
            "S",
            "Data set description – Format: free text, longer free text description of the dataset",
            false,
            null,
            null,
            false
        ],
        obs_ack: [null, "Acknowledgment mention", false, null, null, false],
        prov_progenitor: [
            "S",
            "Provenance of the original data – Format: free text",
            true,
            null,
            null,
            false
        ],
        bib_reference: [
            null,
            "Bibliographic reference",
            true,
            null,
            null,
            false
        ],
        bib_reference_url: [
            null,
            "URL to bibliographic reference",
            true,
            null,
            null,
            false
        ],
        obs_copyright: [
            null,
            "Copyright mention – Format: free text",
            false,
            null,
            null,
            false
        ],
        obs_copyright_url: [
            null,
            "URL to a copyright mention",
            false,
            null,
            null,
            false
        ],
        obs_regime: [
            "S",
            "General wavelength – Format: word",
            true,
            null,
            GENERAL_WAVELENGTH,
            false
        ],
        data_ucd: [
            null,
            "UCD describing data contents",
            true,
            null,
            null,
            false
        ],
        hips_version: [
            "R",
            "Number of HiPS version – Format: number",
            false,
            "1.4",
            null,
            false
        ],
        hips_builder: [
            null,
            "Name and version of the tool used for building the HiPS – Format: free text",
            false,
            null,
            null,
            false
        ],
        hips_publisher: [
            null,
            "Institute or person who built the HiPS – Format: free text – Ex : CDS (T.Boch)",
            false,
            null,
            null,
            false
        ],
        hips_creation_date: [
            "S",
            "HiPS first creation date - Format: ISO 8601 => YYYY-mm-ddTHH:MMZ",
            false,
            null,
            null,
            false
        ],
        hips_release_date: [
            "R",
            "Last HiPS update date - Format: ISO 8601 => YYYY-mm-ddTHH:MMZ",
            false,
            null,
            null,
            false
        ],
        hips_service_url: [
            null,
            "HiPS access url – Format: URL",
            false,
            null,
            null,
            false
        ],
        hips_status: [
            "R",
            "HiPS status",
            false,
            "public master clonableOnce",
            null,
            true
        ],
        hips_estsize: [
            null,
            "HiPS size estimation – Format: positive integer – Unit : KB",
            false,
            null,
            null,
            false
        ],
        hips_frame: [
            "R",
            "Coordinate frame reference",
            false,
            null,
            HIPS_FRAME,
            false
        ],
        hips_order: [
            "R",
            "Deepest HiPS order – Format: positive integer",
            false,
            null,
            null,
            false
        ],
        hips_tile_width: [
            null,
            "Tiles width in pixels – Format: positive integer",
            false,
            512,
            null,
            false
        ],
        hips_tile_format: [
            "R",
            "List of available tile formats. The first one is the default suggested to the client",
            false,
            null,
            HIPS_TILE_FORMAT,
            true
        ],
        hips_pixel_cut: [
            null,
            "Suggested pixel display cut range (physical values) – Format: min max",
            null,
            null,
            null,
            true
        ],
        hips_data_range: [
            null,
            "Pixel data range taken into account during the HiPS generation (physical values) – Format: min max – Ex : -18.5 510.5",
            false,
            null,
            null,
            true
        ],
        hips_sampling: [
            null,
            "Sampling applied for the HiPS generation",
            false,
            null,
            SAMPLING,
            false
        ],
        hips_overlay: [
            null,
            "Pixel composition method applied on the image overlay region during HiPS generation",
            false,
            null,
            PIXEL_OVERLAY,
            false
        ],
        hips_skyval: [
            null,
            "Sky background subtraction method applied during HiPS generation",
            false,
            null,
            SKY_VAL,
            false
        ],
        hips_pixel_bitpix: [
            null,
            "Fits tile BITPIX code",
            false,
            null,
            null,
            false
        ],
        data_pixel_bitpix: [
            null,
            "Original data BITPIX code",
            false,
            null,
            null
        ],
        dataproduct_type: [
            "R",
            "Type of data",
            false,
            null,
            DATA_PRODUCT_TYPE,
            false
        ],
        dataproduct_subtype: [
            "RD",
            "Subtype of data",
            false,
            null,
            SUB_TYPE_DATA,
            false
        ],
        hips_progenitor_url: [
            null,
            "URL to an associated progenitor HiPS",
            false,
            null,
            null,
            false
        ],
        hips_cat_nrows: [
            "S",
            "Number of rows of the HiPS catalog",
            false,
            null,
            null,
            false
        ],
        hips_cube_depth: [
            "RD",
            "Number of frames of the HiPS cube",
            false,
            null,
            null,
            false
        ],
        hips_cube_firstframe: [
            null,
            "Initial first index frame to display for a HiPS cube",
            false,
            0,
            null,
            false
        ],
        data_cube_crpix3: [
            null,
            "Coef for computing physical channel value (see FITS doc)",
            false,
            null,
            null,
            false
        ],
        data_cube_crval3: [
            null,
            "Coef for computing physical channel value (see FITS doc)",
            false,
            null,
            null,
            false
        ],
        data_cube_cdelt3: [
            null,
            "Coef for computing physical channel value (see FITS doc)",
            false,
            null,
            null,
            false
        ],
        data_cube_bunit3: [
            null,
            "Third axis unit (see FITS doc)",
            false,
            null,
            null,
            false
        ],
        hips_initial_ra: [
            "S",
            "Default RA display position (ICRS frame) – Unit : degrees",
            false,
            null,
            null,
            false
        ],
        hips_initial_dec: [
            "S",
            "Default DEC display position (ICRS frame) – Unit : degrees",
            false,
            null,
            null,
            false
        ],
        hips_initial_fov: [
            "S",
            "Default display size – Unit : degrees",
            false,
            null,
            null,
            false
        ],
        hips_pixel_scale: [
            null,
            "HiPS pixel angular resolution at the highest order – Unit : degrees",
            false,
            null,
            null,
            false
        ],
        s_pixel_scale: [
            null,
            "Best pixel angular resolution of the original images – Unit : degrees",
            false,
            null,
            null,
            false
        ],
        t_min: [
            "S",
            "Start time of the observations - Representation: MJD",
            false,
            null,
            null,
            false
        ],
        t_max: [
            "S",
            "Stop time of the observations - Representation: MJD",
            false,
            null,
            null,
            false
        ],
        em_min: [
            "S",
            "Start in spectral coordinates – Unit: meters",
            false,
            null,
            null,
            false
        ],
        em_max: [
            "S",
            "Stop in spectral coordinates – Unit: meters",
            false,
            null,
            null,
            false
        ],
        client_category: [
            null,
            "/ separated keywords suggesting a display hierarchy to the client – Ex : Image/InfraRed",
            false,
            null,
            null,
            false
        ],
        client_sort_key: [
            null,
            "Sort key suggesting a display order to the client inside a client_category – Sort : alphanumeric",
            false,
            null,
            null,
            false
        ],
        addendum_did: [
            null,
            "In case of “live” HiPS, creator_did of the added HiPS",
            true,
            null,
            null,
            false
        ],
        moc_sky_fraction: [
            null,
            "Fraction of the sky covers by the MOC associated to the HiPS – Format: real between 0 and 1",
            false,
            null,
            null,
            false
        ]
    };

    /**
     * Checks if the required attribute is stored in hipsMetadata.<br>
     * when the attribute is not stored, then store this information in requiredKeywordNotFound.
     * @param {HIPS_METADATA} hipsMetadata
     * @param {string} mandatory - "R" is a required parameter
     * @param {string} key - attribute to check
     * @param {string} description Key's description
     * @param requiredKeywordNotFound - Array or required information not found
     * @private
     */
    function _checkRequiredParameters(
        hipsMetadata,
        mandatory,
        key,
        description,
        requiredKeywordNotFound
    ) {
        if (mandatory === "R" && !hipsMetadata.hasOwnProperty(key)) {
            //Fix for version=1.2
            if (key === "creator_did" && hipsMetadata.hips_version === "1.2") {
                hipsMetadata.creator_did = hipsMetadata.publisher_did;
                ErrorDialog.open(
                    Constants.LEVEL.WARNING,
                    "Deprecated Hips version <b>1.2</b> for " +
                        hipsMetadata.obs_title,
                    "please update it - <i>use creator_did=publisher_did</i>"
                );
            }
            //Fix for version=1.3
            else if (
                key === "creator_did" &&
                hipsMetadata.hips_version === "1.3"
            ) {
                hipsMetadata.creator_did = hipsMetadata.publisher_did;
                ErrorDialog.open(
                    Constants.LEVEL.WARNING,
                    "Deprecated Hips version <b>1.3</b> for " +
                        hipsMetadata.obs_title,
                    "please update it - <i>use creator_did=publisher_did</i>"
                );
            } else if (
                key === "obs_title" &&
                hipsMetadata.hips_version === "1.3"
            ) {
                hipsMetadata.obs_title = hipsMetadata.obs_collection;
                ErrorDialog.open(
                    Constants.LEVEL.WARNING,
                    "Deprecated Hips version <b>1.3</b> for " +
                        hipsMetadata.obs_title,
                    "please update it - <i>use obs_title=obs_collection</i>"
                );
            }
            //Fox for version 1.4
            else if (
                key === "obs_title" &&
                hipsMetadata.hips_version === "1.4"
            ) {
                hipsMetadata.obs_title = hipsMetadata.obs_collection;
                ErrorDialog.open(
                    Constants.LEVEL.WARNING,
                    "obs_title not found in v1.4 for " + hipsMetadata.obs_title,
                    "use obs_title, please fix it"
                );
            } else if (
                key === "creator_did" &&
                hipsMetadata.hips_version === "1.4"
            ) {
                hipsMetadata.creator_did = hipsMetadata.publisher_did;
                ErrorDialog.open(
                    Constants.LEVEL.WARNING,
                    "creator_did not found in v1.4 for " +
                        hipsMetadata.obs_title,
                    "use creator_did, please fix it"
                );
            }
            /// very old version
            else if (
                key === "hips_version" &&
                !hipsMetadata.hasOwnProperty("hips_version")
            ) {
                hipsMetadata.hips_version = "very old one";
                ErrorDialog.open(
                    Constants.LEVEL.WARNING,
                    "Deprecated Hips version <b>unknown</b> for " +
                        hipsMetadata.obs_title,
                    "please update it - <i>use a version in your metadata</i>"
                );
            } else if (
                key === "creator_did" &&
                !hipsMetadata.hasOwnProperty("hips_version")
            ) {
                hipsMetadata.creator_did = hipsMetadata.publisher_did;
                ErrorDialog.open(
                    Constants.LEVEL.WARNING,
                    "Deprecated Hips version <b>unknown</b> for " +
                        hipsMetadata.obs_title,
                    "please update it - <i>use creator_did = pulisher_did</i>"
                );
            }
            //Error
            else {
                requiredKeywordNotFound.push(
                    key + " (" + description + ") is not present. "
                );
            }
        }
    }

    /**
     *
     * @param {boolean} valueArray - is an Array
     * @param {string} key - attribute
     * @param {HIPS_METADATA} hipsMetadata
     * @private
     */
    function _transformAStringToArray(valueArray, key, hipsMetadata) {
        if (valueArray && hipsMetadata.hasOwnProperty(key)) {
            hipsMetadata[key] = hipsMetadata[key].split(/\s+/);
        }
    }

    /**
     * Checks a value is among an enumerated list
     * @param {string} key - key to test
     * @param {string} description - key's description
     * @param distinctValue - enumeration
     * @param hipsMetadata - hipsMetadata
     * @param valueNotRight - Wrong value
     * @private
     */
    function _checkValueAmongEnumeratedList(
        key,
        valueArray,
        description,
        distinctValue,
        hipsMetadata,
        valueNotRight
    ) {
        if (distinctValue !== null && hipsMetadata.hasOwnProperty(key)) {
            if (valueArray) {
                for (var val in hipsMetadata[key]) {
                    if (hipsMetadata[key].hasOwnProperty(val)) {
                        var format = hipsMetadata[key][val];
                        if (!distinctValue.hasOwnProperty(format)) {
                            valueNotRight.push(
                                "The value \"" +
                                    hipsMetadata[key] +
                                    "\" of " +
                                    key +
                                    " (" +
                                    description +
                                    ") is not correct. "
                            );
                            break;
                        }
                    }
                }
            } else {
                if (!distinctValue.hasOwnProperty(hipsMetadata[key])) {
                    valueNotRight.push(
                        "The value \"" +
                            hipsMetadata[key] +
                            "\" of " +
                            key +
                            " (" +
                            description +
                            ") is not correct. "
                    );
                }
            }
        }
    }

    /**
     * fills hipsMetadata with the default value when the key is not present
     * @param {string} key - key
     * @param {string} defaultValue - default value
     * @param {HIPS_METADATA} hipsMetadata
     * @private
     */
    function _fillWithDefaultValue(key, defaultValue, hipsMetadata) {
        if (defaultValue !== null && !hipsMetadata.hasOwnProperty(key)) {
            hipsMetadata[key] = defaultValue;
        }
    }

    /**
     * Validates and fixes metadata
     * @param {HIPS_METADATA} hipsMetadata
     * @throws RangeError - "unvalid hips metadata"
     */
    function _validateAndFixHips(hipsMetadata) {
        var requiredKeywordNotFound = [];
        var valueNotRight = [];
        var values,
            mandatory,
            description,
            isMutiple,
            defaultValue,
            distinctValue,
            valueArray;
        for (var key in HipsVersion_1_4) {
            if (HipsVersion_1_4.hasOwnProperty(key)) {
                values = HipsVersion_1_4[key];
                mandatory = values[0];
                description = values[1];
                defaultValue = values[3];
                distinctValue = values[4];
                valueArray = values[5];

                // checking the required parameter is here
                _checkRequiredParameters.call(
                    this,
                    hipsMetadata,
                    mandatory,
                    key,
                    description,
                    requiredKeywordNotFound
                );

                // Transforms a key's value into an array when it is necessary and store the result in hipsMetadata
                _transformAStringToArray.call(
                    this,
                    valueArray,
                    key,
                    hipsMetadata
                );

                // checking the value of the parameter among a list of values
                //_checkValueAmongEnumeratedList.call(this, key, valueArray, description, distinctValue, hipsMetadata, valueNotRight);

                // checking the key is here when a default value exists
                _fillWithDefaultValue.call(
                    this,
                    key,
                    defaultValue,
                    hipsMetadata
                );
            }
        }
        if (requiredKeywordNotFound.length > 0 || valueNotRight.length > 0) {
            var name = hipsMetadata.obs_title
                ? hipsMetadata.obs_title
                : hipsMetadata.obs_collection;
            var url = hipsMetadata.hips_service_url
                ? hipsMetadata.hips_service_url
                : this.baseUrl;
            throw new RangeError(
                "unvalid hips metadata for " +
                    name +
                    " (" +
                    url +
                    "): \n" +
                    requiredKeywordNotFound.toString() +
                    "\n" +
                    valueNotRight.toString(),
                "HipsMetadata.js"
            );
        }
    }

    /**
     * Loads Hips properties
     * @param baseUrl
     * @throws ReferenceError - Unable to load the Hips
     * @return {*}
     */
    function _loadHipsProperties(baseUrl) {
        var url = baseUrl + "/properties";
        var properties = $.ajax({
            type: "GET",
            datatype : "text",
            url: Proxy.proxify(baseUrl + "/properties"),
            async: false,
            beforeSend:function(xhr) {
                xhr.setRequestHeader("Accept", "text/plain");
            }
        }).responseText;
        if (typeof properties === "undefined") {
            throw new ReferenceError(
                "Unable to load the Hips at " + baseUrl,
                "HipsMetadata.js"
            );
        }
        var hipsProperties = _parseProperties.call(this, properties);
        _validateAndFixHips.call(this, hipsProperties);
        return hipsProperties;
    }

    /**
     * Parses properties
     * @param propertiestext
     * @return {{}}
     */
    function _parseProperties(propertiestext) {
        var propertyMap = {};
        var lines = propertiestext.split(/\r?\n/);
        var currentLine = "";
        $.each(lines, function(i, value) {
            //check if it is a comment line
            if (!/^\s*(#|!|$)/.test(value)) {
                // line is whitespace or first non-whitespace character is '#' or '!'
                value = value.replace(/^\s*/, ""); // remove space at start of line
                currentLine += value;
                if (/(\\\\)*\\$/.test(currentLine)) {
                    // line ends with an odd number of '\' (backslash)
                    //line ends with continuation character, remember it and don't process further
                    currentLine = currentLine.replace(/\\$/, "");
                } else {
                    /^\s*((?:[^\s:=\\]|\\.)+)\s*[:=\s]\s*(.*)$/.test(
                        currentLine
                    ); // sub-matches pick out key and value
                    var nkey = RegExp.$1;
                    var nvalue = RegExp.$2;
                    if (propertyMap.hasOwnProperty(nkey)) {
                        propertyMap[nkey] = propertyMap[nkey].isPrototypeOf(
                            Array
                        )
                            ? propertyMap[nkey].push(nvalue)
                            : [propertyMap[nkey], nvalue];
                    } else {
                        propertyMap[nkey] = nvalue;
                    }

                    currentLine = "";
                }
            }
        });
        return propertyMap;
    }

    /**
     * @name HipsMetadata
     * @class
     * Creates the Hips data model. When baseUrl is an URL, then the Hips properties is loaded by requesting
     * the properties file.
     * When the baseURl is the Hips description coming from registry, then the description is validated and fixed if needed.
     * @param baseUrl
     * @constructor
     */
    var HipsMetadata = function(baseUrl) {
        if (baseUrl == null) {
            // nothing to do
        } else if (typeof baseUrl === "string") {
            this.baseUrl = baseUrl;
            this.hipsMetadata = _loadHipsProperties.call(this, baseUrl);
        } else {
            this.hipsMetadata = baseUrl;
            // In hips registry, each record must provide at least creator_did, hips_release_date, hips_service_url, hips_status
            try {
                _validateAndFixHips.call(this, this.hipsMetadata);
            } catch (e) {
                this.baseUrl = this.hipsMetadata.hips_service_url;
                this.hipsMetadata = _loadHipsProperties.call(
                    this,
                    this.baseUrl
                );
            }
        }
    };

    /**
     * @name setMetadata
     * @param metadata
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.setMetadata = function(metadata) {
        this.hipsMetadata = metadata;
        this.baseUrl = metadata.hips_service_url;
    };

    /**
     * Supported {@link GENERAL_WAVELENGTH wavelength}
     * @name GeneralWavelength
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.GeneralWavelength = GENERAL_WAVELENGTH;

    /**
     * Supported {@link HIPS_FRAME Hips frame}
     * @name HipsFrame
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.HipsFrame = HIPS_FRAME;

    /**
     * Supported {@link HIPS_TILE_FORMAT Hips tile format}
     * @name HipsTileFormat
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.HipsTileFormat = HIPS_TILE_FORMAT;

    /**
     * Supported {@link SAMPLING Sampling}
     * @name Sampling
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.Sampling = SAMPLING;

    /**
     * Supported {@link PIXEL_OVERLAY pixel overlay}
     * @name PixelOverlay
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.PixelOverlay = PIXEL_OVERLAY;

    /**
     * Supported {@link SKY_VAL SkyVal}
     * @name SkyVal
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.SkyVal = SKY_VAL;

    /**
     * Supported {@link DATA_PRODUCT_TYPE DataProductType}
     * @name DataProductType
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.DataProductType = DATA_PRODUCT_TYPE;

    /**
     * Supported {@link SUB_TYPE_DATA SubTypeData}
     * @name SubTypeData
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.SubTypeData = SUB_TYPE_DATA;

    /**
     * Returns the Hips metadata.
     * @function getHipsMetadata
     * @returns {HIPS_METADATA}
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.getHipsMetadata = function() {
        return this.hipsMetadata;
    };

    /**
     * Returns base URL
     * @function getBaseUrl
     * @returns {string} the URL of the Hips
     * @memberof HipsMetadata#
     */
    HipsMetadata.prototype.getBaseUrl = function() {
        return this.baseUrl;
    };

    return HipsMetadata;
});
