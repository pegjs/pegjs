var arrays       = require("../../utils/arrays"),
    GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/* Checks that no left recursion is present. */
function reportLeftRecursion(ast) {
  // Each visitor function returns minimum number of AST nodes, that it must consume.
  // If this number == 0, than left recursion is possible
  function return0() { return 0; };
  function return1() { return 1; };
  function visitExpressionAndReturn0(node, pos, appliedRules) {
    check(node.expression, pos, appliedRules);
    return 0;
  };

  var detected = {};

  var check = visitor.build({
    grammar: function(node) {
      arrays.each(node.rules, function(rule) {
        // If rule already detected, not needed check it again
        if (!detected[rule.name]) {
          check(rule, 0, []);
        }
      });
    },
    rule: function(node, pos, appliedRules) {
      // For initial call |appliedRules| is empty, so that not trigger
      var hasLeftRecursion = arrays.contains(appliedRules, node.name);
      appliedRules.push(node.name);
      try {
        if (hasLeftRecursion) {
          arrays.each(appliedRules, function(name) { detected[name] = true; });
          // If you need multimply error detection in one pass, just not throw exception
          // there, but notify your backend.
          throw new GrammarError('Left recursion detected: ' + appliedRules.join('->'));
          return 0;
        } else {
          return check(node.expression, pos, appliedRules);
        }
      } finally {
        appliedRules.pop();
      }
    },
    choice: function(node, pos, appliedRules) {
      var min = pos;
      for (var i = 0; i < node.alternatives.length; ++i) {
        min = Math.min(min, check(node.alternatives[i], pos, appliedRules));
      }
      return min;
    },
    sequence: function(node, pos, appliedRules) {
      var delta;
      for (var i = 0; i < node.elements.length; ++i) {
        delta = check(node.elements[i], pos, appliedRules);
        pos += delta;
        // Left recursion is inpossible, because we make at least one step forward
        if (delta > 0) {
          break;
        }
      }
      return pos;
    },
    simple_and:   visitExpressionAndReturn0,
    simple_not:   visitExpressionAndReturn0,
    optional:     visitExpressionAndReturn0,
    zero_or_more: visitExpressionAndReturn0,
    semantic_and: return0,
    semantic_not: return0,
    rule_ref: function(node, pos, appliedRules) {
      var rule = asts.findRule(ast, node.name);
      return rule ? check(rule, pos, appliedRules) : 0;
    },
    literal: function(n) { return n.value.length; },
    "class": function(n) { return n.parts.length; },
    any:     function() { return 1; }
  });

  check(ast);
}

module.exports = reportLeftRecursion;
