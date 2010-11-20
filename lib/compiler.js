/* PEG.js compiler. */

(function() {

/* ===== PEG ===== */

/* no var */ PEG = {};

/*
 * Generates a parser from a specified grammar and returns it.
 *
 * The grammar must be a string in the format described by the metagramar in the
 * metagrammar.pegjs file.
 *
 * Throws |PEG.grammarParser.SyntaxError| if the grammar contains a syntax error
 * or |PEG.GrammarError| if it contains a semantic error. Note that not all
 * errors are detected during the generation and some may protrude to the
 * generated parser and cause its malfunction.
 */
PEG.buildParser = function(grammar) {
  return PEG.Compiler.compileParser(PEG.grammarParser.parse(grammar));
};

/* ===== PEG.GrammarError ===== */

/* Thrown when the grammar contains an error. */

PEG.GrammarError = function(message) {
  this.name = "PEG.GrammarError";
  this.message = message;
};

PEG.GrammarError.prototype = Error.prototype;

/* ===== PEG.ArrayUtils ===== */

/* Array manipulation utility functions. */

PEG.ArrayUtils = {
  /*
   * The code needs to be in sync with the code template in the compilation
   * function for "action" nodes.
   */
  contains: function(array, value) {
    /*
     * Stupid IE does not have Array.prototype.indexOf, otherwise this function
     * would be a one-liner.
     */
    var length = array.length;
    for (var i = 0; i < length; i++) {
      if (array[i] === value) {
        return true;
      }
    }
    return false;
  },

  each: function(array, callback) {
    var length = array.length;
    for (var i = 0; i < length; i++) {
      callback(array[i]);
    }
  },

  map: function(array, callback) {
    var result = [];
    var length = array.length;
    for (var i = 0; i < length; i++) {
      result[i] = callback(array[i]);
    }
    return result;
  }
};

/* ===== PEG.StringUtils ===== */

/* String manipulation utility functions. */

PEG.StringUtils = {
  /*
   * Returns a string padded on the left to a desired length with a character.
   *
   * The code needs to be in sync with th code template in the compilation
   * function for "action" nodes.
   */
  padLeft: function(input, padding, length) {
    var result = input;

    var padLength = length - input.length;
    for (var i = 0; i < padLength; i++) {
      result = padding + result;
    }

    return result;
  },

  /*
   * Returns an escape sequence for given character. Uses \x for characters <=
   * 0xFF to save space, \u for the rest.
   *
   * The code needs to be in sync with th code template in the compilation
   * function for "action" nodes.
   */
  escape: function(ch) {
    var charCode = ch.charCodeAt(0);

    if (charCode <= 0xFF) {
      var escapeChar = 'x';
      var length = 2;
    } else {
      var escapeChar = 'u';
      var length = 4;
    }

    return '\\' + escapeChar + PEG.StringUtils.padLeft(charCode.toString(16).toUpperCase(), '0', length);
  },

  /*
   * Surrounds the string with quotes and escapes characters inside so that the
   * result is a valid JavaScript string.
   *
   * The code needs to be in sync with th code template in the compilation
   * function for "action" nodes.
   */
  quote: function(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
     * literal except for the closing quote character, backslash, carriage
     * return, line separator, paragraph separator, and line feed. Any character
     * may appear in the form of an escape sequence.
     */
    return '"' + s
      .replace(/\\/g, '\\\\')        // backslash
      .replace(/"/g, '\\"')          // closing quote character
      .replace(/\r/g, '\\r')         // carriage return
      .replace(/\n/g, '\\n')         // line feed
      .replace(/[\x80-\uFFFF]/g, PEG.StringUtils.escape) // non-ASCII characters
      + '"';
  }

};

/* ===== PEG.RegExpUtils ===== */

/* RegExp manipulation utility functions. */

PEG.RegExpUtils = {
  /*
   * Escapes characters inside the string so that it can be used as a list of
   * characters in a character class of a regular expression.
   */
  quoteForClass: function(s) {
    /* Based on ECMA-262, 5th ed., 7.8.5 & 15.10.1. */
    return s
      .replace(/\\/g, '\\\\')        // backslash
      .replace(/\0/g, '\\0')         // null, IE needs this
      .replace(/\//g, '\\/')         // closing slash
      .replace(/]/g, '\\]')          // closing bracket
      .replace(/-/g, '\\-')          // dash
      .replace(/\r/g, '\\r')         // carriage return
      .replace(/\n/g, '\\n')         // line feed
      .replace(/[\x80-\uFFFF]/g, PEG.StringUtils.escape) // non-ASCII characters
  }
};

/* ===== PEG.Compiler ===== */

PEG.Compiler = {
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
   *   PEG.Compiler.formatCode("foo", "bar");    // "foo\nbar"
   *   PEG.Compiler.formatCode(
   *     "foo", "${bar}",
   *     { bar: "baz" }
   *   );                                        // "foo\nbaz"
   *   PEG.Compiler.formatCode("foo", "${bar}"); // throws Error
   *   PEG.Compiler.formatCode(
   *     "foo", "${bar|string}",
   *     { bar: "baz" }
   *   );                                        // "foo\n\"baz\""
   *   PEG.Compiler.formatCode(
   *     "foo", "${bar|eeek}",
   *     { bar: "baz" }
   *   );                                        // throws Error
   *   PEG.Compiler.formatCode(
   *     "foo", "${bar}",
   *     { bar: "  baz\nqux" }
   *   );                                        // "foo\n  baz\n  qux"
   */
  formatCode: function() {
    function interpolateVariablesInParts(parts) {
      return PEG.ArrayUtils.map(parts, function(part) {
        return part.replace(
          /\$\{([a-zA-Z_][a-zA-Z0-9_]*)(\|([a-zA-Z_][a-zA-Z0-9_]*))?\}/g,
          function(match, name, dummy, filter) {
            var value = vars[name];
            if (typeof(value) === "undefined") {
              throw new Error("Undefined variable: \"" + name + "\".");
            }

            if (typeof(filter) !== "undefined" && filter != "") { // JavaScript engines differ here.
              if (filter === "string") {
                return PEG.StringUtils.quote(value);
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
      return PEG.ArrayUtils.map(parts, function(part) {
        if (!/\n/.test(part)) { return part; }

        var firstLineWhitespacePrefix = part.match(/^\s*/)[0];
        var lines = part.split("\n");
        var linesIndented = [lines[0]].concat(
          PEG.ArrayUtils.map(lines.slice(1), function(line) {
            return firstLineWhitespacePrefix + line;
          })
        );
        return linesIndented.join("\n");
      });
    }

    var args = Array.prototype.slice.call(arguments);
    var vars = args[args.length - 1] instanceof Object ? args.pop() : {};

    return indentMultilineParts(interpolateVariablesInParts(args)).join("\n");
  },

  _uniqueIdentifierCounters: {},

  /*
   * Generates a unique identifier with specified prefix. The sequence of
   * generated identifiers with given prefix is repeatable and will be the same
   * within different language runtimes.
   */
  generateUniqueIdentifier: function(prefix) {
    this._uniqueIdentifierCounters[prefix]
      = this._uniqueIdentifierCounters[prefix] || 0;
    return prefix + this._uniqueIdentifierCounters[prefix]++;
  },

  /*
   * Resets internal counters of the unique identifier generator. The sequence
   * of identifiers with given prefix generated by |generateUniqueIdentifier|
   * will start from the beginning.
   */
  resetUniqueIdentifierCounters: function() {
    this._uniqueIdentifierCounters = {};
  },

  /*
   * Checks made on the grammar AST before compilation. Each check is a function
   * that is passed the AST and does not return anything. If the check passes,
   * the function does not do anything special, otherwise it throws
   * |PEG.GrammarError|. The checks are run in sequence in order of their
   * definition.
   */
  _checks: [
    /* Checks that all referenced rules exist. */
    function(ast) {
      function nop() {}

      function checkExpression(node) { check(node.expression); }

      function checkSubnodes(propertyName) {
        return function(node) {
          PEG.ArrayUtils.each(node[propertyName], check);
        };
      }

      var checkFunctions = {
        grammar:
          function(node) {
            for (var name in node.rules) {
              check(node.rules[name]);
            }
          },

        rule:         checkExpression,
        choice:       checkSubnodes("alternatives"),
        sequence:     checkSubnodes("elements"),
        labeled:      checkExpression,
        simple_and:   checkExpression,
        simple_not:   checkExpression,
        semantic_and: nop,
        semantic_not: nop,
        optional:     checkExpression,
        zero_or_more: checkExpression,
        one_or_more:  checkExpression,
        action:       checkExpression,

        rule_ref:
          function(node) {
            if (typeof(ast.rules[node.name]) === "undefined") {
              throw new PEG.GrammarError(
                "Referenced rule \"" + node.name + "\" does not exist."
              );
            }
          },

        literal:      nop,
        any:          nop,
        "class":      nop
      };

      function check(node) { checkFunctions[node.type](node); }

      check(ast);
    },

    /* Checks that no left recursion is present. */
    function(ast) {
      function nop() {}

      function checkExpression(node, appliedRules) {
        check(node.expression, appliedRules);
      }

      var checkFunctions = {
        grammar:
          function(node, appliedRules) {
            for (var name in node.rules) {
              check(node.rules[name], appliedRules);
            }
          },

        rule:
          function(node, appliedRules) {
            check(node.expression, appliedRules.concat(node.name));
          },

        choice:
          function(node, appliedRules) {
            PEG.ArrayUtils.each(node.alternatives, function(alternative) {
              check(alternative, appliedRules);
            });
          },

        sequence:
          function(node, appliedRules) {
            if (node.elements.length > 0) {
              check(node.elements[0], appliedRules);
            }
          },

        labeled:      checkExpression,
        simple_and:   checkExpression,
        simple_not:   checkExpression,
        semantic_and: nop,
        semantic_not: nop,
        optional:     checkExpression,
        zero_or_more: checkExpression,
        one_or_more:  checkExpression,
        action:       checkExpression,

        rule_ref:
          function(node, appliedRules) {
            if (PEG.ArrayUtils.contains(appliedRules, node.name)) {
              throw new PEG.GrammarError(
                "Left recursion detected for rule \"" + node.name + "\"."
              );
            }
            check(ast.rules[node.name], appliedRules);
          },

        literal:      nop,
        any:          nop,
        "class":      nop
      };

      function check(node, appliedRules) {
        checkFunctions[node.type](node, appliedRules);
      }

      check(ast, []);
    }
  ],

  /*
   * Optimalization passes made on the grammar AST before compilation. Each pass
   * is a function that is passed the AST and returns a new AST. The AST can be
   * modified in-place by the pass. The passes are run in sequence in order of
   * their definition.
   */
  _passes: [
    /*
     * Removes proxy rules -- that is, rules that only delegate to other rule.
     */
    function(ast) {
      function isProxyRule(node) {
        return node.type === "rule" && node.expression.type === "rule_ref";
      }

      function replaceRuleRefs(ast, from, to) {
        function nop() {}

        function replaceInExpression(node, from, to) {
          replace(node.expression, from, to);
        }

        function replaceInSubnodes(propertyName) {
          return function(node, from, to) {
            PEG.ArrayUtils.each(node[propertyName], function(node) {
              replace(node, from, to);
            });
          };
        }

        var replaceFunctions = {
          grammar:
            function(node, from, to) {
              for (var name in node.rules) {
                replace(node.rules[name], from, to);
              }
            },

          rule:         replaceInExpression,
          choice:       replaceInSubnodes("alternatives"),
          sequence:     replaceInSubnodes("elements"),
          labeled:      replaceInExpression,
          simple_and:   replaceInExpression,
          simple_not:   replaceInExpression,
          semantic_and: nop,
          semantic_not: nop,
          optional:     replaceInExpression,
          zero_or_more: replaceInExpression,
          one_or_more:  replaceInExpression,
          action:       replaceInExpression,

          rule_ref:
            function(node, from, to) {
              if (node.name === from) {
                node.name = to;
              }
            },

          literal:      nop,
          any:          nop,
          "class":      nop
        };

        function replace(node, from, to) {
          replaceFunctions[node.type](node, from, to);
        }

        replace(ast, from, to);
      }

      for (var name in ast.rules) {
        if (isProxyRule(ast.rules[name])) {
          replaceRuleRefs(ast, ast.rules[name].name, ast.rules[name].expression.name);
          if (name === ast.startRule) {
            ast.startRule = ast.rules[name].expression.name;
          }
          delete ast.rules[name];
        }
      }

      return ast;
    }
  ],

  _compileFunctions: {
    grammar: function(node) {
      var initializerCode = node.initializer !== null
        ?  PEG.Compiler.compileNode(node.initializer)
        : "";

      var parseFunctionDefinitions = [];
      for (var name in node.rules) {
        parseFunctionDefinitions.push(PEG.Compiler.compileNode(node.rules[name]));
      }

      return PEG.Compiler.formatCode(
        "(function(){",
        "  /* Generated by PEG.js (http://pegjs.majda.cz/). */",
        "  ",
        "  var result = {",
        "    /*",
        "     * Parses the input with a generated parser. If the parsing is successfull,",
        "     * returns a value explicitly or implicitly specified by the grammar from",
        "     * which the parser was generated (see |PEG.buildParser|). If the parsing is",
        "     * unsuccessful, throws |PEG.grammarParser.SyntaxError| describing the error.",
        "     */",
        "    parse: function(input) {",
        "      var pos = 0;",
        "      var rightmostMatchFailuresPos = 0;",
        "      var rightmostMatchFailuresExpected = [];",
        "      var cache = {};",
        "      ",
        /* This needs to be in sync with PEG.StringUtils.padLeft. */
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
        /* This needs to be in sync with PEG.StringUtils.escape. */
        "      function escape(ch) {",
        "        var charCode = ch.charCodeAt(0);",
        "        ",
        "        if (charCode <= 0xFF) {",
        "          var escapeChar = 'x';",
        "          var length = 2;",
        "        } else {",
        "          var escapeChar = 'u';",
        "          var length = 4;",
        "        }",
        "        ",
        "        return '\\\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);",
        "      }",
        "      ",
        /* This needs to be in sync with PEG.StringUtils.quote. */
        "      function quoteString(s) {",
        "        /*",
        "         * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a",
        "         * string literal except for the closing quote character, backslash,",
        "         * carriage return, line separator, paragraph separator, and line feed.",
        "         * Any character may appear in the form of an escape sequence.",
        "         */",
        "        return '\"' + s",
        "          .replace(/\\\\/g, '\\\\\\\\')        // backslash",
        "          .replace(/\"/g, '\\\\\"')          // closing quote character",
        "          .replace(/\\r/g, '\\\\r')         // carriage return",
        "          .replace(/\\u2028/g, '\\\\u2028') // line separator",
        "          .replace(/\\u2029/g, '\\\\u2029') // paragraph separator",
        "          .replace(/\\n/g, '\\\\n')         // line feed",
        "          .replace(/[\\x80-\\uFFFF]/g, escape) // non-ASCII characters",
        "          + '\"';",
        "      }",
        "      ",
        /* This needs to be in sync with PEG.ArrayUtils.contains. */
        "      function arrayContains(array, value) {",
        "        /*",
        "         * Stupid IE does not have Array.prototype.indexOf, otherwise this",
        "         * function would be a one-liner.",
        "         */",
        "        var length = array.length;",
        "        for (var i = 0; i < length; i++) {",
        "          if (array[i] === value) {",
        "            return true;",
        "          }",
        "        }",
        "        return false;",
        "      }",
        "      ",
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
        "        if (!arrayContains(rightmostMatchFailuresExpected, failure)) {",
        "          rightmostMatchFailuresExpected.push(failure);",
        "        }",
        "      }",
        "      ",
        "      ${parseFunctionDefinitions}",
        "      ",
        "      function buildErrorMessage() {",
        "        function buildExpected(failuresExpected) {",
        "          switch (failuresExpected.length) {",
        "            case 0:",
        "              return 'end of input';",
        "            case 1:",
        "              return failuresExpected[0];",
        "            default:",
        "              failuresExpected.sort();",
        "              return failuresExpected.slice(0, failuresExpected.length - 1).join(', ')",
        "                + ' or '",
        "                + failuresExpected[failuresExpected.length - 1];",
        "          }",
        "        }",
        "        ",
        "        var expected = buildExpected(rightmostMatchFailuresExpected);",
        "        var actualPos = Math.max(pos, rightmostMatchFailuresPos);",
        "        var actual = actualPos < input.length",
        "          ? quoteString(input.charAt(actualPos))",
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
        "          } else if (ch === '\\r' | ch === '\\u2028' || ch === '\\u2029') {",
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
        "      var result = parse_${startRule}({ reportMatchFailures: true });",
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
      PEG.Compiler.resetUniqueIdentifierCounters();

      var resultVar = PEG.Compiler.generateUniqueIdentifier("result");

      if (node.displayName !== null) {
        var setReportMatchFailuresCode = PEG.Compiler.formatCode(
          "var savedReportMatchFailures = context.reportMatchFailures;",
          "context.reportMatchFailures = false;"
        );
        var restoreReportMatchFailuresCode = PEG.Compiler.formatCode(
          "context.reportMatchFailures = savedReportMatchFailures;"
        );
        var reportMatchFailureCode = PEG.Compiler.formatCode(
          "if (context.reportMatchFailures && ${resultVar} === null) {",
          "  matchFailed(${displayName|string});",
          "}",
          {
            displayName: node.displayName,
            resultVar:   resultVar
          }
        );
      } else {
        var setReportMatchFailuresCode = "";
        var restoreReportMatchFailuresCode = "";
        var reportMatchFailureCode = "";
      }

      return PEG.Compiler.formatCode(
        "function parse_${name}(context) {",
        "  var cacheKey = ${name|string} + '@' + pos;",
        "  var cachedResult = cache[cacheKey];",
        "  if (cachedResult) {",
        "    pos = cachedResult.nextPos;",
        "    return cachedResult.result;",
        "  }",
        "  ",
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
          code:                           PEG.Compiler.compileNode(node.expression, resultVar),
          resultVar:                      resultVar
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
      var code = PEG.Compiler.formatCode(
        "var ${resultVar} = null;",
        { resultVar: resultVar }
      );

      for (var i = node.alternatives.length - 1; i >= 0; i--) {
        var alternativeResultVar = PEG.Compiler.generateUniqueIdentifier("result");
        code = PEG.Compiler.formatCode(
          "${alternativeCode}",
          "if (${alternativeResultVar} !== null) {",
          "  var ${resultVar} = ${alternativeResultVar};",
          "} else {",
          "  ${code};",
          "}",
          {
            alternativeCode:      PEG.Compiler.compileNode(node.alternatives[i], alternativeResultVar),
            alternativeResultVar: alternativeResultVar,
            code:                 code,
            resultVar:            resultVar
          }
        );
      }

      return code;
    },

    sequence: function(node, resultVar) {
      var savedPosVar = PEG.Compiler.generateUniqueIdentifier("savedPos");

      var elementResultVars = PEG.ArrayUtils.map(node.elements, function() {
        return PEG.Compiler.generateUniqueIdentifier("result")
      });

      var code = PEG.Compiler.formatCode(
        "var ${resultVar} = ${elementResultVarArray};",
        {
          resultVar:             resultVar,
          elementResultVarArray: "[" + elementResultVars.join(", ") + "]"
        }
      );

      for (var i = node.elements.length - 1; i >= 0; i--) {
        code = PEG.Compiler.formatCode(
          "${elementCode}",
          "if (${elementResultVar} !== null) {",
          "  ${code}",
          "} else {",
          "  var ${resultVar} = null;",
          "  pos = ${savedPosVar};",
          "}",
          {
            elementCode:      PEG.Compiler.compileNode(node.elements[i], elementResultVars[i]),
            elementResultVar: elementResultVars[i],
            code:             code,
            savedPosVar:      savedPosVar,
            resultVar:        resultVar
          }
        );
      }

      return PEG.Compiler.formatCode(
        "var ${savedPosVar} = pos;",
        "${code}",
        {
          code:        code,
          savedPosVar: savedPosVar
        }
      );
    },

    labeled: function(node, resultVar) {
      return PEG.Compiler.compileNode(node.expression, resultVar);
    },

    simple_and: function(node, resultVar) {
      var savedPosVar                 = PEG.Compiler.generateUniqueIdentifier("savedPos");
      var savedReportMatchFailuresVar = PEG.Compiler.generateUniqueIdentifier("savedReportMatchFailuresVar");
      var expressionResultVar         = PEG.Compiler.generateUniqueIdentifier("result");

      return PEG.Compiler.formatCode(
        "var ${savedPosVar} = pos;",
        "var ${savedReportMatchFailuresVar} = context.reportMatchFailures;",
        "context.reportMatchFailures = false;",
        "${expressionCode}",
        "context.reportMatchFailures = ${savedReportMatchFailuresVar};",
        "if (${expressionResultVar} !== null) {",
        "  var ${resultVar} = '';",
        "  pos = ${savedPosVar};",
        "} else {",
        "  var ${resultVar} = null;",
        "}",
        {
          expressionCode:              PEG.Compiler.compileNode(node.expression, expressionResultVar),
          expressionResultVar:         expressionResultVar,
          savedPosVar:                 savedPosVar,
          savedReportMatchFailuresVar: savedReportMatchFailuresVar,
          resultVar:                   resultVar
        }
      );
    },

    simple_not: function(node, resultVar) {
      var savedPosVar                 = PEG.Compiler.generateUniqueIdentifier("savedPos");
      var savedReportMatchFailuresVar = PEG.Compiler.generateUniqueIdentifier("savedReportMatchFailuresVar");
      var expressionResultVar         = PEG.Compiler.generateUniqueIdentifier("result");

      return PEG.Compiler.formatCode(
        "var ${savedPosVar} = pos;",
        "var ${savedReportMatchFailuresVar} = context.reportMatchFailures;",
        "context.reportMatchFailures = false;",
        "${expressionCode}",
        "context.reportMatchFailures = ${savedReportMatchFailuresVar};",
        "if (${expressionResultVar} === null) {",
        "  var ${resultVar} = '';",
        "} else {",
        "  var ${resultVar} = null;",
        "  pos = ${savedPosVar};",
        "}",
        {
          expressionCode:              PEG.Compiler.compileNode(node.expression, expressionResultVar),
          expressionResultVar:         expressionResultVar,
          savedPosVar:                 savedPosVar,
          savedReportMatchFailuresVar: savedReportMatchFailuresVar,
          resultVar:                   resultVar
        }
      );
    },

    semantic_and: function(node, resultVar) {
      return PEG.Compiler.formatCode(
        "var ${resultVar} = (function() {${actionCode}})() ? '' : null;",
        {
          actionCode:  node.code,
          resultVar:   resultVar
        }
      );
    },

    semantic_not: function(node, resultVar) {
      return PEG.Compiler.formatCode(
        "var ${resultVar} = (function() {${actionCode}})() ? null : '';",
        {
          actionCode:  node.code,
          resultVar:   resultVar
        }
      );
    },

    optional: function(node, resultVar) {
      var expressionResultVar = PEG.Compiler.generateUniqueIdentifier("result");

      return PEG.Compiler.formatCode(
        "${expressionCode}",
        "var ${resultVar} = ${expressionResultVar} !== null ? ${expressionResultVar} : '';",
        {
          expressionCode:      PEG.Compiler.compileNode(node.expression, expressionResultVar),
          expressionResultVar: expressionResultVar,
          resultVar:           resultVar
        }
      );
    },

    zero_or_more: function(node, resultVar) {
      var expressionResultVar = PEG.Compiler.generateUniqueIdentifier("result");

      return PEG.Compiler.formatCode(
        "var ${resultVar} = [];",
        "${expressionCode}",
        "while (${expressionResultVar} !== null) {",
        "  ${resultVar}.push(${expressionResultVar});",
        "  ${expressionCode}",
        "}",
        {
          expressionCode:      PEG.Compiler.compileNode(node.expression, expressionResultVar),
          expressionResultVar: expressionResultVar,
          resultVar:           resultVar
        }
      );
    },

    one_or_more: function(node, resultVar) {
      var expressionResultVar = PEG.Compiler.generateUniqueIdentifier("result");

      return PEG.Compiler.formatCode(
        "${expressionCode}",
        "if (${expressionResultVar} !== null) {",
        "  var ${resultVar} = [];",
        "  while (${expressionResultVar} !== null) {",
        "    ${resultVar}.push(${expressionResultVar});",
        "    ${expressionCode}",
        "  }",
        "} else {",
        "  var ${resultVar} = null;",
        "}",
        {
          expressionCode:      PEG.Compiler.compileNode(node.expression, expressionResultVar),
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

      var expressionResultVar = PEG.Compiler.generateUniqueIdentifier("result");

      if (node.expression.type === "sequence") {
        var formalParams = [];
        var actualParams = [];

        var elements = node.expression.elements;
        var elementsLength = elements.length;
        for (var i = 0; i < elementsLength; i++) {
          if (elements[i].type === "labeled") {
            formalParams.push(elements[i].label);
            actualParams.push(expressionResultVar + "[" + i + "]");
          }
        }
      } else if (node.expression.type === "labeled") {
        var formalParams = [node.expression.label];
        var actualParams = [expressionResultVar];
      } else {
        var formalParams = [];
        var actualParams = [];
      }

      return PEG.Compiler.formatCode(
        "${expressionCode}",
        "var ${resultVar} = ${expressionResultVar} !== null",
        "  ? (function(${formalParams}) {${actionCode}})(${actualParams})",
        "  : null;",
        {
          expressionCode:      PEG.Compiler.compileNode(node.expression, expressionResultVar),
          expressionResultVar: expressionResultVar,
          actionCode:          node.code,
          formalParams:        formalParams.join(", "),
          actualParams:        actualParams.join(", "),
          resultVar:           resultVar
        }
      );
    },

    rule_ref: function(node, resultVar) {
      return PEG.Compiler.formatCode(
        "var ${resultVar} = ${ruleMethod}(context);",
        {
          ruleMethod: "parse_" + node.name,
          resultVar:  resultVar
        }
      );
    },

    literal: function(node, resultVar) {
      return PEG.Compiler.formatCode(
        "if (input.substr(pos, ${length}) === ${value|string}) {",
        "  var ${resultVar} = ${value|string};",
        "  pos += ${length};",
        "} else {",
        "  var ${resultVar} = null;",
        "  if (context.reportMatchFailures) {",
        "    matchFailed(quoteString(${value|string}));",
        "  }",
        "}",
        {
          value:     node.value,
          length:    node.value.length,
          resultVar: resultVar
        }
      );
    },

    any: function(node, resultVar) {
      return PEG.Compiler.formatCode(
        "if (input.length > pos) {",
        "  var ${resultVar} = input.charAt(pos);",
        "  pos++;",
        "} else {",
        "  var ${resultVar} = null;",
        "  if (context.reportMatchFailures) {",
        "    matchFailed('any character');",
        "  }",
        "}",
        { resultVar: resultVar }
      );
    },

    "class": function(node, resultVar) {
      if (node.parts.length > 0) {
        var regexp = "/^["
          + (node.inverted ? "^" : "")
          + PEG.ArrayUtils.map(node.parts, function(part) {
              return part instanceof Array
                ? PEG.RegExpUtils.quoteForClass(part[0])
                  + "-"
                  + PEG.RegExpUtils.quoteForClass(part[1])
                : PEG.RegExpUtils.quoteForClass(part);
            }).join("")
          + "]/";
      } else {
        /*
         * Stupid IE considers regexps /[]/ and /[^]/ syntactically invalid, so
         * we translate them into euqivalents it can handle.
         */
        var regexp = node.inverted ? "/^[\\S\\s]/" : "/^(?!)/";
      }

      return PEG.Compiler.formatCode(
        "if (input.substr(pos).match(${regexp}) !== null) {",
        "  var ${resultVar} = input.charAt(pos);",
        "  pos++;",
        "} else {",
        "  var ${resultVar} = null;",
        "  if (context.reportMatchFailures) {",
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
  },

  /*
   * Compiles an AST node and returns the generated code. The |resultVar|
   * parameter contains a name of variable in which the match result will be
   * stored in the generated code.
   */
  compileNode: function(node, resultVar) {
    return this._compileFunctions[node.type](node, resultVar);
  },

  /*
   * Generates a parser from a specified grammar AST. Throws |PEG.GrammarError|
   * if the AST contains a semantic error. Note that not all errors are detected
   * during the generation and some may protrude to the generated parser and
   * cause its malfunction.
   */
  compileParser: function(ast) {
    for (var i = 0; i < this._checks.length; i++) {
      this._checks[i](ast);
    }

    for (var i = 0; i < this._passes.length; i++) {
      ast = this._passes[i](ast);
    }

    var source = this.compileNode(ast);
    var result = eval(source);
    result._source = source;

    return result;
  }
};

})();
