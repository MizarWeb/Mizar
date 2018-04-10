define([], function() {

    var WMTSMetadata = function(json) {
        this.serviceIdentification = new ServiceIdentification(json.Capabilities.ServiceIdentification);
        this.serviceProvider = new ServiceProvider(json.Capabilities.ServiceProvider);
        this.operationsMetadata;
        this.contents = new Contents(json.Capabilities.Contents);
        this.themes;
        this.serviceMetadataURL = WMTSMetadata.getValueTag(json.Capabilities._attrhref);
    };

    var ServiceIdentification = function (json) {
        if(json === undefined) {
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
            this.accessConstraints = WMTSMetadata.parseAccessConstraints(json.AccessConstraints);
        }
    };

    var ServiceProvider = function(json) {
        if(json === undefined) {
            this.providerName = null;
            this.providerSite = null;
            this.serviceContact = null;
        } else {
            this.providerName = WMTSMetadata.getValueTag(json.ProviderName);
            this.providerSite = null;
            this.serviceContact = new ServiceContact(json.ServiceContact);
        }
    };

    var ServiceContact = function(json) {
        if(json === undefined) {
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

    var ContactInfo = function(json) {
        if(json === undefined) {
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
            this.contactInstructions = WMTSMetadata.getValueTag(json.ContactInstructions);
        }
    };

    var Phone = function(json) {
        if(json === undefined) {
            this.voice = null;
            this.facsimile = null;
        } else {
            this.voice = WMTSMetadata.parseVoice(json.Voice);
            this.facsimile = WMTSMetadata.parsePhone(json.Facsimile);
        }
    };

    var Address = function(json) {
        if(json === undefined) {
            this.deliveryPoint = null;
            this.city = null;
            this.administrativeArea = null;
            this.postalCode = null;
            this.country = null;
            this.electronicMailAddress = null;
        } else {
            this.deliveryPoint = WMTSMetadata.getValueTag(json.DeliveryPoint);
            this.city = WMTSMetadata.getValueTag(json.City);
            this.administrativeArea = WMTSMetadata.getValueTag(json.AdministrativeArea);
            this.postalCode = WMTSMetadata.getValueTag(json.PostalCode);
            this.country = WMTSMetadata.getValueTag(json.Country);
            this.electronicMailAddress = WMTSMetadata.getValueTag(json.ElectronicMailAddress);
        }
    };

    var Contents = function(json) {
        if(json === undefined) {
            this.layers = null;
            this.tileMatrixSets = null;
        } else {
            this.layers = WMTSMetadata.parseLayer(json.Layer);
            this.tileMatrixSets = new TileMatrixSet(json.TileMatrixSet);
        }
    };

    WMTSMetadata.parseLayer = function(json) {
        var layers = [];
        if(json === undefined) {

        } else if (Array.isArray(json)) {
            for(var i=0; i<json.length; i++) {
                layers.push(new Layer(json[i]));
            }
        } else {
            layers.push(new Layer(json));
        }
        return layers;
    };

    WMTSMetadata.parseTileMatrixSetLink = function(json) {
        var tileMatrixSetLink = [];
        if(json === undefined) {

        } else if (Array.isArray(json)) {
            for(var i=0; i<json.length; i++) {
                tileMatrixSetLink.push(WMTSMetadata.getValueTag(json.TileMatrixSet[i]));
            }
        } else {
            tileMatrixSetLink.push(WMTSMetadata.getValueTag(json.TileMatrixSet));
        }
        return tileMatrixSetLink;
    };

    WMTSMetadata.parseFormat = function(json) {
        var formats = [];
        if(json === undefined) {

        } else if (Array.isArray(json)) {
            for(var i=0; i<json.length; i++) {
                formats.push(WMTSMetadata.getValueTag(json.Format[i]));
            }
        } else {
            formats.push(WMTSMetadata.getValueTag(json));
        }
        return formats;
    };

    var Layer = function(json) {
        if(json === undefined) {
            this.identifier = null;
            this.format = null;
            this.style = null;
            this.tileMatrixSetLink = null;
            this.title = null;
            this.abstract = null;
            this.wgs84BoundingBox = null;
            this.metadata = null;
            this.resourceURL = null;
        } else {
            this.identifier = WMTSMetadata.getValueTag(json.Identifier);
            this.format = WMTSMetadata.parseFormat(json.Format);
            this.style;
            this.tileMatrixSetLink = WMTSMetadata.parseTileMatrixSetLink(json.TileMatrixSetLink);
            this.title = WMTSMetadata.getValueTag(json.Title);
            this.abstract = WMTSMetadata.getValueTag(json.Abstract);
            if(json.WGS84BoundingBox) {
                this.wgs84BoundingBox = {
                    "lowerCorner": WMTSMetadata.getValueTag(json.WGS84BoundingBox.LowerCorner),
                    "upperCorner": WMTSMetadata.getValueTag(json.WGS84BoundingBox.UpperCorner)
                };
            }
            this.metadata;
            this.resourceURL;
        }
    };


    var TileMatrixSet = function(json) {
        this.identifier;
        this.supportedCRS;
        this.wellKnownScaleSet;
        this.tileMatrix;
    };


    var TileMatrix = function(json) {
        this.identifier;
        this.scaleDenominator;
        this.topLeftCorner;
        this.tileWidth;
        this.tileHeight;
        this.matrixWidth;
        this.matrixHeight;
    };

    WMTSMetadata.getValueTag = function(json) {
        var result;
        if(json !== undefined) {
            result = json.hasOwnProperty("_text") ? WMTSMetadata.getText(json) : WMTSMetadata.getValue(json);
        }  else {
            result = null;
        }
        return result;
    };

    WMTSMetadata.getText = function(keyword) {
        return keyword._text;
    };

    WMTSMetadata.getValue = function(keyword) {
        return keyword._value;
    };

    WMTSMetadata.parseKeywordList = function(keywordsJson) {
        var keywords = [];
        if(keywordsJson !== undefined && keywordsJson.hasOwnProperty['Keyword']) {
            if(Array.isArray(keywordsJson.Keyword)) {
                for (var keyword in keywordsJson.Keyword) {
                    keywords.push(WMTSMetadata.getValueTag(keywordsJson.Keyword[keyword]));
                }
            } else {
                keywords.push(WMTSMetadata.getValueTag(keywordsJson.Keyword));
            }
        }
        return keywords;
    };

    WMTSMetadata.parseVoice = function(json) {
        var voices = [];
        if(json !== undefined && json.hasOwnProperty['Voice']) {
            if(Array.isArray(json.Voice)) {
                for (var voice in json.Voice) {
                    voices.push(WMTSMetadata.getValueTag(json.Voice[voice]));
                }
            } else {
                voices.push(WMTSMetadata.getValueTag(json.Voice));
            }
        }
        return voices;
    };

    WMTSMetadata.parseFacsimile = function(json) {
        var phones = [];
        if(json !== undefined && json.hasOwnProperty['Facsimile']) {
            if(Array.isArray(json.Facsimile)) {
                for (var facs in json.Facsimile) {
                    phones.push(WMTSMetadata.getValueTag(json.Facsimile[facs]));
                }
            } else {
                phones.push(WMTSMetadata.getValueTag(json.Facsimile));
            }
        }
        return phones;
    };

    WMTSMetadata.parseAccessConstraints = function(json) {
        var acccessConstraints = [];
        if(json !== undefined && json.hasOwnProperty['AccessConstraints']) {
            if(Array.isArray(json.AccessConstraints)) {
                for (var access in json.AccessConstraints) {
                    acccessConstraints.push(WMTSMetadata.getValueTag(json.AccessConstraints[access]));
                }
            } else {
                acccessConstraints.push(WMTSMetadata.getValueTag(json.AccessConstraints));
            }
        }
        return acccessConstraints;
    };    

    return WMTSMetadata;

});