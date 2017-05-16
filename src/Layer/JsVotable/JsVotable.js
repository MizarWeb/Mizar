/*******************************************************************************
 * Copyright 2016 - Jean-Christophe Malapert
 *
 * This file is part of JsVotable.
 *
 * JsVotable is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * JsVotable is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JVotable.  If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
define( ["./votable","./binary","./binary2","./coosys","./data","./definitions","./description","./field","./fieldref",
    "./fits","./group","./info","./link","./max","./min","./option","./param","./paramref","./resource","./stream",
    "./table","./tabledata","./td","./tr","./values"],
    function(Votable, Binary, Binary2, Coosys, Data, Definitions, Description, Field, Fieldref, Fits, Group, Info, Link,
    Max, Min, Option, Param, Paramref,Resource, Stream, Table, TableData, Td, Tr, Values) {

    var JsVotable = {};

    JsVotable.Votable = Votable;
    JsVotable.Binary = Binary;
    JsVotable.Binary2 = Binary2;
    JsVotable.Coosys = Coosys;
    JsVotable.Data = Data;
    JsVotable.Definitions = Definitions;
    JsVotable.Description = Description;
    JsVotable.Field = Field;
    JsVotable.Fieldref = Fieldref;
    JsVotable.Fits = Fits;
    JsVotable.Group = Group;
    JsVotable.Info = Info;
    JsVotable.Link = Link;
    JsVotable.Max = Max;
    JsVotable.Min = Min;
    JsVotable.Option = Option;
    JsVotable.Param = Param;
    JsVotable.Paramref = Paramref;
    JsVotable.Resource = Resource;
    JsVotable.Stream = Stream;
    JsVotable.Table = Table;
    JsVotable.TableData = TableData;
    JsVotable.Td = Td;
    JsVotable.Tr = Tr;
    JsVotable.Values = Values;
    JsVotable.version = {
        major : 1,
        minor : 1,
        patch : 0,
        date : "2016-10-12",
        toString : function () {
            return this.major+ "." + this.minor + "." + this.patch;
        }
    };

    window.JsVotable = JsVotable;

    return JsVotable;
});
