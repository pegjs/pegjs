describe("compiler pass |computeParams|", function() {
  function pass(ast) {
    PEG.compiler.passes.computeVarNames(ast);
    PEG.compiler.passes.computeParams(ast);
  }

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
        params: { a: "result0" }
      }));
    });

    it("computes params for a semantic and", function() {
      expect(pass).toChangeAST('start = a:"a" &{ }', expressionDetails({
        elements: [
          {},
          { params: { a: "result0" } }
        ]
      }));
    });

    it("computes params for a semantic not", function() {
      expect(pass).toChangeAST('start = a:"a" !{ }', expressionDetails({
        elements: [
          {},
          { params: { a: "result0" } }
        ]
      }));
    });
  });

  describe("recursive walk", function() {
    it("computes params for a named", function() {
      expect(pass).toChangeAST(
        'start "start" = a:"a" { }',
        innerExpressionDetails({ params: { a: "result0" } })
      );
    });

    it("computes params for a choice", function() {
      expect(pass).toChangeAST(
        'start = a:"a" { } / "b" / "c"',
        expressionDetails({
          alternatives: [{ params: { a: "result0" } }, {}, {}]
        })
      );
      expect(pass).toChangeAST(
        'start = "a" / "b" / c:"c" { }',
        expressionDetails({
          alternatives: [{}, {}, { params: { c: "result0" } }]
        })
      );
    });

    it("computes params for an action", function() {
      expect(pass).toChangeAST('start = (a:"a" { }) { }', innerExpressionDetails({
        params: { a: "result0" }
      }));
    });

    it("computes params for a sequence", function() {
      expect(pass).toChangeAST(
        'start = (a:"a" { }) "b" "c"',
        expressionDetails({
          elements: [{ params: { a: "result0" } }, {}, {}]
        })
      );
      expect(pass).toChangeAST(
        'start = "a" "b" (c:"c" { })',
        expressionDetails({
          elements: [{}, {}, { params: { c: "result2" } }]
        })
      );
    });

    it("computes params for a labeled", function() {
      expect(pass).toChangeAST('start = a:(b:"b" { })', innerExpressionDetails({
        params: { b: "result0" }
      }));
    });

    it("computes params for a simple and", function() {
      expect(pass).toChangeAST('start = &(a:"a" { })', innerExpressionDetails({
        params: { a: "result0" }
      }));
    });

    it("computes params for a simple not", function() {
      expect(pass).toChangeAST('start = &(a:"a" { })', innerExpressionDetails({
        params: { a: "result0" }
      }));
    });

    it("computes params for an optional", function() {
      expect(pass).toChangeAST('start = (a:"a" { })?', innerExpressionDetails({
        params: { a: "result0" }
      }));
    });

    it("computes params for a zero or more", function() {
      expect(pass).toChangeAST('start = (a:"a" { })*', innerExpressionDetails({
        params: { a: "result1" }
      }));
    });

    it("computes params for a one or more", function() {
      expect(pass).toChangeAST('start = (a:"a" { })+', innerExpressionDetails({
        params: { a: "result1" }
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
          params: { a: "result0[0]", b: "result0[1]", c: "result0[2]" }
        })
      );
      expect(pass).toChangeAST(
        'start = a:"a" (b:"b" c:"c" d:"d") e:"e"{ }',
        expressionDetails({
          params: {
            a: "result0[0]",
            b: "result0[1][0]",
            c: "result0[1][1]",
            d: "result0[1][2]",
            e: "result0[2]"
          }
        })
      );

      /*
       * Regression tests for a bug where e.g. resultVar names like |result10|
       * were incorrectly treated as names derived from |result1|, leading to
       * incorrect substitution.
       */
      expect(pass).toChangeAST(
        'start = ("a" "b" "c" "d" "e" "f" "g" "h" "i" j:"j" { })*',
        innerExpressionDetails({
          params: { j: "result1[9]" } // Buggy code put "result1[0]0" here.
        })
      );
    });

    it("creates a new scope for a labeled", function() {
      expect(pass).toChangeAST('start = a:(b:"b") { }', expressionDetails({
        params: { a: "result0"}
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
