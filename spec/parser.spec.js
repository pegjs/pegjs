describe("PEG.js grammar parser", function() {
  var trivialGrammar,
      literalAbcd              = { type: "literal", value: "abcd", ignoreCase: false },
      literalEfgh              = { type: "literal", value: "efgh", ignoreCase: false },
      literalIjkl              = { type: "literal", value: "ijkl", ignoreCase: false },
      optionalLiteral          = { type: "optional",     expression: literalAbcd },
      zeroOrMoreLiteral        = { type: "zero_or_more", expression: literalAbcd },
      oneOrMoreLiteral         = { type: "one_or_more",  expression: literalAbcd },
      simpleNotLiteral         = { type: "simple_not",   expression: literalAbcd },
      textOptionalLiteral      = { type: "text",         expression: optionalLiteral },
      simpleAndOptionalLiteral = { type: "simple_and",   expression: optionalLiteral },
      simpleNotOptionalLiteral = { type: "simple_not",   expression: optionalLiteral },
      semanticAnd              = { type: "semantic_and", code: " code " },
      semanticNot              = { type: "semantic_not", code: " code " },
      labeledAbcd              = { type: "labeled", label: "a",     expression: literalAbcd      },
      labeledEfgh              = { type: "labeled", label: "b",     expression: literalEfgh      },
      labeledIjkl              = { type: "labeled", label: "c",     expression: literalIjkl      },
      labeledSimpleNotLiteral  = { type: "labeled", label: "label", expression: simpleNotLiteral },
      sequenceOfLiterals       = {
        type:     "sequence",
        elements: [literalAbcd, literalEfgh, literalIjkl]
      },
      sequenceOfLabeleds       = {
        type:     "sequence",
        elements: [labeledAbcd, labeledEfgh, labeledIjkl]
      },
      choiceOfLiterals         = {
        type:         "choice",
        alternatives: [literalAbcd, literalEfgh, literalIjkl]
      },
      namedChoiceOfLiterals    = { type:  "named", name: "start rule", expression: choiceOfLiterals };

  function oneRuleGrammar(expression) {
    var initializer = arguments.length > 1 ? arguments[1] : null;

    return {
      type:        "grammar",
      initializer: initializer,
      rules:       [
        {
          type:       "rule",
          name:       "start",
          expression: expression
        }
      ]
    };
  }

  function actionGrammar(code) {
    return oneRuleGrammar({
      type:       "action",
      expression: literalAbcd,
      code:       code
    });
  }

  function ruleRefGrammar(name) {
    return oneRuleGrammar({ type: "rule_ref", name: name });
  }

  function literalGrammar(value) {
    var ignoreCase = arguments.length > 1 ? arguments[1] : false;

    return oneRuleGrammar({
      type:       "literal",
      value:      value,
      ignoreCase: ignoreCase
    });
  }

  function classGrammar(parts, rawText) {
    var inverted   = arguments.length > 2 ? arguments[2] : false,
        ignoreCase = arguments.length > 3 ? arguments[3] : false;

    return oneRuleGrammar({
      type:       "class",
      parts:      parts,
      rawText:    rawText,
      inverted:   inverted,
      ignoreCase: ignoreCase
    });
  }

  beforeEach(function() {
    trivialGrammar = literalGrammar("abcd");

    this.addMatchers({
      toParseAs:     function(expected) {
        var result;

        try {
          result = PEG.parser.parse(this.actual);

          this.message = function() {
            return "Expected " + jasmine.pp(this.actual) + " "
                 + (this.isNot ? "not " : "")
                 + "to parse as " + jasmine.pp(expected) + ", "
                 + "but it parsed as " + jasmine.pp(result) + ".";
          };

          return this.env.equals_(result, expected);
        } catch (e) {
          this.message = function() {
            return "Expected " + jasmine.pp(this.actual) + " "
                 + "to parse as " + jasmine.pp(expected) + ", "
                 + "but it failed to parse with message "
                 + jasmine.pp(e.message) + ".";
          };

          return false;
        }
      },

      toFailToParse: function(details) {
        /*
         * Extracted into a function just to silence JSHint complaining about
         * creating functions in a loop.
         */
        function buildKeyMessage(key, value) {
          return function() {
            return "Expected " + jasmine.pp(this.actual) + " to fail to parse"
                 + (details ? " with details " + jasmine.pp(details) : "") + ", "
                 + "but " + jasmine.pp(key) + " "
                 + "is " + jasmine.pp(value) + ".";
          };
        }

        var result;

        try {
          result = PEG.parser.parse(this.actual);

          this.message = function() {
            return "Expected " + jasmine.pp(this.actual) + " to fail to parse"
                 + (details ? " with details " + jasmine.pp(details) : "") + ", "
                 + "but it parsed as " + jasmine.pp(result) + ".";
          };

          return false;
        } catch (e) {
          /*
           * Should be at the top level but then JSHint complains about bad for
           * in variable.
           */
          var key;

          if (this.isNot) {
            this.message = function() {
              return "Expected " + jasmine.pp(this.actual) + " to parse, "
                   + "but it failed with message "
                   + jasmine.pp(e.message) + ".";
            };
          } else {
            if (details) {
              for (key in details) {
                if (details.hasOwnProperty(key)) {
                  if (!this.env.equals_(e[key], details[key])) {
                    this.message = buildKeyMessage(key, e[key]);

                    return false;
                  }
                }
              }
            }
          }

          return true;
        }
      }
    });
  });

  /* Canonical Grammar is "a = \"abcd\"; b = \"efgh\"; c = \"ijkl\";". */
  it("parses Grammar", function() {
    var ruleA = { type: "rule", name: "a", expression: literalAbcd },
        ruleB = { type: "rule", name: "b", expression: literalEfgh },
        ruleC = { type: "rule", name: "c", expression: literalIjkl };

    expect('a = "abcd"').toParseAs({
      type:        "grammar",
      initializer: null,
      rules:       [ruleA]
    });
    expect('{ code } a = "abcd"').toParseAs({
      type:        "grammar",
      initializer: { type: "initializer", code: " code " },
      rules:       [ruleA]
    });
    expect('a = "abcd"; b = "efgh"; c = "ijkl"').toParseAs({
      type:        "grammar",
      initializer: null,
      rules:       [ruleA, ruleB, ruleC]
    });
  });

  /* Canonical Initializer is "{ code }". */
  it("parses Initializer", function() {
    var grammar = oneRuleGrammar(literalAbcd, {
          type: "initializer",
          code: " code "
        });

    expect('{ code } start = "abcd"' ).toParseAs(grammar);
    expect('{ code }\n; start = "abcd"').toParseAs(grammar);
  });

  /* Canonical Rule is "a: \"abcd\"". */
  it("parses Rule", function() {
    expect('start = "abcd" / "efgh" / "ijkl"').toParseAs(
      oneRuleGrammar(choiceOfLiterals)
    );
    expect('start\n= "abcd" / "efgh" / "ijkl"').toParseAs(
      oneRuleGrammar(choiceOfLiterals)
    );
    expect('start =\n"abcd" / "efgh" / "ijkl"').toParseAs(
      oneRuleGrammar(choiceOfLiterals)
    );
    expect('start "start rule" = "abcd" / "efgh" / "ijkl"').toParseAs(
      oneRuleGrammar(namedChoiceOfLiterals)
    );
    expect('start "start rule"\n= "abcd" / "efgh" / "ijkl"').toParseAs(
      oneRuleGrammar(namedChoiceOfLiterals)
    );
    expect('start = "abcd" / "efgh" / "ijkl"\n;').toParseAs(
      oneRuleGrammar(choiceOfLiterals)
    );
  });

  /* Canonical Expression is "\"abcd\" / \"efgh\" / \"ijkl\"". */
  it("parses Expression", function() {
    expect('start = "abcd" / "efgh" / "ijkl"').toParseAs(
      oneRuleGrammar(choiceOfLiterals)
    );
  });

  /* Canonical Choice is "\"abcd\" / \"efgh\" / \"ijkl\"". */
  it("parses Choice", function() {
    expect('start = "abcd" "efgh" "ijkl"').toParseAs(
      oneRuleGrammar(sequenceOfLiterals)
    );
    expect(
      'start = "abcd" "efgh" "ijkl" / "abcd" "efgh" "ijkl" / "abcd" "efgh" "ijkl"'
    ).toParseAs(oneRuleGrammar({
      type:         "choice",
      alternatives: [sequenceOfLiterals, sequenceOfLiterals, sequenceOfLiterals]
    }));
    expect(
      'start = "abcd" "efgh" "ijkl"\n/ "abcd" "efgh" "ijkl"\n/ "abcd" "efgh" "ijkl"'
    ).toParseAs(oneRuleGrammar({
      type:         "choice",
      alternatives: [sequenceOfLiterals, sequenceOfLiterals, sequenceOfLiterals]
    }));
    expect(
      'start = "abcd" "efgh" "ijkl" /\n"abcd" "efgh" "ijkl" /\n"abcd" "efgh" "ijkl"'
    ).toParseAs(oneRuleGrammar({
      type:         "choice",
      alternatives: [sequenceOfLiterals, sequenceOfLiterals, sequenceOfLiterals]
    }));
  });

  /* Canonical Sequence is "\"abcd\" \"efgh\" \"ijkl\"". */
  it("parses Sequence", function() {
    expect('start = a:"abcd" { code }').toParseAs(
      oneRuleGrammar({ type: "action", expression: labeledAbcd, code: " code " })
    );
    expect('start = a:"abcd"\n{ code }').toParseAs(
      oneRuleGrammar({ type: "action", expression: labeledAbcd, code: " code " })
    );
    expect('start = a:"abcd" b:"efgh" c:"ijkl" { code }').toParseAs(
      oneRuleGrammar({
        type:       "action",
        expression: sequenceOfLabeleds,
        code:       " code "
      })
    );
    expect('start = a:"abcd"\nb:"efgh"\nc:"ijkl" { code }').toParseAs(
      oneRuleGrammar({
        type:       "action",
        expression: sequenceOfLabeleds,
        code:       " code "
      })
    );

    expect('start = a:"abcd"').toParseAs(
      oneRuleGrammar(labeledAbcd)
    );
    expect('start = a:"abcd" b:"efgh" c:"ijkl"').toParseAs(
      oneRuleGrammar(sequenceOfLabeleds)
    );
    expect('start = a:"abcd"\nb:"efgh"\nc:"ijkl"').toParseAs(
      oneRuleGrammar(sequenceOfLabeleds)
    );
  });

  /* Canonical Labeled is "label:\"abcd\"". */
  it("parses Labeled", function() {
    expect('start = label:!"abcd"'  ).toParseAs(oneRuleGrammar(labeledSimpleNotLiteral));
    expect('start = label\n:!"abcd"').toParseAs(oneRuleGrammar(labeledSimpleNotLiteral));
    expect('start = label:\n!"abcd"').toParseAs(oneRuleGrammar(labeledSimpleNotLiteral));
    expect('start = !"abcd"'        ).toParseAs(oneRuleGrammar(simpleNotLiteral));
  });

  /* Canonical Prefixed is "!\"abcd\"". */
  it("parses Prefixed", function() {
    expect('start = $"abcd"?'   ).toParseAs(oneRuleGrammar(textOptionalLiteral));
    expect('start = $\n"abcd"?' ).toParseAs(oneRuleGrammar(textOptionalLiteral));
    expect('start = &{ code }'  ).toParseAs(oneRuleGrammar(semanticAnd));
    expect('start = &\n{ code }').toParseAs(oneRuleGrammar(semanticAnd));
    expect('start = &"abcd"?'   ).toParseAs(oneRuleGrammar(simpleAndOptionalLiteral));
    expect('start = &\n"abcd"?' ).toParseAs(oneRuleGrammar(simpleAndOptionalLiteral));
    expect('start = !{ code }'  ).toParseAs(oneRuleGrammar(semanticNot));
    expect('start = !\n{ code }').toParseAs(oneRuleGrammar(semanticNot));
    expect('start = !"abcd"?'   ).toParseAs(oneRuleGrammar(simpleNotOptionalLiteral));
    expect('start = !\n"abcd"?' ).toParseAs(oneRuleGrammar(simpleNotOptionalLiteral));
    expect('start = "abcd"?'    ).toParseAs(oneRuleGrammar(optionalLiteral));
  });

  /* Canonical Suffixed is "\"abcd\"?". */
  it("parses Suffixed", function() {
    expect('start = "abcd"?'  ).toParseAs(oneRuleGrammar(optionalLiteral));
    expect('start = "abcd"\n?').toParseAs(oneRuleGrammar(optionalLiteral));
    expect('start = "abcd"*'  ).toParseAs(oneRuleGrammar(zeroOrMoreLiteral));
    expect('start = "abcd"\n*').toParseAs(oneRuleGrammar(zeroOrMoreLiteral));
    expect('start = "abcd"+'  ).toParseAs(oneRuleGrammar(oneOrMoreLiteral));
    expect('start = "abcd"\n+').toParseAs(oneRuleGrammar(oneOrMoreLiteral));
    expect('start = "abcd"'   ).toParseAs(literalGrammar("abcd"));
  });

  /* Canonical Primary is "\"abcd\"". */
  it("parses Primary", function() {
    expect('start = a'         ).toParseAs(ruleRefGrammar("a"));
    expect('start = "abcd"'    ).toParseAs(literalGrammar("abcd"));
    expect('start = [a-d]'     ).toParseAs(classGrammar([["a", "d"]], "[a-d]"));
    expect('start = .'         ).toParseAs(oneRuleGrammar({ type: "any" }));
    expect('start = ("abcd")'  ).toParseAs(literalGrammar("abcd"));
    expect('start = (\n"abcd")').toParseAs(literalGrammar("abcd"));
    expect('start = ("abcd"\n)').toParseAs(literalGrammar("abcd"));
  });

  /* The SourceCharacter rule is not tested. */

  /* Canonical WhiteSpace is " ". */
  it("parses WhiteSpace", function() {
    expect('start =\t"abcd"'    ).toParseAs(trivialGrammar);
    expect('start =\x0B"abcd"'  ).toParseAs(trivialGrammar);   // no "\v" in IE
    expect('start =\f"abcd"'    ).toParseAs(trivialGrammar);
    expect('start = "abcd"'     ).toParseAs(trivialGrammar);
    expect('start =\u00A0"abcd"').toParseAs(trivialGrammar);
    expect('start =\uFEFF"abcd"').toParseAs(trivialGrammar);
    expect('start =\u1680"abcd"').toParseAs(trivialGrammar);
  });

  /* Canonical LineTerminator is "\n". */
  it("parses LineTerminator", function() {
    expect('start = "\n"'    ).toFailToParse();
    expect('start = "\r"'    ).toFailToParse();
    expect('start = "\u2028"').toFailToParse();
    expect('start = "\u2029"').toFailToParse();
  });

  /* Canonical LineTerminatorSequence is "\r\n". */
  it("parses LineTerminatorSequence", function() {
    expect('start =\n"abcd"'    ).toParseAs(trivialGrammar);
    expect('start =\r\n"abcd"'  ).toParseAs(trivialGrammar);
    expect('start =\r"abcd"'    ).toParseAs(trivialGrammar);
    expect('start =\u2028"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2029"abcd"').toParseAs(trivialGrammar);
  });

  // Canonical Comment is "/* comment */".
  it("parses Comment", function() {
    expect('start =// comment\n"abcd"' ).toParseAs(trivialGrammar);
    expect('start =/* comment */"abcd"').toParseAs(trivialGrammar);
  });

  // Canonical MultiLineComment is "/* comment */".
  it("parses MultiLineComment", function() {
    expect('start =/**/"abcd"'   ).toParseAs(trivialGrammar);
    expect('start =/*a*/"abcd"'  ).toParseAs(trivialGrammar);
    expect('start =/*aaa*/"abcd"').toParseAs(trivialGrammar);

    expect('start =/**/*/"abcd"').toFailToParse();
  });

  /* Canonical SingleLineComment is "// comment". */
  it("parses SingleLineComment", function() {
    expect('start =//\n"abcd"'   ).toParseAs(trivialGrammar);
    expect('start =//a\n"abcd"'  ).toParseAs(trivialGrammar);
    expect('start =//aaa\n"abcd"').toParseAs(trivialGrammar);
  });

  /* Canonical Action is "{ code }". */
  it("parses Action", function() {
    expect('start = "abcd" { code }').toParseAs(actionGrammar(" code "));

    expect('start = "abcd" { code }\n').toParseAs(actionGrammar(" code "));
  });

  /* Canonical Braced is "{ code }". */
  it("parses Braced", function() {
    expect('start = "abcd" {}'         ).toParseAs(actionGrammar(""));
    expect('start = "abcd" {{a}}'      ).toParseAs(actionGrammar("{a}"));
    expect('start = "abcd" {abcd}'     ).toParseAs(actionGrammar("abcd"));
    expect('start = "abcd" {{a}{b}{c}}').toParseAs(actionGrammar("{a}{b}{c}"));
  });

  /* Canonical NonBraceCharacters is "abcd". */
  it("parses NonBraceCharacters", function() {
    expect('start = "abcd" {a}'  ).toParseAs(actionGrammar("a"));
    expect('start = "abcd" {abc}').toParseAs(actionGrammar("abc"));
  });

  /* Canonical NonBraceCharacter is "a". */
  it("parses NonBraceCharacter", function() {
    expect('start = "abcd" {a}').toParseAs(actionGrammar("a"));

    expect('start = "abcd" {{}').toFailToParse();
    expect('start = "abcd" {}}').toFailToParse();
  });

  /* Canonical Identifier is "a". */
  it("parses Identifier", function() {
    expect('start = a'   ).toParseAs(ruleRefGrammar("a"));
    expect('start = _'   ).toParseAs(ruleRefGrammar("_"));
    expect('start = aa'  ).toParseAs(ruleRefGrammar("aa"));
    expect('start = a0'  ).toParseAs(ruleRefGrammar("a0"));
    expect('start = a_'  ).toParseAs(ruleRefGrammar("a_"));
    expect('start = abcd').toParseAs(ruleRefGrammar("abcd"));
  });

  /* Trivial character class rules are not tested. */

  /* Canonical LiteralMatcher is "\"abcd\"". */
  it("parses LiteralMatcher", function() {
    expect('start = "abcd"' ).toParseAs(literalGrammar("abcd"));
    expect('start = "abcd"i').toParseAs(literalGrammar("abcd", true));
  });

  /* Canonical StringLiteral is "\"abcd\"". */
  it("parses StringLiteral", function() {
    var grammar = oneRuleGrammar({
      type:       "named",
      name:       "abcd",
      expression: literalAbcd
    });

    expect('start "abcd" = "abcd"'  ).toParseAs(grammar);
    expect('start \'abcd\' = "abcd"').toParseAs(grammar);
  });

  /* Canonical DoubleStringCharacter is "a". */
  it("parses DoubleStringCharacter", function() {
    expect('start = "a"'   ).toParseAs(literalGrammar("a"));
    expect('start = "\\n"' ).toParseAs(literalGrammar("\n"));
    expect('start = "\\\n"').toParseAs(literalGrammar(""));

    expect('start = """' ).toFailToParse();
    expect('start = "\\"').toFailToParse();
    expect('start = "\n"').toFailToParse();
  });

  /* Canonical SingleStringCharacter is "a". */
  it("parses SingleStringCharacter", function() {
    expect("start = 'a'"   ).toParseAs(literalGrammar("a"));
    expect("start = '\\n'" ).toParseAs(literalGrammar("\n"));
    expect("start = '\\\n'").toParseAs(literalGrammar(""));

    expect("start = '''" ).toFailToParse();
    expect("start = '\\'").toFailToParse();
    expect("start = '\n'").toFailToParse();
  });

  /* Canonical CharacterClassMatcher is "[a-d]". */
  it("parses CharacterClassMatcher", function() {
    expect('start = []').toParseAs(
      classGrammar([], "[]")
    );
    expect('start = [a-d]').toParseAs(
      classGrammar([["a", "d"]], "[a-d]")
    );
    expect('start = [a]').toParseAs(
      classGrammar(["a"], "[a]")
    );
    expect('start = [a-de-hi-l]').toParseAs(
      classGrammar([["a", "d"], ["e", "h"], ["i", "l"]], "[a-de-hi-l]")
    );
    expect('start = [^a-d]').toParseAs(
      classGrammar([["a", "d"]], "[^a-d]", true, false)
    );
    expect('start = [a-d]i').toParseAs(
      classGrammar([["a", "d"]], "[a-d]i", false, true)
    );
  });

  /* Canonical ClassCharacterRange is "a-d". */
  it("parses ClassCharacterRange", function() {
    expect('start = [a-d]').toParseAs(classGrammar([["a", "d"]], "[a-d]"));

    expect('start = [a-a]').toParseAs(classGrammar([["a", "a"]], "[a-a]"));
    expect('start = [b-a]').toFailToParse({
      message: "Invalid character range: b-a."
    });
  });

  /* Canonical ClassCharacter is "a". */
  it("parses ClassCharacter", function() {
    expect('start = [a]'   ).toParseAs(classGrammar(["a"],  "[a]"));
    expect('start = [\\n]' ).toParseAs(classGrammar(["\n"], "[\\n]"));
    expect('start = [\\\n]').toParseAs(classGrammar([''],   "[\\\n]"));

    expect('start = []]' ).toFailToParse();
    expect('start = [\\]').toFailToParse();
    expect('start = [\n]').toFailToParse();
  });

  /* Canonical LineContinuation is "\\\n". */
  it("parses LineContinuation", function() {
    expect('start = "\\\r\n"').toParseAs(literalGrammar(""));
  });

  /* Canonical EscapeSequence is "n". */
  it("parses EscapeSequence", function() {
    expect('start = "\\n"'    ).toParseAs(literalGrammar("\n"));
    expect('start = "\\0"'    ).toParseAs(literalGrammar("\x00"));
    expect('start = "\\xFF"'  ).toParseAs(literalGrammar("\xFF"));
    expect('start = "\\uFFFF"').toParseAs(literalGrammar("\uFFFF"));

    expect('start = "\\09"').toFailToParse();
  });

  /* Canonical CharacterEscapeSequence is "n". */
  it("parses CharacterEscapeSequence", function() {
    expect('start = "\\n"').toParseAs(literalGrammar("\n"));
    expect('start = "\\a"').toParseAs(literalGrammar("a"));
  });

  /* Canonical SingleEscapeCharacter is "n". */
  it("parses SingleEscapeCharacter", function() {
    expect('start = "\\\'"').toParseAs(literalGrammar("'"));
    expect('start = "\\""' ).toParseAs(literalGrammar('"'));
    expect('start = "\\\\"').toParseAs(literalGrammar("\\"));
    expect('start = "\\b"' ).toParseAs(literalGrammar("\b"));
    expect('start = "\\f"' ).toParseAs(literalGrammar("\f"));
    expect('start = "\\n"' ).toParseAs(literalGrammar("\n"));
    expect('start = "\\r"' ).toParseAs(literalGrammar("\r"));
    expect('start = "\\t"' ).toParseAs(literalGrammar("\t"));
    expect('start = "\\v"' ).toParseAs(literalGrammar("\x0B"));   // no "\v" in IE
  });

  /* Canonical NonEscapeCharacter is "a". */
  it("parses NonEscapeCharacter", function() {
    expect('start = "\\a"').toParseAs(literalGrammar("a"));
  });

  /* The EscapeCharacter rule is not tested. */

  /* Canonical HexEscapeSequence is "xFF". */
  it("parses HexEscapeSequence", function() {
    expect('start = "\\xFF"').toParseAs(literalGrammar("\xFF"));
  });

  /* Canonical UnicodeEscapeSequence is "uFFFF". */
  it("parses UnicodeEscapeSequence", function() {
    expect('start = "\\uFFFF"').toParseAs(literalGrammar("\uFFFF"));
  });

  /* Digit rules are not tested. */

  /* Unicode character category rules are not tested. */

  /* Canonical __ is "\n". */
  it("parses __", function() {
    expect('start ="abcd"'             ).toParseAs(trivialGrammar);
    expect('start = "abcd"'            ).toParseAs(trivialGrammar);
    expect('start =\r\n"abcd"'         ).toParseAs(trivialGrammar);
    expect('start =/* comment */"abcd"').toParseAs(trivialGrammar);
    expect('start =   "abcd"'          ).toParseAs(trivialGrammar);
  });
});
