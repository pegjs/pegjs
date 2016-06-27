"use strict";

var GrammarError = require("../../grammar-error"),
    visitor      = require("../visitor");

/* Checks that each rule is defined only once. */
function reportDuplicateRules(ast) {
  var rules = {};

  var check = visitor.build({
    rule: function(node) {
      if (rules.hasOwnProperty(node.name)) {
        throw new GrammarError(
          "Rule \"" + node.name + "\" is already defined "
            + "at line " + rules[node.name].start.line + ", "
            + "column " + rules[node.name].start.column + ".",
          node.location
        );
      }

      rules[node.name] = node.location;
    }
  });

  check(ast);
}

module.exports = reportDuplicateRules;
