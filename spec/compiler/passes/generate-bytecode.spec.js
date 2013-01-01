describe("compiler pass |generateBytecode|", function() {
  var pass = PEG.compiler.passes.generateBytecode;

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
          { bytecode: [15, 0, 2, 2, 19, 0, 20, 1] },
          { bytecode: [15, 2, 2, 2, 19, 2, 20, 3] },
          { bytecode: [15, 4, 2, 2, 19, 4, 20, 5] }
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
        '"\\"a\\""',
        '"b"',
        '"\\"b\\""',
        '"c"',
        '"\\"c\\""'
      ]));
    });
  });

  describe("for rule", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = "a"', bytecodeDetails([
        15, 0, 2, 2, 19, 0, 20, 1   // <expression>
      ]));
    });
  });

  describe("for named", function() {
    var grammar = 'start "start" = "a"';
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        25,                          // SILENT_FAILS_ON
        15, 1, 2, 2, 19, 1, 20, 2,   // <expression>
        26,                          // SILENT_FAILS_OFF
        11, 2, 0,                    // IF_ERROR
        20, 0                        // FAIL
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(
        grammar,
        constsDetails(['"start"', '"a"', '"\\"a\\""'])
      );
    });
  });

  describe("for choice", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = "a" / "b" / "c"', bytecodeDetails([
        15, 0, 2, 2, 19, 0, 20, 1,   // <alternatives[0]>
        11, 21, 0,                   // IF_ERROR
        2,                           //   * POP
        15, 2, 2, 2, 19, 2, 20, 3,   //     <alternatives[1]>
        11, 9, 0,                    //     IF_ERROR
        2,                           //       * POP
        15, 4, 2, 2, 19, 4, 20, 5    //         <alternatives[2]>
      ]));
    });
  });

  describe("for action", function() {
    describe("without labels", function() {
      var grammar = 'start = { code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,             // PUSH_CURR_POS
          0, 0,          // PUSH
          12, 6, 0,      // IF_NOT_ERROR
          21, 1,         //   * REPORT_SAVED_POS
          23, 1, 1, 0,   //     CALL
          11, 1, 1,      // IF_ERROR
          6,             //   * NIP_CURR_POS
          5              //   * NIP
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          grammar,
          constsDetails(['[]', 'function() { code }'])
        );
      });
    });

    describe("with one label", function() {
      var grammar = 'start = a:"a" { code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          15, 0, 2, 2, 19, 0, 20, 1,   // <expression>
          12, 7, 0,                    // IF_NOT_ERROR
          21, 1,                       //   * REPORT_SAVED_POS
          23, 2, 1, 1, 0,              //     CALL
          11, 1, 1,                    // IF_ERROR
          6,                           //   * NIP_CURR_POS
          5                            //   * NIP
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          grammar,
          constsDetails(['"a"', '"\\"a\\""', 'function(a) { code }'])
        );
      });
    });

    describe("with multiple labels", function() {
      var grammar = 'start = a:"a" b:"b" c:"c" { code }';
      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          15, 1, 2, 2, 19, 1, 20, 2,   // <elements[0]>
          12, 46, 4,                   // IF_NOT_ERROR
          15, 3, 2, 2, 19, 3, 20, 4,   //   * <elements[1]>
          12, 30, 5,                   //     IF_NOT_ERROR
          15, 5, 2, 2, 19, 5, 20, 6,   //       * <elements[2]>
          12, 14, 5,                   //         IF_NOT_ERROR
          21, 3,                       //           * REPORT_SAVED_POS
          23, 7, 3, 3, 2, 1, 0,        //             CALL
          11, 1, 1,                    //             IF_ERROR
          6,                           //               * NIP_CURR_POS
          5,                           //               * NIP
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
          'null',
          '"a"',
          '"\\"a\\""',
          '"b"',
          '"\\"b\\""',
          '"c"',
          '"\\"c\\""',
          'function(a, b, c) { code }'
        ]));
      });
    });
  });

  describe("for sequence", function() {
    describe("empty", function() {
      var grammar = 'start = ';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          0, 0   // PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails(['[]']));
      });
    });

    describe("non-empty", function() {
      var grammar = 'start = "a" "b" "c"';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          15, 1, 2, 2, 19, 1, 20, 2,   // <elements[0]>
          12, 35, 4,                   // IF_NOT_ERROR
          15, 3, 2, 2, 19, 3, 20, 4,   //   * <elements[1]>
          12, 19, 5,                   //     IF_NOT_ERROR
          15, 5, 2, 2, 19, 5, 20, 6,   //       * <elements[2]>
          12, 3, 5,                    //         IF_NOT_ERROR
          8, 3,                        //           * WRAP
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
        expect(pass).toChangeAST(
          grammar,
          constsDetails([
            'null',
            '"a"',
            '"\\"a\\""',
            '"b"',
            '"\\"b\\""',
            '"c"',
            '"\\"c\\""'
          ])
        );
      });
    });
  });

  describe("for labeled", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = a:"a"', bytecodeDetails([
        15, 0, 2, 2, 19, 0, 20, 1   // <expression>
      ]));
    });
  });

  describe("for text", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = $"a"', bytecodeDetails([
        1,                           // PUSH_CURR_POS
        15, 0, 2, 2, 19, 0, 20, 1,   // <expression>
        12, 1, 0,                    // IF_NOT_ERROR
        9,                           //   * TEXT
        5                            // NIP
      ]));
    });
  });

  describe("for simple and", function() {
    var grammar = 'start = &"a"';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        1,                           // PUSH_CURR_POS
        25,                          // SILENT_FAILS_ON
        15, 2, 2, 2, 19, 2, 20, 3,   // <expression>
        26,                          // SILENT_FAILS_OFF
        12, 4, 4,                    // IF_NOT_ERROR
        2,                           //   * POP
        3,                           //     POP_CURR_POS
        0, 0,                        //     PUSH
        2,                           //   * POP
        2,                           //     POP
        0, 1                         //     PUSH
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(
        grammar,
        constsDetails(['""', 'null', '"a"', '"\\"a\\""'])
      );
    });
  });

  describe("for simple not", function() {
    var grammar = 'start = !"a"';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        1,                           // PUSH_CURR_POS
        25,                          // SILENT_FAILS_ON
        15, 2, 2, 2, 19, 2, 20, 3,   // <expression>
        26,                          // SILENT_FAILS_OFF
        11, 4, 4,                    // IF_ERROR
        2,                           //   * POP
        2,                           //     POP
        0, 0,                        //     PUSH
        2,                           //   * POP
        3,                           //     POP_CURR_POS
        0, 1                         //     PUSH
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(
        grammar,
        constsDetails(['""', 'null', '"a"', '"\\"a\\""'])
      );
    });
  });

  describe("for semantic and", function() {
    describe("without labels", function() {
      var grammar = 'start = &{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          22,            // REPORT_CURR_POS
          23, 0, 0, 0,   // CALL
          10, 3, 3,      // IF
          2,             //   * POP
          0, 1,          //     PUSH
          2,             //   * POP
          0, 2           //     PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          grammar,
          constsDetails(['function() { code }', '""', 'null'])
        );
      });
    });

    describe("with labels", function() {
      var grammar = 'start = a:"a" b:"b" c:"c" &{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          15, 1, 2, 2, 19, 1, 20, 2,   // <elements[0]>
          12, 60, 4,                   // IF_NOT_ERROR
          15, 3, 2, 2, 19, 3, 20, 4,   //   * <elements[1]>
          12, 44, 5,                   //     IF_NOT_ERROR
          15, 5, 2, 2, 19, 5, 20, 6,   //       * <elements[2]>
          12, 28, 5,                   //         IF_NOT_ERROR
          22,                          //           * REPORT_CURR_POS
          23, 7, 0, 3, 2, 1, 0,        //             CALL
          10, 3, 3,                    //             IF
          2,                           //               * POP
          0, 8,                        //                 PUSH
          2,                           //               * POP
          0, 0,                        //                 PUSH
          12, 3, 5,                    //             IF_NOT_ERROR
          8, 4,                        //               * WRAP
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
          'null',
          '"a"',
          '"\\"a\\""',
          '"b"',
          '"\\"b\\""',
          '"c"',
          '"\\"c\\""',
          'function(a, b, c) { code }',
          '""'
        ]));
      });
    });
  });

  describe("for semantic not", function() {
    describe("without labels", function() {
      var grammar = 'start = !{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          22,            // REPORT_CURR_POS
          23, 0, 0, 0,   // CALL_PREDICATE
          10, 3, 3,      // IF
          2,             //   * POP
          0, 2,          //     PUSH
          2,             //   * POP
          0, 1           //     PUSH
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          grammar,
          constsDetails(['function() { code }', '""', 'null'])
        );
      });
    });

    describe("with labels", function() {
      var grammar = 'start = a:"a" b:"b" c:"c" !{ code }';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          1,                           // PUSH_CURR_POS
          15, 1, 2, 2, 19, 1, 20, 2,   // <elements[0]>
          12, 60, 4,                   // IF_NOT_ERROR
          15, 3, 2, 2, 19, 3, 20, 4,   //   * <elements[1]>
          12, 44, 5,                   //     IF_NOT_ERROR
          15, 5, 2, 2, 19, 5, 20, 6,   //       * <elements[2]>
          12, 28, 5,                   //         IF_NOT_ERROR
          22,                          //           * REPORT_CURR_POS
          23, 7, 0, 3, 2, 1, 0,        //             CALL
          10, 3, 3,                    //             IF
          2,                           //               * POP
          0, 0,                        //                 PUSH
          2,                           //               * POP
          0, 8,                        //                 PUSH
          12, 3, 5,                    //             IF_NOT_ERROR
          8, 4,                        //               * WRAP
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
          'null',
          '"a"',
          '"\\"a\\""',
          '"b"',
          '"\\"b\\""',
          '"c"',
          '"\\"c\\""',
          'function(a, b, c) { code }',
          '""'
        ]));
      });
    });
  });

  describe("for optional", function() {
    var grammar = 'start = "a"?';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        15, 1, 2, 2, 19, 1, 20, 2,   // <expression>
        11, 3, 0,                    // IF_ERROR
        2,                           //   * POP
        0, 0                         //     PUSH
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(
        grammar,
        constsDetails(['""', '"a"', '"\\"a\\""'])
      );
    });
  });

  describe("for zero or more", function() {
    var grammar = 'start = "a"*';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        0, 0,                        // PUSH
        15, 1, 2, 2, 19, 1, 20, 2,   // <expression>
        13, 9,                       // WHILE_NOT_ERROR
        7,                           //   * APPEND
        15, 1, 2, 2, 19, 1, 20, 2,   //     <expression>
        2                            //     POP
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(
        grammar,
        constsDetails(['[]', '"a"', '"\\"a\\""'])
      );
    });
  });

  describe("for one or more", function() {
    var grammar = 'start = "a"+';

    it("generates correct bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        0, 0,                        // PUSH
        15, 2, 2, 2, 19, 2, 20, 3,   // <expression>
        12, 12, 4,                   // IF_NOT_ERROR
        13, 9,                       //   * WHILE_NOT_ERROR
        7,                           //       * APPEND
        15, 2, 2, 2, 19, 2, 20, 3,   //         <expression>
        2,                           //     POP
        2,                           //   * POP
        2,                           //     POP
        0, 1                         //     PUSH
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(
        grammar,
        constsDetails(['[]', 'null', '"a"', '"\\"a\\""'])
      );
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
            bytecode: [24, 1]   // RULE
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
          15, 0, 2, 2,   // MATCH_STRING
          19, 0,         //   * ACCEPT_STRING
          20, 1          //   * FAIL
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails(['"a"', '"\\"a\\""']));
      });
    });

    describe("non-empty case-insensitive", function() {
      var grammar = 'start = "A"i';

      it("generates correct bytecode", function() {
        expect(pass).toChangeAST(grammar, bytecodeDetails([
          16, 0, 2, 2,   // MATCH_STRING_IC
          18, 1,         //   * ACCEPT_N
          20, 1          //   * FAIL
        ]));
      });

      it("defines correct constants", function() {
        expect(pass).toChangeAST(grammar, constsDetails(['"a"', '"\\"A\\""']));
      });
    });
  });

  describe("for class", function() {
    it("generates correct bytecode", function() {
      expect(pass).toChangeAST('start = [a]', bytecodeDetails([
        17, 0, 2, 2,   // MATCH_REGEXP
        18, 1,         //   * ACCEPT_N
        20, 1          //   * FAIL
      ]));
    });

    describe("non-empty non-inverted case-sensitive", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          'start = [a]',
          constsDetails(['/^[a]/', '"[a]"'])
        );
      });
    });

    describe("non-empty inverted case-sensitive", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          'start = [^a]',
          constsDetails(['/^[^a]/', '"[^a]"'])
        );
      });
    });

    describe("non-empty non-inverted case-insensitive", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          'start = [a]i',
          constsDetails(['/^[a]/i', '"[a]i"'])
        );
      });
    });

    describe("non-empty complex", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          'start = [ab-def-hij-l]',
          constsDetails(['/^[ab-def-hij-l]/', '"[ab-def-hij-l]"'])
        );
      });
    });

    describe("empty non-inverted", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          'start = []',
          constsDetails(['/^(?!)/', '"[]"'])
        );
      });
    });

    describe("empty inverted", function() {
      it("defines correct constants", function() {
        expect(pass).toChangeAST(
          'start = [^]',
          constsDetails(['/^[\\S\\s]/', '"[^]"'])
        );
      });
    });
  });

  describe("for any", function() {
    var grammar = 'start = .';

    it("generates bytecode", function() {
      expect(pass).toChangeAST(grammar, bytecodeDetails([
        14, 2, 2,   // MATCH_ANY
        18, 1,      //   * ACCEPT_N
        20, 0       //   * FAIL
      ]));
    });

    it("defines correct constants", function() {
      expect(pass).toChangeAST(grammar, constsDetails(['"any character"']));
    });
  });
});
