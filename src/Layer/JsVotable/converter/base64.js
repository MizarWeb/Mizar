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

define(function() {

    var TAB_DATA_SIZE = {short: 16, int: 32, float: 32, double: 64, unsignedByte: 8};

    /**
     * Creates a base64 constructor based on the description of the different data types.
     * This description is needed to decode the information encoding in base64
     *
     * A part of the methods comes from {@link http://github.com/aschaaff/votable.js}
     *
     * @param fields the description of the data types based on {@link Field}
     * @exports Base64
     * @constructor
     * @author Jean-Christophe Malapert
     */
    var Base64 = function(fields) {
        this.ptrStream = 0;
        this.bufferTabBits = [];
        this.fields = fields;
    };

    /**
     * Computes the data size in bits
     * @param datatype type of the data (e.g char, int, ...)
     * @param fieldNumber the current {@link Field}
     * @param stream the base64 stream
     * @returns {number} the number of bits
     */
    Base64.prototype.computeDataSize = function(datatype, fieldNumber, stream) {
        var dataSize = 0;
        if (datatype === 'char') {
            if (/\*/.test(this.fields[fieldNumber].arraysize())) { // if size is variable (ex: arraysize="16*")

                var tabBits = this.streamB64(32, stream);
                dataSize =  (8 * bin2uint32(tabBits));
                tabBits = [];
            } else { // fix size
                dataSize = (8 * this.fields[fieldNumber].arraysize());
            }
        } else {
            dataSize = TAB_DATA_SIZE[datatype];
        }
        return dataSize;
    };

    /**
     * Reads base 64 data, and return binary array.
     * @param datasize the number of bits of the data
     * @param stream the base 64 data
     * @returns {Array} an array of bits
     */
    Base64.prototype.streamB64 = function(datasize, stream) {
        var tabBits = [];
        var bufferLength = this.bufferTabBits.length;
        var needBit = Math.ceil((datasize - bufferLength) / 6);
        for (var i = 0; i < bufferLength; i += 1) {
            tabBits.push(this.bufferTabBits[i]);
        }
        this.bufferTabBits = []; // delete old data

        for (var i = 0; i < needBit; i += 1) {

            if (stream.charCodeAt(this.ptrStream) == 10) { // Line Feed (Fin de ligne)
                i -= 1;
            } else {
                var nb = b64ToUint6(stream.charCodeAt(this.ptrStream));

                for (var z = 32; z > 0; z >>= 1) {
                    if (tabBits.length !== datasize) {
                        tabBits.push(((nb & z) === z) ? "1" : "0");
                    } else {
                        this.bufferTabBits.push(((nb & z) === z) ? "1" : "0");
                    }
                }
            }
            this.ptrStream += 1;
        }
        return tabBits;
    };

    /**
     * Decodes a value read from the stream.
     * @param datatype the datatype
     * @param datasize the datasize in bits
     * @param fieldNumber the current {@link Field}
     * @param stream the base64 stream
     * @returns {string} a value such a string or a number
     */
    Base64.prototype.decodeValue = function(datatype, datasize, fieldNumber, stream) {
        var value;
        var tabBits = [];
        //extracts bits from the datasize
        if(datatype != 'NULL') {
            tabBits = this.streamB64(datasize, stream);
        }

        //converts the bits in human readable value
        switch (datatype) {
            case 'short':
                value = bin2short16(tabBits);
                break;
            case 'int':
                value = bin2int32(tabBits);
                break;
            case 'float':
                value = bin2float32(tabBits);
                value = value.toFixed(this.fields[fieldNumber].precision()); // round (arrondi)
                break;
            case 'double':
                value = bin2double64(tabBits);
                value = value.toFixed(this.fields[fieldNumber].precision()) // round (arrondi)
                break;
            case 'unsignedByte':
                value = bin2ubyte8(tabBits);
                break;
            case 'char':
                value = bin2string(tabBits);
                break;
            case 'NULL': // Empty Data
                value = 'NULL';
                break;
        }
        if(value === 'NaN' || value === 'NULL' || value === 0) {
            value = '';
        }
        return value;
    };

    /**
     * Decodes a stream.
     * @param stream the base64 stream
     * @returns {Array} the table value [td[],td[],..]
     */
    Base64.prototype.decode = function(stream) {
        var trs = [];
        var fieldNumber = 0;
        var tabBits = [];
        var streamLength = stream.length;
        var nbFields = this.fields.length;
        var tds = [];
        do {
            var datatype =this.fields[fieldNumber].datatype();
            var datasize = this.computeDataSize(datatype, fieldNumber,stream);
            if(datasize == 0) {
                datatype = 'NULL';
            }
            var value = this.decodeValue(datatype, datasize, fieldNumber, stream);
            tds.push(value);
            if(fieldNumber === (nbFields - 1)) {
                fieldNumber = 0;
                trs.push(tds);
                tds = [];
            } else {
                fieldNumber += 1;
            }

        } while (this.ptrStream < streamLength);
        return trs;
    };

    /***
     * Converts binary array to int 16 bits (signed).
     *
     * Example :
     * Input : array(0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1)
     * Ouput : 21 549
     *
     * @param {Array} TabBits Binary array
     * @return {int} int (16 bit)
     * @author Thomas Rolling (CDS / UTBM)
     * @licence GPL-V3
     * @see {@link http://github.com/aschaaff/votable.js} for further information
     ***/

    function bin2short16(TabBits) {
        'use strict';
        var buffer, dataview, binary;

        buffer = new ArrayBuffer(2);
        dataview = new DataView(buffer);
        binary = TabBits.join('');
        dataview.setUint16(0, parseInt(binary, 2));

        return dataview.getInt16(0);
    }

    /***
     * Converts binary array to int 32 bits (signed).
     *
     * Example :
     * Input : array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0)
     * Ouput : 1 049 834
     *
     * @param {array} TabBits Binary array
     * @return {int} int (32 bit)
     * @author Thomas Rolling (CDS / UTBM)
     * @licence GPL-V3
     * @see {@link http://github.com/aschaaff/votable.js} for further information
     ***/

    function bin2int32(TabBits) {
        'use strict';
        var buffer, dataview, binary;

        buffer = new ArrayBuffer(4);
        dataview = new DataView(buffer);
        binary = TabBits.join('');
        dataview.setUint32(0, parseInt(binary, 2));

        return dataview.getInt32(0);
    }

    /***
     * Converts binary array to float 32 bits.
     *
     * Example :
     * Input : array(0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0)
     * Ouput : 0.302
     *
     * @param {Array} TabBits Binary array
     * @return {float} float (32 bit)
     * @author Thomas Rolling (CDS / UTBM)
     * @licence GPL-V3
     * @see {@link http://github.com/aschaaff/votable.js} for further information
     ***/

    function bin2float32(TabBits) {
        'use strict';
        var buffer, dataview, binary;

        buffer = new ArrayBuffer(4);
        dataview = new DataView(buffer);
        binary = TabBits.join('');
        dataview.setUint32(0, parseInt(binary, 2));

        return dataview.getFloat32(0);
    }

    /***
     * Converts binary array to double 64 bits.
     *
     * Example :
     * Input : array(0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1)
     * Ouput : 265.083811
     *
     * @param {Array} TabBits binary array
     * @return {float} (64 bit)
     * @author Thomas Rolling (CDS / UTBM)
     * @licence GPL-V3
     * @see {@link http://github.com/aschaaff/votable.js} for further information
     ***/

    function bin2double64(TabBits) {
        'use strict';
        var buffer, dataview, lenght, binary;

        buffer = new ArrayBuffer(8);
        dataview = new DataView(buffer);

        binary = TabBits.slice(0, 32).join('');
        dataview.setUint32(0, parseInt(binary, 2));
        binary = '';

        binary =  TabBits.slice(32, 64).join('');
        dataview.setUint32(4, parseInt(binary, 2));

        return dataview.getFloat64(0);
    }

    /***
     * Converts binary array to int 8 bits (unsigned : 0 - 255).
     *
     * Example :
     * Input : array(1, 0, 0, 0, 1, 1, 0, 0)
     * Ouput : 140
     *
     * @param {Array} TabBits Binary array
     * @return {int} int (8 bit)
     * @author Thomas Rolling (CDS / UTBM)
     * @licence GPL-V3
     * @see {@link http://github.com/aschaaff/votable.js} for further information
     ***/

    function bin2ubyte8(TabBits) {
        'use strict';
        var buffer, dataview, binary;

        buffer = new ArrayBuffer(1);
        dataview = new DataView(buffer);
        binary = TabBits.join('');
        dataview.setUint8(0, parseInt(binary, 2));

        return dataview.getUint8(0);
    }

    /***
     * Converts binary array to string.
     *
     * Example :
     * Input : array(0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1)
     * Ouput : Hi!
     *
     * @param {Array} TabBits binary array
     * @return {string} string (min : 1 char)
     * @author Thomas Rolling (CDS / UTBM)
     * @licence GPL-V3
     * @see {@link http://github.com/aschaaff/votable.js} for further information
     ***/

    function bin2string(TabBits) {
        'use strict';
        var lenght, binary, i, j, str;

        lenght = ((TabBits.length) / 8);
        binary = [];
        str = '';
        j = 0;

        for(i = 0; i < lenght; i += 1) {
            binary = TabBits.slice(j, (j + 8));
            str = str.concat(String.fromCharCode(bin2ubyte8(binary)));
            binary = [];
            j += 8;
        }

        return str;
    }

    /***
     * Converts binary array to int 32 bits (unsigned).
     *
     * Example :
     * Input : array(0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0)
     * Ouput : 248 973 430
     *
     * @param {Array} TabBits a binary array
     * @return {int} 32 bit value
     * @author Thomas Rolling (CDS / UTBM)
     * @licence GPL-V3
     * @see {@link http://github.com/aschaaff/votable.js} for further information
     ***/

    function bin2uint32(TabBits) {
        'use strict';
        var buffer, dataview, binary;

        buffer = new ArrayBuffer(4);
        dataview = new DataView(buffer);
        binary = TabBits.join('');
        dataview.setUint32(0, parseInt(binary, 2));

        return dataview.getUint32(0);
    }

    /***
     * Converts Ascii code to base 64 value.
     *
     * Example :
     * Input : 104 (Ascii code of h)
     * Ouput : 33 (value of h in base 64)
     *
     * @param {int} character ASCII code
     * @return {byte} base 64 value
     * @author Thomas Rolling (CDS / UTBM)
     * @licence GPL-V3
     * @see {@link http://github.com/aschaaff/votable.js} for further information
     ***/

    function b64ToUint6(caractere) {
        var byte;

        if (caractere > 64 && caractere < 91) {  // char A-Z
            byte = caractere - 65;
        } else if (caractere > 96 && caractere < 123) { // char a-z
            byte = caractere - 71;
        } else if (caractere > 47 && caractere < 58) { // number 0-9
            byte = caractere + 4;
        } else if (caractere === 43) { // char +
            byte = 62;
        } else if (caractere === 47) { // char /
            byte = 63;
        }

        return byte;
    }

    return Base64;

});
