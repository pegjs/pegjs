/* Warning, if some rules redefined. */
module.exports = function(ast, options) {
  var emitWarning = options.collector.emitWarning;
  var rules = ast.rules;
  // Map node name to node itself.
  var names = {};
  for (var i = 0; i < rules.length; ++i) {
    var rule = rules[i];
    if (names.hasOwnProperty(rule.name)) {
      emitWarning(
        //TODO: after merge Mingun/more-AST-info add previously defined location
        "Rule " + rule.name + " redefined.",
        rule
      );
    } else {
      names[rule.name] = rule;
    }
  }
};
