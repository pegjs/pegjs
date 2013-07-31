var utils        = require("../../utils"),
    GrammarError = require("../../grammar-error");

/* Checks that all referenced rules exist. */
module.exports = function(ast, options) {
  function nop() {}

  function checkExpression(node) { check(node.expression); }

  function checkSubnodes(propertyName) {
    return function(node) { utils.each(node[propertyName], check); };
  }

  var used = { };
  if (options && options.allowedStartRules) {
    utils.each(options.allowedStartRules, function (name) {
      used[name] = true;
    });
  } else if (ast.rules.length) {
    used[ast.rules[0].name] = true;
  }

  var check = utils.buildNodeVisitor({
    grammar:      checkSubnodes("rules"),
    rule:         checkExpression,
    named:        checkExpression,
    choice:       checkSubnodes("alternatives"),
    action:       checkExpression,
    sequence:     checkSubnodes("elements"),
    labeled:      checkExpression,
    text:         checkExpression,
    simple_and:   checkExpression,
    simple_not:   checkExpression,
    semantic_and: nop,
    semantic_not: nop,
    optional:     checkExpression,
    zero_or_more: checkExpression,
    one_or_more:  checkExpression,

    rule_ref:
      function(node) {
        used[node.name] = true;
      },

    literal:      nop,
    "class":      nop,
    any:          nop
  });

  check(ast);

  for (var key in ast.rules) {
    var name = ast.rules[key].name;
    if (!used[name]) {
      throw new GrammarError(
        "Rule \"" + name + "\" is not referenced."
      );
    }
  }
};
