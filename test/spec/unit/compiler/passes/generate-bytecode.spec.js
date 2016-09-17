"use strict";

const chai = require( "chai" );
const helpers = require( "./helpers" );
const pass = require( "pegjs-dev" ).compiler.passes.generate.generateBytecode;

chai.use( helpers );

const expect = chai.expect;

describe( "compiler pass |generateBytecode|", function () {

    function bytecodeDetails( bytecode ) {

        return {
            rules: [ { bytecode: bytecode } ]
        };

    }

    function constsDetails( literals, classes, expectations, functions ) {

        return {
            literals: literals,
            classes: classes,
            expectations: expectations,
            functions: functions
        };

    }

    describe( "for grammar", function () {

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( [
                "a = 'a'",
                "b = 'b'",
                "c = 'c'"
            ].join( "\n" ), {
                rules: [
                    { bytecode: [ 23, 0, 18, 0, 2, 1, 22, 0, 3 ] },
                    { bytecode: [ 23, 1, 18, 1, 2, 1, 22, 1, 3 ] },
                    { bytecode: [ 23, 2, 18, 2, 2, 1, 22, 2, 3 ] }
                ]
            } );

        } );

        it( "defines correct constants", function () {

            expect( pass ).to.changeAST( [
                "a = 'a'",
                "b = 'b'",
                "c = 'c'"
            ].join( "\n" ), constsDetails(
                [ "\"a\"", "\"b\"", "\"c\"" ],
                [],
                [
                    "peg$literalExpectation(\"a\", false)",
                    "peg$literalExpectation(\"b\", false)",
                    "peg$literalExpectation(\"c\", false)"
                ],
                []
            ) );

        } );

    } );

    describe( "for rule", function () {

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( "start = 'a'", bytecodeDetails( [
                23, 0, 18, 0, 2, 1, 22, 0, 3   // <expression>
            ] ) );

        } );

    } );

    describe( "for named", function () {

        const grammar1 = "start 'start' = .";
        const grammar2 = "start 'start' = 'a'";
        const grammar3 = "start 'start' = [a]";

        describe( "when |reportFailures=true|", function () {

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( grammar1, bytecodeDetails( [
                    23, 0,                        // EXPECT <0>
                    28,                           // SILENT_FAILS_ON
                    17, 2, 1, 21, 1, 3,           // <expression>
                    29                            // SILENT_FAILS_OFF
                ] ) );
                expect( pass ).to.changeAST( grammar2, bytecodeDetails( [
                    23, 0,                        // EXPECT <0>
                    28,                           // SILENT_FAILS_ON
                    18, 0, 2, 1, 22, 0, 3,        // <expression>
                    29                            // SILENT_FAILS_OFF
                ] ) );
                expect( pass ).to.changeAST( grammar3, bytecodeDetails( [
                    23, 0,                        // EXPECT <0>
                    28,                           // SILENT_FAILS_ON
                    20, 0, 2, 1, 21, 1, 3,        // <expression>
                    29                            // SILENT_FAILS_OFF
                ] ) );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST( grammar1, constsDetails(
                    [],
                    [],
                    [ "peg$otherExpectation(\"start\")" ],
                    []
                ) );
                expect( pass ).to.changeAST( grammar2, constsDetails(
                    [ "\"a\"" ],
                    [],
                    [ "peg$otherExpectation(\"start\")" ],
                    []
                ) );
                expect( pass ).to.changeAST( grammar3, constsDetails(
                    [],
                    [ "/^[a]/" ],
                    [ "peg$otherExpectation(\"start\")" ],
                    []
                ) );

            } );

        } );

        describe( "when |reportFailures=false|", function () {

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( grammar1, bytecodeDetails( [
                    17, 2, 1, 21, 1, 3,           // <expression>
                ] ), {}, { reportFailures: false } );
                expect( pass ).to.changeAST( grammar2, bytecodeDetails( [
                    18, 0, 2, 1, 22, 0, 3,        // <expression>
                ] ), {}, { reportFailures: false } );
                expect( pass ).to.changeAST( grammar3, bytecodeDetails( [
                    20, 0, 2, 1, 21, 1, 3,        // <expression>
                ] ), {}, { reportFailures: false } );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST( grammar1, constsDetails(
                    [], [], [], []
                ), {}, { reportFailures: false } );
                expect( pass ).to.changeAST( grammar2, constsDetails(
                    [ "\"a\"" ], [], [], []
                ), {}, { reportFailures: false } );
                expect( pass ).to.changeAST( grammar3, constsDetails(
                    [], [ "/^[a]/" ], [], []
                ), {}, { reportFailures: false } );

            } );

        } );

    } );

    describe( "for choice", function () {

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( "start = 'a' / 'b' / 'c'", bytecodeDetails( [
                23, 0, 18, 0, 2, 1, 22, 0, 3, // <alternatives[0]>
                14, 23, 0,                    // IF_ERROR
                6,                            //   * POP
                23, 1, 18, 1, 2, 1, 22, 1, 3, //     <alternatives[1]>
                14, 10, 0,                    //     IF_ERROR
                6,                            //       * POP
                23, 2, 18, 2, 2, 1, 22, 2, 3  //         <alternatives[2]>
            ] ) );

        } );

    } );

    describe( "for action", function () {

        describe( "without labels", function () {

            const grammar = "start = 'a' { code }";

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                    5,                            // PUSH_CURR_POS
                    23, 0, 18, 0, 2, 1, 22, 0, 3, // <expression>
                    15, 6, 0,                     // IF_NOT_ERROR
                    24, 1,                        //   * LOAD_SAVED_POS
                    26, 0, 1, 0,                  //     CALL <0>
                    9                             // NIP
                ] ) );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST( grammar, constsDetails(
                    [ "\"a\"" ],
                    [],
                    [ "peg$literalExpectation(\"a\", false)" ],
                    [ { predicate: false, params: [], body: " code " } ]
                ) );

            } );

        } );

        describe( "with one label", function () {

            const grammar = "start = a:'a' { code }";

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                    5,                            // PUSH_CURR_POS
                    23, 0, 18, 0, 2, 1, 22, 0, 3, // <expression>
                    15, 7, 0,                     // IF_NOT_ERROR
                    24, 1,                        //   * LOAD_SAVED_POS
                    26, 0, 1, 1, 0,               //     CALL <0>
                    9                             // NIP
                ] ) );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST( grammar, constsDetails(
                    [ "\"a\"" ],
                    [],
                    [ "peg$literalExpectation(\"a\", false)" ],
                    [ { predicate: false, params: [ "a" ], body: " code " } ]
                ) );

            } );

        } );

        describe( "with multiple labels", function () {

            const grammar = "start = a:'a' b:'b' c:'c' { code }";

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                    5,                            // PUSH_CURR_POS
                    23, 0, 18, 0, 2, 1, 22, 0, 3, // <elements[0]>
                    15, 41, 3,                    // IF_NOT_ERROR
                    23, 1, 18, 1, 2, 1, 22, 1, 3, //   * <elements[1]>
                    15, 25, 4,                    //     IF_NOT_ERROR
                    23, 2, 18, 2, 2, 1, 22, 2, 3, //       * <elements[2]>
                    15, 9, 4,                     //         IF_NOT_ERROR
                    24, 3,                        //           * LOAD_SAVED_POS
                    26, 0, 4, 3, 2, 1, 0,         //             CALL <0>
                    8, 3,                         //           * POP_N
                    7,                            //             POP_CURR_POS
                    3,                            //             PUSH_FAILED
                    8, 2,                         //       * POP_N
                    7,                            //         POP_CURR_POS
                    3,                            //         PUSH_FAILED
                    6,                            //   * POP
                    7,                            //     POP_CURR_POS
                    3                             //     PUSH_FAILED
                ] ) );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST( grammar, constsDetails(
                    [ "\"a\"", "\"b\"", "\"c\"" ],
                    [],
                    [
                        "peg$literalExpectation(\"a\", false)",
                        "peg$literalExpectation(\"b\", false)",
                        "peg$literalExpectation(\"c\", false)"
                    ],
                    [ { predicate: false, params: [ "a", "b", "c" ], body: " code " } ]
                ) );

            } );

        } );

    } );

    describe( "for sequence", function () {

        const grammar = "start = 'a' 'b' 'c'";

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                5,                            // PUSH_CURR_POS
                23, 0, 18, 0, 2, 1, 22, 0, 3, // <elements[0]>
                15, 35, 3,                    // IF_NOT_ERROR
                23, 1, 18, 1, 2, 1, 22, 1, 3, //   * <elements[1]>
                15, 19, 4,                    //     IF_NOT_ERROR
                23, 2, 18, 2, 2, 1, 22, 2, 3, //       * <elements[2]>
                15, 3, 4,                     //         IF_NOT_ERROR
                11, 3,                        //           * WRAP
                9,                            //             NIP
                8, 3,                         //           * POP_N
                7,                            //             POP_CURR_POS
                3,                            //             PUSH_FAILED
                8, 2,                         //       * POP_N
                7,                            //         POP_CURR_POS
                3,                            //         PUSH_FAILED
                6,                            //   * POP
                7,                            //     POP_CURR_POS
                3                             //     PUSH_FAILED
            ] ) );

        } );

        it( "defines correct constants", function () {

            expect( pass ).to.changeAST( grammar, constsDetails(
                [ "\"a\"", "\"b\"", "\"c\"" ],
                [],
                [
                    "peg$literalExpectation(\"a\", false)",
                    "peg$literalExpectation(\"b\", false)",
                    "peg$literalExpectation(\"c\", false)"
                ],
                []
            ) );

        } );

    } );

    describe( "for labeled", function () {

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( "start = a:'a'", bytecodeDetails( [
                23, 0, 18, 0, 2, 1, 22, 0, 3   // <expression>
            ] ) );

        } );

    } );

    describe( "for text", function () {

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( "start = $'a'", bytecodeDetails( [
                5,                            // PUSH_CURR_POS
                23, 0, 18, 0, 2, 1, 22, 0, 3, // <expression>
                15, 2, 1,                     // IF_NOT_ERROR
                6,                            //   * POP
                12,                           //     TEXT
                9                             //   * NIP
            ] ) );

        } );

    } );

    describe( "for simple_and", function () {

        const grammar = "start = &'a'";

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                5,                            // PUSH_CURR_POS
                38,                           // EXPECT_NS_BEGIN
                23, 0, 18, 0, 2, 1, 22, 0, 3, // <expression>
                39, 0,                        // EXPECT_NS_END <false>
                15, 3, 3,                     // IF_NOT_ERROR
                6,                            //   * POP
                7,                            //     POP_CURR_POS
                1,                            //     PUSH_UNDEFINED
                6,                            //   * POP
                6,                            //     POP
                3                             //     PUSH_FAILED
            ] ) );

        } );

        it( "defines correct constants", function () {

            expect( pass ).to.changeAST( grammar, constsDetails(
                [ "\"a\"" ],
                [],
                [ "peg$literalExpectation(\"a\", false)" ],
                []
            ) );

        } );

    } );

    describe( "for simple_not", function () {

        const grammar = "start = !'a'";

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                5,                            // PUSH_CURR_POS
                38,                           // EXPECT_NS_BEGIN
                23, 0, 18, 0, 2, 1, 22, 0, 3, // <expression>
                39, 1,                        // EXPECT_NS_END <true>
                14, 3, 3,                     // IF_ERROR
                6,                            //   * POP
                6,                            //     POP
                1,                            //     PUSH_UNDEFINED
                6,                            //   * POP
                7,                            //     POP_CURR_POS
                3                             //     PUSH_FAILED
            ] ) );

        } );

        it( "defines correct constants", function () {

            expect( pass ).to.changeAST( grammar, constsDetails(
                [ "\"a\"" ],
                [],
                [ "peg$literalExpectation(\"a\", false)" ],
                []
            ) );

        } );

    } );

    describe( "for optional", function () {

        const grammar = "start = 'a'?";

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                23, 0, 18, 0, 2, 1, 22, 0, 3, // <expression>
                14, 2, 0,                     // IF_ERROR
                6,                            //   * POP
                2                             //     PUSH_NULL
            ] ) );

        } );

        it( "defines correct constants", function () {

            expect( pass ).to.changeAST( grammar, constsDetails(
                [ "\"a\"" ],
                [],
                [ "peg$literalExpectation(\"a\", false)" ],
                []
            ) );

        } );

    } );

    describe( "for zero_or_more", function () {

        const grammar = "start = 'a'*";

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                4,                            // PUSH_EMPTY_ARRAY
                23, 0, 18, 0, 2, 1, 22, 0, 3, // <expression>
                16, 10,                       // WHILE_NOT_ERROR
                10,                           //   * APPEND
                23, 0, 18, 0, 2, 1, 22, 0, 3, //     <expression>
                6                             // POP
            ] ) );

        } );

        it( "defines correct constants", function () {

            expect( pass ).to.changeAST( grammar, constsDetails(
                [ "\"a\"" ],
                [],
                [ "peg$literalExpectation(\"a\", false)" ],
                []
            ) );

        } );

    } );

    describe( "for one_or_more", function () {

        const grammar = "start = 'a'+";

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                4,                            // PUSH_EMPTY_ARRAY
                23, 0, 18, 0, 2, 1, 22, 0, 3, // <expression>
                15, 13, 3,                    // IF_NOT_ERROR
                16, 10,                       //   * WHILE_NOT_ERROR
                10,                           //       * APPEND
                23, 0, 18, 0, 2, 1, 22, 0, 3, //         <expression>
                6,                            //     POP
                6,                            //   * POP
                6,                            //     POP
                3                             //     PUSH_FAILED
            ] ) );

        } );

        it( "defines correct constants", function () {

            expect( pass ).to.changeAST( grammar, constsDetails(
                [ "\"a\"" ],
                [],
                [ "peg$literalExpectation(\"a\", false)" ],
                []
            ) );

        } );

    } );

    describe( "for group", function () {

        const grammar = "start = ('a')";

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                23, 0, 18, 0, 2, 1, 22, 0, 3   // <expression>
            ] ) );

        } );

        it( "defines correct constants", function () {

            expect( pass ).to.changeAST( grammar, constsDetails(
                [ "\"a\"" ],
                [],
                [ "peg$literalExpectation(\"a\", false)" ],
                []
            ) );

        } );

    } );

    describe( "for semantic_and", function () {

        describe( "without labels", function () {

            const grammar = "start = &{ code }";

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                    25,            // UPDATE_SAVED_POS
                    26, 0, 0, 0,   // CALL <0>
                    13, 2, 2,      // IF
                    6,             //   * POP
                    1,             //     PUSH_UNDEFINED
                    6,             //   * POP
                    3              //     PUSH_FAILED
                ] ) );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST(
                    grammar,
                    constsDetails( [], [], [], [ { predicate: true, params: [], body: " code " } ] )
                );

            } );

        } );

        describe( "with labels", function () {

            const grammar = "start = a:'a' b:'b' c:'c' &{ code }";

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                    5,                            // PUSH_CURR_POS
                    23, 0, 18, 0, 2, 1, 22, 0, 3, // <elements[0]>
                    15, 57, 3,                    // IF_NOT_ERROR
                    23, 1, 18, 1, 2, 1, 22, 1, 3, //   * <elements[1]>
                    15, 41, 4,                    //     IF_NOT_ERROR
                    23, 2, 18, 2, 2, 1, 22, 2, 3, //       * <elements[2]>
                    15, 25, 4,                    //         IF_NOT_ERROR
                    25,                           //           * UPDATE_SAVED_POS
                    26, 0, 0, 3, 2, 1, 0,         //             CALL <0>
                    13, 2, 2,                     //             IF
                    6,                            //               * POP
                    1,                            //                 PUSH_UNDEFINED
                    6,                            //               * POP
                    3,                            //                 PUSH_FAILED
                    15, 3, 4,                     //             IF_NOT_ERROR
                    11, 4,                        //               * WRAP
                    9,                            //                 NIP
                    8, 4,                         //               * POP_N
                    7,                            //                 POP_CURR_POS
                    3,                            //                 PUSH_FAILED
                    8, 3,                         //           * POP_N
                    7,                            //             POP_CURR_POS
                    3,                            //             PUSH_FAILED
                    8, 2,                         //       * POP_N
                    7,                            //         POP_CURR_POS
                    3,                            //         PUSH_FAILED
                    6,                            //   * POP
                    7,                            //     POP_CURR_POS
                    3                             //     PUSH_FAILED
                ] ) );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST( grammar, constsDetails(
                    [ "\"a\"", "\"b\"", "\"c\"" ],
                    [],
                    [
                        "peg$literalExpectation(\"a\", false)",
                        "peg$literalExpectation(\"b\", false)",
                        "peg$literalExpectation(\"c\", false)"
                    ],
                    [ { predicate: true, params: [ "a", "b", "c" ], body: " code " } ]
                ) );

            } );

        } );

    } );

    describe( "for semantic_not", function () {

        describe( "without labels", function () {

            const grammar = "start = !{ code }";

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                    25,            // UPDATE_SAVED_POS
                    26, 0, 0, 0,   // CALL <0>
                    13, 2, 2,      // IF
                    6,             //   * POP
                    3,             //     PUSH_FAILED
                    6,             //   * POP
                    1              //     PUSH_UNDEFINED
                ] ) );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST(
                    grammar,
                    constsDetails( [], [], [], [ { predicate: true, params: [], body: " code " } ] )
                );

            } );

        } );

        describe( "with labels", function () {

            const grammar = "start = a:'a' b:'b' c:'c' !{ code }";

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                    5,                            // PUSH_CURR_POS
                    23, 0, 18, 0, 2, 1, 22, 0, 3, // <elements[0]>
                    15, 57, 3,                    // IF_NOT_ERROR
                    23, 1, 18, 1, 2, 1, 22, 1, 3, //   * <elements[1]>
                    15, 41, 4,                    //     IF_NOT_ERROR
                    23, 2, 18, 2, 2, 1, 22, 2, 3, //       * <elements[2]>
                    15, 25, 4,                    //         IF_NOT_ERROR
                    25,                           //           * UPDATE_SAVED_POS
                    26, 0, 0, 3, 2, 1, 0,         //             CALL <0>
                    13, 2, 2,                     //             IF
                    6,                            //               * POP
                    3,                            //                 PUSH_FAILED
                    6,                            //               * POP
                    1,                            //                 PUSH_UNDEFINED
                    15, 3, 4,                     //             IF_NOT_ERROR
                    11, 4,                        //               * WRAP
                    9,                            //                 NIP
                    8, 4,                         //               * POP_N
                    7,                            //                 POP_CURR_POS
                    3,                            //                 PUSH_FAILED
                    8, 3,                         //           * POP_N
                    7,                            //             POP_CURR_POS
                    3,                            //             PUSH_FAILED
                    8, 2,                         //       * POP_N
                    7,                            //         POP_CURR_POS
                    3,                            //         PUSH_FAILED
                    6,                            //   * POP
                    7,                            //     POP_CURR_POS
                    3                             //     PUSH_FAILED
                ] ) );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST( grammar, constsDetails(
                    [ "\"a\"", "\"b\"", "\"c\"" ],
                    [],
                    [
                        "peg$literalExpectation(\"a\", false)",
                        "peg$literalExpectation(\"b\", false)",
                        "peg$literalExpectation(\"c\", false)"
                    ],
                    [ { predicate: true, params: [ "a", "b", "c" ], body: " code " } ]
                ) );

            } );

        } );

    } );

    describe( "for rule_ref", function () {

        it( "generates correct bytecode", function () {

            expect( pass ).to.changeAST( [
                "start = other",
                "other = 'other'"
            ].join( "\n" ), {
                rules: [
                    {
                        bytecode: [ 27, 1 ]   // RULE
                    },
                    { }
                ]
            } );

        } );

    } );

    describe( "for literal", function () {

        describe( "when |reportFailures=true|", function () {

            describe( "empty", function () {

                const grammar = "start = ''";

                it( "generates correct bytecode", function () {

                    expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                        0, 0   // PUSH
                    ] ) );

                } );

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( grammar, constsDetails( [ "\"\"" ], [], [], [] ) );

                } );

            } );

            describe( "non-empty case-sensitive", function () {

                const grammar = "start = 'a'";

                it( "generates correct bytecode", function () {

                    expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                        23, 0,         // EXPECT <0>
                        18, 0, 2, 1,   // MATCH_STRING <0>
                        22, 0,         //   * ACCEPT_STRING <0>
                        3              //   * PUSH_FAILED
                    ] ) );

                } );

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( grammar, constsDetails(
                        [ "\"a\"" ],
                        [],
                        [ "peg$literalExpectation(\"a\", false)" ],
                        []
                    ) );

                } );

            } );

            describe( "non-empty case-insensitive", function () {

                const grammar = "start = 'A'i";

                it( "generates correct bytecode", function () {

                    expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                        23, 0,         // EXPECT <0>
                        19, 0, 2, 1,   // MATCH_STRING_IC <0>
                        21, 1,         //   * ACCEPT_N <1>
                        3              //   * PUSH_FAILED
                    ] ) );

                } );

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( grammar, constsDetails(
                        [ "\"a\"" ],
                        [],
                        [ "peg$literalExpectation(\"A\", true)" ],
                        []
                    ) );

                } );

            } );

        } );

        describe( "when |reportFailures=false|", function () {

            describe( "empty", function () {

                const grammar = "start = ''";

                it( "generates correct bytecode", function () {

                    expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                        0, 0   // PUSH
                    ] ), {}, { reportFailures: false } );

                } );

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( grammar, constsDetails( [ "\"\"" ], [], [], [] ), {}, { reportFailures: false } );

                } );

            } );

            describe( "non-empty case-sensitive", function () {

                const grammar = "start = 'a'";

                it( "generates correct bytecode", function () {

                    expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                        18, 0, 2, 1,   // MATCH_STRING <0>
                        22, 0,         //   * ACCEPT_STRING <0>
                        3              //   * PUSH_FAILED
                    ] ), {}, { reportFailures: false } );

                } );

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( grammar, constsDetails(
                        [ "\"a\"" ], [], [], []
                    ), {}, { reportFailures: false } );

                } );

            } );

            describe( "non-empty case-insensitive", function () {

                const grammar = "start = 'A'i";

                it( "generates correct bytecode", function () {

                    expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                        19, 0, 2, 1,   // MATCH_STRING_IC <0>
                        21, 1,         //   * ACCEPT_N <1>
                        3              //   * PUSH_FAILED
                    ] ), {}, { reportFailures: false } );

                } );

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( grammar, constsDetails(
                        [ "\"a\"" ], [], [], []
                    ), {}, { reportFailures: false } );

                } );

            } );

        } );

    } );

    describe( "for class", function () {

        describe( "when |reportFailures=true|", function () {

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( "start = [a]", bytecodeDetails( [
                    23, 0,         // EXPECT <0>
                    20, 0, 2, 1,   // MATCH_REGEXP <0>
                    21, 1,         //   * ACCEPT_N <1>
                    3              //   * PUSH_FAILED
                ] ) );

            } );

            describe( "non-inverted case-sensitive", function () {

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( "start = [a]", constsDetails(
                        [],
                        [ "/^[a]/" ],
                        [ "peg$classExpectation([\"a\"], false, false)" ],
                        []
                    ) );

                } );

            } );

            describe( "inverted case-sensitive", function () {

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( "start = [^a]", constsDetails(
                        [],
                        [ "/^[^a]/" ],
                        [ "peg$classExpectation([\"a\"], true, false)" ],
                        []
                    ) );

                } );

            } );

            describe( "non-inverted case-insensitive", function () {

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( "start = [a]i", constsDetails(
                        [],
                        [ "/^[a]/i" ],
                        [ "peg$classExpectation([\"a\"], false, true)" ],
                        []
                    ) );

                } );

            } );

            describe( "complex", function () {

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( "start = [ab-def-hij-l]", constsDetails(
                        [],
                        [ "/^[ab-def-hij-l]/" ],
                        [ "peg$classExpectation([\"a\", [\"b\", \"d\"], \"e\", [\"f\", \"h\"], \"i\", [\"j\", \"l\"]], false, false)" ],
                        []
                    ) );

                } );

            } );

        } );

        describe( "when |reportFailures=false|", function () {

            it( "generates correct bytecode", function () {

                expect( pass ).to.changeAST( "start = [a]", bytecodeDetails( [
                    20, 0, 2, 1,   // MATCH_REGEXP <0>
                    21, 1,         //   * ACCEPT_N <1>
                    3              //   * PUSH_FAILED
                ] ), {}, { reportFailures: false } );

            } );

            describe( "non-inverted case-sensitive", function () {

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( "start = [a]", constsDetails(
                        [], [ "/^[a]/" ], [], []
                    ), {}, { reportFailures: false } );

                } );

            } );

            describe( "inverted case-sensitive", function () {

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( "start = [^a]", constsDetails(
                        [], [ "/^[^a]/" ], [], []
                    ), {}, { reportFailures: false } );

                } );

            } );

            describe( "non-inverted case-insensitive", function () {

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( "start = [a]i", constsDetails(
                        [], [ "/^[a]/i" ], [], []
                    ), {}, { reportFailures: false } );

                } );

            } );

            describe( "complex", function () {

                it( "defines correct constants", function () {

                    expect( pass ).to.changeAST( "start = [ab-def-hij-l]", constsDetails(
                        [], [ "/^[ab-def-hij-l]/" ], [], []
                    ), {}, { reportFailures: false } );

                } );

            } );

        } );

    } );

    describe( "for any", function () {

        describe( "when |reportFailures=true|", function () {

            const grammar = "start = .";

            it( "generates bytecode", function () {

                expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                    23, 0,      // EXPECT <0>
                    17, 2, 1,   // MATCH_ANY
                    21, 1,      //   * ACCEPT_N <1>
                    3           //   * PUSH_FAILED
                ] ) );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST(
                    grammar,
                    constsDetails( [], [], [ "peg$anyExpectation()" ], [] )
                );

            } );

        } );

        describe( "when |reportFailures=false|", function () {

            const grammar = "start = .";

            it( "generates bytecode", function () {

                expect( pass ).to.changeAST( grammar, bytecodeDetails( [
                    17, 2, 1,   // MATCH_ANY
                    21, 1,      //   * ACCEPT_N <1>
                    3           //   * PUSH_FAILED
                ] ), {}, { reportFailures: false } );

            } );

            it( "defines correct constants", function () {

                expect( pass ).to.changeAST(
                    grammar,
                    constsDetails( [], [], [], [] ),
                    {},
                    { reportFailures: false }
                );

            } );

        } );

    } );

} );
