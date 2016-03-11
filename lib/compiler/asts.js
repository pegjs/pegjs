"use strict";

var arrays  = require("../utils/arrays"),
    visitor = require("./visitor");

/* AST utilities. */
var asts = {
  findRule: function(ast, name) {
    return arrays.find(ast.rules, function(r) { return r.name === name; });
  },

  indexOfRule: function(ast, name) {
    return arrays.indexOf(ast.rules, function(r) { return r.name === name; });
  },

  alwaysConsumesOnSuccess: function(ast, node) {
    function consumesTrue()  { return true;  }
    function consumesFalse() { return false; }

    function consumesExpression(node) {
      return consumes(node.expression);
    }

    var consumes = visitor.build({
      rule:  consumesExpression,
      named: consumesExpression,

      choice: function(node) {
        return arrays.every(node.alternatives, consumes);
      },

      action: consumesExpression,

      sequence: function(node) {
        return arrays.some(node.elements, consumes);
      },

      labeled:      consumesExpression,
      text:         consumesExpression,
      simple_and:   consumesFalse,
      simple_not:   consumesFalse,
      optional:     consumesFalse,
      zero_or_more: consumesFalse,
      one_or_more:  consumesExpression,
      group:        consumesExpression,
      semantic_and: consumesFalse,
      semantic_not: consumesFalse,

      rule_ref: function(node) {
        return consumes(asts.findRule(ast, node.name));
      },

      literal: function(node) {
        return node.value !== "";
      },

      "class": consumesTrue,
      any:     consumesTrue
    });

    return consumes(node);
  }
};

module.exports = asts;
