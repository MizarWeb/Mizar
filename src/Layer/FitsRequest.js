/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

/*global define: false */

define(['../Utils/ImageRequest'], function (ImageRequest) {

    /**************************************************************************************************************/

    /*
     *	Override send function to handle fits requests
     */
    ImageRequest.prototype.send = function (url, crossOrigin, noRequest) {


        var self = this;
        if (noRequest || url == null) {
            self.failCallback(self);
            return;
        }
        if (url.search("fits") > 0) {
            // Fits
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function (e) {
                if (xhr && xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        if (xhr.response) {
                            self.image = xhr.response;
                            if (self.successCallback) {
                                self.successCallback(self);
                            }
                        }
                    }
                    else {
                        if (xhr.status !== 0) {
                            // Fail
                            console.error("Error while loading " + url);
                            if (self.failCallback) {
                                self.failCallback(self);
                            }
                        }
                    }
                    xhr = null;
                }
            };

            xhr.onabort = function (e) {
                if (self.abortCallback) {
                    self.abortCallback(self);
                }
                self.xhr = null;
            };

            xhr.open("GET", url);
            xhr.responseType = 'arraybuffer';
            xhr.send();
            this.xhr = xhr;
        }
        else {
            this.image = new Image();
            this.image.aborted = false;
            this.image.crossOrigin = '';
            this.image.dataType = "byte";
            this.image.onload = function () {
                var isComplete = self.image.naturalWidth !== 0 && self.image.complete;
                if (isComplete && !this.aborted) {
                    self.successCallback(self);
                }
            };
            this.image.onerror = function () {
                if (self.failCallback && !this.aborted) {
                    self.failCallback(self);
                }
            };
            this.image.src = url;
        }
    };

    /**************************************************************************************************************/

    /*
     *	Override abort
     */
    ImageRequest.prototype.abort = function () {
        if (this.xhr) {
            this.xhr.abort();
        }
        else {
            if (this.abortCallback) {
                this.abortCallback(this);
            }
            this.image.aborted = true;
            this.image.src = '';
        }
    };

    /**************************************************************************************************************/

});
