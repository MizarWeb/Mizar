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
 * along with MIZAR. If not, see <http:*www.gnu.org/licenses/>.
 ******************************************************************************/



define(['../Utils/Utils', '../Utils/Constants', "xmltojson", "./WMTSLayer"],
    function (Utils, Constants, XmlToJson, WMTSLayer) {

        var serviceMetadataURL;
        var serviceIdentification;
        var serviceProvider;
        var contents;
        var layers = [];
        var context;

        /**
         * General metadata for this specific server
         * @param version version
         * @constructor
         */
        var ServiceIdentification = function (version) {
            this.version = version;
            this.title = null;
            this.abstract = null;
            this.keywords = [];
            this.fees = null;
            this.accessConstraints = [];

        };

        ServiceIdentification.prototype.getVersion = function () {
            return this.version;
        };

        ServiceIdentification.prototype.getTitle = function () {
            return this.title;
        };

        ServiceIdentification.prototype.getAbstract = function () {
            return this.abstract;
        };

        ServiceIdentification.prototype.getServiceMetadataURL = function () {
            return this.serviceMetadataURL;
        };

        ServiceIdentification.prototype.getFees = function () {
            return this.fees;
        };

        ServiceIdentification.prototype.getAccessConstraints = function () {
            return this.accessConstraints;
        };


        /**
         * Metadata about the organization that provides this specific service instance or server.
         * @param name
         * @constructor
         */
        var ServiceProvider = function (name, serviceContact) {
            //if (typeof name !== "string" || typeof serviceContact !== "object") {
            //    throw new TypeError("name must be a string and serviceContact must be the serviceContact object")
            //}
            this.providerName = name;
            this.providerSite = null;
            this.serviceContact = serviceContact;
        };

        /**
         * A unique identifier for the service provider organization.
         * @returns {string}
         */
        ServiceProvider.prototype.getProviderName = function () {
            return this.providerName;
        };

        /**
         * Reference to the most relevant web site of the service provider.
         * @returns {string|null}
         */
        ServiceProvider.prototype.getProviderSite = function () {
            return this.providerSite;
        };

        /**
         * Information for contacting the service provider.
         * The OnlineResource element within this ServiceContact element should not be used to reference a web site of
         * the service provider.
         * @returns {ServiceContact}
         */
        ServiceProvider.prototype.getServiceContact = function () {
            return this.serviceContact;
        };

        /**
         * Identification of, and means of communication with, person responsible for the server.
         * @constructor
         */
        var ServiceContact = function () {
            this.individualName = null;
            this.positionName = null;
            this.contactInfo = null;
            this.role = null;
        };

        /**
         * Name of the responsible person: surname, given name, title separated by a delimiter.
         * @returns {string|null}
         */
        ServiceContact.prototype.getIndividualName = function () {
            return this.individualName;
        };

        /**
         * Role or position of the responsible person.
         * @returns {string|null}
         */
        ServiceContact.prototype.getPositionName = function () {
            return this.positionName;
        };

        /**
         * Address of the responsible party.
         * @returns {ContactInfo|null}
         */
        ServiceContact.prototype.getContactInfo = function () {
            return this.contactInfo;
        };

        /**
         * Function performed by the responsible party. Possible values of this Role shall include the values and the
         * meanings listed in Subclause B.5.5 of ISO 19115:2003.
         * @returns {string|null}
         */
        ServiceContact.prototype.getRole = function () {
            return this.role;
        };

        /**
         * Information required to enable contact with the responsible person and/or organization.
         * @constructor
         */
        var ContactInfo = function () {
            this.phone = null;
            this.address = null;
            this.onlineResource = null;
            this.hoursOfService = null;
            this.contactInstructions = null;
        };

        /**
         * Telephone numbers at which the organization or individual may be contacted.
         * @returns {Phone|null}
         */
        ContactInfo.prototype.getPhone = function () {
            return this.phone;
        };

        /**
         * Physical and email address at which the organization or individual may be contacted.
         * @returns {Address|null}
         */
        ContactInfo.prototype.getAddress = function () {
            return this.address;
        };

        /**
         * On-line information that can be used to contact the individual or organization.
         * @returns {string|null}
         */
        ContactInfo.prototype.getOnlineResource = function () {
            return this.onlineResource;
        };

        /**
         * Time period (including time zone) when individuals can contact the organization or individual.
         * @returns {string|null}
         */
        ContactInfo.prototype.getHoursOfService = function () {
            return this.hoursOfService;
        };

        /**
         * Supplemental instructions on how or when to contact the individual or organization.
         * @returns {string|null}
         */
        ContactInfo.prototype.getContactInstructions = function () {
            return this.contactInstructions;
        };

        /**
         * Location of the responsible individual or organization.
         * @constructor
         */
        var Address = function () {
            this.deliveryPoint = [];
            this.city = null;
            this.administrativeArea = null;
            this.postalCode = null;
            this.country = null;
            this.electronicMailAddress = [];
        };

        /**
         * Returns the address line for the location.
         * @returns {Array} the Address line for the location.
         */
        Address.prototype.getDeliveryPoint = function () {
            return this.deliveryPoint;
        };

        /**
         * Returns the city of the location.
         * @returns {string|null} the city of the location.
         */
        Address.prototype.getCity = function () {
            return this.city;
        };

        /**
         * Returns the state or province of the location.
         * @returns {string|null} the state or province of the location.
         */
        Address.prototype.getAdministrativeArea = function () {
            return this.administrativeArea;
        };

        /**
         * Returns the ZIP or other postal code.
         * @returns {string|null} the ZIP or other postal code
         */
        Address.prototype.getPostalCode = function () {
            return this.postalCode;
        };

        /**
         * Returns the country of the physical address.
         * @returns {string|null} the country of the physical address
         */
        Address.prototype.getCountry = function () {
            return this.country;
        };

        /**
         * Returns the address of the electronic mailbox of the responsible organization or individual.
         * @returns {Array<string>} the electronic mailbox of the responsible organization or individual
         */
        Address.prototype.getElectronicAddress = function () {
            return this.electronicMailAddress;
        };

        /**
         * Telephone numbers for contacting the responsible individual or organization.
         * @constructor
         */
        var Phone = function () {
            this.voice = null;
            this.facsimile = null;
        };

        /**
         * Telephone number by which individuals can speak to the responsible organization or individual.
         * @returns {string|null}
         */
        Phone.prototype.getVoice = function () {
            return this.voice;
        };

        /**
         * Telephone number of a facsimile machine for the responsible organization or individual.
         * @returns {string|null}
         */
        Phone.prototype.getFacsimile = function () {
            return this.facsimile;
        };

        var Contents = function() {
            this.layers = [];
            this.tileMatrixSets = [];
        };

        Contents.prototype.getLayers = function() {
            return this.layers;
        };

        Contents.prototype.getTileMatrixSets = function() {
            return this.tileMatrixSets;
        };


        var Layer = function(identifier, formats, styles, tileMatrixSetLink) {
            this.identifier = identifier;
            this.formats = formats;
            this.styles = styles;
            this.tileMatrixSetLink = tileMatrixSetLink;
            this.title = null;
            this.abstract = null;
            this.wgs84BoundingBox = null;
            this.metadata = null;
            this.resourceURL = null
        };

        Layer.prototype.getIdentifier = function() {
            return this.identifier;
        };

        Layer.prototype.getFormats = function() {
            return this.formats;
        };

        Layer.prototype.getStyles = function() {
            return this.formats;
        };

        Layer.prototype.getTileMatrixSetLink = function() {
            return this.tileMatrixSetLink;
        };

        Layer.prototype.getTitle = function() {
            return this.title;
        };

        Layer.prototype.getAbstract = function() {
            return this.abstract;
        };

        Layer.prototype.getWGS84BoundingBox = function() {
            return this.wgs84BoundingBox;
        };

        Layer.prototype.getMetadata = function() {
            return this.metadata;
        };

        Layer.prototype.getRessourceURL = function() {
            return this.resourceURL;
        };

        var TileMatrixSet = function(identifier, wellKnownScaleSet, tileMatrix) {
            this.identifier = identifier;
            this.supportedCRS = null;
            this.wellKnownScaleSet = wellKnownScaleSet;
            this.tileMatrix = tileMatrix;
        };

        TileMatrixSet.prototype.getIdentifier = function() {
            return this.identifier;
        };

        TileMatrixSet.prototype.getSupportedCRS = function() {
            return this.supportedCRS;
        };

        TileMatrixSet.prototype.getWellKnownScaleSet = function() {
            return this.wellKnownScaleSet;
        };

        TileMatrixSet.prototype.getTileMatrix = function() {
            return this.tileMatrix;
        };

        var TileMatrix = function(identifier, scaleDenominator, topLeftCorner, tileWidth, tileHeight, matrixWidth, matrixHeight) {
            this.identifier = identifier;
            this.scaleDenominator = scaleDenominator;
            this.topLeftCorner = topLeftCorner;
            this.tileWidth = tileWidth;
            this.tileHeight = tileHeight;
            this.matrixWidth = matrixWidth;
            this.matrixHeight = matrixHeight;
        };

        TileMatrix.prototype.getIdentifier = function() {
            return this.identifier;
        };

        TileMatrix.prototype.getScaleDenominator = function() {
            return this.scaleDenominator;
        };

        TileMatrix.prototype.getTopLeftCorner = function() {
            return this.topLeftCorner;
        };

        TileMatrix.prototype.getTileWidth = function() {
            return this.tileWidth;
        };

        TileMatrix.prototype.getTileHeight = function() {
            return this.tileHeight;
        };

        TileMatrix.prototype.getMatrixWidth = function() {
            return this.matrixWidth;
        };

        TileMatrix.prototype.getMatrixHeight = function() {
            return this.matrixHeight;
        };

        var _computeBaseUrlAndCapabilities = function(options) {
            if(options.getCapabilities) {
                options.baseUrl = Utils.computeBaseUrlFromCapabilities(options.getCapabilities,["service","request","version"]);
            } else if(options.baseUrl) {
                options.getCapabilities = _computeCapabilitiesFromBaseUrl.call(this, options.baseUrl, options);
            } else {
                throw new ReferenceError('No URL to access to the WMS server is defined', 'WMSLayer.js');
            }
        };

        var _computeCapabilitiesFromBaseUrl = function(baseUrl, options) {
            var getCapabilitiesUrl = baseUrl;
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "service", "WMTS");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "request", "getCapabilities");
            getCapabilitiesUrl = Utils.addParameterTo(getCapabilitiesUrl, "version", options.hasOwnProperty('version') ? options.version : '1.0.0.0');
            return getCapabilitiesUrl;
        }  ;


        var _parseGetCapabilities = function (url, options, callback, fallback) {
            Utils.requestUrl(_proxify(url, options), 'text', options, _parseResponse, callback, fallback);
        };

        var _parseServiceIdentification = function (result) {
            if (result == null) {
                return;
            }
            serviceIdentification = new ServiceIdentification(result.ServiceTypeVersion._text);
            serviceIdentification.title = (result.Title) ? result.Title._text : null;
            serviceIdentification.abstract = (result.Abstract) ? result.Abstract._text : null;
            if (result.Keywords) {
                var keywords = [];
                for (var i = 0; i < result.Keywords.Keyword.length; i++) {
                    keywords.push(result.Keywords.Keyword[i]._text);
                }
                serviceIdentification.keywords = keywords;
            }
            serviceIdentification.fees = (result.Fees) ? result.Fees._text : null;
            serviceIdentification.accessConstraints = (result.AccessConstraints) ? result.AccessConstraints._text : null;
        };

        var _parseServiceProvider = function (result) {
            if (result == null) {
                return;
            }
            var name = result.ProviderName ? result.ProviderName._text : null;
            var serviceContact = new ServiceContact();
            serviceProvider = new ServiceProvider(name, serviceContact);
            serviceProvider.providerSite = result.ProviderSite ? result.ProviderSite._text : null;
        };

        var _parseLayer = function(result) {
            if(result == null) {
                return;
            }
            var identifier = result.Identifier._text;
            var title = result.Title ? result.Title._text : null;
            var abstract = result.Abstract ? result.Abstract._text : null;
            var metadata = result.Metadata ? result.Metadata._attrhref._value : null;
            var styles = result.Style;
            var wgs84BoundingBox = result.WGS84BoundingBox ? {
                LowerCorner: result.WGS84BoundingBox.LowerCorner._text,
                UpperCorner:result.WGS84BoundingBox.UpperCorner._text
            } : null;
            var tileMatrixSetLink = result.TileMatrixSetLink.TileMatrixSet._text;
            var format = result.Format._text;
            var jsonResourceURL = result.ResourceURL;
            var resourceURL = [];
            if(Array.isArray(jsonResourceURL)) {
                for(var i=0;i<jsonResourceURL.length;i++) {
                    resourceURL.push({
                        format: jsonResourceURL[i]._attrformat._value,
                        type : jsonResourceURL[i]._attrresourceType._value,
                        template: jsonResourceURL[i]._attrtemplate._value
                    });
                }
            } else {
                resourceURL.push({
                    format: jsonResourceURL._attrformat._value,
                    type : jsonResourceURL._attrresourceType._value,
                    template: jsonResourceURL._attrtemplate._value
                });
            }
            var layer = new Layer(identifier, [format], styles, tileMatrixSetLink);
            layer.title = title;
            layer.abstract = abstract;
            layer.metadata = metadata;
            layer.wgs84BoundingBox = wgs84BoundingBox;
            layer.resourceURL = resourceURL;
            return layer;
        };

        var _parseTileMatrix = function(result) {
            if(result == null) {
                return;
            }
            var identifier = result.Identifier._text;
            var supportedCRS = result.SupportedCRS ? result.SupportedCRS._text : null;
            var wellKnownScaleSet = result.WellKnownScaleSet._text;
            var jsonTileMatrixArray = result.TileMatrix;
            var tileMatrixArray = [];
            for(var i=0 ; i<jsonTileMatrixArray.length ; i++) {
                var jsonTileMatrix = jsonTileMatrixArray[i];
                var tileMatrix = new TileMatrix(
                    jsonTileMatrix.Identifier._text,
                    jsonTileMatrix.ScaleDenominator._text,
                    jsonTileMatrix.TopLeftCorner._text,
                    jsonTileMatrix.TileWidth._text,
                    jsonTileMatrix.TileHeight._text,
                    jsonTileMatrix.MatrixWidth._text,
                    jsonTileMatrix.MatrixHeight._text
                );
                tileMatrixArray.push(tileMatrix);
            }
            return new TileMatrixSet(identifier, wellKnownScaleSet, tileMatrixArray);
        };

        var _parseContents = function(result) {
            if(result == null) {
                return;
            }
            contents = new Contents();
            var layers = result.Layer;
            for (var i=0; i<layers.length; i++) {
                var layer = layers[i];
                contents.layers.push(_parseLayer(layer));
            }
            var tileMatrixSet = result.TileMatrixSet;
            for (var i=0; i<tileMatrixSet.length; i++) {
                var tileMatrix = tileMatrixSet[i];
                contents.tileMatrixSets.push(_parseTileMatrix(tileMatrix));
            }
        };

        var _hasWGS84 = function(result) {
            var hasWGS84 = false;
            for(var i=0 ; i<result.length ;i++) {
                var matrixSet = result[i];
                if(matrixSet.getIdentifier() === "WGS84") {
                    hasWGS84 = true;
                    break;
                }
            }
            return hasWGS84;
        };

        var _parseResponse = function (response, options, callback, fallBack) {
            var myOptions = {
                mergeCDATA: true,
                xmlns: false,
                attrsAsObject: false,
                childrenAsArray: false
            };
            var result = XmlToJson.parseString(response, myOptions);
            serviceMetadataURL = (result.Capabilities.ServiceMetadataURL) ? result.Capabilities.ServiceMetadataURL._text : null;
            _parseServiceIdentification(result.Capabilities.ServiceIdentification);
            _parseServiceProvider(result.Capabilities.ServiceProvider);
            _parseContents(result.Capabilities.Contents);

            if (_hasWGS84(getContents().getTileMatrixSets())) {
                var jsonLayers = getContents().getLayers();
                for(var i=0 ; i< jsonLayers.length ; i++) {
                    var jsonLayer = jsonLayers[i];
                    if (jsonLayer.getTileMatrixSetLink() === "WGS84") {
                        var resourceURLs = jsonLayer.getRessourceURL();
                        var format;
                        var template;
                        var isFound = false;
                        for (var j=0;j<resourceURLs.length;j++) {
                            var resourceURL = resourceURLs[j];
                            if (resourceURL.type === "tile") {
                                format = resourceURL.format;
                                template = resourceURL.template;
                                isFound = true;
                                break;
                            }
                        }
                        if (isFound) {
                            options.title = jsonLayer.getTitle();
                            options.format = format;
                            options.tilematrixset = "WGS84";
                            options.baseUrl = template;
                            var myLayer = new WMTSLayer(options);
                            layers.push(myLayer);
                        } else {
                        }

                    } else {
                    }
                }
            } else {
            }
            if(callback) {
                callback(context, layers, options);
            }
        };

        var _proxify = function (url, options) {
            if (typeof url !== 'string') {
                return url;
            }
            var proxifiedUrl = url;
            var proxyDone = false;
            if ((options) && (options.proxy)) {
                if (options.proxy.use === true) {
                    proxyDone = true;
                    if (url.toLowerCase().startsWith("http") === false) {
                        proxifiedUrl = url;
                    } else if (url.startsWith(options.proxy.url)) {
                        proxifiedUrl = url; // No change, proxy always set
                    } else {
                        proxifiedUrl = options.proxy.url + encodeURIComponent(url); // Add proxy redirection
                    }
                }
            }
            //console.log("Proxy done ? "+proxyDone);
            return proxifiedUrl;
        };

        var parse = function (options, ctx, callback, fallback) {
            context = ctx;
            _computeBaseUrlAndCapabilities(options);
            _parseGetCapabilities(options.getCapabilities, options, callback, fallback);
        };

        var getServiceIdentification = function() {
            return serviceIdentification;
        };

        var getServiceProvider = function() {
            return serviceProvider;
        };

        var getContents = function() {
            return contents;
        };

        var getLayers = function() {
            return layers;
        };

        return {

            parse: parse,
            getServiceIdentification: getServiceIdentification,
            getServiceProvider : getServiceProvider,
            getContents : getContents
        };

    });