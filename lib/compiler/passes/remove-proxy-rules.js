var arrays  = require("../../utils/arrays"),
    visitor = require("../visitor");

/*
 * Removes proxy rules -- that is, rules that only delegate to other rule.
 */
function removeProxyRules(ast, options) {
  function isProxyRule(node) {
    return node.type === "rule" && node.expression.type === "rule_ref";
  }

  function replaceRuleRefs(ast, from, to) {
    function nop() {}

    function replaceInExpression(node, from, to) {
      replace(node.expression, from, to);
    }

    function replaceInSubnodes(propertyName) {
      return function(node, from, to) {
        arrays.each(node[propertyName], function(n) { replace(n, from, to); });
      };
    }

    var replace = visitor.build({
      grammar:      replaceInSubnodes("rules"),
      rule:         replaceInExpression,
      named:        replaceInExpression,
      choice:       replaceInSubnodes("alternatives"),
      sequence:     replaceInSubnodes("elements"),
      labeled:      replaceInExpression,
      text:         replaceInExpression,
      simple_and:   replaceInExpression,
      simple_not:   replaceInExpression,
      semantic_and: nop,
      semantic_not: nop,
      optional:     replaceInExpression,
      zero_or_more: replaceInExpression,
      one_or_more:  replaceInExpression,
      range:        replaceInExpression,
      action:       replaceInExpression,

      rule_ref:
        function(node, from, to) {
          if (node.name === from) {
            node.name = to;
          }
        },

      literal:      nop,
      "class":      nop,
      any:          nop
    });

    replace(ast, from, to);
  }

  var indices = [];

  arrays.each(ast.rules, function(rule, i) {
    if (isProxyRule(rule)) {
      replaceRuleRefs(ast, rule.name, rule.expression.name);
      if (!arrays.contains(options.allowedStartRules, rule.name)) {
        indices.push(i);
      }
    }
  });

  indices.reverse();

  arrays.each(indices, function(i) { ast.rules.splice(i, 1); });
}

module.exports = removeProxyRules;
