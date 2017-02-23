"use strict";

let GrammarError = require("../../grammar-error");
let asts = require("../asts");
let visitor = require("../visitor");

// Checks that all referenced rules exist.
function reportUndefinedRules(ast) {
  let check = visitor.build({
    rule_ref(node) {
      if (!asts.findRule(ast, node.name)) {
        throw new GrammarError(
          "Rule \"" + node.name + "\" is not defined.",
          node.location
        );
      }
    }
  });

  check(ast);
}

module.exports = reportUndefinedRules;
