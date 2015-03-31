var GrammarError = require("../../grammar-error"),
    visitor      = require("../visitor");

/* Checks that there are no duplicate labels within a rule. */
function reportDuplicateLabels(ast) {
  var check = visitor.build({
    rule: function(node, data) {
      check(node.expression, {
        nodeName: node.name,
        labels: {}
      });
    },

    labeled: function(node, data) {
      if (data.labels.hasOwnProperty(node.label)) {
        throw new GrammarError(
          'Duplicate label \"' + node.label + '\" detected for rule \"' + data.nodeName + '\".'
        );
      }

      data.labels[node.label] = 1;
    }
  });

  check(ast);
}

module.exports = reportDuplicateLabels;
