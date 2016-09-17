"use strict";

const asts = require( "../asts" );
const js = require( "../js" );
const op = require( "../opcodes" );
const visitor = require( "../visitor" );
const util = require( "../../util" );

// Generates bytecode.
//
// Instructions
// ============
//
// Stack Manipulation
// ------------------
//
//  [0] PUSH c
//
//        stack.push(literals[c]);
//
//  [1] PUSH_UNDEFINED
//
//        stack.push(undefined);
//
//  [2] PUSH_NULL
//
//        stack.push(null);
//
//  [3] PUSH_FAILED
//
//        stack.push(FAILED);
//
//  [4] PUSH_EMPTY_ARRAY
//
//        stack.push([]);
//
//  [5] PUSH_CURR_POS
//
//        stack.push(currPos);
//
//  [6] POP
//
//        stack.pop();
//
//  [7] POP_CURR_POS
//
//        currPos = stack.pop();
//
//  [8] POP_N n
//
//        stack.pop(n);
//
//  [9] NIP
//
//        value = stack.pop();
//        stack.pop();
//        stack.push(value);
//
// [10] APPEND
//
//        value = stack.pop();
//        array = stack.pop();
//        array.push(value);
//        stack.push(array);
//
// [11] WRAP n
//
//        stack.push(stack.pop(n));
//
// [12] TEXT
//
//        stack.push(input.substring(stack.pop(), currPos));
//
// Conditions and Loops
// --------------------
//
// [13] IF t, f
//
//        if (stack.top()) {
//          interpret(ip + 3, ip + 3 + t);
//        } else {
//          interpret(ip + 3 + t, ip + 3 + t + f);
//        }
//
// [14] IF_ERROR t, f
//
//        if (stack.top() === FAILED) {
//          interpret(ip + 3, ip + 3 + t);
//        } else {
//          interpret(ip + 3 + t, ip + 3 + t + f);
//        }
//
// [15] IF_NOT_ERROR t, f
//
//        if (stack.top() !== FAILED) {
//          interpret(ip + 3, ip + 3 + t);
//        } else {
//          interpret(ip + 3 + t, ip + 3 + t + f);
//        }
//
// [16] WHILE_NOT_ERROR b
//
//        while(stack.top() !== FAILED) {
//          interpret(ip + 2, ip + 2 + b);
//        }
//
// Matching
// --------
//
// [17] MATCH_ANY a, f, ...
//
//        if (input.length > currPos) {
//          interpret(ip + 3, ip + 3 + a);
//        } else {
//          interpret(ip + 3 + a, ip + 3 + a + f);
//        }
//
// [18] MATCH_STRING s, a, f, ...
//
//        if (input.substr(currPos, literals[s].length) === literals[s]) {
//          interpret(ip + 4, ip + 4 + a);
//        } else {
//          interpret(ip + 4 + a, ip + 4 + a + f);
//        }
//
// [19] MATCH_STRING_IC s, a, f, ...
//
//        if (input.substr(currPos, literals[s].length).toLowerCase() === literals[s]) {
//          interpret(ip + 4, ip + 4 + a);
//        } else {
//          interpret(ip + 4 + a, ip + 4 + a + f);
//        }
//
// [20] MATCH_REGEXP r, a, f, ...
//
//        if (classes[r].test(input.charAt(currPos))) {
//          interpret(ip + 4, ip + 4 + a);
//        } else {
//          interpret(ip + 4 + a, ip + 4 + a + f);
//        }
//
// [21] ACCEPT_N n
//
//        stack.push(input.substring(currPos, n));
//        currPos += n;
//
// [22] ACCEPT_STRING s
//
//        stack.push(literals[s]);
//        currPos += literals[s].length;
//
// [23] EXPECT e
//
//        expect(expectations[e]);
//
// Calls
// -----
//
// [24] LOAD_SAVED_POS p
//
//        savedPos = stack[p];
//
// [25] UPDATE_SAVED_POS
//
//        savedPos = currPos;
//
// [26] CALL f, n, pc, p1, p2, ..., pN
//
//        value = functions[f](stack[p1], ..., stack[pN]);
//        stack.pop(n);
//        stack.push(value);
//
// Rules
// -----
//
// [27] RULE r
//
//        stack.push(parseRule(r));
//
// Failure Reporting
// -----------------
//
// [28] SILENT_FAILS_ON
//
//        silentFails++;
//
// [29] SILENT_FAILS_OFF
//
//        silentFails--;
//
// [38] EXPECT_NS_BEGIN
//
//        expected.push({ pos: curPos, variants: [] });
//
// [39] EXPECT_NS_END invert
//
//        value = expected.pop();
//        if (value.pos === expected.top().pos) {
//          if (invert) {
//            value.variants.forEach(e => { e.not = !e.not; });
//          }
//          expected.top().variants.pushAll(value.variants);
//        }
function generateBytecode( ast ) {

    const literals = [];
    const classes = [];
    const expectations = [];
    const functions = [];
    let generate;

    function addLiteralConst( value ) {

        const index = literals.indexOf( value );
        return index === -1 ? literals.push( value ) - 1 : index;

    }

    function addClassConst( value ) {

        const index = classes.indexOf( value );
        return index === -1 ? classes.push( value ) - 1 : index;

    }

    function addExpectedConst( value ) {

        const index = expectations.indexOf( value );
        return index === -1 ? expectations.push( value ) - 1 : index;

    }

    function addFunctionConst( predicate, params, code ) {

        const func = { predicate: predicate, params: params, body: code };
        const pattern = JSON.stringify( func );
        const index = functions.findIndex( f => JSON.stringify( f ) === pattern );
        return index === -1 ? functions.push( func ) - 1 : index;

    }

    function buildSequence() {

        return Array.prototype.concat.apply( [], arguments );

    }

    function buildCondition( match, condCode, thenCode, elseCode ) {

        if ( match > 0 ) return thenCode;
        if ( match < 0 ) return elseCode;

        return condCode.concat(
            [ thenCode.length, elseCode.length ],
            thenCode,
            elseCode
        );

    }

    function buildLoop( condCode, bodyCode ) {

        return condCode.concat( [ bodyCode.length ], bodyCode );

    }

    function buildCall( functionIndex, delta, env, sp ) {

        const params = util.values( env, value => sp - value );
        return [ op.CALL, functionIndex, delta, params.length ].concat( params );

    }

    function buildSimplePredicate( expression, negative, context ) {

        const match = expression.match|0;
        return buildSequence(
            [ op.PUSH_CURR_POS ],
            [ op.EXPECT_NS_BEGIN ],
            generate( expression, {
                sp: context.sp + 1,
                env: util.clone( context.env ),
                action: null,
                reportFailures: context.reportFailures
            } ),
            [ op.EXPECT_NS_END, negative ? 1 : 0 ],
            buildCondition(
                negative ? -match : match,
                [ negative ? op.IF_ERROR : op.IF_NOT_ERROR ],
                buildSequence(
                    [ op.POP ],
                    [ negative ? op.POP : op.POP_CURR_POS ],
                    [ op.PUSH_UNDEFINED ]
                ),
                buildSequence(
                    [ op.POP ],
                    [ negative ? op.POP_CURR_POS : op.POP ],
                    [ op.PUSH_FAILED ]
                )
            )
        );

    }

    function buildSemanticPredicate( node, negative, context ) {

        const functionIndex = addFunctionConst( true, Object.keys( context.env ), node.code );

        return buildSequence(
            [ op.UPDATE_SAVED_POS ],
            buildCall( functionIndex, 0, context.env, context.sp ),
            buildCondition(
                node.match|0,
                [ op.IF ],
                buildSequence( [ op.POP ], negative ? [ op.PUSH_FAILED ] : [ op.PUSH_UNDEFINED ] ),
                buildSequence( [ op.POP ], negative ? [ op.PUSH_UNDEFINED ] : [ op.PUSH_FAILED ] )
            )
        );

    }

    function buildAppendLoop( expressionCode ) {

        return buildLoop(
            [ op.WHILE_NOT_ERROR ],
            buildSequence( [ op.APPEND ], expressionCode )
        );

    }

    generate = visitor.build( {
        grammar( node ) {

            node.rules.forEach( generate );
            node.literals = literals;
            node.classes = classes;
            node.expectations = expectations;
            node.functions = functions;

        },

        rule( node ) {

            node.bytecode = generate( node.expression, {
                sp: -1,                             // stack pointer
                env: { },                           // mapping of label names to stack positions
                action: null,                       // action nodes pass themselves to children here
                reportFailures: node.reportFailures // if `false`, suppress generation of EXPECT opcodes
            } );

        },

        named( node, context ) {

            // Do not generate unused constant, if no need it
            const nameIndex = context.reportFailures ? addExpectedConst(
                `peg$otherExpectation("${ js.stringEscape( node.name ) }")`
            ) : null;
            const expressionCode = generate( node.expression, {
                sp: context.sp,
                env: context.env,
                action: context.action,
                reportFailures: false
            } );

            // No need to disable report failures if it already disabled
            return context.reportFailures ? buildSequence(
                [ op.EXPECT, nameIndex ],
                [ op.SILENT_FAILS_ON ],
                expressionCode,
                [ op.SILENT_FAILS_OFF ]
            ) : expressionCode;

        },

        choice( node, context ) {

            function buildAlternativesCode( alternatives, context ) {

                return buildSequence(
                    generate( alternatives[ 0 ], {
                        sp: context.sp,
                        env: util.clone( context.env ),
                        action: null,
                        reportFailures: context.reportFailures
                    } ),
                    alternatives.length < 2
                        ? []
                        : buildCondition(
                            // If alternative always match no need generate code for next alternatives
                            -( alternatives[ 0 ].match|0 ),
                            [ op.IF_ERROR ],
                            buildSequence(
                                [ op.POP ],
                                buildAlternativesCode( alternatives.slice( 1 ), context )
                            ),
                            []
                        )
                );

            }

            return buildAlternativesCode( node.alternatives, context );

        },

        action( node, context ) {

            const env = util.clone( context.env );
            const emitCall = node.expression.type !== "sequence" || node.expression.elements.length === 0;
            const expressionCode = generate( node.expression, {
                sp: context.sp + ( emitCall ? 1 : 0 ),
                env: env,
                action: node,
                reportFailures: context.reportFailures
            } );
            const match = node.expression.match|0;
            const functionIndex = emitCall && match >= 0
                ? addFunctionConst( false, Object.keys( env ), node.code )
                : null;

            return emitCall === false
                ? expressionCode
                : buildSequence(
                    [ op.PUSH_CURR_POS ],
                    expressionCode,
                    buildCondition(
                        match,
                        [ op.IF_NOT_ERROR ],
                        buildSequence(
                            [ op.LOAD_SAVED_POS, 1 ],
                            buildCall( functionIndex, 1, env, context.sp + 2 )
                        ),
                        []
                    ),
                    [ op.NIP ]
                );

        },

        sequence( node, context ) {

            function buildElementsCode( elements, context ) {

                if ( elements.length > 0 ) {

                    const processedCount = node.elements.length - elements.slice( 1 ).length;

                    return buildSequence(
                        generate( elements[ 0 ], {
                            sp: context.sp,
                            env: context.env,
                            action: null,
                            reportFailures: context.reportFailures
                        } ),
                        buildCondition(
                            elements[ 0 ].match|0,
                            [ op.IF_NOT_ERROR ],
                            buildElementsCode( elements.slice( 1 ), {
                                sp: context.sp + 1,
                                env: context.env,
                                action: context.action,
                                reportFailures: context.reportFailures
                            } ),
                            buildSequence(
                                processedCount > 1 ? [ op.POP_N, processedCount ] : [ op.POP ],
                                [ op.POP_CURR_POS ],
                                [ op.PUSH_FAILED ]
                            )
                        )
                    );

                } else if ( context.action ) {

                    const functionIndex = addFunctionConst(
                        false,
                        Object.keys( context.env ),
                        context.action.code
                    );

                    return buildSequence(
                        [ op.LOAD_SAVED_POS, node.elements.length ],
                        buildCall(
                            functionIndex,
                            node.elements.length + 1,
                            context.env,
                            context.sp
                        )
                    );

                }
                return buildSequence( [ op.WRAP, node.elements.length ], [ op.NIP ] );

            }

            return buildSequence(
                [ op.PUSH_CURR_POS ],
                buildElementsCode( node.elements, {
                    sp: context.sp + 1,
                    env: context.env,
                    action: context.action,
                    reportFailures: context.reportFailures
                } )
            );

        },

        labeled( node, context ) {

            const env = util.clone( context.env );

            context.env[ node.label ] = context.sp + 1;

            return generate( node.expression, {
                sp: context.sp,
                env: env,
                action: null,
                reportFailures: context.reportFailures
            } );

        },

        text( node, context ) {

            return buildSequence(
                [ op.PUSH_CURR_POS ],
                generate( node.expression, {
                    sp: context.sp + 1,
                    env: util.clone( context.env ),
                    action: null,
                    reportFailures: context.reportFailures
                } ),
                buildCondition(
                    node.expression.match|0,
                    [ op.IF_NOT_ERROR ],
                    buildSequence( [ op.POP ], [ op.TEXT ] ),
                    [ op.NIP ]
                )
            );

        },

        simple_and( node, context ) {

            return buildSimplePredicate( node.expression, false, context );

        },

        simple_not( node, context ) {

            return buildSimplePredicate( node.expression, true, context );

        },

        optional( node, context ) {

            return buildSequence(
                generate( node.expression, {
                    sp: context.sp,
                    env: util.clone( context.env ),
                    action: null,
                    reportFailures: context.reportFailures
                } ),
                buildCondition(
                    // If expression always match no need replace FAILED to NULL
                    -( node.expression.match|0 ),
                    [ op.IF_ERROR ],
                    buildSequence( [ op.POP ], [ op.PUSH_NULL ] ),
                    []
                )
            );

        },

        zero_or_more( node, context ) {

            const expressionCode = generate( node.expression, {
                sp: context.sp + 1,
                env: util.clone( context.env ),
                action: null,
                reportFailures: context.reportFailures
            } );

            return buildSequence(
                [ op.PUSH_EMPTY_ARRAY ],
                expressionCode,
                buildAppendLoop( expressionCode ),
                [ op.POP ]
            );

        },

        one_or_more( node, context ) {

            const expressionCode = generate( node.expression, {
                sp: context.sp + 1,
                env: util.clone( context.env ),
                action: null,
                reportFailures: context.reportFailures
            } );

            return buildSequence(
                [ op.PUSH_EMPTY_ARRAY ],
                expressionCode,
                buildCondition(
                    node.expression.match|0,
                    [ op.IF_NOT_ERROR ],
                    buildSequence( buildAppendLoop( expressionCode ), [ op.POP ] ),
                    buildSequence( [ op.POP ], [ op.POP ], [ op.PUSH_FAILED ] )
                )
            );

        },

        group( node, context ) {

            return generate( node.expression, {
                sp: context.sp,
                env: util.clone( context.env ),
                action: null,
                reportFailures: context.reportFailures
            } );

        },

        semantic_and( node, context ) {

            return buildSemanticPredicate( node, false, context );

        },

        semantic_not( node, context ) {

            return buildSemanticPredicate( node, true, context );

        },

        rule_ref( node ) {

            return [ op.RULE, asts.indexOfRule( ast, node.name ) ];

        },

        literal( node, context ) {

            if ( node.value.length > 0 ) {

                const match = node.match|0;
                const needConst = match === 0 || ( match > 0 && ! node.ignoreCase );
                const stringIndex = needConst ? addLiteralConst( `"${ js.stringEscape(
                    node.ignoreCase ? node.value.toLowerCase() : node.value
                ) }"` ) : null;
                // Do not generate unused constant, if no need it
                const expectedIndex = context.reportFailures ? addExpectedConst(
                    "peg$literalExpectation("
                    + `"${ js.stringEscape( node.value ) }", `
                    + node.ignoreCase
                    + ")"
                ) : null;

                // For case-sensitive strings the value must match the beginning of the
                // remaining input exactly. As a result, we can use |ACCEPT_STRING| and
                // save one |substr| call that would be needed if we used |ACCEPT_N|.
                return buildSequence(
                    context.reportFailures ? [ op.EXPECT, expectedIndex ] : [],
                    buildCondition(
                        match,
                        node.ignoreCase
                            ? [ op.MATCH_STRING_IC, stringIndex ]
                            : [ op.MATCH_STRING, stringIndex ],
                        node.ignoreCase
                            ? [ op.ACCEPT_N, node.value.length ]
                            : [ op.ACCEPT_STRING, stringIndex ],
                        [ op.PUSH_FAILED ]
                    )
                );

            }

            const stringIndex = addLiteralConst( "\"\"" );
            return [ op.PUSH, stringIndex ];

        },

        class( node, context ) {

            const regexp = "/^["
                + ( node.inverted ? "^" : "" )
                + node.parts
                    .map( part =>
                        ( Array.isArray( part )
                        ? js.regexpClassEscape( part[ 0 ] )
                            + "-"
                            + js.regexpClassEscape( part[ 1 ] )
                        : js.regexpClassEscape( part ) )
                    )
                    .join( "" )
                + "]/"
                + ( node.ignoreCase ? "i" : "" );

            const parts = "["
                + node.parts
                    .map( part =>
                        ( Array.isArray( part )
                        ? `["${ js.stringEscape( part[ 0 ] ) }", "${ js.stringEscape( part[ 1 ] ) }"]`
                        : "\"" + js.stringEscape( part ) + "\"" )
                    )
                    .join( ", " )
                + "]";

            const match = node.match|0;
            const classIndex = match === 0 ? addClassConst( regexp ) : null;
            // Do not generate unused constant, if no need it
            const expectedIndex = context.reportFailures ? addExpectedConst(
                "peg$classExpectation("
                + parts + ", "
                + node.inverted + ", "
                + node.ignoreCase
                + ")"
            ) : null;

            return buildSequence(
                context.reportFailures ? [ op.EXPECT, expectedIndex ] : [],
                buildCondition(
                    match,
                    [ op.MATCH_REGEXP, classIndex ],
                    [ op.ACCEPT_N, 1 ],
                    [ op.PUSH_FAILED ]
                )
            );

        },

        any( node, context ) {

            // Do not generate unused constant, if no need it
            const expectedIndex = context.reportFailures
                ? addExpectedConst( "peg$anyExpectation()" )
                : null;

            return buildSequence(
                context.reportFailures ? [ op.EXPECT, expectedIndex ] : [],
                buildCondition(
                    node.match|0,
                    [ op.MATCH_ANY ],
                    [ op.ACCEPT_N, 1 ],
                    [ op.PUSH_FAILED ]
                )
            );

        }
    } );

    generate( ast );

}

module.exports = generateBytecode;
