/*
 * Allocates registers that the generated code for each node will use to store
 * match results and parse positions. The following will hold after running this
 * pass:
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
 */
PEG.compiler.passes.allocateRegisters = function(ast) {
  function computeLeaf(node, index) { return 0; }

  function computeFromExpression(delta) {
    return function(node, index) {
      var depth;

      node.expression.resultIndex = delta.result > 0
        ? index + delta.result + delta.pos
        : node.resultIndex;

      depth = compute(
        node.expression,
        index + delta.result + delta.pos
      );

      if (delta.pos !== 0) {
        node.posIndex = index + delta.pos;
      }

      return depth + delta.result + delta.pos;
    };
  }

  var compute = buildNodeVisitor({
    grammar:
      function(node, index) {
        each(node.rules, function(node) {
          node.resultIndex = index;
          compute(node, index);
        });
      },

    rule:
      function(node, index) {
        var depth;

        node.expression.resultIndex = node.resultIndex;

        depth = compute(node.expression, index);

        node.registerCount = depth + 1;
      },

    named:        computeFromExpression({ result: 0, pos: 0 }),

    choice:
      function(node, index) {
        var depths = map(node.alternatives, function(alternative) {
          alternative.resultIndex = node.resultIndex;

          return compute(alternative, index);
        });

        return Math.max.apply(null, depths);
      },

    action:       computeFromExpression({ result: 0, pos: 1 }),

    sequence:
      function(node, index) {
        var depths = map(node.elements, function(element, i) {
          element.resultIndex = index + i + 2;

          return compute(element, index + i + 2);
        });

        node.posIndex = index + 1;

        return node.elements.length > 0
          ? Math.max.apply(
              null,
              map(depths, function(d, i) { return i + d; })
            )
            + 2
          : 1;
      },

    labeled:      computeFromExpression({ result: 0, pos: 0 }),
    simple_and:   computeFromExpression({ result: 0, pos: 1 }),
    simple_not:   computeFromExpression({ result: 0, pos: 1 }),
    semantic_and: computeLeaf,
    semantic_not: computeLeaf,
    optional:     computeFromExpression({ result: 0, pos: 0 }),
    zero_or_more: computeFromExpression({ result: 1, pos: 0 }),
    one_or_more:  computeFromExpression({ result: 1, pos: 0 }),
    rule_ref:     computeLeaf,
    literal:      computeLeaf,
    "class":      computeLeaf,
    any:          computeLeaf
  });

  compute(ast, 0);
};
