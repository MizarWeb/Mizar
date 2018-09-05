/*******************************************************************************
 * Copyright 2017, 2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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
/*global define: false */

/**
 *    ImageProcessing module
 */
define(["jquery", "../Renderer/FeatureStyle", "jquery.ui"], function(
    $,
    FeatureStyle
) {
    /**************************************************************************************************************/

    var feature;
    var layer;
    var disable;
    var unselect;
    var $dialog;
    var histogramElement;
    var cutOutElement;

    /**************************************************************************************************************/

    /**
     *    Toggle visibility of dialog
     */
    function toggle() {
        if ($dialog.dialog("isOpen")) {
            $dialog.dialog("close");
        } else {
            $dialog.dialog("open");
        }
    }

    /**************************************************************************************************************/

    /**
     *    Remove view
     */
    function remove() {
        if (unselect) {
            unselect();
        }

        if (disable) {
            disable();
        }

        if (histogramElement) {
            histogramElement.remove();
        }

        $dialog.remove();
    }

    /**************************************************************************************************************/

    /**
     *    Set data to process
     *
     *    @param selectedData Object containing feature and layer extracted by <PickingManager>
     */
    function setData(selectedData) {
        if (
            feature &&
            feature.properties.identifier ===
                selectedData.feature.properties.identifier
        ) {
            this.toggle();
        } else {
            if (!$dialog.dialog("isOpen")) {
                this.toggle();
            }
        }

        feature = selectedData.feature;
        layer = selectedData.layer;

        if (selectedData.feature.services) {
            cutOutElement.setUrl(selectedData.feature.services.download.url);
        } /** else {
                // TODO : disable cutOutElement if feature's url isn't defined
            }*/

        var image = selectedData.feature.properties.style.uniformValues;
        if (!image) {
            $dialog
                .find(".histogramContent")
                .children("div")
                .fadeOut(function() {
                    $(this)
                        .siblings("p")
                        .fadeIn();
                });
        } else {
            this.setImage(image);
        }
    }

    /**************************************************************************************************************/

    /**
     * Remove passed feature
     *
     * @param {Feature} data
     */
    function removeData(data) {
        if (
            feature &&
            data.feature.properties.identifier === feature.properties.identifier
        ) {
            if (this.isOpened()) {
                this.toggle();
            }
            $dialog
                .find(".histogramContent")
                .children("div")
                .fadeOut(function() {
                    $(this)
                        .siblings("p")
                        .fadeIn();
                });
            feature = null;
            layer = null;
        }
    }

    /**************************************************************************************************************/

    /**
     * Set image on the Histogram element
     *
     * @param image
     */
    function setImage(image) {
        histogramElement.setImage(image);
        if (image.url) {
            cutOutElement.setUrl(image.url);
        }

        $dialog
            .find(".histogramContent")
            .children("p")
            .fadeOut(function() {
                $(this)
                    .siblings("div")
                    .fadeIn();
            });
    }

    /**************************************************************************************************************/

    /**
     * Change shader callback
     *
     * @param contrast
     */
    function changeShaderCallback(contrast) {
        var targetStyle;
        if (contrast === "raw") {
            targetStyle = new FeatureStyle(feature.properties.style);
            targetStyle.fillShader = {
                fragmentCode: null,
                updateUniforms: null
            };
            layer.modifyFeatureStyle(feature, targetStyle);
        } else {
            targetStyle = new FeatureStyle(feature.properties.style);
            targetStyle.fillShader = {
                fragmentCode: this.image.fragmentCode,
                updateUniforms: this.image.updateUniforms
            };
            layer.modifyFeatureStyle(feature, targetStyle);
        }
    }

    /**************************************************************************************************************/

    /**
     * Check if ImageProcessing is opened
     */
    function isOpened() {
        return $dialog.dialog("isOpen");
    }

    /**************************************************************************************************************/

    return {
        /**
         *    Init ImageProcessingCore
         *
         *    @param options
         *        <ul>
         *            <li>feature: The feature to process
         *            <li>layer: The layer to which the feature belongs to
         *            <li>disable: Disable callback</li>
         *            <li>unselect: Unselect callback</li>
         *        </ul>
         *    @param {HTMLElement} $dl dialogElement
         *    @param {HTMLElement} $histoElmt histogramElement
         *    @param {HTMLElement} $cutOutElmt cutOutElement
         *
         */
        init: function(options, $dl, histoElmt, cutOutElmt) {
            if (options) {
                //this.id = options.id;
                feature = options.feature || null;
                layer = options.layer || null;

                // Callbacks
                disable = options.disable || null;
                unselect = options.unselect || null;
            }

            $dialog = $dl;
            histogramElement = histoElmt;
            cutOutElement = cutOutElmt;
        },

        setData: setData,
        setImage: setImage,
        toggle: toggle
    };
});
