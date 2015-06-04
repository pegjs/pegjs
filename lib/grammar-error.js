"use strict";

var classes = require("./utils/classes");

/* Thrown when the grammar contains an error. */
function GrammarError(message, location) {
  this.name = "GrammarError";
  this.message = message;
  this.location = location;
}

classes.subclass(GrammarError, Error);

module.exports = GrammarError;
