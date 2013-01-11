var utils = require("./utils");

module.exports = {
  /* PEG.js version (uses semantic versioning). */
  VERSION: "0.7.0",

  GrammarError: require("./grammar-error"),
  parser:       require("./parser"),
  compiler:     require("./compiler"),

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
    return this.compiler.compile(
      this.parser.parse(grammar),
      utils.values(this.compiler.passes),
      options
    );
  }
};
