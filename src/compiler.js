PEG.compiler = {
  /*
   * Generates a parser from a specified grammar AST. Throws |PEG.GrammarError|
   * if the AST contains a semantic error. Note that not all errors are detected
   * during the generation and some may protrude to the generated parser and
   * cause its malfunction.
   */
  compile: function(ast) {
    var PASS_NAMES = [
      "reportMissingRules",
      "reportLeftRecursion",
      "removeProxyRules",
      "computeStackDepths"
    ];

    for (var i = 0; i < PASS_NAMES.length; i++) {
      this.passes[PASS_NAMES[i]](ast);
    }

    var source = this.emitter(ast);
    var result = eval(source);
    result._source = source;

    return result;
  }
};

// @include "passes.js"
// @include "emitter.js"
