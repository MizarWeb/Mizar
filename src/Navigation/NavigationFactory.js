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
 * @name NavigationFactory
 * @class
 * Factory to control the camera.
 * @memberof module:Navigation
 */
import PlanetNavigation from "./PlanetNavigation";
import AstroNavigation from "./AstroNavigation";
import FlatNavigation from "./FlatNavigation";
import GroundNavigation from "./GroundNavigation";
import Constants from "../Utils/Constants";
export default {
  /**
   * Mizar owns different types of navigation to control the camera on the WebGL scene.
   * This class allows to create a navigation based on its type (e.g Astro, Flat, Sky).
   * <table border="1">
   *     <tr>
   *         <td><img src="../doc/images/nav_astro.png" width="200px"/></td>
   *         <td>{@link module:Navigation.AstroNavigation AstroNavigation}</td>
   *         <td>Provides a camera located at the center of the scene. The camera is inside the globe.
   *         It is used to view the sky</td>
   *     </tr>
   *     <tr>
   *         <td><img src="../doc/images/nav_planet.png" width="200px"/></td>
   *         <td>{@link module:Navigation.PlanetNavigation PlanetNavigation}</td>
   *         <td>Provides a camera, located outside the globe and looking at the globe. It is used to view a planet</td>
   *     </tr>
   *     <tr>
   *         <td><img src="../doc/images/nav_flat.png" width="200px"/></td>
   *         <td>{@link module:Navigation.FlatNavigation FlatNavigation}</td>
   *         <td>Provides a camera to navigate on a 2D map - Only available in a Planet context</td>
   *     </tr>
   * </table>
   * @param {NAVIGATION} type - the type of navigation
   * @param {AbstractContext} ctx - The context where the camera look at
   * @param {AbstractNavigation.astro_configuration|AbstractNavigation.planet_configuration|AbstractNavigation.flat_configuration} options - see the navigations.
   * @return {Navigation} navigation
   * @alias module:Navigation.NavigationFactory.create
   * @see {@link module:Navigation.PlanetNavigation PlanetNavigation} - Control the camera and turn around the globe, wich is located
   * at the center of the webGL scene.
   * @see {@link module:Navigation.AstroNavigation AstroNavigation} - Control the camera at the center of the scene. The camera is inside the globe
   * @see {@link module:Navigation.FlatNavigation FlatNavigation} - Control the camera. The camera look at the 2D projection
   * @see {@link module:Navigation.GroundNavigation GroundNavigation} - Control the camera. The camera look at the 3D projection of the ground
   * @throws {RangeError} Type not valid - a valid type is included in the list {@link NAVIGATION}
   */
  create: function (type, ctx, options) {
    let obj;
    switch (type) {
      case Constants.NAVIGATION.AstroNavigation:
        obj = new AstroNavigation(ctx, options);
        break;
      case Constants.NAVIGATION.PlanetNavigation:
        obj = new PlanetNavigation(ctx, options);
        break;
      case Constants.NAVIGATION.FlatNavigation:
        obj = new FlatNavigation(ctx, options);
        break;
      case Constants.NAVIGATION.GroundNavigation:
        obj = new GroundNavigation(ctx, options);
        break;
      default:
        throw new RangeError(
          "NavigationFactory.js: The type " + type + " is not allowed, A valid type is included in the list NAVIGATION"
        );
    }
    return obj;
  }
};
