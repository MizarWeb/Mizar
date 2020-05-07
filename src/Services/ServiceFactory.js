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
import Constants from "../Utils/Constants";
import FitsVisu from "../Services/FitsVisu";
import FitsHips from "../Services/FitsHips";
import HistogramCore from "../Services/HistogramCore";
import ImageProcessingCore from "../Services/ImageProcessingCore";
import MeasureToolPlanetCore from "../Services/MeasureToolPlanetCore";
import MeasureToolSkyCore from "../Services/MeasureToolSkyCore";
import MocBase from "../Services/MocBase";
import MollweideViewerCore from "../Services/MollweideViewerCore";
import PickingManagerCore from "../Services/PickingManagerCore";
import SampCore from "../Services/SampCore";
import SelectionToolCore from "../Services/SelectionToolCore";
import ExportToolCore from "../Services/ExportToolCore";
import NameResolver from "../NameResolver/NameResolver";
import ReverseNameResolver from "../ReverseNameResolver/ReverseNameResolver";
import TimeTravelCore from "../Services/TimeTravelCore";
/**
 * image:added
 * Called when an image has been added
 * @event Mizar#image:added
 * @type {json}
 */

/**
 * image:removed.<br/>
 * Called when an image has been removed
 * @event Mizar#image:removed
 * @type {json}
 */

/**
 * image:downloaded.<br/>
 * Called when an image has been downloaded
 * @event Mizar#image:downloaded
 * @type {json}
 */

export default {
  create: function (serviceType, userOptions) {
    var obj;
    switch (serviceType) {
      case Constants.SERVICE.FitsVisu:
        obj = FitsVisu;
        break;
      case Constants.SERVICE.Histogram:
        obj = HistogramCore;
        break;
      case Constants.SERVICE.ImageProcessing:
        obj = ImageProcessingCore;
        break;
      case Constants.SERVICE.MeasureToolPlanet:
        obj = MeasureToolPlanetCore;
        break;
      case Constants.SERVICE.MeasureToolSky:
        obj = MeasureToolSkyCore;
        break;
      case Constants.SERVICE.MocBase:
        obj = MocBase;
        break;
      case Constants.SERVICE.MollweideViewer:
        obj = MollweideViewerCore;
        break;
      case Constants.SERVICE.TimeTravel:
        obj = TimeTravelCore;
        break;
      case Constants.SERVICE.PickingManager:
        obj = PickingManagerCore;
        break;
      case Constants.SERVICE.Samp:
        obj = SampCore;
        break;
      case Constants.SERVICE.SelectionTool:
        obj = new SelectionToolCore(userOptions);
        break;
      case Constants.SERVICE.NameResolver:
        obj = NameResolver;
        break;
      case Constants.SERVICE.ReverseNameResolver:
        obj = ReverseNameResolver;
        break;
      case Constants.SERVICE.ExportTool:
        obj = ExportToolCore;
        break;
      case Constants.SERVICE.FitsHips:
        obj = FitsHips;
        break;
      default:
        throw new RangeError("Cannot retrieve service " + serviceType, "ServiceFactory.js");
    }
    return obj;
  }
};
