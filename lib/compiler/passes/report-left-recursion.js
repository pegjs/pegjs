var arrays       = require("../../utils/arrays"),
    GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/* Checks that no left recursion is present. */
function reportLeftRecursion(ast) {
  var check = visitor.build({
    rule: function(node, appliedRules) {
      check(node.expression, appliedRules.concat(node.name), node.params);
    },

    sequence: function(node, appliedRules, templateParams) {
      check(node.elements[0], appliedRules, templateParams);
    },

    rule_ref: function(node, appliedRules, templateParams) {
      // If this is reference to template parameter, skip it.
      if (arrays.contains(templateParams, node.name)) {
        return;
      }
      if (arrays.contains(appliedRules, node.name)) {
        throw new GrammarError(
          "Left recursion detected for rule \"" + node.name + "\"."
        );
      }
      check(asts.findRule(ast, node.name), appliedRules);
    }
  });

  check(ast, []);
}

module.exports = reportLeftRecursion;
