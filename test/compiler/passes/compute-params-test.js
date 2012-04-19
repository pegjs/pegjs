(function() {

module("PEG.compiler.passes.computeParams");

test("computes params", function() {
  function extractNode(node)       { return node; }
  function extractExpression(node) { return node.expression; }

  var cases = [
    /* Bacics */
    {
      grammar:   'start = a:"a" { }',
      extractor: extractNode,
      params:    { a: "result0" }
    },
    {
      grammar:   'start = a:"a" &{ }',
      extractor: function(node) { return node.elements[1]; },
      params:    { a: "result0" }
    },
    {
      grammar:   'start = a:"a" !{ }',
      extractor: function(node) { return node.elements[1]; },
      params:    { a: "result0" }
    },

    /* Recursive walk */
    {
      grammar:   'start = a:"a" { } / "b" / "c"',
      extractor: function(node) { return node.alternatives[0]; },
      params:    { a: "result0" }
    },
    {
      grammar:   'start = "a" / "b" / c:"c" { }',
      extractor: function(node) { return node.alternatives[2]; },
      params:    { c: "result0" }
    },
    {
      grammar:   'start = (a:"a" { }) "b" "c"',
      extractor: function(node) { return node.elements[0]; },
      params:    { a: "result0" }
    },
    {
      grammar:   'start = "a" "b" (c:"c" { })',
      extractor: function(node) { return node.elements[2]; },
      params:    { c: "result2" }
    },
    {
      grammar:   'start = a:(b:"b" { })',
      extractor: extractExpression,
      params:    { b: "result0" }
    },
    {
      grammar:   'start = &(a:"a" { })',
      extractor: extractExpression,
      params:    { a: "result0" }
    },
    {
      grammar:   'start = !(a:"a" { })',
      extractor: extractExpression,
      params:    { a: "result0" }
    },
    {
      grammar:   'start = (a:"a" { })?',
      extractor: extractExpression,
      params:    { a: "result0" }
    },
    {
      grammar:   'start = (a:"a" { })*',
      extractor: extractExpression,
      params:    { a: "result1" }
    },
    {
      grammar:   'start = (a:"a" { })+',
      extractor: extractExpression,
      params:    { a: "result1" }
    },
    {
      grammar:   'start = (a:"a" { }) { }',
      extractor: extractExpression,
      params:    { a: "result0" }
    },

    /* Scoping */
    {
      grammar:   'start = (a:"a" / b:"b" / c:"c") { }',
      extractor: extractNode,
      params:    { }
    },
    {
      grammar:   'start = a:(b:"b") { }',
      extractor: extractNode,
      params:    { a: "result0" }
    },
    {
      grammar:   'start = &(a:"a") { }',
      extractor: extractNode,
      params:    { }
    },
    {
      grammar:   'start = !(a:"a") { }',
      extractor: extractNode,
      params:    { }
    },
    {
      grammar:   'start = (a:"a")? { }',
      extractor: extractNode,
      params:    { }
    },
    {
      grammar:   'start = (a:"a")* { }',
      extractor: extractNode,
      params:    { }
    },
    {
      grammar:   'start = (a:"a")+ { }',
      extractor: extractNode,
      params:    { }
    },
    {
      grammar:   'start = (a:"a" { }) { }',
      extractor: extractNode,
      params:    { }
    },

    /* Sequences */
    {
      grammar:   'start = a:"a" b:"b" c:"c" { }',
      extractor: extractNode,
      params:    { a: "result0[0]", b: "result0[1]", c: "result0[2]" }
    },
    {
      grammar:   'start = a:"a" (b:"b" c:"c" d:"d") e:"e"{ }',
      extractor: extractNode,
      params:    {
        a: "result0[0]",
        b: "result0[1][0]",
        c: "result0[1][1]",
        d: "result0[1][2]",
        e: "result0[2]"
      }
    },
    /*
     * Regression tests for a bug where e.g. resultVar names like |result10|
     * were incorrectly treated as names derived from |result1|, leading to
     * incorrect substitution.
     */
    {
      grammar:   'start = ("a" "b" "c" "d" "e" "f" "g" "h" "i" j:"j" { })*',
      extractor: extractExpression,
      params:    { j: "result1[9]" } // Buggy code put "result1[0]0" here.
    }
  ];

  for (var i = 0; i < cases.length; i++) {
    var ast = PEG.parser.parse(cases[i].grammar);
    PEG.compiler.passes.computeVarNames(ast);
    PEG.compiler.passes.computeParams(ast);

    deepEqual(
      cases[i].extractor(ast.rules[0].expression).params,
      cases[i].params
    );
  }
});

})();
