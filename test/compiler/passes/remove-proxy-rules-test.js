(function() {

module("PEG.compiler.passes.removeProxyRules");

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

})();
