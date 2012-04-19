(function() {

module("PEG.compiler.passes.computeVarNames");

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

})();
