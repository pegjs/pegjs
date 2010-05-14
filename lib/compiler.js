/* PEG.js compiler. */

(function() {

function nop() {}

/* ===== PEG ===== */

/* no var */ PEG = {};

/*
 * Generates a parser from a specified grammar and start rule and returns it.
 *
 * The grammar must be a string in the format described by the metagramar in the
 * metagrammar.pegjs file. The start rule may be unspecified, in which case
 * "start" is used.
 *
 * Throws |PEG.grammarParser.SyntaxError| if the grammar contains a syntax error
 * or |PEG.Grammar.GrammarError| if it contains a semantic error. Note that not
 * all errors are detected during the generation and some may protrude to the
 * generated parser and cause its malfunction.
 */
PEG.buildParser = function(grammar, startRule) {
  startRule = startRule || "start";

  return PEG.Compiler.compileParser(
    PEG.grammarParser.parse(grammar),
    startRule
  );
};

/* ===== PEG.ArrayUtils ===== */

/* Array manipulation utility functions. */

PEG.ArrayUtils = {
  /* Like Python's |range|, but without |step|. */
  range: function(start, stop) {
    if (stop === undefined) {
      stop = start;
      start = 0;
    }

    var result = new Array(Math.max(0, stop - start));
    for (var i = 0, j = start; j < stop; i++, j++) {
      result[i] = j;
    }
    return result;
  },

  /*
   * The code needs to be in sync with a code template in
   * PEG.Grammar.Action.prototype.compile.
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
   * Surrounds the string with quotes and escapes characters inside so that the
   * result is a valid JavaScript string.
   *
   * The code needs to be in sync with a code template in
   * PEG.Grammar.Action.prototype.compile.
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
      .replace(/\u2028/g, '\\u2028') // line separator
      .replace(/\u2029/g, '\\u2029') // paragraph separator
      .replace(/\n/g, '\\n')         // line feed
      + '"';
  }

};

/* ===== PEG.RegExpUtils ===== */

/* RegExp manipulation utility functions. */

PEG.RegExpUtils = {
  /*
   * Escapes characters inside the string so that it can be used as a list of
   * characters in a character class of a regular expresion.
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
      .replace(/\u2028/g, '\\u2028') // line separator
      .replace(/\u2029/g, '\\u2029') // paragraph separator
      .replace(/\n/g, '\\n')         // line feed
  }
};

/* ===== PEG.Grammar ===== */

/* Namespace with grammar AST nodes. */

PEG.Grammar = {
  /*
   * Extends specified AST node classes with a function named |name|. The
   * definition of the function is different for each node class and it is
   * specified in the |functions| object, which contains the functions keyed by
   * unqualified AST node names.
   *
   * Example:
   *
   *     PEG.Grammar.extendNodes("foo", {
   *       Literal: function() { return 1; },
   *       Class:   function() { return 2; }
   *     });
   *
   *   This is is equivalent to:
   *
   *     PEG.Grammar.Literal.prototype.foo = function() { return 1; };
   *     PEG.Grammar.Class.prototype.foo   = function() { return 2; };
   */
  extendNodes: function(name, functions) {
    for (var nodeName in functions) {
      PEG.Grammar[nodeName].prototype[name] = functions[nodeName];
    }
  }
};

/* ===== PEG.Grammar.GrammarError ===== */

/* Thrown when the grammar contains an error. */

PEG.Grammar.GrammarError = function(message) {
  this.name = "PEG.Grammar.GrammarError";
  this.message = message;
};

PEG.Grammar.GrammarError.prototype = Error.prototype;

/* ===== PEG.Grammar.* ===== */

PEG.Grammar.Rule = function(name, displayName, expression) {
  this.name = name;
  this.displayName = displayName;
  this.expression = expression;
};

PEG.Grammar.Choice = function(alternatives) {
  this.alternatives = alternatives;
};

PEG.Grammar.Sequence = function(elements) { this.elements = elements; };

PEG.Grammar.AndPredicate = function(expression) {
  this.expression = expression;
};

PEG.Grammar.NotPredicate = function(expression) {
  this.expression = expression;
};

PEG.Grammar.Optional = function(expression) { this.expression = expression; };

PEG.Grammar.ZeroOrMore = function(expression) { this.expression = expression; };

PEG.Grammar.OneOrMore = function(expression) { this.expression = expression; };

PEG.Grammar.Action = function(expression, action) {
  this.expression = expression;
  this.action   = action;
};

PEG.Grammar.RuleRef = function(name) { this.name = name; };

PEG.Grammar.Literal = function(value) { this.value = value; };

PEG.Grammar.Any = function() {};

PEG.Grammar.Class = function(characters) { this.characters = characters; };

/* ===== Referenced Rule Existence Checks ===== */

PEG.Grammar.extendNodes("checkReferencedRulesExist", {
  Rule:
    function(grammar) {
      this.expression.checkReferencedRulesExist(grammar);
    },

  Choice:
    function(grammar) {
      PEG.ArrayUtils.each(this.alternatives, function(alternative) {
        alternative.checkReferencedRulesExist(grammar);
      });
    },

  Sequence:
    function(grammar) {
      PEG.ArrayUtils.each(this.elements, function(element) {
        element.checkReferencedRulesExist(grammar);
      });
    },

  AndPredicate:
    function(grammar) { this.expression.checkReferencedRulesExist(grammar); },

  NotPredicate:
    function(grammar) { this.expression.checkReferencedRulesExist(grammar); },

  Optional:
    function(grammar) { this.expression.checkReferencedRulesExist(grammar); },

  ZeroOrMore:
    function(grammar) { this.expression.checkReferencedRulesExist(grammar); },

  OneOrMore:
    function(grammar) { this.expression.checkReferencedRulesExist(grammar); },

  Action:
    function(grammar) { this.expression.checkReferencedRulesExist(grammar); },

  RuleRef:
    function(grammar) {
      if (grammar[this.name] === undefined) {
        throw new PEG.Grammar.GrammarError(
          "Referenced rule \"" + this.name + "\" does not exist."
        );
      }
    },

  Literal: nop,
  Any:     nop,
  Class:   nop
});


/* ===== Left Recursion Checks ===== */

PEG.Grammar.extendNodes("checkNoLeftRecursion", {
  Rule:
    function(grammar, appliedRules) {
      this.expression.checkNoLeftRecursion(grammar, appliedRules.concat(this.name));
    },

  Choice:
    function(grammar, appliedRules) {
      PEG.ArrayUtils.each(this.alternatives, function(alternative) {
        alternative.checkNoLeftRecursion(grammar, appliedRules);
      });
    },

  Sequence:
    function(grammar, appliedRules) {
      if (this.elements.length > 0) {
        this.elements[0].checkNoLeftRecursion(grammar, appliedRules);
      }
    },

  AndPredicate:
    function(grammar, appliedRules) {
      this.expression.checkNoLeftRecursion(grammar, appliedRules);
    },

  NotPredicate:
    function(grammar, appliedRules) {
      this.expression.checkNoLeftRecursion(grammar, appliedRules);
    },

  Optional:
    function(grammar, appliedRules) {
      this.expression.checkNoLeftRecursion(grammar, appliedRules);
    },

  ZeroOrMore:
    function(grammar, appliedRules) {
      this.expression.checkNoLeftRecursion(grammar, appliedRules);
    },

  OneOrMore:
    function(grammar, appliedRules) {
      this.expression.checkNoLeftRecursion(grammar, appliedRules);
    },

  Action:
    function(grammar, appliedRules) {
      this.expression.checkNoLeftRecursion(grammar, appliedRules);
    },

  RuleRef:
    function(grammar, appliedRules) {
      if (PEG.ArrayUtils.contains(appliedRules, this.name)) {
        throw new PEG.Grammar.GrammarError("Left recursion detected for rule \"" + this.name + "\".");
      }
      grammar[this.name].checkNoLeftRecursion(grammar, appliedRules);
    },

  Literal: nop,
  Any:     nop,
  Class:   nop
});

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
            if (value === undefined) {
              throw new Error("Undefined variable: \"" + name + "\".");
            }

            if (filter !== undefined && filter != "") { // JavaScript engines differ here.
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

  _resetUniqueIdentifierCounters: function() {
    this._uniqueIdentifierCounters = {};
  },

  /* Generates a unique identifier with specified prefix. */
  generateUniqueIdentifier: function(prefix) {
    this._uniqueIdentifierCounters[prefix]
      = this._uniqueIdentifierCounters[prefix] || 0;
    return prefix + this._uniqueIdentifierCounters[prefix]++;
  },

  /*
   * Checks made on the grammar AST before compilation. Each check is a function
   * that is passed the AST and start rule and does not return anything. If the
   * check passes, the function does not do anything special, otherwise it
   * throws |PEG.Grammar.GrammarError|. The checks are run in sequence in order
   * of their definition.
   */
  _checks: [
    /* Checks that all referenced rules exist. */
    function(ast, startRule) {
      for (var rule in ast) {
        ast[rule].checkReferencedRulesExist(ast);
      }
    },

    /* Checks that the start rule is defined. */
    function(ast, startRule) {
      if (ast[startRule] === undefined) {
        throw new PEG.Grammar.GrammarError(
          "Missing \"" + startRule + "\" rule."
        );
      }
    },

    /* Checks that no left recursion is present. */
    function(ast, startRule) {
      for (var rule in ast) {
        ast[rule].checkNoLeftRecursion(ast, []);
      }
    }
  ],

  /*
   * Generates a parser from a specified grammar AST and start rule. Throws
   * |PEG.Grammar.GrammarError| if the AST contains a semantic error. Note that
   * not all errors are detected during the generation and some may protrude to
   * the generated parser and cause its malfunction.
   */
  compileParser: function(ast, startRule) {
    /*
     * This ensures that the same grammar and start rule always generate exactly
     * the same parser.
     */
    this._resetUniqueIdentifierCounters();

    for (var i = 0; i < this._checks.length; i++) {
      this._checks[i](ast, startRule);
    }

    var parseFunctionDefinitions = [];
    for (var rule in ast) {
      parseFunctionDefinitions.push(ast[rule].compile());
    }

    var source = this.formatCode(
      "(function(){",
      "  /* Generated by PEG.js (http://pegjs.majda.cz/). */",
      "  ",
      "  var result = {",
      "    _startRule: ${startRule|string},",
      "    ",
      /* This needs to be in sync with PEG.StringUtils.quote. */
      "    _quoteString: function(s) {",
      "      /*",
      "       * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string",
      "       * literal except for the closing quote character, backslash, carriage",
      "       * return, line separator, paragraph separator, and line feed. Any character",
      "       * may appear in the form of an escape sequence.",
      "       */",
      "      return '\"' + s",
      "        .replace(/\\\\/g, '\\\\\\\\')        // backslash",
      "        .replace(/\"/g, '\\\\\"')          // closing quote character",
      "        .replace(/\\r/g, '\\\\r')         // carriage return",
      "        .replace(/\\u2028/g, '\\\\u2028') // line separator",
      "        .replace(/\\u2029/g, '\\\\u2029') // paragraph separator",
      "        .replace(/\\n/g, '\\\\n')         // line feed",
      "        + '\"';",
      "    },",
      "    ",
      /* This needs to be in sync with PEG.ArrayUtils.contains. */
      "    _arrayContains: function(array, value) {",
      "      /*",
      "       * Stupid IE does not have Array.prototype.indexOf, otherwise this function",
      "       * would be a one-liner.",
      "       */",
      "      var length = array.length;",
      "      for (var i = 0; i < length; i++) {",
      "        if (array[i] === value) {",
      "          return true;",
      "        }",
      "      }",
      "      return false;",
      "    },",
      "    ",
      "    _matchFailed: function(failure) {",
      "      if (this._pos > this._rightmostMatchFailuresPos) {",
      "        this._rightmostMatchFailuresPos = this._pos;",
      "        this._rightmostMatchFailuresExpected = [];",
      "      }",
      "      ",
      "      if (!this._arrayContains(this._rightmostMatchFailuresExpected, failure)) {",
      "        this._rightmostMatchFailuresExpected.push(failure);",
      "      }",
      "    },",
      "    ",
      "    ${parseFunctionDefinitions}",
      "    ",
      "    /*",
      "     * Parses the input with a generated parser. If the parsing is successfull,",
      "     * returns a value explicitly or implicitly specified by the grammar from",
      "     * which the parser was generated (see |PEG.buildParser|). If the parsing is",
      "     * unsuccessful, throws |PEG.grammarParser.SyntaxError| describing the error.",
      "     */",
      "    parse: function(input) {",
      "      var that = this;",
      "      ",
      "      function initialize() {",
      "        that._input = input;",
      "        that._pos = 0;",
      "        that._rightmostMatchFailuresPos = 0;",
      "        that._rightmostMatchFailuresExpected = [];",
      "        that._cache = {};",
      "      }",
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
      "        var expected = buildExpected(that._rightmostMatchFailuresExpected);",
      "        var pos = Math.max(that._pos, that._rightmostMatchFailuresPos);",
      "        var actual = pos < that._input.length",
      "          ? that._quoteString(that._input.charAt(pos))",
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
      "        var input = that._input;",
      "        var pos = that._rightmostMatchFailuresPos;",
      "        var line = 1;",
      "        var column = 1;",
      "        var seenCR = false;",
      "        ",
      "        for (var i = 0; i < pos; i++) {",
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
      "      initialize();",
      "      ",
      "      var initialContext = {",
      "        reportMatchFailures: true",
      "      };",
      "      ",
      "      var result = this['_parse_' + this._startRule](initialContext);",
      "      ",
      "      /*",
      "       * The parser is now in one of the following three states:",
      "       *",
      "       * 1. The parser successfully parsed the whole input.",
      "       *",
      "       *    - |result !== null|",
      "       *    - |that._pos === input.length|",
      "       *    - |that._rightmostMatchFailuresExpected.length| may or may not contain",
      "       *      something",
      "       *",
      "       * 2. The parser successfully parsed only a part of the input.",
      "       *",
      "       *    - |result !== null|",
      "       *    - |that._pos < input.length|",
      "       *    - |that._rightmostMatchFailuresExpected.length| may or may not contain",
      "       *      something",
      "       *",
      "       * 3. The parser did not successfully parse any part of the input.",
      "       *",
      "       *   - |result === null|",
      "       *   - |that._pos === 0|",
      "       *   - |that._rightmostMatchFailuresExpected.length| contains at least one failure",
      "       *",
      "       * All code following this comment (including called functions) must",
      "       * handle these states.",
      "       */",
      "      if (result === null || this._pos !== input.length) {",
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
        parseFunctionDefinitions: parseFunctionDefinitions.join("\n\n"),
        startRule:                startRule
      }
    );

    var result = eval(source);
    result._source = source;
    return result;
  }
};

PEG.Grammar.Rule.prototype.compile = function() {
  var resultVar = PEG.Compiler.generateUniqueIdentifier("result");

  if (this.displayName !== null) {
    var setReportMatchFailuresCode = PEG.Compiler.formatCode(
      "var savedReportMatchFailures = context.reportMatchFailures;",
      "context.reportMatchFailures = false;"
    );
    var restoreReportMatchFailuresCode = PEG.Compiler.formatCode(
      "context.reportMatchFailures = savedReportMatchFailures;"
    );
    var reportMatchFailureCode = PEG.Compiler.formatCode(
      "if (context.reportMatchFailures && ${resultVar} === null) {",
      "  this._matchFailed(${displayName|string});",
      "}",
      {
        displayName: this.displayName,
        resultVar: resultVar
      }
    );
  } else {
    var setReportMatchFailuresCode = "";
    var restoreReportMatchFailuresCode = "";
    var reportMatchFailureCode = "";
  }

  return PEG.Compiler.formatCode(
    "_parse_${name}: function(context) {",
    "  var cacheKey = ${name|string} + '@' + this._pos;",
    "  var cachedResult = this._cache[cacheKey];",
    "  if (cachedResult !== undefined) {",
    "    this._pos = cachedResult.nextPos;",
    "    return cachedResult.result;",
    "  }",
    "  ",
    "  var pos = this._pos;",
    "  ",
    "  ${setReportMatchFailuresCode}",
    "  ${code}",
    "  ${restoreReportMatchFailuresCode}",
    "  ${reportMatchFailureCode}",
    "  ",
    "  this._cache[cacheKey] = {",
    "    nextPos: this._pos,",
    "    result:  ${resultVar}",
    "  };",
    "  return ${resultVar};",
    "},",
    {
      name:                           this.name,
      setReportMatchFailuresCode:     setReportMatchFailuresCode,
      restoreReportMatchFailuresCode: restoreReportMatchFailuresCode,
      reportMatchFailureCode:         reportMatchFailureCode,
      code:                           this.expression.compile(resultVar),
      resultVar:                      resultVar
    }
  );
};

/*
 * The contract for all code fragments generated by the following |compile|
 * methods is as follows:
 *
 * * The code fragment should try to match a part of the input starting with the
 *   position indicated in |this._pos|. That position may point past the end of
 *   the input.
 *
 * * If the code fragment matches the input, it advances |this._pos| after the
 *   matched part of the input and sets variable with a name stored in
 *   |resultVar| to appropriate value, which is always non-null.
 *
 * * If the code fragment does not match the input, it does not change
 *   |this._pos| and it sets a variable with a name stored in |resultVar| to
 *   |null|.
 */

PEG.Grammar.Choice.prototype.compile = function(resultVar) {
  var code = PEG.Compiler.formatCode(
    "var ${resultVar} = null;",
    { resultVar: resultVar }
  );

  for (var i = this.alternatives.length - 1; i >= 0; i--) {
    var alternativeResultVar = PEG.Compiler.generateUniqueIdentifier("result");
    code = PEG.Compiler.formatCode(
      "${alternativeCode}",
      "if (${alternativeResultVar} !== null) {",
      "  var ${resultVar} = ${alternativeResultVar};",
      "} else {",
      "  ${code};",
      "}",
      {
        alternativeCode:      this.alternatives[i].compile(alternativeResultVar),
        alternativeResultVar: alternativeResultVar,
        code:                 code,
        resultVar:            resultVar
      }
    );
  }

  return code;
};

PEG.Grammar.Sequence.prototype.compile = function(resultVar) {
  var savedPosVar = PEG.Compiler.generateUniqueIdentifier("savedPos");

  var elementResultVars = PEG.ArrayUtils.map(this.elements, function() {
    return PEG.Compiler.generateUniqueIdentifier("result")
  });

  var code = PEG.Compiler.formatCode(
    "var ${resultVar} = ${elementResultVarArray};",
    {
      resultVar:             resultVar,
      elementResultVarArray: "[" + elementResultVars.join(", ") + "]"
    }
  );

  for (var i = this.elements.length - 1; i >= 0; i--) {
    code = PEG.Compiler.formatCode(
      "${elementCode}",
      "if (${elementResultVar} !== null) {",
      "  ${code}",
      "} else {",
      "  var ${resultVar} = null;",
      "  this._pos = ${savedPosVar};",
      "}",
      {
        elementCode:      this.elements[i].compile(elementResultVars[i]),
        elementResultVar: elementResultVars[i],
        code:             code,
        savedPosVar:      savedPosVar,
        resultVar:        resultVar
      }
    );
  }

  return PEG.Compiler.formatCode(
    "var ${savedPosVar} = this._pos;",
    "${code}",
    {
      code:        code,
      savedPosVar: savedPosVar
    }
  );
};

PEG.Grammar.AndPredicate.prototype.compile = function(resultVar) {
  var savedPosVar                 = PEG.Compiler.generateUniqueIdentifier("savedPos");
  var savedReportMatchFailuresVar = PEG.Compiler.generateUniqueIdentifier("savedReportMatchFailuresVar");
  var expressionResultVar         = PEG.Compiler.generateUniqueIdentifier("result");

  return PEG.Compiler.formatCode(
    "var ${savedPosVar} = this._pos;",
    "var ${savedReportMatchFailuresVar} = context.reportMatchFailures;",
    "context.reportMatchFailures = false;",
    "${expressionCode}",
    "context.reportMatchFailures = ${savedReportMatchFailuresVar};",
    "if (${expressionResultVar} !== null) {",
    "  var ${resultVar} = '';",
    "  this._pos = ${savedPosVar};",
    "} else {",
    "  var ${resultVar} = null;",
    "}",
    {
      expressionCode:              this.expression.compile(expressionResultVar),
      expressionResultVar:         expressionResultVar,
      savedPosVar:                 savedPosVar,
      savedReportMatchFailuresVar: savedReportMatchFailuresVar,
      resultVar:                   resultVar
    }
  );
};

PEG.Grammar.NotPredicate.prototype.compile = function(resultVar) {
  var savedPosVar                 = PEG.Compiler.generateUniqueIdentifier("savedPos");
  var savedReportMatchFailuresVar = PEG.Compiler.generateUniqueIdentifier("savedReportMatchFailuresVar");
  var expressionResultVar         = PEG.Compiler.generateUniqueIdentifier("result");

  return PEG.Compiler.formatCode(
    "var ${savedPosVar} = this._pos;",
    "var ${savedReportMatchFailuresVar} = context.reportMatchFailures;",
    "context.reportMatchFailures = false;",
    "${expressionCode}",
    "context.reportMatchFailures = ${savedReportMatchFailuresVar};",
    "if (${expressionResultVar} === null) {",
    "  var ${resultVar} = '';",
    "} else {",
    "  var ${resultVar} = null;",
    "  this._pos = ${savedPosVar};",
    "}",
    {
      expressionCode:              this.expression.compile(expressionResultVar),
      expressionResultVar:         expressionResultVar,
      savedPosVar:                 savedPosVar,
      savedReportMatchFailuresVar: savedReportMatchFailuresVar,
      resultVar:                   resultVar
    }
  );
};

PEG.Grammar.Optional.prototype.compile = function(resultVar) {
  var expressionResultVar = PEG.Compiler.generateUniqueIdentifier("result");

  return PEG.Compiler.formatCode(
    "${expressionCode}",
    "var ${resultVar} = ${expressionResultVar} !== null ? ${expressionResultVar} : '';",
    {
      expressionCode:      this.expression.compile(expressionResultVar),
      expressionResultVar: expressionResultVar,
      resultVar:           resultVar
    }
  );
};

PEG.Grammar.ZeroOrMore.prototype.compile = function(resultVar) {
  var expressionResultVar = PEG.Compiler.generateUniqueIdentifier("result");

  return PEG.Compiler.formatCode(
    "var ${resultVar} = [];",
    "${expressionCode}",
    "while (${expressionResultVar} !== null) {",
    "  ${resultVar}.push(${expressionResultVar});",
    "  ${expressionCode}",
    "}",
    {
      expressionCode:      this.expression.compile(expressionResultVar),
      expressionResultVar: expressionResultVar,
      resultVar:           resultVar
    }
  );
};

PEG.Grammar.OneOrMore.prototype.compile = function(resultVar) {
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
      expressionCode:      this.expression.compile(expressionResultVar),
      expressionResultVar: expressionResultVar,
      resultVar:           resultVar
    }
  );
};

PEG.Grammar.Action.prototype.compile = function(resultVar) {
  /*
   * In case of sequences, we splat their elements into function arguments one
   * by one. Example:
   *
   *   start: "a" "b" "c" { alert(arguments.length) }     // => 3
   *
   * This behavior is reflected in this function.
   */

  var expressionResultVar = PEG.Compiler.generateUniqueIdentifier("result");

  if (this.expression instanceof PEG.Grammar.Sequence) {
    var params = PEG.ArrayUtils.map(
      PEG.ArrayUtils.range(1, this.expression.elements.length + 1),
      function(n) { return "$" + n; }
    ).join(", ");

    var invocationCode = PEG.Compiler.formatCode(
      "(function(${params}) { ${action} }).apply(null, ${expressionResultVar})",
      {
        params:              params,
        action:              this.action,
        expressionResultVar: expressionResultVar
      }
    );
  } else {
    var invocationCode = PEG.Compiler.formatCode(
      "(function($1) { ${action} })(${expressionResultVar})",
      {
        action:              this.action,
        expressionResultVar: expressionResultVar
      }
    );
  }

  return PEG.Compiler.formatCode(
    "${expressionCode}",
    "var ${resultVar} = ${expressionResultVar} !== null",
    "  ? ${invocationCode}",
    "  : null;",
    {
      expressionCode:      this.expression.compile(expressionResultVar),
      expressionResultVar: expressionResultVar,
      invocationCode:      invocationCode,
      resultVar:           resultVar
    }
  );
};

PEG.Grammar.RuleRef.prototype.compile = function(resultVar) {
  return PEG.Compiler.formatCode(
    "var ${resultVar} = this.${ruleMethod}(context);",
    {
      ruleMethod: "_parse_" + this.name,
      resultVar:  resultVar
    }
  );
};

PEG.Grammar.Literal.prototype.compile = function(resultVar) {
  return PEG.Compiler.formatCode(
    "if (this._input.substr(this._pos, ${length}) === ${value|string}) {",
    "  var ${resultVar} = ${value|string};",
    "  this._pos += ${length};",
    "} else {",
    "  var ${resultVar} = null;",
    "  if (context.reportMatchFailures) {",
    "    this._matchFailed(this._quoteString(${value|string}));",
    "  }",
    "}",
    {
      value:     this.value,
      length:    this.value.length,
      resultVar: resultVar
    }
  );
};

PEG.Grammar.Any.prototype.compile = function(resultVar) {
  return PEG.Compiler.formatCode(
    "if (this._input.length > this._pos) {",
    "  var ${resultVar} = this._input.charAt(this._pos);",
    "  this._pos++;",
    "} else {",
    "  var ${resultVar} = null;",
    "  if (context.reportMatchFailures) {",
    "    this._matchFailed('any character');",
    "  }",
    "}",
    { resultVar: resultVar }
  );
};


PEG.Grammar.Class.prototype.compile = function(resultVar) {
  /*
   * Stupid IE considers regexps /[]/ and /[^]/ syntactically invalid, so we
   * translate them into euqivalents it can handle.
   */
  if (this.characters === "") {
    var regexp = "/^(?!)/";
  } else if (this.characters === "^") {
    var regexp = "/^[\\S\\s]/";
  } else {
    var regexp = "/^[" + this.characters + "]/";
  }

  return PEG.Compiler.formatCode(
    "if (this._input.substr(this._pos).match(${regexp}) !== null) {",
    "  var ${resultVar} = this._input.charAt(this._pos);",
    "  this._pos++;",
    "} else {",
    "  var ${resultVar} = null;",
    "  if (context.reportMatchFailures) {",
    "    this._matchFailed('[' + ${characters|string} + ']');",
    "  }",
    "}",
    {
      characters: this.characters,
      regexp:     regexp,
      resultVar:  resultVar
    }
  );
};

})();
