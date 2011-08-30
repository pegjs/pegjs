/*
 * Checks made on the grammar AST before compilation. Each check is a function
 * that is passed the AST and does not return anything. If the check passes, the
 * function does not do anything special, otherwise it throws
 * |PEG.GrammarError|. The order in which the checks are run is specified in
 * |PEG.compiler.compile| and should be the same as the order of definitions
 * here.
 */
PEG.compiler.checks = {
  /* Checks that all referenced rules exist. */
  missingReferencedRules: function(ast) {
    function nop() {}

    function checkExpression(node) { check(node.expression); }

    function checkSubnodes(propertyName) {
      return function(node) { node[propertyName].forEach(check); };
    }

    var check = buildNodeVisitor({
      grammar:
        function(node) {
          for (var name in node.rules) {
            check(node.rules[name]);
          }
        },

      rule:         checkExpression,
      choice:       checkSubnodes("alternatives"),
      sequence:     checkSubnodes("elements"),
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
        function(node) {
          if (ast.rules[node.name] === undefined) {
            throw new PEG.GrammarError(
              "Referenced rule \"" + node.name + "\" does not exist."
            );
          }
        },

      literal:      nop,
      any:          nop,
      "class":      nop
    });

    check(ast);
  },

  /* Checks that no left recursion is present. */
  leftRecursion: function(ast) {
    function nop() {}

    function checkExpression(node, appliedRules) {
      check(node.expression, appliedRules);
    }

    var check = buildNodeVisitor({
      grammar:
        function(node, appliedRules) {
          for (var name in node.rules) {
            check(node.rules[name], appliedRules);
          }
        },

      rule:
        function(node, appliedRules) {
          check(node.expression, appliedRules.concat(node.name));
        },

      choice:
        function(node, appliedRules) {
          node.alternatives.forEach(function(alternative) {
            check(alternative, appliedRules);
          });
        },

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
          check(ast.rules[node.name], appliedRules);
        },

      literal:      nop,
      any:          nop,
      "class":      nop
    });

    check(ast, []);
  }
};
