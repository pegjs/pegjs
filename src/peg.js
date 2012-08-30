/*
 * PEG.js @VERSION
 *
 * http://pegjs.majda.cz/
 *
 * Copyright (c) 2010-2012 David Majda
 * Licensend under the MIT license.
 */
var PEG = (function(undefined) {

var PEG = {
  /* PEG.js version (uses semantic versioning). */
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
    if (options && options.coffee) {
      /* We need to test if we are in the browser */
      if (typeof require == "function" && typeof module !== "undefined") {
        /* Node.js */
        if(typeof CoffeeScript == "undefined"){
          options.compiler = require('coffee-script');
        }
        else options.compiler = CoffeeScript;
      }
      else {
        /* Browser */
        if(window.CoffeeScript == null){
          throw new Error('This is a browser environment; you must include the CoffeeScript compiler before PEGjs');
        }
        else options.compiler = window.CoffeeScript;
      }
    }
    return PEG.compiler.compile(PEG.parser.parse(grammar,options), options);
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

return PEG;

})();

if (typeof module !== "undefined") {
  module.exports = PEG;
}
