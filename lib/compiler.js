/*
 * PEG.js compiler.
 *
 * The runtime.js file must be included before this file.
 */

(function() {

/* ===== PEG ===== */

/*
 * Generates a parser from a specified grammar and start rule and returns it.
 *
 * The grammar may be either an object or a string. If it is an object, it
 * must contain AST of the parsing expressions (i.e. instances of |PEG.Grammar.*
 * classes| for the grammar rules in its properties. If it is a string, it is
 * parsed using |PEG.grammarParser| to obtain the grammar AST and thus it must
 * be in a format that this parser accepts (see the source code for details).
 *
 * The start rule may be unspecified, in which case "start" is used.
 *
 * Throws |PEG.Grammar.GrammarError| if the grammar definition is not object nor
 * string or if it contains an error. Note that not all errors are detected
 * during the generation and some may protrude to the generated parser and cause
 * its malfunction.
 */
PEG.buildParser = function(grammar, startRule) {
  startRule = startRule || "start";

  switch (typeof(grammar)) {
    case "object":
      var ast = grammar;
      break;
    case "string":
      var ast = PEG.grammarParser.parse(grammar);
      break;
    default:
      throw new PEG.Grammar.GrammarError("Grammar must be object or string.");
  }

  for (var key in ast) {
    ast[key].checkReferencedRulesExist(ast);
  }
  if (ast[startRule] === undefined) {
    throw new PEG.Grammar.GrammarError("Missing \"" + startRule + "\" rule.");
  }

  return PEG.Compiler.compileParser(ast, startRule);
};

/* ===== PEG.Grammar ===== */

/* Namespace with grammar AST nodes. */

PEG.Grammar = {};

/* ===== PEG.GrammarError ===== */

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

PEG.Grammar.Any = function() {};

PEG.Grammar.Sequence = function(elements) { this._elements = elements; };

PEG.Grammar.Choice = function(alternatives) {
  this._alternatives = alternatives;
};

PEG.Grammar.ZeroOrMore = function(element) { this._element = element; };

PEG.Grammar.NotPredicate = function(expression) {
  this._expression = expression;
};

PEG.Grammar.RuleRef = function(name) { this._name = name; };

PEG.Grammar.Action = function(expression, action) {
  this._expression = expression;
  this._action   = action;
};

/* ===== Referenced Rule Existence Checks ===== */

PEG.Grammar.Rule.prototype.checkReferencedRulesExist = function(grammar) {
  this._expression.checkReferencedRulesExist(grammar);
};

PEG.Grammar.Literal.prototype.checkReferencedRulesExist = function(grammar) {};

PEG.Grammar.Any.prototype.checkReferencedRulesExist = function(grammar) {};

PEG.Grammar.Sequence.prototype.checkReferencedRulesExist = function(grammar) {
  PEG.ArrayUtils.each(this._elements, function(element) {
    element.checkReferencedRulesExist(grammar);
  });
};

PEG.Grammar.Choice.prototype.checkReferencedRulesExist = function(grammar) {
  PEG.ArrayUtils.each(this._alternatives, function(alternative) {
    alternative.checkReferencedRulesExist(grammar);
  });
};

PEG.Grammar.ZeroOrMore.prototype.checkReferencedRulesExist = function(grammar) {
  this._element.checkReferencedRulesExist(grammar);
};

PEG.Grammar.NotPredicate.prototype.checkReferencedRulesExist = function(grammar) {
  this._expression.checkReferencedRulesExist(grammar);
};

PEG.Grammar.RuleRef.prototype.checkReferencedRulesExist = function(grammar) {
  if (grammar[this._name] === undefined) {
    throw new PEG.Grammar.GrammarError("Referenced rule \"" + this._name + "\" does not exist.");
  }
};

PEG.Grammar.Action.prototype.checkReferencedRulesExist = function(grammar) {
  this._expression.checkReferencedRulesExist(grammar);
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
    for (var key in grammar) {
      parseFunctionDefinitions.push(grammar[key].compile());
    }

    var source = this.formatCode(
      "(function(){",
      "  var result = new PEG.Parser(${startRule|string});",
      "  ",
      "  ${parseFunctionDefinitions}",
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
      "  this._matchFailed(new PEG.Parser.NamedRuleMatchFailure(${displayName|string}));",
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
    "result._parse_${name} = function(context) {",
    "  this._cache[${name|string}] = this._cache[${name|string}] || [];",
    "  var cachedResult = this._cache[${name|string}][this._pos];",
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
    "  this._cache[${name|string}][pos] = {",
    "    nextPos: this._pos,",
    "    result:  ${resultVar}",
    "  };",
    "  return ${resultVar};",
    "};",
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
    "    this._matchFailed(new PEG.Parser.LiteralMatchFailure(${value|string}));",
    "  }",
    "}",
    {
      value:     this._value,
      length:    this._value.length,
      resultVar: resultVar
    }
  );
};

PEG.Grammar.Any.prototype.compile = function(resultVar) {
  return PEG.Compiler.formatCode(
    "if (this._input.length > this._pos) {",
    "  var ${resultVar} = this._input[this._pos];",
    "  this._pos++;",
    "} else {",
    "  var ${resultVar} = null;",
    "  if (context.reportMatchFailures) {",
    "    this._matchFailed(new PEG.Parser.AnyMatchFailure());",
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

  if (typeof(this._action) === "function") {
    var actionFunction = this._action.toString();
  } else {
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
  }

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
