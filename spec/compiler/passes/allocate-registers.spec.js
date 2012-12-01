describe("compiler pass |allocateRegisters|", function() {
  var pass = PEG.compiler.passes.allocateRegisters;

  function ruleDetails(details) { return { rules: [details] }; }

  function expressionDetails(details) {
    return ruleDetails({ expression: details });
  }

  function innerExpressionDetails(details) {
    return expressionDetails({ expression: details });
  }

  var reuseResultDetails = innerExpressionDetails({ resultIndex: 0 }),
      allocResultDetails = innerExpressionDetails({ resultIndex: 1 }),
      savePosDetails     = expressionDetails({ posIndex: 1 }),
      scopedDetails      = expressionDetails({ params: {} }),
      blockedDetails     = expressionDetails({
        elements: [
          {},
          {
            resultIndex: 3,
            posIndex:    5,
            elements:    [{ resultIndex: 6 }, { resultIndex: 7 }]
          }
        ]
      }),
      unblockedDetails   = expressionDetails({
        elements: [
          {},
          {
            resultIndex: 3,
            posIndex:    4,
            elements:    [{ resultIndex: 5 }, { resultIndex: 6 }]
          }
        ]
      });

  describe("for rule", function() {
    it("allocates a new result register for the expression", function() {
      expect(pass).toChangeAST('start = "a"', expressionDetails({
        resultIndex: 0
      }));
    });

    it("counts used registers", function() {
      expect(pass).toChangeAST('start = "a"', ruleDetails({
        registerCount: 1
      }));
      expect(pass).toChangeAST('start = "a"*', ruleDetails({
        registerCount: 2
      }));
      expect(pass).toChangeAST('start = ("a"*)*', ruleDetails({
        registerCount: 3
      }));
    });

    it("resets used registers counter", function() {
      expect(pass).toChangeAST('a = "a"*; b = "b"', {
        rules: [ { registerCount: 2 }, { registerCount: 1 }]
      });
    });
  });

  describe("for named", function() {
    it("reuses its own result register for the expression", function() {
      expect(pass).toChangeAST('start "start" = "a"', reuseResultDetails);
    });
  });

  describe("for choice", function() {
    it("reuses its own result register for the alternatives", function() {
      expect(pass).toChangeAST('start = "a" / "b" / "c"', expressionDetails({
        alternatives: [
          { resultIndex: 0 },
          { resultIndex: 0 },
          { resultIndex: 0 }
        ]
      }));
    });

    it("creates a new scope", function() {
      expect(pass).toChangeAST('start = (a:"a" / "b" / "c") { }', scopedDetails);
    });

    it("unblocks registers blocked by its children", function() {
      expect(pass).toChangeAST(
        'start = ((a:"a" / "b" / "c") "d") ("e" "f")',
        unblockedDetails
      );
    });
  });

  describe("for action", function() {
    it("allocates a position register", function() {
      expect(pass).toChangeAST('start = "a" { }', savePosDetails);
    });

    it("reuses its own result register for the expression", function() {
      expect(pass).toChangeAST('start = "a" { }', reuseResultDetails);
    });

    it("creates a new scope", function() {
      expect(pass).toChangeAST('start = (a:"a" { }) { }', scopedDetails);
    });

    it("unblocks registers blocked by its children", function() {
      expect(pass).toChangeAST(
        'start = ((a:"a" { }) "b") ("c" "d")',
        unblockedDetails
      );
    });

    it("computes params", function() {
      expect(pass).toChangeAST('start = a:"a" b:"b" c:"c" { }', expressionDetails({
        params: { a: 3, b: 4, c: 5 }
      }));
    });
  });

  describe("for sequence", function() {
    it("allocates a position register", function() {
      expect(pass).toChangeAST('start = ',            savePosDetails);
      expect(pass).toChangeAST('start = "a" "b" "c"', savePosDetails);
    });

    it("allocates new result registers for the elements", function() {
      expect(pass).toChangeAST('start = "a" "b" "c"', expressionDetails({
        elements: [{ resultIndex: 2 }, { resultIndex: 3 }, { resultIndex: 4 }]
      }));
    });

    it("does not create a new scope", function() {
      expect(pass).toChangeAST(
        'start = a:"a" b:"b" c:"c" { }',
        expressionDetails({ params: { a: 3, b: 4, c: 5 } })
      );
    });

    it("does not unblock blocked result registers from children", function() {
      expect(pass).toChangeAST(
        'start = (a:"a" "b") ("c" "d")',
        blockedDetails
      );
    });
  });

  describe("for labeled", function() {
    it("reuses its own result register for the expression", function() {
      expect(pass).toChangeAST('start = a:"a"', reuseResultDetails);
    });

    it("creates a new scope", function() {
      expect(pass).toChangeAST('start = a:(b:"b") { }', expressionDetails({
        params: { a: 0 }
      }));
    });

    it("unblocks registers blocked by its children", function() {
      expect(pass).toChangeAST(
        'start = (a:(b:"b") "c") ("d" "e")',
        blockedDetails
      );
    });

    it("adds label to the environment", function() {
      expect(pass).toChangeAST('start = a:"a" { }', expressionDetails({
        params: { a: 0 }
      }));
    });

    it("blocks its own result register", function() {
      expect(pass).toChangeAST(
        'start = (a:"a" "b") ("c" "d")',
        blockedDetails
      );
    });
  });

  describe("for text", function() {
    it("allocates a position register", function() {
      expect(pass).toChangeAST('start = $"a"', savePosDetails);
    });

    it("reuses its own result register for the expression", function() {
      expect(pass).toChangeAST('start = $"a"', reuseResultDetails);
    });

    it("creates a new scope", function() {
      expect(pass).toChangeAST('start = $(a:"a") { }', scopedDetails);
    });

    it("unblocks registers blocked by its children", function() {
      expect(pass).toChangeAST(
        'start = ($(a:"a") "b") ("c" "d")',
        unblockedDetails
      );
    });
  });

  describe("for simple and", function() {
    it("allocates a position register", function() {
      expect(pass).toChangeAST('start = &"a"', savePosDetails);
    });

    it("reuses its own result register for the expression", function() {
      expect(pass).toChangeAST('start = &"a"', reuseResultDetails);
    });

    it("creates a new scope", function() {
      expect(pass).toChangeAST('start = &(a:"a") { }', scopedDetails);
    });

    it("unblocks registers blocked by its children", function() {
      expect(pass).toChangeAST(
        'start = (&(a:"a") "b") ("c" "d")',
        unblockedDetails
      );
    });
  });

  describe("for simple not", function() {
    it("allocates a position register", function() {
      expect(pass).toChangeAST('start = !"a"', savePosDetails);
    });

    it("reuses its own result register for the expression", function() {
      expect(pass).toChangeAST('start = !"a"', reuseResultDetails);
    });

    it("creates a new scope", function() {
      expect(pass).toChangeAST('start = !(a:"a") { }', scopedDetails);
    });

    it("unblocks registers blocked by its children", function() {
      expect(pass).toChangeAST(
        'start = (!(a:"a") "b") ("c" "d")',
        unblockedDetails
      );
    });
  });

  describe("for semantic and", function() {
    it("computes params", function() {
      expect(pass).toChangeAST('start = a:"a" b:"b" c:"c" &{ }', expressionDetails({
        elements: [{}, {}, {}, { params: { a: 2, b: 3, c: 4 } }]
      }));
    });
  });

  describe("for semantic not", function() {
    it("computes params", function() {
      expect(pass).toChangeAST('start = a:"a" b:"b" c:"c" !{ }', expressionDetails({
        elements: [{}, {}, {}, { params: { a: 2, b: 3, c: 4 } }]
      }));
    });
  });

  describe("for optional", function() {
    it("reuses its own result register for the expression", function() {
      expect(pass).toChangeAST('start = "a"?', reuseResultDetails);
    });

    it("creates a new scope", function() {
      expect(pass).toChangeAST('start = (a:"a")? { }', scopedDetails);
    });

    it("unblocks registers blocked by its children", function() {
      expect(pass).toChangeAST(
        'start = ((a:"a")? "b") ("c" "d")',
        unblockedDetails
      );
    });
  });

  describe("for zero or more", function() {
    it("allocates a new result register for the expression", function() {
      expect(pass).toChangeAST('start = "a"*', allocResultDetails);
    });

    it("creates a new scope", function() {
      expect(pass).toChangeAST('start = (a:"a")* { }', scopedDetails);
    });

    it("unblocks registers blocked by its children", function() {
      expect(pass).toChangeAST(
        'start = ((a:"a")* "b") ("c" "d")',
        unblockedDetails
      );
    });
  });

  describe("for one or more", function() {
    it("allocates a new result register for the expression", function() {
      expect(pass).toChangeAST('start = "a"+', allocResultDetails);
    });

    it("creates a new scope", function() {
      expect(pass).toChangeAST('start = (a:"a")+ { }', scopedDetails);
    });

    it("unblocks registers blocked by its children", function() {
      expect(pass).toChangeAST(
        'start = ((a:"a")+ "b") ("c" "d")',
        unblockedDetails
      );
    });
  });
});
