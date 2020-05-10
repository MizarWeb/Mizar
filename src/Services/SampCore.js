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
 * SampCore Module : containing core methods
 */
import $ from "jquery";
import "jquery-ui-bundle";
// import _ from "underscore";
import Constants from "../Utils/Constants";
// import JsonProcessor from "../Parser/JsonProcessor";
import ErrorDialog from "../Gui/dialog/ErrorDialog";
import "../../external/sampjs/samp";

let mizar;
let connector; // SAMP connector
// var pointAtReceived = false; // Parameter avoiding looping while receiving coord.pointAt.sky SAMP event
//var votable2geojsonBaseUrl;

/**************************************************************************************************************/

/**
 *    Create SAMP ClientTracker object which handles incoming messages
 */
function createClientTracker() {
  // Initialize client tracker
  const clientTracker = new samp.ClientTracker();

  // Init available samp income message handlers(as ping, load.votable..)
  const callHandler = clientTracker.callHandler;
  callHandler["samp.app.ping"] = function (senderId, message, isCall) {
    if (isCall) {
      return {
        text: "ping to you, " + clientTracker.getName(senderId)
      };
    }
  };

  callHandler["table.load.votable"] = function (senderId, message, isCall) {
    //if (votable2geojsonBaseUrl) {
    //TODO : convert in GeoJson
    //var params = message["samp.params"];
    //var origUrl = params.url;
    //var proxyUrl = clientTracker.connection.translateUrl(origUrl);
    //Utils.convertVotable2JsonFromURL(proxyUrl, function (response) {
    // Add feature collection
    //    JsonProcessor.handleFeatureCollection(sampLayer, response);
    //    sampLayer.addFeatureCollection(response);
    //});
    //} else {
    ErrorDialog.open(Constants.LEVEL.ERROR, "votable2geojson plugin base url isn't defined");
    //}
  };

  // callHandler["table.highlight.row"] = function(senderId, message, isCall) {
  // 	var params = message["samp.params"];
  // 	var url = params['url'];
  // 	var row = params['row'];

  // 	if ( highlightedData )
  // 	{
  // 		highlightedData.layer.modifyFeatureStyle( highlightedData.feature, highlightedData.layer.style );
  // 	}

  // 	if ( tables[url] )
  // 	{
  // 		var layer = tables[url].layer;
  // 		var feature = tables[url].features[parseInt(row)];

  // 		layer.modifyFeatureStyle( feature, highlightStyle );
  // 		highlightedData = {
  // 			layer: layer,
  // 			feature: feature
  // 		}

  // 		var barycenter = Utils.computeGeometryBarycenter( feature.geometry );
  // 		navigation.zoomTo( barycenter, (navigation.renderContext.fov < 1. ? navigation.renderContext.fov : 1.), 300. );
  // 	}
  // };

  callHandler["image.load.fits"] = function (senderId, message, isCall) {
    // var params = message["samp.params"];
    //
    // // Create feature
    // var feature = {
    //     "geometry": {
    //         "gid": params.name,
    //         "coordinates": [],
    //         "type": "Polygon"
    //     },
    //     "properties": {
    //         "identifier": params.name
    //     },
    //     "services": {
    //         "download": {
    //             "mimetype": "image/fits",
    //             "url": params['image-id']
    //         }
    //     },
    //     "type": "Feature"
    // };
    //
    // // Get fits texture from url
    // var featureData = {
    //     layer: sampLayer,
    //     feature: feature,
    //     isFits: true
    // };
    // var url = sitoolsBaseUrl + "/proxy?external_url=" + encodeURIComponent(params['image-id']);
    // mizar.publish("image:add", featureData);
    // imageManager.computeFits(featureData, url, function (featureData, fits) {
    //     // Update feature coordinates according to Fits header
    //     var coords = Utils.getPolygonCoordinatesFromFits(fits);
    //     featureData.feature.geometry.coordinates = [coords];
    //     sampLayer.addFeature(featureData.feature);
    // });
  };

  callHandler["coord.pointAt.sky"] = function (senderId, message, isCall) {
    pointAtReceived = true;
    const params = message["samp.params"];
    const ra = parseFloat(params.ra);
    const dec = parseFloat(params.dec);
    const navigation = mizar.getActivatedContext().getNavigation();
    navigation.zoomTo([ra, dec]);
  };

  callHandler["samp.hub.event.unregister"] = function (senderId, message, isCall) {
    // Update jQuery UI buttons
    $("#registerSamp").removeAttr("disabled").button("refresh");
    $("#unregisterSamp").attr("disabled", "disabled").button("refresh");
    $("#sampInvoker").toggleClass("selected");
  };

  return clientTracker;
}

/**************************************************************************************************************/

/**
 *    Init SAMP connector
 */
function initSamp(mizarAPI) {
  mizar = mizarAPI;
  const clientTracker = createClientTracker();

  // Samp event callbacks
  const logCc = {
    receiveNotification: function (senderId, message) {
      clientTracker.receiveNotification(senderId, message);
      if (message["samp.mtype"] === "samp.hub.event.subscriptions") {
        // Update jQuery UI buttons
        $("#unregisterSamp").removeAttr("disabled").button("refresh");
        $("#registerSamp").attr("disabled", "disabled").button("refresh");
        $("#sampInvoker").addClass("selected");
      }
    },
    receiveCall: function (senderId, msgId, message) {
      clientTracker.receiveCall(senderId, msgId, message);
    },
    receiveResponse: function (responderId, msgTag, response) {
      clientTracker.receiveResponse(responderId, msgTag, response);
    },
    init: function (connection) {
      clientTracker.init(connection);
    }
  };

  // Meta-data
  const meta = {
    "samp.name": "Mizar",
    "samp.description.text": "Module for Interactive visualiZation from Astronomical Repositories",
    "mizar.version": "v1.0",
    "author.affiliation": "CNES/TPZ",
    "home.page": "http://github.com/MizarWeb"
  };

  // Generate subscriptions map
  const subs = clientTracker.calculateSubscriptions();

  connector = new samp.Connector("Mizar", meta, logCc, subs);

  // Uncomment for automatic registration(check every 2 sec if Hub is available)
  // Adjusts page content depending on whether the hub exists or not.
  // var configureSampEnabled = function(isHubRunning) {
  //     // TODO
  // };
  // connector.onHubAvailability(configureSampEnabled, 2000);

  // Registration status element is updated by samp.js
  connector.regTextNodes.push($("#sampResult")[0]);

  return connector;
}

/**************************************************************************************************************/

export default {
  initSamp: initSamp,
  sendImage: function (url) {
    if (this.isConnected()) {
      // Send message
      const msg = new samp.Message("image.load.fits", {
        url: url
      });
      connector.connection.notifyAll([msg]);
      return "Image has been sent";
    } else {
      return "Connect to SAMP Hub first";
    }
  },

  sendVOTable: function (layer, url) {
    if (this.isConnected()) {
      // Send message
      const msg = new samp.Message("table.load.votable", {
        url: url + "&media=votable"
      });
      connector.connection.notifyAll([msg]);

      // Part used to highlighting
      // $.ajax({
      // 	type: "GET",
      // 	url: url,
      // 	success: function(response) {

      // 		if ( response.totalResults > 0 )
      // 		{
      // 			// Store table to be able to highlight features later
      // 			tables[ url+'&media=votable' ] = {
      // 				layer: layer,
      // 				features: []
      // 			};
      // 			for ( var i=0; i<response.features.length; i++ )
      // 			{
      // 				var feature = response.features[i];
      // 				tables[url+'&media=votable'].features.push(feature);
      // 			}
      // 		}
      // 		// Send message
      // 		var msg = new samp.Message("table.load.votable", {url: url+"&media=votable"});
      // 		connector.connection.notifyAll([msg]);
      // 	},
      // 	error: function(thrownError)
      // 	{
      // 		console.error(thrownError);
      // 	}
      // });
      return "VOTable has been sent";
    } else {
      return "Connect to SAMP Hub first";
    }
  },

  // Commented part is used for highlighting feature which wasn't implemented due to
  // difficulty of SAMP protocol (client doesn't know the feature from row)
  highlightFeature: function (layer, feature) {
    /**if (this.isConnected()) {
                // for ( var url in tables )
                // {
                // 	var table = tables[url];
                // 	if ( layer == table.layer )
                // 	{
                // 		var featureToHighlight = _.filter( table.features, function(x){ return(feature.properties.identifier == x.properties.identifier) } );
                // 		if ( featureToHighlight.length )
                // 		{
                // var featureRow = table.features.indexOf(featureToHighlight[0]);
                // var msg = new samp.Message("table.highlight.row", {url: url, row: featureRow.toString()});
                // connector.connection.notifyAll([msg]);
                // 		}
                // 	}
                // }
            }
            */
  },
  isConnected: function () {
    return connector.connection;
  }
};
