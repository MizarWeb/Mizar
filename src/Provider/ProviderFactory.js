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
define(["./ConstellationProvider","./PlanetProvider","./StarProvider","./CraterProvider","./TrajectoryProvider","../Utils/Constants"],
    function(ConstellationProvider, PlanetProvider, StarProvider, CraterProvider, TrajectoryProvider, Constants) {
        

    return {
        
        create : function(type, options) {
            var obj;
            switch(type) {
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
                    throw new RangeError("unable to create the provider "+type, "ProviderFactory.js");
            }
            return obj;
        }
        
    };
    
});
