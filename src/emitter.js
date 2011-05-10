/* Emits the generated code for the AST. */
PEG.compiler.emitter = function(ast, options) {
  /*
   * Takes parts of code, interpolates variables inside them and joins them with
   * a newline.
   *
   * Variables are delimited with "${" and "}" and their names must be valid
   * identifiers (i.e. they must match [a-zA-Z_][a-zA-Z0-9_]*). Variable values
   * are specified as properties of the last parameter (if this is an object,
   * otherwise empty variable set is assumed). Undefined variables result in
   * throwing |Error|.
   *
   * There can be a filter specified after the variable name, prefixed with "|".
   * The filter name must be a valid identifier. The only recognized filter
   * right now is "string", which quotes the variable value as a JavaScript
   * string. Unrecognized filters result in throwing |Error|.
   *
   * If any part has multiple lines and the first line is indented by some
   * amount of whitespace (as defined by the /\s+/ JavaScript regular
   * expression), second to last lines are indented by the same amount of
   * whitespace. This results in nicely indented multiline code in variables
   * without making the templates look ugly.
   *
   * Examples:
   *
   *   formatCode("foo", "bar");                           // "foo\nbar"
   *   formatCode("foo", "${bar}", { bar: "baz" });        // "foo\nbaz"
   *   formatCode("foo", "${bar}");                        // throws Error
   *   formatCode("foo", "${bar|string}", { bar: "baz" }); // "foo\n\"baz\""
   *   formatCode("foo", "${bar|eeek}", { bar: "baz" });   // throws Error
   *   formatCode("foo", "${bar}", { bar: "  baz\nqux" }); // "foo\n  baz\n  qux"
   */
  function formatCode() {
	var vars;

    function interpolateVariablesInParts(parts) {
      return map(parts, function(part) {
        return part.replace(
          /\$\{([a-zA-Z_][a-zA-Z0-9_]*)(\|([a-zA-Z_][a-zA-Z0-9_]*))?\}/g,
          function(match, name, dummy, filter) {
            var value = vars[name];
            if (value === undefined) {
              throw new Error("Undefined variable: \"" + name + "\".");
            }

            if (filter !== undefined && filter !== "") { // JavaScript engines differ here.
              if (filter === "string") {
                return quote(value);
              } else {
                throw new Error("Unrecognized filter: \"" + filter + "\".");
              }
            } else {
              return value;
            }
          }
        );
      });
    }

    function indentMultilineParts(parts) {
      return map(parts, function(part) {
        if (!/\n/.test(part)) { return part; }

        var firstLineWhitespacePrefix = part.match(/^\s*/)[0];
        var lines = part.split("\n");
        var linesIndented = [lines[0]].concat(
          map(lines.slice(1), function(line) {
            return firstLineWhitespacePrefix + line;
          })
        );
        return linesIndented.join("\n");
      });
    }
	
    var args = Array.prototype.slice.call(arguments);
    vars = args[args.length - 1] instanceof Object ? args.pop() : {};
    
    return indentMultilineParts(interpolateVariablesInParts(args)).join("\n");
  }

  /* Unique ID generator. */
  var UID = {
    _counters: {},

    next: function(prefix) {
      this._counters[prefix] = this._counters[prefix] || 0;
      return prefix + this._counters[prefix]++;
    },

    current: function(prefix) {
      return this._counters[prefix] || 0;
    },

    reset: function() {
      this._counters = {};
    }
  };

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
        "(function(){",
        "  /* Generated by PEG.js @VERSION (http://pegjs.majda.cz/). */",
        "  ",
        "  var result = {",
        "    /*",
        "     * Parses the input with a generated parser. If the parsing is successfull,",
        "     * returns a value explicitly or implicitly specified by the grammar from",
        "     * which the parser was generated (see |PEG.buildParser|). If the parsing is",
        "     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.",
        "     */",
        "    parse: function(input, startRule) {",
        "      var pos = 0;",
        "      var reportMatchFailures = true;",
        "      var rightmostMatchFailuresPos = 0;",
        "      var rightmostMatchFailuresExpected = [];",
        "      var cache = {};",
        "      ",
        "      ${parseFunctionDefinitions}",
        "      ",
        "      var parseFunctions = {",
        "        ${parseFunctionTableItems}",
        "      };",
        "      ",
        "      if (startRule !== undefined) {",
        "        if (parseFunctions[startRule] === undefined) {",
        "          throw new Error(\"Invalid rule name: \" + quote(startRule) + \".\");",
        "        }",
        "      } else {",
        "        startRule = ${startRule|string};",
        "      }",
        /* the functions from utils.js aren't needed, if we parse the peg-parser itself */
		!!options.selfParsing
		  ? "      "
		  : formatCode(
            "      ",
            /* This needs to be in sync with |padLeft| in utils.js. */
            "      function padLeft(input, padding, length) {",
            "        var result = input;",
            "        ",
            "        var padLength = length - input.length;",
            "        for (var i = 0; i < padLength; i++) {",
            "          result = padding + result;",
            "        }",
            "        ",
            "        return result;",
            "      }",
            "      ",
            /* This needs to be in sync with |escape| in utils.js. */
            "      function escape(ch) {",
            "        var charCode = ch.charCodeAt(0);",
            "        var escapeChar, length;",
            "        if (charCode <= 0xFF) {",
            "          escapeChar = 'x';",
            "          length = 2;",
            "        } else {",
            "          escapeChar = 'u';",
            "          length = 4;",
            "        }",
            "        ",
            "        return '\\\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);",
            "      }",
            "      ",
            /* This needs to be in sync with |quote| in utils.js. */
            "      function quote(s) {",
            "        /*",
            "         * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a",
            "         * string literal except for the closing quote character, backslash,",
            "         * carriage return, line separator, paragraph separator, and line feed.",
            "         * Any character may appear in the form of an escape sequence.",
            "         */",
            "        return '\"' + s",
            "          .replace(/\\\\/g, '\\\\\\\\')           // backslash",
            "          .replace(/\"/g, '\\\\\"')             // closing quote character",
            "          .replace(/\\r/g, '\\\\r')            // carriage return",
            "          .replace(/\\n/g, '\\\\n')            // line feed",
            "          .replace(/\\t/g, '\\\\t')            // tab",
            "          .replace(/\\f/g, '\\\\f')            // form feed",
            "          .replace(/[^\\x20-\\x7F]/g, escape) // non-ASCII characters",
            "          + '\"';",
            "      }",
            "      "
		),
        "      function matchFailed(failure) {",
        "        if (pos < rightmostMatchFailuresPos) {",
        "          return;",
        "        }",
        "        ",
        "        if (pos > rightmostMatchFailuresPos) {",
        "          rightmostMatchFailuresPos = pos;",
        "          rightmostMatchFailuresExpected = [];",
        "        }",
        "        ",
        "        rightmostMatchFailuresExpected.push(failure);",
        "      }",
        "      ",
        "      function buildErrorMessage() {",
        "        function buildExpected(failuresExpected) {",
        "          failuresExpected.sort();",
        "          ",
        "          var lastFailure = null;",
        "          var failuresExpectedUnique = [];",
        "          for (var i = 0; i < failuresExpected.length; i++) {",
        "            if (failuresExpected[i] !== lastFailure) {",
        "              failuresExpectedUnique.push(failuresExpected[i]);",
        "              lastFailure = failuresExpected[i];",
        "            }",
        "          }",
        "          ",
        "          switch (failuresExpectedUnique.length) {",
        "            case 0:",
        "              return 'end of input';",
        "            case 1:",
        "              return failuresExpectedUnique[0];",
        "            default:",
        "              return failuresExpectedUnique.slice(0, failuresExpectedUnique.length - 1).join(', ')",
        "                + ' or '",
        "                + failuresExpectedUnique[failuresExpectedUnique.length - 1];",
        "          }",
        "        }",
        "        ",
        "        var expected = buildExpected(rightmostMatchFailuresExpected);",
        "        var actualPos = Math.max(pos, rightmostMatchFailuresPos);",
        "        var actual = actualPos < input.length",
        "          ? quote(input.charAt(actualPos))",
        "          : 'end of input';",
        "        ",
        "        return 'Expected ' + expected + ' but ' + actual + ' found.';",
        "      }",
        "      ",
        "      function computeErrorPosition() {",
        "        /*",
        "         * The first idea was to use |String.split| to break the input up to the",
        "         * error position along newlines and derive the line and column from",
        "         * there. However IE's |split| implementation is so broken that it was",
        "         * enough to prevent it.",
        "         */",
        "        ",
        "        var line = 1;",
        "        var column = 1;",
        "        var seenCR = false;",
        "        ",
        "        for (var i = 0; i <  rightmostMatchFailuresPos; i++) {",
        "          var ch = input.charAt(i);",
        "          if (ch === '\\n') {",
        "            if (!seenCR) { line++; }",
        "            column = 1;",
        "            seenCR = false;",
        "          } else if (ch === '\\r' || ch === '\\u2028' || ch === '\\u2029') {",
        "            line++;",
        "            column = 1;",
        "            seenCR = true;",
        "          } else {",
        "            column++;",
        "            seenCR = false;",
        "          }",
        "        }",
        "        ",
        "        return { line: line, column: column };",
        "      }",
        "      ",
        "      ${initializerCode}",
        "      ",
        "      var result = parseFunctions[startRule]();",
        "      ",
        "      /*",
        "       * The parser is now in one of the following three states:",
        "       *",
        "       * 1. The parser successfully parsed the whole input.",
        "       *",
        "       *    - |result !== null|",
        "       *    - |pos === input.length|",
        "       *    - |rightmostMatchFailuresExpected| may or may not contain something",
        "       *",
        "       * 2. The parser successfully parsed only a part of the input.",
        "       *",
        "       *    - |result !== null|",
        "       *    - |pos < input.length|",
        "       *    - |rightmostMatchFailuresExpected| may or may not contain something",
        "       *",
        "       * 3. The parser did not successfully parse any part of the input.",
        "       *",
        "       *   - |result === null|",
        "       *   - |pos === 0|",
        "       *   - |rightmostMatchFailuresExpected| contains at least one failure",
        "       *",
        "       * All code following this comment (including called functions) must",
        "       * handle these states.",
        "       */",
        "      if (result === null || pos !== input.length) {",
        "        var errorPosition = computeErrorPosition();",
        "        throw new this.SyntaxError(",
        "          buildErrorMessage(),",
        "          errorPosition.line,",
        "          errorPosition.column",
        "        );",
        "      }",
        "      ",
        "      return result;",
        "    },",
        "    ",
        "    /* Returns the parser source code. */",
        "    toSource: function() { return this._source; }",
        "  };",
        "  ",
        "  /* Thrown when a parser encounters a syntax error. */",
        "  ",
        "  result.SyntaxError = function(message, line, column) {",
        "    this.name = 'SyntaxError';",
        "    this.message = message;",
        "    this.line = line;",
        "    this.column = column;",
        "  };",
        "  ",
        "  result.SyntaxError.prototype = Error.prototype;",
        "  ",
        "  return result;",
        "})()",
        {
          initializerCode:          initializerCode,
          parseFunctionTableItems:  parseFunctionTableItems.join(",\n"),
          parseFunctionDefinitions: parseFunctionDefinitions.join("\n\n"),
          startRule:                node.startRule
        }
      );
    },

    initializer: function(node) {
      return node.code;
    },

    rule: function(node) {
      /*
       * We want to reset variable names at the beginning of every function so
       * that a little change in the source grammar does not change variables in
       * all the generated code. This is desired especially when one has the
       * generated grammar stored in a VCS (this is true e.g. for our
       * metagrammar).
       */
      UID.reset();

      var resultVar = UID.next("result");
      var setReportMatchFailuresCode, restoreReportMatchFailuresCode, reportMatchFailureCode;

      if (node.displayName !== null) {
        setReportMatchFailuresCode = formatCode(
          "var savedReportMatchFailures = reportMatchFailures;",
          "reportMatchFailures = false;"
        );
        restoreReportMatchFailuresCode = formatCode(
          "reportMatchFailures = savedReportMatchFailures;"
        );
        reportMatchFailureCode = formatCode(
          "if (reportMatchFailures && ${resultVar} === null) {",
          "  matchFailed(${displayName|string});",
          "}",
          {
            displayName: node.displayName,
            resultVar:   resultVar
          }
        );
      } else {
        setReportMatchFailuresCode = "";
        restoreReportMatchFailuresCode = "";
        reportMatchFailureCode = "";
      }

      var varDef = function(name){
        var count = UID.current(name);
        if( count === 0 ) {
          return "";
        }
        var ret = new Array(count);
        for( var i = 0; i < count; i++ ){
          ret[i] = name + i;
        }
        return "var " + ret.join(", ") + ";";
      };

      return formatCode(
        "function parse_${name}() {",
        "  var cacheKey = '${name}@' + pos;",
        "  var cachedResult = cache[cacheKey];",
        "  if (cachedResult) {",
        "    pos = cachedResult.nextPos;",
        "    return cachedResult.result;",
        "  }",
        "  ",
        "  ${resultVariables}",
        "  ${savedPosVariables}",
        "  ${savedReportMatchFailuresVariables}",
        "  ${setReportMatchFailuresCode}",
        "  ${code}",
        "  ${restoreReportMatchFailuresCode}",
        "  ${reportMatchFailureCode}",
        "  ",
        "  cache[cacheKey] = {",
        "    nextPos: pos,",
        "    result:  ${resultVar}",
        "  };",
        "  return ${resultVar};",
        "}",
        {
          name:                           node.name,
          setReportMatchFailuresCode:     setReportMatchFailuresCode,
          restoreReportMatchFailuresCode: restoreReportMatchFailuresCode,
          reportMatchFailureCode:         reportMatchFailureCode,
          code:                           emit(node.expression, resultVar),
          resultVar:                         resultVar,
          resultVariables:                   varDef("result"),
          savedPosVariables:                 varDef("savedPos"),
          savedReportMatchFailuresVariables: varDef("savedReportMatchFailuresVar")
        }
      );
    },

    /*
     * The contract for all code fragments generated by the following functions
     * is as follows:
     *
     * * The code fragment should try to match a part of the input starting with
     * the position indicated in |pos|. That position may point past the end of
     * the input.
     *
     * * If the code fragment matches the input, it advances |pos| after the
     *   matched part of the input and sets variable with a name stored in
     *   |resultVar| to appropriate value, which is always non-null.
     *
     * * If the code fragment does not match the input, it does not change |pos|
     *   and it sets a variable with a name stored in |resultVar| to |null|.
     */

    choice: function(node, resultVar) {
      var code = formatCode(
        "${resultVar} = null;",
        { resultVar: resultVar }
      );

      for (var i = node.alternatives.length - 1; i >= 0; i--) {
        var alternativeResultVar = UID.next("result");
        code = formatCode(
          "${alternativeCode}",
          "if (${alternativeResultVar} !== null) {",
          "  ${resultVar} = ${alternativeResultVar};",
          "} else {",
          "  ${code}",
          "}",
          {
            alternativeCode:      emit(node.alternatives[i], alternativeResultVar),
            alternativeResultVar: alternativeResultVar,
            code:                 code,
            resultVar:            resultVar
          }
        );
      }

      return code;
    },

    sequence: function(node, resultVar) {
      var savedPosVar = UID.next("savedPos");

      var elementResultVars = map(node.elements, function() {
        return UID.next("result");
      });

      var code = formatCode(
        "${resultVar} = ${elementResultVarArray};",
        {
          resultVar:             resultVar,
          elementResultVarArray: "[" + elementResultVars.join(", ") + "]"
        }
      );

      for (var i = node.elements.length - 1; i >= 0; i--) {
        code = formatCode(
          "${elementCode}",
          "if (${elementResultVar} !== null) {",
          "  ${code}",
          "} else {",
          "  ${resultVar} = null;",
          "  pos = ${savedPosVar};",
          "}",
          {
            elementCode:      emit(node.elements[i], elementResultVars[i]),
            elementResultVar: elementResultVars[i],
            code:             code,
            savedPosVar:      savedPosVar,
            resultVar:        resultVar
          }
        );
      }

      return formatCode(
        "${savedPosVar} = pos;",
        "${code}",
        {
          code:        code,
          savedPosVar: savedPosVar
        }
      );
    },

    labeled: function(node, resultVar) {
      return emit(node.expression, resultVar);
    },

    simple_and: function(node, resultVar) {
      var savedPosVar                 = UID.next("savedPos");
      var savedReportMatchFailuresVar = UID.next("savedReportMatchFailuresVar");
      var expressionResultVar         = UID.next("result");

      return formatCode(
        "${savedPosVar} = pos;",
        "${savedReportMatchFailuresVar} = reportMatchFailures;",
        "reportMatchFailures = false;",
        "${expressionCode}",
        "reportMatchFailures = ${savedReportMatchFailuresVar};",
        "if (${expressionResultVar} !== null) {",
        "  ${resultVar} = '';",
        "  pos = ${savedPosVar};",
        "} else {",
        "  ${resultVar} = null;",
        "}",
        {
          expressionCode:              emit(node.expression, expressionResultVar),
          expressionResultVar:         expressionResultVar,
          savedPosVar:                 savedPosVar,
          savedReportMatchFailuresVar: savedReportMatchFailuresVar,
          resultVar:                   resultVar
        }
      );
    },

    simple_not: function(node, resultVar) {
      var savedPosVar                 = UID.next("savedPos");
      var savedReportMatchFailuresVar = UID.next("savedReportMatchFailuresVar");
      var expressionResultVar         = UID.next("result");

      return formatCode(
        "${savedPosVar} = pos;",
        "${savedReportMatchFailuresVar} = reportMatchFailures;",
        "reportMatchFailures = false;",
        "${expressionCode}",
        "reportMatchFailures = ${savedReportMatchFailuresVar};",
        "if (${expressionResultVar} === null) {",
        "  ${resultVar} = '';",
        "} else {",
        "  ${resultVar} = null;",
        "  pos = ${savedPosVar};",
        "}",
        {
          expressionCode:              emit(node.expression, expressionResultVar),
          expressionResultVar:         expressionResultVar,
          savedPosVar:                 savedPosVar,
          savedReportMatchFailuresVar: savedReportMatchFailuresVar,
          resultVar:                   resultVar
        }
      );
    },

    semantic_and: function(node, resultVar) {
      return formatCode(
        "${resultVar} = (function() {${actionCode}})() ? '' : null;",
        {
          actionCode:  node.code,
          resultVar:   resultVar
        }
      );
    },

    semantic_not: function(node, resultVar) {
      return formatCode(
        "${resultVar} = (function() {${actionCode}})() ? null : '';",
        {
          actionCode:  node.code,
          resultVar:   resultVar
        }
      );
    },

    optional: function(node, resultVar) {
      var expressionResultVar = UID.next("result");

      return formatCode(
        "${expressionCode}",
        "${resultVar} = ${expressionResultVar} !== null ? ${expressionResultVar} : '';",
        {
          expressionCode:      emit(node.expression, expressionResultVar),
          expressionResultVar: expressionResultVar,
          resultVar:           resultVar
        }
      );
    },

    zero_or_more: function(node, resultVar) {
      var expressionResultVar = UID.next("result");

      return formatCode(
        "${resultVar} = [];",
        "${expressionCode}",
        "while (${expressionResultVar} !== null) {",
        "  ${resultVar}.push(${expressionResultVar});",
        "  ${expressionCode}",
        "}",
        {
          expressionCode:      emit(node.expression, expressionResultVar),
          expressionResultVar: expressionResultVar,
          resultVar:           resultVar
        }
      );
    },

    one_or_more: function(node, resultVar) {
      var expressionResultVar = UID.next("result");

      return formatCode(
        "${expressionCode}",
        "if (${expressionResultVar} !== null) {",
        "  ${resultVar} = [];",
        "  while (${expressionResultVar} !== null) {",
        "    ${resultVar}.push(${expressionResultVar});",
        "    ${expressionCode}",
        "  }",
        "} else {",
        "  ${resultVar} = null;",
        "}",
        {
          expressionCode:      emit(node.expression, expressionResultVar),
          expressionResultVar: expressionResultVar,
          resultVar:           resultVar
        }
      );
    },

    action: function(node, resultVar) {
      /*
       * In case of sequences, we splat their elements into function arguments
       * one by one. Example:
       *
       *   start: a:"a" b:"b" c:"c" { alert(arguments.length) }  // => 3
       *
       * This behavior is reflected in this function.
       */

      var expressionResultVar = UID.next("result");
      var formalParams, actualParams;
      if (node.expression.type === "sequence") {
        formalParams = [];
        actualParams = [];

        var elements = node.expression.elements;
        var elementsLength = elements.length;
        for (var i = 0; i < elementsLength; i++) {
          if (elements[i].type === "labeled") {
            formalParams.push(elements[i].label);
            actualParams.push(expressionResultVar + "[" + i + "]");
          }
        }
      } else if (node.expression.type === "labeled") {
        formalParams = [node.expression.label];
        actualParams = [expressionResultVar];
      } else {
        formalParams = [];
        actualParams = [];
      }

      return formatCode(
        "${expressionCode}",
        "${resultVar} = ${expressionResultVar} !== null",
        "  ? (function(${formalParams}) {${actionCode}})(${actualParams})",
        "  : null;",
        {
          expressionCode:      emit(node.expression, expressionResultVar),
          expressionResultVar: expressionResultVar,
          actionCode:          node.code,
          formalParams:        formalParams.join(", "),
          actualParams:        actualParams.join(", "),
          resultVar:           resultVar
        }
      );
    },

    rule_ref: function(node, resultVar) {
      return formatCode(
        "${resultVar} = ${ruleMethod}();",
        {
          ruleMethod: "parse_" + node.name,
          resultVar:  resultVar
        }
      );
    },

    literal: function(node, resultVar) {
      return formatCode(
        "if (input.substr(pos, ${length}) === ${value|string}) {",
        "  ${resultVar} = ${value|string};",
        "  pos += ${length};",
        "} else {",
        "  ${resultVar} = null;",
        "  if (reportMatchFailures) {",
        "    matchFailed(${valueQuoted|string});",
        "  }",
        "}",
        {
          value:       node.value,
          valueQuoted: quote(node.value),
          length:      node.value.length,
          resultVar:   resultVar
        }
      );
    },

    any: function(node, resultVar) {
      return formatCode(
        "if (input.length > pos) {",
        "  ${resultVar} = input.charAt(pos);",
        "  pos++;",
        "} else {",
        "  ${resultVar} = null;",
        "  if (reportMatchFailures) {",
        "    matchFailed('any character');",
        "  }",
        "}",
        { resultVar: resultVar }
      );
    },

    "class": function(node, resultVar) {
      var regexp;
      if (node.parts.length > 0) {
        regexp = "/^["
          + (node.inverted ? "^" : "")
          + map(node.parts, function(part) {
              return part instanceof Array
                ? quoteForRegexpClass(part[0])
                  + "-"
                  + quoteForRegexpClass(part[1])
                : quoteForRegexpClass(part);
            }).join("")
          + "]/";
      } else {
        /*
         * Stupid IE considers regexps /[]/ and /[^]/ syntactically invalid, so
         * we translate them into euqivalents it can handle.
         */
        regexp = node.inverted ? "/^[\\S\\s]/" : "/^(?!)/";
      }

      return formatCode(
        "if (input.substr(pos).match(${regexp}) !== null) {",
        "  ${resultVar} = input.charAt(pos);",
        "  pos++;",
        "} else {",
        "  ${resultVar} = null;",
        "  if (reportMatchFailures) {",
        "    matchFailed(${rawText|string});",
        "  }",
        "}",
        {
          regexp:    regexp,
          rawText:   node.rawText,
          resultVar: resultVar
        }
      );
    }
  });

  return emit(ast);
};
