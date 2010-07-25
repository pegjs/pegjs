/* ===== PEG.compiler ===== */

PEG.compiler = {
  /*
   * Generates a parser from a specified grammar AST. Throws |PEG.GrammarError|
   * if the AST contains a semantic error. Note that not all errors are detected
   * during the generation and some may protrude to the generated parser and
   * cause its malfunction.
   */
  compile: function(ast) {
    for (var i = 0; i < this.checks.length; i++) {
      this.checks[i](ast);
    }

    for (var i = 0; i < this.passes.length; i++) {
      ast = this.passes[i](ast);
    }

    var source = this.emitter(ast);
    var result = eval(source);
    result._source = source;

    return result;
  }
};

/* ===== Includes ===== */

// @include "checks.js"
// @include "passes.js"
// @include "emitter.js"
