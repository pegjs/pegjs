/* global describe, expect, it, PEG */

"use strict";

describe("compiler pass |generateBytecode|", function() {
  var pass = PEG.compiler.passes.generate.generateBytecode;

  function bytecodeDetails(bytecode) {
    return {
      rules: [{ bytecode: bytecode }]
    };
  }

  function constsDetails(consts) { return { consts: consts }; }

  describe("for grammar", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST([
        'a = "a"',
        'b = "b"',
        'c = "c"'
      ].join("\n"), {
        rules: [
          { bytecode: [14, 0, 2, 2, 18, 0, 19, 1] },
          { bytecode: [14, 2, 2, 2, 18, 2, 19, 3] },
          { bytecode: [14, 4, 2, 2, 18, 4, 19, 5] }
        ]
      });
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST([
        'a = "a"',
        'b = "b"',
        'c = "c"'
      ].join("\n"), constsDetails([
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }',
        '"b"',
        '{ type: "literal", value: "b", description: "\\"b\\"" }',
        '"c"',
        '{ type: "literal", value: "c", description: "\\"c\\"" }'
      ]));
    });
  });

  describe("for rule", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = "a"', bytecodeDetails([
        14, 0, 2, 2, 18, 0, 19, 1   // <expression>
      ]));
    });
  });

  describe("for named", function() {
    var grammar = 'start "start" = "a"';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        24,                          // SILENT_FAILS_ON
        14, 1, 2, 2, 18, 1, 19, 2,   // <expression>
        25,                          // SILENT_FAILS_OFF
        10, 2, 0,                    // IF_ERROR
        19, 0                        //   * FAIL
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        '{ type: "other", description: "start" }',
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for choice", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = "a" / "b" / "c"', bytecodeDetails([
        14, 0, 2, 2, 18, 0, 19, 1,   // <alternatives[0]>
        10, 21, 0,                   // IF_ERROR
        2,                           //   * POP
        14, 2, 2, 2, 18, 2, 19, 3,   //     <alternatives[1]>
        10, 9, 0,                    //     IF_ERROR
        2,                           //       * POP
        14, 4, 2, 2, 18, 4, 19, 5    //         <alternatives[2]>
      ]));
    });
  });

  describe("for action", function() {
    describe("without labels", function() {
      var grammar = 'start = "a" { code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          14, 0, 2, 2, 18, 0, 19, 1,   // <expression>
          11, 6, 0,                    // IF_NOT_ERROR
          20, 1,                       //   * LOAD_SAVED_POS
          22, 2, 1, 0,                 //     CALL
          5                            // NIP
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }',
          'function() { code }'
        ]));
      });
    });

    describe("with one label", function() {
      var grammar = 'start = a:"a" { code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          14, 0, 2, 2, 18, 0, 19, 1,   // <expression>
          11, 7, 0,                    // IF_NOT_ERROR
          20, 1,                       //   * LOAD_SAVED_POS
          22, 2, 1, 1, 0,              //     CALL
          5                            // NIP
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }',
          'function(a) { code }'
        ]));
      });
    });

    describe("with multiple labels", function() {
      var grammar = 'start = a:"a" b:"b" c:"c" { code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          14, 0, 2, 2, 18, 0, 19, 1,   // <elements[0]>
          11, 40, 3,                   // IF_NOT_ERROR
          14, 2, 2, 2, 18, 2, 19, 3,   //   * <elements[1]>
          11, 25, 4,                   //     IF_NOT_ERROR
          14, 4, 2, 2, 18, 4, 19, 5,   //       * <elements[2]>
          11, 10, 4,                   //         IF_NOT_ERROR
          20, 3,                       //           * LOAD_SAVED_POS
          22, 6, 3, 3, 2, 1, 0,        //             CALL
          5,                           //             NIP
          4, 3,                        //           * POP_N
          3,                           //             POP_CURR_POS
          28,                          //             PUSH_FAILED
          4, 2,                        //       * POP_N
          3,                           //         POP_CURR_POS
          28,                          //         PUSH_FAILED
          2,                           //   * POP
          3,                           //     POP_CURR_POS
          28                           //     PUSH_FAILED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }',
          '"b"',
          '{ type: "literal", value: "b", description: "\\"b\\"" }',
          '"c"',
          '{ type: "literal", value: "c", description: "\\"c\\"" }',
          'function(a, b, c) { code }'
        ]));
      });
    });
  });

  describe("for sequence", function() {
    var grammar = 'start = "a" "b" "c"';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        1,                           // PUSH_CURR_POS
        14, 0, 2, 2, 18, 0, 19, 1,   // <elements[0]>
        11, 33, 3,                   // IF_NOT_ERROR
        14, 2, 2, 2, 18, 2, 19, 3,   //   * <elements[1]>
        11, 18, 4,                   //     IF_NOT_ERROR
        14, 4, 2, 2, 18, 4, 19, 5,   //       * <elements[2]>
        11, 3, 4,                    //         IF_NOT_ERROR
        7, 3,                        //           * WRAP
        5,                           //             NIP
        4, 3,                        //           * POP_N
        3,                           //             POP_CURR_POS
        28,                          //             PUSH_FAILED
        4, 2,                        //       * POP_N
        3,                           //         POP_CURR_POS
        28,                          //         PUSH_FAILED
        2,                           //   * POP
        3,                           //     POP_CURR_POS
        28                           //     PUSH_FAILED
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }',
        '"b"',
        '{ type: "literal", value: "b", description: "\\"b\\"" }',
        '"c"',
        '{ type: "literal", value: "c", description: "\\"c\\"" }'
      ]));
    });
  });

  describe("for labeled", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = a:"a"', bytecodeDetails([
        14, 0, 2, 2, 18, 0, 19, 1   // <expression>
      ]));
    });
  });

  describe("for text", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = $"a"', bytecodeDetails([
        1,                           // PUSH_CURR_POS
        14, 0, 2, 2, 18, 0, 19, 1,   // <expression>
        11, 2, 1,                    // IF_NOT_ERROR
        2,                           //   * POP
        8,                           //     TEXT
        5                            //   * NIP
      ]));
    });
  });

  describe("for simple_and", function() {
    var grammar = 'start = &"a"';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        1,                           // PUSH_CURR_POS
        24,                          // SILENT_FAILS_ON
        14, 0, 2, 2, 18, 0, 19, 1,   // <expression>
        25,                          // SILENT_FAILS_OFF
        11, 3, 3,                    // IF_NOT_ERROR
        2,                           //   * POP
        3,                           //     POP_CURR_POS
        26,                          //     PUSH_UNDEFINED
        2,                           //   * POP
        2,                           //     POP
        28                           //     PUSH_FAILED
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for simple_not", function() {
    var grammar = 'start = !"a"';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        1,                           // PUSH_CURR_POS
        24,                          // SILENT_FAILS_ON
        14, 0, 2, 2, 18, 0, 19, 1,   // <expression>
        25,                          // SILENT_FAILS_OFF
        10, 3, 3,                    // IF_ERROR
        2,                           //   * POP
        2,                           //     POP
        26,                          //     PUSH_UNDEFINED
        2,                           //   * POP
        3,                           //     POP_CURR_POS
        28                           //     PUSH_FAILED
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for optional", function() {
    var grammar = 'start = "a"?';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        14, 0, 2, 2, 18, 0, 19, 1,   // <expression>
        10, 2, 0,                    // IF_ERROR
        2,                           //   * POP
        27                           //     PUSH_NULL
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for zero_or_more", function() {
    var grammar = 'start = "a"*';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        29,                          // PUSH_EMPTY_ARRAY
        14, 0, 2, 2, 18, 0, 19, 1,   // <expression>
        12, 9,                       // WHILE_NOT_ERROR
        6,                           //   * APPEND
        14, 0, 2, 2, 18, 0, 19, 1,   //     <expression>
        2                            // POP
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for one_or_more", function() {
    var grammar = 'start = "a"+';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        29,                          // PUSH_EMPTY_ARRAY
        14, 0, 2, 2, 18, 0, 19, 1,   // <expression>
        11, 12, 3,                   // IF_NOT_ERROR
        12, 9,                       //   * WHILE_NOT_ERROR
        6,                           //       * APPEND
        14, 0, 2, 2, 18, 0, 19, 1,   //         <expression>
        2,                           //     POP
        2,                           //   * POP
        2,                           //     POP
        28                           //     PUSH_FAILED
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for semantic_and", function() {
    describe("without labels", function() {
      var grammar = 'start = &{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          21,            // UPDATE_SAVED_POS
          22, 0, 0, 0,   // CALL
          9, 2, 2,       // IF
          2,             //   * POP
          26,            //     PUSH_UNDEFINED
          2,             //   * POP
          28             //     PUSH_FAILED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          grammar,
          constsDetails(['function() { code }'])
        );
      });
    });

    describe("with labels", function() {
      var grammar = 'start = a:"a" b:"b" c:"c" &{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          14, 0, 2, 2, 18, 0, 19, 1,   // <elements[0]>
          11, 55, 3,                   // IF_NOT_ERROR
          14, 2, 2, 2, 18, 2, 19, 3,   //   * <elements[1]>
          11, 40, 4,                   //     IF_NOT_ERROR
          14, 4, 2, 2, 18, 4, 19, 5,   //       * <elements[2]>
          11, 25, 4,                   //         IF_NOT_ERROR
          21,                          //           * UPDATE_SAVED_POS
          22, 6, 0, 3, 2, 1, 0,        //             CALL
          9, 2, 2,                     //             IF
          2,                           //               * POP
          26,                          //                 PUSH_UNDEFINED
          2,                           //               * POP
          28,                          //                 PUSH_FAILED
          11, 3, 4,                    //             IF_NOT_ERROR
          7, 4,                        //               * WRAP
          5,                           //                 NIP
          4, 4,                        //               * POP_N
          3,                           //                 POP_CURR_POS
          28,                          //                 PUSH_FAILED
          4, 3,                        //           * POP_N
          3,                           //             POP_CURR_POS
          28,                          //             PUSH_FAILED
          4, 2,                        //       * POP_N
          3,                           //         POP_CURR_POS
          28,                          //         PUSH_FAILED
          2,                           //   * POP
          3,                           //     POP_CURR_POS
          28                           //     PUSH_FAILED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }',
          '"b"',
          '{ type: "literal", value: "b", description: "\\"b\\"" }',
          '"c"',
          '{ type: "literal", value: "c", description: "\\"c\\"" }',
          'function(a, b, c) { code }'
        ]));
      });
    });
  });

  describe("for semantic_not", function() {
    describe("without labels", function() {
      var grammar = 'start = !{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          21,            // UPDATE_SAVED_POS
          22, 0, 0, 0,   // CALL
          9, 2, 2,       // IF
          2,             //   * POP
          28,            //     PUSH_FAILED
          2,             //   * POP
          26             //     PUSH_UNDEFINED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          grammar,
          constsDetails(['function() { code }'])
        );
      });
    });

    describe("with labels", function() {
      var grammar = 'start = a:"a" b:"b" c:"c" !{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          14, 0, 2, 2, 18, 0, 19, 1,   // <elements[0]>
          11, 55, 3,                   // IF_NOT_ERROR
          14, 2, 2, 2, 18, 2, 19, 3,   //   * <elements[1]>
          11, 40, 4,                   //     IF_NOT_ERROR
          14, 4, 2, 2, 18, 4, 19, 5,   //       * <elements[2]>
          11, 25, 4,                   //         IF_NOT_ERROR
          21,                          //           * UPDATE_SAVED_POS
          22, 6, 0, 3, 2, 1, 0,        //             CALL
          9, 2, 2,                     //             IF
          2,                           //               * POP
          28,                          //                 PUSH_FAILED
          2,                           //               * POP
          26,                          //                 PUSH_UNDEFINED
          11, 3, 4,                    //             IF_NOT_ERROR
          7, 4,                        //               * WRAP
          5,                           //                 NIP
          4, 4,                        //               * POP_N
          3,                           //                 POP_CURR_POS
          28,                          //                 PUSH_FAILED
          4, 3,                        //           * POP_N
          3,                           //             POP_CURR_POS
          28,                          //             PUSH_FAILED
          4, 2,                        //       * POP_N
          3,                           //         POP_CURR_POS
          28,                          //         PUSH_FAILED
          2,                           //   * POP
          3,                           //     POP_CURR_POS
          28                           //     PUSH_FAILED
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }',
          '"b"',
          '{ type: "literal", value: "b", description: "\\"b\\"" }',
          '"c"',
          '{ type: "literal", value: "c", description: "\\"c\\"" }',
          'function(a, b, c) { code }'
        ]));
      });
    });
  });

  describe("for rule_ref", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST([
        'start = other',
        'other = "other"'
      ].join("\n"), {
        rules: [
          {
            bytecode: [23, 1]   // RULE
          },
          { }
        ]
      });
    });
  });

  describe("for literal", function() {
    describe("empty", function() {
      var grammar = 'start = ""';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          0, 0   // PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails(['""']));
      });
    });

    describe("non-empty case-sensitive", function() {
      var grammar = 'start = "a"';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          14, 0, 2, 2,   // MATCH_STRING
          18, 0,         //   * ACCEPT_STRING
          19, 1          //   * FAIL
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }'
        ]));
      });
    });

    describe("non-empty case-insensitive", function() {
      var grammar = 'start = "A"i';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          15, 0, 2, 2,   // MATCH_STRING_IC
          17, 1,         //   * ACCEPT_N
          19, 1          //   * FAIL
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          '"a"',
          '{ type: "literal", value: "A", description: "\\"A\\"" }'
        ]));
      });
    });
  });

  describe("for class", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = [a]', bytecodeDetails([
        16, 0, 2, 2,   // MATCH_REGEXP
        17, 1,         //   * ACCEPT_N
        19, 1          //   * FAIL
      ]));
    });

    describe("non-empty non-inverted case-sensitive", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST('start = [a]', constsDetails([
          '/^[a]/',
          '{ type: "class", value: "[a]", description: "[a]" }'
        ]));
      });
    });

    describe("non-empty inverted case-sensitive", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST('start = [^a]', constsDetails([
          '/^[^a]/',
          '{ type: "class", value: "[^a]", description: "[^a]" }'
        ]));
      });
    });

    describe("non-empty non-inverted case-insensitive", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST('start = [a]i', constsDetails([
          '/^[a]/i',
          '{ type: "class", value: "[a]i", description: "[a]i" }'
        ]));
      });
    });

    describe("non-empty complex", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST('start = [ab-def-hij-l]', constsDetails([
          '/^[ab-def-hij-l]/',
          '{ type: "class", value: "[ab-def-hij-l]", description: "[ab-def-hij-l]" }'
        ]));
      });
    });

    describe("empty non-inverted", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST('start = []', constsDetails([
          '/^(?!)/',
          '{ type: "class", value: "[]", description: "[]" }'
        ]));
      });
    });

    describe("empty inverted", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST('start = [^]', constsDetails([
          '/^[\\S\\s]/',
          '{ type: "class", value: "[^]", description: "[^]" }'
        ]));
      });
    });
  });

  describe("for any", function() {
    var grammar = 'start = .';

    it("generates bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        13, 2, 2,   // MATCH_ANY
        17, 1,      //   * ACCEPT_N
        19, 0       //   * FAIL
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(
        grammar,
        constsDetails(['{ type: "any", description: "any character" }'])
      );
    });
  });
});
