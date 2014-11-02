var GrammarError = require("../../grammar-error"),
    arrays       = require("../../utils/arrays"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/* Checks that all referenced rules exist. */
function reportMissingRules(ast) {
  var check = visitor.build({
    rule: function(node) {
      check(node.expression, node.params);
    },
    rule_ref: function(node, templateParams) {
      // If this is reference to template parameter, skip it.
      if (arrays.contains(templateParams, node.name)) {
        return;
      }
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
