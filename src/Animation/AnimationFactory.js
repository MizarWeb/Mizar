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
 * @name AnimationFactory
 * @class
 * Factory to create an animation
 * @memberof module:Animation
 * @throws {RangeError} the animation type is unknown
 */
import Constants from "../Utils/Constants";
import SegmentedAnimation from "./SegmentedAnimation";
import PathAnimation from "./PathAnimation";
import InertiaAnimation from "./InertiaAnimation";
import InterpolatedAnimation from "./InterpolatedAnimation";
export default {
  /**
   * Factory to create an animation.
   *
   * Creates an animation based on :
   * <ul>
   *     <li>the animation type {@link ANIMATION},</li>
   *     <li>the options for the specific animation</li>
   * </ul>
   *
   * Severals animations can be created :
   * <ul>
   *     <li>{@link module:Animation.InertiaAnimation InertiaAnimation}</li>
   *     <li>{@link module:Animation.InterpolatedAnimation InterpolatedAnimation}</li>
   *     <li>{@link module:Animation.PathAnimation PathAnimation}</li>
   *     <li>{@link module:Animation.SegmentedAnimation SegmentedAnimation}</li>
   * </ul>
   * @param {ANIMATION} type - Type of animation.
   * @param {AbstractAnimation.inertia_configuration|AbstractAnimation.interpolated_configuration|AbstractAnimation.path_configuration|AbstractAnimation.segmented_configuration} options - See the options for each animation for further information
   * @return {AbstractAnimation} - the interface to handle an animation
   * @throws {RangeError} Type not valid - a valid type is included in the list {@link ANIMATION}
   * @alias module:Animation.AnimationFactory.create
   * @see {@link module:Animation.InertiaAnimation InertiaAnimation} Animation simulating inertia for camera's navigation
   * @see {@link module:Animation.InterpolatedAnimation InterpolatedAnimation} Generic animation to interpolate arbitrary values
   * @see {@link module:Animation.PathAnimation PathAnimation} Defines an animation based on a path
   * @see {@link module:Animation.SegmentedAnimation SegmentedAnimation} Defines an animation based on segments
   *
   */
  create: function (type, options) {
    var obj;
    switch (type) {
      case Constants.ANIMATION.Inertia:
        obj = new InertiaAnimation(options);
        break;
      case Constants.ANIMATION.Interpolated:
        obj = new InterpolatedAnimation(options);
        break;
      case Constants.ANIMATION.Path:
        obj = new PathAnimation(options);
        break;
      case Constants.ANIMATION.Segmented:
        obj = new SegmentedAnimation(options);
        break;
      default:
        throw RangeError(
          "The type " + type + " is not allowed, A valid type is included in the list Constants.ANIMATION",
          "AnimationFactory.js"
        );
    }
    return obj;
  }
};
