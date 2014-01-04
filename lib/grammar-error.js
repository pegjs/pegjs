var utils = require("./utils");

/* Thrown when the grammar contains an error. */
module.exports = function(message, region) {
  this.name = "GrammarError";
  this.region = region;
  this.message = buildMessage();
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  }

  function buildMessage() {
    if (region)
      return "Line "+region.begin.line+", column "+region.begin.column+": "+message;
    return message;
  }
};

utils.subclass(module.exports, Error);
