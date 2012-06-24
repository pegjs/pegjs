/*
 * This pass walks through the AST and tracks what labels are visible at each
 * point. For "action", "semantic_and" and "semantic_or" nodes it computes
 * parameter names and values for the function used in generated code. (In the
 * emitter, user's code is wrapped into a function that is immediately executed.
 * Its parameter names correspond to visible labels and its parameter values to
 * their captured values). Implicitly, this pass defines scoping rules for
 * labels.
 *
 * After running this pass, all "action", "semantic_and" and "semantic_or" nodes
 * will have a |params| property containing an object mapping parameter names to
 * the expressions that will be used as their values.
 */
PEG.compiler.passes.computeParams = function(ast) {
  var envs = [];

  function scoped(f) {
    envs.push({});
    f();
    envs.pop();
  }

  function nop() {}

  function computeForScopedExpression(node) {
    scoped(function() { compute(node.expression); });
  }

  function computeParams(node) {
    var env = envs[envs.length - 1], params = {}, name;

    for (name in env) {
      params[name] = env[name];
    }
    node.params = params;
  }

  var compute = buildNodeVisitor({
    grammar:
      function(node) {
        each(node.rules, compute);
      },

    rule:         computeForScopedExpression,
    named:
      function(node) {
        compute(node.expression);
      },

    choice:
      function(node) {
        scoped(function() { each(node.alternatives, compute); });
      },

    sequence:
      function(node) {
        var env = envs[envs.length - 1], name;

        function fixup(name) {
          each(pluck(node.elements, "resultVar"), function(resultVar, i) {
            if ((new RegExp("^" + resultVar + "(\\[\\d+\\])*$")).test(env[name])) {
              env[name] = node.resultVar + "[" + i + "]"
                        + env[name].substr(resultVar.length);
            }
          });
        }

        each(node.elements, compute);

        for (name in env) {
          fixup(name);
        }
      },

    labeled:
      function(node) {
        envs[envs.length - 1][node.label] = node.resultVar;

        scoped(function() { compute(node.expression); });
      },

    simple_and:   computeForScopedExpression,
    simple_not:   computeForScopedExpression,
    semantic_and: computeParams,
    semantic_not: computeParams,
    optional:     computeForScopedExpression,
    zero_or_more: computeForScopedExpression,
    one_or_more:  computeForScopedExpression,

    action:
      function(node) {
        scoped(function() {
          compute(node.expression);
          computeParams(node);
        });
      },

    rule_ref:     nop,
    literal:      nop,
    any:          nop,
    "class":      nop
  });

  compute(ast);
};
