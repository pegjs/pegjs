var GrammarError = require("../../grammar-error"),
    objects      = require("../../utils/objects"),
    arrays       = require("../../utils/arrays"),
    visitor      = require("../visitor");
    Resolver     = require("../resolver");

/* Include one grammar to another recursively. Cyclic includes not supported. */
function includeGrammars(ast, options) {
  options = objects.clone(options);
  options.output = "ast";

  var resolver = options.resolver || new Resolver();

  function doInclude(ast, aliases) {
    // Mapping from alias to default rule of imported grammar
    var defaultRules = {};
    // Arrays with initiaizers and rules from all imported grammars in order of import
    var initializers = [];
    var rules = [];

    function appendFrom(ast) {
      if (ast.initializers) {
        Array.prototype.push.apply(initializers, ast.initializers);
      }
      Array.prototype.push.apply(rules, ast.rules);
    }

    function fixCode(node, prefix) {
      if (node.namespace) {
        prefix = prefix.concat(node.namespace);
      }
      node.namespace = prefix.join('.');
      if (node.expression) {
        addPrefix(node.expression, prefix);
      }
    }
    var addPrefix = visitor.build({
      initializer: fixCode,
      action: fixCode,
      semantic_and: fixCode,
      semantic_not: fixCode,

      rule: function(node, prefix) {
        node.name = prefix.concat(node.name).join('$');
        addPrefix(node.expression, prefix);
      },
      rule_ref: function(node, prefix) {
        var name = node.name;
        // If referred rule not from this grammar.
        if (node.namespace) {
          // If |name| not set, use default rule of grammar
          name = name || defaultRules[node.namespace];
          prefix = prefix.concat(node.namespace);

          // Make rule be part of this grammar -- for preventing of repeated processing.
          node.namespace = null;
        }
        if (!name) {
          throw new GrammarError(node);
        }
        node.name = prefix.concat(name).join('$');
      }
    });
    var include = visitor.build({
      grammar: function(node) {
        if (node.imports) {
          // Fill |rules| and |initializers| arrays
          arrays.each(node.imports, include);
        }
        // Mark that all imports resolved.
        delete node.imports;
        addPrefix(node, aliases);

        // Append included rules and initializers first -- this need for generating action functions
        // and initializers call in correct order.
        appendFrom(node);


        // Update AST
        node.initializers = initializers;
        node.rules = rules;
      },
      "import": function(node) {
        var importedAst = resolver.resolve(node.path, node.alias, options);

        // Resolve default names before they changed in |doInclude|
        defaultRules[node.alias] = importedAst.rules[0].name;

        doInclude(importedAst, aliases.concat(node.alias));

        appendFrom(importedAst);
        if (resolver.done) {
          resolver.done(node.path, node.alias, options);
        }
      }
    });

    include(ast);
  }
  doInclude(ast, []);
}

module.exports = includeGrammars;
