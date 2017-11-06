"use strict";

let GrammarError = require("../../grammar-error");
let visitor = require("../visitor");

// Checks that each label is defined only once within each scope.
function reportDuplicateLabels(ast) {
  function checkExpressionWithClonedEnv(node, env) {
    check(node.expression, Object.assign({}, env));
  }

  let check = visitor.build({
    rule(node) {
      check(node.expression, { });
    },

    choice(node, env) {
      node.alternatives.forEach(alternative => {
        check(alternative, Object.assign({}, env));
      });
    },

    action: checkExpressionWithClonedEnv,

    labeled(node, env) {
      if (Object.prototype.hasOwnProperty.call(env, node.label)) {
        throw new GrammarError(
          "Label \"" + node.label + "\" is already defined "
            + "at line " + env[node.label].start.line + ", "
            + "column " + env[node.label].start.column + ".",
          node.location
        );
      }

      check(node.expression, env);

      env[node.label] = node.location;
    },

    text: checkExpressionWithClonedEnv,
    simple_and: checkExpressionWithClonedEnv,
    simple_not: checkExpressionWithClonedEnv,
    optional: checkExpressionWithClonedEnv,
    zero_or_more: checkExpressionWithClonedEnv,
    one_or_more: checkExpressionWithClonedEnv,
    group: checkExpressionWithClonedEnv
  });

  check(ast);
}

module.exports = reportDuplicateLabels;
