/** @constructor */
function CustomError(plugin, msg) {
  var superError = Error.call(this) || this;
  Error.captureStackTrace(superError, this.constructor);
  superError.name = 'Error';
  superError.message = msg;
  return superError;
}
CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.name = 'Error';

var PluginError;
try {
  PluginError = require('gulp-util').PluginError;
} catch(e) {
  PluginError = CustomError;
}

module.exports = PluginError;
