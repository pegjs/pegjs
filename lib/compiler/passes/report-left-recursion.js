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
  function matchesEmptyTrue()  { return true;  }
  function matchesEmptyFalse() { return false; }

  function matchesEmptyExpression(node) {
    return matchesEmpty(node.expression);
  }

  var matchesEmpty = visitor.build({
    rule: matchesEmptyExpression,

    choice: function(node) {
      return arrays.some(node.alternatives, matchesEmpty);
    },

    action: matchesEmptyExpression,

    sequence: function(node) {
      return arrays.every(node.elements, matchesEmpty);
    },

    labeled:      matchesEmptyExpression,
    text:         matchesEmptyExpression,
    simple_and:   matchesEmptyTrue,
    simple_not:   matchesEmptyTrue,
    optional:     matchesEmptyTrue,
    zero_or_more: matchesEmptyTrue,
    one_or_more:  matchesEmptyExpression,
    semantic_and: matchesEmptyTrue,
    semantic_not: matchesEmptyTrue,

    rule_ref: function(node) {
      return matchesEmpty(asts.findRule(ast, node.name));
    },

    literal: function(node) {
      return node.value === "";
    },

    "class": matchesEmptyFalse,
    any:     matchesEmptyFalse
  });

  var check = visitor.build({
    rule: function(node, visitedRules) {
      check(node.expression, visitedRules.concat(node.name));
    },

    sequence: function(node, visitedRules) {
      arrays.every(node.elements, function(element) {
        if (element.type === "rule_ref") {
          check(element, visitedRules);
        }

        return matchesEmpty(element);
      });
    },

    rule_ref: function(node, visitedRules) {
      if (arrays.contains(visitedRules, node.name)) {
        throw new GrammarError(
          "Left recursion detected for rule \"" + node.name + "\"."
        );
      }

      check(asts.findRule(ast, node.name), visitedRules);
    }
  });

  check(ast, []);
}

module.exports = reportLeftRecursion;
