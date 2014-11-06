var arrays       = require("../../utils/arrays"),
    GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/* Checks that no left recursion is present. */
function reportLeftRecursion(ast) {
  var check = visitor.build({
    rule: function(node, appliedRules, templateParams, templateArgs) {
      check(node.expression, appliedRules.concat(node.name), node.params, templateArgs);
    },

    sequence: function(node, appliedRules, templateParams, templateArgs) {
      check(node.elements[0], appliedRules, templateParams, templateArgs);
    },

    rule_ref: function(node, appliedRules, templateParams, templateArgs) {
      var i = templateParams.indexOf(node.name);
      // This is reference to template parameter
      if (i >= 0) {
        // This may be |undefined|, if we came not through |rule_ref|, but through |grammar|
        if (templateArgs) {
          check(templateArgs[i], appliedRules, templateParams, templateArgs);
        }
      } else {
        if (arrays.contains(appliedRules, node.name)) {
          throw new GrammarError(
            "Left recursion detected for rule \"" + node.name + "\"."
          );
        }
        check(asts.findRule(ast, node.name), appliedRules, null, node.args);
      }
    }
  });

  check(ast, []);
}

module.exports = reportLeftRecursion;
