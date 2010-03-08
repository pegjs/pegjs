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

PEG.Grammar.Rule = function(name, humanName, expression) {
  this._name = name;
  this._humanName = humanName;
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

  if (this._humanName !== null) {
    var setReportMatchFailuresCode = PEG.Compiler.formatCode(
      "var savedReportMatchFailures = context.reportMatchFailures;",
      "context.reportMatchFailures = false;"
    );
    var restoreReportMatchFailuresCode = PEG.Compiler.formatCode(
      "context.reportMatchFailures = savedReportMatchFailures;"
    );
    var reportMatchFailureCode = PEG.Compiler.formatCode(
      "if (context.reportMatchFailures && ${resultVar} === null) {",
      "  this._matchFailed(new PEG.Parser.NamedRuleMatchFailure(${humanName|string}));",
      "}",
      {
        humanName: this._humanName,
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
    "    this._pos += cachedResult.length;",
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
    "    length: this._pos - pos,",
    "    result: ${resultVar}",
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

/* ===== PEG.grammarParser ===== */

var returnFirstArg                   = function() { return arguments[0]; }
var returnSecondArg                  = function() { return arguments[1]; }
var returnSecondArgJoined            = function() { return arguments[1].join(""); }
var returnFirstArgAndSecondArgJoined = function() { return arguments[0] + arguments[1].join(""); }

function characterRule(name, ch) {
  with (PEG.Grammar) {
    return new Rule(
      name,
      null,
      new Action(
        new Sequence([new Literal(ch), new RuleRef("__")]),
        returnFirstArg
      )
    );
  }
}

/* Bootstrapping is really badly needed. */

with (PEG.Grammar) {
  PEG.grammarParser = PEG.buildParser({
    grammar:
      new Rule(
        "grammar",
        null,
        new Action(
          new Sequence([
            new RuleRef("__"),
            new RuleRef("rule"),
            new ZeroOrMore(new RuleRef("rule"))
          ]),
          function(dummy, first, rest) {
            var rules = [first].concat(rest);
            var result = {};
            for (var i = 0; i < rules.length; i++) {
              result[rules[i].getName()] = rules[i];
            }
            return result;
          }
        )
      ),

    rule:
      new Rule(
        "rule",
        null,
        new Action(
          new Sequence([
            new RuleRef("identifier"),
            new Choice([new RuleRef("literal"), new Literal("")]),
            new RuleRef("colon"),
            new RuleRef("expression")
          ]),
          function(name, humanName, dummy, expression) {
            return new PEG.Grammar.Rule(
              name,
              humanName !== "" ? humanName : null,
              expression
            );
          }
        )
      ),

    expression:
      new Rule("expression", null, new RuleRef("choice")),

    choice:
      new Rule(
        "choice",
        null,
        new Action(
          new Sequence([
            new RuleRef("sequence"),
            new ZeroOrMore(
              new Sequence([new RuleRef("slash"), new RuleRef("sequence")])
            )
          ]),
          function(first, rest) {
            return rest.length > 0
              ? new PEG.Grammar.Choice([first].concat(PEG.ArrayUtils.map(
                  rest,
                  function(element) { return element[1]; }
                )))
              : first;
          }
        )
      ),

    sequence:
      new Rule(
        "sequence",
        null,
        new Choice([
          new Action(
            new Sequence([
              new ZeroOrMore(new RuleRef("prefixed")),
              new RuleRef("action")
            ]),
            function(expressions, action) {
              return new PEG.Grammar.Action(
                expressions.length != 1
                  ? new PEG.Grammar.Sequence(expressions)
                  : expressions[0],
                action
              );
            }
          ),
          new Action(
            new ZeroOrMore(new RuleRef("prefixed")),
            function(expressions) {
              return expressions.length != 1
                ? new PEG.Grammar.Sequence(expressions)
                : expressions[0];
            }
          )
        ])
      ),

    prefixed:
      new Rule(
        "prefixed",
        null,
        new Choice([
          new Action(
            new Sequence([new RuleRef("and"), new RuleRef("suffixed")]),
            function(dummy, expression) {
              return new PEG.Grammar.NotPredicate(
                new PEG.Grammar.NotPredicate(expression)
              );
            }
          ),
          new Action(
            new Sequence([new RuleRef("not"), new RuleRef("suffixed")]),
            function(dummy, expression) {
              return new PEG.Grammar.NotPredicate(expression);
            }
          ),
          new RuleRef("suffixed")
        ])
      ),

    suffixed:
      new Rule(
        "suffixed",
        null,
        new Choice([
          new Action(
            new Sequence([new RuleRef("primary"), new RuleRef("question")]),
            function(expression) {
              return new PEG.Grammar.Choice([
                expression,
                new PEG.Grammar.Literal("")
              ]);
            }
          ),
          new Action(
            new Sequence([new RuleRef("primary"), new RuleRef("star")]),
            function(expression) { return new PEG.Grammar.ZeroOrMore(expression); }
          ),
          new Action(
            new Sequence([new RuleRef("primary"), new RuleRef("plus")]),
            function(expression) {
              return new PEG.Grammar.Action(
                new PEG.Grammar.Sequence([
                  expression,
                  new PEG.Grammar.ZeroOrMore(expression)
                ]),
                function(first, rest) { return [first].concat(rest); }
              );
            }
          ),
          new RuleRef("primary")
        ])
      ),

    primary:
      new Rule(
        "primary",
        null,
        new Choice([
          new Action(
            new Sequence([
              new RuleRef("identifier"),
              new NotPredicate(
                new Sequence([
                  new Choice([new RuleRef("literal"), new Literal("")]),
                  new RuleRef("colon")
                ])
              )
            ]),
            function(identifier) { return new PEG.Grammar.RuleRef(identifier); }
          ),
          new Action(
            new RuleRef("literal"),
            function(literal) { return new PEG.Grammar.Literal(literal); }
          ),
          new Action(
            new RuleRef("dot"),
            function() { return new PEG.Grammar.Any(); }
          ),
          new Action(
            new RuleRef("class"),
            function(characters) {
              return new PEG.Grammar.Choice(
                PEG.ArrayUtils.map(
                  characters.split(""),
                  function(character) {
                    return new PEG.Grammar.Literal(character);
                  }
                )
              );
            }
          ),
          new Action(
            new Sequence([
              new RuleRef("lparen"),
              new RuleRef("expression"),
              new RuleRef("rparen")
            ]),
            returnSecondArg
          )
        ])
      ),

    /* "Lexical" elements */

    action:
      new Rule(
        "action",
        "action",
        new Action(
          new Sequence([new RuleRef("braced"), new RuleRef("__")]),
          function(braced) { return braced.substr(1, braced.length - 2); }
        )
      ),

    braced:
      new Rule(
        "braced",
        null,
        new Action(
          new Sequence([
            new Literal("{"),
            new ZeroOrMore(
              new Choice([
                new RuleRef("braced"),
                new RuleRef("nonBraceCharacters")
              ])
            ),
            new Literal("}")
          ]),
          function(leftBrace, parts, rightBrace) {
            return leftBrace + parts.join("") + rightBrace;
          }
        )
      ),

    nonBraceCharacters:
      new Rule(
        "nonBraceCharacters",
        null,
        new Action(
          new Sequence([
            new RuleRef("nonBraceCharacter"),
            new ZeroOrMore(new RuleRef("nonBraceCharacter"))
          ]),
          returnFirstArgAndSecondArgJoined
        )
      ),

    nonBraceCharacter:
      new Rule(
        "nonBraceCharacter",
        null,
        new Action(
          new Sequence([
            new NotPredicate(new Choice([new Literal("{"), new Literal("}")])),
            new Any()
          ]),
          returnSecondArg
        )
      ),

    colon:    characterRule("colon",    ":"),
    slash:    characterRule("slash",    "/"),
    and:      characterRule("and",      "&"),
    not:      characterRule("not",      "!"),
    question: characterRule("question", "?"),
    star:     characterRule("star",     "*"),
    plus:     characterRule("plus",     "+"),
    lparen:   characterRule("lparen",   "("),
    rparen:   characterRule("rparen",   ")"),
    dot:      characterRule("dot",      "."),

    /*
     * Modelled after ECMA-262, 5th ed., 7.6, but much simplified:
     *
     * * no Unicode escape sequences
     *
     * * "Unicode combining marks" and "Unicode connection punctuation" can't
     *   be part of the identifier
     *
     * * only [a-zA-Z] is considered a "Unicode letter"
     *
     * * only [0-9] is considered a "Unicode digit"
     *
     * The simplifications were made just to make the implementation little
     * bit easier, there is no "philosophical" reason behind them.
     */
    identifier:
      new Rule(
        "identifier",
        "identifier",
        new Action(
          new Sequence([
            new Choice([
              new RuleRef("letter"),
              new Literal("_"),
              new Literal("$")
            ]),
            new ZeroOrMore(
              new Choice([
                new RuleRef("letter"),
                new RuleRef("digit"),
                new Literal("_"),
                new Literal("$")
              ])
            ),
            new RuleRef("__")
          ]),
          returnFirstArgAndSecondArgJoined
        )
      ),

    /*
     * Modelled after ECMA-262, 5th ed., 7.8.4. (syntax & semantics, rules only
     * vaguely),
     */
    literal:
      new Rule(
        "literal",
        "literal",
        new Action(
          new Sequence([
            new Choice([
              new RuleRef("doubleQuotedLiteral"),
              new RuleRef("singleQuotedLiteral")
            ]),
            new RuleRef("__")
          ]),
          returnFirstArg
        )
      ),

    doubleQuotedLiteral:
      new Rule(
        "doubleQuotedLiteral",
        null,
        new Action(
          new Sequence([
            new Literal('"'),
            new ZeroOrMore(new RuleRef("doubleQuotedCharacter")),
            new Literal('"')
          ]),
          returnSecondArgJoined
        )
      ),

    doubleQuotedCharacter:
      new Rule(
        "doubleQuotedCharacter",
        null,
        new Choice([
          new RuleRef("simpleDoubleQuotedCharacter"),
          new RuleRef("simpleEscapeSequence"),
          new RuleRef("zeroEscapeSequence"),
          new RuleRef("hexEscapeSequence"),
          new RuleRef("unicodeEscapeSequence"),
          new RuleRef("eolEscapeSequence")
        ])
      ),

    simpleDoubleQuotedCharacter:
      new Rule(
        "simpleDoubleQuotedCharacter",
        null,
        new Action(
          new Sequence([
            new NotPredicate(
              new Choice([
                new Literal('"'),
                new Literal("\\"),
                new RuleRef("eolChar")
              ])
            ),
            new Any()
          ]),
          returnSecondArg
        )
      ),

    singleQuotedLiteral:
      new Rule(
        "singleQuotedLiteral",
        null,
        new Action(
          new Sequence([
            new Literal("'"),
            new ZeroOrMore(new RuleRef("singleQuotedCharacter")),
            new Literal("'")
          ]),
          returnSecondArgJoined
        )
      ),

    singleQuotedCharacter:
      new Rule(
        "singleQuotedCharacter",
        null,
        new Choice([
          new RuleRef("simpleSingleQuotedCharacter"),
          new RuleRef("simpleEscapeSequence"),
          new RuleRef("zeroEscapeSequence"),
          new RuleRef("hexEscapeSequence"),
          new RuleRef("unicodeEscapeSequence"),
          new RuleRef("eolEscapeSequence")
        ])
      ),

    simpleSingleQuotedCharacter:
      new Rule(
        "simpleSingleQuotedCharacter",
        null,
        new Action(
          new Sequence([
            new NotPredicate(
              new Choice([
                new Literal("'"),
                new Literal("\\"),
                new RuleRef("eolChar")
              ])
            ),
            new Any()
          ]),
          returnSecondArg
        )
      ),

    "class":
      new Rule(
        "class",
        "character class",
        new Action(
          new Sequence([
            new Literal("["),
            new ZeroOrMore(
              new Choice([
                new RuleRef("classCharacterRange"),
                new RuleRef("classCharacter")
              ])
            ),
            new Literal("]"),
            new RuleRef("__")
          ]),
          returnSecondArgJoined
        )
      ),

    classCharacterRange:
      new Rule(
        "classCharacterRange",
        null,
        new Action(
          new Sequence([
            new RuleRef("bracketDelimitedCharacter"),
            new Literal("-"),
            new RuleRef("bracketDelimitedCharacter")
          ]),
          function(begin, dummy2, end) {
            var beginCharCode = begin.charCodeAt(0);
            var endCharCode = end.charCodeAt(0);
            if (beginCharCode > endCharCode) {
              throw new PEG.Parser.SyntaxError(
                "Invalid character range: " + begin + "-" + end + "."
              );
            }

            var result = "";

            for (var charCode = beginCharCode; charCode <= endCharCode; charCode++) {
              result += String.fromCharCode(charCode);
            }

            return result;
          }
        )
      ),

    classCharacter:
      new Rule("classCharacter", null, new RuleRef("bracketDelimitedCharacter")),

    bracketDelimitedCharacter:
      new Rule(
        "bracketDelimitedCharacter",
        null,
        new Choice([
          new RuleRef("simpleBracketDelimitedCharacter"),
          new RuleRef("simpleEscapeSequence"),
          new RuleRef("zeroEscapeSequence"),
          new RuleRef("hexEscapeSequence"),
          new RuleRef("unicodeEscapeSequence"),
          new RuleRef("eolEscapeSequence")
        ])
      ),

    simpleBracketDelimitedCharacter:
      new Rule(
        "simpleBracketDelimitedCharacter",
        null,
        new Action(
          new Sequence([
            new NotPredicate(
              new Choice([
                new Literal(']'),
                new Literal("\\"),
                new RuleRef("eolChar")
              ])
            ),
            new Any()
          ]),
          returnSecondArg
        )
      ),

    simpleEscapeSequence:
      new Rule(
        "simpleEscapeSequence",
        null,
        new Action(
          new Sequence([
            new Literal("\\"),
            new NotPredicate(
              new Choice([
                new RuleRef("digit"),
                new Literal("x"),
                new Literal("u"),
                new RuleRef("eolChar")
              ])
            ),
            new Any()
          ]),
          function(dummy1, dummy2, character) {
            return character
              .replace("b", "\b")
              .replace("f", "\f")
              .replace("n", "\n")
              .replace("r", "\r")
              .replace("t", "\t")
              .replace("v", "\v")
          }
        )
      ),

    zeroEscapeSequence:
      new Rule(
        "zeroEscapeSequence",
        null,
        new Action(
          new Sequence([
            new Literal("\\0"),
            new NotPredicate(new RuleRef("digit"))
          ]),
          function() { return "\0" }
        )
      ),

    hexEscapeSequence:
      new Rule(
        "hexEscapeSequence",
        null,
        new Action(
          new Sequence([
            new Literal("\\x"),
            new RuleRef("hexDigit"),
            new RuleRef("hexDigit")
          ]),
          function(dummy, digit1, digit2) {
            return String.fromCharCode(parseInt("0x" + digit1 + digit2));
          }
        )
      ),

    unicodeEscapeSequence:
      new Rule(
        "unicodeEscapeSequence",
        null,
        new Action(
          new Sequence([
            new Literal("\\u"),
            new RuleRef("hexDigit"),
            new RuleRef("hexDigit"),
            new RuleRef("hexDigit"),
            new RuleRef("hexDigit")
          ]),
          function(dummy, digit1, digit2, digit3, digit4) {
            return String.fromCharCode(parseInt(
              "0x" + digit1 + digit2 + digit3 + digit4
            ));
          }
        )
      ),

    eolEscapeSequence:
      new Rule(
        "eolEscapeSequence",
        null,
        new Action(
          new Sequence([new Literal("\\"), new RuleRef("eol")]),
          returnSecondArg
        )
      ),

    digit:
      new Rule(
        "digit",
        null,
        new Choice([
          new Literal("0"),
          new Literal("1"),
          new Literal("2"),
          new Literal("3"),
          new Literal("4"),
          new Literal("5"),
          new Literal("6"),
          new Literal("7"),
          new Literal("8"),
          new Literal("9")
        ])
      ),

    hexDigit:
      new Rule(
        "hexDigit",
        null,
        new Choice([
          new Literal("0"),
          new Literal("1"),
          new Literal("2"),
          new Literal("3"),
          new Literal("4"),
          new Literal("5"),
          new Literal("6"),
          new Literal("7"),
          new Literal("8"),
          new Literal("9"),
          new Literal("a"),
          new Literal("b"),
          new Literal("c"),
          new Literal("d"),
          new Literal("e"),
          new Literal("f"),
          new Literal("A"),
          new Literal("B"),
          new Literal("C"),
          new Literal("D"),
          new Literal("E"),
          new Literal("F")
        ])
      ),

    letter:
      new Rule(
        "letter",
        null,
        new Choice([
          new RuleRef("lowerCaseLetter"),
          new RuleRef("upperCaseLetter")
        ])
      ),

    lowerCaseLetter:
      new Rule(
        "lowerCaseLetter",
        null,
        new Choice([
          new Literal("a"),
          new Literal("b"),
          new Literal("c"),
          new Literal("d"),
          new Literal("e"),
          new Literal("f"),
          new Literal("g"),
          new Literal("h"),
          new Literal("i"),
          new Literal("j"),
          new Literal("k"),
          new Literal("l"),
          new Literal("m"),
          new Literal("n"),
          new Literal("o"),
          new Literal("p"),
          new Literal("q"),
          new Literal("r"),
          new Literal("s"),
          new Literal("t"),
          new Literal("u"),
          new Literal("v"),
          new Literal("w"),
          new Literal("x"),
          new Literal("y"),
          new Literal("z")
        ])
      ),

    upperCaseLetter:
      new Rule(
        "upperCaseLetter",
        null,
        new Choice([
          new Literal("A"),
          new Literal("B"),
          new Literal("C"),
          new Literal("D"),
          new Literal("E"),
          new Literal("F"),
          new Literal("G"),
          new Literal("H"),
          new Literal("I"),
          new Literal("J"),
          new Literal("K"),
          new Literal("L"),
          new Literal("M"),
          new Literal("N"),
          new Literal("O"),
          new Literal("P"),
          new Literal("Q"),
          new Literal("R"),
          new Literal("S"),
          new Literal("T"),
          new Literal("U"),
          new Literal("V"),
          new Literal("W"),
          new Literal("X"),
          new Literal("Y"),
          new Literal("Z")
        ])
      ),

    __:
      new Rule(
        "__",
        null,
        new ZeroOrMore(
          new Choice([new RuleRef("whitespace"), new RuleRef("eol")])
        )
      ),

    /* Modelled after ECMA-262, 5th ed., 7.3. */
    eol:
      new Rule(
        "eol",
        "end of line",
        new Choice([
          new Literal("\n"),
          new Literal("\r\n"),
          new Literal("\r"),
          new Literal("\u2028"),
          new Literal("\u2029")
        ])
      ),

    eolChar:
      new Rule(
        "eolChar",
        null,
        new Choice([
          new Literal("\n"),
          new Literal("\r"),
          new Literal("\u2028"),
          new Literal("\u2029")
        ])
      ),

    /* Modelled after ECMA-262, 5th ed., 7.2. */
    whitespace:
      new Rule(
        "whitespace",
        "whitespace",
        new Choice([
          new Literal(" "),
          new Literal("\t"),
          new Literal("\v"),
          new Literal("\f"),
          new Literal("\xA0"),
          // Should be here, but causes infinite loop in Rhino:
          // new Literal("\uFEFF"),
          new Literal("\u1680"),
          new Literal("\u180E"),
          new Literal("\u2000"),
          new Literal("\u2001"),
          new Literal("\u2002"),
          new Literal("\u2003"),
          new Literal("\u2004"),
          new Literal("\u2005"),
          new Literal("\u2006"),
          new Literal("\u2007"),
          new Literal("\u2008"),
          new Literal("\u2009"),
          new Literal("\u200A"),
          new Literal("\u202F"),
          new Literal("\u205F"),
          new Literal("\u3000")
        ])
      ),
  }, "grammar");
}

})();
