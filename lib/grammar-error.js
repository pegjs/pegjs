var classes = require("./utils/classes");

/* Thrown when the grammar contains an error. */
function GrammarError(message, region) {
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
}

classes.subclass(GrammarError, Error);

module.exports = GrammarError;
