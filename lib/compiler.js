var utils = require("./utils");

module.exports = {
  /*
   * Compiler passes.
   *
   * Each pass is a function that is passed the AST. It can perform checks on it
   * or modify it as needed. If the pass encounters a semantic error, it throws
   * |PEG.GrammarError|.
   */
  passes: {
    reportMissingRules:  require("./compiler/passes/report-missing-rules"),
    reportLeftRecursion: require("./compiler/passes/report-left-recursion"),
    removeProxyRules:    require("./compiler/passes/remove-proxy-rules"),
    generateBytecode:    require("./compiler/passes/generate-bytecode"),
    generateJavascript:  require("./compiler/passes/generate-javascript")
  },

  /*
   * Names of passes that will get run during the compilation (in the specified
   * order).
   */
  appliedPassNames: [
    "reportMissingRules",
    "reportLeftRecursion",
    "removeProxyRules",
    "generateBytecode",
    "generateJavascript"
  ],

  /*
   * Generates a parser from a specified grammar AST. Throws |PEG.GrammarError|
   * if the AST contains a semantic error. Note that not all errors are detected
   * during the generation and some may protrude to the generated parser and
   * cause its malfunction.
   */
  compile: function(ast) {
    var that    = this,
        options = arguments.length > 1 ? utils.clone(arguments[1]) : {};

    utils.defaults(options, {
      allowedStartRules:  [ast.rules[0].name],
      cache:              false,
      optimize:           "speed",
      output:             "parser"
    });

    utils.each(this.appliedPassNames, function(passName) {
      that.passes[passName](ast, options);
    });

    switch (options.output) {
      case "parser": return eval(ast.code);
      case "source": return ast.code;
    }
  }
};
