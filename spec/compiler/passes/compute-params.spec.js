describe("compiler pass |computeParams|", function() {
  function pass(ast) {
    PEG.compiler.passes.allocateRegisters(ast);
    PEG.compiler.passes.computeParams(ast);
  }

  var result0     = { resultIndex: 0, subindices: []     },
      result0_0   = { resultIndex: 0, subindices: [0]    },
      result0_1   = { resultIndex: 0, subindices: [1]    },
      result0_1_0 = { resultIndex: 0, subindices: [1, 0] },
      result0_1_1 = { resultIndex: 0, subindices: [1, 1] },
      result0_1_2 = { resultIndex: 0, subindices: [1, 2] },
      result0_2   = { resultIndex: 0, subindices: [2]    },
      result1_9   = { resultIndex: 1, subindices: [9]    },
      result1     = { resultIndex: 1, subindices: []     };
      result2     = { resultIndex: 2, subindices: []     },
      result4     = { resultIndex: 4, subindices: []     };

  function ruleDetails(details) { return { rules: [details] }; }

  function expressionDetails(details) {
    return ruleDetails({ expression: details });
  }

  function innerExpressionDetails(details) {
    return expressionDetails({ expression: details });
  }

  describe("basic cases", function() {
    it("computes params for an action", function() {
      expect(pass).toChangeAST('start = a:"a" { }', expressionDetails({
        params: { a: result0 }
      }));
    });

    it("computes params for a semantic and", function() {
      expect(pass).toChangeAST('start = a:"a" &{ }', expressionDetails({
        elements: [
          {},
          { params: { a: result2 } }
        ]
      }));
    });

    it("computes params for a semantic not", function() {
      expect(pass).toChangeAST('start = a:"a" !{ }', expressionDetails({
        elements: [
          {},
          { params: { a: result2 } }
        ]
      }));
    });
  });

  describe("recursive walk", function() {
    it("computes params for a named", function() {
      expect(pass).toChangeAST(
        'start "start" = a:"a" { }',
        innerExpressionDetails({ params: { a: result0 } })
      );
    });

    it("computes params for a choice", function() {
      expect(pass).toChangeAST(
        'start = a:"a" { } / "b" / "c"',
        expressionDetails({
          alternatives: [{ params: { a: result0 } }, {}, {}]
        })
      );
      expect(pass).toChangeAST(
        'start = "a" / "b" / c:"c" { }',
        expressionDetails({
          alternatives: [{}, {}, { params: { c: result0 } }]
        })
      );
    });

    it("computes params for an action", function() {
      expect(pass).toChangeAST('start = (a:"a" { }) { }', innerExpressionDetails({
        params: { a: result0 }
      }));
    });

    it("computes params for a sequence", function() {
      expect(pass).toChangeAST(
        'start = (a:"a" { }) "b" "c"',
        expressionDetails({
          elements: [{ params: { a: result2 } }, {}, {}]
        })
      );
      expect(pass).toChangeAST(
        'start = "a" "b" (c:"c" { })',
        expressionDetails({
          elements: [{}, {}, { params: { c: result4 } }]
        })
      );
    });

    it("computes params for a labeled", function() {
      expect(pass).toChangeAST('start = a:(b:"b" { })', innerExpressionDetails({
        params: { b: result0 }
      }));
    });

    it("computes params for a simple and", function() {
      expect(pass).toChangeAST('start = &(a:"a" { })', innerExpressionDetails({
        params: { a: result0 }
      }));
    });

    it("computes params for a simple not", function() {
      expect(pass).toChangeAST('start = &(a:"a" { })', innerExpressionDetails({
        params: { a: result0 }
      }));
    });

    it("computes params for an optional", function() {
      expect(pass).toChangeAST('start = (a:"a" { })?', innerExpressionDetails({
        params: { a: result0 }
      }));
    });

    it("computes params for a zero or more", function() {
      expect(pass).toChangeAST('start = (a:"a" { })*', innerExpressionDetails({
        params: { a: result1 }
      }));
    });

    it("computes params for a one or more", function() {
      expect(pass).toChangeAST('start = (a:"a" { })+', innerExpressionDetails({
        params: { a: result1 }
      }));
    });
  });

  describe("scoping", function() {
    it("creates a new scope for a choice", function() {
      expect(pass).toChangeAST(
        'start = (a:"a" / b:"b" / c:"c") { }',
        expressionDetails({ params: {} })
      );
    });

    it("creates a new scope for an action", function() {
      expect(pass).toChangeAST('start = (a:"a" { }) { }', expressionDetails({
        params: {}
      }));
    });

    it("does not create a new scope for a sequence", function() {
      expect(pass).toChangeAST(
        'start = a:"a" b:"b" c:"c" { }',
        expressionDetails({
          params: { a: result0_0, b: result0_1, c: result0_2 }
        })
      );
      expect(pass).toChangeAST(
        'start = a:"a" (b:"b" c:"c" d:"d") e:"e"{ }',
        expressionDetails({
          params: {
            a: result0_0,
            b: result0_1_0,
            c: result0_1_1,
            d: result0_1_2,
            e: result0_2
          }
        })
      );
    });

    it("creates a new scope for a labeled", function() {
      expect(pass).toChangeAST('start = a:(b:"b") { }', expressionDetails({
        params: { a: result0 }
      }));
    });

    it("creates a new scope for a simple and", function() {
      expect(pass).toChangeAST('start = &(a:"a") { }', expressionDetails({
        params: {}
      }));
    });

    it("creates a new scope for a simple not", function() {
      expect(pass).toChangeAST('start = !(a:"a") { }', expressionDetails({
        params: {}
      }));
    });

    it("creates a new scope for an optional", function() {
      expect(pass).toChangeAST('start = (a:"a")? { }', expressionDetails({
        params: {}
      }));
    });

    it("creates a new scope for a zero or more", function() {
      expect(pass).toChangeAST('start = (a:"a")* { }', expressionDetails({
        params: {}
      }));
    });

    it("creates a new scope for a one or more", function() {
      expect(pass).toChangeAST('start = (a:"a")+ { }', expressionDetails({
        params: {}
      }));
    });
  });
});
