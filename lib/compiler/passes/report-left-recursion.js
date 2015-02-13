var arrays       = require("../../utils/arrays"),
    GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/* Checks that no left recursion is present. */
function reportLeftRecursion(ast) {
  var check = visitor.build({
    rule: function(node, appliedRules) {
      check(node.expression, appliedRules.concat(node.name));
    },

    sequence: function(node, appliedRules) {
      check(node.elements[0], appliedRules);
    },

    rule_ref: function(node, appliedRules) {
      if (arrays.contains(appliedRules, node.name)) {
        throw new GrammarError(
          "Left recursion detected for rule \"" + node.name + "\".",
          node.region
        );
      }
      check(asts.findRule(ast, node.name), appliedRules);
    }
  });

  check(ast, []);
}

module.exports = reportLeftRecursion;
