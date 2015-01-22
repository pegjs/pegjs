var arrays       = require("../../utils/arrays"),
    GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

/* Checks that no left recursion is present. */
function reportLeftRecursion(ast) {
  var check = visitor.build({
    rule: function(node, appliedRules, template) {
      check(node.expression, appliedRules.concat(node.name), {
        params: node.params,
        args  : template.args,
        rule  : node.name,
        param : null,
      });
    },

    sequence: function(node, appliedRules, template) {
      check(node.elements[0], appliedRules, template);
    },

    rule_ref: function(node, appliedRules, template) {
      var i = template.params.indexOf(node.name);
      // This is reference to template parameter
      if (i >= 0) {
        // This may be |undefined|, if we came not through |rule_ref|, but through |grammar|
        if (template.args) {
          check(template.args[i], appliedRules, {
            params: template.params,
            args  : template.args,
            rule  : template.rule,
            param : node.name,
          });
        }
      } else {
        if (arrays.contains(appliedRules, node.name)) {
          throw new GrammarError(
            template.param
              ? 'Left recursion detected for rule "' + node.name + '" (through template parameter "' +
                template.param + '" of template rule "' + template.rule + '").'
              : 'Left recursion detected for rule "' + node.name + '".'
          );
        }
        check(asts.findRule(ast, node.name), appliedRules, {
          params: null,
          args  : node.args,
          rule  : template.rule,
          param : template.param,
        });
      }
    }
  });

  check(ast, [], {});
}

module.exports = reportLeftRecursion;
