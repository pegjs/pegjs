/* Checks that all referenced rules exist. */
PEG.compiler.passes.reportMissingRules = function(ast) {
  function nop() {}

  function checkExpression(node) { check(node.expression); }

  function checkSubnodes(propertyName) {
    return function(node) { each(node[propertyName], check); };
  }

  var check = buildNodeVisitor({
    grammar:      checkSubnodes("rules"),
    rule:         checkExpression,
    named:        checkExpression,
    choice:       checkSubnodes("alternatives"),
    action:       checkExpression,
    sequence:     checkSubnodes("elements"),
    labeled:      checkExpression,
    simple_and:   checkExpression,
    simple_not:   checkExpression,
    semantic_and: nop,
    semantic_not: nop,
    optional:     checkExpression,
    zero_or_more: checkExpression,
    one_or_more:  checkExpression,

    rule_ref:
      function(node) {
        if (!findRuleByName(ast, node.name)) {
          throw new PEG.GrammarError(
            "Referenced rule \"" + node.name + "\" does not exist."
          );
        }
      },

    literal:      nop,
    "class":      nop,
    any:          nop
  });

  check(ast);
};
