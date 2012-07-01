describe("compiler pass |allocateRegisters|", function() {
  var pass = PEG.compiler.passes.allocateRegisters;

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

  it("allocates registers for a named", function() {
    expect(pass).toChangeAST('start "start" = &"a"', ruleDetails({
      registerCount: 2,
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 0, posIndex: 1 }
      }
    }));
  });

  it("allocates registers for a choice", function() {
    expect(pass).toChangeAST('start = &"a" / &"b" / &"c"', ruleDetails({
      registerCount: 2,
      expression:    choiceDetails
    }));
    expect(pass).toChangeAST('start = &"a" / &"b"* / &"c"', ruleDetails({
      registerCount: 3,
      expression:    choiceDetails
    }));
    expect(pass).toChangeAST('start = &"a" / &(&"b") / &"c"', ruleDetails({
      registerCount: 3,
      expression:    choiceDetails
    }));
  });

  it("allocates registers for an action", function() {
    expect(pass).toChangeAST('start = &"a" { code }', ruleDetails({
      registerCount: 3,
      expression:    {
        resultIndex: 0,
        posIndex:    1,
        expression:  { resultIndex: 0, posIndex: 2 }
      }
    }));
  });

  it("allocates registers for a sequence", function() {
    expect(pass).toChangeAST('start = ', ruleDetails({
      registerCount: 2,
      expression:    { resultIndex: 0, posIndex: 1 }
    }));
    expect(pass).toChangeAST('start = &"a" &"b" &"c"', ruleDetails({
      registerCount: 6,
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &"b" &"c"*', ruleDetails({
      registerCount: 7,
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &"b"* &"c"', ruleDetails({
      registerCount: 6,
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &("b"*)* &"c"', ruleDetails({
      registerCount: 7,
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a"* &"b" &"c"', ruleDetails({
      registerCount: 6,
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &("a"*)* &"b" &"c"', ruleDetails({
      registerCount: 6,
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &(("a"*)*)* &"b" &"c"', ruleDetails({
      registerCount: 7,
      expression:    sequenceDetails
    }));
    expect(pass).toChangeAST('start = &"a" &(&"b") &"c"', ruleDetails({
      registerCount: 6,
      expression:    sequenceDetails
    }));
  });

  it("allocates registers for a labeled", function() {
    expect(pass).toChangeAST('start = label:&"a"', ruleDetails({
      registerCount: 2,
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 0, posIndex: 1 }
      }
    }));
  });

  it("allocates registers for a simple and", function() {
    expect(pass).toChangeAST('start = &(&"a")', ruleDetails({
      registerCount: 3,
      expression:    {
        resultIndex: 0,
        posIndex:    1,
        expression:  { resultIndex: 0, posIndex: 2 }
      }
    }));
  });

  it("allocates registers for a simple not", function() {
    expect(pass).toChangeAST('start = !(&"a")', ruleDetails({
      registerCount: 3,
      expression:    {
        resultIndex: 0,
        posIndex:    1,
        expression:  { resultIndex: 0, posIndex: 2 }
      }
    }));
  });

  it("allocates registers for a semantic and", function() {
    expect(pass).toChangeAST('start = &{ code }', ruleDetails({
      registerCount: 1,
      expression:    leafDetails
    }));
  });

  it("allocates registers for a semantic not", function() {
    expect(pass).toChangeAST('start = !{ code }', ruleDetails({
      registerCount: 1,
      expression:    leafDetails
    }));
  });

  it("allocates registers for an optional", function() {
    expect(pass).toChangeAST('start = (&"a")?', ruleDetails({
      registerCount: 2,
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 0, posIndex: 1 }
      }
    }));
  });

  it("allocates registers for a zero or more", function() {
    expect(pass).toChangeAST('start = (&"a")*', ruleDetails({
      registerCount: 3,
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 1, posIndex: 2 }
      }
    }));
  });

  it("allocates registers for a one or more", function() {
    expect(pass).toChangeAST('start = (&"a")+', ruleDetails({
      registerCount: 3,
      expression:    {
        resultIndex: 0,
        expression:  { resultIndex: 1, posIndex: 2 }
      }
    }));
  });

  it("allocates registers for a rule reference", function() {
    expect(pass).toChangeAST('start = a', ruleDetails({
      registerCount: 1,
      expression:    leafDetails
    }));
  });

  it("allocates registers for a literal", function() {
    expect(pass).toChangeAST('start = "a"', ruleDetails({
      registerCount: 1,
      expression:    leafDetails
    }));
  });

  it("allocates registers for a class", function() {
    expect(pass).toChangeAST('start = [a-z]', ruleDetails({
      registerCount: 1,
      expression:    leafDetails
    }));
  });

  it("allocates registers for an any", function() {
    expect(pass).toChangeAST('start = .', ruleDetails({
      registerCount: 1,
      expression:    leafDetails
    }));
  });
});
