var classes = require("./utils/classes");

/* Thrown when the grammar contains an error. */
function GrammarError(message) {
  this.name = "GrammarError";
  this.message = message;
}

classes.subclass(GrammarError, Error);

module.exports = GrammarError;
