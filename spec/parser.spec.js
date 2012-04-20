describe("PEG.js grammar parser", function() {
  var trivialGrammar;

  beforeEach(function() {
    trivialGrammar = {
      type:        "grammar",
      initializer: null,
      rules:       [
        {
          type:        "rule",
          name:        "start",
          displayName: null,
          expression:  { type: "literal", value: "abcd", ignoreCase: false }
        }
      ],
      startRule:   "start"
    };

    this.addMatchers({
      toParseAs: function(expected) {
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
      }
    });
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
