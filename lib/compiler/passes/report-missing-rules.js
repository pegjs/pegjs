var GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/* Checks that all referenced rules exist. */
function reportMissingRules(ast) {
  var check = visitor.build({
    rule_ref: function(node) {
      if (!asts.findRule(ast, node.name)) {
        var grammarError =  new GrammarError(
          "Referenced rule \"" + node.name + "\" does not exist."
        );
        grammarError.location = node.location;
        throw grammarError;
      }
    }
  });

  check(ast);
}

module.exports = reportMissingRules;
