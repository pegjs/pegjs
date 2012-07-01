describe("compiler pass |computeVarIndices|", function() {
  var pass = PEG.compiler.passes.computeVarIndices;

  var leafDetails     = { resultIndex: 0 },
      choiceDetails   = {
        resultIndex:  0,
        alternatives: [
          { resultIndex: 0, posIndex: 1 },
          { resultIndex: 0, posIndex: 1 },
          { resultIndex: 0, posIndex: 1 }
        ]
      },
      sequenceDetails = {
        resultIndex: 0,
        posIndex:    1,
        elements:    [
          { resultIndex: 2, posIndex: 3 },
          { resultIndex: 3, posIndex: 4 },
          { resultIndex: 4, posIndex: 5 }
        ]
      };

  function ruleDetails(details) { return { rules: [details] }; }

  it("computes variable indices for a named", function() {
    expect(pass).toChangeAST('start "start" = &"a"', ruleDetails({
      resultIndices: [0, 1],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 0, posIndex: 1 }
      }
    }));
  });

  it("computes variable indices for a choice", function() {
    expect(pass).toChangeAST('start = &"a" / &"b" / &"c"', ruleDetails({
      resultIndices: [0, 1],
      expression:    choiceDetails
    }));
    expect(pass).toChangeAST('start = &"a" / &"b"* / &"c"', ruleDetails({
      resultIndices: [0, 1, 2],
      expression:    choiceDetails
    }));
    expect(pass).toChangeAST('start = &"a" / &(&"b") / &"c"', ruleDetails({
      resultIndices: [0, 1, 2],
      expression:    choiceDetails
    }));
  });

  it("computes variable indices for an action", function() {
    expect(pass).toChangeAST('start = &"a" { code }', ruleDetails({
      resultIndices: [0, 1, 2],
      expression:    {
        resultIndex: 0,
        posIndex:    1,
        expression:  { resultIndex: 0, posIndex: 2 }
      }
    }));
  });

  it("computes variable indices for a sequence", function() {
    expect(pass).toChangeAST('start = ', ruleDetails({
      resultIndices: [0, 1],
      expression:    { resultIndex: 0, posIndex: 1 }
    }));
    expect(pass).toChangeAST('start = &"a" &"b" &"c"', ruleDetails({
      resultIndices: [0, 1, 2, 3, 4, 5],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &"b" &"c"*', ruleDetails({
      resultIndices: [0, 1, 2, 3, 4, 5, 6],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &"b"* &"c"', ruleDetails({
      resultIndices: [0, 1, 2, 3, 4, 5],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &("b"*)* &"c"', ruleDetails({
      resultIndices: [0, 1, 2, 3, 4, 5, 6],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a"* &"b" &"c"', ruleDetails({
      resultIndices: [0, 1, 2, 3, 4, 5],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &("a"*)* &"b" &"c"', ruleDetails({
      resultIndices: [0, 1, 2, 3, 4, 5],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &(("a"*)*)* &"b" &"c"', ruleDetails({
      resultIndices: [0, 1, 2, 3, 4, 5, 6],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &(&"b") &"c"', ruleDetails({
      resultIndices: [0, 1, 2, 3, 4, 5],
      expression:    sequenceDetails
    }));
  });

  it("computes variable indices for a labeled", function() {
    expect(pass).toChangeAST('start = label:&"a"', ruleDetails({
      resultIndices: [0, 1],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 0, posIndex: 1 }
      }
    }));
  });

  it("computes variable indices for a simple and", function() {
    expect(pass).toChangeAST('start = &(&"a")', ruleDetails({
      resultIndices: [0, 1, 2],
      expression:    {
        resultIndex: 0,
        posIndex:    1,
        expression:  { resultIndex: 0, posIndex: 2 }
      }
    }));
  });

  it("computes variable indices for a simple not", function() {
    expect(pass).toChangeAST('start = !(&"a")', ruleDetails({
      resultIndices: [0, 1, 2],
      expression:    {
        resultIndex: 0,
        posIndex:    1,
        expression:  { resultIndex: 0, posIndex: 2 }
      }
    }));
  });

  it("computes variable indices for a semantic and", function() {
    expect(pass).toChangeAST('start = &{ code }', ruleDetails({
      resultIndices: [0],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for a semantic not", function() {
    expect(pass).toChangeAST('start = !{ code }', ruleDetails({
      resultIndices: [0],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for an optional", function() {
    expect(pass).toChangeAST('start = (&"a")?', ruleDetails({
      resultIndices: [0, 1],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 0, posIndex: 1 }
      }
    }));
  });

  it("computes variable indices for a zero or more", function() {
    expect(pass).toChangeAST('start = (&"a")*', ruleDetails({
      resultIndices: [0, 1, 2],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 1, posIndex: 2 }
      }
    }));
  });

  it("computes variable indices for a one or more", function() {
    expect(pass).toChangeAST('start = (&"a")+', ruleDetails({
      resultIndices: [0, 1, 2],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 1, posIndex: 2 }
      }
    }));
  });

  it("computes variable indices for a rule reference", function() {
    expect(pass).toChangeAST('start = a', ruleDetails({
      resultIndices: [0],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for a literal", function() {
    expect(pass).toChangeAST('start = "a"', ruleDetails({
      resultIndices: [0],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for a class", function() {
    expect(pass).toChangeAST('start = [a-z]', ruleDetails({
      resultIndices: [0],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for an any", function() {
    expect(pass).toChangeAST('start = .', ruleDetails({
      resultIndices: [0],
      expression:    leafDetails
    }));
  });
});
