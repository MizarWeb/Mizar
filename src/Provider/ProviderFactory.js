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
import ConstellationProvider from "./ConstellationProvider";
import PlanetProvider from "./PlanetProvider";
import StarProvider from "./StarProvider";
import CraterProvider from "./CraterProvider";
import TrajectoryProvider from "./TrajectoryProvider";
import Constants from "../Utils/Constants";
export default {
  /**
   * Factory to create a provider.
   *
   * Creates a provider based on :
   * <ul>
   *     <li>the provider type {@link PROVIDER},</li>
   *     <li>the options for the specific provider</li>
   * </ul>
   *
   * Severals providers can be created :
   * <ul>
   *     <li>{@link module:Provider.ConstellationProvider ConstellationProvider}</li>
   *     <li>{@link module:Provider.CraterProvider CraterProvider}</li>
   *     <li>{@link module:Provider.PlanetProvider PlanetProvider}</li>
   *     <li>{@link module:Provider.StarProvider StarProvider}</li>
   *     <li>{@link module:Provider.TrajectoryProvider TrajectoryProvider}</li>
   * </ul>
   * @param {PROVIDER} type - Type of provider.
   * @param {Object} options - See the options for each animation for further information
   * @return {Provider} - the interface to handle an animation
   * @throws {RangeError} Type not valid - a valid type is included in the list {@link PROVIDER}
   * @alias module:Provider.ProviderFactory.create
   * @see {@link module:Provider.ConstellationProvider ConstellationProvider} Loads constellations
   * @see {@link module:Provider.CraterProvider CraterProvider} Loads Craters
   * @see {@link module:Provider.PlanetProvider PlanetProvider} Loads planets position
   * @see {@link module:Provider.TrajectoryProvider TrajectoryProvider} Loads trajectory
   *
   */

  create: function (type, options) {
    var obj;
    switch (type) {
      case Constants.PROVIDER.Constellation:
        obj = new ConstellationProvider(options);
        break;
      case Constants.PROVIDER.Crater:
        obj = new CraterProvider(options);
        break;
      case Constants.PROVIDER.Planet:
        obj = new PlanetProvider(options);
        break;
      case Constants.PROVIDER.Star:
        obj = new StarProvider(options);
        break;
      case Constants.PROVIDER.Trajectory:
        obj = new TrajectoryProvider(options);
        break;
      default:
        throw new RangeError("unable to create the provider " + type, "ProviderFactory.js");
    }
    return obj;
  }
};
