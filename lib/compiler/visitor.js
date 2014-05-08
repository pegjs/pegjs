/* Simple AST node visitor builder. */
var visitor = {
  build: function(functions) {
    return function(node) {
      return functions[node.type].apply(null, arguments);
    };
  }
};

module.exports = visitor;
