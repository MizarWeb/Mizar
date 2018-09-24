/*******************************************************************************
 * Copyright 2017-2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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

/**
 * Chain of responsability to process the layer description.
 * @interface
 */
function RegistryHandler() {}

/**
 * Sets the Next Server to make a list/chain of Handlers
 * @param {RegistryHandler} next Next handler
 */
RegistryHandler.prototype.setNext = function(next) {};

/**
 * This callback allows to process layers.
 * @callback serverLayerCallback
 * @param {Layer[]} list of layers
 */

/**
 * This fallback allows to process the error related to the layers.
 * @callback serverLayerFallback
 * @param {Object} error
 */

/**
 * Handle requests to process a layer description
 * @param {AbstractLayer.atmosphere_configuration|AbstractLayer.coordinateGrid_configuration|AbstractLayer.groundOverlay_configuration|AbstractLayer.hipsCat_configuration|AbstractLayer.moc_configuration|AbstractLayer.tileWireFrame_configuration|AbstractLayer.vector_configuration|AbstractRasterLayer.wms_configuration|AbstractRasterLayer.bing_configuration|AbstractLayer.geojson_configuration|AbstractHipsLayer.hipsFits_configuration|AbstractRasterLayer.osm_configuration|AbstractRasterLayer.wcsElevation_configuration|AbstractRasterLayer.wmts_configuration} layerDescription
 * @param {serverLayerCallback} callback
 * @param {serverLayerFallback} fallback
 */
RegistryHandler.prototype.handleRequest = function(
    layerDescription,
    callback,
    fallback
) {};
