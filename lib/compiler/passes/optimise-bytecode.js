"use strict";

var arrays = require("../../utils/arrays"),
    asts   = require("../asts"),
    op     = require("../opcodes"),
    js     = require("../js");

/* Generates parser JavaScript code. */
function optimiseBytecode(ast, options) {

  var varType = {
    UNKNOWN    : "Unknown",
    FAILED     : "Failed",
    NOT_FAILED : "Not_failed"
  };

  function optimiseRuleFunction(rule) {
    var stack = {
      types : [],
      push: function(exprCode) {
        if (/^null$/.test(exprCode)) {
          this.types.push(varType.NOT_FAILED);
        } else if (/^peg\$FAILED$/.test(exprCode)) {
          this.types.push(varType.FAILED);
        } else {
          this.types.push(varType.UNKNOWN);
        }
      },
      pop:  function() {
        if (arguments.length === 0) {
          return this.types.pop();
        } else {
          var n = arguments[0], types = [];
          while (n-- > 0)
          {
            types.push(this.types.pop());
          }
          return types;
        }
      },
      top: function() {
        return this.types.length - 1;
      },
      index: function(i) {
        return this.types.length - 1 - i;
      }
    };

    function compile(bc) {
      var ip = 0,
          end = bc.length,
          newbc = [],
          value;

      function pushToNewBC(item) {
        return newbc.push(item);
      }

      // This is the condition compilation function when we can work out
      // what the value of the condition will be.
      function compileConditionFail(cond, fail, argCount) {
        var baseLength = argCount + 3,
            thenLength = bc[ip + baseLength - 2],
            elseLength = bc[ip + baseLength - 1],
            baseIp     = ip,
            thenCode   = [],
            elseCode   = [],
            elideIf    = false,
            elideThen,
            elideElse;

        if (   (stack.types[cond] === varType.FAILED)
            || (stack.types[cond] === varType.NOT_FAILED)) {
          elideIf = true;
          elideElse = stack.types[cond] === (fail ? varType.FAILED : varType.NOT_FAILED);
          elideThen = !elideElse;
        }

        var elseTypes = stack.types.slice();
        ip += baseLength;

        // Fiddle the stack, since we now know in each branch what the
        // value of this stack position is, because that is tested by
        // the if.
        elseTypes[cond] = fail ? varType.NOT_FAILED : varType.FAILED;
        stack.types[cond] = fail ? varType.FAILED : varType.NOT_FAILED;

        thenCode = compile(bc.slice(ip, ip + thenLength));
        var thenTypes = stack.types.slice();
        ip += thenLength;

        if (elseLength > 0) {
          stack.types = elseTypes;
          elseCode = compile(bc.slice(ip, ip + elseLength));
          ip += elseLength;
          if (elseTypes.length !== thenTypes.length) {
            throw new Error(
              "Branches of a condition must move the stack pointer in the same way."
            );
          }
        }
        compareIfStacks(thenTypes, elseTypes);
        if (!elideIf) {
          emitIf(fail ? op.IF_ERROR : op.IF_NOT_ERROR, baseIp, argCount, thenCode, elseCode);
        } else {
          var emitCode;
          if (elideElse) {
            emitCode = thenCode;
          } else {
            emitCode = elseCode;
          }
          emitCode.every(pushToNewBC);
        }
      }

      // This is the condition compilation function when we cannot work out
      // what the value of the condition will be, and so we just emit the
      // original if statement, and compile the then and else branches.
      // These branches may change in size, and theoretically at least,
      // could even disappear.
      function compileCondition(cond, argCount) {
        var baseLength = argCount + 3,
            thenLength = bc[ip + baseLength - 2],
            elseLength = bc[ip + baseLength - 1],
            baseIp     = ip,
            thenCode,
            elseCode   = [];

        var elseTypes = stack.types.slice();
        ip += baseLength;
        thenCode = compile(bc.slice(ip, ip + thenLength));
        var thenTypes = stack.types.slice();
        ip += thenLength;

        if (elseLength > 0) {
          stack.types = elseTypes;
          elseCode = compile(bc.slice(ip, ip + elseLength));
          ip += elseLength;
          if (elseTypes.length !== thenTypes.length) {
            throw new Error(
              "Branches of a condition must move the stack pointer in the same way."
            );
          }
        }
        compareIfStacks(thenTypes, elseTypes);
        emitIf(cond, baseIp, argCount, thenCode, elseCode);
      }

      function compareIfStacks(thenTypes, elseTypes) {
        for (var i = 0; i < elseTypes.length; i++) {
          if (elseTypes[i] !== thenTypes[i]) {
            stack.types[i] = varType.UNKNOWN;
          } else {
            stack.types[i] = elseTypes[i];
          }
        }
      }

      function emitIf(cond, baseIp, argCount, thenCode, elseCode) {
        newbc.push(cond);
        for (var i = 0; i < argCount; i++) {
          newbc.push(bc[i + baseIp + 1]);
        }
        newbc.push(thenCode.length);
        newbc.push(elseCode.length);
        thenCode.every(pushToNewBC);
        elseCode.every(pushToNewBC);
      }

      function compileLoop(cond) {
        var baseLength = 2,
            bodyLength = bc[ip + baseLength - 1],
            baseSp     = stack.types.length,
            bodyCode, bodySp;

        ip += baseLength;
        bodyCode = compile(bc.slice(ip, ip + bodyLength));
        ip += bodyLength;

        if (baseSp !== stack.types.length) {
          throw new Error("Body of a loop can't move the stack pointer.");
        }

        pushToNewBC(op.WHILE_NOT_ERROR);
        pushToNewBC(bodyCode.length);
        bodyCode.every(pushToNewBC);
      }

      function compileCall() {
        var baseLength   = 4,
            paramsLength = bc[ip + baseLength - 1],
            end = ip + baseLength + paramsLength;

        var value = 'call';
        // var value = c(bc[ip + 1]) + '('
        //       + arrays.map(
        //           bc.slice(ip + baseLength, ip + baseLength + paramsLength),
        //           function(p) { return stack.index(p); }
        //         ).join(', ')
        //       + ')';
        stack.pop(bc[ip + 2]);
        stack.push(value);
        while (ip < end) {
          newbc.push(bc[ip++]);
        }
      }

      while (ip < end) {
        switch (bc[ip]) {
          case op.PUSH:               // PUSH c
            stack.push('methodCall');
            newbc.push(bc[ip++]);
            newbc.push(bc[ip++]);
            break;

          case op.PUSH_CURR_POS:      // PUSH_CURR_POS
            stack.push('peg$currPos');
            newbc.push(bc[ip++]);
            break;

          case op.PUSH_UNDEFINED:      // PUSH_UNDEFINED
            stack.push('void 0');
            newbc.push(bc[ip++]);
            break;

          case op.PUSH_NULL:          // PUSH_NULL
            stack.push('null');
            newbc.push(bc[ip++]);
            break;

          case op.PUSH_FAILED:        // PUSH_FAILED
            stack.push('peg$FAILED');
            newbc.push(bc[ip++]);
            break;

          case op.PUSH_EMPTY_ARRAY:   // PUSH_EMPTY_ARRAY
            stack.push('[]');
            newbc.push(bc[ip++]);
            break;

          case op.POP:                // POP
            stack.pop();
            newbc.push(bc[ip++]);
            break;

          case op.POP_CURR_POS:       // POP_CURR_POS
            stack.pop();
            newbc.push(bc[ip++]);
            break;

          case op.POP_N:              // POP_N n
            stack.pop(bc[ip + 1]);
            newbc.push(bc[ip++]);
            newbc.push(bc[ip++]);
            break;

          case op.NIP:                // NIP
            value = stack.pop();
            stack.pop();
            stack.push(value);
            newbc.push(bc[ip++]);
            break;

          case op.APPEND:             // APPEND
            value = stack.pop();
            newbc.push(bc[ip++]);
            break;

          case op.WRAP:               // WRAP n
            stack.push('[' + stack.pop(bc[ip + 1]).join(', ') + ']');
            newbc.push(bc[ip++]);
            newbc.push(bc[ip++]);
            break;

          case op.TEXT:               // TEXT
            stack.push('input.substring(' + stack.pop() + ', peg$currPos)');
            newbc.push(bc[ip++]);
            break;

          case op.IF:                 // IF t, f
            compileCondition(op.IF, 0);
            break;

          case op.IF_ERROR:           // IF_ERROR t, f
            compileConditionFail(stack.top(), true, 0);
            break;

          case op.IF_NOT_ERROR:       // IF_NOT_ERROR t, f
            compileConditionFail(stack.top(), false, 0);
            break;

          case op.WHILE_NOT_ERROR:    // WHILE_NOT_ERROR b
            compileLoop(stack.top() + ' !== peg$FAILED', 0);
            break;

          case op.MATCH_ANY:          // MATCH_ANY a, f, ...
            compileCondition(op.MATCH_ANY, 0);
            break;

          case op.MATCH_STRING:       // MATCH_STRING s, a, f, ...
            compileCondition(op.MATCH_STRING, 1);
            break;

          case op.MATCH_STRING_IC:    // MATCH_STRING_IC s, a, f, ...
            compileCondition(op.MATCH_STRING_IC, 1);
            break;

          case op.MATCH_REGEXP:       // MATCH_REGEXP r, a, f, ...
            compileCondition(op.MATCH_REGEXP, 1);
            break;

          case op.ACCEPT_N:           // ACCEPT_N n
            stack.push(
              bc[ip + 1] > 1
                ? 'input.substr(peg$currPos, ' + bc[ip + 1] + ')'
                : 'input.charAt(peg$currPos)'
            );
            newbc.push(bc[ip++]);
            newbc.push(bc[ip++]);
            break;

          case op.ACCEPT_STRING:      // ACCEPT_STRING s
            stack.push("c" + (bc[ip + 1]));
            newbc.push(bc[ip++]);
            newbc.push(bc[ip++]);
            break;

          case op.FAIL:               // FAIL e
            stack.push('peg$FAILED');
            newbc.push(bc[ip++]);
            newbc.push(bc[ip++]);
            break;

          case op.CALL:               // CALL f, n, pc, p1, p2, ..., pN
            compileCall();
            break;

          case op.RULE:               // RULE r
            stack.push("peg$parse" + ast.rules[bc[ip + 1]].name + "()");
            newbc.push(bc[ip++]);
            newbc.push(bc[ip++]);
            break;

          case op.LOAD_SAVED_POS:     // LOAD_SAVED_POS p
            newbc.push(bc[ip++]);
            newbc.push(bc[ip++]);
            break;

          case op.UPDATE_SAVED_POS:   // UPDATE_SAVED_POS
          case op.SILENT_FAILS_ON:    // SILENT_FAILS_ON
          case op.SILENT_FAILS_OFF:   // SILENT_FAILS_OFF
            newbc.push(bc[ip++]);
            break;

          default:
            throw new Error("Invalid opcode: " + bc[ip] + ".");
          }
        }
        return newbc;
      }

      rule.bytecode = compile(rule.bytecode);

    }

  arrays.each(ast.rules, function(rule) {
    optimiseRuleFunction(rule);
  });
}

module.exports = optimiseBytecode;
