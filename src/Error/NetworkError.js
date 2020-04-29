var NetworkError = function () {
  var superInstance = Error.apply(null, arguments);
  this.name = "NetworkError";
  this.code = arguments.length > 2 ? arguments[2] : null;
  copyOwnPropertiesFrom(this, superInstance);
  this.layerDescription = null;
};

function copyOwnPropertiesFrom(target, source) {
  Object.getOwnPropertyNames(source).forEach(function (propKey) {
    var desc = Object.getOwnPropertyDescriptor(source, propKey);
    Object.defineProperty(target, propKey, desc);
  });
  return target;
}

NetworkError.prototype = Object.create(Error.prototype);

NetworkError.prototype.constructor = NetworkError;

NetworkError.prototype.setLayerDescription = function (layerDescription) {
  this.layerDescription = layerDescription;
};

NetworkError.prototype.getLayerDescription = function () {
  return this.layerDescription;
};

export default NetworkError;
