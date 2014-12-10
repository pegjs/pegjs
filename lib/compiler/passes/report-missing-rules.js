var GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/* Checks that all referenced rules exist. */
function reportMissingRules(ast) {
  var check = visitor.build({
    rule_ref: function(node) {
      // Check existance only for rules, defined in this grammar.
      if (node.namespace)
        return;

      if (!asts.findRule(ast, node.name)) {
        throw new GrammarError(
          "Referenced rule \"" + node.name + "\" does not exist."
        );
      }
    }
  });

  check(ast);
}

module.exports = reportMissingRules;
