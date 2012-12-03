var utils = require("../../utils");

/* Generates the parser code. */
module.exports = function(ast, options) {
  options = utils.clone(options);
  utils.defaults(options, {
    cache:              false,
    allowedStartRules:  [ast.startRule]
  });

  /*
   * Codie 1.1.0
   *
   * https://github.com/dmajda/codie
   *
   * Copyright (c) 2011-2012 David Majda
   * Licensend under the MIT license.
   */
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
    /* Codie version (uses semantic versioning). */
    VERSION: "1.1.0",

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
            '  /*',
            '   * Generated by PEG.js 0.7.0.',
            '   *',
            '   * http://pegjs.majda.cz/',
            '   */',
            '  ',
            /* This needs to be in sync with |subclass| in utils.js. */
            '  function subclass(child, parent) {',
            '    function ctor() { this.constructor = child; }',
            '    ctor.prototype = parent.prototype;',
            '    child.prototype = new ctor();',
            '  }',
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
            '     * Parses the input with a generated parser. If the parsing is successful,',
            '     * returns a value explicitly or implicitly specified by the grammar from',
            '     * which the parser was generated (see |PEG.buildParser|). If the parsing is',
            '     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.',
            '     */',
            '    parse: function(input) {',
            '      var parseFunctions = {',
            '        #for rule in options.allowedStartRules',
            '          #{string(rule) + ": parse_" + rule + (rule !== options.allowedStartRules[options.allowedStartRules.length - 1] ? "," : "")}',
            '        #end',
            '      };',
            '      ',
            '      var options = arguments.length > 1 ? arguments[1] : {},',
            '          startRule;',
            '      ',
            '      #if options.trace',
            '        var depth = 0, tabspace = options.tabspace || 2;',
            '      #end',
            '      if (options.startRule !== undefined) {',
            '        startRule = options.startRule;',
            '        ',
            '        if (parseFunctions[startRule] === undefined) {',
            '          throw new Error("Can\'t start parsing from rule " + quote(startRule) + ".");',
            '        }',
            '      } else {',
            '        startRule = #{string(options.allowedStartRules[0])};',
            '      }',
            '      ',
            '      var pos = 0;',
            '      var reportedPos = 0;',
            '      var cachedReportedPos = 0;',
            '      var cachedReportedPosDetails = { line: 1, column: 1, seenCR: false };',
            '      var reportFailures = 0;', // 0 = report, anything > 0 = do not report
            '      var rightmostFailuresPos = 0;',
            '      var rightmostFailuresExpected = [];',
            '      #if options.cache',
            '        var cache = {};',
            '      #end',
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
            '      function computeReportedPosDetails() {',
            '        function advanceCachedReportedPos() {',
            '          var ch;',
            '          ',
            '          for (; cachedReportedPos < reportedPos; cachedReportedPos++) {',
            '            ch = input.charAt(cachedReportedPos);',
            '            if (ch === "\\n") {',
            '              if (!cachedReportedPosDetails.seenCR) { cachedReportedPosDetails.line++; }',
            '              cachedReportedPosDetails.column = 1;',
            '              cachedReportedPosDetails.seenCR = false;',
            '            } else if (ch === "\\r" || ch === "\\u2028" || ch === "\\u2029") {',
            '              cachedReportedPosDetails.line++;',
            '              cachedReportedPosDetails.column = 1;',
            '              cachedReportedPosDetails.seenCR = true;',
            '            } else {',
            '              cachedReportedPosDetails.column++;',
            '              cachedReportedPosDetails.seenCR = false;',
            '            }',
            '          }',
            '        }',
            '        ',
            '        if (cachedReportedPos !== reportedPos) {',
            '          if (cachedReportedPos > reportedPos) {',
            '            cachedReportedPos = 0;',
            '            cachedReportedPosDetails = { line: 1, column: 1, seenCR: false };',
            '          }',
            '          advanceCachedReportedPos();',
            '        }',
            '        ',
            '        return cachedReportedPosDetails;',
            '      }',
            '      ',
            '      function offset() {',
            '        return reportedPos;',
            '      }',
            '      ',
            '      function line() {',
            '        return computeReportedPosDetails().line;',
            '      }',
            '      ',
            '      function column() {',
            '        return computeReportedPosDetails().column;',
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
            '        reportedPos = Math.max(pos, rightmostFailuresPos);',
            '        var found = reportedPos < input.length ? input.charAt(reportedPos) : null;',
            '        var reportedPosDetails = computeReportedPosDetails();',
            '        ',
            '        throw new this.SyntaxError(',
            '          cleanupExpected(rightmostFailuresExpected),',
            '          found,',
            '          reportedPos,',
            '          reportedPosDetails.line,',
            '          reportedPosDetails.column',
            '        );',
            '      }',
            '      ',
            '      return result;',
            '    }',
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
            '  subclass(result.SyntaxError, Error);',
            '  ',
            '  return result;',
            '})()'
          ],
          rule: [
            'function parse_#{node.name}() {',
            '  #if options.cache',
            '    var cacheKey = "#{node.name}@" + pos;',
            '    var cachedResult = cache[cacheKey];',
            '    if (cachedResult) {',
            '      pos = cachedResult.nextPos;',
            '      return cachedResult.result;',
            '    }',
            '    ',
            '  #end',
            '  #if options.trace',
            '    var useTraceIndent = null;',
            '    if (options.trace === true || options.trace && options.trace.indexOf("#{node.name}") !== -1) {',
            '      useTraceIndent = Array(depth * tabspace).join(" ");',
            '      var cleanInput = input.substr(pos, 10).replace(/\\\\/g, "\\\\\\\\");',
            '      cleanInput = cleanInput.replace(/\\n/g, "\\\\n");',
            '      console.log(useTraceIndent + "Enter: #{node.name}: " + line() + ":" + column() + " - " + cleanInput);',
            '      depth += 1;',
            '    }',
            '  #end',
            '  #if node.registerCount > 0',
            '    var #{map(range(node.registerCount), r).join(", ")};',
            '  #end',
            '  ',
            '  #block emit(node.expression)',
            '  #if options.cache',
            '    ',
            '    cache[cacheKey] = {',
            '      nextPos: pos,',
            '      result:  #{r(node.expression.resultIndex)}',
            '    };',
            '  #end',
            '  #if options.trace',
            '    if (useTraceIndent !== null) {',
            '      --depth;',
            '      var t = "Failed";',
            '      if (#{r(node.expression.resultIndex)} !== null) {',
            '        t = "Matched";',
            '      }',
            '      console.log(useTraceIndent + t + ": #{node.name}");',
            '    }',
            '  #end',
            '  return #{r(node.expression.resultIndex)};',
            '}'
          ],
          named: [
            'reportFailures++;',
            '#block emit(node.expression)',
            'reportFailures--;',
            'if (reportFailures === 0 && #{r(node.resultIndex)} === null) {',
            '  matchFailed(#{string(node.name)});',
            '}'
          ],
          choice: [
            '#block emit(alternative)',
            '#block nextAlternativesCode'
          ],
          "choice.next": [
            'if (#{r(node.resultIndex)} === null) {',
            '  #block code',
            '}'
          ],
          action: [
            '#{r(node.posIndex)} = pos;',
            '#block emit(node.expression)',
            'if (#{r(node.resultIndex)} !== null) {',
            '  reportedPos = #{r(node.posIndex)};',
            '  #{r(node.resultIndex)} = (function(#{keys(node.params).join(", ")}) {#{node.code}})(#{map(values(node.params), r).join(", ")});',
            '}',
            'if (#{r(node.resultIndex)} === null) {',
            '  pos = #{r(node.posIndex)};',
            '}'
          ],
          sequence: [
            '#{r(node.posIndex)} = pos;',
            '#block code'
          ],
          "sequence.iteration": [
            '#block emit(element)',
            'if (#{r(element.resultIndex)} !== null) {',
            '  #block code',
            '} else {',
            '  #{r(node.resultIndex)} = null;',
            '  pos = #{r(node.posIndex)};',
            '}'
          ],
          "sequence.inner": [
            '#{r(node.resultIndex)} = [#{map(pluck(node.elements, "resultIndex"), r).join(", ")}];'
          ],
          text: [
            '#{r(node.posIndex)} = pos;',
            '#block emit(node.expression)',
            'if (#{r(node.resultIndex)} !== null) {',
            '  #{r(node.resultIndex)} = input.substring(pos, #{r(node.posIndex)});',
            '}'
          ],
          simple_and: [
            '#{r(node.posIndex)} = pos;',
            'reportFailures++;',
            '#block emit(node.expression)',
            'reportFailures--;',
            'if (#{r(node.resultIndex)} !== null) {',
            '  #{r(node.resultIndex)} = "";',
            '  pos = #{r(node.posIndex)};',
            '} else {',
            '  #{r(node.resultIndex)} = null;',
            '}'
          ],
          simple_not: [
            '#{r(node.posIndex)} = pos;',
            'reportFailures++;',
            '#block emit(node.expression)',
            'reportFailures--;',
            'if (#{r(node.resultIndex)} === null) {',
            '  #{r(node.resultIndex)} = "";',
            '} else {',
            '  #{r(node.resultIndex)} = null;',
            '  pos = #{r(node.posIndex)};',
            '}'
          ],
          semantic_and: [
            'reportedPos = pos;',
            '#{r(node.resultIndex)} = (function(#{keys(node.params).join(", ")}) {#{node.code}})(#{map(values(node.params), r).join(", ")}) ? "" : null;'
          ],
          semantic_not: [
            'reportedPos = pos;',
            '#{r(node.resultIndex)} = (function(#{keys(node.params).join(", ")}) {#{node.code}})(#{map(values(node.params), r).join(", ")}) ? null : "";'
          ],
          optional: [
            '#block emit(node.expression)',
            '#{r(node.resultIndex)} = #{r(node.resultIndex)} !== null ? #{r(node.resultIndex)} : "";'
          ],
          zero_or_more: [
            '#{r(node.resultIndex)} = [];',
            '#block emit(node.expression)',
            'while (#{r(node.expression.resultIndex)} !== null) {',
            '  #{r(node.resultIndex)}.push(#{r(node.expression.resultIndex)});',
            '  #block emit(node.expression)',
            '}'
          ],
          one_or_more: [
            '#block emit(node.expression)',
            'if (#{r(node.expression.resultIndex)} !== null) {',
            '  #{r(node.resultIndex)} = [];',
            '  while (#{r(node.expression.resultIndex)} !== null) {',
            '    #{r(node.resultIndex)}.push(#{r(node.expression.resultIndex)});',
            '    #block emit(node.expression)',
            '  }',
            '} else {',
            '  #{r(node.resultIndex)} = null;',
            '}'
          ],
          rule_ref: [
            '#{r(node.resultIndex)} = parse_#{node.name}();'
          ],
          literal: [
            '#if node.value.length === 0',
            '  #{r(node.resultIndex)} = "";',
            '#else',
            '  #if !node.ignoreCase',
            '    #if node.value.length === 1',
            '      if (input.charCodeAt(pos) === #{node.value.charCodeAt(0)}) {',
            '    #else',
            '      if (input.substr(pos, #{node.value.length}) === #{string(node.value)}) {',
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
            '    if (input.substr(pos, #{node.value.length}).toLowerCase() === #{string(node.value.toLowerCase())}) {',
            '  #end',
            '    #if !node.ignoreCase',
            '      #{r(node.resultIndex)} = #{string(node.value)};',
            '    #else',
            '      #{r(node.resultIndex)} = input.substr(pos, #{node.value.length});',
            '    #end',
            '    #{node.value.length > 1 ? "pos += " + node.value.length : "pos++"};',
            '  } else {',
            '    #{r(node.resultIndex)} = null;',
            '    if (reportFailures === 0) {',
            '      matchFailed(#{string(string(node.value))});',
            '    }',
            '  }',
            '#end'
          ],
          "class": [
            'if (#{regexp}.test(input.charAt(pos))) {',
            '  #{r(node.resultIndex)} = input.charAt(pos);',
            '  pos++;',
            '} else {',
            '  #{r(node.resultIndex)} = null;',
            '  if (reportFailures === 0) {',
            '    matchFailed(#{string(node.rawText)});',
            '  }',
            '}'
          ],
          any: [
            'if (input.length > pos) {',
            '  #{r(node.resultIndex)} = input.charAt(pos);',
            '  pos++;',
            '} else {',
            '  #{r(node.resultIndex)} = null;',
            '  if (reportFailures === 0) {',
            '    matchFailed("any character");',
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
    vars.string  = utils.quote;
    vars.range   = utils.range;
    vars.map     = utils.map;
    vars.pluck   = utils.pluck;
    vars.keys    = utils.keys;
    vars.values  = utils.values;
    vars.emit    = emit;
    vars.options = options;

    vars.r = function(index) { return "r" + index; };

    return templates[name](vars);
  }

  function emitSimple(name) {
    return function(node) { return fill(name, { node: node }); };
  }

  var emit = utils.buildNodeVisitor({
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
     *   the first chracter following the matched part of the input and sets a
     *   register with index specified by |node.resultIndex| to an appropriate
     *   value. This value is always non-|null|.
     *
     * * If the code fragment does not match the input, it returns with |pos|
     *   set to the original value and it sets a register with index specified
     *   by |node.posIndex| to |null|.
     *
     * The code uses only registers with indices specified by |node.resultIndex|
     * and |node.posIndex| where |node| is the processed node or some of its
     * subnodes. It does not use any other registers.
     */

    named: emitSimple("named"),

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

    action: emitSimple("action"),

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

    text:         emitSimple("text"),
    simple_and:   emitSimple("simple_and"),
    simple_not:   emitSimple("simple_not"),
    semantic_and: emitSimple("semantic_and"),
    semantic_not: emitSimple("semantic_not"),
    optional:     emitSimple("optional"),
    zero_or_more: emitSimple("zero_or_more"),
    one_or_more:  emitSimple("one_or_more"),
    rule_ref:     emitSimple("rule_ref"),
    literal:      emitSimple("literal"),

    "class": function(node) {
      var regexp;

      if (node.parts.length > 0) {
        regexp = '/^['
          + (node.inverted ? '^' : '')
          + utils.map(node.parts, function(part) {
              return part instanceof Array
                ? utils.quoteForRegexpClass(part[0])
                  + '-'
                  + utils.quoteForRegexpClass(part[1])
                : utils.quoteForRegexpClass(part);
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
    },

    any: emitSimple("any")
  });

  ast.code = emit(ast);
};
