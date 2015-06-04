"use strict";

var arrays       = require("../../utils/arrays"),
    GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/*
 * Reports left recursion in the grammar, which prevents infinite recursion in
 * the generated parser.
 *
 * Both direct and indirect recursion is detected. The pass also correctly
 * reports cases like this:
 *
 *   start = "a"? start
 *
 * In general, if a rule reference can be reached without consuming any input,
 * it can lead to left recursion.
 */
function reportLeftRecursion(ast) {
  var check = visitor.build({
    rule: function(node, visitedRules) {
      check(node.expression, visitedRules.concat(node.name));
    },

    sequence: function(node, visitedRules) {
      arrays.every(node.elements, function(element) {
        if (element.type === "rule_ref") {
          check(element, visitedRules);
        }

        return asts.matchesEmpty(ast, element);
      });
    },

    rule_ref: function(node, visitedRules) {
      if (arrays.contains(visitedRules, node.name)) {
        throw new GrammarError(
          "Left recursion detected for rule \"" + node.name + "\".",
          node.location
        );
      }

      check(asts.findRule(ast, node.name), visitedRules);
    }
  });

  check(ast, []);
}

module.exports = reportLeftRecursion;
