(function() {

module("PEG.compiler.passes");

test("removes proxy rules", function() {
  function simpleGrammar(rules, startRule) {
    return {
      type:        "grammar",
      initializer: null,
      rules:       rules,
      startRule:   startRule
    }
  }

  var proxiedRule = {
    type:        "rule",
    name:        "proxied",
    displayName: null,
    expression:  { type: "literal", value: "a" }
  };

  var proxiedRuleRef = {
    type: "rule_ref",
    name: "proxied"
  }

  function simpleGrammarWithStartAndProxied(startRuleExpression) {
    return simpleGrammar(
      {
        start: {
          type:        "rule",
          name:        "start",
          displayName: null,
          expression:  startRuleExpression
        },
        proxied: proxiedRule
      },
      "start"
    );
  }

  var cases = [
    {
      grammar: 'start = proxy; proxy = proxied; proxied = "a"',
      ast:     simpleGrammar({ proxied: proxiedRule }, "proxied")
    },
    {
      grammar: 'start = proxy / "a" / "b"; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:         "choice",
        alternatives: [
          proxiedRuleRef,
          { type: "literal", value: "a" },
          { type: "literal", value: "b" }
        ]
      })
    },
    {
      grammar: 'start = "a" / "b" / proxy; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:         "choice",
        alternatives: [
          { type: "literal", value: "a" },
          { type: "literal", value: "b" },
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
          { type: "literal", value: "a" },
          { type: "literal", value: "b" }
        ]
      })
    },
    {
      grammar: 'start = "a" "b" proxy; proxy = proxied; proxied = "a"',
      ast:     simpleGrammarWithStartAndProxied({
        type:     "sequence",
        elements: [
          { type: "literal", value: "a" },
          { type: "literal", value: "b" },
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
    deepEqual(PEG.compiler.passes.proxyRules(ast), cases[i].ast);
  }
});

test("computes stack depths", function() {
  var cases = [
    /* Choice */
    {
      grammar:          'start = "a" / "b" / "c"',
      resultStackDepth: 1,
      posStackDepth:    1
    },
    {
      grammar:          'start = "a" / "b"* / "c"',
      resultStackDepth: 2,
      posStackDepth:    1
    },
    {
      grammar:          'start = "a" / &"b" / "c"',
      resultStackDepth: 1,
      posStackDepth:    2
    },

    /* Sequence */
    {
      grammar:          'start = "a" "b" "c"',
      resultStackDepth: 4,
      posStackDepth:    2
    },
    {
      grammar:          'start = "a" "b" "c"*',
      resultStackDepth: 5,
      posStackDepth:    2
    },
    {
      grammar:          'start = "a" "b"* "c"',
      resultStackDepth: 4,
      posStackDepth:    2
    },
    {
      grammar:          'start = "a" ("b"*)* "c"',
      resultStackDepth: 5,
      posStackDepth:    2
    },
    {
      grammar:          'start = "a"* "b" "c"',
      resultStackDepth: 4,
      posStackDepth:    2
    },
    {
      grammar:          'start = ("a"*)* "b" "c"',
      resultStackDepth: 4,
      posStackDepth:    2
    },
    {
      grammar:          'start = (("a"*)*)* "b" "c"',
      resultStackDepth: 5,
      posStackDepth:    2
    },
    {
      grammar:          'start = "a" &"b" "c"',
      resultStackDepth: 4,
      posStackDepth:    3
    },

    /* Others */
    { grammar: 'start = label:"a"',    resultStackDepth: 1, posStackDepth: 1 },
    { grammar: 'start = &"a"',         resultStackDepth: 1, posStackDepth: 2 },
    { grammar: 'start = !"a"',         resultStackDepth: 1, posStackDepth: 2 },
    { grammar: 'start = &{ code }',    resultStackDepth: 1, posStackDepth: 1 },
    { grammar: 'start = !{ code }',    resultStackDepth: 1, posStackDepth: 1 },
    { grammar: 'start = "a"?',         resultStackDepth: 1, posStackDepth: 1 },
    { grammar: 'start = "a"*',         resultStackDepth: 2, posStackDepth: 1 },
    { grammar: 'start = "a"+',         resultStackDepth: 2, posStackDepth: 1 },
    { grammar: 'start = "a" { code }', resultStackDepth: 1, posStackDepth: 2 },
    { grammar: 'start = a',            resultStackDepth: 1, posStackDepth: 1 },
    { grammar: 'start = "a"',          resultStackDepth: 1, posStackDepth: 1 },
    { grammar: 'start = .',            resultStackDepth: 1, posStackDepth: 1 },
    { grammar: 'start = [a-z]',        resultStackDepth: 1, posStackDepth: 1 }
  ];

  for (var i = 0; i < cases.length; i++) {
    var ast = PEG.parser.parse(cases[i].grammar);
    PEG.compiler.passes.stackDepths(ast)

    deepEqual(ast.rules["start"].resultStackDepth, cases[i].resultStackDepth);
    deepEqual(ast.rules["start"].posStackDepth,    cases[i].posStackDepth);
  }
});

})();
