/*
 * Computes names of variables used for storing match results and parse
 * positions in generated code. These variables are organized as two stacks.
 * The following will hold after running this pass:
 *
 *   * All nodes except "grammar" and "rule" nodes will have a |resultVar|
 *     property. It will contain a name of the variable that will store a match
 *     result of the expression represented by the node in generated code.
 *
 *   * Some nodes will have a |posVar| property. It will contain a name of the
 *     variable that will store a parse position in generated code.
 *
 *   * All "rule" nodes will contain |resultVars| and |posVars| properties.
 *     They will contain a list of values of |resultVar| and |posVar| properties
 *     used in rule's subnodes. (This is useful to declare variables in
 *     generated code.)
 */
PEG.compiler.passes.computeVarNames = function(ast) {
  function resultVar(index) { return "result" + index; }
  function posVar(index)    { return "pos"    + index; }

  function computeLeaf(node, index) {
    node.resultVar = resultVar(index.result);

    return { result: 0, pos: 0 };
  }

  function computeFromExpression(delta) {
    return function(node, index) {
      var depth = compute(
            node.expression,
            {
              result: index.result + delta.result,
              pos:    index.pos    + delta.pos
            }
          );

      node.resultVar = resultVar(index.result);
      if (delta.pos !== 0) {
        node.posVar = posVar(index.pos);
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
          compute(node, index);
        });
      },

    rule:
      function(node, index) {
        var depth = compute(node.expression, index);

        node.resultVar  = resultVar(index.result);
        node.resultVars = map(range(depth.result + 1), resultVar);
        node.posVars    = map(range(depth.pos),        posVar);
      },

    named:        computeFromExpression({ result: 0, pos: 0 }),

    choice:
      function(node, index) {
        var depths = map(node.alternatives, function(alternative) {
          return compute(alternative, index);
        });

        node.resultVar = resultVar(index.result);

        return {
          result: Math.max.apply(null, pluck(depths, "result")),
          pos:    Math.max.apply(null, pluck(depths, "pos"))
        };
      },

    action:       computeFromExpression({ result: 0, pos: 1 }),

    sequence:
      function(node, index) {
        var depths = map(node.elements, function(element, i) {
          return compute(
            element,
            { result: index.result + i, pos: index.pos + 1 }
          );
        });

        node.resultVar = resultVar(index.result);
        node.posVar    = posVar(index.pos);

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
