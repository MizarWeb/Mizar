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
define(function () {

    var Utils = {};

    /**
     * Inherits from an object
     * @author Jean-Christophe Malapert
     */
    Utils.inherits = function(base, sub)
    {
        function tempCtor() {}
        tempCtor.prototype = base.prototype;
        sub.prototype = new tempCtor();
        sub.prototype.constructor = sub;
    };


    Utils.makeHttpObject = function() {
        try {
            return new XMLHttpRequest();
        }
        catch (erreur) {
        }
        try {
            return new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (erreur) {
        }
        try {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        catch (erreur) {
        }

        throw new Error("The object creation for making HTTP requests has failed.");
    };

    Utils.guid = function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };

    Utils.findValueByKeyword = function(listKeywords, keyword) {
        var result = undefined;
        for(i=0 ; i<listKeywords.length;i++) {
            var currentKeyword = listKeywords[i];
            if (currentKeyword[0] === keyword) {
                result = currentKeyword[1];
                break;
            }
        }
        return result;
    };

    Utils.parseXML = function (val) {
        if (document.implementation && document.implementation.createDocument) {
            xmlDoc = new DOMParser().parseFromString(val, 'text/xml');
        }
        else if (window.ActiveXObject) {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.loadXML(val);
        }
        else
        {
            alert('Your browser cannot handle this script');
            return null;
        }
        return xmlDoc;
    };

    return Utils;
});