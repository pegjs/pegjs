var utils = require("./utils");

module.exports = {
  passes: require("./compiler/passes"),

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
  compile: function(ast, options) {
    if (options === undefined) { options = {}; }

    var that   = this,
        output = options.output !== undefined ? options.output : "parser";

    utils.each(this.appliedPassNames, function(passName) {
      that.passes[passName](ast, options);
    });

    switch (output) {
      case "parser": return eval(ast.code);
      case "source": return ast.code;
    }
  }
};
