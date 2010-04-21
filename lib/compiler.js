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

  var ast = PEG.grammarParser.parse(grammar);

  for (var rule in ast) {
    ast[rule].checkReferencedRulesExist(ast);
  }
  if (ast[startRule] === undefined) {
    throw new PEG.Grammar.GrammarError("Missing \"" + startRule + "\" rule.");
  }
  for (var rule in ast) {
    ast[rule].checkNoLeftRecursion(ast, []);
  }

  return PEG.Compiler.compileParser(ast, startRule);
};

/* ===== PEG.ArrayUtils ===== */

/* Array manipulation utility functions. */

PEG.ArrayUtils = {
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
  this._name = name;
  this._displayName = displayName;
  this._expression = expression;
};

PEG.Grammar.Rule.prototype = {
  getName: function() { return this._name; }
};

PEG.Grammar.Literal = function(value) { this._value = value; };

PEG.Grammar.Class = function(characters) { this._characters = characters; };

PEG.Grammar.Any = function() {};

PEG.Grammar.Sequence = function(elements) { this._elements = elements; };

PEG.Grammar.Choice = function(alternatives) {
  this._alternatives = alternatives;
};

PEG.Grammar.Optional = function(element) { this._element = element; };

PEG.Grammar.ZeroOrMore = function(element) { this._element = element; };

PEG.Grammar.OneOrMore = function(element) { this._element = element; };

PEG.Grammar.AndPredicate = function(expression) {
  this._expression = expression;
};

PEG.Grammar.NotPredicate = function(expression) {
  this._expression = expression;
};

PEG.Grammar.RuleRef = function(name) { this._name = name; };

PEG.Grammar.Action = function(expression, action) {
  this._expression = expression;
  this._action   = action;
};

/* ===== Referenced Rule Existence Checks ===== */

PEG.Grammar.extendNodes("checkReferencedRulesExist", {
  Rule:
    function(grammar) {
      this._expression.checkReferencedRulesExist(grammar);
    },

  Literal: nop,
  Class:   nop,
  Any:     nop,

  Sequence:
    function(grammar) {
      PEG.ArrayUtils.each(this._elements, function(element) {
        element.checkReferencedRulesExist(grammar);
      });
    },

  Choice:
    function(grammar) {
      PEG.ArrayUtils.each(this._alternatives, function(alternative) {
        alternative.checkReferencedRulesExist(grammar);
      });
    },

  Optional:
    function(grammar) { this._element.checkReferencedRulesExist(grammar); },

  ZeroOrMore:
    function(grammar) { this._element.checkReferencedRulesExist(grammar); },

  OneOrMore:
    function(grammar) { this._element.checkReferencedRulesExist(grammar); },

  AndPredicate:
    function(grammar) { this._expression.checkReferencedRulesExist(grammar); },

  NotPredicate:
    function(grammar) { this._expression.checkReferencedRulesExist(grammar); },

  RuleRef:
    function(grammar) {
      if (grammar[this._name] === undefined) {
        throw new PEG.Grammar.GrammarError(
          "Referenced rule \"" + this._name + "\" does not exist."
        );
      }
    },

  Action:
    function(grammar) { this._expression.checkReferencedRulesExist(grammar); }
});


/* ===== Left Recursion Checks ===== */

PEG.Grammar.extendNodes("checkNoLeftRecursion", {
  Rule:
    function(grammar, appliedRules) {
      this._expression.checkNoLeftRecursion(grammar, appliedRules.concat(this._name));
    },

  Literal: nop,
  Class:   nop,
  Any:     nop,

  Sequence:
    function(grammar, appliedRules) {
      if (this._elements.length > 0) {
        this._elements[0].checkNoLeftRecursion(grammar, appliedRules);
      }
    },

  Choice:
    function(grammar, appliedRules) {
      PEG.ArrayUtils.each(this._alternatives, function(alternative) {
        alternative.checkNoLeftRecursion(grammar, appliedRules);
      });
    },

  Optional:
    function(grammar, appliedRules) {
      this._element.checkNoLeftRecursion(grammar, appliedRules);
    },

  ZeroOrMore:
    function(grammar, appliedRules) {
      this._element.checkNoLeftRecursion(grammar, appliedRules);
    },

  OneOrMore:
    function(grammar, appliedRules) {
      this._element.checkNoLeftRecursion(grammar, appliedRules);
    },

  AndPredicate:
    function(grammar, appliedRules) {
      this._expression.checkNoLeftRecursion(grammar, appliedRules);
    },

  NotPredicate:
    function(grammar, appliedRules) {
      this._expression.checkNoLeftRecursion(grammar, appliedRules);
    },

  RuleRef:
    function(grammar, appliedRules) {
      if (PEG.ArrayUtils.contains(appliedRules, this._name)) {
        throw new PEG.Grammar.GrammarError("Left recursion detected for rule \"" + this._name + "\".");
      }
      grammar[this._name].checkNoLeftRecursion(grammar, appliedRules);
    },

  Action:
    function(grammar, appliedRules) {
      this._expression.checkNoLeftRecursion(grammar, appliedRules);
    }
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
   * Generates a parser from a specified grammar and start rule.
   */
  compileParser: function(grammar, startRule) {
    /*
     * This ensures that the same grammar and start rule always generate exactly
     * the same parser.
     */
    this._resetUniqueIdentifierCounters();

    var parseFunctionDefinitions = [];
    for (var rule in grammar) {
      parseFunctionDefinitions.push(grammar[rule].compile());
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

  if (this._displayName !== null) {
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
        displayName: this._displayName,
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
      name:                           this._name,
      setReportMatchFailuresCode:     setReportMatchFailuresCode,
      restoreReportMatchFailuresCode: restoreReportMatchFailuresCode,
      reportMatchFailureCode:         reportMatchFailureCode,
      code:                           this._expression.compile(resultVar),
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
      value:     this._value,
      length:    this._value.length,
      resultVar: resultVar
    }
  );
};

PEG.Grammar.Class.prototype.compile = function(resultVar) {
  /*
   * Stupid IE considers regexps /[]/ and /[^]/ syntactically invalid, so we
   * translate them into euqivalents it can handle.
   */
  if (this._characters === "") {
    var regexp = "/^(?!)/";
  } else if (this._characters === "^") {
    var regexp = "/^[\\S\\s]/";
  } else {
    var regexp = "/^[" + this._characters + "]/";
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
      characters: this._characters,
      regexp:     regexp,
      resultVar:  resultVar
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

PEG.Grammar.Sequence.prototype.compile = function(resultVar) {
  var savedPosVar = PEG.Compiler.generateUniqueIdentifier("savedPos");

  var elementResultVars = PEG.ArrayUtils.map(this._elements, function() {
    return PEG.Compiler.generateUniqueIdentifier("result")
  });

  var code = PEG.Compiler.formatCode(
    "var ${resultVar} = ${elementResultVarArray};",
    {
      resultVar:             resultVar,
      elementResultVarArray: "[" + elementResultVars.join(", ") + "]"
    }
  );

  for (var i = this._elements.length - 1; i >= 0; i--) {
    code = PEG.Compiler.formatCode(
      "${elementCode}",
      "if (${elementResultVar} !== null) {",
      "  ${code}",
      "} else {",
      "  var ${resultVar} = null;",
      "  this._pos = ${savedPosVar};",
      "}",
      {
        elementCode:      this._elements[i].compile(elementResultVars[i]),
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

PEG.Grammar.Choice.prototype.compile = function(resultVar) {
  var code = PEG.Compiler.formatCode(
    "var ${resultVar} = null;",
    { resultVar: resultVar }
  );

  for (var i = this._alternatives.length - 1; i >= 0; i--) {
    var alternativeResultVar = PEG.Compiler.generateUniqueIdentifier("result");
    code = PEG.Compiler.formatCode(
      "${alternativeCode}",
      "if (${alternativeResultVar} !== null) {",
      "  var ${resultVar} = ${alternativeResultVar};",
      "} else {",
      "  ${code};",
      "}",
      {
        alternativeCode:      this._alternatives[i].compile(alternativeResultVar),
        alternativeResultVar: alternativeResultVar,
        code:                 code,
        resultVar:            resultVar
      }
    );
  }

  return code;
};

PEG.Grammar.Optional.prototype.compile = function(resultVar) {
  var elementResultVar = PEG.Compiler.generateUniqueIdentifier("result");

  return PEG.Compiler.formatCode(
    "${elementCode}",
    "var ${resultVar} = ${elementResultVar} !== null ? ${elementResultVar} : '';",
    {
      elementCode:      this._element.compile(elementResultVar),
      elementResultVar: elementResultVar,
      resultVar:        resultVar
    }
  );
};

PEG.Grammar.ZeroOrMore.prototype.compile = function(resultVar) {
  var elementResultVar = PEG.Compiler.generateUniqueIdentifier("result");

  return PEG.Compiler.formatCode(
    "var ${resultVar} = [];",
    "${elementCode}",
    "while (${elementResultVar} !== null) {",
    "  ${resultVar}.push(${elementResultVar});",
    "  ${elementCode}",
    "}",
    {
      elementCode:      this._element.compile(elementResultVar),
      elementResultVar: elementResultVar,
      resultVar:        resultVar
    }
  );
};

PEG.Grammar.OneOrMore.prototype.compile = function(resultVar) {
  var elementResultVar = PEG.Compiler.generateUniqueIdentifier("result");

  return PEG.Compiler.formatCode(
    "${elementCode}",
    "if (${elementResultVar} !== null) {",
    "  var ${resultVar} = [];",
    "  while (${elementResultVar} !== null) {",
    "    ${resultVar}.push(${elementResultVar});",
    "    ${elementCode}",
    "  }",
    "} else {",
    "  var ${resultVar} = null;",
    "}",
    {
      elementCode:      this._element.compile(elementResultVar),
      elementResultVar: elementResultVar,
      resultVar:        resultVar
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
      expressionCode:              this._expression.compile(expressionResultVar),
      expressionResultVar:         expressionResultVar,
      savedPosVar:                 savedPosVar,
      savedReportMatchFailuresVar: savedReportMatchFailuresVar,
      resultVar:                   resultVar
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
      expressionCode:              this._expression.compile(expressionResultVar),
      expressionResultVar:         expressionResultVar,
      savedPosVar:                 savedPosVar,
      savedReportMatchFailuresVar: savedReportMatchFailuresVar,
      resultVar:                   resultVar
    }
  );
};

PEG.Grammar.RuleRef.prototype.compile = function(resultVar) {
  return PEG.Compiler.formatCode(
    "var ${resultVar} = this.${ruleMethod}(context);",
    {
      ruleMethod: "_parse_" + this._name,
      resultVar:  resultVar
    }
  );
};

PEG.Grammar.Action.prototype.compile = function(resultVar) {
  var expressionResultVar = PEG.Compiler.generateUniqueIdentifier("result");

  var actionCode = this._action.replace(
    /\$(\d+)/g,
    function(match, digits) {
      return PEG.Compiler.formatCode(
        "(arguments[${index}])",
        { index: parseInt(digits) - 1 }
      );
    }
  )
  var actionFunction = PEG.Compiler.formatCode(
    "function() { ${actionCode} }",
    { actionCode: actionCode }
  );

  /*
   * In case of sequences, we splat their elements into function arguments one
   * by one. Example:
   *
   *   start: "a" "b" "c" { alert(arguments.length) }     // => "3"
   */
  var invokeFunctionName = this._expression instanceof PEG.Grammar.Sequence
    ? "apply"
    : "call";

  return PEG.Compiler.formatCode(
    "${expressionCode}",
    "var ${resultVar} = ${expressionResultVar} !== null",
    "  ? (${actionFunction}).${invokeFunctionName}(this, ${expressionResultVar})",
    "  : null;",
    {
      expressionCode:      this._expression.compile(expressionResultVar),
      expressionResultVar: expressionResultVar,
      actionFunction:      actionFunction,
      invokeFunctionName:  invokeFunctionName,
      resultVar:           resultVar
    }
  );
};

})();
