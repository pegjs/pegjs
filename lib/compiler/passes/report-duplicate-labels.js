var GrammarError = require("../../grammar-error"),
    visitor      = require("../visitor"),
    arrays       = require("../../utils/arrays");

/* Checks that there are no duplicate labels within a rule. */
function reportDuplicateLabels(ast, options) {
  if ( options && options.reportDuplicateLabels == true ) {
    var check = visitor.build({
      rule: function(node) {
        check(node.expression, node.name, {});
      },
  
      choice: function(node, ruleName) {
        arrays.each(node.alternatives, function(child) {
          check(child, ruleName, {});
        });
      },
  
      labeled: function(node, ruleName, labels) {
        var labelName = node.label;
        
        if ( labels[labelName] ) {
          throw new GrammarError(
            'Duplicate label "' + labelName + '" detected for rule "' + ruleName + '". ' +
            'To disable this error, simply set the option "reportDuplicateLabels" to "false" or "0".'
          );
        }
  
        labels[labelName] = true;
      }
    });
  
    check(ast);
  }
}

module.exports = reportDuplicateLabels;
