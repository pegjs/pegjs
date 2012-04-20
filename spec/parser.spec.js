describe("PEG.js grammar parser", function() {
  var trivialGrammar;

  function literalGrammar(value) {
    return {
      type:        "grammar",
      initializer: null,
      rules:       [
        {
          type:        "rule",
          name:        "start",
          displayName: null,
          expression:  { type: "literal", value: value, ignoreCase: false }
        }
      ],
      startRule:   "start"
    };
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

      toFailToParse: function() {
        var result;

        try {
          result = PEG.parser.parse(this.actual);

          this.message = function() {
            return "Expected " + jasmine.pp(this.actual) + " to fail to parse, "
                 + "but it parsed as " + jasmine.pp(result) + ".";
          };

          return false;
        } catch (e) {
          this.message = function() {
            return "Expected " + jasmine.pp(this.actual) + " to parse, "
                 + "but it failed with message "
                 + jasmine.pp(e.message) + ".";
          };

          return true;
        }
      }
    });
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
