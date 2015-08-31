var GrammarError = require("../../grammar-error"),
    visitor      = require("../visitor");

/* Checks that there are no duplicate rules within the grammer. */
function reportDuplicateRules(ast) {
  var rules = {};
  
  var check = visitor.build({
    rule: function(node) {
      if (node.name in  rules) {
        throw new GrammarError(
          "Duplicate rule \"" + node.name + "\" detected in grammer."
        );
      }

      rules[node.name] = true;
    }
  });

  check(ast);
}

module.exports = reportDuplicateRules;
