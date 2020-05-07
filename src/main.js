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
 * @fileOverview Entry point for the {@link Mizar MIZAR API}
 * @version [VERSION_API]
 * @author CNES
 */
import $ from "jquery";
import _ from "underscore";
import ContextFactory from "./Context/ContextFactory";
import LayerFactory from "./Layer/LayerFactory";
import CoordinateSystemFactory from "./Crs/CoordinateSystemFactory";
import AnimationFactory from "./Animation/AnimationFactory";
import UtilityFactory from "./Utils/UtilityFactory";
import ServiceFactory from "./Services/ServiceFactory";
import ProviderFactory from "./Provider/ProviderFactory";
import Utils from "./Utils/Utils";
import Event from "./Utils/Event";
import Stats from "./Utils/Stats";
import Constants from "./Utils/Constants";
import ErrorDialog from "./Gui/dialog/ErrorDialog";
import HipsMetadata from "./Layer/HipsMetadata";
import Time from "./Time/Time";
import Proxy from "./Utils/Proxy";

/**
 * mizarMode:toggle.<br/>
 * Called when Mizar switches from a context to another context
 * @event Mizar#mizarMode:toggle
 * @type {Context}
 */

/**
 * API version
 * @constant
 * @type {string}
 */
const API_VERSION = Constants.API.version;

/**
 * Angle from pole to camera
 * @constant
 * @type {number}
 */
const ANGLE_CAMERA_POLE = 30.0;

/**
 * @constant
 * @type {string}
 */
const MIZAR_NAME_PROD = "mizar.min";

/**
 * @constant
 * @type {string}
 */
const MIZAR_NAME_DEV = "mizar.";

/**
 *  Mizar input parameters
 * @typedef {Object} Mizar_inputParameters
 * @property {Object|string} canvas - canvas ID or canvas element in which Mizar is running
 * @property {Mizar_inputConfiguration} [configuration] - Mizar global configuration
 * @property {AbstractContext.skyContext} [skyContext] - Sky context configuration
 * @property {AbstractContext.planetContext} [planetContext] - Planet context configuration
 * @property {AbstractContext.groundContext} [groundContext] - Ground context configuration
 */

/**
 * Mizar configuration
 * @typedef {Object} Mizar_inputConfiguration
 * @property {string} [mizarBaseUrl] - Used to access to MizarWidget resources
 * @property {boolean} [debug = false] - Debug mode
 * @property {boolean} [isMobile = false] - Mobile support
 * @property {AbstractTracker_position_configuration} [positionTracker] - Position tracker configuration
 * @property {AbstractTracker_elevation_configuration} [elevationTracker] - Elevation tracker configuration
 * @property {TimeTravel_position_configuration} [timeTravel] - Time travel GUI
 * @property {Object} [registry] - Hips service registry
 * @property {string} registry.hips - Hips Registry
 * @property {boolean} [proxyUse=false] - Uses a proxy to send request
 * @property {string} [proxyUrl] - Proxy URL to use when proxyUse is true. This is used to avoid CORS errors.
 */
/**
 * Time travel configuration
 * @typedef {Object} TimeTravel_position_configuration
 * @property {string} [element = timeTravelDiv] - tracker div element
 */

/**
 * Position tracker configuration
 * @typedef {Object} AbstractTracker_position_configuration
 * @property {string} [element = posTracker] - tracker div element
 * @property {string}  [position = bottom] - tracker position in the GUI
 */

/**
 * Elevation tracker configuration
 * @typedef {Object} AbstractTracker_elevation_configuration
 * @property {string} [element = elevTracker] - tracker div element
 * @property {string}  [position = bottom] - tracker position in the GUI
 * @property {Layer} [elevationLayer] - elevationLayer
 */

/**
 * Mizar configuration
 * @typedef {Mizar_inputConfiguration} Mizar.configuration
 * @property {string} mizarAPIUrl - URL of this script, used to reference shaders and CSS of Mizar API
 */

/**
 * Mizar parameters
 * @typedef {Object} Mizar_parameters
 * @property {Object|string} canvas - canvas ID or canvas element
 * @property {Mizar.configuration} [configuration] - Mizar global configuration
 * @property {AbstractContext.skyContext} [skyContext] - Sky context configuration
 * @property {AbstractContext.planetContext} [planetContext] - Planet context configuration
 * @property {AbstractContext.groundContext} [groundContext] - Ground context configuration
 */

/**
 * @name Mizar
 * @class
 * Creates an instance of the Mizar API.
 * @param {Mizar_inputParameters} options - Configuration for Mizar
 * @throws {ReferenceError} No option found
 * @throws {TypeError} Canvas not defined
 * @constructor
 */

var Mizar = function (options) {
  Event.prototype.constructor.call(this);

  _checkConfiguration(options);
  this.options = _createConfiguration(options);

  ErrorDialog.setDebug(this.options.configuration.debug ? this.options.configuration.debug : false);

  // Init all factories
  /**
   * Creates a {@link module:Context.ContextFactory Context}
   * @name ContextFactory
   * @memberof Mizar#
   */
  this.ContextFactory = ContextFactory;

  /**
   * Creates a {@link module:Layer.LayerFactory Layer}
   * @name LayerFactory
   * @memberof Mizar#
   */
  this.LayerFactory = LayerFactory;

  // Proxy settings
  const proxyUse = this.options.configuration.proxyUse || false;
  Proxy.setProxyUse(proxyUse);
  if (proxyUse) {
    Proxy.setProxyUrl(this.options.configuration.proxyUrl);
  }

  /**
   * Creates an {@link module:Animation.AnimationFactory animation}
   * @name AnimationFactory
   */
  this.AnimationFactory = AnimationFactory;

  /**
   * Creates a {@link module:Services.ServiceFactory service}
   * @name ServiceFactory
   */
  this.ServiceFactory = ServiceFactory;

  /**
   * Creates an {@link module:Utils.UtilityFactory utility}
   * @name UtilityFactory
   * @memberof Mizar#
   */
  this.UtilityFactory = UtilityFactory;

  /**
   * Creates a {@link module:Provider.ProviderFactory provider}
   * @name ProviderFactory
   * @memberof Mizar#
   */
  this.ProviderFactory = ProviderFactory;

  /**
   * Access to time.
   * @name TimeUtility
   * @memberof Mizar#
   */
  this.TimeUtility = Time;

  this.errorDialog = ErrorDialog;

  this.skyContext = null;
  this.planetContext = null;
  this.groundContext = null;
  this.activatedContext = null;
  this.renderContext = null;
  this.dataProviders = {};

  if (options.skyContext) {
    options.skyContext.isMobile = options.isMobile;
    this.createContext(Mizar.CONTEXT.Sky, options.skyContext);
    this.setActivatedContext(Mizar.CONTEXT.Sky);
  }

  if (options.planetContext) {
    options.planetContext.isMobile = options.isMobile;
    this.createContext(Mizar.CONTEXT.Planet, options.planetContext);
    this.setActivatedContext(Mizar.CONTEXT.Planet);
  }

  if (options.groundContext) {
    options.groundContext.isMobile = options.isMobile;
    this.createContext(Mizar.CONTEXT.Ground, options.groundContext);
    this.setActivatedContext(Mizar.CONTEXT.Ground);
  }
};

/**********************************************************************************************************
 *                                      Static variables
 **********************************************************************************************************/

/**
 * API {@link VERSION version}
 * [SemVer]{@link http://semver.org/} concept is used for versioning
 * @name VERSION
 * @memberof Mizar#
 */
Mizar.VERSION = API_VERSION;

/**
 * List of supported values for {@link ANIMATION animation}*
 * @name ANIMATION
 * @memberof Mizar#
 * @see {@link module:Animation animation package} for further information.
 */
Mizar.ANIMATION = Constants.ANIMATION;

/**
 * List of supported values for {@link LAYER layer}
 * @name LAYER
 * @memberof Mizar#
 * @see {@link module:Layer layer package} for further information.
 */
Mizar.LAYER = Constants.LAYER;

/**
 * List of supported values for {@link INFORMATION_TYPE information}
 * @name INFORMATION_TYPE
 * @memberof Mizar#
 */

Mizar.INFORMATION_TYPE = Constants.INFORMATION_TYPE;

/**
 * List of supported values for {@link GEOMETRY geometry}
 * @name GEOMETRY
 * @memberof Mizar#
 */
Mizar.GEOMETRY = Constants.GEOMETRY;

/**
 * List of supported values for {@link NAVIGATION navigation}
 * @name NAVIGATION
 * @memberof Mizar#
 * @see {@link module:Navigation navigation package} for further information.
 */
Mizar.NAVIGATION = Constants.NAVIGATION;

/**
 * List of supported values for {@link CONTEXT context}
 * @name CONTEXT
 * @memberof Mizar#
 * @see {@link module:Context context package} for further information.
 */
Mizar.CONTEXT = Constants.CONTEXT;

/**
 * List of supported values for {@link PROJECTION projection}
 * @name PROJECTION
 * @memberof Mizar#
 * @see {@link module:Projection projection package} for further information.
 */
Mizar.PROJECTION = Constants.PROJECTION;

/**
 * List of supported values for {@link CRS coordinate reference system}
 * @name CRS
 * @memberof Mizar#
 * @see {@link module:Crs coordinate system package} for further information.
 */
Mizar.CRS = Constants.CRS;

/**
 * List of supported values for {@link CRS_TO_CONTEXT crs/context mapping}
 * @name CRS_TO_CONTEXT
 * @memberof Mizar#
 */
Mizar.CRS_TO_CONTEXT = Constants.CRS_TO_CONTEXT;

/**
 * List of supported values {@link DISPLAY display}
 * @name DISPLAY
 * @memberof Mizar#
 */
Mizar.DISPLAY = Constants.DISPLAY;

/**
 * List of supported values for {@link SERVICE service}
 * @name SERVICE
 * @memberof Mizar#
 */
Mizar.SERVICE = Constants.SERVICE;

/**
 * List of supported values for {@link UTILITY utility}
 * @name UTILITY
 * @memberof Mizar#
 */
Mizar.UTILITY = Constants.UTILITY;

/**
 * List of supported values for {@link PROVIDER provider}
 * @name PROVIDER
 * @memberof Mizar#
 * @see {@link module:Provider provider package} for further information.
 */
Mizar.PROVIDER = Constants.PROVIDER;

/**
 * List of supported values for {@link EVENT_MSG event}
 * @name EVENT_MSG
 * @memberof Mizar#
 */
Mizar.EVENT_MSG = Constants.EVENT_MSG;

/**
 * List of supported valaues for {@link TIME_STEP time step}
 * @name TIME_STEP
 * @memberof Mizar#
 */
Mizar.TIME_STEP = Constants.TIME_STEP;

/**
 * List of supported valaues for {@link LEVEL level}
 * @name LEVEL
 * @memberof Mizar#
 */

Mizar.LEVEL = Constants.LEVEL;

/**********************************************************************************************************
 *                                      Private methods
 **********************************************************************************************************/

/**
 * Returns the script object that contains the URL of this script
 * @param {Object[]} scripts - All the scripts from the document where Mizar is imported
 * @param {MIZAR_NAME_PROD|MIZAR_NAME_DEV} scriptName - production or dev script name
 * @param {int} index - Number of range '/' to remove from the end of the URL
 * @private
 */
function _extractURLFrom(scripts, scriptName, index) {
  let mizarSrc = _.find(scripts, function (script) {
    return script.src.indexOf(scriptName) !== -1;
  });
  if (mizarSrc) {
    mizarSrc = mizarSrc.src.split("/").slice(0, index).join("/") + "/";
  }
  return mizarSrc;
}

/**
 * Return the base URL of this script.
 * @returns {string} the base URL or an empty string
 * @private
 */
function _getMizarAPIBaseURL() {
  const scripts = document.getElementsByTagName("script");
  return (
    _extractURLFrom.call(this, scripts, MIZAR_NAME_PROD, -1) ||
    _extractURLFrom.call(this, scripts, MIZAR_NAME_DEV, -2) ||
    ""
  );
}

/**
 * Checks inputs
 * @param {Object} options - Mizar configuration
 * @throws {ReferenceError} No option found
 * @throws {TypeError} Canvas not defined
 * @function _checkConfiguration
 * @memberof Mizar#
 * @private
 */
function _checkConfiguration(options) {
  if (typeof options === "undefined") {
    throw new ReferenceError("No option found", "Mizar.js");
  } else if (typeof options.canvas === "undefined") {
    throw new TypeError("Canvas not defined", "Mizar.js");
  } else {
    // do nothing
  }
}

/**
 * Checks inputs from user and creates the mizar configuration
 * @param {Mizar.inputParameters} options inputs from user
 * @returns {Mizar_parameters} mizar configuration.
 * @function _createConfiguration
 * @memberof Mizar#
 * @private
 */
function _createConfiguration(options) {
  const mizarAPIUrl = _getMizarAPIBaseURL();
  console.info("Mizar base URL:", mizarAPIUrl);
  const mizarOptions = {
    canvas: typeof options.canvas === "string" ? document.getElementById(options.canvas) : options.canvas
  };
  if (options.hasOwnProperty("configuration")) {
    mizarOptions.configuration = options.configuration;
  } else {
    mizarOptions.configuration = {};
  }
  mizarOptions.configuration.mizarAPIUrl = mizarAPIUrl;
  if (options.hasOwnProperty("skyContext")) {
    mizarOptions.skyContext = options.skyContext;
  }
  if (options.hasOwnProperty("planetContext")) {
    mizarOptions.planetContext = options.planetContext;
  }
  if (options.hasOwnProperty("groundContext")) {
    mizarOptions.groundContext = options.groundContext;
  }
  return mizarOptions;
}

/**
 * Switch to a context
 * @param {AbstractContext} context - Target context
 * @param {Object} [options] - options management for the source context
 * @param {boolean} [options.mustBeDestroyed=false] - options management for the source context : destroy it
 * @param {boolean} [options.mustBeHidden=false] - options management for the source context : hidden it
 * @function _switchToContext
 * @memberof Mizar#
 * @private
 * @fires Mizar#mizarMode:toggle
 */
function _switchToContext(context, options) {
  if (context.globe) {
    context.globe.isEnable = false;
  }

  const self = this;
  const mustBeDestroyed = options.hasOwnProperty("mustBeDestroyed") ? options.mustBeDestroyed : false;
  const mustBeHidden = options.hasOwnProperty("mustBeHidden") ? options.mustBeHidden : false;

  // Hide sky
  this.getActivatedContext().hide();

  // Hide all additional layers
  this.getActivatedContext().hideAdditionalLayers();

  let viewMatrix;
  let fov;
  if (context.hasOwnProperty("_oldVM") && context.hasOwnProperty("_oldFov")) {
    viewMatrix = context._oldVM;
    fov = context._oldFov;
  } else if (context.getNavigation().inverseViewMatrix === undefined) {
    this.getActivatedContext()._oldVM = this.renderContext.getViewMatrix();
    this.getActivatedContext()._oldFov = this.renderContext.getFov();
    viewMatrix = context.getNavigation().getRenderContext().getViewMatrix();
    fov = 90;
  } else {
    this.getActivatedContext()._oldVM = this.renderContext.getViewMatrix();
    this.getActivatedContext()._oldFov = this.renderContext.getFov();
    viewMatrix = mat4.create();
    context.getNavigation().computeInverseViewMatrix();
    mat4.inverse(context.getNavigation().inverseViewMatrix, viewMatrix);
    fov = 90;
  }

  if (mustBeDestroyed) {
    this.getActivatedContext().destroy();
  } else if (mustBeHidden) {
    this.getActivatedContext().disable();
  } else {
    // display the two contexts in the same time
  }
  this.activatedContext = context;
  if (!context.getNavigation().getRenderContext().cameraUpdateFunction) {
    context.getNavigation().getRenderContext().cameraUpdateFunction = context
      .getNavigation()
      .update.bind(context.getNavigation());
  }
  context.getNavigation().toViewMatrix(viewMatrix, fov, 2000, function () {
    context.enable();

    if (context.globe) {
      context.globe.isEnable = true;
    }

    if (options && options.callback) {
      options.callback.call(self);
    }
    context.showAdditionalLayers();
    self.getActivatedContext().show();
    self.publish(Constants.EVENT_MSG.MIZAR_MODE_TOGGLE, context);
    self.getActivatedContext().refresh();
    if (self.getRenderContext().viewMatrix[0] !== "undefined") {
      self.getActivatedContext().getNavigation().computeViewMatrix();
    }
  });
}

/**
 * Saves the atmosphere state and disable it when 2D is used
 * @function _disableAtmosphere
 * @memberof Mizar#
 * @fires Context#startLoad
 * @fires Context#endLoad
 * @fires Context#baseLayersReady
 * @fires Context#baseLayersError
 * @fires Context#startBackgroundLoad
 * @fires Context#endBackgroundLoad
 * @fires Context#features:added
 * @private
 */
function _disableAtmosphere() {
  if (this.getActivatedContext()._atmosphereLayer !== undefined) {
    if (this.getActivatedContext()._atmosphereLayer.globe !== null) {
      this.getActivatedContext()._saveAtmosphereVisible = this.getActivatedContext()._atmosphereLayer.visible;
      this.getActivatedContext()._atmosphereLayer.setVisible(false);
      this.render();
    }
  }
}

/**
 * Retrieves the atmosphere and enable it when 3D is used
 * @function _enableAtmosphere
 * @memberof Mizar#
 * @fires Context#startLoad
 * @fires Context#endLoad
 * @fires Context#baseLayersReady
 * @fires Context#baseLayersError
 * @fires Context#startBackgroundLoad
 * @fires Context#endBackgroundLoad
 * @fires Context#features:added
 * @private
 */
function _enableAtmosphere() {
  if (this.getActivatedContext()._atmosphereLayer !== undefined) {
    if (this.getActivatedContext()._atmosphereLayer.globe !== null) {
      this.getActivatedContext()._atmosphereLayer.setVisible(this.getActivatedContext()._saveAtmosphereVisible);
      this.render();
    }
  }
}

/**
 * Switch 2D to 3D.
 * @function _switch2Dto3D
 * @memberof Mizar#
 * @fires Context#startLoad
 * @fires Context#endLoad
 * @fires Context#baseLayersReady
 * @fires Context#baseLayersError
 * @fires Context#startBackgroundLoad
 * @fires Context#endBackgroundLoad
 * @fires Context#features:added
 * @private
 */
function _switch2Dto3D() {
  _enableAtmosphere.call(this);

  // Enable skyContext behind the planet
  if (this.skyContext) {
    this.skyContext.enable();
  }

  this.setCrs({
    geoideName: this.getCrs().getGeoideName()
  });

  // Check zoom level
  this.planetContext.navigation.zoom(0);
}

/**
 * Switch 3D to 2D.
 * @function _switch3Dto2D
 * @memberof Mizar#
 * @private
 */
function _switch3Dto2D() {
  _disableAtmosphere.call(this);

  // Disable skyContext
  if (this.skyContext) {
    this.skyContext.disable();
  }

  // If a pole is closed to the center of the canvas, this should mean that
  // the user is interested to the pole, so we switch to azimuth projection
  // instead of plate carrée projection
  _project2AzimuthOrPlate.call(this, this.getActivatedContext().navigation.getCenter());
}

/**
 * Selects the right projection according to the target of the camera.<br/>
 * When the angle of the target of the camera with a pole (north or south)
 * is inferior to ANGLE_CAMERA_POLE, then the azimuthal projection is selected
 * otherwise plate carrée is selected
 * @param {float[]} lookAt - target of the camera [longitude, latitude] in decimal degree
 * @function _project2AzimuthOrPlate
 * @memberof Mizar#
 * @private
 */
function _project2AzimuthOrPlate(lookAt) {
  if (lookAt !== null && 90 - Math.abs(lookAt[1]) <= ANGLE_CAMERA_POLE) {
    this.setCrs({
      geoideName: this.getCrs().getGeoideName(),
      projectionName: Mizar.PROJECTION.Azimuth,
      pole: Math.sign(lookAt[1]) > 0 ? "north" : "south"
    });
  } else {
    this.setCrs({
      geoideName: this.getCrs().getGeoideName(),
      projectionName: Mizar.PROJECTION.Plate
    });
  }
}

/**
 * Skip if sky mode
 * @function _skipIfSkyMode
 * @memberof Mizar#
 * @throws {RangeError} Toggle Dimension is not implemented for Sky
 * @private
 */
function _skipIfSkyMode() {
  if (this.getActivatedContext().getMode() === Mizar.CONTEXT.Sky) {
    throw new RangeError("Toggle Dimension is not implemented for Sky", "Mizar.js");
  }
}

/**
 * Get service url from HIPS Layer
 * @function _getHipsServiceUrlArray
 * @memberof Mizar#
 * @param hipsLayer
 * @returns {Array}
 * @private
 */
function _getHipsServiceUrlArray(hipsLayer) {
  const hipsServiceUrlArray = [];

  if (hipsLayer.hips_service_url) {
    hipsServiceUrlArray.push(hipsLayer.hips_service_url);
  }
  if (hipsLayer.hips_service_url_1) {
    hipsServiceUrlArray.push(hipsLayer.hips_service_url_1);
  }
  if (hipsLayer.hips_service_url_2) {
    hipsServiceUrlArray.push(hipsLayer.hips_service_url_2);
  }
  return hipsServiceUrlArray;
}

/**
 * Loads HIPS layers from passed service url
 * @function _checkHipsServiceIsAvailable
 * @memberof Mizar#
 * @param {Array} hipsServiceUrlArray - HIPS service URL
 * @param {serviceRegistryCallback} callback - The callback that handles the response
 * @private
 */
function _checkHipsServiceIsAvailable(hipsServiceUrlArray, callback) {
  if (hipsServiceUrlArray.length === 0) {
    return callback(undefined);
  }
  const url = hipsServiceUrlArray.shift();

  Utils.requestUrl(
    url + "/properties",
    "text",
    "text/plain",
    null,
    function (data) {
      callback(url);
    },
    function (err) {
      _checkHipsServiceIsAvailable(hipsServiceUrlArray, callback);
    }
  );
}

/**
 * Loads HIPS layers from passed service url
 * @function _loadHIPSLayers
 * @memberof Mizar#
 * @param {Mizar} Mizar - Mizar API
 * @param {Options} [options] - Options
 * @param {string} [options.registry] - Registry
 * @param {string} [options.registry.hips] - Hips Registry
 * @private
 */
function _loadHIPSLayers(Mizar, options) {
  if (typeof options !== "undefined" && options.hasOwnProperty("registry") && options.registry.hasOwnProperty("hips")) {
    Utils.requestUrl(
      options.registry.hips,
      "json",
      "application/json",
      null,
      function (hipsLayersJSON) {
        _.each(
          hipsLayersJSON,
          function (hipsLayer) {
            const hipsServiceUrlArray = _getHipsServiceUrlArray(hipsLayer);
            _checkHipsServiceIsAvailable(hipsServiceUrlArray, function (hipsServiceUrl) {
              if (typeof hipsServiceUrl === "undefined") {
                let text = "";
                if (typeof hipsLayer.obs_title === "undefined") {
                  text = "with ID <b>" + hipsLayer.ID + "</b>";
                } else {
                  text = "with title <b>" + hipsLayer.obs_title + "</b>";
                }
                ErrorDialog.open(Constants.LEVEL.ERROR, " Cannot add layer " + text, "no mirror available");
                return;
              }
              $.proxy(_createHips, Mizar)(hipsLayer, hipsServiceUrl);
            });
          },
          Mizar
        );
      },
      function (err) {
        ErrorDialog.open(Constants.LEVEL.WARNING, "Cannot connect to " + options.registry.hips, err.message);
      }
    );
  }
}

/**
 * Creates a HIPS layer from registry
 * @function _createHips
 * @memberof Mizar#
 * @param hipsLayer
 * @param hipsServiceUrl
 * @private
 */
function _createHips(hipsLayer, hipsServiceUrl) {
  try {
    if (hipsLayer.hasOwnProperty("hips_status") && hipsLayer.hips_status.match("public") === null) {
      return;
    }
    hipsLayer.hips_service_url = hipsServiceUrl;
    this.addLayer({
      type: Mizar.LAYER.Hips,
      hipsMetadata: new HipsMetadata(hipsLayer)
    });
  } catch (e) {
    const name = hipsLayer.obs_title ? hipsLayer.obs_title : hipsLayer.obs_collection;
    ErrorDialog.open(
      Constants.LEVEL.ERROR,
      "Hips layer " + name + " not valid for " + hipsLayer.hips_service_url,
      e.message
    );
  }
}

/**************************************************************************************************************/

Utils.inherits(Event, Mizar);

/**************************************************************************************************************/

/**************************************************************************************************************
 *                                          Public methods
 **************************************************************************************************************/

/**
 * Returns the sky context.
 * @returns {SkyContext|null}
 * @function getSkyContext
 * @memberof Mizar#
 */
Mizar.prototype.getSkyContext = function () {
  return this.skyContext;
};

/**
 * Returns the planet context.
 * @returns {PlanetContext|null}
 * @function getPlanetContext
 * @memberof Mizar#
 */
Mizar.prototype.getPlanetContext = function () {
  return this.planetContext;
};

/**
 * Returns the ground context.
 * @returns {GroundContext|null}
 * @function getGroundContext
 * @memberof Mizar#
 */
Mizar.prototype.getGroundContext = function () {
  return this.groundContext;
};

/**
 * Returns the context according to the mode.
 * @function _getContext
 * @param {CONTEXT|undefined} mode - the selected mode
 * @memberof Mizar#
 * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
 * @returns {Context} the context
 * @private
 */
function _getContext(mode) {
  let context;
  switch (mode) {
    case undefined:
      context = this.getActivatedContext();
      break;
    case Mizar.CONTEXT.Sky:
      context = this.getSkyContext();
      break;
    case Mizar.CONTEXT.Planet:
      context = this.getPlanetContext();
      break;
    case Mizar.CONTEXT.Ground:
      context = this.getGroundContext();
      break;
    default:
      throw new RangeError(
        "The mode " + mode + " is not allowed, A valid mode is included in the list CONTEXT",
        "Mizar.js"
      );
  }
  return context;
}

/**
 * Returns the selected context.
 * When activatedContext is not set, it is set automatically to the created context
 * (in the following order : sky, planet, ground). When no context is created,
 * an  exception "No created context" is send.
 * @returns {PlanetContext|SkyContext|GroundContext|null}
 * @function getActivatedContext
 * @memberof Mizar#
 */
Mizar.prototype.getActivatedContext = function () {
  try {
    if (this.activatedContext == null) {
      if (this.skyContext != null) {
        this.activatedContext = this.skyContext;
      } else if (this.planetContext != null) {
        this.activatedContext = this.planetContext;
      } else if (this.groundContext != null) {
        this.activatedContext = this.groundContext;
      } else {
        throw new ReferenceError("No created context", "Mizar.js");
      }
    }
  } catch (e) {
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot get the context", e.message);
  }
  return this.activatedContext;
};

/**
 * Selects the context as default context according to the {@link CONTEXT context mode}.<br/>
 * Once a context is selected, methods can be applied to it.
 * @param {CONTEXT} contextMode - select one context among {@link CONTEXT context}
 * @returns {boolean} true when the contextMode is known otherwise false
 * @function setActivatedContext
 * @memberof Mizar#
 * @throws {RangeError} contextMode not valid - a valid contextMode is included in the list {@link CONTEXT}
 */
Mizar.prototype.setActivatedContext = function (contextMode) {
  let result;
  switch (contextMode) {
    case Mizar.CONTEXT.Planet:
      this.activatedContext = this.planetContext;
      result = true;
      break;
    case Mizar.CONTEXT.Sky:
      this.activatedContext = this.skyContext;
      result = true;
      break;
    case Mizar.CONTEXT.Ground:
      this.activatedContext = this.groundContext;
      result = true;
      break;
    default:
      result = false;
      ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot set the context to " + contextMode);
  }
};

/**
 * Returns the mode in which the active context is set.
 * @function getMode
 * @memberof Mizar#
 * @returns {CONTEXT|null} Returns the mode otherwise null when no created context
 */
Mizar.prototype.getMode = function () {
  let result;
  const context = this.getActivatedContext();
  if (context) {
    result = context.getMode();
  } else {
    result = null;
  }
  return result;
};

/**
 * Returns the rendering context.
 * @returns {RenderContext|null} the rendering context
 * @function getRenderContext
 * @memberof Mizar#
 */
Mizar.prototype.getRenderContext = function () {
  let result;
  const context = this.getActivatedContext();
  if (context) {
    result = context.getRenderContext();
  } else {
    result = null;
  }
  return result;
};

/**
 * Returns the options
 * @function getOptions
 * @memberof Mizar#
 * @returns {Mizar_parameters} - Mizar's options
 */
Mizar.prototype.getOptions = function () {
  return this.options;
};

//               ***************************** coordinate reference *****************************

/**
 * Returns the coordinate reference system related to the selected {@link CONTEXT context}
 * @returns {Crs|null} the coordinate reference system or null when no created context
 * @function getCrs
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext} to select a context
 * @see {@link Mizar#createContext} to create a context
 */
Mizar.prototype.getCrs = function () {
  let result;
  const context = this.getActivatedContext();
  if (context) {
    result = context.getCoordinateSystem();
  } else {
    result = null;
  }
  return result;
};

/**
 * Sets the coordinate reference system related to the selected {@link CONTEXT context}
 * @param {AbstractProjection.configuration|AbstractProjection.azimuth_configuration|AbstractProjection.mercator_configuration} coordinateSystem - coordinate system description
 * @returns {boolean} true when the coordinate system is set otherwise false when an error occurs
 * @function setCrs
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext}
 * @see {@link Mizar#createContext}
 */
Mizar.prototype.setCrs = function (coordinateSystem) {
  let result;
  const context = this.getActivatedContext();
  if (context) {
    const crs = CoordinateSystemFactory.create(coordinateSystem);
    context.setCoordinateSystem(crs);
    result = true;
  } else {
    result = false;
  }
  return result;
};

/**
 * Update the time travel navigation range
 * @param {JSON} parameters Parameters
 * @function setTime
 * @memberof Mizar#
 */
Mizar.prototype.updateTimeTravel = function (parameters) {
  this.getServiceByName(Mizar.SERVICE.TimeTravel).update(parameters);
};

/**
 * Sets the current or integrated time of the application
 * @param {Time.configuration} time single, multiple or range of values
 * @function setTime
 * @memberof Mizar#
 */
Mizar.prototype.setTime = function (time) {
  this.activatedContext.setTime(time);
};

/**
 * Returns the current or integrated time.
 * @returns {Time.configuration} the simple, multiple or range of values
 * @function getTime
 * @memberof Mizar#
 */
Mizar.prototype.getTime = function () {
  return this.activatedContext.getTime();
};

//               ***************************** context management *****************************

/**
 * Creates a context according to the {@link CONTEXT context mode}.<br/>
 * @param {CONTEXT} contextMode - Select on context among {@link CONTEXT context}
 * @param {AbstractContext.skyContext|AbstractContext.planetContext|AbstractContext.groundContext} options - Options for the context, See options.planetContext or options.skycontext configuration for {@link Mizar}
 * @retuns {boolean} true when the context is created otherwise false when the contextMode is unknown
 * @throws {RangeError} contextMode not valid - a valid contextMode is included in the list {@link CONTEXT}
 * @function createContext
 * @memberof Mizar#
 */
Mizar.prototype.createContext = function (contextMode, options) {
  let result;
  try {
    options.renderContext = this.renderContext;
    options.timeTravelService = this.getServiceByName(Mizar.SERVICE.TimeTravel);
    options.isMobile = this.getOptions().configuration.isMobile;

    const ctx = this.ContextFactory.create(contextMode, this.getOptions(), options);

    switch (contextMode) {
      case Mizar.CONTEXT.Sky:
        this.skyContext = ctx;
        _loadHIPSLayers(this, this.getOptions().configuration);
        break;
      case Mizar.CONTEXT.Planet:
        this.planetContext = ctx;
        break;
      case Mizar.CONTEXT.Ground:
        this.groundContext = ctx;
        break;
      default:
        throw new RangeError("Unknown contextMode '" + contextMode + "'", "Mizar.js");
    }
    this.renderContext = ctx.getRenderContext();
    result = true;
  } catch (e) {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot create the context", e.message);
  }
  return result;
};

/**
 * Switches 2D <--> 3D, only for planetary context. <br/>
 * When this method is used in a sky context, and exception is thrown
 * @returns {boolean} true when toggle works otherwise false
 * @function toggleDimension
 * @memberof Mizar#
 * @fires Context#startLoad
 * @fires Context#endLoad
 * @fires Context#baseLayersReady
 * @fires Context#baseLayersError
 * @fires Context#startBackgroundLoad
 * @fires Context#endBackgroundLoad
 * @fires Context#features:added
 */
Mizar.prototype.toggleDimension = function () {
  let result;
  try {
    _skipIfSkyMode.call(this);
    if (this.getCrs().isFlat()) {
      // we are in 2D and we are going to 3D
      _switch2Dto3D.call(this);
    } else {
      // we are in 3D and we are goint to 2D
      _switch3Dto2D.call(this);
    }
    this.render();
    result = true;
  } catch (e) {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot toggle the dimension", e.message);
  }
  return result;
};

/**
 * Switches to a context.
 * @param {AbstractContext} context - target context
 * @param {Object} [options] - options management for the source context
 * @param {boolean} [options.mustBeDestroyed=false] - options management for the source context
 * @param {boolean} [options.mustBeHidden=false] - options management for the source context
 * @param {Function} callback - Call at the end of the toggle
 * @fires Mizar#mizarMode:toggle
 * @function toggleToContext
 * @memberof Mizar#
 */
Mizar.prototype.toggleToContext = function (context, options) {
  let result;
  try {
    const opts = options || {};
    _switchToContext.call(this, context, opts);
    result = true;
  } catch (e) {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot toggle the context", e.message);
  }
  return result;
};

//               ***************************** layer management *****************************

/**
 * Returns the sky layers, which have been added by {@link Mizar#addLayer}.
 * @function getSkyLayers
 * @returns {Layer[]|null} the layers
 * @memberof Mizar#
 */
Mizar.prototype.getSkyLayers = function () {
  let result;
  const context = this.getSkyContext();
  if (context) {
    result = context.getLayers();
  } else {
    result = null;
  }
  return result;
};

/**
 * Returns the planet layers, which have been added by {@link Mizar#addLayer}
 * @function getPlanetLayers
 * @returns {Layer[]|null} the layers
 * @memberof Mizar#
 */
Mizar.prototype.getPlanetLayers = function () {
  let result;
  const context = this.getPlanetContext();
  if (context) {
    result = context.getLayers();
  } else {
    result = null;
  }
  return result;
};

/**
 * Returns the grounds layers, which have been added by {@link Mizar#addLayer}
 * @function getGroundLayers
 * @returns {Layer[]|null} the layers
 * @memberof Mizar#
 */
Mizar.prototype.getGroundLayers = function () {
  let result;
  const context = this.getGroundContext();
  if (context) {
    result = context.getLayers();
  } else {
    result = null;
  }
  return result;
};

/**
 * Returns the layers for a specific context.<br/>
 * When no context is specified, the layers from the selected context are returned.
 * @function getLayers
 * @param {CONTEXT|null} mode - Context on which the function is applied
 * @returns {Layer[]} the layers
 * @memberof Mizar#
 * @throws {RangeError} Will throw an error when the mode is not part of {@link CONTEXT}
 * @see {@link Mizar#setActivatedContext} to select a context
 * @see {@link Mizar#createContext} to create a context
 */
Mizar.prototype.getLayers = function (mode) {
  let result;
  try {
    result = _getContext.call(this, mode).getLayers();
  } catch (e) {
    result = null;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot get the layers", e.message);
  }
  return result;
};

/**
 * Draws the layer on the top.
 * @function setLayerOnTheTop
 * @param {string} layerID Layer ID
 * @return {boolean} Returns true when the layer is drawn on the top otherwise false.
 * @memberof Mizar#
 */
Mizar.prototype.setLayerOnTheTop = function (layerID) {
  let result;
  const layer = this.getLayerByID(layerID);
  if (layer != null) {
    layer.setOnTheTop();
    result = true;
  } else {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot set the layer on the top", layerID + " does not exist");
  }
  return result;
};

/**
 * Returns all the layers regardless of the {@link CONTEXT context}.
 * @function getAllLayers
 * @return {Layer[]} the layers
 * @memberof Mizar#
 */
Mizar.prototype.getAllLayers = function () {
  return _.union(this.getSkyLayers(), this.getPlanetLayers());
};

/**
 * Returns the layer by its ID according to the {@link CONTEXT context}.<br/>
 * When no context is specified, the layer from the selected context is returned.<br/>
 * The ID is a unique layer identifier, which is returned when the layer description is {@link Mizar#addLayer added}
 * to Mizar
 * @function getLayerByID
 * @param {string} layerID - Layer's ID
 * @param {CONTEXT|undefined} mode - Context on which the function is applied
 * @returns {Layer|undefined|null} The layer or undefined when the layer is not found
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext} to select a context
 * @see {@link Mizar#createContext} to create a context
 */
Mizar.prototype.getLayerByID = function (layerID, mode) {
  let result;
  try {
    result = _getContext.call(this, mode).getLayerByID(layerID);
  } catch (e) {
    result = null;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot get the layer by ID", e.message);
  }
  return result;
};

/**
 * Returns the layer by its name according to the {@link CONTEXT context}.<br/>
 * When no context is specified, the layer from the selected context is returned.<br/>
 * <b>Note:</b> The name may not be unique. In this case, the first layer having this name is returned
 * @function getLayerByName
 * @param {string} layerName - Layer's name, provided in the layer description when the layer is {@link Mizar#addLayer added}
 * @param {CONTEXT|undefined} mode - Context on which the function is applied
 * @returns {Layer|undefined|null} the layer or undefined when the layer is not found
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext} to select a context
 * @see {@link Mizar#createContext} to create a context
 */
Mizar.prototype.getLayerByName = function (layerName, mode) {
  let result;
  try {
    result = _getContext.call(this, mode).getLayerByName(layerName);
  } catch (e) {
    result = null;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot get the layer by name", e.message);
  }
  return result;
};

/**
 * Adds a layer according to the selected {@link CONTEXT context}.<br/>
 * When layerPlanet is not provided, then the layer is added to the selected context otherwise the layer
 * is added to the layerPlanet.
 *
 * @function addLayer
 * @param {Object} layerDescription - See the base properties {@link AbstractLayer.configuration} and a specific layer for specific properties
 * @returns {string|null} a unique identifier or null when a problem happens
 * @memberof Mizar#
 * @listens AbstractLayer#visibility:changed
 * @see {@link module:Layer.AtmosphereLayer AtmosphereLayer} : A layer to create an atmosphere on a planet.
 * @see {@link module:Layer.BingLayer BingLayer}: The Microsoft service proving a WMTS server.
 * @see {@link module:Layer.CoordinateGridLayer CoordinateGridLayer} : A layer to create a grid on the sky
 * @see {@link module:Layer.GeoJsonLayer GeoJSONLayer} : A layer to add a GeoJSON on the globe
 * @see {@link module:Layer.GroundOverlayLayer GroundOverlayLayer} : A layer to draw an image overlay draped onto the terrain
 * @see {@link module:Layer.HipsCatLayer HipsCatLayer} : A layer to draw a HIPS catalogue
 * @see {@link module:Layer.HipsFitsLayer HipsFitsLayer} : A layer to draw an Hips Fits
 * @see {@link module:Layer.HipsGraphicLayer HipsGraphicLayer} : A layer to draw a Hips JPEG/PNG
 * @see {@link module:Layer.MocLayer MocLayer} : A layer to draw a multi-order-coverage index
 * @see {@link module:Layer.OpenSearchLayer OpenSearchLayer} : A layer to draw the result from an open search service
 * @see {@link module:Layer.OSMLayer OSMLayer} : A layer to display data coming from OpenStreetMap server
 * @see {@link module:Layer.TileWireframeLayer TileWireframeLayer} : A layer to draw a grid on the planet
 * @see {@link module:Layer.VectorLayer VectorLayer} : A layer to draw a vector
 * @see {@link module:Layer.WCSElevationLayer WCSElevationLayer} : A layer to draw the elevation
 * @see {@link module:Layer.WMSElevationLayer WMSElevationLayer} : A layer to draw the elevation
 * @see {@link module:Layer.WMSLayer WMSLayer} : A layer to draw images coming from the WMS server
 * @see {@link module:Layer.WMTSLayer WMTSLayer} : A layer to draw predefined tiles coming from a WMTS server
 * @see {@link Mizar#setActivatedContext}
 * @see {@link Mizar#createContext}
 */
Mizar.prototype.addLayer = function (layerDescription, callback, fallback) {
  this.getActivatedContext().addLayer(layerDescription, callback, fallback);
};

/**
 * Removes a layer by its ID according to the {@link CONTEXT context}.<br/>
 * When no context is specified, then the function is applied on the selected context.
 * @function removeLayer
 * @param {string} layerID - Layer's ID
 * @param {CONTEXT|undefined} mode - Context on which the function is applied
 * @returns {boolean} true when the layer is added otherwise false
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext} to select a context
 * @see {@link Mizar#createContext} to create a context
 */
Mizar.prototype.removeLayer = function (layerID, mode) {
  let result;
  try {
    const removedLayer = _getContext.call(this, mode).removeLayer(layerID);
    result = typeof removedLayer !== "undefined";
  } catch (e) {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot remove the layer", e.message);
  }
  return result;
};

/**
 * Sets the background layer according to the selected context.<br/>
 * When no context is specified, then the function is applied on the selected context.<br/>
 * <b>Note 1:</b> The name is not a unique identifier. The first layer matching at this name is returned<br/>
 * <b>Note 2:</b> The layer must be {@link Mizar#addLayer added} before
 * @function setBackgroundLayer
 * @param {string} layerName - Layer's name, which has been provided in the layer description
 * @param {CONTEXT|undefined} mode - Context on which the function is applied
 * @returns {boolean} true when the layer is set as background otherwise false
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext} to select a context
 * @see {@link Mizar#createContext} to create a context
 */
Mizar.prototype.setBackgroundLayer = function (layerName, mode) {
  let result;
  try {
    const gwLayer = _getContext.call(this, mode).setBackgroundLayer(layerName);
    result = typeof gwLayer !== "undefined";
  } catch (e) {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot set the background", e.message);
  }
  return result;
};

/**
 * Sets the background layer by ID according to the {@link CONTEXT context}.<br/>
 * When no context is specified, then the function is applied on the selected context.
 * <b>Note:</b> The layer must be {@link Mizar#addLayer added} before
 * @function setBackgroundLayerByID
 * @param {string} layerID - Unique layer identifier.
 * @param {CONTEXT|undefined} mode - Context on which the function is applied.
 * @returns {boolean} true when the layer is set as background otherwise false
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext} to select a context
 * @see {@link Mizar#createContext} to create a context
 */
Mizar.prototype.setBackgroundLayerByID = function (layerID, mode) {
  let result;
  try {
    const gwLayer = _getContext.call(this, mode).setBackgroundLayerByID(layerID);
    result = typeof gwLayer !== "undefined";
  } catch (e) {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot set the backgorund by ID", e.message);
  }
  return result;
};

/**
 * Sets the base elevation by its layer's name according to the {@link CONTEXT context}.<br/>
 * When no context is specified, then the function is applied on the selected context.
 * <b>Note:</b> The layer must be {@link Mizar#addLayer added} before
 * @function setBaseElevation
 * @param {string} layerName - Name of the layer
 * @param {CONTEXT|undefined} mode - Context on which the function is applied
 * @returns {boolean} true when the base elevation is set otherwise false
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext}
 * @see {@link Mizar#createContext}
 */
Mizar.prototype.setBaseElevation = function (layerName, mode) {
  let result;
  try {
    const layer = this.getLayerByName(layerName, mode);
    const gwLayer = _getContext.call(this, mode).setBaseElevation(layer);
    result = typeof gwLayer !== "undefined";
  } catch (e) {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot set the base elevation", e.message);
  }
  return result;
};

/**
 * Gets the base elevation to the {@link CONTEXT context}.<br/>
 * When no context is specified, then the function is applied on the selected context.
 * @function getBaseElevation
 * @param {CONTEXT|undefined} mode - Context on which the function is applied
 * @returns {WCSElevationLayer|null} true when the base elevation is set otherwise false
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext}
 * @see {@link Mizar#createContext}
 */
Mizar.prototype.getBaseElevation = function (mode) {
  return _getContext.call(this, mode).getBaseElevation();
};

/**
 * Sets the base elevation by its layer's ID according to the {@link CONTEXT context}.<br/>
 * When no context is specified, then the function is applied on the selected context.
 * <b>Note:</b> The layer must be {@link Mizar#addLayer added} before
 * @function setBaseElevation
 * @param {string} layerID - ID of the layer
 * @param {CONTEXT|undefined} mode - Context on which the function is applied
 * @returns {boolean} true when the base elevation is set otherwise false
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext}
 * @see {@link Mizar#createContext}
 */
Mizar.prototype.setBaseElevationByID = function (layerID, mode) {
  let result;
  try {
    const gwLayer = _getContext.call(this, mode).setBaseElevationByID(layerID);
    result = typeof gwLayer !== "undefined";
  } catch (e) {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot set the base elevation by ID", e.message);
  }
  return result;
};

/**
 * Looks through each value in the list according to the context, returning an array of all the values that match the query.<br/>
 * The query is performed on the name and the description of each layer.<br/>
 * When no context is specified, the function is applied on the selected context.
 * @function searchOnLayerDescription
 * @param {string} query - query on the layer'name or description
 * @param {CONTEXT|undefined} mode - Context on which the query is run.
 * @returns {Layer[]}
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext}
 * @see {@link Mizar#createContext}
 */
Mizar.prototype.searchOnLayerDescription = function (query, mode) {
  const layers = this.getLayers(mode);
  return _.filter(layers, function (layer) {
    return String(layer.getName()).indexOf(query) >= 0 || String(layer.getDescription() || "").indexOf(query) >= 0;
  });
};

/**
 * Looks through each value in the sky layers, returning an array of all the values that match the query.<br/>
 * The query is performed on the name and the description of each layer
 * @function searchSkyLayer
 * @param {string} query - query on the layer's name or description
 * @returns {Layer[]} An array of layers matching the constraint
 * @memberof Mizar#
 */
Mizar.prototype.searchSkyLayer = function (query) {
  const layers = this.getSkyLayers();
  return _.filter(layers, function (layer) {
    return String(layer.getName()).indexOf(query) >= 0 || String(layer.getDescription() || "").indexOf(query) >= 0;
  });
};

/**
 * Looks through each value in the planets layers, returning an array of all the values that match the query.<br/>
 * The query is performed on the name and the description of each layer
 * @function searchPlanetLayer
 * @param {string} query - query on the layer'name or description
 * @returns {Layer[]} An array of layers matching the constraint
 * @memberof Mizar#
 */
Mizar.prototype.searchPlanetLayer = function (query) {
  const layers = this.getPlanetLayers();
  //Search by name
  return _.filter(layers, function (layer) {
    return String(layer.getName()).indexOf(query) >= 0 || String(layer.getDescription() || "").indexOf(query) >= 0;
  });
};

//               ***************************** Utility management *****************************

/**
 * Registers no standard data provider in a predefined context.<br/>
 * When no context is specified, the function is applied to the selected context.
 * @function registerNoStandardDataProvider
 * @param {string} type - data provider key
 * @param {Function} loadFunc - Function to convert the data
 * @param {CONTEXT|undefined} mode - Context
 * @returns {boolean} true when data provider is registered otherwise false
 * @memberof Mizar#
 * @see {@link Mizar#setActivatedContext}
 * @see {@link Mizar#createContext}
 * @example <caption>Registers planets on the sky</caption>
 *   var planetProvider = ProviderFactory.create(Mizar.PROVIDER.Planet);
 *   this.registerNoStandardDataProvider("planets", planetProvider.loadFiles);
 */
Mizar.prototype.registerNoStandardDataProvider = function (type, loadFunc, mode) {
  let result;
  try {
    _getContext.call(this, mode).registerNoStandardDataProvider(type, loadFunc);
    result = true;
  } catch (e) {
    result = false;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot register the data provider", e.message);
  }
  return result;
};

/**
 * Returns the service based on its name
 * @param {SERVICE} serviceName
 * @param {Object} options - options for the service
 * @memberof Mizar#
 * @returns {Object|null} - the service
 */
Mizar.prototype.getServiceByName = function (serviceName, options) {
  let result;
  try {
    result = ServiceFactory.create(serviceName, options);
  } catch (e) {
    result = null;
    ErrorDialog.open(Constants.LEVEL.ERROR, "Cannot get the service by name", e.message);
  }
  return result;
};

/**
 * Creates and get Stats Object
 * @function createStats
 * @param {Object} options - Configuration properties for stats.
 * @param {string|object} options.element div ID ou jquery element in wich the stats are written
 * @param {boolean} [options.verbose=false] detailled display when verbose=true
 * @return {Stats}
 * @memberof Mizar#
 * @see {@link Stats}
 */
Mizar.prototype.createStats = function (options) {
  let result;
  if (this.skyContext) {
    this.Stats = new Stats(this.skyContext, options);
    result = true;
  } else if (this.planetContext) {
    this.Stats = new Stats(this.planetContext, options);
    result = true;
  } else if (this.groundContext) {
    this.Stats = new Stats(this.groundContext, options);
    result = true;
  } else {
    result = false;
    ErrorDialog.open("Cannot create the stats", true);
  }
  return result;
};

//               ***************************** Rendering management *****************************

/**
 * Renders the canvas.
 * @returns {boolean} true when the canvas is rendered otherwise false
 * @function render
 * @memberof Mizar#
 * @fires Context#startLoad
 * @fires Context#endLoad
 * @fires Context#baseLayersReady
 * @fires Context#baseLayersError
 * @fires Context#startBackgroundLoad
 * @fires Context#endBackgroundLoad
 * @fires Context#features:added
 */
Mizar.prototype.render = function () {
  let result;
  const renderContext = this.getRenderContext();
  if (renderContext) {
    this.getRenderContext().frame();
    result = true;
  } else {
    result = false;
  }
  return result;
};

//               ***************************** Memory management *****************************

/**
 * Disposes the Mizar's contexts (planet, sky and ground).
 *
 * Reset the {@link TileManager} and delete texture for each defined context.
 * @function dispose
 * @memberof Mizar#
 */
Mizar.prototype.dispose = function () {
  if (this.planetContext) {
    this.planetContext.dispose();
  }
  if (this.skyContext) {
    this.skyContext.dispose();
  }
  if (this.groundContext) {
    this.groundContext.dispose();
  }
};

/**
 * Reload a layer (keep id and ID)
 * @function reloadLayer
 * @memberof Mizar#
 */
Mizar.prototype.reloadLayer = function (layer) {
  const ctx = this.getActivatedContext();
  if (ctx) {
    const tileManager = ctx.getTileManager();
    tileManager.abortLayerRequests(layer);
    layer._detach(ctx.globe);
    layer._attach(ctx.globe);
  } else {
    ErrorDialog.open(Constants.LEVEL.WARNING, "Context not yet available");
  }
};

/**
 * Destroys Mizar
 *
 * @function destroy
 * @memberof Mizar#
 */
Mizar.prototype.destroy = function () {
  if (this.planetContext) {
    this.planetContext.destroy();
  }
  if (this.skyContext) {
    this.skyContext.destroy();
  }
  if (this.groundContext) {
    this.groundContext.destroy();
  }
  this.activatedContext = null;
  this.renderContext = null;
  this.ContextFactory = null;
  this.LayerFactory = null;
  this.AnimationFactory = null;
  this.ServiceFactory = null;
  this.UtilityFactory = null;
};

// Make object MIZAR available in caller web page
window.Mizar = Mizar;

export default Mizar;
