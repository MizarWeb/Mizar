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
 define(["./OpenSearchParam","./OpenSearchUtils"],
   function (OpenSearchParam,OpenSearchUtils) {

   /**
    * @name OpenSearchForm
    * @class
    * All informations describing an OpenSearch form
    * @param {Object} paramsJson a json object describing the form
    * @param {String} type form to load (application/json or application/atom+xml)
    * @memberOf module:Layer
    */
    var OpenSearchForm = function (paramsJson,type) {
      // init all values
      this.type = null;         // type of form (only application/json supported)
      this.template = null;     // url template with params
      this.parameters = [];     // list of params

      this.parseJson(paramsJson,type);
    };

    /**************************************************************************************************************/

    OpenSearchForm.prototype.parseUrl = function (urlJson,type) {
      var typeValue = OpenSearchUtils.getAttributeValue(urlJson,"type");
      if (typeValue !== type) {
        // Not the good type, do not take it into account
        return;
      }
      this.type = typeValue;
      this.template = OpenSearchUtils.getAttributeValue(urlJson,"template");
      listParameters = urlJson.Parameter;
      if (typeof listParameters.length !== 'undefined') {
        for (var i=0;i<listParameters.length;i++) {
          var param = new OpenSearchParam(listParameters[i]);
//          if (param.value.startsWith("{geo:")) {
//          } else {
            this.parameters.push(param);
//          }
        }

      } else {
        this.parameters.push(new OpenSearchParam(listParameters));
      }
    }

    OpenSearchForm.prototype.toString = function () {
      var res = "";
      res+= "  type : "+this.type+"\n";
      res+= "  template : "+this.template+"\n";
      res+= "  parameters :\n";
      for (var i=0;i<this.parameters.length;i++) {
        res+= this.parameters[i].toString()+"\n";
      }
      return res;
    }

    OpenSearchForm.prototype.parseJson = function (paramsJson,type) {
      if (typeof paramsJson.length !== 'undefined') {
        // Management of an array
        for (var i=0;i<paramsJson.length;i++) {
          this.parseUrl(paramsJson[i],type);
        }
      } else {
        this.parseUrl(paramsJson,type);
      }
    };

    /*************************************************************************************************************/

    return OpenSearchForm;

});
