var utils        = require("../../utils");

/* Checks that all rules referenced by another. */
module.exports = function(ast, options) {
  var emitWarning = options.collector.emitWarning;
  var allowedStartRules = options.allowedStartRules;
  function nop() {}

  function checkExpression(node) { check(node.expression); }

  function checkSubnodes(propertyName) {
    return function(node) { utils.each(node[propertyName], check); };
  }

  var used = {};
  for (var i = 0; i < allowedStartRules.length; ++i) {
    used[allowedStartRules[i]] = true;
  }
  var check = utils.buildNodeVisitor({
    grammar:      checkSubnodes("rules"),
    rule:         checkExpression,
    named:        checkExpression,
    choice:       checkSubnodes("alternatives"),
    action:       checkExpression,
    sequence:     checkSubnodes("elements"),
    labeled:      checkExpression,
    text:         checkExpression,
    simple_and:   checkExpression,
    simple_not:   checkExpression,
    semantic_and: nop,
    semantic_not: nop,
    optional:     checkExpression,
    zero_or_more: checkExpression,
    one_or_more:  checkExpression,

    rule_ref:     function(node) { used[node.name] = true; },

    literal:      nop,
    "class":      nop,
    any:          nop
  });

  check(ast);
  for (var i = 0; i < ast.rules.length; ++i) {
    var rule = ast.rules[i];
    if (!used[rule.name]) {
      emitWarning(
        "Rule " + rule.name + " not used.",
        rule
      );
    }
  }
};
