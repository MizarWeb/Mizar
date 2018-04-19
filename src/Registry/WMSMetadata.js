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
define([], function(){


    /**
     * General service metadata
     *
     * <element name="Service">
     *  <annotation>
     *      <documentation>General service metadata.</documentation>
     *  </annotation>
     *  <complexType>
     *  <sequence>
     *      <element name="Name">
     *          <simpleType>
     *              <restriction base="string">
     *                  <enumeration value="WMS"/>
     *              </restriction>
     *          </simpleType>
     *      </element>
     *      <element ref="wms:Title"/>
     *      <element ref="wms:Abstract" minOccurs="0"/>
     *      <element ref="wms:KeywordList" minOccurs="0"/>
     *      <element ref="wms:OnlineResource"/>
     *      <element ref="wms:ContactInformation" minOccurs="0"/>
     *      <element ref="wms:Fees" minOccurs="0"/>
     *      <element ref="wms:AccessConstraints" minOccurs="0"/>
     *      <element ref="wms:LayerLimit" minOccurs="0"/>
     *      <element ref="wms:MaxWidth" minOccurs="0"/>
     *      <element ref="wms:MaxHeight" minOccurs="0"/>
     *  </sequence>
     * </complexType>
     * </element>
     * @param jsonService Json representation
     * @constructor
     */
    var Service = function(jsonService) {
        this.title = WMSMetadata.getValueTag(jsonService.Title);
        this.abstract = WMSMetadata.getValueTag(jsonService.Abstract);
        this.keywordList = WMSMetadata.parseKeywordList(jsonService.KeywordList);
        this.onlineResource = WMSMetadata.getValueTag(jsonService.OnlineResource._attrhref);
        this.contactInformation = new ContactInformation(jsonService.ContactInformation);
        this.fees = WMSMetadata.getValueTag(jsonService.Fees);
        this.accessContraints = WMSMetadata.getValueTag(jsonService.AccessConstraints);
        this.layerLimit = WMSMetadata.getValueTag(jsonService.LayerLimit);
        this.maxWidth = WMSMetadata.getValueTag(jsonService.MaxWidth);
        this.maxHeight = WMSMetadata.getValueTag(jsonService.MaxHeight);
    };

    Service.prototype.getTitle = function() {
        return this.title;
    };

    Service.prototype.getAbstract = function() {
        return this.abstract;
    };

    Service.prototype.getKeywordList = function() {
        return this.keywordList;
    };

    Service.prototype.getOnlineResource = function() {
        return this.onlineResource;
    };

    Service.prototype.getContactInformation = function() {
        return this.contactInformation;
    };

    Service.prototype.getFees = function() {
        return this.fees;
    };

    Service.prototype.getAccessConstraints = function() {
        return this.accessContraints;
    };

    Service.prototype.getLayerLimit = function() {
        return this.layerLimit;
    };

    Service.prototype.getMaxWidth = function() {
        return this.maxWidth;
    };

    Service.prototype.getMaxHeight = function() {
        return this.maxHeight;
    };

    /**
     * Information about a contact person for the service.
     * <element name="ContactInformation">
     *  <annotation>
     *      <documentation>
     *              Information about a contact person for the service.
     *      </documentation>
     *  </annotation>
     *  <complexType>
     *      <sequence>
     *          <element ref="wms:ContactPersonPrimary" minOccurs="0"/>
     *          <element ref="wms:ContactPosition" minOccurs="0"/>
     *          <element ref="wms:ContactAddress" minOccurs="0"/>
     *          <element ref="wms:ContactVoiceTelephone" minOccurs="0"/>
     *          <element ref="wms:ContactFacsimileTelephone" minOccurs="0"/>
     *          <element ref="wms:ContactElectronicMailAddress" minOccurs="0"/>
     *          </sequence>
     *  </complexType>
     *  </element>
     * @param jsonContactInfo
     * @constructor
     */
    var ContactInformation = function(jsonContactInfo) {
        if(jsonContactInfo === undefined) {
            this.contactPersonPrimary = null;
            this.contactPosition = null;
            this.contactAddress = null;
            this.contactVoiceTelephone =  null;
            this.contactFacsimileTelephone = null;
            this.contactElectronicMailAddress =  null;
        } else {
            this.contactPersonPrimary = new ContactPersonPrimary(jsonContactInfo.ContactPersonPrimary);
            this.contactPosition = WMSMetadata.getValueTag(jsonContactInfo.ContactPosition);
            this.contactAddress = new ContactAddress(jsonContactInfo.ContactAddress);
            this.contactVoiceTelephone =  WMSMetadata.getValueTag(jsonContactInfo.ContactVoiceTelephone);
            this.contactFacsimileTelephone =  WMSMetadata.getValueTag(jsonContactInfo.ContactFacsimileTelephone);
            this.contactElectronicMailAddress =  WMSMetadata.getValueTag(jsonContactInfo.ContactElectronicMailAddress);
        }
    };

    ContactInformation.prototype.getContactPersonPrimary = function() {
        return this.contactPersonPrimary;
    };

    ContactInformation.prototype.getContactPosition = function() {
        return this.contactPosition;
    };

    ContactInformation.prototype.getContactAddress = function() {
        return this.contactAddress;
    };

    ContactInformation.prototype.getContactVoiceTelephone = function() {
        return this.contactVoiceTelephone;
    };

    ContactInformation.prototype.getContactFacsimileTelephone = function() {
        return this.contactFacsimileTelephone;
    };

    ContactInformation.prototype.getContactElectronicMailAddress = function() {
        return this.contactElectronicMailAddress;
    };

    /**
     * <element name="ContactPersonPrimary">
     *  <complexType>
     *      <sequence>
     *          <element ref="wms:ContactPerson"/>
     *          <element ref="wms:ContactOrganization"/>
     *      </sequence>
     *  </complexType>
     *  </element>
     * @param jsonContactPersonPrimary
     * @constructor
     */
    var ContactPersonPrimary = function(jsonContactPersonPrimary) {
        if(jsonContactPersonPrimary === undefined) {
            this.contactPerson = null;
            this.contactOrganization = null;
        } else {
            this.contactPerson = WMSMetadata.getValueTag(jsonContactPersonPrimary.ContactPerson);
            this.contactOrganization = WMSMetadata.getValueTag(jsonContactPersonPrimary.ContactOrganization);
        }
    };

    ContactPersonPrimary.prototype.getContactPerson = function() {
        return this.contactPerson;
    };

    ContactPersonPrimary.prototype.getContactOrganization = function() {
        return this.contactOrganization;
    };

    /**
     * <element name="ContactAddress">
     *  <complexType>
     *      <sequence>
     *          <element ref="wms:AddressType"/>
     *          <element ref="wms:Address"/>
     *          <element ref="wms:City"/>
     *          <element ref="wms:StateOrProvince"/>
     *          <element ref="wms:PostCode"/>
     *          <element ref="wms:Country"/>
     *      </sequence>
     *  </complexType>
     * </element>
     * @param jsonContactAddress
     * @constructor
     */
    var ContactAddress = function(jsonContactAddress) {
        if(jsonContactAddress === undefined) {
            this.addressType = null;
            this.address = null;
            this.city = null;
            this.stateOrPrincipe = null;
            this.postCode = null;
            this.country = null;
        } else {
            this.addressType = WMSMetadata.getValueTag(jsonContactAddress.AddressType);
            this.address = WMSMetadata.getValueTag(jsonContactAddress.Address);
            this.city = WMSMetadata.getValueTag(jsonContactAddress.City);
            this.stateOrPrincipe = WMSMetadata.getValueTag(jsonContactAddress.StateOrPrincipe);
            this.postCode = WMSMetadata.getValueTag(jsonContactAddress.PostCode);
            this.country = WMSMetadata.getValueTag(jsonContactAddress.Country);
        }
    };

    ContactAddress.prototype.getAdressType = function() {
        return this.addressType;
    };

    ContactAddress.prototype.getAdress = function() {
        return this.address;
    };

    ContactAddress.prototype.getCity = function() {
        return this.city;
    };

    ContactAddress.prototype.getStateOrPrincipe = function() {
        return this.stateOrPrincipe;
    };

    ContactAddress.prototype.getPostCode = function() {
        return this.postCode;
    };

    ContactAddress.prototype.getCountry = function() {
        return this.country;
    };

    /**
     * A Capability lists available request types, how exceptions may be reported, and whether any extended capabilities
     * are defined. It also includes an optional list of map layers available from this server.
     * <element name="Capability">
     *  <annotation>
     *      <documentation>
     *          A Capability lists available request types, how exceptions may be reported, and whether any extended
     *          capabilities are defined. It also includes an optional list of map layers available from this server.
     *      </documentation>
     *  </annotation>
     *  <complexType>
     *      <sequence>
     *          <element ref="wms:Request"/>
     *          <element ref="wms:Exception"/>
     *          <element ref="wms:_ExtendedCapabilities" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:Layer" minOccurs="0"/>
     *      </sequence>
     *  </complexType>
     * </element>
     * @param jsonCapability
     * @constructor
     */
    var Capability = function(jsonCapability) {
        this.request;
        this.exception;
        this.extentedCapabilities;
        this.layer = new Layer(jsonCapability.Layer);
    };

    Capability.prototype.getRequest = function() {
        return this.request;
    };

    Capability.prototype.getException = function() {
        return this.exception;
    };

    Capability.prototype.getExtentedCapabilities = function() {
        return this.extentedCapabilities;
    };

    Capability.prototype.getLayer = function() {
        return this.layer;
    };

    /**
     * Available WMS Operations are listed in a Request element.
     * <element name="Request">
     *  <annotation>
     *      <documentation>
     *          Available WMS Operations are listed in a Request element.
     *      </documentation>
     *  </annotation>
     *  <complexType>
     *      <sequence>
     *          <element ref="wms:GetCapabilities"/>
     *          <element ref="wms:GetMap"/>
     *          <element ref="wms:GetFeatureInfo" minOccurs="0"/>
     *          <element ref="wms:_ExtendedOperation" minOccurs="0" maxOccurs="unbounded"/>
     *      </sequence>
     *  </complexType>
     * </element>
     * @param jsonRequest
     * @constructor
     */
    var Request = function(jsonRequest) {
        this.getCapabilities;
        this.getMap;
        this.getFeatureInfo;
        this.extentedOperation;
    };


    /**
     * <element name="Layer">
     *  <annotation>
     *      <documentation>
     *          Nested list of zero or more map Layers offered by this server.
     *      </documentation>
     *  </annotation>
     *  <complexType>
     *      <sequence>
     *          <element ref="wms:Name" minOccurs="0"/>
     *          <element ref="wms:Title"/>
     *          <element ref="wms:Abstract" minOccurs="0"/>
     *          <element ref="wms:KeywordList" minOccurs="0"/>
     *          <element ref="wms:SRS" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:EX_GeographicBoundingBox" minOccurs="0"/>
     *          <element ref="wms:BoundingBox" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:Dimension" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:Attribution" minOccurs="0"/>
     *          <element ref="wms:AuthorityURL" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:Identifier" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:MetadataURL" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:DataURL" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:FeatureListURL" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:Style" minOccurs="0" maxOccurs="unbounded"/>
     *          <element ref="wms:MinScaleDenominator" minOccurs="0"/>
     *          <element ref="wms:MaxScaleDenominator" minOccurs="0"/>
     *          <element ref="wms:Layer" minOccurs="0" maxOccurs="unbounded"/>
     *      </sequence>
     *      <attribute name="queryable" type="boolean" default="0"/>
     *      <attribute name="cascaded" type="nonNegativeInteger"/>
     *      <attribute name="opaque" type="boolean" default="0"/>
     *      <attribute name="noSubsets" type="boolean" default="0"/>
     *      <attribute name="noSubsets" type="nonNegativeInteger"/>
     *      <attribute name="fixedHeight" type="nonNegativeInteger"/>
     *  </complexType>
     * </element>
     * @param jsonLayer
     * @constructor
     */
    var Layer = function(jsonLayer) {

        this.queryable = WMSMetadata.getValueTag(jsonLayer._attrqueryable);
        this.cascaded = WMSMetadata.getValueTag(jsonLayer._attrcascaded);
        this.opaque = WMSMetadata.getValueTag(jsonLayer._attropaque);

        this.name = WMSMetadata.getValueTag(jsonLayer.Name);
        this.title = WMSMetadata.getValueTag(jsonLayer.Title);
        this.abstract = WMSMetadata.getValueTag(jsonLayer.Abstract);
        this.keywordList = WMSMetadata.parseKeywordList(jsonLayer.KeywordList);
        this.srs = this._parseSrs(jsonLayer.SRS);
        this.geographicBoundingBox = this._parseLatLonBoundingBox(jsonLayer.LatLonBoundingBox);
        this.boundingBox = this._parseBoundingBox(jsonLayer.BoundingBox);
        this.dimension = this._parseDimension(jsonLayer.Dimension);
        this.attribution = this._parseAttribution(jsonLayer.Attribution);
        //this.authorityURL;
        //this.identifier = WMSMetadata.getValueTag(jsonLayer.Identifier);
        this.metadataURL = this._parseMetadataURL(jsonLayer.MetadataURL);
        //this.dataURL;
        //this.featureListURL;
        //this.style;
        this.minScaleDenominator = WMSMetadata.getValueTag(jsonLayer.MinScaleDenominator);
        this.maxScaleDenominator = WMSMetadata.getValueTag(jsonLayer.MaxScaleDenominator);
        this.layer = this._parseLayer(jsonLayer.Layer);
        if (this.layer.length != 0) {
            var geoBoundingBoxInSubLayer = this.layer[0].getGeoBbox(); //longMin, longMax, latMin, latMax
            if(geoBoundingBoxInSubLayer == null) {
                geoBoundingBoxInSubLayer = [-180, 180, -90, 90];
            }
            for (var i=1 ; i< this.layer.length; i++) {
                var subLayer = this.layer[i];
                var geoBox = subLayer.getGeoBbox();
                if(geoBox == null) {
                    continue;
                }
                if(geoBox[0] > geoBoundingBoxInSubLayer[0]) {
                    geoBoundingBoxInSubLayer[0] = geoBox[0];
                }
                if(geoBox[1] < geoBoundingBoxInSubLayer[1]) {
                    geoBoundingBoxInSubLayer[1] = geoBox[1];
                }
                if(geoBox[2] > geoBoundingBoxInSubLayer[2]) {
                    geoBoundingBoxInSubLayer[2] = geoBox[2];
                }
                if(geoBox[3] < geoBoundingBoxInSubLayer[3]) {
                    geoBoundingBoxInSubLayer[3] = geoBox[3];
                }
            }
            this.geographicBoundingBox = geoBoundingBoxInSubLayer;
        }

    };

    Layer.prototype._parseAuthorityURL = function(authorityJson) {
        var result = [];
        if (authorityJson !== undefined) {
            if (Array.isArray(authorityJson)) {
                for (var dim in authorityJson) {
                    result.push(WMSMetadata.getValueTag(authorityJson[dim]));
                }
            } else {
                result.push(WMSMetadata.getValueTag(authorityJson));
            }
        }
        return result;
    };

    Layer.prototype._parseMetadataURL = function(metadataJson) {
        var result = [];
        if(metadataJson !== undefined) {
            if(Array.isArray(metadataJson)) {
                for (var dim in dimJson) {
                    result.push(WMSMetadata.getValueTag(metadataJson[dim]));
                }
            } else {
                result.push(WMSMetadata.getValueTag(metadataJson));
            }
        }
        return result;
    };

    Layer.prototype._parseDimension = function(dimJson) {
        var result = [];
        if(dimJson !== undefined) {
            if(Array.isArray(dimJson)) {
                for (var dim in dimJson) {
                    result.push(WMSMetadata.getValueTag(dimJson.Dimension[dim]));
                }
            } else {
                result.push(WMSMetadata.getValueTag(dimJson));
            }
        }
        return result;
    };

    Layer.prototype._parseSrs = function(srsJson) {
        var result = [];
        if(srsJson !== undefined) {
            if(Array.isArray(srsJson)) {
                for (var srs in srsJson) {
                    result.push(WMSMetadata.getValueTag(srsJson[srs]));
                }
            } else {
                result.push(WMSMetadata.getValueTag(srsJson));
            }
        }
        return result;
    };

    Layer.prototype._parseLayer = function(jsonLayer) {
        var layers = [];
        if (jsonLayer === undefined) {

        } else if (Array.isArray(jsonLayer)) {
            for (var i=0 ; i<jsonLayer.length; i++) {
                layers.push(new Layer(jsonLayer[i]));
            }
        } else if (Array.isArray(jsonLayer.Layer)) {
            for (var i = 0; i < jsonLayer.Layer.length; i++) {
                layers.push(new Layer(jsonLayer.Layer[i]));
            }
        } else {
            layers.push(new Layer(jsonLayer))
        }
        return layers;
    };

    Layer.prototype._parseBoundingBox = function(json) {
        var bboxes = {};
        if (json === undefined) {

        } else if(Array.isArray(json)) {
            for (var i=0;i< json.length;i++) {
                var bbox = json[i];
                var srs = WMSMetadata.getValueTag(bbox._attrSRS);
                var longMin = WMSMetadata.getValueTag(bbox._attrminx);
                var longMax = WMSMetadata.getValueTag(bbox._attrmaxx);
                var latMin = WMSMetadata.getValueTag(bbox._attrminy);
                var latMax = WMSMetadata.getValueTag(bbox._attrmaxy);
                bboxes[srs] = [longMin, longMax, latMin, latMax];
            }
        } else {
            var srs = WMSMetadata.getValueTag(json._attrSRS);
            var longMin = WMSMetadata.getValueTag(json._attrminx);
            var longMax = WMSMetadata.getValueTag(json._attrmaxx);
            var latMin = WMSMetadata.getValueTag(json._attrminy);
            var latMax = WMSMetadata.getValueTag(json._attrmaxy);
            bboxes[srs] = [longMin, longMax, latMin, latMax];
        }

        return bboxes;
    };

    Layer.prototype._parseLatLonBoundingBox = function(json) {
        var result;
        if(json === undefined) {
            result = null;
        } else {
            var longMin = WMSMetadata.getValueTag(json._attrminx);
            var longMax = WMSMetadata.getValueTag(json._attrmaxx);
            var latMin = WMSMetadata.getValueTag(json._attrminy);
            var latMax = WMSMetadata.getValueTag(json._attrmaxy);
            result = [longMin, longMax, latMin, latMax];
        }
        return result;
    };

    Layer.prototype._parseAttribution = function(json) {
        var attrib = {};
        if (json === undefined) {

        } else {

            var logo;
            if(json.LogoURL) {
                logo = WMSMetadata.getValueTag(json.LogoURL.OnlineResource._attrhref);
            }

            var url;
            if(json.OnlineResource) {
                url = WMSMetadata.getValueTag(json.OnlineResource._attrhref);
            }
            var title = WMSMetadata.getValueTag(json.Title);
            attrib =  {
                "Logo":logo,
                "OnlineResource" : url,
                "Title" : title
            }
        }
        return attrib;
    };


    Layer.prototype.getName = function() {
        return this.name;
    };

    Layer.prototype.getTitle = function() {
        return this.title;
    };

    Layer.prototype.getAbstract = function() {
        return this.abstract;
    };

    Layer.prototype.getKeywordList = function() {
        return this.keywordList;
    };

    Layer.prototype.getGeoBbox = function() {
        return this.geographicBoundingBox;
    };

    Layer.prototype.getBbox = function() {
        return this.boundingBox;
    };

    Layer.prototype.getAttribution= function() {
        return this.attribution;
    };

    Layer.prototype.getLayer = function() {
        return this.layer;
    };

    Layer.prototype.getSrs = function() {
        return this.srs;
    };


    /**
     * <element name="MetadataURL">
     *   <annotation>
     *      <documentation>
     *          A Map Server may use zero or more MetadataURL elements to offer detailed, standardized metadata about the data underneath a particular layer. The type attribute indicates the standard to which the metadata complies. The format element indicates how the metadata is structured.
     *      </documentation>
     *   </annotation>
     *   <complexType>
     *      <sequence>
     *          <element ref="wms:Format"/>
     *          <element ref="wms:OnlineResource"/>
     *      </sequence>
     *      <attribute name="type" type="NMTOKEN" use="required"/>
     *   </complexType>
     * </element>
     * @param json
     * @constructor
     */
    var MetadataURL = function(json) {
        this.format = WMSMetadata.getValueTag(json.Format);
        this.onlineResource = WMSMetadata.getValueTag(json.OnlineResource);
    };

    MetadataURL.prototype.getFormat = function() {
        return this.format;
    };

    MetadataURL.prototype.getOnlineResource = function() {
        return this.onlineResource;
    };

    /**
     * <element name="Dimension">
     *   <annotation>
     *     <documentation>
     *       The Dimension element declares the existence of a dimension and indicates what values along a dimension are valid.
     *      </documentation>
     *   </annotation>
     *   <complexType>
     *      <simpleContent>
     *          <extension base="string">
     *              <attribute name="name" type="string" use="required"/>
     *              <attribute name="units" type="string" use="required"/>
     *              <attribute name="unitSymbol" type="string"/>
     *              <attribute name="default" type="string"/>
     *              <attribute name="multipleValues" type="boolean"/>
     *              <attribute name="nearestValue" type="boolean"/>
     *              <attribute name="current" type="boolean"/>
     *          </extension>
     *      </simpleContent>
     *   </complexType>
     * </element>
     * @param json
     * @constructor
     */
    var Dimension = function(json) {
        this.name = WMSMetadata.getValueTag(json.name);
        this.units = WMSMetadata.getValueTag(json.units);
        this.unitSymbol = WMSMetadata.getValueTag(json.unitSymbol);
        this.default = WMSMetadata.getValueTag(json.default);
        this.multipleValues = WMSMetadata.getValueTag(json.multiplesValues);
        this.nearestValue = WMSMetadata.getValueTag(json.nearestValue);
        this.current = WMSMetadata.getValueTag(json.current);
    };

    Dimension.prototype.getName = function() {
        return this.name;
    };

    Dimension.prototype.getUnits = function() {
        return this.units;
    };

    Dimension.prototype.getUnitSymbol = function() {
        return this.unitSymbol;
    };

    Dimension.prototype.getDefault = function() {
        return this.default;
    };

    Dimension.prototype.getMultipleValues = function() {
        return this.multipleValues;
    };

    Dimension.prototype.getNearestValue = function() {
        return this.nearestValue;
    };

    Dimension.prototype.getCurrent = function() {
        return this.current;
    };

    var WMSMetadata = function(json) {
        this.version = WMSMetadata.getValueTag(json.WMT_MS_Capabilities._attrversion);
        this.service = new Service(json.WMT_MS_Capabilities.Service);
        this.capability = new Capability(json.WMT_MS_Capabilities.Capability);

        //this.formats = this._parseFormats(json.WMT_MS_Capabilities.Capability.Request.GetMap.Format);
    };

    WMSMetadata.prototype.getVersion = function() {
        return this.version;
    };

    WMSMetadata.prototype.getService = function() {
        return this.service;
    };

    WMSMetadata.prototype.getCapability = function() {
        return this.capability;
    };

    WMSMetadata.parseDimension = function(json) {
        var result = [];
        if(json !== undefined) {
            if(Array.isArray(json.Dimension)) {
                for (var dim in json) {
                    result.push(WMSMetadata.getValueTag(json.Dimension[dim]));
                }
            } else {
                result.push(WMSMetadata.getValueTag(json.Dimension));
            }
        }
        return result;
    };

    WMSMetadata.getValueTag = function(json) {
        var result;
        if(json !== undefined) {
            result = json.hasOwnProperty("_text") ? WMSMetadata.getText(json) : WMSMetadata.getValue(json);
        }  else {
            result = null;
        }
        return result;
    };

    WMSMetadata.getText = function(keyword) {
        return keyword._text;
    };

    WMSMetadata.getValue = function(keyword) {
        return keyword._value;
    };

    WMSMetadata.parseKeywordList = function(keywordsJson) {
        var keywords = [];
        if(keywordsJson !== undefined) {
            if(Array.isArray(keywordsJson.Keyword)) {
                for (var keyword in keywordsJson.Keyword) {
                    keywords.push(WMSMetadata.getValueTag(keywordsJson.Keyword[keyword]));
                }
            } else {
                keywords.push(WMSMetadata.getValueTag(keywordsJson.Keyword));
            }
        }
        return keywords;
    };


    return WMSMetadata;
    
});