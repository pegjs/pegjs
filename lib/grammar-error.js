var utils = require("./utils");

/* Thrown when the grammar contains an error. */
module.exports = function(message, problems) {
  this.name = "GrammarError";
  this.message = message;
  this.problems = problems;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this);
  }
};

utils.subclass(module.exports, Error);
