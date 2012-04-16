/*
 * PEG.js @VERSION
 *
 * http://pegjs.majda.cz/
 *
 * Copyright (c) 2010-2012 David Majda
 * Licensend under the MIT license.
 */
(function(undefined) {

var PEG = {
  /* PEG.js version. */
  VERSION: "@VERSION",

  /*
   * Generates a parser from a specified grammar and returns it.
   *
   * The grammar must be a string in the format described by the metagramar in
   * the parser.pegjs file.
   *
   * Throws |PEG.parser.SyntaxError| if the grammar contains a syntax error or
   * |PEG.GrammarError| if it contains a semantic error. Note that not all
   * errors are detected during the generation and some may protrude to the
   * generated parser and cause its malfunction.
   */
  buildParser: function(grammar, options) {
    return PEG.compiler.compile(PEG.parser.parse(grammar), options);
  }
};

/* Thrown when the grammar contains an error. */

PEG.GrammarError = function(message) {
  this.name = "PEG.GrammarError";
  this.message = message;
};

PEG.GrammarError.prototype = Error.prototype;

// @include "utils.js"
// @include "parser.js"
// @include "compiler.js"

if (typeof module === "object") {
  module.exports = PEG;
} else if (typeof window === "object") {
  window.PEG = PEG;
} else {
  throw new Error("Can't export PEG library (no \"module\" nor \"window\" object detected).");
}

})();
