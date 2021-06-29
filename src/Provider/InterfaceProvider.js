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

/**
 * Mizar is able to load a whole file as GeoJson format for vectorial data. If the data format is not in GeoJson then a Provider must be applied.
 * <ul>
 *     <li>{@link module:Provider.ConstellationProvider ConstellationProvider}: Loads constellation data</li>
 *     <li>{@link module:Provider.CraterProvider CraterProvider} : Loads craters</li>
 *     <li>{@link module:Provider.PlanetProvider PlanetProvider} : Loads planets position on the sky</li>
 *     <li>{@link module:Provider.StarProvider StarProvider} : Loads stars name on the sky</li>
 *     <li>{@link module:Provider.TrajectoryProvider TrajectoryProvider} : Loads a file to display a trajectory</li>
 * </ul>
 * @see {@link module:Provider the provider package}
 */
/**
 * Provider is an interface that provides methods to load file, which are not supported by Mizar.
 * @interface
 */
function Provider() {}

/**
 * Loads a specific file passed from configuration
 * @param {Layer} layer
 * @param {Object} configuration
 */
Provider.prototype.loadFiles = function (layer, configuration) {};

/**
 * Process data and add them to the layer
 * @param {Layer} layer
 */
Provider.prototype.handleFeatures = function (layer) {};
