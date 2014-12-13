var arrays       = require("../../utils/arrays"),
    GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/* Checks that no left recursion is present. */
function reportLeftRecursion(ast) {
  // Each visitor function returns |true|, if some input wiil be consumed in any case,
  // and |false| otherwize. In last case left recursion is possible.
  function returnFalse() { return false; };
  function visitExpressionAndReturnFalse(node, appliedRules) {
    check(node.expression, appliedRules);
    return false;
  };

  var detected = {};

  var check = visitor.build({
    grammar: function(node) {
      arrays.each(node.rules, function(rule) {
        // If rule already detected, not needed check it again
        if (!detected[rule.name]) {
          check(rule, []);
        }
      });
    },
    rule: function(node, appliedRules) {
      // For initial call |appliedRules| is empty, so that not trigger
      var hasLeftRecursion = arrays.contains(appliedRules, node.name);
      appliedRules.push(node.name);
      try {
        if (hasLeftRecursion) {
          arrays.each(appliedRules, function(name) { detected[name] = true; });
          // If you need multimply error detection in one pass, just not throw exception
          // there, but notify your backend.
          throw new GrammarError('Left recursion detected: ' + appliedRules.join('->'));
          return false;
        } else {
          return check(node.expression, appliedRules);
        }
      } finally {
        appliedRules.pop();
      }
    },
    choice: function(node, appliedRules) {
      for (var i = 0; i < node.alternatives.length; ++i) {
        // If all alternatives can not consume any input, than left recursion is possible.
        if (!check(node.alternatives[i], appliedRules)) {
          return false;
        }
      }
      // If all alternatives consume some input, than, if has any alternative,
      // |choice| consume input.
      return node.alternatives.length > 0;
    },
    sequence: function(node, appliedRules) {
      for (var i = 0; i < node.elements.length; ++i) {
        // Left recursion is inpossible, because we make at least one step forward
        if (check(node.elements[i], appliedRules)) {
          return true;
        }
      }
      return false;
    },
    simple_and:   visitExpressionAndReturnFalse,
    simple_not:   visitExpressionAndReturnFalse,
    optional:     visitExpressionAndReturnFalse,
    zero_or_more: visitExpressionAndReturnFalse,
    semantic_and: returnFalse,
    semantic_not: returnFalse,
    rule_ref: function(node, appliedRules) {
      var rule = asts.findRule(ast, node.name);
      return rule ? check(rule, appliedRules) : false;
    },
    literal: function(n) { return n.value.length > 0; },
    "class": function(n) { return n.parts.length > 0; },
    any:     function()  { return true; }
  });

  check(ast);
}

module.exports = reportLeftRecursion;
