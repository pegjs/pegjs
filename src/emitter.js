/* Emits the generated code for the AST. */
PEG.compiler.emitter = function(ast) {
  var Codie = (function(undefined) {
    function stringEscape(s) {
      function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

      /*
       * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
       * string literal except for the closing quote character, backslash,
       * carriage return, line separator, paragraph separator, and line feed.
       * Any character may appear in the form of an escape sequence.
       *
       * For portability, we also escape escape all control and non-ASCII
       * characters. Note that "\0" and "\v" escape sequences are not used
       * because JSHint does not like the first and IE the second.
       */
      return s
       .replace(/\\/g,   '\\\\') // backslash
       .replace(/"/g,    '\\"')  // closing double quote
       .replace(/\x08/g, '\\b')  // backspace
       .replace(/\t/g,   '\\t')  // horizontal tab
       .replace(/\n/g,   '\\n')  // line feed
       .replace(/\f/g,   '\\f')  // form feed
       .replace(/\r/g,   '\\r')  // carriage return
       .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
       .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
       .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
       .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
    }

    function push(s) { return '__p.push(' + s + ');'; }

    function pushRaw(template, length, state) {
      function unindent(code, level, unindentFirst) {
        return code.replace(
          new RegExp('^.{' + level +'}', "gm"),
          function(str, offset) {
            if (offset === 0) {
              return unindentFirst ? '' : str;
            } else {
              return "";
            }
          }
        );
      }

      var escaped = stringEscape(unindent(
            template.substring(0, length),
            state.indentLevel(),
            state.atBOL
          ));

      return escaped.length > 0 ? push('"' + escaped + '"') : '';
    }

    var Codie = {
      /*
       * Specifies by how many characters do #if/#else and #for unindent their
       * content in the generated code.
       */
      indentStep: 2,

      /* Description of #-commands. Extend to define your own commands. */
      commands: {
        "if":   {
          params:  /^(.*)$/,
          compile: function(state, prefix, params) {
            return ['if(' + params[0] + '){', []];
          },
          stackOp: "push"
        },
        "else": {
          params:  /^$/,
          compile: function(state) {
            var stack = state.commandStack,
                insideElse = stack[stack.length - 1] === "else",
                insideIf   = stack[stack.length - 1] === "if";

            if (insideElse) { throw new Error("Multiple #elses."); }
            if (!insideIf)  { throw new Error("Using #else outside of #if."); }

            return ['}else{', []];
          },
          stackOp: "replace"
        },
        "for":  {
          params:  /^([a-zA-Z_][a-zA-Z0-9_]*)[ \t]+in[ \t]+(.*)$/,
          init:    function(state) {
            state.forCurrLevel = 0;  // current level of #for loop nesting
            state.forMaxLevel  = 0;  // maximum level of #for loop nesting
          },
          compile: function(state, prefix, params) {
            var c = '__c' + state.forCurrLevel, // __c for "collection"
                l = '__l' + state.forCurrLevel, // __l for "length"
                i = '__i' + state.forCurrLevel; // __i for "index"

            state.forCurrLevel++;
            if (state.forMaxLevel < state.forCurrLevel) {
              state.forMaxLevel = state.forCurrLevel;
            }

            return [
              c + '=' + params[1] + ';'
                +  l + '=' + c + '.length;'
                + 'for(' + i + '=0;' + i + '<' + l + ';' + i + '++){'
                +  params[0] + '=' + c + '[' + i + '];',
              [params[0], c, l, i]
            ];
          },
          exit:    function(state) { state.forCurrLevel--; },
          stackOp: "push"
        },
        "end":  {
          params:  /^$/,
          compile: function(state) {
            var stack = state.commandStack, exit;

            if (stack.length === 0) { throw new Error("Too many #ends."); }

            exit = Codie.commands[stack[stack.length - 1]].exit;
            if (exit) { exit(state); }

            return ['}', []];
          },
          stackOp: "pop"
        },
        "block": {
          params: /^(.*)$/,
          compile: function(state, prefix, params) {
            return [
              push('(' + params[0] + ').toString().replace(/^/gm, "'
                + stringEscape(prefix.substring(state.indentLevel()))
                + '") + "\\n"'),
              []
            ];
          },
          stackOp: "nop"
        }
      },

      /*
       * Compiles a template into a function. When called, this function will
       * execute the template in the context of an object passed in a parameter and
       * return the result.
       */
      template: function(template) {
        var stackOps = {
          push:    function(stack, name) { stack.push(name); },
          replace: function(stack, name) { stack[stack.length - 1] = name; },
          pop:     function(stack)       { stack.pop(); },
          nop:     function()            { }
        };

        function compileExpr(state, expr) {
          state.atBOL = false;
          return [push(expr), []];
        }

        function compileCommand(state, prefix, name, params) {
          var command, match, result;

          command = Codie.commands[name];
          if (!command) { throw new Error("Unknown command: #" + name + "."); }

          match = command.params.exec(params);
          if (match === null) {
            throw new Error(
              "Invalid params for command #" + name + ": " + params + "."
            );
          }

          result = command.compile(state, prefix, match.slice(1));
          stackOps[command.stackOp](state.commandStack, name);
          state.atBOL = true;
          return result;
        }

        var state = {               // compilation state
              commandStack: [],     //   stack of commands as they were nested
              atBOL:        true,   //   is the next character to process at BOL?
              indentLevel:  function() {
                return Codie.indentStep * this.commandStack.length;
              }
            },
            code = '',              // generated template function code
            vars = ['__p=[]'],      // variables used by generated code
            name, match, result, i;

        /* Initialize state. */
        for (name in Codie.commands) {
          if (Codie.commands[name].init) { Codie.commands[name].init(state); }
        }

        /* Compile the template. */
        while ((match = /^([ \t]*)#([a-zA-Z_][a-zA-Z0-9_]*)(?:[ \t]+([^ \t\n][^\n]*))?[ \t]*(?:\n|$)|#\{([^}]*)\}/m.exec(template)) !== null) {
          code += pushRaw(template, match.index, state);
          result = match[2] !== undefined && match[2] !== ""
            ? compileCommand(state, match[1], match[2], match[3] || "") // #-command
            : compileExpr(state, match[4]);                             // #{...}
          code += result[0];
          vars = vars.concat(result[1]);
          template = template.substring(match.index + match[0].length);
        }
        code += pushRaw(template, template.length, state);

        /* Check the final state. */
        if (state.commandStack.length > 0) { throw new Error("Missing #end."); }

        /* Sanitize the list of variables used by commands. */
        vars.sort();
        for (i = 0; i < vars.length; i++) {
          if (vars[i] === vars[i - 1]) { vars.splice(i--, 1); }
        }

        /* Create the resulting function. */
        return new Function("__v", [
          '__v=__v||{};',
          'var ' + vars.join(',') + ';',
          'with(__v){',
          code,
          'return __p.join("").replace(/^\\n+|\\n+$/g,"");};'
        ].join(''));
      }
    };

    return Codie;
  })();

  function formatCode() {
    var args = Array.prototype.slice.call(arguments);
    var vars = args[args.length - 1] instanceof Object ? args.pop() : {};

    vars.string = quote;

    return Codie.template(args.join('\n'))(vars);
  }

  function resultVar(index) { return "result" + index; }
  function posVar(index)    { return "pos"    + index; }

  var emit = buildNodeVisitor({
    grammar: function(node) {
      var initializerCode = node.initializer !== null
        ? emit(node.initializer)
        : "";
      var name;

      var parseFunctionTableItems = [];
      for (name in node.rules) {
        parseFunctionTableItems.push(quote(name) + ": parse_" + name);
      }
      parseFunctionTableItems.sort();

      var parseFunctionDefinitions = [];
      for (name in node.rules) {
        parseFunctionDefinitions.push(emit(node.rules[name]));
      }

      return formatCode(
        '(function(){',
        '  /* Generated by PEG.js @VERSION (http://pegjs.majda.cz/). */',
        '  ',
        '  var result = {',
        '    /*',
        '     * Parses the input with a generated parser. If the parsing is successfull,',
        '     * returns a value explicitly or implicitly specified by the grammar from',
        '     * which the parser was generated (see |PEG.buildParser|). If the parsing is',
        '     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.',
        '     */',
        '    parse: function(input, startRule) {',
        '      var parseFunctions = {',
        '        #block parseFunctionTableItems',
        '      };',
        '      ',
        '      if (startRule !== undefined) {',
        '        if (parseFunctions[startRule] === undefined) {',
        '          throw new Error("Invalid rule name: " + quote(startRule) + ".");',
        '        }',
        '      } else {',
        '        startRule = #{string(startRule)};',
        '      }',
        '      ',
        '      var pos = 0;',
        '      var reportFailures = 0;', // 0 = report, anything > 0 = do not report
        '      var rightmostFailuresPos = 0;',
        '      var rightmostFailuresExpected = [];',
        '      var cache = {};',
        '      ',
        /* This needs to be in sync with |padLeft| in utils.js. */
        '      function padLeft(input, padding, length) {',
        '        var result = input;',
        '        ',
        '        var padLength = length - input.length;',
        '        for (var i = 0; i < padLength; i++) {',
        '          result = padding + result;',
        '        }',
        '        ',
        '        return result;',
        '      }',
        '      ',
        /* This needs to be in sync with |escape| in utils.js. */
        '      function escape(ch) {',
        '        var charCode = ch.charCodeAt(0);',
        '        var escapeChar;',
        '        var length;',
        '        ',
        '        if (charCode <= 0xFF) {',
        '          escapeChar = \'x\';',
        '          length = 2;',
        '        } else {',
        '          escapeChar = \'u\';',
        '          length = 4;',
        '        }',
        '        ',
        '        return \'\\\\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), \'0\', length);',
        '      }',
        '      ',
        /* This needs to be in sync with |quote| in utils.js. */
        '      function quote(s) {',
        '        /*',
        '         * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a',
        '         * string literal except for the closing quote character, backslash,',
        '         * carriage return, line separator, paragraph separator, and line feed.',
        '         * Any character may appear in the form of an escape sequence.',
        '         *',
        '         * For portability, we also escape escape all control and non-ASCII',
        '         * characters. Note that "\\0" and "\\v" escape sequences are not used',
        '         * because JSHint does not like the first and IE the second.',
        '         */',
        '        return \'"\' + s',
        '          .replace(/\\\\/g, \'\\\\\\\\\')  // backslash',
        '          .replace(/"/g, \'\\\\"\')    // closing quote character',
        '          .replace(/\\x08/g, \'\\\\b\') // backspace',
        '          .replace(/\\t/g, \'\\\\t\')   // horizontal tab',
        '          .replace(/\\n/g, \'\\\\n\')   // line feed',
        '          .replace(/\\f/g, \'\\\\f\')   // form feed',
        '          .replace(/\\r/g, \'\\\\r\')   // carriage return',
        '          .replace(/[\\x00-\\x07\\x0B\\x0E-\\x1F\\x80-\\uFFFF]/g, escape)',
        '          + \'"\';',
        '      }',
        '      ',
        '      function matchFailed(failure) {',
        '        if (pos < rightmostFailuresPos) {',
        '          return;',
        '        }',
        '        ',
        '        if (pos > rightmostFailuresPos) {',
        '          rightmostFailuresPos = pos;',
        '          rightmostFailuresExpected = [];',
        '        }',
        '        ',
        '        rightmostFailuresExpected.push(failure);',
        '      }',
        '      ',
        '      #block parseFunctionDefinitions',
        '      ',
        '      function buildErrorMessage() {',
        '        function buildExpected(failuresExpected) {',
        '          failuresExpected.sort();',
        '          ',
        '          var lastFailure = null;',
        '          var failuresExpectedUnique = [];',
        '          for (var i = 0; i < failuresExpected.length; i++) {',
        '            if (failuresExpected[i] !== lastFailure) {',
        '              failuresExpectedUnique.push(failuresExpected[i]);',
        '              lastFailure = failuresExpected[i];',
        '            }',
        '          }',
        '          ',
        '          switch (failuresExpectedUnique.length) {',
        '            case 0:',
        '              return "end of input";',
        '            case 1:',
        '              return failuresExpectedUnique[0];',
        '            default:',
        '              return failuresExpectedUnique.slice(0, failuresExpectedUnique.length - 1).join(", ")',
        '                + " or "',
        '                + failuresExpectedUnique[failuresExpectedUnique.length - 1];',
        '          }',
        '        }',
        '        ',
        '        var expected = buildExpected(rightmostFailuresExpected);',
        '        var actualPos = Math.max(pos, rightmostFailuresPos);',
        '        var actual = actualPos < input.length',
        '          ? quote(input.charAt(actualPos))',
        '          : "end of input";',
        '        ',
        '        return "Expected " + expected + " but " + actual + " found.";',
        '      }',
        '      ',
        '      function computeErrorPosition() {',
        '        /*',
        '         * The first idea was to use |String.split| to break the input up to the',
        '         * error position along newlines and derive the line and column from',
        '         * there. However IE\'s |split| implementation is so broken that it was',
        '         * enough to prevent it.',
        '         */',
        '        ',
        '        var line = 1;',
        '        var column = 1;',
        '        var seenCR = false;',
        '        ',
        '        for (var i = 0; i <  rightmostFailuresPos; i++) {',
        '          var ch = input.charAt(i);',
        '          if (ch === "\\n") {',
        '            if (!seenCR) { line++; }',
        '            column = 1;',
        '            seenCR = false;',
        '          } else if (ch === "\\r" || ch === "\\u2028" || ch === "\\u2029") {',
        '            line++;',
        '            column = 1;',
        '            seenCR = true;',
        '          } else {',
        '            column++;',
        '            seenCR = false;',
        '          }',
        '        }',
        '        ',
        '        return { line: line, column: column };',
        '      }',
        '      ',
        '      #block initializerCode',
        '      ',
        '      var result = parseFunctions[startRule]();',
        '      ',
        '      /*',
        '       * The parser is now in one of the following three states:',
        '       *',
        '       * 1. The parser successfully parsed the whole input.',
        '       *',
        '       *    - |result !== null|',
        '       *    - |pos === input.length|',
        '       *    - |rightmostFailuresExpected| may or may not contain something',
        '       *',
        '       * 2. The parser successfully parsed only a part of the input.',
        '       *',
        '       *    - |result !== null|',
        '       *    - |pos < input.length|',
        '       *    - |rightmostFailuresExpected| may or may not contain something',
        '       *',
        '       * 3. The parser did not successfully parse any part of the input.',
        '       *',
        '       *   - |result === null|',
        '       *   - |pos === 0|',
        '       *   - |rightmostFailuresExpected| contains at least one failure',
        '       *',
        '       * All code following this comment (including called functions) must',
        '       * handle these states.',
        '       */',
        '      if (result === null || pos !== input.length) {',
        '        var errorPosition = computeErrorPosition();',
        '        throw new this.SyntaxError(',
        '          buildErrorMessage(),',
        '          errorPosition.line,',
        '          errorPosition.column',
        '        );',
        '      }',
        '      ',
        '      return result;',
        '    },',
        '    ',
        '    /* Returns the parser source code. */',
        '    toSource: function() { return this._source; }',
        '  };',
        '  ',
        '  /* Thrown when a parser encounters a syntax error. */',
        '  ',
        '  result.SyntaxError = function(message, line, column) {',
        '    this.name = "SyntaxError";',
        '    this.message = message;',
        '    this.line = line;',
        '    this.column = column;',
        '  };',
        '  ',
        '  result.SyntaxError.prototype = Error.prototype;',
        '  ',
        '  return result;',
        '})()',
        {
          initializerCode:          initializerCode,
          parseFunctionTableItems:  parseFunctionTableItems.join(',\n'),
          parseFunctionDefinitions: parseFunctionDefinitions.join('\n\n'),
          startRule:                node.startRule
        }
      );
    },

    initializer: function(node) {
      return node.code;
    },

    rule: function(node) {
      var context = {
        resultIndex: 0,
        posIndex:    0
      };

      var resultVars = map(range(node.resultStackDepth), resultVar);
      var posVars    = map(range(node.posStackDepth),    posVar);

      var resultVarsCode = resultVars.length > 0 ? 'var ' + resultVars.join(', ') + ';' : '';
      var posVarsCode    = posVars.length    > 0 ? 'var ' + posVars.join(', ')    + ';' : '';

      var setReportFailuresCode;
      var restoreReportFailuresCode;
      var reportFailureCode;

      if (node.displayName !== null) {
        setReportFailuresCode = formatCode(
          'reportFailures++;'
        );
        restoreReportFailuresCode = formatCode(
          'reportFailures--;'
        );
        reportFailureCode = formatCode(
          'if (reportFailures === 0 && #{resultVar} === null) {',
          '  matchFailed(#{string(displayName)});',
          '}',
          {
            displayName: node.displayName,
            resultVar:   resultVar(context.resultIndex)
          }
        );
      } else {
        setReportFailuresCode = "";
        restoreReportFailuresCode = "";
        reportFailureCode = "";
      }

      return formatCode(
        'function parse_#{name}() {',
        '  var cacheKey = "#{name}@" + pos;',
        '  var cachedResult = cache[cacheKey];',
        '  if (cachedResult) {',
        '    pos = cachedResult.nextPos;',
        '    return cachedResult.result;',
        '  }',
        '  ',
        '  #block resultVarsCode',
        '  #block posVarsCode',
        '  ',
        '  #block setReportFailuresCode',
        '  #block code',
        '  #block restoreReportFailuresCode',
        '  #block reportFailureCode',
        '  ',
        '  cache[cacheKey] = {',
        '    nextPos: pos,',
        '    result:  #{resultVar}',
        '  };',
        '  return #{resultVar};',
        '}',
        {
          name:                      node.name,
          resultVarsCode:            resultVarsCode,
          posVarsCode:               posVarsCode,
          setReportFailuresCode:     setReportFailuresCode,
          restoreReportFailuresCode: restoreReportFailuresCode,
          reportFailureCode:         reportFailureCode,
          code:                      emit(node.expression, context),
          resultVar:                 resultVar(context.resultIndex)
        }
      );
    },

    /*
     * The contract for all code fragments generated by the following functions
     * is as follows.
     *
     * The code fragment tries to match a part of the input starting with the
     * position indicated in |pos|. That position may point past the end of the
     * input.
     *
     * * If the code fragment matches the input, it advances |pos| to point to
     *   the first chracter following the matched part of the input and sets
     *   variable with a name computed by calling
     *   |resultVar(context.resultIndex)| to an appropriate value. This value is
     *   always non-|null|.
     *
     * * If the code fragment does not match the input, it returns with |pos|
     *   set to the original value and it sets a variable with a name computed
     *   by calling |resultVar(context.resultIndex)| to |null|.
     *
     * The code can use variables with names computed by calling
     *
     *   |resultVar(context.resultIndex + i)|
     *
     * and
     *
     *   |posVar(context.posIndex + i)|
     *
     * where |i| >= 1 to store necessary data (return values and positions). It
     * won't use any other variables.
     */

    choice: function(node, context) {
      var code, nextAlternativesCode;

      for (var i = node.alternatives.length - 1; i >= 0; i--) {
        nextAlternativesCode = i !== node.alternatives.length - 1
          ? formatCode(
              'if (#{resultVar} === null) {',
              '  #block code',
              '}',
              {
                code:      code,
                resultVar: resultVar(context.resultIndex)
              }
            )
          : '';
        code = formatCode(
          '#block currentAlternativeCode',
          '#block nextAlternativesCode',
          {
            currentAlternativeCode: emit(node.alternatives[i], context),
            nextAlternativesCode:   nextAlternativesCode
          }
        );
      }

      return code;
    },

    sequence: function(node, context) {
      var elementResultVars = map(node.elements, function(element, i) {
        return resultVar(context.resultIndex + i);
      });

      var code = formatCode(
        '#{resultVar} = #{elementResultVarArray};',
        {
          resultVar:             resultVar(context.resultIndex),
          elementResultVarArray: '[' + elementResultVars.join(', ') + ']'
        }
      );
      var elementContext;

      for (var i = node.elements.length - 1; i >= 0; i--) {
        elementContext = {
          resultIndex: context.resultIndex + i,
          posIndex:    context.posIndex + 1
        };
        code = formatCode(
          '#block elementCode',
          'if (#{elementResultVar} !== null) {',
          '  #block code',
          '} else {',
          '  #{resultVar} = null;',
          '  pos = #{posVar};',
          '}',
          {
            elementCode:      emit(node.elements[i], elementContext),
            elementResultVar: elementResultVars[i],
            code:             code,
            posVar:           posVar(context.posIndex),
            resultVar:        resultVar(context.resultIndex)
          }
        );
      }

      return formatCode(
        '#{posVar} = pos;',
        '#block code',
        {
          code:   code,
          posVar: posVar(context.posIndex)
        }
      );
    },

    labeled: function(node, context) {
      return emit(node.expression, context);
    },

    simple_and: function(node, context) {
      var expressionContext = {
        resultIndex: context.resultIndex,
        posIndex:    context.posIndex + 1
      };

      return formatCode(
        '#{posVar} = pos;',
        'reportFailures++;',
        '#block expressionCode',
        'reportFailures--;',
        'if (#{resultVar} !== null) {',
        '  #{resultVar} = "";',
        '  pos = #{posVar};',
        '} else {',
        '  #{resultVar} = null;',
        '}',
        {
          expressionCode: emit(node.expression, expressionContext),
          posVar:         posVar(context.posIndex),
          resultVar:      resultVar(context.resultIndex)
        }
      );
    },

    simple_not: function(node, context) {
      var expressionContext = {
        resultIndex: context.resultIndex,
        posIndex:    context.posIndex + 1
      };

      return formatCode(
        '#{posVar} = pos;',
        'reportFailures++;',
        '#block expressionCode',
        'reportFailures--;',
        'if (#{resultVar} === null) {',
        '  #{resultVar} = "";',
        '} else {',
        '  #{resultVar} = null;',
        '  pos = #{posVar};',
        '}',
        {
          expressionCode: emit(node.expression, expressionContext),
          posVar:         posVar(context.posIndex),
          resultVar:      resultVar(context.resultIndex)
        }
      );
    },

    semantic_and: function(node, context) {
      return formatCode(
        '#{resultVar} = (function() {#{actionCode}})() ? "" : null;',
        {
          actionCode: node.code,
          resultVar:  resultVar(context.resultIndex)
        }
      );
    },

    semantic_not: function(node, context) {
      return formatCode(
        '#{resultVar} = (function() {#{actionCode}})() ? null : "";',
        {
          actionCode: node.code,
          resultVar:  resultVar(context.resultIndex)
        }
      );
    },

    optional: function(node, context) {
      return formatCode(
        '#block expressionCode',
        '#{resultVar} = #{resultVar} !== null ? #{resultVar} : "";',
        {
          expressionCode: emit(node.expression, context),
          resultVar:      resultVar(context.resultIndex)
        }
      );
    },

    zero_or_more: function(node, context) {
      return formatCode(
        '#{resultVar} = [];',
        '#block expressionCode',
        'while (#{expressionResultVar} !== null) {',
        '  #{resultVar}.push(#{expressionResultVar});',
        '  #block expressionCode',
        '}',
        {
          expressionCode:      emit(node.expression, {
            resultIndex: context.resultIndex + 1,
            posIndex:    context.posIndex
          }),
          expressionResultVar: resultVar(context.resultIndex + 1),
          resultVar:           resultVar(context.resultIndex)
        }
      );
    },

    one_or_more: function(node, context) {
      return formatCode(
        '#block expressionCode',
        'if (#{expressionResultVar} !== null) {',
        '  #{resultVar} = [];',
        '  while (#{expressionResultVar} !== null) {',
        '    #{resultVar}.push(#{expressionResultVar});',
        '    #block expressionCode',
        '  }',
        '} else {',
        '  #{resultVar} = null;',
        '}',
        {
          expressionCode:      emit(node.expression, {
            resultIndex: context.resultIndex + 1,
            posIndex:    context.posIndex
          }),
          expressionResultVar: resultVar(context.resultIndex + 1),
          resultVar:           resultVar(context.resultIndex)
        }
      );
    },

    action: function(node, context) {
      /*
       * In case of sequences, we splat their elements into function arguments
       * one by one. Example:
       *
       *   start: a:"a" b:"b" c:"c" { alert(arguments.length) }  // => 3
       *
       * This behavior is reflected in this function.
       */

      var formalParams;
      var actualParams;

      if (node.expression.type === "sequence") {
        formalParams = [];
        actualParams = [];

        var elements = node.expression.elements;
        var elementsLength = elements.length;
        for (var i = 0; i < elementsLength; i++) {
          if (elements[i].type === "labeled") {
            formalParams.push(elements[i].label);
            actualParams.push(resultVar(context.resultIndex) + '[' + i + ']');
          }
        }
      } else if (node.expression.type === "labeled") {
        formalParams = [node.expression.label];
        actualParams = [resultVar(context.resultIndex)];
      } else {
        formalParams = [];
        actualParams = [];
      }

      return formatCode(
        '#{posVar} = pos;',
        '#block expressionCode',
        'if (#{resultVar} !== null) {',
        '  #{resultVar} = (function(#{formalParams.join(", ")}) {#{node.code}})(#{actualParams.join(", ")});',
        '}',
        'if (#{resultVar} === null) {',
        '  pos = #{posVar};',
        '}',
        {
          node:           node,
          expressionCode: emit(node.expression, {
            resultIndex: context.resultIndex,
            posIndex:    context.posIndex + 1
          }),
          formalParams:   formalParams,
          actualParams:   actualParams,
          posVar:         posVar(context.posIndex),
          resultVar:      resultVar(context.resultIndex)
        }
      );
    },

    rule_ref: function(node, context) {
      return formatCode(
        '#{resultVar} = parse_#{node.name}();',
        {
          node:      node,
          resultVar: resultVar(context.resultIndex)
        }
      );
    },

    literal: function(node, context) {
      return formatCode(
        '#if node.value.length === 0',
        '  #{resultVar} = "";',
        '#else',
        '  #if node.value.length === 1',
        '    if (input.charCodeAt(pos) === #{node.value.charCodeAt(0)}) {',
        '  #else',
        '    if (input.substr(pos, #{node.value.length}) === #{string(node.value)}) {',
        '  #end',
        '    #{resultVar} = #{string(node.value)};',
        '    pos += #{node.value.length};',
        '  } else {',
        '    #{resultVar} = null;',
        '    if (reportFailures === 0) {',
        '      matchFailed(#{string(string(node.value))});',
        '    }',
        '  }',
        '#end',
        {
          node:      node,
          resultVar: resultVar(context.resultIndex)
        }
      );
    },

    any: function(node, context) {
      return formatCode(
        'if (input.length > pos) {',
        '  #{resultVar} = input.charAt(pos);',
        '  pos++;',
        '} else {',
        '  #{resultVar} = null;',
        '  if (reportFailures === 0) {',
        '    matchFailed("any character");',
        '  }',
        '}',
        { resultVar: resultVar(context.resultIndex) }
      );
    },

    "class": function(node, context) {
      var regexp;

      if (node.parts.length > 0) {
        regexp = '/^['
          + (node.inverted ? '^' : '')
          + map(node.parts, function(part) {
              return part instanceof Array
                ? quoteForRegexpClass(part[0])
                  + '-'
                  + quoteForRegexpClass(part[1])
                : quoteForRegexpClass(part);
            }).join('')
          + ']/';
      } else {
        /*
         * Stupid IE considers regexps /[]/ and /[^]/ syntactically invalid, so
         * we translate them into euqivalents it can handle.
         */
        regexp = node.inverted ? '/^[\\S\\s]/' : '/^(?!)/';
      }

      return formatCode(
        'if (#{regexp}.test(input.charAt(pos))) {',
        '  #{resultVar} = input.charAt(pos);',
        '  pos++;',
        '} else {',
        '  #{resultVar} = null;',
        '  if (reportFailures === 0) {',
        '    matchFailed(#{string(node.rawText)});',
        '  }',
        '}',
        {
          node:      node,
          regexp:    regexp,
          resultVar: resultVar(context.resultIndex)
        }
      );
    }
  });

  return emit(ast);
};
