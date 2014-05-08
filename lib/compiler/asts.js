var arrays = require("../utils/arrays");

/* AST utilities. */
var asts = {
  findRuleByName: function(ast, name) {
    return arrays.find(ast.rules, function(r) { return r.name === name; });
  },

  indexOfRuleByName: function(ast, name) {
    return arrays.indexOf(ast.rules, function(r) { return r.name === name; });
  }
};

module.exports = asts;
