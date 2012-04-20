describe("PEG.js grammar parser", function() {
  var trivialGrammar;

  function oneRuleGrammar(expression) {
    return {
      type:        "grammar",
      initializer: null,
      rules:       [
        {
          type:        "rule",
          name:        "start",
          displayName: null,
          expression:  expression
        }
      ],
      startRule:   "start"
    };
  }

  function literalGrammar(value) {
    return oneRuleGrammar({ type: "literal", value: value, ignoreCase: false });
  }

  function classGrammar(parts, rawText) {
    var inverted   = arguments.length > 2 ? arguments[2] : false,
        ignoreCase = arguments.length > 3 ? arguments[3] : false;

    return oneRuleGrammar({
      type:       "class",
      inverted:   inverted,
      ignoreCase: ignoreCase,
      parts:      parts,
      rawText:    rawText
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

        var result, key;

        try {
          result = PEG.parser.parse(this.actual);

          this.message = function() {
            return "Expected " + jasmine.pp(this.actual) + " to fail to parse"
                 + (details ? " with details " + jasmine.pp(details) : "") + ", "
                 + "but it parsed as " + jasmine.pp(result) + ".";
          };

          return false;
        } catch (e) {
          if (this.isNot) {
            this.message = function() {
              return "Expected " + jasmine.pp(this.actual) + " to parse, "
                   + "but it failed with message "
                   + jasmine.pp(e.message) + ".";
            };
          } else {
            if (details) {
              for (key in details) {
                if (!this.env.equals_(e[key], details[key])) {
                  this.message = buildKeyMessage(key, e[key]);

                  return false;
                }
              }
            }
          }

          return true;
        }
      }
    });
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
