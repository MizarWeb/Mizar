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
 * Image manager
 */
define([
    "jquery",
    "../Utils/Constants",
    "../Renderer/FeatureStyle",
    "../Renderer/DynamicImage",
    "../Layer/FitsLoader",
    "fits"
], function($, Constants, FeatureStyle, DynamicImage, FitsLoader) {
    var mizarAPI;

    /**********************************************************************************************/

    /**
     *    Send XHR request for FITS file
     *    @param featureData Feature data(layer,feature)
     *    @param {string} url Url of fits file
     *    @param {Function} preprocessing function if needed
     *    @fires Mizar#image:downloaded
     */
    function computeFits(featureData, url, preprocessing) {
        // Store xhr on feature data object to cancel it if needed
        featureData.xhr = FitsLoader.loadFits(url, function(fits) {
            delete featureData.xhr;

            var fitsData = fits.getHDU().data;
            if (preprocessing) {
                preprocessing(featureData, fits);
            }

            handleFits(fitsData, featureData);
        });
        mizarAPI.publish(Constants.EVENT_MSG.IMAGE_DOWNLOADED, featureData);
    }

    /**********************************************************************************************/

    /**
     *    Send XHR request for quicklook file
     *    @param featureData Feature data(layer,feature)
     *    @param {string} url Url of quicklook file
     *    @fires Mizar#image:downloaded
     */
    function computeQuicklook(featureData, url) {
        handleQuicklook(featureData, url);
        mizarAPI.publish(Constants.EVENT_MSG.IMAGE_DOWNLOADED, featureData);
    }

    /**********************************************************************************************/

    /**
     * Handle fits data on the given feature
     * @param fitsData
     * @param featureData
     * @returns {Image} image
     */
    function handleFits(fitsData, featureData) {
        // Create new image coming from Fits
        var typedArray = new Float32Array(
            fitsData.view.buffer,
            fitsData.begin,
            fitsData.length / 4
        ); // with gl.FLOAT
        var gl = mizarAPI.getRenderContext().gl;
        var image = new DynamicImage(
            mizarAPI.getRenderContext(),
            typedArray,
            gl.LUMINANCE,
            gl.FLOAT,
            fitsData.width,
            fitsData.height
        );

        var feature = featureData.feature;
        var layer = featureData.layer;
        // Attach texture to style
        var targetStyle;
        if (feature.properties.style) {
            targetStyle = new FeatureStyle(feature.properties.style);
        } else {
            targetStyle = new FeatureStyle(layer.style);
        }
        targetStyle.fillTexture = image.texture;
        targetStyle.uniformValues = image;
        targetStyle.fill = true;
        layer.modifyFeatureStyle(feature, targetStyle);

        // Store image url for zScale processing
        if (feature.services) {
            image.url = feature.services.download.url;
        }

        return image;
    }

    /**
     * Handle quicklook data on the given feature
     * @param featureData
     * @returns {Image} image
     */
    function handleQuicklook(featureData, url) {
        var feature = featureData.feature;
        var layer = featureData.layer;

        if (layer.getType() === Constants.LAYER.OpenSearch) {
            layer.loadQuicklook(feature, url);
        }
    }

    /**********************************************************************************************/

    function parseFits(response) {
        return FitsLoader.parseFits(response);
    }

    /**********************************************************************************************/

    /**
     * Remove fits texture from feature
     * @param featureData
     */
    function removeFitsFromRenderer(featureData) {
        // Abort xhr if inprogress
        if (featureData.xhr) {
            featureData.xhr.abort();
            delete featureData.xhr;
        }

        var gl = mizarAPI.getRenderContext().gl;
        if (featureData.feature.properties.style.uniformValues) {
            featureData.feature.properties.style.uniformValues.dispose();
        }
        // TODO : style could still contain fillTextures, is it normal ?
        var texture = featureData.feature.properties.style.fillTexture;
        if (texture) {
            gl.deleteTexture(texture);
        }
        var targetStyle = new FeatureStyle(
            featureData.feature.properties.style
        );
        targetStyle.fillTexture = null;
        targetStyle.fill = false;

        // Remove rendering
        targetStyle.fillShader = {
            fragmentCode: null,
            updateUniforms: null
        };
        delete targetStyle.uniformValues;

        featureData.layer.modifyFeatureStyle(featureData.feature, targetStyle);
    }

    /**********************************************************************************************/

    return {
        /**
         * Initialize ImageManagerCore
         * @param m
         * @param configuration
         */
        init: function(m, configuration) {
            mizarAPI = m;
            // Enable float texture extension to have higher luminance range
            var ext = mizarAPI
                .getRenderContext()
                .gl.getExtension("OES_texture_float");
        },

        /**********************************************************************************************/

        /**
         * Hide image
         * @param {Feature} featureData
         */
        hideImage: function(featureData) {
            var style = new FeatureStyle(featureData.feature.properties.style);
            style.fill = false;
            featureData.layer.modifyFeatureStyle(featureData.feature, style);
        },

        /**********************************************************************************************/

        /**
         * Show image
         * @param {Feature} featureData
         */
        showImage: function(featureData) {
            // Attach texture to style
            var targetStyle = new FeatureStyle(
                featureData.feature.properties.style
            );
            targetStyle.fill = true;
            featureData.layer.modifyFeatureStyle(
                featureData.feature,
                targetStyle
            );
        },

        /**********************************************************************************************/

        /**
         * Remove image from renderer
         * @param {Feature} featureData
         * @fires Mizar#image:removed
         */
        removeImage: function(featureData) {
            // Publish event that the image of the given feature will be removed
            mizarAPI.publish(Constants.EVENT_MSG.IMAGE_REMOVED, featureData);
            if (featureData.isFits) {
                removeFitsFromRenderer(featureData);
                $("#quicklookFits").removeClass("selected");
            } else {
                if (featureData.layer.getType() === "OpenSearch") {
                    featureData.layer.removeQuicklook();
                } else {
                    var style = featureData.feature.properties.style;
                    style.fill = false;
                    style.fillTextureUrl = null;
                    featureData.layer.modifyFeatureStyle(
                        featureData.feature,
                        style
                    );
                }
                $("#quicklook").removeClass("selected");
                $("#quicklookWms").removeClass("selected");
            }
            mizarAPI.getActivatedContext().refresh();
        },

        /**********************************************************************************************/

        /**
         *    Start download of texture
         *    @param {Feature} featureData
         *    @fires Mizar#image:added
         */
        addImage: function(featureData) {
            var feature = featureData.feature;
            // Set fill to true while loading
            var style = new FeatureStyle(feature.properties.style);
            var url = null;
            style.fill = true;

            // Publish event that the image for the given feature will be loaded
            mizarAPI.publish(Constants.EVENT_MSG.IMAGE_ADDED, featureData);

            if (featureData.isFits) {
                url = feature.services.download.url;
                this.computeFits(featureData, url);
                $("#quicklookFits").addClass("selected");
            } else {
                style.fill = true;
                if (featureData.isWms) {
                    url = feature.properties.services.browse.layer.getUrl();
                } else {
                    url = feature.properties.quicklook;
                }
                this.computeQuicklook(featureData, url);
                // For DEBUG : 'upload/ADP_WFI_30DOR_RGB_V1.0_degraded.jpg';
                if (featureData.isWms) {
                    $("#quicklookWms").addClass("selected");
                } else {
                    $("#quicklook").addClass("selected");
                }
            }
            featureData.layer.modifyFeatureStyle(feature, style);
            mizarAPI.getActivatedContext().refresh();
        },

        computeFits: computeFits,
        computeQuicklook: computeQuicklook,
        handleFits: handleFits,
        handleQuicklook: handleQuicklook,
        parseFits: parseFits
    };

    /**********************************************************************************************/
});
