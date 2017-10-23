"use strict";

// Simple AST node visitor builder.
let visitor = {
  build(functions) {
    function visit(node, ...extraArgs) {
      return functions[node.type](node, ...extraArgs);
    }

    function visitNop() {
      // Do nothing.
    }

    function visitExpression(node, ...extraArgs) {
      visit(node.expression, ...extraArgs);
    }

    function visitChildren(property) {
      return function(node, ...extraArgs) {
        node[property].forEach(child => {
          visit(child, ...extraArgs);
        });
      };
    }

    const DEFAULT_FUNCTIONS = {
      grammar(node, ...extraArgs) {
        if (node.initializer) {
          visit(node.initializer, ...extraArgs);
        }

        node.rules.forEach(rule => {
          visit(rule, ...extraArgs);
        });
      },

      initializer: visitNop,
      rule: visitExpression,
      named: visitExpression,
      choice: visitChildren("alternatives"),
      action: visitExpression,
      sequence: visitChildren("elements"),
      labeled: visitExpression,
      text: visitExpression,
      simple_and: visitExpression,
      simple_not: visitExpression,
      optional: visitExpression,
      zero_or_more: visitExpression,
      one_or_more: visitExpression,
      group: visitExpression,
      semantic_and: visitNop,
      semantic_not: visitNop,
      rule_ref: visitNop,
      literal: visitNop,
      class: visitNop,
      any: visitNop
    };

    Object.keys(DEFAULT_FUNCTIONS).forEach(type => {
      if (!Object.prototype.hasOwnProperty.call(functions, type)) {
        functions[type] = DEFAULT_FUNCTIONS[type];
      }
    });

    return visit;
  }
};

module.exports = visitor;
