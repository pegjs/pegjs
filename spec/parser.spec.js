describe("PEG.js grammar parser", function() {
  var trivialGrammar,
      literalAbcd        = { type: "literal", value: "abcd", ignoreCase: false },
      literalEfgh        = { type: "literal", value: "efgh", ignoreCase: false },
      literalIjkl        = { type: "literal", value: "ijkl", ignoreCase: false },
      optionalLiteral    = { type: "optional",   expression: literalAbcd },
      simpleNotLiteral   = { type: "simple_not", expression: literalAbcd },
      labeledAbcd        = { type: "labeled", label: "a", expression: literalAbcd },
      labeledEfgh        = { type: "labeled", label: "b", expression: literalEfgh },
      labeledIjkl        = { type: "labeled", label: "c", expression: literalIjkl },
      sequenceEmpty      = { type: "sequence", elements: [] },
      sequenceOfLiterals = {
        type:     "sequence",
        elements: [literalAbcd, literalEfgh, literalIjkl]
      },
      sequenceOfLabeleds = {
        type:     "sequence",
        elements: [labeledAbcd, labeledEfgh, labeledIjkl]
      },
      choiceOfLiterals = {
        type:         "choice",
        alternatives: [literalAbcd, literalEfgh, literalIjkl]
      };

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

  /* Canonical grammar is "a = \"abcd\"; b = \"efgh\"; c = \"ijkl\";". */
  it("parses grammar", function() {
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

  /* Canonical initializer is "{ code }". */
  it("parses initializer", function() {
    var grammar = oneRuleGrammar(literalAbcd, {
          type: "initializer",
          code: " code "
        });

    expect('{ code } start = "abcd"' ).toParseAs(grammar);
    expect('{ code }; start = "abcd"').toParseAs(grammar);
  });

  /* Canonical rule is "a: \"abcd\"". */
  it("parses rule", function() {
    expect('start = "abcd" / "efgh" / "ijkl"').toParseAs(
      oneRuleGrammar(choiceOfLiterals)
    );
    expect('start "start rule" = "abcd" / "efgh" / "ijkl"').toParseAs(
      oneRuleGrammar({
        type:       "named",
        name:       "start rule",
        expression: choiceOfLiterals
      })
    );
    expect('start = "abcd" / "efgh" / "ijkl";').toParseAs(
      oneRuleGrammar(choiceOfLiterals)
    );
  });

  /* Canonical expression is "\"abcd\" / \"efgh\" / \"ijkl\"". */
  it("parses expression", function() {
    expect('start = "abcd" / "efgh" / "ijkl"').toParseAs(
      oneRuleGrammar(choiceOfLiterals)
    );
  });

  /* Canonical choice is "\"abcd\" / \"efgh\" / \"ijkl\"". */
  it("parses choice", function() {
    expect('start = "abcd" "efgh" "ijkl"').toParseAs(
      oneRuleGrammar(sequenceOfLiterals)
    );
    expect(
      'start = "abcd" "efgh" "ijkl" / "abcd" "efgh" "ijkl" / "abcd" "efgh" "ijkl"'
    ).toParseAs(oneRuleGrammar({
      type:         "choice",
      alternatives: [sequenceOfLiterals, sequenceOfLiterals, sequenceOfLiterals]
    }));
  });

  /* Canonical sequence is "\"abcd\" \"efgh\" \"ijkl\"". */
  it("parses sequence", function() {
    expect('start = { code }').toParseAs(
      oneRuleGrammar({
        type:       "action",
        expression: sequenceEmpty,
        code:       " code "
      })
    );
    expect('start = a:"abcd" { code }').toParseAs(
      oneRuleGrammar({ type: "action", expression: labeledAbcd, code: " code " })
    );
    expect('start = a:"abcd" b:"efgh" c:"ijkl" { code }').toParseAs(
      oneRuleGrammar({
        type:       "action",
        expression: sequenceOfLabeleds,
        code:       " code "
      })
    );

    expect('start = ').toParseAs(
      oneRuleGrammar(sequenceEmpty)
    );
    expect('start = a:"abcd"').toParseAs(
      oneRuleGrammar(labeledAbcd)
    );
    expect('start = a:"abcd" b:"efgh" c:"ijkl"').toParseAs(
      oneRuleGrammar(sequenceOfLabeleds)
    );
  });

  /* Canonical labeled is "label:\"abcd\"". */
  it("parses labeled", function() {
    expect('start = label:!"abcd"').toParseAs(oneRuleGrammar({
      type:       "labeled",
      label:      "label",
      expression: simpleNotLiteral
    }));
    expect('start = !"abcd"'      ).toParseAs(oneRuleGrammar(simpleNotLiteral));
  });

  /* Canonical prefixed is "!\"abcd\"". */
  it("parses prefixed", function() {
    expect('start = $"abcd"?' ).toParseAs(oneRuleGrammar({
      type:       "text",
      expression: optionalLiteral
    }));
    expect('start = &{ code }').toParseAs(oneRuleGrammar({
      type: "semantic_and",
      code: " code "
    }));
    expect('start = &"abcd"?' ).toParseAs(oneRuleGrammar({
      type:       "simple_and",
      expression: optionalLiteral
    }));
    expect('start = !{ code }').toParseAs(oneRuleGrammar({
      type: "semantic_not",
      code: " code "
    }));
    expect('start = !"abcd"?' ).toParseAs(oneRuleGrammar({
      type:       "simple_not",
      expression: optionalLiteral
    }));
    expect('start = "abcd"?'  ).toParseAs(oneRuleGrammar(optionalLiteral));
  });

  /* Canonical suffixed is "\"abcd\"?". */
  it("parses suffixed", function() {
    expect('start = "abcd"?').toParseAs(oneRuleGrammar(optionalLiteral));
    expect('start = "abcd"*').toParseAs(oneRuleGrammar({
      type:       "zero_or_more",
      expression: literalAbcd
    }));
    expect('start = "abcd"+').toParseAs(oneRuleGrammar({
      type:       "one_or_more",
      expression: literalAbcd
    }));
    expect('start = "abcd"' ).toParseAs(literalGrammar("abcd"));
  });

  /* Canonical primary is "\"abcd\"". */
  it("parses primary", function() {
    expect('start = a'       ).toParseAs(ruleRefGrammar("a"));
    expect('start = "abcd"'  ).toParseAs(literalGrammar("abcd"));
    expect('start = [a-d]'   ).toParseAs(classGrammar([["a", "d"]], "[a-d]"));
    expect('start = .'       ).toParseAs(oneRuleGrammar({ type: "any" }));
    expect('start = ("abcd")').toParseAs(literalGrammar("abcd"));
  });

  /* Canonical action is "{ code }". */
  it("parses action", function() {
    expect('start = "abcd" { code }').toParseAs(actionGrammar(" code "));

    expect('start = "abcd" { code }\n').toParseAs(actionGrammar(" code "));
  });

  /* Canonical braced is "{ code }". */
  it("parses braced", function() {
    expect('start = "abcd" {}'         ).toParseAs(actionGrammar(""));
    expect('start = "abcd" {{a}}'      ).toParseAs(actionGrammar("{a}"));
    expect('start = "abcd" {abcd}'     ).toParseAs(actionGrammar("abcd"));
    expect('start = "abcd" {{a}{b}{c}}').toParseAs(actionGrammar("{a}{b}{c}"));
  });

  /* Canonical nonBraceCharacters is "abcd". */
  it("parses nonBraceCharacters", function() {
    expect('start = "abcd" {a}'  ).toParseAs(actionGrammar("a"));
    expect('start = "abcd" {abc}').toParseAs(actionGrammar("abc"));
  });

  /* Canonical nonBraceCharacter is "a". */
  it("parses nonBraceCharacter", function() {
    expect('start = "abcd" {a}').toParseAs(actionGrammar("a"));

    expect('start = "abcd" {{}').toFailToParse();
    expect('start = "abcd" {}}').toFailToParse();
  });

  /* Trivial character rules are not tested. */

  /* Canonical identifier is "a". */
  it("parses identifier", function() {
    expect('start = a'   ).toParseAs(ruleRefGrammar("a"));
    expect('start = _'   ).toParseAs(ruleRefGrammar("_"));
    expect('start = aa'  ).toParseAs(ruleRefGrammar("aa"));
    expect('start = a0'  ).toParseAs(ruleRefGrammar("a0"));
    expect('start = a_'  ).toParseAs(ruleRefGrammar("a_"));
    expect('start = abcd').toParseAs(ruleRefGrammar("abcd"));

    expect('start = a\n').toParseAs(ruleRefGrammar("a"));
  });

  /* Canonical literal is "\"abcd\"". */
  it("parses literal", function() {
    expect('start = "abcd"' ).toParseAs(literalGrammar("abcd"));
    expect("start = 'abcd'" ).toParseAs(literalGrammar("abcd"));

    expect('start = "abcd"i').toParseAs(literalGrammar("abcd", true));

    expect('start = "abcd"\n').toParseAs(literalGrammar("abcd"));
  });

  /* Canonical string is "\"abcd\"". */
  it("parses string", function() {
    var grammar = oneRuleGrammar({
      type:       "named",
      name:       "abcd",
      expression: literalAbcd
    });

    expect('start "abcd" = "abcd"'  ).toParseAs(grammar);
    expect('start \'abcd\' = "abcd"').toParseAs(grammar);

    expect('start "abcd"\n= "abcd"').toParseAs(grammar);
  });

  /* Canonical doubleQuotedString is "\"abcd\"". */
  it("parses doubleQuotedString", function() {
    expect('start = ""'   ).toParseAs(literalGrammar(""));
    expect('start = "a"'  ).toParseAs(literalGrammar("a"));
    expect('start = "abc"').toParseAs(literalGrammar("abc"));
  });

  /* Canonical doubleQuotedCharacter is "a". */
  it("parses doubleQuotedCharacter", function() {
    expect('start = "a"'      ).toParseAs(literalGrammar("a"));
    expect('start = "\\n"'    ).toParseAs(literalGrammar("\n"));
    expect('start = "\\0"'    ).toParseAs(literalGrammar("\x00"));
    expect('start = "\\xFF"'  ).toParseAs(literalGrammar("\xFF"));
    expect('start = "\\uFFFF"').toParseAs(literalGrammar("\uFFFF"));
    expect('start = "\\\n"'   ).toParseAs(literalGrammar("\n"));
  });

  /* Canonical simpleDoubleQuotedCharacter is "a". */
  it("parses simpleDoubleQuotedCharacter", function() {
    expect('start = "a"').toParseAs(literalGrammar("a"));

    expect('start = """' ).toFailToParse();
    expect('start = "\\"').toFailToParse();
    expect('start = "\n"').toFailToParse();
  });

  /* Canonical singleQuotedString is "'abcd'". */
  it("parses singleQuotedString", function() {
    expect("start = ''"   ).toParseAs(literalGrammar(""));
    expect("start = 'a'"  ).toParseAs(literalGrammar("a"));
    expect("start = 'abc'").toParseAs(literalGrammar("abc"));
  });

  /* Canonical singleQuotedCharacter is "a". */
  it("parses singleQuotedCharacter", function() {
    expect("start = 'a'"      ).toParseAs(literalGrammar("a"));
    expect("start = '\\n'"    ).toParseAs(literalGrammar("\n"));
    expect("start = '\\0'"    ).toParseAs(literalGrammar("\x00"));
    expect("start = '\\xFF'"  ).toParseAs(literalGrammar("\xFF"));
    expect("start = '\\uFFFF'").toParseAs(literalGrammar("\uFFFF"));
    expect("start = '\\\n'"   ).toParseAs(literalGrammar("\n"));
  });

  /* Canonical simpleSingleQuotedCharacter is "a". */
  it("parses simpleSingleQuotedCharacter", function() {
    expect("start = 'a'").toParseAs(literalGrammar("a"));

    expect("start = '''" ).toFailToParse();
    expect("start = '\\'").toFailToParse();
    expect("start = '\n'").toFailToParse();
  });

  /* Canonical class is "[a-d]". */
  it("parses class", function() {
    expect('start = []'         ).toParseAs(classGrammar([],           "[]"));
    expect('start = [a-d]'      ).toParseAs(classGrammar([["a", "d"]], "[a-d]"));
    expect('start = [a]'        ).toParseAs(classGrammar(["a"],        "[a]"));
    expect('start = [a-de-hi-l]').toParseAs(
      classGrammar([["a", "d"], ["e", "h"], ["i", "l"]], "[a-de-hi-l]")
    );

    expect('start = [^a-d]').toParseAs(
      classGrammar([["a", "d"]], "[^a-d]", true, false)
    );
    expect('start = [a-d]i').toParseAs(
      classGrammar([["a", "d"]], "[a-d]i", false, true)
    );

    expect('start = [\u0080\u0081\u0082]').toParseAs(
      classGrammar(["\u0080", "\u0081", "\u0082"], "[\\x80\\x81\\x82]")
    );

    expect('start = [a-d]\n').toParseAs(classGrammar([["a", "d"]], "[a-d]"));
  });

  /* Canonical classCharacterRange is "a-d". */
  it("parses classCharacterRange", function() {
    expect('start = [a-d]').toParseAs(classGrammar([["a", "d"]], "[a-d]"));
    expect('start = [a-a]').toParseAs(classGrammar([["a", "a"]], "[a-a]"));

    expect('start = [b-a]').toFailToParse({
      message: "Invalid character range: b-a."
    });
    expect('start = [\u0081-\u0080]').toFailToParse({
      message: "Invalid character range: \\x81-\\x80."
    });
  });

  /* Canonical classCharacter is "a". */
  it("parses classCharacter", function() {
    expect('start = [a]').toParseAs(classGrammar(["a"], "[a]"));

    /* This test demonstrates that |rawText| is not really "raw". */
    expect('start = [\u0080]').toParseAs(classGrammar(["\x80"], "[\\x80]"));
  });

  /* Canonical bracketDelimitedCharacter is "a". */
  it("parses bracketDelimitedCharacter", function() {
    expect('start = [a]'      ).toParseAs(classGrammar(["a"],      "[a]"));
    expect('start = [\\n]'    ).toParseAs(classGrammar(["\n"],     "[\\n]"));
    expect('start = [\\0]'    ).toParseAs(classGrammar(["\x00"],   "[\\0]"));
    expect('start = [\\xFF]'  ).toParseAs(classGrammar(["\xFF"],   "[\\xFF]"));
    expect('start = [\\uFFFF]').toParseAs(classGrammar(["\uFFFF"], "[\\uFFFF]"));
    expect('start = [\\\n]'   ).toParseAs(classGrammar(["\n"],     "[\\n]"));
  });

  /* Canonical simpleBracketDelimiedCharacter is "a". */
  it("parses simpleBracketDelimitedCharacter", function() {
    expect('start = [a]').toParseAs(classGrammar(["a"], "[a]"));

    expect('start = []]' ).toFailToParse();
    expect('start = [\\]').toFailToParse();
    expect('start = [\n]').toFailToParse();
  });

  /* Canonical simpleEscapeSequence is "\\n". */
  it("parses simpleEscapeSequence", function() {
    expect('start = "\\b"').toParseAs(literalGrammar("\b"));
    expect('start = "\\f"').toParseAs(literalGrammar("\f"));
    expect('start = "\\n"').toParseAs(literalGrammar("\n"));
    expect('start = "\\r"').toParseAs(literalGrammar("\r"));
    expect('start = "\\t"').toParseAs(literalGrammar("\t"));
    expect('start = "\\v"').toParseAs(literalGrammar("\x0B")); // no "\v" in IE
    expect('start = "\\a"').toParseAs(literalGrammar("a"));

    expect('start = "\\1"').toFailToParse();
    expect('start = "\\x"').toFailToParse();
    expect('start = "\\u"').toFailToParse();
  });

  /* Canonical zeroEscapeSequence is "\\0". */
  it("parses zeroEscapeSequence", function() {
    expect('start = "\\0"').toParseAs(literalGrammar("\x00"));

    expect('start = "\\00"').toFailToParse();
    expect('start = "\\09"').toFailToParse();
  });

  /* Canonical hexEscapeSequence is "\\xFF". */
  it("parses hexEscapeSequence", function() {
    expect('start = "\\xFF"').toParseAs(literalGrammar("\xFF"));
  });

  /* Canonical unicodeEscapeSequence is "\\uFFFF". */
  it("parses unicodeEscapeSequence", function() {
    expect('start = "\\uFFFF"').toParseAs(literalGrammar("\uFFFF"));
  });

  /* Canonical eolEscapeSequence is "\\\n". */
  it("parses eolEscapeSequence", function() {
    expect('start = "\\\n"'    ).toParseAs(literalGrammar("\n"));
    expect('start = "\\\r\n"'  ).toParseAs(literalGrammar("\r\n"));
    expect('start = "\\\r"'    ).toParseAs(literalGrammar("\r"));
    expect('start = "\\\u2028"').toParseAs(literalGrammar("\u2028"));
    expect('start = "\\\u2029"').toParseAs(literalGrammar("\u2029"));
  });

  /* Trivial character class rules are not tested. */

  /* Canonical __ is "\n". */
  it("parses __", function() {
    expect('start ="abcd"'             ).toParseAs(trivialGrammar);
    expect('start = "abcd"'            ).toParseAs(trivialGrammar);
    expect('start =\n"abcd"'           ).toParseAs(trivialGrammar);
    expect('start =/* comment */"abcd"').toParseAs(trivialGrammar);
    expect('start =   "abcd"'          ).toParseAs(trivialGrammar);
  });

  // Canonical comment is "/* comment */".
  it("parses comment", function() {
    expect('start =// comment\n"abcd"' ).toParseAs(trivialGrammar);
    expect('start =/* comment */"abcd"').toParseAs(trivialGrammar);
  });

  /* Canonical singleLineComment is "// comment". */
  it("parses singleLineComment", function() {
    expect('start =//\n"abcd"'   ).toParseAs(trivialGrammar);
    expect('start =//a\n"abcd"'  ).toParseAs(trivialGrammar);
    expect('start =//aaa\n"abcd"').toParseAs(trivialGrammar);
  });

  // Canonical multiLineComment is "/* comment */".
  it("parses multiLineComment", function() {
    expect('start =/**/"abcd"'   ).toParseAs(trivialGrammar);
    expect('start =/*a*/"abcd"'  ).toParseAs(trivialGrammar);
    expect('start =/*aaa*/"abcd"').toParseAs(trivialGrammar);
    expect('start =/***/"abcd"'  ).toParseAs(trivialGrammar);

    expect('start =/**/*/"abcd"').toFailToParse();
  });

  /* Canonical eol is "\n". */
  it("parses eol", function() {
    expect('start =\n"abcd"'    ).toParseAs(trivialGrammar);
    expect('start =\r\n"abcd"'  ).toParseAs(trivialGrammar);
    expect('start =\r"abcd"'    ).toParseAs(trivialGrammar);
    expect('start =\u2028"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2029"abcd"').toParseAs(trivialGrammar);
  });

  /* Canonical eolChar is "\n". */
  it("parses eolChar", function() {
    expect('start =\n"abcd"'    ).toParseAs(trivialGrammar);
    expect('start =\r"abcd"'    ).toParseAs(trivialGrammar);
    expect('start =\u2028"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2029"abcd"').toParseAs(trivialGrammar);
  });

  /* Canonical whitespace is " ". */
  it("parses whitespace", function() {
    expect('start =\t"abcd"'    ).toParseAs(trivialGrammar);
    expect('start =\x0B"abcd"'  ).toParseAs(trivialGrammar); // no "\v" in IE
    expect('start =\f"abcd"'    ).toParseAs(trivialGrammar);
    expect('start = "abcd"'     ).toParseAs(trivialGrammar);
    expect('start =\u00A0"abcd"').toParseAs(trivialGrammar);
    expect('start =\uFEFF"abcd"').toParseAs(trivialGrammar);
    expect('start =\u1680"abcd"').toParseAs(trivialGrammar);
    expect('start =\u180E"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2000"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2001"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2002"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2003"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2004"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2005"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2006"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2007"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2008"abcd"').toParseAs(trivialGrammar);
    expect('start =\u2009"abcd"').toParseAs(trivialGrammar);
    expect('start =\u200A"abcd"').toParseAs(trivialGrammar);
    expect('start =\u202F"abcd"').toParseAs(trivialGrammar);
    expect('start =\u205F"abcd"').toParseAs(trivialGrammar);
    expect('start =\u3000"abcd"').toParseAs(trivialGrammar);
  });
});
