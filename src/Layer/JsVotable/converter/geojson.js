/*******************************************************************************
 * Copyright 2016 - Jean-Christophe Malapert
 *
 * This file is part of JsVotable.
 *
 * JsVotable is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * JsVotable is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JVotable.  If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
define(["../utils"], function (Utils) {

    var UCD_ID = ["meta.record","meta.id;meta.main","VOX:Image_Titleq"];
    var UCD_RA = ["pos.eq.ra;meta.main","POS_EQ_RA_MAIN"];
    var UCD_DEC = ["pos.eq.dec;meta.main","POS_EQ_DEC_MAIN"];

    /**
     * Contructs a GeoJSON.
     * @param votable Votable format
     * @exports GeoJson
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var GeoJson = function(votable) {
        this.votable = votable;
        this.featureCollection = process(this.votable);
    };

    /**
     * Retrieves a GeoJson.
     * @param {Boolean} option sets to true to get a pretty output of the GeoJSON. By default, option is set to false
     * @returns {String} the GeoJson output of the VOTable
     */
    GeoJson.prototype.getGeoJSon = function(option) {
        var pretty = option | false;
        return JSON.stringify(this.featureCollection, null, pretty);
    };

    /**
     * Process the transformation of the Votable into GeoJson.
     * @param {Votable} votable the votable
     * @return {{type: string, features: Array}} The GeoJson as hash
     */
    function process(votable) {
        var featureCollection = {
            "type":"FeatureCollection",
            "features":[]
        };
        var coosys = findAndGetGlobalCoosys(votable);
        if(coosys != null) {
            featureCollection["crs"] = {
                    "type": "name",
                    "properties": {
                        "name": coosys
                    }
            };
        }
        var features = [];
        var resources = votable.getResources();
        for(var i=0; i<resources.length;i++) {
            processResource(resources[i], features);
        }
        featureCollection["features"] = features;

        /**
         * Finds and get the Coosys if this one is set global to the Votable.
         * @param {Votable} votable the Votable
         * @return {Coosys} The coordinate system
         */
        function findAndGetGlobalCoosys(votable) {
            var coosys;
            var defs = votable.getDefinitions();
            if (defs != null) {
                coosys = defs.getCoosyss()[0];
            }
            if(votable.getCoosyss()[0] != null) {
                coosys = votable.getCoosyss()[0];
            }
            return coosys;
        }

        return featureCollection;
    }

    /**
     * Process a resource.
     * @param {Resource} resource the resource to process
     * @param features the features to fill
     */
    function processResource(resource, features) {
        var resourcesOrTables = resource.getResourcesOrTables();
        for (var i=0;i<resourcesOrTables.length;i++) {
            var resourceOrTable = resourcesOrTables[i];
            if (resourceOrTable.hasOwnProperty("RESOURCE")) {
                processResource(resourceOrTable["RESOURCE"], features);
            } else if (resourceOrTable.hasOwnProperty("TABLE")) {
                processTable(resourceOrTable["TABLE"], features);
            }
        }
    }

    /**
     * Process a table.
     * @param {Table} table the table to process
     * @param features the features to fill
     */
    function processTable(table, features) {
        var fields = table.getFields();
        var data = table.getData();
        var trs;
        var infos = table.getInfos();
        switch (data.getDataImplementationName()) {
            case "TableData":
                var tableData = data.getData();
                trs = tableData.getTrs();
                break;
            case "Binary":
                var binary = data.getData();
                var tableData = binary.getStream().getContent(true, fields);
                trs = tableData.getTrs();
                break;
            case "Binary2":
                var binary2 = data.getData();
                throw new Error("Binary2 not implemented");
                break;
            case "Fits":
                var fits = data.getData();
                throw new Error("Fits not implemented");
                break;
            default:
                throw new Error("Type of data not implemented");
        }
        creatureFeatures(fields, infos, trs, features);
    }

    /**
     * Creates the features.
     * @param {Field[]} fields the fields
     * @param {Info[]} infos the infos
     * @param {Tr[]} trs the rows
     * @param features the features to fill
     */
    function creatureFeatures(fields, infos, trs, features) {
        for (var i=0 ; i<trs.length; i++) {
            var tds = trs[i].getTds();
            features.push(createFeature(fields, infos, tds));
        }
    }

    /**
     * Creates a feature.
     * The infos are set in the GeoJSon properties.
     * @param {Field[]} fields the fields
     * @param {Info[]] infos the infos
     * @param {Td[]} tds the values
     * @return {{type: string, geometry: null, properties: {}}}
     */
    function createFeature(fields, infos, tds) {
        var feature = {
            "type":"Feature",
            "geometry":null,
            "properties":{}
        };
        var coreMetadata = {};
        for (var i=0;i<tds.length;i++) {
            var td = tds[i];
            var field = fields[i];
            var values = field.getValues();
            var nullValue = (values != null) ? values.null() : null;
            var ucd = field.ucd();
            var datatype = field.datatype();
            var value = td.getContent();
            var name = field.name();
            if (filter(UCD_RA,ucd)) {
                coreMetadata["RA"] = Number.parseFloat(value);
                coreMetadata["COOSYS"] = field.ref();
            } else if(filter(UCD_DEC,ucd)) {
                coreMetadata["DEC"] = Number.parseFloat(value);
            } else if(filter(UCD_ID,ucd)) {
                coreMetadata["ID"] = value;
            } else {
                var properties = feature.properties;
                if(value != nullValue) {
                    properties[name] = parseDatatype(value, datatype);
                }
            }
        }
        if(!coreMetadata.hasOwnProperty("ID")) {
            coreMetadata["ID"] = Utils.guid();
        }
        for(var i=0 ;i<infos.length; i++) {
            var info = infos[i];
            properties[info.name()] = info.value();
        }
        checkCoreMetadata(coreMetadata);
        var geometry = {
            "type":"Point",
            "coordinates":[coreMetadata.RA, coreMetadata.DEC],
            "crs":{
                "type": "name",
                "properties": {
                    "name": coreMetadata.COOSYS
                }
            }
        };
        feature["geometry"] = geometry;

        /**
         * Checks if the core metadata is filled.
         * @param coreMetadata
         */
        function checkCoreMetadata(coreMetadata) {
            if (!(coreMetadata.hasOwnProperty("RA") && coreMetadata.hasOwnProperty("DEC")
            && coreMetadata.hasOwnProperty("COOSYS") && coreMetadata.hasOwnProperty("ID"))) {
                throw new Error("core metadata missing "+JSON.stringify(coreMetadata));
            }
        }

        /**
         * Parses along the datatype (number or string).
         * @param value
         * @param type
         * @return {*}
         */
        function parseDatatype(value, type) {
            var result;
            switch (type) {
                case "short":
                case "int":
                case "long":
                    result = Number.parseInt(value);
                    break;
                case "float":
                case "double":
                    result = Number.parseFloat(value);
                    break;
                default:
                    result = value;
            }
            return result;
        }

        /**
         * Search a criteria in an array.
         * @param arr array
         * @param criteria criteria
         * @return {boolean} True when the criteria is found
         */
        function filter(arr, criteria) {
            var result= arr.filter(function(obj) {
                return (obj === criteria);
            });
            return (result.length == 0) ? false : true;
        }

        return feature;

    }

    return GeoJson;

});