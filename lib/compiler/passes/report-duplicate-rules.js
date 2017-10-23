"use strict";

let GrammarError = require("../../grammar-error");
let visitor = require("../visitor");

// Checks that each rule is defined only once.
function reportDuplicateRules(ast) {
  let rules = {};

  let check = visitor.build({
    rule(node) {
      if (Object.prototype.hasOwnProperty.call(rules, node.name)) {
        throw new GrammarError(
          `Rule "${node.name}" is already defined at line ${rules[node.name].start.line}, column ${rules[node.name].start.column}.`,
          node.location
        );
      }

      rules[node.name] = node.location;
    }
  });

  check(ast);
}

module.exports = reportDuplicateRules;
