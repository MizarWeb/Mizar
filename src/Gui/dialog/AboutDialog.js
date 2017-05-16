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
 * along with SITools2. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/*global define: false */

/**
 * About dialog
 */
define(["jquery", "jquery.ui"], function ($) {

    /*jshint multistr: true */
    var aboutContent =
        '<div id="about" title="About">\
            <p>MIZAR has been developed and is maintained by the CENTRE NATIONAL d\'ETUDES SPATIALES (CNES).</p>\
            <p>Copyright CNES - MIZAR is a module of <a target="_blank" href="http://sitools2.sourceforge.net">SITools2</a>, distributed under GPLV3</p>\
            <p>MIZAR is based on <a target="_blank" href="https://github.com/TPZF/GlobWeb">GlobWeb</a> for rendering, developed by TPZF SSA.</p>\
            <p>Portions of the code related to Healpix and coordinates system transformation have been traduced in JavaScript from Healpix library <a target="_blank" href="http://sourceforge.net/projects/healpix/">Healpix library</a>.</p>\
            <p>The <a target="_blanc" href="http://astrojs.github.io/fitsjs/">FITS library</a> has been used to load FITS file.</p>\
            <p>The <a target="_blanc" href="http://astrojs.github.io/sampjs/">SAMP library</a> has been used for using the SAMP Web Profile from within web pages.</p>\
            <p>The <a target="_blanc" href="http://astrojs.github.io/wcsjs/">WCS library</a> has been used to localize recieved fits files on sky.</p>\
            <p>The <a target="_blanc" href="https://github.com/beatgammit/gzip-js">GZip library</a> has been used to decompress, g-zipped fits files.</p>\
            <p>ColorMap have been traduced in JavaScript from <a target="_blanc" href="http://aladin.u-strasbg.fr/aladin.gml">Aladin Sky Atlas</a>.</p>\
            <div>\
                <input id="showAbout" type="checkbox" />\n\
                <label style="font-size: 0.8em;top: -3px;position: relative;" for="showAbout">Don\'t show this message again</label>\
            </div>\
            <span style="font-size: 0.8em;bottom: 5px;right: 5px;position: absolute;">v1.0 - 26.11.2013 - nightly build</span>\
        </div>';

    var $about = null;

    return {
        /**
         *    Show about dialog
         */
        show: function () {
            if (!$about) {
                // Create dialog
                $about = $(aboutContent)
                    .appendTo('body')
                    .dialog({
                        autoOpen: false,
                        resizable: false,
                        show: {
                            effect: "fade",
                            duration: 1000
                        },
                        hide: {
                            effect: "fade",
                            duration: 1000
                        },
                        width: '500px',
                        minHeight: 'auto',
                        draggable: false,
                        open: function () {
                            // Remove auto-focus
                            $(this).find('a:first-child').blur();
                        },
                        close: function () {
                            if ($('#showAbout').is(':checked')) {
                                // Don't show about for later sessions
                                localStorage.showAbout = false;
                            }
                            $(this).remove();
                        }
                    });
                $about.dialog("open");
            }
        }
    };

});
