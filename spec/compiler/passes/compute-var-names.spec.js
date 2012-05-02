describe("compiler pass |computeVarNames|", function() {
  var pass = PEG.compiler.passes.computeVarNames;

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

  function ruleDetails(details) { return { rules: [details] }; }

  beforeEach(function() {
    this.addMatchers({
      toChangeAST: function(grammar, details) {
        function matchDetails(value, details) {
          function isArray(value) {
            return Object.prototype.toString.apply(value) === "[object Array]";
          }

          function isObject(value) {
            return value !== null && typeof value === "object";
          }

          var i, key;

          if (isArray(details)) {
            if (!isArray(value)) { return false; }

            if (value.length !== details.length) { return false; }
            for (i = 0; i < details.length; i++) {
              if (!matchDetails(value[i], details[i])) { return false; }
            }

            return true;
          } else if (isObject(details)) {
            if (!isObject(value)) { return false; }

            for (key in details) {
              if (!(key in value)) { return false; }

              if (!matchDetails(value[key], details[key])) { return false; }
            }

            return true;
          } else {
            return value === details;
          }
        }

        var ast = PEG.parser.parse(grammar);

        this.actual(ast);

        this.message = function() {
          return "Expected the pass "
               + (this.isNot ? "not " : "")
               + "to change the AST " + jasmine.pp(ast) + " "
               + "to match " + jasmine.pp(details) + ", "
               + "but it " + (this.isNot ? "did" : "didn't") + ".";
        };

        return matchDetails(ast, details);
      }
    });
  });

  it("computes variable names for a choice", function() {
    expect(pass).toChangeAST('start = &"a" / &"b" / &"c"', ruleDetails({
      resultVars: ["result0"],
      posVars:    ["pos0"],
      expression: choiceDetails
    }));
    expect(pass).toChangeAST('start = &"a" / &"b"* / &"c"', ruleDetails({
      resultVars: ["result0", "result1"],
      posVars:    ["pos0"],
      expression: choiceDetails
    }));
    expect(pass).toChangeAST('start = &"a" / &(&"b") / &"c"', ruleDetails({
      resultVars: ["result0"],
      posVars:    ["pos0", "pos1"],
      expression: choiceDetails
    }));
  });

  it("computes variable names for a sequence", function() {
    expect(pass).toChangeAST('start = ', ruleDetails({
      resultVars: ["result0"],
      posVars:    ["pos0"],
      expression: { resultVar: "result0", posVar: "pos0" }
    }));
    expect(pass).toChangeAST('start = &"a" &"b" &"c"', ruleDetails({
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1"],
      expression: sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &"b" &"c"*', ruleDetails({
      resultVars: ["result0", "result1", "result2", "result3"],
      posVars:    ["pos0", "pos1"],
      expression: sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &"b"* &"c"', ruleDetails({
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1"],
      expression: sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &("b"*)* &"c"', ruleDetails({
      resultVars: ["result0", "result1", "result2", "result3"],
      posVars:    ["pos0", "pos1"],
      expression: sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a"* &"b" &"c"', ruleDetails({
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1"],
      expression: sequenceDetails
    }));
    expect(pass).toChangeAST('start = &("a"*)* &"b" &"c"', ruleDetails({
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1"],
      expression: sequenceDetails
    }));
    expect(pass).toChangeAST('start = &(("a"*)*)* &"b" &"c"', ruleDetails({
      resultVars: ["result0", "result1", "result2", "result3"],
      posVars:    ["pos0", "pos1"],
      expression: sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &(&"b") &"c"', ruleDetails({
      resultVars: ["result0", "result1", "result2"],
      posVars:    ["pos0", "pos1", "pos2"],
      expression: sequenceDetails
    }));
  });

  it("computes variable names for a labeled", function() {
    expect(pass).toChangeAST('start = label:&"a"', ruleDetails({
      resultVars: ["result0"],
      posVars:    ["pos0"],
      expression: {
        resultVar:  "result0",
        expression: { resultVar: "result0", posVar: "pos0" }
      }
    }));
  });

  it("computes variable names for a simple and", function() {
    expect(pass).toChangeAST('start = &(&"a")', ruleDetails({
      resultVars: ["result0"],
      posVars:    ["pos0", "pos1"],
      expression: {
        resultVar:  "result0",
        posVar:     "pos0",
        expression: { resultVar: "result0", posVar: "pos1" }
      }
    }));
  });

  it("computes variable names for a simple not", function() {
    expect(pass).toChangeAST('start = !(&"a")', ruleDetails({
      resultVars: ["result0"],
      posVars:    ["pos0", "pos1"],
      expression: {
        resultVar:  "result0",
        posVar:     "pos0",
        expression: { resultVar: "result0", posVar: "pos1" }
      }
    }));
  });

  it("computes variable names for a semantic and", function() {
    expect(pass).toChangeAST('start = &{ code }', ruleDetails({
      resultVars: ["result0"],
      posVars:    [],
      expression: leafDetails
    }));
  });

  it("computes variable names for a semantic not", function() {
    expect(pass).toChangeAST('start = !{ code }', ruleDetails({
      resultVars: ["result0"],
      posVars:    [],
      expression: leafDetails
    }));
  });

  it("computes variable names for an optional", function() {
    expect(pass).toChangeAST('start = (&"a")?', ruleDetails({
      resultVars: ["result0"],
      posVars:    ["pos0"],
      expression: {
        resultVar:  "result0",
        expression: { resultVar: "result0", posVar: "pos0" }
      }
    }));
  });

  it("computes variable names for a zero or more", function() {
    expect(pass).toChangeAST('start = (&"a")*', ruleDetails({
      resultVars: ["result0", "result1"],
      posVars:    ["pos0"],
      expression: {
        resultVar:  "result0",
        expression: { resultVar: "result1", posVar: "pos0" }
      }
    }));
  });

  it("computes variable names for a one or more", function() {
    expect(pass).toChangeAST('start = (&"a")+', ruleDetails({
      resultVars: ["result0", "result1"],
      posVars:    ["pos0"],
      expression: {
        resultVar:  "result0",
        expression: { resultVar: "result1", posVar: "pos0" }
      }
    }));
  });

  it("computes variable names for an action", function() {
    expect(pass).toChangeAST('start = &"a" { code }', ruleDetails({
      resultVars: ["result0"],
      posVars:    ["pos0", "pos1"],
      expression: {
        resultVar:  "result0",
        posVar:     "pos0",
        expression: { resultVar: "result0", posVar: "pos1" }
      }
    }));
  });

  it("computes variable names for a rule reference", function() {
    expect(pass).toChangeAST('start = a', ruleDetails({
      resultVars: ["result0"],
      posVars:    [],
      expression: leafDetails
    }));
  });

  it("computes variable names for a literal", function() {
    expect(pass).toChangeAST('start = "a"', ruleDetails({
      resultVars: ["result0"],
      posVars:    [],
      expression: leafDetails
    }));
  });

  it("computes variable names for an any", function() {
    expect(pass).toChangeAST('start = .', ruleDetails({
      resultVars: ["result0"],
      posVars:    [],
      expression: leafDetails
    }));
  });

  it("computes variable names for a class", function() {
    expect(pass).toChangeAST('start = [a-z]', ruleDetails({
      resultVars: ["result0"],
      posVars:    [],
      expression: leafDetails
    }));
  });
});
