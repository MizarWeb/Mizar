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
 * @name GlobeFactory
 * @class
 * Factory to create a globe.
 * @memberOf module:Globe
 */
define(["./Planet", "./Sky", "../Utils/Constants"], function(Planet, Sky, Constants){

    return {
        /**
         * Creates a specific globe based on its type (e.g sky, planet).
         * @param {GLOBE} type - the type of globe
         * @param {AbstractGlobe.configuration} options - options to configure a globe
         * @return {Globe} a globe
         * @alias module:Globe.GlobeFactory.create
         * @throws {RangeError} Will throw an error when the type is not part of {@link GLOBE}
         * @see {@link module:Globe.Planet Planet}
         * @see {@link module:Globe.Sky Sky}
         */
        create : function(type, options) {
            var obj;
            switch (type) {
                case Constants.GLOBE.Planet:
                    obj = new Planet(options);
                    break;
                case Constants.GLOBE.Sky:
                    obj = new Sky(options);
                    break;
                default:
                    throw RangeError("The type "+type+" is not allowed, A valid type is included in the list GLOBE", "GlobeFactory.js");
            }
            
            return obj;
        }
        
    };
    
});
