var GrammarError = require("../../grammar-error"),
    visitor      = require("../visitor");

/* Checks that there are no duplicate rules within the grammer. */
function reportDuplicateRules(ast, options) {
  if ( options && options.reportDuplicateRules == true ) {
    var rules = {};
    
    var check = visitor.build({
      rule: function(node) {
        var ruleName = node.name;
        
        if ( rules[ruleName] ) {
          throw new GrammarError(
            'Duplicate rule "' + ruleName + '" detected in grammer. ' +
            'To disable this error, simply set the option "reportDuplicateRules" to "false" or "0".'
          );
        }
  
        rules[ruleName] = true;
      }
    });
  
    check(ast);
  }
}

module.exports = reportDuplicateRules;
