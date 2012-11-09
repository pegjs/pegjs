/*
 * PEG.js 0.7.0
 *
 * http://pegjs.majda.cz/
 *
 * Copyright (c) 2010-2012 David Majda
 * Licensed under the MIT license.
 */
var PEG = (function(undefined) {

// @include "utils.js"

var PEG = {
  /* PEG.js version (uses semantic versioning). */
  VERSION: "0.7.0",

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
  this.name = "GrammarError";
  this.message = message;
};

subclass(PEG.GrammarError, Error);

// @include "parser.js"
// @include "compiler.js"

return PEG;

})();

if (typeof module !== "undefined") {
  module.exports = PEG;
}
