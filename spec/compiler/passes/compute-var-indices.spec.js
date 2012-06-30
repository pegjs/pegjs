describe("compiler pass |computeVarIndices|", function() {
  var pass = PEG.compiler.passes.computeVarIndices;

  var leafDetails     = { resultIndex: 0 },
      choiceDetails   = {
        resultIndex:  0,
        alternatives: [
          { resultIndex: 0, posIndex: 0 },
          { resultIndex: 0, posIndex: 0 },
          { resultIndex: 0, posIndex: 0 }
        ]
      },
      sequenceDetails = {
        resultIndex: 0,
        posIndex:    0,
        elements:    [
          { resultIndex: 0, posIndex: 1 },
          { resultIndex: 1, posIndex: 1 },
          { resultIndex: 2, posIndex: 1 }
        ]
      };

  function ruleDetails(details) { return { rules: [details] }; }

  it("computes variable indices for a named", function() {
    expect(pass).toChangeAST('start "start" = &"a"', ruleDetails({
      resultIndices: [0],
      posIndices:    [0],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 0, posIndex: 0 }
      }
    }));
  });

  it("computes variable indices for a choice", function() {
    expect(pass).toChangeAST('start = &"a" / &"b" / &"c"', ruleDetails({
      resultIndices: [0],
      posIndices:    [0],
      expression:    choiceDetails
    }));
    expect(pass).toChangeAST('start = &"a" / &"b"* / &"c"', ruleDetails({
      resultIndices: [0, 1],
      posIndices:    [0],
      expression:    choiceDetails
    }));
    expect(pass).toChangeAST('start = &"a" / &(&"b") / &"c"', ruleDetails({
      resultIndices: [0],
      posIndices:    [0, 1],
      expression:    choiceDetails
    }));
  });

  it("computes variable indices for an action", function() {
    expect(pass).toChangeAST('start = &"a" { code }', ruleDetails({
      resultIndices: [0],
      posIndices:    [0, 1],
      expression:    {
        resultIndex: 0,
        posIndex:    0,
        expression:  { resultIndex: 0, posIndex: 1 }
      }
    }));
  });

  it("computes variable indices for a sequence", function() {
    expect(pass).toChangeAST('start = ', ruleDetails({
      resultIndices: [0],
      posIndices:    [0],
      expression:    { resultIndex: 0, posIndex: 0 }
    }));
    expect(pass).toChangeAST('start = &"a" &"b" &"c"', ruleDetails({
      resultIndices: [0, 1, 2],
      posIndices:    [0, 1],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &"b" &"c"*', ruleDetails({
      resultIndices: [0, 1, 2, 3],
      posIndices:    [0, 1],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &"b"* &"c"', ruleDetails({
      resultIndices: [0, 1, 2],
      posIndices:    [0, 1],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &("b"*)* &"c"', ruleDetails({
      resultIndices: [0, 1, 2, 3],
      posIndices:    [0, 1],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a"* &"b" &"c"', ruleDetails({
      resultIndices: [0, 1, 2],
      posIndices:    [0, 1],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &("a"*)* &"b" &"c"', ruleDetails({
      resultIndices: [0, 1, 2],
      posIndices:    [0, 1],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &(("a"*)*)* &"b" &"c"', ruleDetails({
      resultIndices: [0, 1, 2, 3],
      posIndices:    [0, 1],
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &(&"b") &"c"', ruleDetails({
      resultIndices: [0, 1, 2],
      posIndices:    [0, 1, 2],
      expression:    sequenceDetails
    }));
  });

  it("computes variable indices for a labeled", function() {
    expect(pass).toChangeAST('start = label:&"a"', ruleDetails({
      resultIndices: [0],
      posIndices:    [0],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 0, posIndex: 0 }
      }
    }));
  });

  it("computes variable indices for a simple and", function() {
    expect(pass).toChangeAST('start = &(&"a")', ruleDetails({
      resultIndices: [0],
      posIndices:    [0, 1],
      expression:    {
        resultIndex: 0,
        posIndex:    0,
        expression:  { resultIndex: 0, posIndex: 1 }
      }
    }));
  });

  it("computes variable indices for a simple not", function() {
    expect(pass).toChangeAST('start = !(&"a")', ruleDetails({
      resultIndices: [0],
      posIndices:    [0, 1],
      expression:    {
        resultIndex: 0,
        posIndex:    0,
        expression:  { resultIndex: 0, posIndex: 1 }
      }
    }));
  });

  it("computes variable indices for a semantic and", function() {
    expect(pass).toChangeAST('start = &{ code }', ruleDetails({
      resultIndices: [0],
      posIndices:    [],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for a semantic not", function() {
    expect(pass).toChangeAST('start = !{ code }', ruleDetails({
      resultIndices: [0],
      posIndices:    [],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for an optional", function() {
    expect(pass).toChangeAST('start = (&"a")?', ruleDetails({
      resultIndices: [0],
      posIndices:    [0],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 0, posIndex: 0 }
      }
    }));
  });

  it("computes variable indices for a zero or more", function() {
    expect(pass).toChangeAST('start = (&"a")*', ruleDetails({
      resultIndices: [0, 1],
      posIndices:    [0],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 1, posIndex: 0 }
      }
    }));
  });

  it("computes variable indices for a one or more", function() {
    expect(pass).toChangeAST('start = (&"a")+', ruleDetails({
      resultIndices: [0, 1],
      posIndices:    [0],
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 1, posIndex: 0 }
      }
    }));
  });

  it("computes variable indices for a rule reference", function() {
    expect(pass).toChangeAST('start = a', ruleDetails({
      resultIndices: [0],
      posIndices:    [],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for a literal", function() {
    expect(pass).toChangeAST('start = "a"', ruleDetails({
      resultIndices: [0],
      posIndices:    [],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for a class", function() {
    expect(pass).toChangeAST('start = [a-z]', ruleDetails({
      resultIndices: [0],
      posIndices:    [],
      expression:    leafDetails
    }));
  });

  it("computes variable indices for an any", function() {
    expect(pass).toChangeAST('start = .', ruleDetails({
      resultIndices: [0],
      posIndices:    [],
      expression:    leafDetails
    }));
  });
});
