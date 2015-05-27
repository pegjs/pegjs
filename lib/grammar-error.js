var classes = require("./utils/classes");

/* Thrown when the grammar contains an error. */
function GrammarError(message, location) {
  var err;

  this.name = "GrammarError";
  this.message = message;
  this.location = location;

  if (typeof Error.captureStackTrace !== "function") {
    err = new Error(message);
    if (typeof Object.defineProperty === "function") {
      Object.defineProperty(this, "stack", {
        get: function () {
          return err.stack;
        }
      });
    } else {
      this.stack = err.stack;
    }
  } else {
    Error.captureStackTrace(this, GrammarError);
  }
}

classes.subclass(GrammarError, Error);

module.exports = GrammarError;
