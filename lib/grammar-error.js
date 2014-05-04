var utils = require("./utils");

/* Thrown when the grammar contains an error. */
function GrammarError(message) {
  this.name = "GrammarError";
  this.message = message;
}

utils.subclass(GrammarError, Error);

module.exports = GrammarError;
