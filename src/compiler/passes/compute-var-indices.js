/*
 * Computes indices of variables used for storing match results and parse
 * positions in generated code. These variables are organized as two stacks.
 * The following will hold after running this pass:
 *
 *   * All nodes except "grammar" and "rule" nodes will have a |resultIndex|
 *     property. It will contain an index of the variable that will store a
 *     match result of the expression represented by the node in generated code.
 *
 *   * Some nodes will have a |posIndex| property. It will contain an index of
 *     the variable that will store a parse position in generated code.
 *
 *   * All "rule" nodes will contain |resultIndices| and |posIndices|
 *     properties. They will contain a list of values of |resultIndex| and
 *     |posIndex| properties used in rule's subnodes. (This is useful to declare
 *     variables in generated code.)
 */
PEG.compiler.passes.computeVarIndices = function(ast) {
  function computeLeaf(node, index) { return { result: 0, pos: 0 }; }

  function computeFromExpression(delta) {
    return function(node, index) {
      var depth;

      node.expression.resultIndex = index.result + delta.result;

      depth = compute(
        node.expression,
        {
          result: index.result + delta.result,
          pos:    index.pos    + delta.pos
        }
      );

      if (delta.pos !== 0) {
        node.posIndex = index.pos;
      }

      return {
        result: depth.result + delta.result,
        pos:    depth.pos    + delta.pos
      };
    };
  }

  var compute = buildNodeVisitor({
    grammar:
      function(node, index) {
        each(node.rules, function(node) {
          node.resultIndex = index.result;
          compute(node, index);
        });
      },

    rule:
      function(node, index) {
        var depth;

        node.expression.resultIndex = node.resultIndex;

        depth = compute(node.expression, index);

        node.resultIndices = range(depth.result + 1);
        node.posIndices    = range(depth.pos);
      },

    named:        computeFromExpression({ result: 0, pos: 0 }),

    choice:
      function(node, index) {
        var depths = map(node.alternatives, function(alternative) {
          alternative.resultIndex = node.resultIndex;

          return compute(alternative, index);
        });

        return {
          result: Math.max.apply(null, pluck(depths, "result")),
          pos:    Math.max.apply(null, pluck(depths, "pos"))
        };
      },

    action:       computeFromExpression({ result: 0, pos: 1 }),

    sequence:
      function(node, index) {
        var depths = map(node.elements, function(element, i) {
          element.resultIndex = index.result + i;

          return compute(
            element,
            { result: index.result + i, pos: index.pos + 1 }
          );
        });

        node.posIndex = index.pos;

        return {
          result:
            node.elements.length > 0
              ? Math.max.apply(
                  null,
                  map(depths, function(d, i) { return i + d.result; })
                )
              : 0,

          pos:
            node.elements.length > 0
              ? 1 + Math.max.apply(null, pluck(depths, "pos"))
              : 1
        };
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

  compute(ast, { result: 0, pos: 0 });
};
