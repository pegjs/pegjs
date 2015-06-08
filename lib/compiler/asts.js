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

  matchesEmpty: function(ast, node) {
    function matchesTrue()  { return true;  }
    function matchesFalse() { return false; }

    function matchesExpression(node) {
      return matches(node.expression);
    }

    var matches = visitor.build({
      rule: matchesExpression,

      choice: function(node) {
        return arrays.some(node.alternatives, matches);
      },

      action: matchesExpression,

      sequence: function(node) {
        return arrays.every(node.elements, matches);
      },

      labeled:      matchesExpression,
      text:         matchesExpression,
      simple_and:   matchesTrue,
      simple_not:   matchesTrue,
      optional:     matchesTrue,
      zero_or_more: matchesTrue,
      one_or_more:  matchesExpression,
      semantic_and: matchesTrue,
      semantic_not: matchesTrue,

      rule_ref: function(node) {
        return matches(asts.findRule(ast, node.name));
      },

      literal: function(node) {
        return node.value === "";
      },

      "class": matchesFalse,
      any:     matchesFalse
    });

    return matches(node);
  }
};

module.exports = asts;
