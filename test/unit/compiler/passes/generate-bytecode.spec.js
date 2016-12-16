"use strict";

let chai = require("chai");
let helpers = require("./helpers");
let pass = require("../../../../lib/compiler/passes/generate-bytecode");

chai.use(helpers);

let expect = chai.expect;

describe("compiler pass |generateBytecode|", function() {
  function bytecodeDetails(bytecode) {
    return {
      rules: [{ bytecode: bytecode }]
    };
  }

  function constsDetails(consts) { return { consts: consts }; }

  describe("for grammar", function() {
    it("generates correct bytecode", function() {
      expect(pass).to.changeAST([
        "a = 'a'",
        "b = 'b'",
        "c = 'c'"
      ].join("\n"), {
        rules: [
          { bytecode: [18, 0, 2, 2, 22, 0, 23, 1] },
          { bytecode: [18, 2, 2, 2, 22, 2, 23, 3] },
          { bytecode: [18, 4, 2, 2, 22, 4, 23, 5] }
        ]
      });
    });

    it("defines correct constants", function() {
      expect(pass).to.changeAST([
        "a = 'a'",
        "b = 'b'",
        "c = 'c'"
      ].join("\n"), constsDetails([
        "\"a\"",
        "peg$literalExpectation(\"a\", false)",
        "\"b\"",
        "peg$literalExpectation(\"b\", false)",
        "\"c\"",
        "peg$literalExpectation(\"c\", false)"
      ]));
    });
  });

  describe("for rule", function() {
    it("generates correct bytecode", function() {
      expect(pass).to.changeAST("start = 'a'", bytecodeDetails([
        18, 0, 2, 2, 22, 0, 23, 1   // <expression>
      ]));
    });
  });

  describe("for named", function() {
    let grammar = "start 'start' = 'a'";

    it("generates correct bytecode", function() {
      expect(pass).to.changeAST(grammar, bytecodeDetails([
        28,                          // SILENT_FAILS_ON
        18, 1, 2, 2, 22, 1, 23, 2,   // <expression>
        29,                          // SILENT_FAILS_OFF
        14, 2, 0,                    // IF_ERROR
        23, 0                        //   * FAIL
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).to.changeAST(grammar, constsDetails([
        "peg$otherExpectation(\"start\")",
        "\"a\"",
        "peg$literalExpectation(\"a\", false)"
      ]));
    });
  });

  describe("for choice", function() {
    it("generates correct bytecode", function() {
      expect(pass).to.changeAST("start = 'a' / 'b' / 'c'", bytecodeDetails([
        18, 0, 2, 2, 22, 0, 23, 1,   // <alternatives[0]>
        14, 21, 0,                   // IF_ERROR
        6,                           //   * POP
        18, 2, 2, 2, 22, 2, 23, 3,   //     <alternatives[1]>
        14, 9, 0,                    //     IF_ERROR
        6,                           //       * POP
        18, 4, 2, 2, 22, 4, 23, 5    //         <alternatives[2]>
      ]));
    });
  });

  describe("for action", function() {
    describe("without labels", function() {
      let grammar = "start = 'a' { code }";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          5,                           // PUSH_CURR_POS
          18, 0, 2, 2, 22, 0, 23, 1,   // <expression>
          15, 6, 0,                    // IF_NOT_ERROR
          24, 1,                       //   * LOAD_SAVED_POS
          26, 2, 1, 0,                 //     CALL
          9                            // NIP
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(grammar, constsDetails([
          "\"a\"",
          "peg$literalExpectation(\"a\", false)",
          "function() { code }"
        ]));
      });
    });

    describe("with one label", function() {
      let grammar = "start = a:'a' { code }";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          5,                           // PUSH_CURR_POS
          18, 0, 2, 2, 22, 0, 23, 1,   // <expression>
          15, 7, 0,                    // IF_NOT_ERROR
          24, 1,                       //   * LOAD_SAVED_POS
          26, 2, 1, 1, 0,              //     CALL
          9                            // NIP
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(grammar, constsDetails([
          "\"a\"",
          "peg$literalExpectation(\"a\", false)",
          "function(a) { code }"
        ]));
      });
    });

    describe("with multiple labels", function() {
      let grammar = "start = a:'a' b:'b' c:'c' { code }";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          5,                           // PUSH_CURR_POS
          18, 0, 2, 2, 22, 0, 23, 1,   // <elements[0]>
          15, 40, 3,                   // IF_NOT_ERROR
          18, 2, 2, 2, 22, 2, 23, 3,   //   * <elements[1]>
          15, 25, 4,                   //     IF_NOT_ERROR
          18, 4, 2, 2, 22, 4, 23, 5,   //       * <elements[2]>
          15, 10, 4,                   //         IF_NOT_ERROR
          24, 3,                       //           * LOAD_SAVED_POS
          26, 6, 3, 3, 2, 1, 0,        //             CALL
          9,                           //             NIP
          8, 3,                        //           * POP_N
          7,                           //             POP_CURR_POS
          3,                           //             PUSH_FAILED
          8, 2,                        //       * POP_N
          7,                           //         POP_CURR_POS
          3,                           //         PUSH_FAILED
          6,                           //   * POP
          7,                           //     POP_CURR_POS
          3                            //     PUSH_FAILED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(grammar, constsDetails([
          "\"a\"",
          "peg$literalExpectation(\"a\", false)",
          "\"b\"",
          "peg$literalExpectation(\"b\", false)",
          "\"c\"",
          "peg$literalExpectation(\"c\", false)",
          "function(a, b, c) { code }"
        ]));
      });
    });
  });

  describe("for sequence", function() {
    let grammar = "start = 'a' 'b' 'c'";

    it("generates correct bytecode", function() {
      expect(pass).to.changeAST(grammar, bytecodeDetails([
        5,                           // PUSH_CURR_POS
        18, 0, 2, 2, 22, 0, 23, 1,   // <elements[0]>
        15, 33, 3,                   // IF_NOT_ERROR
        18, 2, 2, 2, 22, 2, 23, 3,   //   * <elements[1]>
        15, 18, 4,                   //     IF_NOT_ERROR
        18, 4, 2, 2, 22, 4, 23, 5,   //       * <elements[2]>
        15, 3, 4,                    //         IF_NOT_ERROR
        11, 3,                       //           * WRAP
        9,                           //             NIP
        8, 3,                        //           * POP_N
        7,                           //             POP_CURR_POS
        3,                           //             PUSH_FAILED
        8, 2,                        //       * POP_N
        7,                           //         POP_CURR_POS
        3,                           //         PUSH_FAILED
        6,                           //   * POP
        7,                           //     POP_CURR_POS
        3                            //     PUSH_FAILED
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).to.changeAST(grammar, constsDetails([
        "\"a\"",
        "peg$literalExpectation(\"a\", false)",
        "\"b\"",
        "peg$literalExpectation(\"b\", false)",
        "\"c\"",
        "peg$literalExpectation(\"c\", false)"
      ]));
    });
  });

  describe("for labeled", function() {
    it("generates correct bytecode", function() {
      expect(pass).to.changeAST("start = a:'a'", bytecodeDetails([
        18, 0, 2, 2, 22, 0, 23, 1   // <expression>
      ]));
    });
  });

  describe("for text", function() {
    it("generates correct bytecode", function() {
      expect(pass).to.changeAST("start = $'a'", bytecodeDetails([
        5,                           // PUSH_CURR_POS
        18, 0, 2, 2, 22, 0, 23, 1,   // <expression>
        15, 2, 1,                    // IF_NOT_ERROR
        6,                           //   * POP
        12,                          //     TEXT
        9                            //   * NIP
      ]));
    });
  });

  describe("for simple_and", function() {
    let grammar = "start = &'a'";

    it("generates correct bytecode", function() {
      expect(pass).to.changeAST(grammar, bytecodeDetails([
        5,                           // PUSH_CURR_POS
        28,                          // SILENT_FAILS_ON
        18, 0, 2, 2, 22, 0, 23, 1,   // <expression>
        29,                          // SILENT_FAILS_OFF
        15, 3, 3,                    // IF_NOT_ERROR
        6,                           //   * POP
        7,                           //     POP_CURR_POS
        1,                           //     PUSH_UNDEFINED
        6,                           //   * POP
        6,                           //     POP
        3                            //     PUSH_FAILED
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).to.changeAST(grammar, constsDetails([
        "\"a\"",
        "peg$literalExpectation(\"a\", false)"
      ]));
    });
  });

  describe("for simple_not", function() {
    let grammar = "start = !'a'";

    it("generates correct bytecode", function() {
      expect(pass).to.changeAST(grammar, bytecodeDetails([
        5,                           // PUSH_CURR_POS
        28,                          // SILENT_FAILS_ON
        18, 0, 2, 2, 22, 0, 23, 1,   // <expression>
        29,                          // SILENT_FAILS_OFF
        14, 3, 3,                    // IF_ERROR
        6,                           //   * POP
        6,                           //     POP
        1,                           //     PUSH_UNDEFINED
        6,                           //   * POP
        7,                           //     POP_CURR_POS
        3                            //     PUSH_FAILED
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).to.changeAST(grammar, constsDetails([
        "\"a\"",
        "peg$literalExpectation(\"a\", false)"
      ]));
    });
  });

  describe("for optional", function() {
    let grammar = "start = 'a'?";

    it("generates correct bytecode", function() {
      expect(pass).to.changeAST(grammar, bytecodeDetails([
        18, 0, 2, 2, 22, 0, 23, 1,   // <expression>
        14, 2, 0,                    // IF_ERROR
        6,                           //   * POP
        2                            //     PUSH_NULL
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).to.changeAST(grammar, constsDetails([
        "\"a\"",
        "peg$literalExpectation(\"a\", false)"
      ]));
    });
  });

  describe("for zero_or_more", function() {
    let grammar = "start = 'a'*";

    it("generates correct bytecode", function() {
      expect(pass).to.changeAST(grammar, bytecodeDetails([
        4,                           // PUSH_EMPTY_ARRAY
        18, 0, 2, 2, 22, 0, 23, 1,   // <expression>
        16, 9,                       // WHILE_NOT_ERROR
        10,                          //   * APPEND
        18, 0, 2, 2, 22, 0, 23, 1,   //     <expression>
        6                            // POP
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).to.changeAST(grammar, constsDetails([
        "\"a\"",
        "peg$literalExpectation(\"a\", false)"
      ]));
    });
  });

  describe("for one_or_more", function() {
    let grammar = "start = 'a'+";

    it("generates correct bytecode", function() {
      expect(pass).to.changeAST(grammar, bytecodeDetails([
        4,                           // PUSH_EMPTY_ARRAY
        18, 0, 2, 2, 22, 0, 23, 1,   // <expression>
        15, 12, 3,                   // IF_NOT_ERROR
        16, 9,                       //   * WHILE_NOT_ERROR
        10,                          //       * APPEND
        18, 0, 2, 2, 22, 0, 23, 1,   //         <expression>
        6,                           //     POP
        6,                           //   * POP
        6,                           //     POP
        3                            //     PUSH_FAILED
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).to.changeAST(grammar, constsDetails([
        "\"a\"",
        "peg$literalExpectation(\"a\", false)"
      ]));
    });
  });

  describe("for group", function() {
    it("generates correct bytecode", function() {
      expect(pass).to.changeAST("start = ('a')", bytecodeDetails([
        18, 0, 2, 2, 22, 0, 23, 1   // <expression>
      ]));
    });
  });

  describe("for semantic_and", function() {
    describe("without labels", function() {
      let grammar = "start = &{ code }";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          25,            // UPDATE_SAVED_POS
          26, 0, 0, 0,   // CALL
          13, 2, 2,      // IF
          6,             //   * POP
          1,             //     PUSH_UNDEFINED
          6,             //   * POP
          3              //     PUSH_FAILED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(
          grammar,
          constsDetails(["function() { code }"])
        );
      });
    });

    describe("with labels", function() {
      let grammar = "start = a:'a' b:'b' c:'c' &{ code }";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          5,                           // PUSH_CURR_POS
          18, 0, 2, 2, 22, 0, 23, 1,   // <elements[0]>
          15, 55, 3,                   // IF_NOT_ERROR
          18, 2, 2, 2, 22, 2, 23, 3,   //   * <elements[1]>
          15, 40, 4,                   //     IF_NOT_ERROR
          18, 4, 2, 2, 22, 4, 23, 5,   //       * <elements[2]>
          15, 25, 4,                   //         IF_NOT_ERROR
          25,                          //           * UPDATE_SAVED_POS
          26, 6, 0, 3, 2, 1, 0,        //             CALL
          13, 2, 2,                    //             IF
          6,                           //               * POP
          1,                           //                 PUSH_UNDEFINED
          6,                           //               * POP
          3,                           //                 PUSH_FAILED
          15, 3, 4,                    //             IF_NOT_ERROR
          11, 4,                       //               * WRAP
          9,                           //                 NIP
          8, 4,                        //               * POP_N
          7,                           //                 POP_CURR_POS
          3,                           //                 PUSH_FAILED
          8, 3,                        //           * POP_N
          7,                           //             POP_CURR_POS
          3,                           //             PUSH_FAILED
          8, 2,                        //       * POP_N
          7,                           //         POP_CURR_POS
          3,                           //         PUSH_FAILED
          6,                           //   * POP
          7,                           //     POP_CURR_POS
          3                            //     PUSH_FAILED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(grammar, constsDetails([
          "\"a\"",
          "peg$literalExpectation(\"a\", false)",
          "\"b\"",
          "peg$literalExpectation(\"b\", false)",
          "\"c\"",
          "peg$literalExpectation(\"c\", false)",
          "function(a, b, c) { code }"
        ]));
      });
    });
  });

  describe("for semantic_not", function() {
    describe("without labels", function() {
      let grammar = "start = !{ code }";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          25,            // UPDATE_SAVED_POS
          26, 0, 0, 0,   // CALL
          13, 2, 2,      // IF
          6,             //   * POP
          3,             //     PUSH_FAILED
          6,             //   * POP
          1              //     PUSH_UNDEFINED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(
          grammar,
          constsDetails(["function() { code }"])
        );
      });
    });

    describe("with labels", function() {
      let grammar = "start = a:'a' b:'b' c:'c' !{ code }";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          5,                           // PUSH_CURR_POS
          18, 0, 2, 2, 22, 0, 23, 1,   // <elements[0]>
          15, 55, 3,                   // IF_NOT_ERROR
          18, 2, 2, 2, 22, 2, 23, 3,   //   * <elements[1]>
          15, 40, 4,                   //     IF_NOT_ERROR
          18, 4, 2, 2, 22, 4, 23, 5,   //       * <elements[2]>
          15, 25, 4,                   //         IF_NOT_ERROR
          25,                          //           * UPDATE_SAVED_POS
          26, 6, 0, 3, 2, 1, 0,        //             CALL
          13, 2, 2,                    //             IF
          6,                           //               * POP
          3,                           //                 PUSH_FAILED
          6,                           //               * POP
          1,                           //                 PUSH_UNDEFINED
          15, 3, 4,                    //             IF_NOT_ERROR
          11, 4,                       //               * WRAP
          9,                           //                 NIP
          8, 4,                        //               * POP_N
          7,                           //                 POP_CURR_POS
          3,                           //                 PUSH_FAILED
          8, 3,                        //           * POP_N
          7,                           //             POP_CURR_POS
          3,                           //             PUSH_FAILED
          8, 2,                        //       * POP_N
          7,                           //         POP_CURR_POS
          3,                           //         PUSH_FAILED
          6,                           //   * POP
          7,                           //     POP_CURR_POS
          3                            //     PUSH_FAILED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(grammar, constsDetails([
          "\"a\"",
          "peg$literalExpectation(\"a\", false)",
          "\"b\"",
          "peg$literalExpectation(\"b\", false)",
          "\"c\"",
          "peg$literalExpectation(\"c\", false)",
          "function(a, b, c) { code }"
        ]));
      });
    });
  });

  describe("for rule_ref", function() {
    it("generates correct bytecode", function() {
      expect(pass).to.changeAST([
        "start = other",
        "other = 'other'"
      ].join("\n"), {
        rules: [
          {
            bytecode: [27, 1]   // RULE
          },
          { }
        ]
      });
    });
  });

  describe("for literal", function() {
    describe("empty", function() {
      let grammar = "start = ''";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          0, 0   // PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(grammar, constsDetails(["\"\""]));
      });
    });

    describe("non-empty case-sensitive", function() {
      let grammar = "start = 'a'";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          18, 0, 2, 2,   // MATCH_STRING
          22, 0,         //   * ACCEPT_STRING
          23, 1          //   * FAIL
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(grammar, constsDetails([
          "\"a\"",
          "peg$literalExpectation(\"a\", false)"
        ]));
      });
    });

    describe("non-empty case-insensitive", function() {
      let grammar = "start = 'A'i";

      it("generates correct bytecode", function() {
        expect(pass).to.changeAST(grammar, bytecodeDetails([
          19, 0, 2, 2,   // MATCH_STRING_IC
          21, 1,         //   * ACCEPT_N
          23, 1          //   * FAIL
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).to.changeAST(grammar, constsDetails([
          "\"a\"",
          "peg$literalExpectation(\"A\", true)"
        ]));
      });
    });
  });

  describe("for class", function() {
    it("generates correct bytecode", function() {
      expect(pass).to.changeAST("start = [a]", bytecodeDetails([
        20, 0, 2, 2,   // MATCH_REGEXP
        21, 1,         //   * ACCEPT_N
        23, 1          //   * FAIL
      ]));
    });

    describe("non-inverted case-sensitive", function() {
      it("defines correct constants", function() {
        expect(pass).to.changeAST("start = [a]", constsDetails([
          "/^[a]/",
          "peg$classExpectation([\"a\"], false, false)"
        ]));
      });
    });

    describe("inverted case-sensitive", function() {
      it("defines correct constants", function() {
        expect(pass).to.changeAST("start = [^a]", constsDetails([
          "/^[^a]/",
          "peg$classExpectation([\"a\"], true, false)"
        ]));
      });
    });

    describe("non-inverted case-insensitive", function() {
      it("defines correct constants", function() {
        expect(pass).to.changeAST("start = [a]i", constsDetails([
          "/^[a]/i",
          "peg$classExpectation([\"a\"], false, true)"
        ]));
      });
    });

    describe("complex", function() {
      it("defines correct constants", function() {
        expect(pass).to.changeAST("start = [ab-def-hij-l]", constsDetails([
          "/^[ab-def-hij-l]/",
          "peg$classExpectation([\"a\", [\"b\", \"d\"], \"e\", [\"f\", \"h\"], \"i\", [\"j\", \"l\"]], false, false)"
        ]));
      });
    });
  });

  describe("for any", function() {
    let grammar = "start = .";

    it("generates bytecode", function() {
      expect(pass).to.changeAST(grammar, bytecodeDetails([
        17, 2, 2,   // MATCH_ANY
        21, 1,      //   * ACCEPT_N
        23, 0       //   * FAIL
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).to.changeAST(
        grammar,
        constsDetails(["peg$anyExpectation()"])
      );
    });
  });
});
