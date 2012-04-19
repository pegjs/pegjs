/* Checks that no left recursion is present. */
PEG.compiler.passes.reportLeftRecursion = function(ast) {
  function nop() {}

  function checkExpression(node, appliedRules) {
    check(node.expression, appliedRules);
  }

  function checkSubnodes(propertyName) {
    return function(node, appliedRules) {
      each(node[propertyName], function(subnode) {
        check(subnode, appliedRules);
      });
    };
  }

  var check = buildNodeVisitor({
    grammar:     checkSubnodes("rules"),

    rule:
      function(node, appliedRules) {
        check(node.expression, appliedRules.concat(node.name));
      },

    choice:      checkSubnodes("alternatives"),

    sequence:
      function(node, appliedRules) {
        if (node.elements.length > 0) {
          check(node.elements[0], appliedRules);
        }
      },

    labeled:      checkExpression,
    simple_and:   checkExpression,
    simple_not:   checkExpression,
    semantic_and: nop,
    semantic_not: nop,
    optional:     checkExpression,
    zero_or_more: checkExpression,
    one_or_more:  checkExpression,
    action:       checkExpression,

    rule_ref:
      function(node, appliedRules) {
        if (contains(appliedRules, node.name)) {
          throw new PEG.GrammarError(
            "Left recursion detected for rule \"" + node.name + "\"."
          );
        }
        check(findRuleByName(ast, node.name), appliedRules);
      },

    literal:      nop,
    any:          nop,
    "class":      nop
  });

  check(ast, []);
};
