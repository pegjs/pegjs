var utils        = require("../../utils");

/* Checks that no left recursion is present. */
module.exports = function(ast, options) {
  var collector = options.collector;
  function nop() {}

  function checkExpression(node, appliedRules) {
    check(node.expression, appliedRules);
  }

  function checkSubnodes(propertyName) {
    return function(node, appliedRules) {
      utils.each(node[propertyName], function(subnode) {
        check(subnode, appliedRules);
      });
    };
  }

  var check = utils.buildNodeVisitor({
    grammar:     checkSubnodes("rules"),

    rule:
      function(node, appliedRules) {
        appliedRules.push(node.name);
        check(node.expression, appliedRules);
        appliedRules.pop();
      },

    named:       checkExpression,
    choice:      checkSubnodes("alternatives"),
    action:      checkExpression,

    sequence:
      function(node, appliedRules) {
        if (node.elements.length > 0) {
          check(node.elements[0], appliedRules);
        }
      },

    labeled:      checkExpression,
    text:         checkExpression,
    simple_and:   checkExpression,
    simple_not:   checkExpression,
    semantic_and: nop,
    semantic_not: nop,
    optional:     checkExpression,
    zero_or_more: checkExpression,
    one_or_more:  checkExpression,

    rule_ref:
      function(node, appliedRules) {
        if (utils.contains(appliedRules, node.name)) {
          collector.emitError(
            "Left recursion detected for rule \"" + node.name + "\".",
            node
          );
        } else {
          // As |collector.emitError| isn't obliged to throw an exception,
          // there are no warranties that the rule exists (pass |report-missing-rules|
          // use this function to report problem).
          var rule = utils.findRuleByName(ast, node.name);
          if (rule) {
            check(rule, appliedRules);
          }
        }
      },

    literal:      nop,
    "class":      nop,
    any:          nop
  });

  check(ast, []);
};
