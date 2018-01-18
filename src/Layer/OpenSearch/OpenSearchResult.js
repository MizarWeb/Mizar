/*******************************************************************************
 * Copyright 2017 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
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
/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/
define(["jquery"],
    function ($) {

        /**
         * @name OpenSearchResult
         * @class
         * This layer stock the metadata information of an openSearch result
         * @memberOf module:Layer
         */
          var OpenSearchResult = function () {
            this.nbFound = 0;
            this.startIndex = 0;
            this.nbReturned = 0;
            document.myOpenSearchResult = this;
        };

        /**************************************************************************************************************/

        OpenSearchResult.prototype.consoleMe = function () {
            console.log("OpenSearch result : ");
            console.log("  "+this.nbReturned + " returned on "+this.nbFound+" found / Start at "+this.startIndex);
            console.log("  nbPages : "+this.nbPages);
            console.log("  numPage : "+this.currentPage);
        }

        /*************************************************************************************************************/
        
        OpenSearchResult.prototype.parseResponse = function (response) {
            this.nbFound = response.properties.totalResults;
            this.nbReturned = response.features.length;
            this.startIndex = response.properties.startIndex;
            this.nbItemsPerPage = response.properties.itemsPerPage;
            
            // Number of pages
            this.nbPages = Math.ceil(this.nbFound / this.nbItemsPerPage);
            // Current page
            this.currentPage = Math.floor((this.startIndex-1) / this.nbItemsPerPage)+1;

        }
        
        /*************************************************************************************************************/

        OpenSearchResult.prototype.getGuiPages = function (start,end,current) {
            var content = "";
            for (var i=start;i<=end;i++) {
                content += "&nbsp";
                if (i === current) {
                    content += "<b>"+i+"</b>";
                } else {
                    content += "<a style='color: #FFFFFF;text-decoration: none;' onclick='document.currentOpenSearchLayer.goToPage("+i+");'>"+i+"</a>";
                }
            }
            return content;
        }

        OpenSearchResult.prototype.updateGUI = function (message) {
            var content = "";
            var i;
            content += this.nbReturned+" footprints loaded on the fov (on "+this.nbFound+")  <Load more>";
            /*
            // If we have less than 10 pages, draw alls
            if (this.nbPages<10) {
                content += this.getGuiPages(1,this.nbPages,this.currentPage);
            } else {
                content += this.getGuiPages(1,2,this.currentPage);
                // Draw only interesting pages
                if (this.currentPage <= 6) {
                    content += this.getGuiPages(3,6,this.currentPage);
                    content += "&nbsp;...";
                    
                } else {
                    content += "&nbsp;...";
                    if ((this.nbPage-this.currentPage)<=6) {
                        content += this.getGuiPages(this.nbPage-6,this.nbPage-2,this.currentPage);
                    } else {
                        content += this.getGuiPages(this.currentPage-2,this.currentPage+2,this.currentPage);
                        content += "&nbsp;...";
                        
                    }
                }
                content += this.getGuiPages(this.nbPages-1,this.nbPages,this.currentPage);
            }
            */
            $("#resultNavigation").html(content);
        }

        /*************************************************************************************************************/
        
        return OpenSearchResult;

    });
