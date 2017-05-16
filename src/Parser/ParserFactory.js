define([ "./KMLParser"],
    function (KMLParser) {

    /**
     @name ParserFactory
     @class
     Parser Factory
    */
    var ParserFactory = function () {
    };

    /**
     Get the KML Parser
     @function getKML
     @memberof ParserFactory.prototype
     @return {KMLParser} KML parser
    */
    ParserFactory.prototype.getKML = function () {
        return KMLParser;
    };

    /**************************************************************************************************************/

    return ParserFactory;

});
