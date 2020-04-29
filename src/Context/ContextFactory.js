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
 * @name ContextFactory
 * @class
 * Factory to create a context
 * @memberof module:Context
 */
import Constants from "../Utils/Constants";
import PlanetContext from "./PlanetContext";
import SkyContext from "./SkyContext";
import GroundContext from "./GroundContext";
export default {
  /**
   * Factory to create a context.
   *
   * Creates a context based on :
   * <ul>
   *     <li>the context type {@link CONTEXT},</li>
   *     <li>the global Mizar's configuration,</li>
   *     <li>the options for the specific context</li>
   * </ul>
   * @param {CONTEXT} type - Type of animation.
   * @param {Object} configuration - see options.configuration for {@link Mizar}
   * @param {Object} options - See options.planetContext or options.skyContext configuration for {@link Mizar}
   * @return {Context} - the object to handle an animation
   * @throws {RangeError} Type not valid - a valid type is included in the list {@link CONTEXT}
   * @alias module:Context.ContextFactory.create
   *
   */
  create: function (type, configuration, options) {
    var obj;
    switch (type) {
      case Constants.CONTEXT.Planet:
        obj = new PlanetContext(configuration, options);
        break;
      case Constants.CONTEXT.Sky:
        obj = new SkyContext(configuration, options);
        break;
      case Constants.CONTEXT.Ground:
        obj = new GroundContext(configuration, options);
        break;
      default:
        throw new RangeError(
          "The type " + type + " is not allowed, A valid type is included in the list Constants.CONTEXT",
          "ContextFactory.js"
        );
    }
    return obj;
  }
};
