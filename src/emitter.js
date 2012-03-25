/* Emits the generated code for the AST. */
PEG.compiler.emitter = function(ast, options) {
  options = options || {};
  options.trackLineAndColumn = options.trackLineAndColumn || false;

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
                + l + '=' + c + '.length;'
                + 'for(' + i + '=0;' + i + '<' + l + ';' + i + '++){'
                + params[0] + '=' + c + '[' + i + '];',
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
            var x = '__x', // __x for "prefix",
                n = '__n', // __n for "lines"
                l = '__l', // __l for "length"
                i = '__i'; // __i for "index"

            /*
             * Originally, the generated code used |String.prototype.replace|, but
             * it is buggy in certain versions of V8 so it was rewritten. See the
             * tests for details.
             */
            return [
              x + '="' + stringEscape(prefix.substring(state.indentLevel())) + '";'
                + n + '=(' + params[0] + ').toString().split("\\n");'
                + l + '=' + n + '.length;'
                + 'for(' + i + '=0;' + i + '<' + l + ';' + i + '++){'
                + n + '[' + i +']=' + x + '+' + n + '[' + i + ']+"\\n";'
                + '}'
                + push(n + '.join("")'),
              [x, n, l, i]
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

  var templates = (function() {
    var name,
        templates = {},
        sources = {
          grammar: [
            '(function(){',
            '  /* Generated by PEG.js @VERSION (http://pegjs.majda.cz/). */',
            '  ',
            /* This needs to be in sync with |quote| in utils.js. */
            '  function quote(s) {',
            '    /*',
            '     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a',
            '     * string literal except for the closing quote character, backslash,',
            '     * carriage return, line separator, paragraph separator, and line feed.',
            '     * Any character may appear in the form of an escape sequence.',
            '     *',
            '     * For portability, we also escape escape all control and non-ASCII',
            '     * characters. Note that "\\0" and "\\v" escape sequences are not used',
            '     * because JSHint does not like the first and IE the second.',
            '     */',
            '     return \'"\' + s',
            '      .replace(/\\\\/g, \'\\\\\\\\\')  // backslash',
            '      .replace(/"/g, \'\\\\"\')    // closing quote character',
            '      .replace(/\\x08/g, \'\\\\b\') // backspace',
            '      .replace(/\\t/g, \'\\\\t\')   // horizontal tab',
            '      .replace(/\\n/g, \'\\\\n\')   // line feed',
            '      .replace(/\\f/g, \'\\\\f\')   // form feed',
            '      .replace(/\\r/g, \'\\\\r\')   // carriage return',
            '      .replace(/[\\x00-\\x07\\x0B\\x0E-\\x1F\\x80-\\uFFFF]/g, escape)',
            '      + \'"\';',
            '  }',
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
            '        #for rule in node.rules',
            '          #{string(rule.name) + ": parse_" + rule.name},',
            '        #end',
            '      };',
            '      ',
            '      if (startRule !== undefined) {',
            '        if (parseFunctions[startRule] === undefined) {',
            '          throw new Error("Invalid rule name: " + quote(startRule) + ".");',
            '        }',
            '      } else {',
            '        startRule = #{string(node.startRule)};',
            '      }',
            '      ',
            '      #{posInit("pos")};',
            '      var reportFailures = 0;', // 0 = report, anything > 0 = do not report
            '      #{posInit("rightmostFailuresPos")};',
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
            '      #if options.trackLineAndColumn',
            '        function clone(object) {',
            '          var result = {};',
            '          for (var key in object) {',
            '            result[key] = object[key];',
            '          }',
            '          return result;',
            '        }',
            '        ',
            '        function advance(pos, n) {',
            '          var endOffset = pos.offset + n;',
            '          ',
            '          for (var offset = pos.offset; offset < endOffset; offset++) {',
            '            var ch = input.charAt(offset);',
            '            if (ch === "\\n") {',
            '              if (!pos.seenCR) { pos.line++; }',
            '              pos.column = 1;',
            '              pos.seenCR = false;',
            '            } else if (ch === "\\r" || ch === "\\u2028" || ch === "\\u2029") {',
            '              pos.line++;',
            '              pos.column = 1;',
            '              pos.seenCR = true;',
            '            } else {',
            '              pos.column++;',
            '              pos.seenCR = false;',
            '            }',
            '          }',
            '          ',
            '          pos.offset += n;',
            '        }',
            '        ',
            '      #end',
            '      function matchFailed(failure) {',
            '        if (#{posOffset("pos")} < #{posOffset("rightmostFailuresPos")}) {',
            '          return;',
            '        }',
            '        ',
            '        if (#{posOffset("pos")} > #{posOffset("rightmostFailuresPos")}) {',
            '          rightmostFailuresPos = #{posClone("pos")};',
            '          rightmostFailuresExpected = [];',
            '        }',
            '        ',
            '        rightmostFailuresExpected.push(failure);',
            '      }',
            '      ',
            '      #for rule in node.rules',
            '        #block emit(rule)',
            '        ',
            '      #end',
            '      ',
            '      function cleanupExpected(expected) {',
            '        expected.sort();',
            '        ',
            '        var lastExpected = null;',
            '        var cleanExpected = [];',
            '        for (var i = 0; i < expected.length; i++) {',
            '          if (expected[i] !== lastExpected) {',
            '            cleanExpected.push(expected[i]);',
            '            lastExpected = expected[i];',
            '          }',
            '        }',
            '        return cleanExpected;',
            '      }',
            '      ',
            '      #if !options.trackLineAndColumn',
            '        function computeErrorPosition() {',
            '          /*',
            '           * The first idea was to use |String.split| to break the input up to the',
            '           * error position along newlines and derive the line and column from',
            '           * there. However IE\'s |split| implementation is so broken that it was',
            '           * enough to prevent it.',
            '           */',
            '          ',
            '          var line = 1;',
            '          var column = 1;',
            '          var seenCR = false;',
            '          ',
            '          for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {',
            '            var ch = input.charAt(i);',
            '            if (ch === "\\n") {',
            '              if (!seenCR) { line++; }',
            '              column = 1;',
            '              seenCR = false;',
            '            } else if (ch === "\\r" || ch === "\\u2028" || ch === "\\u2029") {',
            '              line++;',
            '              column = 1;',
            '              seenCR = true;',
            '            } else {',
            '              column++;',
            '              seenCR = false;',
            '            }',
            '          }',
            '          ',
            '          return { line: line, column: column };',
            '        }',
            '      #end',
            '      ',
            '      #if node.initializer',
            '        #block emit(node.initializer)',
            '      #end',
            '      ',
            '      var result = parseFunctions[startRule]();',
            '      ',
            '      /*',
            '       * The parser is now in one of the following three states:',
            '       *',
            '       * 1. The parser successfully parsed the whole input.',
            '       *',
            '       *    - |result !== null|',
            '       *    - |#{posOffset("pos")} === input.length|',
            '       *    - |rightmostFailuresExpected| may or may not contain something',
            '       *',
            '       * 2. The parser successfully parsed only a part of the input.',
            '       *',
            '       *    - |result !== null|',
            '       *    - |#{posOffset("pos")} < input.length|',
            '       *    - |rightmostFailuresExpected| may or may not contain something',
            '       *',
            '       * 3. The parser did not successfully parse any part of the input.',
            '       *',
            '       *   - |result === null|',
            '       *   - |#{posOffset("pos")} === 0|',
            '       *   - |rightmostFailuresExpected| contains at least one failure',
            '       *',
            '       * All code following this comment (including called functions) must',
            '       * handle these states.',
            '       */',
            '      if (result === null || #{posOffset("pos")} !== input.length) {',
            '        var offset = Math.max(#{posOffset("pos")}, #{posOffset("rightmostFailuresPos")});',
            '        var found = offset < input.length ? input.charAt(offset) : null;',
            '        #if options.trackLineAndColumn',
            '          var errorPosition = #{posOffset("pos")} > #{posOffset("rightmostFailuresPos")} ? pos : rightmostFailuresPos;',
            '        #else',
            '          var errorPosition = computeErrorPosition();',
            '        #end',
            '        ',
            '        throw new this.SyntaxError(',
            '          cleanupExpected(rightmostFailuresExpected),',
            '          found,',
            '          offset,',
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
            '  result.SyntaxError = function(expected, found, offset, line, column) {',
            '    function buildMessage(expected, found) {',
            '      var expectedHumanized, foundHumanized;',
            '      ',
            '      switch (expected.length) {',
            '        case 0:',
            '          expectedHumanized = "end of input";',
            '          break;',
            '        case 1:',
            '          expectedHumanized = expected[0];',
            '          break;',
            '        default:',
            '          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")',
            '            + " or "',
            '            + expected[expected.length - 1];',
            '      }',
            '      ',
            '      foundHumanized = found ? quote(found) : "end of input";',
            '      ',
            '      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";',
            '    }',
            '    ',
            '    this.name = "SyntaxError";',
            '    this.expected = expected;',
            '    this.found = found;',
            '    this.message = buildMessage(expected, found);',
            '    this.offset = offset;',
            '    this.line = line;',
            '    this.column = column;',
            '  };',
            '  ',
            '  result.SyntaxError.prototype = Error.prototype;',
            '  ',
            '  return result;',
            '})()'
          ],
          rule: [
            'function parse_#{node.name}() {',
            '  var cacheKey = "#{node.name}@" + #{posOffset("pos")};',
            '  var cachedResult = cache[cacheKey];',
            '  if (cachedResult) {',
            '    pos = #{posClone("cachedResult.nextPos")};',
            '    return cachedResult.result;',
            '  }',
            '  ',
            '  #if node.resultVars.length > 0',
            '    var #{node.resultVars.join(", ")};',
            '  #end',
            '  #if node.posVars.length > 0',
            '    var #{node.posVars.join(", ")};',
            '  #end',
            '  ',
            '  #if node.displayName !== null',
            '    reportFailures++;',
            '  #end',
            '  #block emit(node.expression)',
            '  #if node.displayName !== null',
            '    reportFailures--;',
            '    if (reportFailures === 0 && #{node.resultVar} === null) {',
            '      matchFailed(#{string(node.displayName)});',
            '    }',
            '  #end',
            '  ',
            '  cache[cacheKey] = {',
            '    nextPos: #{posClone("pos")},',
            '    result:  #{node.resultVar}',
            '  };',
            '  return #{node.resultVar};',
            '}'
          ],
          choice: [
            '#block emit(alternative)',
            '#block nextAlternativesCode'
          ],
          "choice.next": [
            'if (#{node.resultVar} === null) {',
            '  #block code',
            '}'
          ],
          sequence: [
            '#{posSave(node)};',
            '#block code'
          ],
          "sequence.iteration": [
            '#block emit(element)',
            'if (#{element.resultVar} !== null) {',
            '  #block code',
            '} else {',
            '  #{node.resultVar} = null;',
            '  #{posRestore(node)};',
            '}'
          ],
          "sequence.inner": [
            '#{node.resultVar} = [#{pluck(node.elements, "resultVar").join(", ")}];'
          ],
          simple_and: [
            '#{posSave(node)};',
            'reportFailures++;',
            '#block emit(node.expression)',
            'reportFailures--;',
            'if (#{node.resultVar} !== null) {',
            '  #{node.resultVar} = "";',
            '  #{posRestore(node)};',
            '} else {',
            '  #{node.resultVar} = null;',
            '}'
          ],
          simple_not: [
            '#{posSave(node)};',
            'reportFailures++;',
            '#block emit(node.expression)',
            'reportFailures--;',
            'if (#{node.resultVar} === null) {',
            '  #{node.resultVar} = "";',
            '} else {',
            '  #{node.resultVar} = null;',
            '  #{posRestore(node)};',
            '}'
          ],
          semantic_and: [
            '#{node.resultVar} = (function(#{(options.trackLineAndColumn ? ["offset", "line", "column"] : ["offset"]).concat(keys(node.params)).join(", ")}) {#{node.code}})(#{(options.trackLineAndColumn ? ["pos.offset", "pos.line", "pos.column"] : ["pos"]).concat(values(node.params)).join(", ")}) ? "" : null;'
          ],
          semantic_not: [
            '#{node.resultVar} = (function(#{(options.trackLineAndColumn ? ["offset", "line", "column"] : ["offset"]).concat(keys(node.params)).join(", ")}) {#{node.code}})(#{(options.trackLineAndColumn ? ["pos.offset", "pos.line", "pos.column"] : ["pos"]).concat(values(node.params)).join(", ")}) ? null : "";'
          ],
          optional: [
            '#block emit(node.expression)',
            '#{node.resultVar} = #{node.resultVar} !== null ? #{node.resultVar} : "";'
          ],
          zero_or_more: [
            '#{node.resultVar} = [];',
            '#block emit(node.expression)',
            'while (#{node.expression.resultVar} !== null) {',
            '  #{node.resultVar}.push(#{node.expression.resultVar});',
            '  #block emit(node.expression)',
            '}'
          ],
          one_or_more: [
            '#block emit(node.expression)',
            'if (#{node.expression.resultVar} !== null) {',
            '  #{node.resultVar} = [];',
            '  while (#{node.expression.resultVar} !== null) {',
            '    #{node.resultVar}.push(#{node.expression.resultVar});',
            '    #block emit(node.expression)',
            '  }',
            '} else {',
            '  #{node.resultVar} = null;',
            '}'
          ],
          action: [
            '#{posSave(node)};',
            '#block emit(node.expression)',
            'if (#{node.resultVar} !== null) {',
            '  #{node.resultVar} = (function(#{(options.trackLineAndColumn ? ["offset", "line", "column"] : ["offset"]).concat(keys(node.params)).join(", ")}) {#{node.code}})(#{(options.trackLineAndColumn ? [node.posVar + ".offset", node.posVar + ".line", node.posVar + ".column"] : [node.posVar]).concat(values(node.params)).join(", ")});',
            '}',
            'if (#{node.resultVar} === null) {',
            '  #{posRestore(node)};',
            '}'
          ],
          rule_ref: [
            '#{node.resultVar} = parse_#{node.name}();'
          ],
          literal: [
            '#if node.value.length === 0',
            '  #{node.resultVar} = "";',
            '#else',
            '  #if !node.ignoreCase',
            '    #if node.value.length === 1',
            '      if (input.charCodeAt(#{posOffset("pos")}) === #{node.value.charCodeAt(0)}) {',
            '    #else',
            '      if (input.substr(#{posOffset("pos")}, #{node.value.length}) === #{string(node.value)}) {',
            '    #end',
            '  #else',
            /*
             * One-char literals are not optimized when case-insensitive
             * matching is enabled. This is because there is no simple way to
             * lowercase a character code that works for character outside ASCII
             * letters. Moreover, |toLowerCase| can change string length,
             * meaning the result of lowercasing a character can be more
             * characters.
             */
            '    if (input.substr(#{posOffset("pos")}, #{node.value.length}).toLowerCase() === #{string(node.value.toLowerCase())}) {',
            '  #end',
            '    #if !node.ignoreCase',
            '      #{node.resultVar} = #{string(node.value)};',
            '    #else',
            '      #{node.resultVar} = input.substr(#{posOffset("pos")}, #{node.value.length});',
            '    #end',
            '    #{posAdvance(node.value.length)};',
            '  } else {',
            '    #{node.resultVar} = null;',
            '    if (reportFailures === 0) {',
            '      matchFailed(#{string(string(node.value))});',
            '    }',
            '  }',
            '#end'
          ],
          any: [
            'if (input.length > #{posOffset("pos")}) {',
            '  #{node.resultVar} = input.charAt(#{posOffset("pos")});',
            '  #{posAdvance(1)};',
            '} else {',
            '  #{node.resultVar} = null;',
            '  if (reportFailures === 0) {',
            '    matchFailed("any character");',
            '  }',
            '}'
          ],
          "class": [
            'if (#{regexp}.test(input.charAt(#{posOffset("pos")}))) {',
            '  #{node.resultVar} = input.charAt(#{posOffset("pos")});',
            '  #{posAdvance(1)};',
            '} else {',
            '  #{node.resultVar} = null;',
            '  if (reportFailures === 0) {',
            '    matchFailed(#{string(node.rawText)});',
            '  }',
            '}'
          ]
        };

    for (name in sources) {
      templates[name] = Codie.template(sources[name].join('\n'));
    }

    return templates;
  })();

  function fill(name, vars) {
    vars.string  = quote;
    vars.pluck   = pluck;
    vars.keys    = keys;
    vars.values  = values;
    vars.emit    = emit;
    vars.options = options;

    /* Position-handling macros */
    if (options.trackLineAndColumn) {
      vars.posInit    = function(name) {
        return "var "
             + name
             + " = "
             + "{ offset: 0, line: 1, column: 1, seenCR: false }";
      };
      vars.posClone   = function(name) { return "clone(" + name + ")"; };
      vars.posOffset  = function(name) { return name + ".offset"; };

      vars.posAdvance = function(n)    { return "advance(pos, " + n + ")"; };
    } else {
      vars.posInit    = function(name) { return "var " + name + " = 0"; };
      vars.posClone   = function(name) { return name; };
      vars.posOffset  = function(name) { return name; };

      vars.posAdvance = function(n) {
        return n === 1 ? "pos++" : "pos += " + n;
      };
    }
    vars.posSave    = function(node) {
      return node.posVar + " = " + vars.posClone("pos");
    };
    vars.posRestore = function(node) {
      return "pos" + " = " + vars.posClone(node.posVar);
    };

    return templates[name](vars);
  }

  function emitSimple(name) {
    return function(node) { return fill(name, { node: node }); };
  }

  var emit = buildNodeVisitor({
    grammar: emitSimple("grammar"),

    initializer: function(node) { return node.code; },

    rule: emitSimple("rule"),

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
     *   variable with a name stored in |node.resultVar| to an appropriate
     *   value. This value is always non-|null|.
     *
     * * If the code fragment does not match the input, it returns with |pos|
     *   set to the original value and it sets a variable with a name stored in
     *   |node.resultVar| to |null|.
     *
     * The code can use variables with names stored in |resultVar| and |posVar|
     * properties of the current node's subnodes. It can't use any other
     * variables.
     */

    choice: function(node) {
      var code, nextAlternativesCode;

      for (var i = node.alternatives.length - 1; i >= 0; i--) {
        nextAlternativesCode = i !== node.alternatives.length - 1
          ? fill("choice.next", { node: node, code: code })
          : '';
        code = fill("choice", {
          alternative:          node.alternatives[i],
          nextAlternativesCode: nextAlternativesCode
        });
      }

      return code;
    },

    sequence: function(node) {
      var code = fill("sequence.inner", { node: node });

      for (var i = node.elements.length - 1; i >= 0; i--) {
        code = fill("sequence.iteration", {
          node:    node,
          element: node.elements[i],
          code:    code
        });
      }

      return fill("sequence", { node: node, code: code });
    },

    labeled: function(node) { return emit(node.expression); },

    simple_and:   emitSimple("simple_and"),
    simple_not:   emitSimple("simple_not"),
    semantic_and: emitSimple("semantic_and"),
    semantic_not: emitSimple("semantic_not"),
    optional:     emitSimple("optional"),
    zero_or_more: emitSimple("zero_or_more"),
    one_or_more:  emitSimple("one_or_more"),
    action:       emitSimple("action"),
    rule_ref:     emitSimple("rule_ref"),
    literal:      emitSimple("literal"),
    any:          emitSimple("any"),

    "class": function(node) {
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
          + ']/' + (node.ignoreCase ? 'i' : '');
      } else {
        /*
         * Stupid IE considers regexps /[]/ and /[^]/ syntactically invalid, so
         * we translate them into euqivalents it can handle.
         */
        regexp = node.inverted ? '/^[\\S\\s]/' : '/^(?!)/';
      }

      return fill("class", { node: node, regexp: regexp });
    }
  });

  return emit(ast);
};
