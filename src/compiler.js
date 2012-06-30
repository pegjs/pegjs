PEG.compiler = {
  /*
   * Names of passes that will get run during the compilation (in the specified
   * order).
   */
  appliedPassNames: [
    "reportMissingRules",
    "reportLeftRecursion",
    "removeProxyRules",
    "computeVarIndices",
    "computeParams",
    "generateCode"
  ],

  /*
   * Generates a parser from a specified grammar AST. Throws |PEG.GrammarError|
   * if the AST contains a semantic error. Note that not all errors are detected
   * during the generation and some may protrude to the generated parser and
   * cause its malfunction.
   */
  compile: function(ast, options) {
    var that = this;

    each(this.appliedPassNames, function(passName) {
      that.passes[passName](ast, options);
    });

    var source = ast.code;
    var result = eval(source);
    result._source = source;

    return result;
  }
};

// @include "compiler/passes.js"
