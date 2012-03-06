(function() {

module("PEG.compiler.passes");

test("reports missing referenced rules", function() {
  function testGrammar(grammar) {
    raises(
      function() {
        var ast = PEG.parser.parse(grammar);
        PEG.compiler.passes.reportMissingRules(ast);
      },
      function(e) {
        return e instanceof PEG.GrammarError
          && e.message === "Referenced rule \"missing\" does not exist.";
      }
    );
  }

  var grammars = [
    'start = missing',
    'start = missing / "a" / "b"',
    'start = "a" / "b" / missing',
    'start = missing "a" "b"',
    'start = "a" "b" missing',
    'start = label:missing',
    'start = &missing',
    'start = !missing',
    'start = missing?',
    'start = missing*',
    'start = missing+',
    'start = missing { }'
  ];

  for (var i = 0; i < grammars.length; i++) { testGrammar(grammars[i]); }
});

test("reports left recursion", function() {
  function testGrammar(grammar) {
    raises(
      function() {
        var ast = PEG.parser.parse(grammar);
        PEG.compiler.passes.reportLeftRecursion(ast);
      },
      function(e) {
        return e instanceof PEG.GrammarError
          && e.message === "Left recursion detected for rule \"start\".";
      }
    );
  }

  var grammars = [
    /* Direct */
    'start = start',
    'start = start / "a" / "b"',
    'start = "a" / "b" / start',
    'start = start "a" "b"',
    'start = label:start',
    'start = &start',
    'start = !start',
    'start = start?',
    'start = start*',
    'start = start+',
    'start = start { }',

    /* Indirect */
    'start = stop; stop = start'
  ];

  for (var i = 0; i < grammars.length; i++) { testGrammar(grammars[i]); }
});

test("removes proxy rules", function() {
  function simpleGrammar(rules, startRule) {
    return {
      type:        "grammar",
      initializer: null,
      rules:       rules,
      startRule:   startRule
    };
  }

  var proxiedRule = {
    type:        "rule",
    name:        "proxied",
    displayName: null,
    expression:  { type: "literal", value: "a", ignoreCase: false }
  };

  var proxiedRuleRef = {
    type: "rule_ref",
    name: "proxied"
  };

  function simpleGrammarWithStartAndProxied(startRuleExpression) {
    return simpleGrammar(
      [
        {
          type:        "rule",
          name:        "start",
          displayName: null,
          expression:  startRuleExpression
        },
        proxiedRule
      ],
      "start"
    );
  }

  var cases = [
    {
      grammar: 'start = proxy; proxy = proxied; proxied = "a"',
      ast:     simpleGrammar([proxiedRule], "proxied")
    },
    {
      grammar: 'start = proxy / "a" / "b"; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:         "choice",
        alternatives: [
          proxiedRuleRef,
          { type: "literal", value: "a", ignoreCase: false },
          { type: "literal", value: "b", ignoreCase: false }
        ]
      })
    },
    {
      grammar: 'start = "a" / "b" / proxy; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:         "choice",
        alternatives: [
          { type: "literal", value: "a", ignoreCase: false },
          { type: "literal", value: "b", ignoreCase: false },
          proxiedRuleRef
        ]
      })
    },
    {
      grammar: 'start = proxy "a" "b"; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:     "sequence",
        elements: [
          proxiedRuleRef,
          { type: "literal", value: "a", ignoreCase: false },
          { type: "literal", value: "b", ignoreCase: false }
        ]
      })
    },
    {
      grammar: 'start = "a" "b" proxy; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:     "sequence",
        elements: [
          { type: "literal", value: "a", ignoreCase: false },
          { type: "literal", value: "b", ignoreCase: false },
          proxiedRuleRef
        ]
      })
    },
    {
      grammar: 'start = label:proxy; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:       "labeled",
        label:      "label",
        expression: proxiedRuleRef
      })
    },
    {
      grammar: 'start = &proxy; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:       "simple_and",
        expression: proxiedRuleRef
      })
    },
    {
      grammar: 'start = !proxy; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:       "simple_not",
        expression: proxiedRuleRef
      })
    },
    {
      grammar: 'start = proxy?; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:       "optional",
        expression: proxiedRuleRef
      })
    },
    {
      grammar: 'start = proxy*; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:       "zero_or_more",
        expression: proxiedRuleRef
      })
    },
    {
      grammar: 'start = proxy+; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:       "one_or_more",
        expression: proxiedRuleRef
      })
    },
    {
      grammar: 'start = proxy { }; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:       "action",
        code:       " ",
        expression: proxiedRuleRef
      })
    }
  ];

  for (var i = 0; i < cases.length; i++) {
    var ast = PEG.parser.parse(cases[i].grammar);
    PEG.compiler.passes.removeProxyRules(ast);

    deepEqual(ast, cases[i].ast);
  }
});

test("computes variable names", function() {
  var leafDetails     = { resultVar: "result0" },
      choiceDetails   = {
        resultVar:    "result0",
        alternatives: [
          { resultVar: "result0", posVar: "pos0" },
          { resultVar: "result0", posVar: "pos0" },
          { resultVar: "result0", posVar: "pos0" }
        ]
      },
      sequenceDetails = {
        resultVar: "result0",
        posVar:    "pos0",
        elements:  [
          { resultVar: "result0", posVar: "pos1" },
          { resultVar: "result1", posVar: "pos1" },
          { resultVar: "result2", posVar: "pos1" }
        ]
      };

  var cases = [
    /* Choice */
    {
      grammar:    'start = &"a" / &"b" / &"c"',
      resultVars: ["result0"],
      posVars:    ["pos0"],
      details:    choiceDetails
    },
    {
      grammar:    'start = &"a" / &"b"* / &"c"',
      resultVars: ["result0", "result1"],
      posVars:    ["pos0"],
      details:    choiceDetails
    },
    {
      grammar:    'start = &"a" / &(&"b") / &"c"',
      resultVars: ["result0"],
      posVars:    ["pos0", "pos1"],
      details:    choiceDetails
    },

    /* Sequence */
    {
      grammar:    'start = ',
      resultVars: ["result0"],
      posVars:    ["pos0"],
      details:    { resultVar: "result0", posVar: "pos0" }
    },
    {
      grammar:    'start = &"a" &"b" &"c"',
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1"],
      details:    sequenceDetails
    },
    {
      grammar:    'start = &"a" &"b" &"c"*',
      resultVars: ["result0", "result1", "result2", "result3"],
      posVars:    ["pos0", "pos1"],
      details:    sequenceDetails
    },
    {
      grammar:    'start = &"a" &"b"* &"c"',
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1"],
      details:    sequenceDetails
    },
    {
      grammar:    'start = &"a" &("b"*)* &"c"',
      resultVars: ["result0", "result1", "result2", "result3"],
      posVars:    ["pos0", "pos1"],
      details:    sequenceDetails
    },
    {
      grammar:    'start = &"a"* &"b" &"c"',
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1"],
      details:    sequenceDetails
    },
    {
      grammar:    'start = &("a"*)* &"b" &"c"',
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1"],
      details:    sequenceDetails
    },
    {
      grammar:    'start = &(("a"*)*)* &"b" &"c"',
      resultVars: ["result0", "result1", "result2", "result3"],
      posVars:    ["pos0", "pos1"],
      details:    sequenceDetails
    },
    {
      grammar:    'start = &"a" &(&"b") &"c"',
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1", "pos2"],
      details:    sequenceDetails
    },

    /* Others */
    {
      grammar:    'start = label:&"a"',
      resultVars: ["result0"],
      posVars:    ["pos0"],
      details:    {
        resultVar:  "result0",
        expression: { resultVar: "result0", posVar: "pos0" }
      }
    },
    {
      grammar:    'start = &(&"a")',
      resultVars: ["result0"],
      posVars:    ["pos0", "pos1"],
      details:    {
        resultVar:  "result0",
        posVar:     "pos0",
        expression: { resultVar: "result0", posVar: "pos1" }
      }
    },
    {
      grammar:    'start = !(&"a")',
      resultVars: ["result0"],
      posVars:    ["pos0", "pos1"],
      details:    {
        resultVar:  "result0",
        posVar:     "pos0",
        expression: { resultVar: "result0", posVar: "pos1" }
      }
    },
    {
      grammar:    'start = &{ code }',
      resultVars: ["result0"],
      posVars:    [],
      details:    leafDetails
    },
    {
      grammar:    'start = !{ code }',
      resultVars: ["result0"],
      posVars:    [],
      details:    leafDetails
    },
    {
      grammar:    'start = (&"a")?',
      resultVars: ["result0"],
      posVars:    ["pos0"],
      details:    {
        resultVar:  "result0",
        expression: { resultVar: "result0", posVar: "pos0" }
      }
    },
    {
      grammar:    'start = (&"a")*',
      resultVars: ["result0", "result1"],
      posVars:    ["pos0"],
      details:    {
        resultVar:  "result0",
        expression: { resultVar: "result1", posVar: "pos0" }
      }
    },
    {
      grammar:    'start = (&"a")+',
      resultVars: ["result0", "result1"],
      posVars:    ["pos0"],
      details:    {
        resultVar:  "result0",
        expression: { resultVar: "result1", posVar: "pos0" }
      }
    },
    {
      grammar:    'start = &"a" { code }',
      resultVars: ["result0"],
      posVars:    ["pos0", "pos1"],
      details:    {
        resultVar:  "result0",
        posVar:     "pos0",
        expression: { resultVar: "result0", posVar: "pos1" }
      }
    },
    {
      grammar:    'start = a',
      resultVars: ["result0"],
      posVars:    [],
      details:    leafDetails
    },
    {
      grammar:    'start = "a"',
      resultVars: ["result0"],
      posVars:    [],
      details:    leafDetails
    },
    {
      grammar:    'start = .',
      resultVars: ["result0"],
      posVars:    [],
      details:    leafDetails
    },
    {
      grammar:    'start = [a-z]',
      resultVars: ["result0"],
      posVars:    [],
      details:    leafDetails
    }
  ];

  function checkDetails(node, details) {
    for (var key in details) {
      if (Object.prototype.toString.call(details[key]) === "[object Array]") {
        for (var i = 0; i < details[key].length; i++) {
          checkDetails(node[key][i], details[key][i]);
        }
      } else if (typeof details[key] === "object") {
        checkDetails(node[key], details[key]);
      } else {
        strictEqual(node[key], details[key]);
      }
    }
  }

  for (var i = 0; i < cases.length; i++) {
    var ast = PEG.parser.parse(cases[i].grammar);
    PEG.compiler.passes.computeVarNames(ast);

    deepEqual(ast.rules[0].resultVars, cases[i].resultVars);
    deepEqual(ast.rules[0].posVars,    cases[i].posVars);
    checkDetails(ast.rules[0].expression, cases[i].details);
  }
});

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
