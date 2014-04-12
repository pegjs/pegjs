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
          { bytecode: [16, 0, 2, 2, 20, 0, 21, 1] },
          { bytecode: [16, 2, 2, 2, 20, 2, 21, 3] },
          { bytecode: [16, 4, 2, 2, 20, 4, 21, 5] }
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
        16, 0, 2, 2, 20, 0, 21, 1   // <expression>
      ]));
    });
  });

  describe("for named", function() {
    var grammar = 'start "start" = "a"';
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        26,                          // SILENT_FAILS_ON
        16, 1, 2, 2, 20, 1, 21, 2,   // <expression>
        27,                          // SILENT_FAILS_OFF
        10, 2, 0,                    // IF_ERROR
        21, 0                        //   * FAIL
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
        16, 0, 2, 2, 20, 0, 21, 1,   // <alternatives[0]>
        10, 21, 0,                   // IF_ERROR
        2,                           //   * POP
        16, 2, 2, 2, 20, 2, 21, 3,   //     <alternatives[1]>
        10, 9, 0,                    //     IF_ERROR
        2,                           //       * POP
        16, 4, 2, 2, 20, 4, 21, 5    //         <alternatives[2]>
      ]));
    });
  });

  describe("for action", function() {
    describe("without labels", function() {
      var grammar = 'start = "a" { code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          16, 0, 2, 2, 20, 0, 21, 1,   // <expression>
          11, 6, 0,                    // IF_NOT_ERROR
          22, 1,                       //   * REPORT_SAVED_POS
          24, 2, 1, 0,                 //     CALL
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
          16, 0, 2, 2, 20, 0, 21, 1,   // <expression>
          11, 7, 0,                    // IF_NOT_ERROR
          22, 1,                       //   * REPORT_SAVED_POS
          24, 2, 1, 1, 0,              //     CALL
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
          16, 1, 2, 2, 20, 1, 21, 2,   // <elements[0]>
          11, 42, 4,                   // IF_NOT_ERROR
          16, 3, 2, 2, 20, 3, 21, 4,   //   * <elements[1]>
          11, 26, 5,                   //     IF_NOT_ERROR
          16, 5, 2, 2, 20, 5, 21, 6,   //       * <elements[2]>
          11, 10, 5,                   //         IF_NOT_ERROR
          22, 3,                       //           * REPORT_SAVED_POS
          24, 7, 3, 3, 2, 1, 0,        //             CALL
          5,                           //             NIP
          4, 3,                        //           * POP_N
          3,                           //             POP_CURR_POS
          0, 0,                        //             PUSH
          4, 2,                        //       * POP_N
          3,                           //         POP_CURR_POS
          0, 0,                        //         PUSH
          2,                           //   * POP
          3,                           //     POP_CURR_POS
          0, 0                         //     PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          'peg$FAILED',
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
        16, 1, 2, 2, 20, 1, 21, 2,   // <elements[0]>
        11, 35, 4,                   // IF_NOT_ERROR
        16, 3, 2, 2, 20, 3, 21, 4,   //   * <elements[1]>
        11, 19, 5,                   //     IF_NOT_ERROR
        16, 5, 2, 2, 20, 5, 21, 6,   //       * <elements[2]>
        11, 3, 5,                    //         IF_NOT_ERROR
        7, 3,                        //           * WRAP
        5,                           //             NIP
        4, 3,                        //           * POP_N
        3,                           //             POP_CURR_POS
        0, 0,                        //             PUSH
        4, 2,                        //       * POP_N
        3,                           //         POP_CURR_POS
        0, 0,                        //         PUSH
        2,                           //   * POP
        3,                           //     POP_CURR_POS
        0, 0                         //     PUSH
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        'peg$FAILED',
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
        16, 0, 2, 2, 20, 0, 21, 1   // <expression>
      ]));
    });
  });

  describe("for text", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = $"a"', bytecodeDetails([
        1,                           // PUSH_CURR_POS
        16, 0, 2, 2, 20, 0, 21, 1,   // <expression>
        11, 1, 0,                    // IF_NOT_ERROR
        8,                           //   * TEXT
        5                            // NIP
      ]));
    });
  });

  describe("for simple and", function() {
    var grammar = 'start = &"a"';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        1,                           // PUSH_CURR_POS
        26,                          // SILENT_FAILS_ON
        16, 2, 2, 2, 20, 2, 21, 3,   // <expression>
        27,                          // SILENT_FAILS_OFF
        11, 4, 4,                    // IF_NOT_ERROR
        2,                           //   * POP
        3,                           //     POP_CURR_POS
        0, 0,                        //     PUSH
        2,                           //   * POP
        2,                           //     POP
        0, 1                         //     PUSH
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        'void 0',
        'peg$FAILED',
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for simple not", function() {
    var grammar = 'start = !"a"';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        1,                           // PUSH_CURR_POS
        26,                          // SILENT_FAILS_ON
        16, 2, 2, 2, 20, 2, 21, 3,   // <expression>
        27,                          // SILENT_FAILS_OFF
        10, 4, 4,                    // IF_ERROR
        2,                           //   * POP
        2,                           //     POP
        0, 0,                        //     PUSH
        2,                           //   * POP
        3,                           //     POP_CURR_POS
        0, 1                         //     PUSH
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        'void 0',
        'peg$FAILED',
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for semantic and", function() {
    describe("without labels", function() {
      var grammar = 'start = &{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          23,            // REPORT_CURR_POS
          24, 0, 0, 0,   // CALL
          9, 3, 3,       // IF
          2,             //   * POP
          0, 1,          //     PUSH
          2,             //   * POP
          0, 2           //     PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          grammar,
          constsDetails(['function() { code }', 'void 0', 'peg$FAILED'])
        );
      });
    });

    describe("with labels", function() {
      var grammar = 'start = a:"a" b:"b" c:"c" &{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          16, 1, 2, 2, 20, 1, 21, 2,   // <elements[0]>
          11, 60, 4,                   // IF_NOT_ERROR
          16, 3, 2, 2, 20, 3, 21, 4,   //   * <elements[1]>
          11, 44, 5,                   //     IF_NOT_ERROR
          16, 5, 2, 2, 20, 5, 21, 6,   //       * <elements[2]>
          11, 28, 5,                   //         IF_NOT_ERROR
          23,                          //           * REPORT_CURR_POS
          24, 7, 0, 3, 2, 1, 0,        //             CALL
          9, 3, 3,                     //             IF
          2,                           //               * POP
          0, 8,                        //                 PUSH
          2,                           //               * POP
          0, 0,                        //                 PUSH
          11, 3, 5,                    //             IF_NOT_ERROR
          7, 4,                        //               * WRAP
          5,                           //                 NIP
          4, 4,                        //               * POP_N
          3,                           //                 POP_CURR_POS
          0, 0,                        //                 PUSH
          4, 3,                        //           * POP_N
          3,                           //             POP_CURR_POS
          0, 0,                        //             PUSH
          4, 2,                        //       * POP_N
          3,                           //         POP_CURR_POS
          0, 0,                        //         PUSH
          2,                           //   * POP
          3,                           //     POP_CURR_POS
          0, 0                         //     PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          'peg$FAILED',
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }',
          '"b"',
          '{ type: "literal", value: "b", description: "\\"b\\"" }',
          '"c"',
          '{ type: "literal", value: "c", description: "\\"c\\"" }',
          'function(a, b, c) { code }',
          'void 0'
        ]));
      });
    });
  });

  describe("for semantic not", function() {
    describe("without labels", function() {
      var grammar = 'start = !{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          23,            // REPORT_CURR_POS
          24, 0, 0, 0,   // CALL
          9, 3, 3,       // IF
          2,             //   * POP
          0, 2,          //     PUSH
          2,             //   * POP
          0, 1           //     PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          grammar,
          constsDetails(['function() { code }', 'void 0', 'peg$FAILED'])
        );
      });
    });

    describe("with labels", function() {
      var grammar = 'start = a:"a" b:"b" c:"c" !{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          16, 1, 2, 2, 20, 1, 21, 2,   // <elements[0]>
          11, 60, 4,                   // IF_NOT_ERROR
          16, 3, 2, 2, 20, 3, 21, 4,   //   * <elements[1]>
          11, 44, 5,                   //     IF_NOT_ERROR
          16, 5, 2, 2, 20, 5, 21, 6,   //       * <elements[2]>
          11, 28, 5,                   //         IF_NOT_ERROR
          23,                          //           * REPORT_CURR_POS
          24, 7, 0, 3, 2, 1, 0,        //             CALL
          9, 3, 3,                     //             IF
          2,                           //               * POP
          0, 0,                        //                 PUSH
          2,                           //               * POP
          0, 8,                        //                 PUSH
          11, 3, 5,                    //             IF_NOT_ERROR
          7, 4,                        //               * WRAP
          5,                           //                 NIP
          4, 4,                        //               * POP_N
          3,                           //                 POP_CURR_POS
          0, 0,                        //                 PUSH
          4, 3,                        //           * POP_N
          3,                           //             POP_CURR_POS
          0, 0,                        //             PUSH
          4, 2,                        //       * POP_N
          3,                           //         POP_CURR_POS
          0, 0,                        //         PUSH
          2,                           //   * POP
          3,                           //     POP_CURR_POS
          0, 0                         //     PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          'peg$FAILED',
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }',
          '"b"',
          '{ type: "literal", value: "b", description: "\\"b\\"" }',
          '"c"',
          '{ type: "literal", value: "c", description: "\\"c\\"" }',
          'function(a, b, c) { code }',
          'void 0'
        ]));
      });
    });
  });

  describe("for optional", function() {
    var grammar = 'start = "a"?';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        16, 1, 2, 2, 20, 1, 21, 2,   // <expression>
        10, 3, 0,                    // IF_ERROR
        2,                           //   * POP
        0, 0                         //     PUSH
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        'null',
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for zero or more", function() {
    var grammar = 'start = "a"*';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        0, 0,                        // PUSH
        16, 1, 2, 2, 20, 1, 21, 2,   // <expression>
        14, 9,                       // WHILE_NOT_ERROR
        6,                           //   * APPEND
        16, 1, 2, 2, 20, 1, 21, 2,   //     <expression>
        2                            // POP
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        '[]',
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for one or more", function() {
    var grammar = 'start = "a"+';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        0, 0,                        // PUSH
        16, 2, 2, 2, 20, 2, 21, 3,   // <expression>
        11, 12, 4,                   // IF_NOT_ERROR
        14, 9,                       //   * WHILE_NOT_ERROR
        6,                           //       * APPEND
        16, 2, 2, 2, 20, 2, 21, 3,   //         <expression>
        2,                           //     POP
        2,                           //   * POP
        2,                           //     POP
        0, 1                         //     PUSH
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails([
        '[]',
        'peg$FAILED',
        '"a"',
        '{ type: "literal", value: "a", description: "\\"a\\"" }'
      ]));
    });
  });

  describe("for range", function() {
    describe("|2..3|", function() {
      var grammar = 'start = "a"|2..3|';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          0, 0,                        // PUSH
          16, 2, 2, 2, 20, 2, 21, 3,   // <expression>
          14, 16,                      // WHILE_NOT_ERROR
          6,                           //   * APPEND
          0, 5,                        //     PUSH
          13, 2, 8,                    //     IF_ARRLEN_MAX
          0, 1,                        //       * PUSH
          16, 2, 2, 2, 20, 2, 21, 3,   //       * <expression>
          2,                           // POP
          0, 4,                        // PUSH
          12, 3, 0,                    // IF_ARRLEN_MIN
          2,                           //   * POP
          0, 1                         //     PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          '[]',
          'peg$FAILED',
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }',
          2,
          3
        ]));
      });
    });

    describe("|2..3, ','|", function() {
      var grammar = 'start = "a"|2..3, ","|';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          0, 0,                        // PUSH
          16, 2, 2, 2, 20, 2, 21, 3,   // <expression>
          14, 38,                      // WHILE_NOT_ERROR
          6,                           //   * APPEND
          0, 7,                        //     PUSH
          13, 2, 30,                   //     IF_ARRLEN_MAX
          0, 1,                        //       * PUSH
          1,                           //       * PUSH_CURR_POS
          16, 4, 2, 2, 20, 4, 21, 5,   //         <delimiter>
          11, 17, 1,                   //         IF_NOT_ERROR
          2,                           //           * POP
          16, 2, 2, 2, 20, 2, 21, 3,   //             <expression>
          10, 4, 1,                    //             IF_ERROR
          2,                           //               * POP
          3,                           //                 POP_CURR_POS
          0, 1,                        //                 PUSH
          5,                           //               * NIP
          5,                           //           * NIP
          2,                           // POP
          0, 6,                        // PUSH
          12, 3, 0,                    // IF_ARRLEN_MIN
          2,                           //   * POP
          0, 1                         //     PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails([
          '[]',
          'peg$FAILED',
          '"a"',
          '{ type: "literal", value: "a", description: "\\"a\\"" }',
          '","',
          '{ type: "literal", value: ",", description: "\\",\\"" }',
          2,
          3
        ]));
      });
    });
  });

  describe("for rule reference", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST([
        'start = other',
        'other = "other"'
      ].join("\n"), {
        rules: [
          {
            bytecode: [25, 1]   // RULE
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
          16, 0, 2, 2,   // MATCH_STRING
          20, 0,         //   * ACCEPT_STRING
          21, 1          //   * FAIL
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
          17, 0, 2, 2,   // MATCH_STRING_IC
          19, 1,         //   * ACCEPT_N
          21, 1          //   * FAIL
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
        18, 0, 2, 2,   // MATCH_REGEXP
        19, 1,         //   * ACCEPT_N
        21, 1          //   * FAIL
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
        15, 2, 2,   // MATCH_ANY
        19, 1,      //   * ACCEPT_N
        21, 0       //   * FAIL
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
