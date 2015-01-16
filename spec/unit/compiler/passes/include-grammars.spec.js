describe("compiler pass |includeGrammars|", function() {
  var pass = PEG.compiler.passes.preCheck.includeGrammars;
  var Resolver = PEG.Resolver;

  describe("add rules from imported grammar to grammar AST", function() {
    var options = {
      resolver: new Resolver(function() {
        return {
          path: '',
          data: [
            'rule1 = "a"',
            'rule2 = "b"',
            'rule3 = "c"'
          ].join('\n')
        };
      })
    };
    it("with default rule ref", function() {
      expect(pass).toChangeAST(
        [
          '#inc = ""',
          'start = #inc'
        ].join("\n"),
        options,
        {
          rules: [
            {
              name:       "inc$rule1",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "inc$rule2",
              expression: { type: "literal", value: "b" }
            },
            {
              name:       "inc$rule3",
              expression: { type: "literal", value: "c" }
            },
            {
              name:       "start",
              expression: { type: "rule_ref", namespace: null, name: "inc$rule1" }
            }
          ]
        }
      );
    });
    it("with explicit specified rule ref", function() {
      expect(pass).toChangeAST(
        [
          '#inc = ""',
          'start = #inc:rule2'
        ].join("\n"),
        options,
        {
          rules: [
            {
              name:       "inc$rule1",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "inc$rule2",
              expression: { type: "literal", value: "b" }
            },
            {
              name:       "inc$rule3",
              expression: { type: "literal", value: "c" }
            },
            {
              name:       "start",
              expression: { type: "rule_ref", namespace: null, name: "inc$rule2" }
            }
          ]
        }
      );
    });
  });

  describe("allow import one grammar multiply times with distinct aliases", function() {
    it("with default rule ref", function() {
      expect(pass).toChangeAST(
        [
          '#inc1 = ""',
          '#inc2 = ""',
          'start = #inc1 #inc2'
        ].join("\n"),
        { resolver: new Resolver(function() { return { path: '', data: 'rule = "a"' }; }) },
        {
          rules: [
            {
              name:       "inc1$rule",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "inc2$rule",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "start",
              expression: {
                elements: [
                  { type: "rule_ref", namespace: null, name: "inc1$rule" },
                  { type: "rule_ref", namespace: null, name: "inc2$rule" }
                ]
              }
            }
          ]
        }
      );
    });
    it("with explicit specified rule ref", function() {
      expect(pass).toChangeAST(
        [
          '#inc1 = ""',
          '#inc2 = ""',
          'start = #inc1:rule1 #inc2:rule2'
        ].join("\n"),
        { resolver: new Resolver(function() { return { path: '', data: 'rule1 = "a";rule2 = "b"' }; }) },
        {
          rules: [
            {
              name:       "inc1$rule1",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "inc1$rule2",
              expression: { type: "literal", value: "b" }
            },
            {
              name:       "inc2$rule1",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "inc2$rule2",
              expression: { type: "literal", value: "b" }
            },
            {
              name:       "start",
              expression: {
                elements: [
                  { type: "rule_ref", namespace: null, name: "inc1$rule1" },
                  { type: "rule_ref", namespace: null, name: "inc2$rule2" }
                ]
              }
            }
          ]
        }
      );
    });
  });

  describe("recursive include rules from included grammars", function() {
    var options = {
      resolver: new Resolver(function(path) {
        return {
          path: path,
          data: [
            path.length === 0 ? '#inc = "second"' : '',
            'rule1 = "a"',
            'rule2 = "b"'
          ].join('\n')
        };
      })
    };
    it("with default rule ref", function() {
      expect(pass).toChangeAST(
        [
          '#inc = ""',
          'start = #inc'
        ].join("\n"),
        options,
        {
          rules: [
            {
              name:       "inc$inc$rule1",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "inc$inc$rule2",
              expression: { type: "literal", value: "b" }
            },
            {
              name:       "inc$rule1",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "inc$rule2",
              expression: { type: "literal", value: "b" }
            },
            {
              name:       "start",
              expression: { type: "rule_ref", namespace: null, name: "inc$rule1" }
            }
          ]
        }
      );
    });
    it("with explicit specified rule ref", function() {
      expect(pass).toChangeAST(
        [
          '#inc = ""',
          'start = #inc:rule2'
        ].join("\n"),
        options,
        {
          rules: [
            {
              name:       "inc$inc$rule1",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "inc$inc$rule2",
              expression: { type: "literal", value: "b" }
            },
            {
              name:       "inc$rule1",
              expression: { type: "literal", value: "a" }
            },
            {
              name:       "inc$rule2",
              expression: { type: "literal", value: "b" }
            },
            {
              name:       "start",
              expression: { type: "rule_ref", namespace: null, name: "inc$rule2" }
            }
          ]
        }
      );
    });
  });
});
