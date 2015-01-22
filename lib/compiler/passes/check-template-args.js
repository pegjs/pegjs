var arrays       = require("../../utils/arrays"),
    GrammarError = require("../../grammar-error"),
    asts         = require("../asts"),
    visitor      = require("../visitor");

function checkTemplateArgs(ast) {
  var check = visitor.build({
    rule: function(node) {
      check(node.expression, node);
    },

    rule_ref: function(node, templateRule) {
      // This is template parameter reference
      if (arrays.contains(templateRule.params, node.name)) {
        if (node.args.length !== 0) {
          throw new GrammarError(
            'Template paramater "' + node.name + '" of rule "' + templateRule.name + '" can\'t accept template arguments'
          );
        }
      } else {
        var rule = asts.findRule(ast, node.name);
        if (rule && rule.params.length !== node.args.length) {
          throw new GrammarError(
            'Insufficient count of template arguments for rule "' + node.name + '". Expected '
              + rule.params.length + ', found ' + node.args.length
          );
        }
        arrays.each(node.args, function(n) {
          check(n, templateRule);
        });
      }
    }
  });

  check(ast);
}

module.exports = checkTemplateArgs;
