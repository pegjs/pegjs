/* eslint no-mixed-operators: 0, prefer-const: 0 */

"use strict";

const asts = require( "../asts" );
const js = require( "../js" );
const op = require( "../opcodes" );

// Generates parser JavaScript code.
function generateJS( ast, options ) {

    /* These only indent non-empty lines to avoid trailing whitespace. */
    const lineMatchRE = /^([^`\r\n]+?(?:`[^`]*?`[^\r\n]*?)?)$/gm;
    function indent2( code ) {

        return code.replace( lineMatchRE, "  $1" );

    }
    function indent10( code ) {

        return code.replace( lineMatchRE, "          $1" );

    }

    function generateTables() {

        if ( options.optimize === "size" ) {

            return [
                "var peg$consts = [",
                indent2( ast.consts.join( ",\n" ) ),
                "];",
                "",
                "var peg$bytecode = [",
                indent2( ast.rules
                    .map( rule =>
                        `peg$decode("${
                            js.stringEscape( rule.bytecode
                                .map( b => String.fromCharCode( b + 32 ) )
                                .join( "" )
                            )
                        }")`
                    )
                    .join( ",\n" )
                ),
                "];"
            ].join( "\n" );

        }

        return ast.consts.map( ( c, i ) => "var peg$c" + i + " = " + c + ";" ).join( "\n" );

    }

    function generateRuleHeader( ruleNameCode, ruleIndexCode ) {

        const parts = [];

        parts.push( "" );

        if ( options.trace ) {

            parts.push( [
                "peg$tracer.trace({",
                "  type: \"rule.enter\",",
                "  rule: " + ruleNameCode + ",",
                "  location: peg$computeLocation(startPos, startPos)",
                "});",
                ""
            ].join( "\n" ) );

        }

        if ( options.cache ) {

            parts.push( [
                "var key = peg$currPos * " + ast.rules.length + " + " + ruleIndexCode + ";",
                "var cached = peg$resultsCache[key];",
                "",
                "if (cached) {",
                "  peg$currPos = cached.nextPos;",
                ""
            ].join( "\n" ) );

            if ( options.trace ) {

                parts.push( [
                    "if (cached.result !== peg$FAILED) {",
                    "  peg$tracer.trace({",
                    "    type: \"rule.match\",",
                    "    rule: " + ruleNameCode + ",",
                    "    result: cached.result,",
                    "    location: peg$computeLocation(startPos, peg$currPos)",
                    "  });",
                    "} else {",
                    "  peg$tracer.trace({",
                    "    type: \"rule.fail\",",
                    "    rule: " + ruleNameCode + ",",
                    "    location: peg$computeLocation(startPos, startPos)",
                    "  });",
                    "}",
                    ""
                ].join( "\n" ) );

            }

            parts.push( [
                "  return cached.result;",
                "}",
                ""
            ].join( "\n" ) );

        }

        return parts.join( "\n" );

    }

    function generateRuleFooter( ruleNameCode, resultCode ) {

        const parts = [];

        if ( options.cache ) {

            parts.push( [
                "",
                "peg$resultsCache[key] = { nextPos: peg$currPos, result: " + resultCode + " };"
            ].join( "\n" ) );

        }

        if ( options.trace ) {

            parts.push( [
                "",
                "if (" + resultCode + " !== peg$FAILED) {",
                "  peg$tracer.trace({",
                "    type: \"rule.match\",",
                "    rule: " + ruleNameCode + ",",
                "    result: " + resultCode + ",",
                "    location: peg$computeLocation(startPos, peg$currPos)",
                "  });",
                "} else {",
                "  peg$tracer.trace({",
                "    type: \"rule.fail\",",
                "    rule: " + ruleNameCode + ",",
                "    location: peg$computeLocation(startPos, startPos)",
                "  });",
                "}"
            ].join( "\n" ) );

        }

        parts.push( [
            "",
            "return " + resultCode + ";"
        ].join( "\n" ) );

        return parts.join( "\n" );

    }

    function generateInterpreter() {

        const parts = [];

        function generateCondition( cond, argsLength ) {

            const baseLength = argsLength + 3;
            const thenLengthCode = "bc[ip + " + ( baseLength - 2 ) + "]";
            const elseLengthCode = "bc[ip + " + ( baseLength - 1 ) + "]";

            return [
                "ends.push(end);",
                "ips.push(ip + " + baseLength + " + " + thenLengthCode + " + " + elseLengthCode + ");",
                "",
                "if (" + cond + ") {",
                "  end = ip + " + baseLength + " + " + thenLengthCode + ";",
                "  ip += " + baseLength + ";",
                "} else {",
                "  end = ip + " + baseLength + " + " + thenLengthCode + " + " + elseLengthCode + ";",
                "  ip += " + baseLength + " + " + thenLengthCode + ";",
                "}",
                "",
                "break;"
            ].join( "\n" );

        }

        function generateLoop( cond ) {

            const baseLength = 2;
            const bodyLengthCode = "bc[ip + " + ( baseLength - 1 ) + "]";

            return [
                "if (" + cond + ") {",
                "  ends.push(end);",
                "  ips.push(ip);",
                "",
                "  end = ip + " + baseLength + " + " + bodyLengthCode + ";",
                "  ip += " + baseLength + ";",
                "} else {",
                "  ip += " + baseLength + " + " + bodyLengthCode + ";",
                "}",
                "",
                "break;"
            ].join( "\n" );

        }

        function generateCall() {

            const baseLength = 4;
            const paramsLengthCode = "bc[ip + " + ( baseLength - 1 ) + "]";

            return [
                "params = bc.slice(ip + " + baseLength + ", ip + " + baseLength + " + " + paramsLengthCode + ")",
                "  .map(function(p) { return stack[stack.length - 1 - p]; });",
                "",
                "stack.splice(",
                "  stack.length - bc[ip + 2],",
                "  bc[ip + 2],",
                "  peg$consts[bc[ip + 1]].apply(null, params)",
                ");",
                "",
                "ip += " + baseLength + " + " + paramsLengthCode + ";",
                "break;"
            ].join( "\n" );

        }

        parts.push( [
            "function peg$decode(s) {",
            "  return s.split(\"\").map(function(ch) { return ch.charCodeAt(0) - 32; });",
            "}",
            "",
            "function peg$parseRule(index) {"
        ].join( "\n" ) );

        if ( options.trace ) {

            parts.push( [
                "  var bc = peg$bytecode[index];",
                "  var ip = 0;",
                "  var ips = [];",
                "  var end = bc.length;",
                "  var ends = [];",
                "  var stack = [];",
                "  var startPos = peg$currPos;",
                "  var params;"
            ].join( "\n" ) );

        } else {

            parts.push( [
                "  var bc = peg$bytecode[index];",
                "  var ip = 0;",
                "  var ips = [];",
                "  var end = bc.length;",
                "  var ends = [];",
                "  var stack = [];",
                "  var params;"
            ].join( "\n" ) );

        }

        parts.push( indent2( generateRuleHeader( "peg$ruleNames[index]", "index" ) ) );

        parts.push( [
            // The point of the outer loop and the |ips| & |ends| stacks is to avoid
            // recursive calls for interpreting parts of bytecode. In other words, we
            // implement the |interpret| operation of the abstract machine without
            // function calls. Such calls would likely slow the parser down and more
            // importantly cause stack overflows for complex grammars.
            "  while (true) {",
            "    while (ip < end) {",
            "      switch (bc[ip]) {",
            "        case " + op.PUSH + ":",               // PUSH c
            "          stack.push(peg$consts[bc[ip + 1]]);",
            "          ip += 2;",
            "          break;",
            "",
            "        case " + op.PUSH_UNDEFINED + ":",     // PUSH_UNDEFINED
            "          stack.push(undefined);",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.PUSH_NULL + ":",          // PUSH_NULL
            "          stack.push(null);",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.PUSH_FAILED + ":",        // PUSH_FAILED
            "          stack.push(peg$FAILED);",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.PUSH_EMPTY_ARRAY + ":",   // PUSH_EMPTY_ARRAY
            "          stack.push([]);",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.PUSH_CURR_POS + ":",      // PUSH_CURR_POS
            "          stack.push(peg$currPos);",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.POP + ":",                // POP
            "          stack.pop();",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.POP_CURR_POS + ":",       // POP_CURR_POS
            "          peg$currPos = stack.pop();",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.POP_N + ":",              // POP_N n
            "          stack.length -= bc[ip + 1];",
            "          ip += 2;",
            "          break;",
            "",
            "        case " + op.NIP + ":",                // NIP
            "          stack.splice(-2, 1);",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.APPEND + ":",             // APPEND
            "          stack[stack.length - 2].push(stack.pop());",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.WRAP + ":",               // WRAP n
            "          stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));",
            "          ip += 2;",
            "          break;",
            "",
            "        case " + op.TEXT + ":",               // TEXT
            "          stack.push(input.substring(stack.pop(), peg$currPos));",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.IF + ":",                 // IF t, f
            indent10( generateCondition( "stack[stack.length - 1]", 0 ) ),
            "",
            "        case " + op.IF_ERROR + ":",           // IF_ERROR t, f
            indent10( generateCondition(
                "stack[stack.length - 1] === peg$FAILED",
                0
            ) ),
            "",
            "        case " + op.IF_NOT_ERROR + ":",       // IF_NOT_ERROR t, f
            indent10(
                generateCondition( "stack[stack.length - 1] !== peg$FAILED",
                    0
                ) ),
            "",
            "        case " + op.WHILE_NOT_ERROR + ":",    // WHILE_NOT_ERROR b
            indent10( generateLoop( "stack[stack.length - 1] !== peg$FAILED" ) ),
            "",
            "        case " + op.MATCH_ANY + ":",          // MATCH_ANY a, f, ...
            indent10( generateCondition( "input.length > peg$currPos", 0 ) ),
            "",
            "        case " + op.MATCH_STRING + ":",       // MATCH_STRING s, a, f, ...
            indent10( generateCondition(
                "input.substr(peg$currPos, peg$consts[bc[ip + 1]].length) === peg$consts[bc[ip + 1]]",
                1
            ) ),
            "",
            "        case " + op.MATCH_STRING_IC + ":",    // MATCH_STRING_IC s, a, f, ...
            indent10( generateCondition(
                "input.substr(peg$currPos, peg$consts[bc[ip + 1]].length).toLowerCase() === peg$consts[bc[ip + 1]]",
                1
            ) ),
            "",
            "        case " + op.MATCH_REGEXP + ":",       // MATCH_REGEXP r, a, f, ...
            indent10( generateCondition(
                "peg$consts[bc[ip + 1]].test(input.charAt(peg$currPos))",
                1
            ) ),
            "",
            "        case " + op.ACCEPT_N + ":",           // ACCEPT_N n
            "          stack.push(input.substr(peg$currPos, bc[ip + 1]));",
            "          peg$currPos += bc[ip + 1];",
            "          ip += 2;",
            "          break;",
            "",
            "        case " + op.ACCEPT_STRING + ":",      // ACCEPT_STRING s
            "          stack.push(peg$consts[bc[ip + 1]]);",
            "          peg$currPos += peg$consts[bc[ip + 1]].length;",
            "          ip += 2;",
            "          break;",
            "",
            "        case " + op.EXPECT + ":",             // EXPECT e
            "          if (peg$silentFails === 0) {",
            "            peg$expect(peg$consts[bc[ip + 1]]);",
            "          }",
            "          ip += 2;",
            "          break;",
            "",
            "        case " + op.LOAD_SAVED_POS + ":",     // LOAD_SAVED_POS p
            "          peg$savedPos = stack[stack.length - 1 - bc[ip + 1]];",
            "          ip += 2;",
            "          break;",
            "",
            "        case " + op.UPDATE_SAVED_POS + ":",   // UPDATE_SAVED_POS
            "          peg$savedPos = peg$currPos;",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.CALL + ":",               // CALL f, n, pc, p1, p2, ..., pN
            indent10( generateCall() ),
            "",
            "        case " + op.RULE + ":",               // RULE r
            "          stack.push(peg$parseRule(bc[ip + 1]));",
            "          ip += 2;",
            "          break;",
            "",
            "        case " + op.SILENT_FAILS_ON + ":",    // SILENT_FAILS_ON
            "          peg$silentFails++;",
            "          ip++;",
            "          break;",
            "",
            "        case " + op.SILENT_FAILS_OFF + ":",   // SILENT_FAILS_OFF
            "          peg$silentFails--;",
            "          ip++;",
            "          break;",
            "",
            "        // istanbul ignore next",
            "        default:",
            "          throw new Error(\"Invalid opcode: \" + bc[ip] + \".\");",
            "      }",
            "    }",
            "",
            "    if (ends.length > 0) {",
            "      end = ends.pop();",
            "      ip = ips.pop();",
            "    } else {",
            "      break;",
            "    }",
            "  }"
        ].join( "\n" ) );

        parts.push( indent2( generateRuleFooter( "peg$ruleNames[index]", "stack[0]" ) ) );
        parts.push( "}" );

        return parts.join( "\n" );

    }

    function generateRuleFunction( rule ) {

        const parts = [];
        const stackVars = [];

        function c( i ) {

            return "peg$c" + i;

        } // |consts[i]| of the abstract machine
        function s( i ) {

            return "s" + i;

        } // |stack[i]| of the abstract machine

        const stack = {
            sp: -1,
            maxSp: -1,

            push( exprCode ) {

                const code = s( ++this.sp ) + " = " + exprCode + ";";
                if ( this.sp > this.maxSp ) this.maxSp = this.sp;
                return code;

            },

            pop( n ) {

                if ( typeof n === "undefined" ) return s( this.sp-- );

                const values = Array( n );

                for ( let i = 0; i < n; i++ ) {

                    values[ i ] = s( this.sp - n + 1 + i );

                }

                this.sp -= n;
                return values;

            },

            top() {

                return s( this.sp );

            },

            index( i ) {

                return s( this.sp - i );

            }
        };

        function compile( bc ) {

            let ip = 0;
            const end = bc.length;
            const parts = [];
            let value;

            function compileCondition( cond, argCount ) {

                const baseLength = argCount + 3;
                const thenLength = bc[ ip + baseLength - 2 ];
                const elseLength = bc[ ip + baseLength - 1 ];
                const baseSp = stack.sp;
                let thenCode, elseCode, thenSp, elseSp;

                ip += baseLength;
                thenCode = compile( bc.slice( ip, ip + thenLength ) );
                thenSp = stack.sp;
                ip += thenLength;

                if ( elseLength > 0 ) {

                    stack.sp = baseSp;
                    elseCode = compile( bc.slice( ip, ip + elseLength ) );
                    elseSp = stack.sp;
                    ip += elseLength;

                    // istanbul ignore if
                    if ( thenSp !== elseSp ) {

                        throw new Error(
                            "Branches of a condition must move the stack pointer in the same way."
                        );

                    }

                }

                parts.push( "if (" + cond + ") {" );
                parts.push( indent2( thenCode ) );
                if ( elseLength > 0 ) {

                    parts.push( "} else {" );
                    parts.push( indent2( elseCode ) );

                }
                parts.push( "}" );

            }

            function compileLoop( cond ) {

                const baseLength = 2;
                const bodyLength = bc[ ip + baseLength - 1 ];
                const baseSp = stack.sp;
                let bodyCode, bodySp;

                ip += baseLength;
                bodyCode = compile( bc.slice( ip, ip + bodyLength ) );
                bodySp = stack.sp;
                ip += bodyLength;

                // istanbul ignore if
                if ( bodySp !== baseSp ) {

                    throw new Error( "Body of a loop can't move the stack pointer." );

                }

                parts.push( "while (" + cond + ") {" );
                parts.push( indent2( bodyCode ) );
                parts.push( "}" );

            }

            function compileCall() {

                const baseLength = 4;
                const paramsLength = bc[ ip + baseLength - 1 ];

                const value = c( bc[ ip + 1 ] )
                    + "("
                    + bc
                        .slice( ip + baseLength, ip + baseLength + paramsLength )
                        .map( p => stack.index( p ) )
                        .join( ", " )
                    + ")";

                stack.pop( bc[ ip + 2 ] );
                parts.push( stack.push( value ) );
                ip += baseLength + paramsLength;

            }

            while ( ip < end ) {

                switch ( bc[ ip ] ) {

                    case op.PUSH:               // PUSH c
                        parts.push( stack.push( c( bc[ ip + 1 ] ) ) );
                        ip += 2;
                        break;

                    case op.PUSH_CURR_POS:      // PUSH_CURR_POS
                        parts.push( stack.push( "peg$currPos" ) );
                        ip++;
                        break;

                    case op.PUSH_UNDEFINED:      // PUSH_UNDEFINED
                        parts.push( stack.push( "undefined" ) );
                        ip++;
                        break;

                    case op.PUSH_NULL:          // PUSH_NULL
                        parts.push( stack.push( "null" ) );
                        ip++;
                        break;

                    case op.PUSH_FAILED:        // PUSH_FAILED
                        parts.push( stack.push( "peg$FAILED" ) );
                        ip++;
                        break;

                    case op.PUSH_EMPTY_ARRAY:   // PUSH_EMPTY_ARRAY
                        parts.push( stack.push( "[]" ) );
                        ip++;
                        break;

                    case op.POP:                // POP
                        stack.pop();
                        ip++;
                        break;

                    case op.POP_CURR_POS:       // POP_CURR_POS
                        parts.push( "peg$currPos = " + stack.pop() + ";" );
                        ip++;
                        break;

                    case op.POP_N:              // POP_N n
                        stack.pop( bc[ ip + 1 ] );
                        ip += 2;
                        break;

                    case op.NIP:                // NIP
                        value = stack.pop();
                        stack.pop();
                        parts.push( stack.push( value ) );
                        ip++;
                        break;

                    case op.APPEND:             // APPEND
                        value = stack.pop();
                        parts.push( stack.top() + ".push(" + value + ");" );
                        ip++;
                        break;

                    case op.WRAP:               // WRAP n
                        parts.push(
                            stack.push( "[" + stack.pop( bc[ ip + 1 ] ).join( ", " ) + "]" )
                        );
                        ip += 2;
                        break;

                    case op.TEXT:               // TEXT
                        parts.push(
                            stack.push( "input.substring(" + stack.pop() + ", peg$currPos)" )
                        );
                        ip++;
                        break;

                    case op.IF:                 // IF t, f
                        compileCondition( stack.top(), 0 );
                        break;

                    case op.IF_ERROR:           // IF_ERROR t, f
                        compileCondition( stack.top() + " === peg$FAILED", 0 );
                        break;

                    case op.IF_NOT_ERROR:       // IF_NOT_ERROR t, f
                        compileCondition( stack.top() + " !== peg$FAILED", 0 );
                        break;

                    case op.WHILE_NOT_ERROR:    // WHILE_NOT_ERROR b
                        compileLoop( stack.top() + " !== peg$FAILED", 0 );
                        break;

                    case op.MATCH_ANY:          // MATCH_ANY a, f, ...
                        compileCondition( "input.length > peg$currPos", 0 );
                        break;

                    case op.MATCH_STRING:       // MATCH_STRING s, a, f, ...
                        compileCondition(
                            eval( ast.consts[ bc[ ip + 1 ] ] ).length > 1
                                ? "input.substr(peg$currPos, "
                                    + eval( ast.consts[ bc[ ip + 1 ] ] ).length
                                    + ") === "
                                    + c( bc[ ip + 1 ] )
                                : "input.charCodeAt(peg$currPos) === "
                                    + eval( ast.consts[ bc[ ip + 1 ] ] ).charCodeAt( 0 )
                            , 1
                        );
                        break;

                    case op.MATCH_STRING_IC:    // MATCH_STRING_IC s, a, f, ...
                        compileCondition(
                            "input.substr(peg$currPos, "
                                + eval( ast.consts[ bc[ ip + 1 ] ] ).length
                                + ").toLowerCase() === "
                                + c( bc[ ip + 1 ] )
                            , 1
                        );
                        break;

                    case op.MATCH_REGEXP:       // MATCH_REGEXP r, a, f, ...
                        compileCondition( c( bc[ ip + 1 ] ) + ".test(input.charAt(peg$currPos))", 1 );
                        break;

                    case op.ACCEPT_N:           // ACCEPT_N n
                        parts.push( stack.push(
                            bc[ ip + 1 ] > 1
                                ? "input.substr(peg$currPos, " + bc[ ip + 1 ] + ")"
                                : "input.charAt(peg$currPos)"
                        ) );
                        parts.push(
                            bc[ ip + 1 ] > 1
                                ? "peg$currPos += " + bc[ ip + 1 ] + ";"
                                : "peg$currPos++;"
                        );
                        ip += 2;
                        break;

                    case op.ACCEPT_STRING:      // ACCEPT_STRING s
                        parts.push( stack.push( c( bc[ ip + 1 ] ) ) );
                        parts.push(
                            eval( ast.consts[ bc[ ip + 1 ] ] ).length > 1
                                ? "peg$currPos += " + eval( ast.consts[ bc[ ip + 1 ] ] ).length + ";"
                                : "peg$currPos++;"
                        );
                        ip += 2;
                        break;

                    case op.EXPECT:             // EXPECT e
                        parts.push( "if (peg$silentFails === 0) { peg$expect(" + c( bc[ ip + 1 ] ) + "); }" );
                        ip += 2;
                        break;

                    case op.LOAD_SAVED_POS:     // LOAD_SAVED_POS p
                        parts.push( "peg$savedPos = " + stack.index( bc[ ip + 1 ] ) + ";" );
                        ip += 2;
                        break;

                    case op.UPDATE_SAVED_POS:   // UPDATE_SAVED_POS
                        parts.push( "peg$savedPos = peg$currPos;" );
                        ip++;
                        break;

                    case op.CALL:               // CALL f, n, pc, p1, p2, ..., pN
                        compileCall();
                        break;

                    case op.RULE:               // RULE r
                        parts.push( stack.push( "peg$parse" + ast.rules[ bc[ ip + 1 ] ].name + "()" ) );
                        ip += 2;
                        break;

                    case op.SILENT_FAILS_ON:    // SILENT_FAILS_ON
                        parts.push( "peg$silentFails++;" );
                        ip++;
                        break;

                    case op.SILENT_FAILS_OFF:   // SILENT_FAILS_OFF
                        parts.push( "peg$silentFails--;" );
                        ip++;
                        break;

                    // istanbul ignore next
                    default:
                        throw new Error( "Invalid opcode: " + bc[ ip ] + "." );

                }

            }

            return parts.join( "\n" );

        }

        const code = compile( rule.bytecode );

        parts.push( "function peg$parse" + rule.name + "() {" );

        if ( options.trace ) {

            parts.push( "  var startPos = peg$currPos;" );

        }

        for ( let i = 0; i <= stack.maxSp; i++ ) {

            stackVars[ i ] = s( i );

        }

        parts.push( "  var " + stackVars.join( ", " ) + ";" );

        parts.push( indent2( generateRuleHeader(
            "\"" + js.stringEscape( rule.name ) + "\"",
            asts.indexOfRule( ast, rule.name )
        ) ) );
        parts.push( indent2( code ) );
        parts.push( indent2( generateRuleFooter(
            "\"" + js.stringEscape( rule.name ) + "\"",
            s( 0 )
        ) ) );

        parts.push( "}" );

        return parts.join( "\n" );

    }

    function generateToplevel() {

        const parts = [];

        parts.push( [
            "function peg$subclass(child, parent) {",
            "  function C() { this.constructor = child; }",
            "  C.prototype = parent.prototype;",
            "  child.prototype = new C();",
            "}",
            "",
            "function peg$SyntaxError(message, expected, found, location) {",
            "  this.message = message;",
            "  this.expected = expected;",
            "  this.found = found;",
            "  this.location = location;",
            "  this.name = \"SyntaxError\";",
            "",
            "  // istanbul ignore next",
            "  if (typeof Error.captureStackTrace === \"function\") {",
            "    Error.captureStackTrace(this, peg$SyntaxError);",
            "  }",
            "}",
            "",
            "peg$subclass(peg$SyntaxError, Error);",
            "",
            "peg$SyntaxError.buildMessage = function(expected, found) {",
            "  var DESCRIBE_EXPECTATION_FNS = {",
            "    literal: function(expectation) {",
            "      return \"\\\"\" + literalEscape(expectation.text) + \"\\\"\";",
            "    },",
            "",
            "    class: function(expectation) {",
            "      var escapedParts = expectation.parts.map(function(part) {",
            "        return Array.isArray(part)",
            "          ? classEscape(part[0]) + \"-\" + classEscape(part[1])",
            "          : classEscape(part);",
            "      });",
            "",
            "      return \"[\" + (expectation.inverted ? \"^\" : \"\") + escapedParts + \"]\";",
            "    },",
            "",
            "    any: function() {",
            "      return \"any character\";",
            "    },",
            "",
            "    end: function() {",
            "      return \"end of input\";",
            "    },",
            "",
            "    other: function(expectation) {",
            "      return expectation.description;",
            "    }",
            "  };",
            "",
            "  function hex(ch) {",
            "    return ch.charCodeAt(0).toString(16).toUpperCase();",
            "  }",
            "",
            "  function literalEscape(s) {",
            "    return s",
            "      .replace(/\\\\/g, \"\\\\\\\\\")",   // backslash
            "      .replace(/\"/g,  \"\\\\\\\"\")",    // closing double quote
            "      .replace(/\\0/g, \"\\\\0\")",       // null
            "      .replace(/\\t/g, \"\\\\t\")",       // horizontal tab
            "      .replace(/\\n/g, \"\\\\n\")",       // line feed
            "      .replace(/\\r/g, \"\\\\r\")",       // carriage return
            "      .replace(/[\\x00-\\x0F]/g,          function(ch) { return \"\\\\x0\" + hex(ch); })",
            "      .replace(/[\\x10-\\x1F\\x7F-\\x9F]/g, function(ch) { return \"\\\\x\"  + hex(ch); });",
            "  }",
            "",
            "  function classEscape(s) {",
            "    return s",
            "      .replace(/\\\\/g, \"\\\\\\\\\")",   // backslash
            "      .replace(/\\]/g, \"\\\\]\")",       // closing bracket
            "      .replace(/\\^/g, \"\\\\^\")",       // caret
            "      .replace(/-/g,  \"\\\\-\")",        // dash
            "      .replace(/\\0/g, \"\\\\0\")",       // null
            "      .replace(/\\t/g, \"\\\\t\")",       // horizontal tab
            "      .replace(/\\n/g, \"\\\\n\")",       // line feed
            "      .replace(/\\r/g, \"\\\\r\")",       // carriage return
            "      .replace(/[\\x00-\\x0F]/g,          function(ch) { return \"\\\\x0\" + hex(ch); })",
            "      .replace(/[\\x10-\\x1F\\x7F-\\x9F]/g, function(ch) { return \"\\\\x\"  + hex(ch); });",
            "  }",
            "",
            "  function describeExpectation(expectation) {",
            "    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);",
            "  }",
            "",
            "  function describeExpected(expected) {",
            "    var descriptions = expected.map(describeExpectation);",
            "    var i, j;",
            "",
            "    descriptions.sort();",
            "",
            "    if (descriptions.length > 0) {",
            "      for (i = 1, j = 1; i < descriptions.length; i++) {",
            "        if (descriptions[i - 1] !== descriptions[i]) {",
            "          descriptions[j] = descriptions[i];",
            "          j++;",
            "        }",
            "      }",
            "      descriptions.length = j;",
            "    }",
            "",
            "    switch (descriptions.length) {",
            "      case 1:",
            "        return descriptions[0];",
            "",
            "      case 2:",
            "        return descriptions[0] + \" or \" + descriptions[1];",
            "",
            "      default:",
            "        return descriptions.slice(0, -1).join(\", \")",
            "          + \", or \"",
            "          + descriptions[descriptions.length - 1];",
            "    }",
            "  }",
            "",
            "  function describeFound(found) {",
            "    return found ? \"\\\"\" + literalEscape(found) + \"\\\"\" : \"end of input\";",
            "  }",
            "",
            "  return \"Expected \" + describeExpected(expected) + \" but \" + describeFound(found) + \" found.\";",
            "};",
            ""
        ].join( "\n" ) );

        if ( options.trace ) {

            parts.push( [
                "function peg$DefaultTracer() {",
                "  this.indentLevel = 0;",
                "}",
                "",
                "peg$DefaultTracer.prototype.trace = function(event) {",
                "  var that = this;",
                "",
                "  function log(event) {",
                "    function repeat(string, n) {",
                "       var result = \"\", i;",
                "",
                "       for (i = 0; i < n; i++) {",
                "         result += string;",
                "       }",
                "",
                "       return result;",
                "    }",
                "",
                "    function pad(string, length) {",
                "      return string + repeat(\" \", length - string.length);",
                "    }",
                "",
                "    if (typeof console === \"object\") {",   // IE 8-10
                "      console.log(",
                "        event.location.start.line + \":\" + event.location.start.column + \"-\"",
                "          + event.location.end.line + \":\" + event.location.end.column + \" \"",
                "          + pad(event.type, 10) + \" \"",
                "          + repeat(\"  \", that.indentLevel) + event.rule",
                "      );",
                "    }",
                "  }",
                "",
                "  switch (event.type) {",
                "    case \"rule.enter\":",
                "      log(event);",
                "      this.indentLevel++;",
                "      break;",
                "",
                "    case \"rule.match\":",
                "      this.indentLevel--;",
                "      log(event);",
                "      break;",
                "",
                "    case \"rule.fail\":",
                "      this.indentLevel--;",
                "      log(event);",
                "      break;",
                "",
                "    // istanbul ignore next",
                "    default:",
                "      throw new Error(\"Invalid event type: \" + event.type + \".\");",
                "  }",
                "};",
                ""
            ].join( "\n" ) );

        }

        parts.push( [
            "function peg$parse(input, options) {",
            "  options = options !== undefined ? options : {};",
            "",
            "  var peg$FAILED = {};",
            ""
        ].join( "\n" ) );

        if ( options.optimize === "size" ) {

            const startRuleIndices = "{ "
                + options.allowedStartRules
                    .map( r => r + ": " + asts.indexOfRule( ast, r ) )
                    .join( ", " )
                + " }";
            const startRuleIndex = asts.indexOfRule( ast, options.allowedStartRules[ 0 ] );

            parts.push( [
                "  var peg$startRuleIndices = " + startRuleIndices + ";",
                "  var peg$startRuleIndex = " + startRuleIndex + ";"
            ].join( "\n" ) );

        } else {

            const startRuleFunctions = "{ "
                + options.allowedStartRules
                    .map( r => r + ": peg$parse" + r )
                    .join( ", " )
                + " }";
            const startRuleFunction = "peg$parse" + options.allowedStartRules[ 0 ];

            parts.push( [
                "  var peg$startRuleFunctions = " + startRuleFunctions + ";",
                "  var peg$startRuleFunction = " + startRuleFunction + ";"
            ].join( "\n" ) );

        }

        parts.push( "" );

        parts.push( indent2( generateTables() ) );

        parts.push( [
            "",
            "  var peg$currPos = 0;",
            "  var peg$savedPos = 0;",
            "  var peg$posDetailsCache = [{ line: 1, column: 1 }];",
            "  var peg$maxFailPos = 0;",
            "  var peg$maxFailExpected = [];",
            "  var peg$silentFails = 0;",   // 0 = report failures, > 0 = silence failures
            ""
        ].join( "\n" ) );

        if ( options.cache ) {

            parts.push( [
                "  var peg$resultsCache = {};",
                ""
            ].join( "\n" ) );

        }

        if ( options.trace ) {

            if ( options.optimize === "size" ) {

                const ruleNames = "["
                    + ast.rules
                        .map( r => `"${ js.stringEscape( r.name ) }"` )
                        .join( ", " )
                    + "]";

                parts.push( [
                    "  var peg$ruleNames = " + ruleNames + ";",
                    ""
                ].join( "\n" ) );

            }

            parts.push( [
                "  var peg$tracer = \"tracer\" in options ? options.tracer : new peg$DefaultTracer();",
                ""
            ].join( "\n" ) );

        }

        parts.push( [
            "  var peg$result;",
            ""
        ].join( "\n" ) );

        if ( options.optimize === "size" ) {

            parts.push( [
                "  if (\"startRule\" in options) {",
                "    if (!(options.startRule in peg$startRuleIndices)) {",
                "      throw new Error(\"Can't start parsing from rule \\\"\" + options.startRule + \"\\\".\");",
                "    }",
                "",
                "    peg$startRuleIndex = peg$startRuleIndices[options.startRule];",
                "  }"
            ].join( "\n" ) );

        } else {

            parts.push( [
                "  if (\"startRule\" in options) {",
                "    if (!(options.startRule in peg$startRuleFunctions)) {",
                "      throw new Error(\"Can't start parsing from rule \\\"\" + options.startRule + \"\\\".\");",
                "    }",
                "",
                "    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];",
                "  }"
            ].join( "\n" ) );

        }

        parts.push( [
            "",
            "  function text() {",
            "    return input.substring(peg$savedPos, peg$currPos);",
            "  }",
            "",
            "  function offset() {",
            "    return peg$savedPos;",
            "  }",
            "",
            "  function range() {",
            "    return [peg$savedPos, peg$currPos];",
            "  }",
            "",
            "  function location() {",
            "    return peg$computeLocation(peg$savedPos, peg$currPos);",
            "  }",
            "",
            "  function expected(description, location) {",
            "    location = location !== undefined",
            "      ? location",
            "      : peg$computeLocation(peg$savedPos, peg$currPos);",
            "",
            "    throw peg$buildStructuredError(",
            "      [peg$otherExpectation(description)],",
            "      input.substring(peg$savedPos, peg$currPos),",
            "      location",
            "    );",
            "  }",
            "",
            "  function error(message, location) {",
            "    location = location !== undefined",
            "      ? location",
            "      : peg$computeLocation(peg$savedPos, peg$currPos);",
            "",
            "    throw peg$buildSimpleError(message, location);",
            "  }",
            "",
            "  function peg$literalExpectation(text, ignoreCase) {",
            "    return { type: \"literal\", text: text, ignoreCase: ignoreCase };",
            "  }",
            "",
            "  function peg$classExpectation(parts, inverted, ignoreCase) {",
            "    return { type: \"class\", parts: parts, inverted: inverted, ignoreCase: ignoreCase };",
            "  }",
            "",
            "  function peg$anyExpectation() {",
            "    return { type: \"any\" };",
            "  }",
            "",
            "  function peg$endExpectation() {",
            "    return { type: \"end\" };",
            "  }",
            "",
            "  function peg$otherExpectation(description) {",
            "    return { type: \"other\", description: description };",
            "  }",
            "",
            "  function peg$computePosDetails(pos) {",
            "    var details = peg$posDetailsCache[pos];",
            "    var p;",
            "",
            "    if (details) {",
            "      return details;",
            "    } else {",
            "      p = pos - 1;",
            "      while (!peg$posDetailsCache[p]) {",
            "        p--;",
            "      }",
            "",
            "      details = peg$posDetailsCache[p];",
            "      details = {",
            "        line: details.line,",
            "        column: details.column",
            "      };",
            "",
            "      while (p < pos) {",
            "        if (input.charCodeAt(p) === 10) {",
            "          details.line++;",
            "          details.column = 1;",
            "        } else {",
            "          details.column++;",
            "        }",
            "",
            "        p++;",
            "      }",
            "",
            "      peg$posDetailsCache[pos] = details;",
            "",
            "      return details;",
            "    }",
            "  }",
            "",
            "  function peg$computeLocation(startPos, endPos) {",
            "    var startPosDetails = peg$computePosDetails(startPos);",
            "    var endPosDetails = peg$computePosDetails(endPos);",
            "",
            "    return {",
            "      start: {",
            "        offset: startPos,",
            "        line: startPosDetails.line,",
            "        column: startPosDetails.column",
            "      },",
            "      end: {",
            "        offset: endPos,",
            "        line: endPosDetails.line,",
            "        column: endPosDetails.column",
            "      }",
            "    };",
            "  }",
            "",
            "  function peg$expect(expected) {",
            "    if (peg$currPos < peg$maxFailPos) { return; }",
            "",
            "    if (peg$currPos > peg$maxFailPos) {",
            "      peg$maxFailPos = peg$currPos;",
            "      peg$maxFailExpected = [];",
            "    }",
            "",
            "    peg$maxFailExpected.push(expected);",
            "  }",
            "",
            "  function peg$buildSimpleError(message, location) {",
            "    return new peg$SyntaxError(message, null, null, location);",
            "  }",
            "",
            "  function peg$buildStructuredError(expected, found, location) {",
            "    return new peg$SyntaxError(",
            "      peg$SyntaxError.buildMessage(expected, found),",
            "      expected,",
            "      found,",
            "      location",
            "    );",
            "  }",
            ""
        ].join( "\n" ) );

        if ( options.optimize === "size" ) {

            parts.push( indent2( generateInterpreter() ) );
            parts.push( "" );

        } else {

            ast.rules.forEach( rule => {

                parts.push( indent2( generateRuleFunction( rule ) ) );
                parts.push( "" );

            } );

        }

        if ( ast.initializer ) {

            parts.push( indent2( ast.initializer.code ) );
            parts.push( "" );

        }

        if ( options.optimize === "size" ) {

            parts.push( "  peg$result = peg$parseRule(peg$startRuleIndex);" );

        } else {

            parts.push( "  peg$result = peg$startRuleFunction();" );

        }

        parts.push( [
            "",
            "  if (peg$result !== peg$FAILED && peg$currPos === input.length) {",
            "    return peg$result;",
            "  } else {",
            "    if (peg$result !== peg$FAILED && peg$currPos < input.length) {",
            "      peg$expect(peg$endExpectation());",
            "    }",
            "",
            "    throw peg$buildStructuredError(",
            "      peg$maxFailExpected,",
            "      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,",
            "      peg$maxFailPos < input.length",
            "        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)",
            "        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)",
            "    );",
            "  }",
            "}"
        ].join( "\n" ) );

        return parts.join( "\n" );

    }

    function generateWrapper( toplevelCode ) {

        function generateHeaderComment() {

            let comment = "// Generated by PEG.js v0.11.0-dev, https://pegjs.org/";
            const header = options.header;

            if ( typeof header === "string" ) {

                comment += "\n\n" + header;

            } else if ( Array.isArray( header ) ) {

                comment += "\n\n";
                header.forEach( data => {

                    comment += "// " + data;

                } );

            }

            return comment;

        }

        function generateParserObject() {

            return options.trace
                ? [
                    "{",
                    "  SyntaxError: peg$SyntaxError,",
                    "  DefaultTracer: peg$DefaultTracer,",
                    "  parse: peg$parse",
                    "}"
                ].join( "\n" )
                : [
                    "{",
                    "  SyntaxError: peg$SyntaxError,",
                    "  parse: peg$parse",
                    "}"
                ].join( "\n" );

        }

        function generateParserExports() {

            return options.trace
                ? [
                    "{",
                    "  peg$SyntaxError as SyntaxError,",
                    "  peg$DefaultTracer as DefaultTracer,",
                    "  peg$parse as parse",
                    "}"
                ].join( "\n" )
                : [
                    "{",
                    "  peg$SyntaxError as SyntaxError,",
                    "  peg$parse as parse",
                    "}"
                ].join( "\n" );

        }

        const generators = {
            bare() {

                return [
                    generateHeaderComment(),
                    "(function() {",
                    "  \"use strict\";",
                    "",
                    indent2( toplevelCode ),
                    "",
                    indent2( "return " + generateParserObject() + ";" ),
                    "})()"
                ].join( "\n" );

            },

            commonjs() {

                const parts = [];
                const dependencyVars = Object.keys( options.dependencies );

                parts.push( [
                    generateHeaderComment(),
                    "",
                    "\"use strict\";",
                    ""
                ].join( "\n" ) );

                if ( dependencyVars.length > 0 ) {

                    dependencyVars.forEach( variable => {

                        parts.push( "var " + variable
                            + " = require(\""
                            + js.stringEscape( options.dependencies[ variable ] )
                            + "\");"
                        );

                    } );
                    parts.push( "" );

                }

                parts.push( [
                    toplevelCode,
                    "",
                    "module.exports = " + generateParserObject() + ";",
                    ""
                ].join( "\n" ) );

                return parts.join( "\n" );

            },

            es() {

                const parts = [];
                const dependencyVars = Object.keys( options.dependencies );

                parts.push(
                    generateHeaderComment(),
                    ""
                );

                if ( dependencyVars.length > 0 ) {

                    dependencyVars.forEach( variable => {

                        parts.push( "import " + variable
                            + " from \""
                            + js.stringEscape( options.dependencies[ variable ] )
                            + "\";"
                        );

                    } );
                    parts.push( "" );

                }

                parts.push(
                    toplevelCode,
                    "",
                    "export " + generateParserExports() + ";",
                    "",
                    "export default " + generateParserObject() + ";",
                    ""
                );

                return parts.join( "\n" );

            },

            amd() {

                const dependencyVars = Object.keys( options.dependencies );
                const dependencyIds = dependencyVars.map( v => options.dependencies[ v ] );
                const dependencies = "["
                    + dependencyIds
                        .map( id => `"${ js.stringEscape( id ) }"` )
                        .join( ", " )
                    + "]";
                const params = dependencyVars.join( ", " );

                return [
                    generateHeaderComment(),
                    "define(" + dependencies + ", function(" + params + ") {",
                    "  \"use strict\";",
                    "",
                    indent2( toplevelCode ),
                    "",
                    indent2( "return " + generateParserObject() + ";" ),
                    "});",
                    ""
                ].join( "\n" );

            },

            globals() {

                return [
                    generateHeaderComment(),
                    "(function(root) {",
                    "  \"use strict\";",
                    "",
                    indent2( toplevelCode ),
                    "",
                    indent2( "root." + options.exportVar + " = " + generateParserObject() + ";" ),
                    "})(this);",
                    ""
                ].join( "\n" );

            },

            umd() {

                const parts = [];
                const dependencyVars = Object.keys( options.dependencies );
                const dependencyIds = dependencyVars.map( v => options.dependencies[ v ] );
                const dependencies = "["
                    + dependencyIds
                        .map( id => `"${ js.stringEscape( id ) }"` )
                        .join( ", " )
                    + "]";
                const requires = dependencyIds
                    .map( id => `require("${ js.stringEscape( id ) }")` )
                    .join( ", " );
                const params = dependencyVars.join( ", " );

                parts.push( [
                    generateHeaderComment(),
                    "(function(root, factory) {",
                    "  if (typeof define === \"function\" && define.amd) {",
                    "    define(" + dependencies + ", factory);",
                    "  } else if (typeof module === \"object\" && module.exports) {",
                    "    module.exports = factory(" + requires + ");"
                ].join( "\n" ) );

                if ( options.exportVar !== null ) {

                    parts.push( [
                        "  } else {",
                        "    root." + options.exportVar + " = factory();"
                    ].join( "\n" ) );

                }

                parts.push( [
                    "  }",
                    "})(this, function(" + params + ") {",
                    "  \"use strict\";",
                    "",
                    indent2( toplevelCode ),
                    "",
                    indent2( "return " + generateParserObject() + ";" ),
                    "});",
                    ""
                ].join( "\n" ) );

                return parts.join( "\n" );

            }
        };

        return generators[ options.format ]();

    }

    ast.code = generateWrapper( generateToplevel() );

}

module.exports = generateJS;
