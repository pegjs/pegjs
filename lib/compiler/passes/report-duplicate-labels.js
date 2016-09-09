"use strict";

let GrammarError = require("../../grammar-error"),
    objects      = require("../../utils/objects"),
    visitor      = require("../visitor");

/* Checks that each label is defined only once within each scope. */
function reportDuplicateLabels(ast) {
  function checkExpressionWithClonedEnv(node, env) {
    check(node.expression, objects.clone(env));
  }

  let check = visitor.build({
    rule: function(node) {
      check(node.expression, { });
    },

    choice: function(node, env) {
      node.alternatives.forEach(alternative => {
        check(alternative, objects.clone(env));
      });
    },

    action: checkExpressionWithClonedEnv,

    labeled: function(node, env) {
      if (env.hasOwnProperty(node.label)) {
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

    text:         checkExpressionWithClonedEnv,
    simple_and:   checkExpressionWithClonedEnv,
    simple_not:   checkExpressionWithClonedEnv,
    optional:     checkExpressionWithClonedEnv,
    zero_or_more: checkExpressionWithClonedEnv,
    one_or_more:  checkExpressionWithClonedEnv,
    group:        checkExpressionWithClonedEnv
  });

  check(ast);
}

module.exports = reportDuplicateLabels;
