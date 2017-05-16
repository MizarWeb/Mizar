define([], function () {
    var PREFIX_COMMENT = '#';

    var JsCSV = function (csv, commonSeparator, headerInfo) {
        csv = checkInputFormat(csv);
        this.store = parseCSV(csv,commonSeparator,headerInfo)
    };

    function checkInputFormat(csv) {
        if (csv == null) {
            throw new Error("csv cannot be null");
        } else if (typeof csv !== "string") {
            throw new Error("This object is not supported");
        } else {
            // everything is fine
        }
        return csv;
    }

    function parseCSV(csv, commonSeparator, headerInfo) {
        var rows = csv.split("\n");
        var lineWithData = 0;
        for (var i = 0; i < rows.length && isUselessRow(rows[i],commonSeparator, headerInfo.name); i++) {
            lineWithData++
        }
        return parseRows(rows, lineWithData, commonSeparator, headerInfo);

    }

    function isUselessRow(row,commonSeparator,headerName) {
        return (row.startsWith(PREFIX_COMMENT) || row.length == 0 || headerName.toString() == row.split(commonSeparator).toString());
    }

    function parseRows(rows, lineWithData, commonSeparator, headerInfo) {
        var store = [];
        for (var i=lineWithData; i<rows.length; i++) {
            if(rows[i].length !== 0) {
                store.push(parseRow(rows[i], commonSeparator, headerInfo));
            }
        }
        return store;
    }

    function parseRow(row, commonSeparator, headerInfo) {
        var store = {};
        var tds = row.split(commonSeparator);
        for(var i=0; i<tds.length; i++) {
            store[headerInfo.name[i]] = parseDatatype(tds[i], headerInfo.datatype[i]);
        }
        return store;
    }

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

    JsCSV.prototype.getStore = function() {
        return this.store;
    };

    JsCSV.prototype.getGeoJSon = function(mapping, frame) {
      var RA = mapping.RA;
      var DEC = mapping.DEC;
      var ID = mapping.ID;
      //var CRS_NAME = mapping.CRS_NAME;
      var features = [];
      for(var i=0; i<this.store.length; i++) {

          var feature = {
              "type":"Feature",
              "id":this.store[i][ID],
              "geometry":{
                  "type":"Point",
                  "coordinates":[
                      this.store[i][RA],this.store[i][DEC]
                  ],
                  "crs":{
                      "type": "name",
                      "properties": {
                          "name": frame
                      }
                  }
              }
          };
          var newStore = JSON.parse(JSON.stringify(this.store[i]));
          delete newStore[RA];
          delete newStore[DEC];
          delete newStore[ID];
          feature["properties"] = newStore;

          features.push(feature);
      }
      var featureCollection = {
          "type": "FeatureCollection",
          "features":features
      };
      return featureCollection;
    };


    return JsCSV;

});