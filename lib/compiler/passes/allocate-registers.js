var utils = require("../../utils");

/*
 * Allocates registers that the generated code for each node will use to store
 * match results and parse positions. For "action", "semantic_and" and
 * "semantic_or" nodes it also computes visibility of labels at the point of
 * action/predicate code execution and a mapping from label names to registers
 * that will contain the labeled values.
 *
 * The following will hold after running this pass:
 *
 *   * All nodes except "grammar" and "rule" nodes will have a |resultIndex|
 *     property. It will contain an index of a register that will store a match
 *     result of the expression represented by the node in generated code.
 *
 *   * Some nodes will have a |posIndex| property. It will contain an index of a
 *     register that will store a saved parse position in generated code.
 *
 *   * All "rule" nodes will contain a |registerCount| property. It will contain
 *     the number of registers that will be used by code generated for the
 *     rule's expression.
 *
 *   * All "action", "semantic_and" and "semantic_or" nodes will have a |params|
 *     property. It will contain a mapping from names of labels visible at the
 *     point of action/predicate code execution to registers that will contain
 *     the labeled values.
 */
module.exports = function(ast) {
  /*
   * Register allocator that allocates registers from an unlimited
   * integer-indexed pool. It allows allocating and releaseing registers in any
   * order. It also supports reference counting (this simplifies tracking active
   * registers when they store values passed to action/predicate code).
   * Allocating a register allways uses the first free register (the one with
   * the lowest index).
   */
  var registers = (function() {
    var refCounts = []; // reference count for each register that was
                        // allocated at least once

    return {
      alloc: function() {
        var i;

        for (i = 0; i < refCounts.length; i++) {
          if (refCounts[i] === 0) {
            refCounts[i] = 1;
            return i;
          }
        }

        refCounts.push(1);
        return refCounts.length - 1;
      },

      use: function(index) {
        refCounts[index]++;
      },

      release: function(index) {
        refCounts[index]--;
      },

      maxIndex: function() {
        return refCounts.length - 1;
      },

      reset: function() {
        refCounts = [];
      }
    };
  })();

  /*
   * Manages mapping of label names to indices of registers that will store the
   * labeled values as long as they are in scope.
   */
  var vars = (function(registers) {
    var envs = []; // stack of nested environments

    return {
      beginScope: function() {
        envs.push({});
      },

      endScope: function() {
        var env = envs.pop(), name;

        for (name in env) {
          registers.release(env[name]);
        }
      },

      add: function(name, index) {
        envs[envs.length - 1][name] = index;
        registers.use(index);
      },

      buildParams: function() {
        var env = envs[envs.length - 1], params = {}, name;

        for (name in env) {
          params[name] = env[name];
        }

        return params;
      }
    };
  })(registers);

  function savePos(node, f) {
    node.posIndex = registers.alloc();
    f();
    registers.release(node.posIndex);
  }

  function reuseResult(node, subnode) {
    subnode.resultIndex = node.resultIndex;
  }

  function allocResult(node, f) {
    node.resultIndex = registers.alloc();
    f();
    registers.release(node.resultIndex);
  }

  function scoped(f) {
    vars.beginScope();
    f();
    vars.endScope();
  }

  function nop() {}

  function computeExpressionScoped(node) {
    scoped(function() { compute(node.expression); });
  }

  function computeExpressionScopedReuseResult(node) {
    reuseResult(node, node.expression);
    computeExpressionScoped(node);
  }

  function computeExpressionScopedAllocResult(node) {
    allocResult(node.expression, function() { computeExpressionScoped(node); });
  }

  function computeExpressionScopedReuseResultSavePos(node) {
    savePos(node, function() { computeExpressionScopedReuseResult(node); });
  }

  function computeParams(node) {
    node.params = vars.buildParams();
  }

  var compute = utils.buildNodeVisitor({
    grammar:
      function(node) {
        utils.each(node.rules, compute);
      },

    rule:
      function(node) {
        registers.reset();
        computeExpressionScopedAllocResult(node);
        node.registerCount = registers.maxIndex() + 1;
      },

    named:
      function(node) {
        reuseResult(node, node.expression);
        compute(node.expression);
      },

    choice:
      function(node) {
        utils.each(node.alternatives, function(alternative) {
          reuseResult(node, alternative);
          scoped(function() {
            compute(alternative);
          });
        });
      },

    action:
      function(node) {
        savePos(node, function() {
          reuseResult(node, node.expression);
          scoped(function() {
            compute(node.expression);
            computeParams(node);
          });
        });
      },

    sequence:
      function(node) {
        savePos(node, function() {
          utils.each(node.elements, function(element) {
            element.resultIndex = registers.alloc();
            compute(element);
          });
          utils.each(node.elements, function(element) {
            registers.release(element.resultIndex);
          });
        });
      },

    labeled:
      function(node) {
        vars.add(node.label, node.resultIndex);
        computeExpressionScopedReuseResult(node);
      },

    text:         computeExpressionScopedReuseResultSavePos,
    simple_and:   computeExpressionScopedReuseResultSavePos,
    simple_not:   computeExpressionScopedReuseResultSavePos,
    semantic_and: computeParams,
    semantic_not: computeParams,
    optional:     computeExpressionScopedReuseResult,
    zero_or_more: computeExpressionScopedAllocResult,
    one_or_more:  computeExpressionScopedAllocResult,
    rule_ref:     nop,
    literal:      nop,
    "class":      nop,
    any:          nop
  });

  compute(ast);
};
