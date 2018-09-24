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
define([], function() {
    /**
     * @class
     * WMTS metadata from capabilities.
     * @param {string} json
     * @constructor
     * @memberof module:Registry
     */
    var WMTSMetadata = function(json) {
        this.serviceIdentification = new ServiceIdentification(
            json.Capabilities.ServiceIdentification
        );
        this.serviceProvider = new ServiceProvider(
            json.Capabilities.ServiceProvider
        );
        //this.operationsMetadata;
        this.contents = new Contents(json.Capabilities.Contents);
        //this.themes;
        this.serviceMetadataURL = WMTSMetadata.getValueTag(
            json.Capabilities._attrhref
        );
    };

    /**
     * @class
     * Creates ServiceIdentification object.
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */
    var ServiceIdentification = function(json) {
        if (json === undefined) {
            this.version = null;
            this.title = null;
            this.abstract = null;
            this.keywords = null;
            this.serviceType = null;
            this.fees = null;
            this.accessConstraints = null;
        } else {
            this.version = WMTSMetadata.getValueTag(json._attrversion);
            this.title = WMTSMetadata.getValueTag(json.Title);
            this.abstract = WMTSMetadata.getValueTag(json.Abstract);
            this.keywords = WMTSMetadata.parseKeywordList(json.Keywords);
            this.serviceType = WMTSMetadata.getValueTag(json.ServiceType);
            this.fees = WMTSMetadata.getValueTag(json.Fees);
            this.accessConstraints = WMTSMetadata.parseAccessConstraints(
                json.AccessConstraints
            );
        }
    };

    /**
     * @class
     * Creates ServiceProvider object.
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */

    var ServiceProvider = function(json) {
        if (json === undefined) {
            this.providerName = null;
            this.providerSite = null;
            this.serviceContact = null;
        } else {
            this.providerName = WMTSMetadata.getValueTag(json.ProviderName);
            this.providerSite = null;
            this.serviceContact = new ServiceContact(json.ServiceContact);
        }
    };

    /**
     * @class
     * Creates ServiceContact object.
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */

    var ServiceContact = function(json) {
        if (json === undefined) {
            this.individualName = null;
            this.positionName = null;
            this.contactInfo = null;
            this.role = null;
        } else {
            this.individualName = WMTSMetadata.getValueTag(json.IndividualName);
            this.positionName = WMTSMetadata.getValueTag(json.PositionName);
            this.contactInfo = new ContactInfo(json.ContactInfo);
            this.role = WMTSMetadata.getValueTag(json.Role);
        }
    };

    /**
     * @class
     * Creates ContactInfo object.
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */

    var ContactInfo = function(json) {
        if (json === undefined) {
            this.phone = null;
            this.address = null;
            this.onlineResource = null;
            this.hoursOfService = null;
            this.contactInstructions = null;
        } else {
            this.phone = new Phone(json.Phone);
            this.address = new Address(json.Address);
            this.onlineResource = null;
            this.hoursOfService = WMTSMetadata.getValueTag(json.HoursOfService);
            this.contactInstructions = WMTSMetadata.getValueTag(
                json.ContactInstructions
            );
        }
    };

    /**
     * @class
     * Create Phone object
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */

    var Phone = function(json) {
        if (json === undefined) {
            this.voice = null;
            this.facsimile = null;
        } else {
            this.voice = WMTSMetadata.parseVoice(json.Voice);
            this.facsimile = WMTSMetadata.parsePhone(json.Facsimile);
        }
    };

    /**
     * @class
     * Create Address object
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */

    var Address = function(json) {
        if (json === undefined) {
            this.deliveryPoint = null;
            this.city = null;
            this.administrativeArea = null;
            this.postalCode = null;
            this.country = null;
            this.electronicMailAddress = null;
        } else {
            this.deliveryPoint = WMTSMetadata.getValueTag(json.DeliveryPoint);
            this.city = WMTSMetadata.getValueTag(json.City);
            this.administrativeArea = WMTSMetadata.getValueTag(
                json.AdministrativeArea
            );
            this.postalCode = WMTSMetadata.getValueTag(json.PostalCode);
            this.country = WMTSMetadata.getValueTag(json.Country);
            this.electronicMailAddress = WMTSMetadata.getValueTag(
                json.ElectronicMailAddress
            );
        }
    };

    /**
     * @class
     * Create Contents object
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */

    var Contents = function(json) {
        if (json === undefined) {
            this.layers = null;
            this.tileMatrixSets = null;
        } else {
            this.layers = WMTSMetadata.parseLayer(json.Layer);
            this.tileMatrixSets = new TileMatrixSet(json.TileMatrixSet);
        }
    };

    /**
     * @class
     * Create Layer object
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */
    var Layer = function(json) {
        if (json === undefined) {
            this.identifier = null;
            this.format = null;
            this.infoFormat = null;
            this.style = null;
            this.tileMatrixSetLink = null;
            this.title = null;
            this.abstract = null;
            this.wgs84BoundingBox = null;
            this.boundingBox = null;
            this.keywords = null;
            this.metadata = null;
            this.datasetDescriptionSummary = null;
            this.otherSource = null;
            this.dimension = null;
            this.resourceURL = null;
        } else {
            this.identifier = WMTSMetadata.getValueTag(json.Identifier);
            this.format = WMTSMetadata.parseFormat(json.Format);
            this.infoFormat = null;
            this.style = null;
            this.tileMatrixSetLink = WMTSMetadata.parseTileMatrixSetLink(
                json.TileMatrixSetLink
            );
            this.title = WMTSMetadata.getValueTag(json.Title);
            this.abstract = WMTSMetadata.getValueTag(json.Abstract);
            this.wgs84BoundingBox = WMTSMetadata.parseWGS84BoundingBox(
                json.WGS84BoundingBox
            );
            this.boundingBox = WMTSMetadata.parseBoundingBox(json.BoundingBox);
            this.keywords = WMTSMetadata.parseKeywordList(json.Keywords);
            this.metadata = null;
            this.datasetDescriptionSummary = null;
            this.otherSource = null;
            this.dimension = null;
            this.resourceURL = null;
        }
    };

    /**
     * @class
     * Create TileMatrixSet object
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */

    var TileMatrixSet = function(json) {
        this.identifier = null;
        this.supportedCRS = null;
        this.wellKnownScaleSet = null;
        this.tileMatrix = null;
    };

    /**
     * @class
     * Create TileMatrix object
     * @param {string} json
     * @constructor
     * @memberof WMTSMetadata#
     */

    var TileMatrix = function(json) {
        this.identifier = null;
        this.scaleDenominator = null;
        this.topLeftCorner = null;
        this.tileWidth = null;
        this.tileHeight = null;
        this.matrixWidth = null;
        this.matrixHeight = null;
    };

    /**
     * Parses layer element
     * @param {string} json
     * @returns {Layer[]} Returns Array of Layer object
     * @function parseLayer
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.parseLayer = function(json) {
        var layers = [];
        if (json === undefined) {
            // do nothing
        } else if (Array.isArray(json)) {
            for (var i = 0; i < json.length; i++) {
                layers.push(new Layer(json[i]));
            }
        } else {
            layers.push(new Layer(json));
        }
        return layers;
    };

    /**
     * Parses TileMatrixSetLink element
     * @param {string} json
     * @returns {string[]} Returns array of parseTileMatrixSetLink value.
     * @function parseTileMatrixSetLink
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.parseTileMatrixSetLink = function(json) {
        var tileMatrixSetLink = [];
        if (json === undefined) {
            // do nothing
        } else if (Array.isArray(json)) {
            for (var i = 0; i < json.length; i++) {
                tileMatrixSetLink.push(
                    WMTSMetadata.getValueTag(json.TileMatrixSet[i])
                );
            }
        } else {
            tileMatrixSetLink.push(
                WMTSMetadata.getValueTag(json.TileMatrixSet)
            );
        }
        return tileMatrixSetLink;
    };

    /**
     * Parses Format element
     * @param {string} json
     * @returns {string[]} Array of format.
     * @function parseFormat
     * @memberof WMTSMetadata#
     * @private
     */
    WMTSMetadata.parseFormat = function(json) {
        var formats = [];
        if (json === undefined) {
            // do nothing
        } else if (Array.isArray(json)) {
            for (var i = 0; i < json.length; i++) {
                formats.push(WMTSMetadata.getValueTag(json.Format[i]));
            }
        } else {
            formats.push(WMTSMetadata.getValueTag(json));
        }
        return formats;
    };

    /**
     * Get Value
     * @param {string} json
     * @returns {string} Returns the value
     * @function getValueTag
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.getValueTag = function(json) {
        var result;
        if (json !== undefined) {
            result = json.hasOwnProperty("_text")
                ? WMTSMetadata.getText(json)
                : WMTSMetadata.getValue(json);
        } else {
            result = null;
        }
        return result;
    };

    /**
     * Get Text
     * @param {string} json
     * @return {string} Returns the text
     * @function getText
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.getText = function(keyword) {
        return keyword._text;
    };

    /**
     * Get Value
     * @param {string} json
     * @returns {string} Returns the value
     * @function getValue
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.getValue = function(keyword) {
        return keyword._value;
    };

    /**
     * Parses keyword list
     * @param {string} json
     * @returns {string[]} Returns the array of keyword.
     * @function parseKeywordList
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.parseKeywordList = function(keywordsJson) {
        var keywords = [];
        if (
            keywordsJson !== undefined &&
            keywordsJson.hasOwnProperty("Keyword")
        ) {
            if (Array.isArray(keywordsJson.Keyword)) {
                for (var keyword in keywordsJson.Keyword) {
                    keywords.push(
                        WMTSMetadata.getValueTag(keywordsJson.Keyword[keyword])
                    );
                }
            } else {
                keywords.push(WMTSMetadata.getValueTag(keywordsJson.Keyword));
            }
        }
        return keywords;
    };

    /**
     * Parses Voice
     * @param {string} json
     * @returns {string[]} Returns the array of voice
     * @function parseVoice
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.parseVoice = function(json) {
        var voices = [];
        if (json !== undefined && json.hasOwnProperty("Voice")) {
            if (Array.isArray(json.Voice)) {
                for (var voice in json.Voice) {
                    voices.push(WMTSMetadata.getValueTag(json.Voice[voice]));
                }
            } else {
                voices.push(WMTSMetadata.getValueTag(json.Voice));
            }
        }
        return voices;
    };

    /**
     * Parses Fac simile element
     * @param {string} json
     * @returns {string[]} Returns the array of Facsimile
     * @function parseFacsimile
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.parseFacsimile = function(json) {
        var phones = [];
        if (json !== undefined && json.hasOwnProperty("Facsimile")) {
            if (Array.isArray(json.Facsimile)) {
                for (var facs in json.Facsimile) {
                    phones.push(WMTSMetadata.getValueTag(json.Facsimile[facs]));
                }
            } else {
                phones.push(WMTSMetadata.getValueTag(json.Facsimile));
            }
        }
        return phones;
    };

    /**
     * Parses AccessConstraints element
     * @param {string} json
     * @return {string[]} Returns the array of AccessConstraints
     * @function parseAccessConstraints
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.parseAccessConstraints = function(json) {
        var acccessConstraints = [];
        if (json !== undefined && json.hasOwnProperty("AccessConstraints")) {
            if (Array.isArray(json.AccessConstraints)) {
                for (var access in json.AccessConstraints) {
                    acccessConstraints.push(
                        WMTSMetadata.getValueTag(json.AccessConstraints[access])
                    );
                }
            } else {
                acccessConstraints.push(
                    WMTSMetadata.getValueTag(json.AccessConstraints)
                );
            }
        }
        return acccessConstraints;
    };

    /**
     * Parses WGS84BoundingBox element
     * @param {string} json
     * @returns {string[]} Returns the WGS84 bounding box
     * @function parseWGS84BoundingBox
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.parseWGS84BoundingBox = function(wgs84BoundingBoxJson) {
        var wgs84BoundingBox = [];
        if (wgs84BoundingBoxJson !== undefined) {
            if (Array.isArray(wgs84BoundingBoxJson)) {
                for (var wgs84 in wgs84BoundingBoxJson) {
                    wgs84BoundingBox.push({
                        lowerCorner: WMTSMetadata.getValueTag(
                            wgs84.LowerCorner
                        ),
                        upperCorner: WMTSMetadata.getValueTag(wgs84.UpperCorner)
                    });
                }
            } else {
                wgs84BoundingBox.push({
                    lowerCorner: WMTSMetadata.getValueTag(
                        wgs84BoundingBoxJson.LowerCorner
                    ),
                    upperCorner: WMTSMetadata.getValueTag(
                        wgs84BoundingBoxJson.UpperCorner
                    )
                });
            }
        }
        return wgs84BoundingBox;
    };

    /**
     * Parses BoundingBox element
     * @param {string} json
     * @return {string[]} Returns the bounding box
     * @function parseBoundingBox
     * @memberof WMTSMetadata#
     * @private
     */

    WMTSMetadata.parseBoundingBox = function(BoundingBoxJson) {
        //TODO crs dimensions
        var boundingBox = [];
        if (BoundingBoxJson !== undefined) {
            if (Array.isArray(BoundingBoxJson)) {
                for (var bbox in BoundingBoxJson) {
                    boundingBox.push({
                        lowerCorner: WMTSMetadata.getValueTag(bbox.LowerCorner),
                        upperCorner: WMTSMetadata.getValueTag(bbox.UpperCorner)
                    });
                }
            } else {
                boundingBox.push({
                    lowerCorner: WMTSMetadata.getValueTag(
                        BoundingBoxJson.LowerCorner
                    ),
                    upperCorner: WMTSMetadata.getValueTag(
                        BoundingBoxJson.UpperCorner
                    )
                });
            }
        }
        return boundingBox;
    };

    return WMTSMetadata;
});
