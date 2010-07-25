/*
 * Checks made on the grammar AST before compilation. Each check is a function
 * that is passed the AST and does not return anything. If the check passes, the
 * function does not do anything special, otherwise it throws
 * |PEG.GrammarError|. The checks are run in sequence in order of their
 * definition.
 */
PEG.compiler.checks = [
  /* Checks that all referenced rules exist. */
  function(ast) {
    function nop() {}

    function checkExpression(node) { check(node.expression); }

    function checkSubnodes(propertyName) {
      return function(node) {
        PEG.ArrayUtils.each(node[propertyName], check);
      };
    }

    var checkFunctions = {
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
    };

    function check(node) { checkFunctions[node.type](node); }

    check(ast);
  },

  /* Checks that no left recursion is present. */
  function(ast) {
    function nop() {}

    function checkExpression(node, appliedRules) {
      check(node.expression, appliedRules);
    }

    var checkFunctions = {
      grammar:
        function(node, appliedRules) {
          for (var name in node.rules) {
            check(ast.rules[name], appliedRules);
          }
        },

      rule:
        function(node, appliedRules) {
          check(node.expression, appliedRules.concat(node.name));
        },

      choice:
        function(node, appliedRules) {
          PEG.ArrayUtils.each(node.alternatives, function(alternative) {
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
          if (PEG.ArrayUtils.contains(appliedRules, node.name)) {
            throw new PEG.GrammarError(
              "Left recursion detected for rule \"" + node.name + "\"."
            );
          }
          check(ast.rules[node.name], appliedRules);
        },

      literal:      nop,
      any:          nop,
      "class":      nop
    };

    function check(node, appliedRules) {
      checkFunctions[node.type](node, appliedRules);
    }

    check(ast, []);
  }
];
