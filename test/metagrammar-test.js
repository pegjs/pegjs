(function() {

var global = this;

/* ===== Helpers ===== */

global.grammarParserParses = function(input, expected) {
  global.parses(PEG.grammarParser, input, expected);
};

global.grammarParserDoesNotParse = function(input) {
  global.doesNotParse(PEG.grammarParser, input);
}

/* ===== Grammar Parser ===== */

module("Grammar Parser");

with (PEG.Grammar) {
  var literalAbcd  = new Literal("abcd");
  var literalEfgh  = new Literal("efgh");
  var literalIjkl  = new Literal("ijkl");

  var optional = new Optional(literalAbcd);

  var notAbcd = new NotPredicate(literalAbcd);
  var notEfgh = new NotPredicate(literalEfgh);
  var notIjkl = new NotPredicate(literalIjkl);

  var sequenceEmpty    = new Sequence([]);
  var sequenceNots     = new Sequence([notAbcd, notEfgh, notIjkl]);
  var sequenceLiterals = new Sequence([literalAbcd, literalEfgh, literalIjkl]);

  function oneRuleGrammar(expression) {
    return { start: new PEG.Grammar.Rule("start", null, expression) };
  }

  var simpleGrammar = oneRuleGrammar(new Literal("abcd"));

  function identifierGrammar(identifier) {
    return oneRuleGrammar(new PEG.Grammar.RuleRef(identifier));
  }

  function literalGrammar(literal) {
    return oneRuleGrammar(new PEG.Grammar.Literal(literal));
  }

  function classGrammar(chars) {
    return oneRuleGrammar(new PEG.Grammar.Class(chars));
  }

  var anyGrammar = oneRuleGrammar(new Any());

  function actionGrammar(action) {
    return oneRuleGrammar(new PEG.Grammar.Action(new PEG.Grammar.Literal("a"), action));
  }

  /* Canonical grammar is "a: \"abcd\";\nb: \"efgh\";\nc: \"ijkl\";". */
  test("parses grammar", function() {
    grammarParserParses('a: "abcd"', { a: new Rule("a", null, literalAbcd) });
    grammarParserParses(
      'a: "abcd"\nb: "efgh"\nc: "ijkl"',
      {
        a: new Rule("a", null, literalAbcd),
        b: new Rule("b", null, literalEfgh),
        c: new Rule("c", null, literalIjkl)
      }
    );
  });

  /* Canonical rule is "a: \"abcd\"". */
  test("parses rule", function() {
    grammarParserParses(
      'start: "abcd" / "efgh" / "ijkl"',
      oneRuleGrammar(new Choice([literalAbcd, literalEfgh, literalIjkl]))
    );
    grammarParserParses(
      'start "start rule": "abcd" / "efgh" / "ijkl"',
      {
        start:
          new Rule(
            "start",
            "start rule",
            new Choice([literalAbcd, literalEfgh, literalIjkl])
          )
      }
    );
  });

  /* Canonical expression is "\"abcd\" / \"efgh\" / \"ijkl\"". */
  test("parses expression", function() {
    grammarParserParses(
      'start: "abcd" / "efgh" / "ijkl"',
      oneRuleGrammar(new Choice([literalAbcd, literalEfgh, literalIjkl]))
    );
  });

  /* Canonical choice is "\"abcd\" / \"efgh\" / \"ijkl\"". */
  test("parses choice", function() {
    grammarParserParses(
      'start: "abcd" "efgh" "ijkl"',
      oneRuleGrammar(sequenceLiterals)
    );
    grammarParserParses(
      'start: "abcd" "efgh" "ijkl" / "abcd" "efgh" "ijkl" / "abcd" "efgh" "ijkl"',
      oneRuleGrammar(new Choice([
        sequenceLiterals,
        sequenceLiterals,
        sequenceLiterals
      ]))
    );
  });

  /* Canonical sequence is "\"abcd\" \"efgh\" \"ijkl\"". */
  test("parses sequence", function() {
    grammarParserParses(
      'start: { code }',
      oneRuleGrammar(new Action(sequenceEmpty, " code "))
    );
    grammarParserParses(
      'start: !"abcd" { code }',
      oneRuleGrammar(new Action(notAbcd, " code "))
    );
    grammarParserParses(
      'start: !"abcd" !"efgh" !"ijkl" { code }',
      oneRuleGrammar(new Action(sequenceNots, " code "))
    );

    grammarParserParses('start: ',        oneRuleGrammar(sequenceEmpty));
    grammarParserParses('start: !"abcd"', oneRuleGrammar(notAbcd));
    grammarParserParses(
      'start: !"abcd" !"efgh" !"ijkl"',
      oneRuleGrammar(sequenceNots)
    );
  });

  /* Canonical prefixed is "!\"abcd\"". */
  test("parses prefixed", function() {
    grammarParserParses('start: &"abcd"?', oneRuleGrammar(new AndPredicate(optional)));
    grammarParserParses('start: !"abcd"?', oneRuleGrammar(new NotPredicate(optional)));
    grammarParserParses('start: "abcd"?',  oneRuleGrammar(optional));
  });

  /* Canonical suffixed is "\"abcd\"?". */
  test("parses suffixed", function() {
    grammarParserParses('start: "abcd"?', oneRuleGrammar(optional));
    grammarParserParses('start: "abcd"*', oneRuleGrammar(new ZeroOrMore(literalAbcd)));
    grammarParserParses('start: "abcd"+', oneRuleGrammar(new OneOrMore(literalAbcd)));
    grammarParserParses('start: "abcd"', literalGrammar("abcd"));
  });

  /* Canonical primary is "\"abcd\"". */
  test("parses primary", function() {
    grammarParserParses('start: a',        identifierGrammar("a"));
    grammarParserParses('start: "abcd"',   literalGrammar("abcd"));
    grammarParserParses('start: .',        anyGrammar);
    grammarParserParses('start: [a-d]',    classGrammar("a-d"));
    grammarParserParses('start: ("abcd")', literalGrammar("abcd"));
  });

  /* Canonical action is "{ code }". */
  test("parses action", function() {
    grammarParserParses('start: "a" { code }', actionGrammar(" code "));
  });

  /* Canonical braced is "{ code }". */
  test("parses braced", function() {
    grammarParserParses('start: "a" {}',    actionGrammar(""));
    grammarParserParses('start: "a" {a}',   actionGrammar("a"));
    grammarParserParses('start: "a" {{a}}', actionGrammar("{a}"));
    grammarParserParses('start: "a" {aaa}', actionGrammar("aaa"));
  });

  /* Trivial character rules are not tested. */

  /* Canonical identifier is "a". */
  test("parses identifier", function() {
    grammarParserParses('start: a',    identifierGrammar("a"));
    grammarParserParses('start: z',    identifierGrammar("z"));
    grammarParserParses('start: A',    identifierGrammar("A"));
    grammarParserParses('start: Z',    identifierGrammar("Z"));
    grammarParserParses('start: _',    identifierGrammar("_"));
    grammarParserParses('start: $',    identifierGrammar("$"));
    grammarParserParses('start: aa',   identifierGrammar("aa"));
    grammarParserParses('start: az',   identifierGrammar("az"));
    grammarParserParses('start: aA',   identifierGrammar("aA"));
    grammarParserParses('start: aZ',   identifierGrammar("aZ"));
    grammarParserParses('start: a0',   identifierGrammar("a0"));
    grammarParserParses('start: a9',   identifierGrammar("a9"));
    grammarParserParses('start: a_',   identifierGrammar("a_"));
    grammarParserParses('start: a$',   identifierGrammar("a$"));
    grammarParserParses('start: abcd', identifierGrammar("abcd"));

    grammarParserParses('start: a\n',  identifierGrammar("a"));
  });

  /* Canonical literal is "\"abcd\"". */
  test("parses literal", function() {
    grammarParserParses('start: "abcd"', literalGrammar("abcd"));
    grammarParserParses("start: 'abcd'", literalGrammar("abcd"));
  });

  /* Canonical doubleQuotedLiteral is "\"abcd\"". */
  test("parses doubleQuotedLiteral", function() {
    grammarParserParses('start: ""',       literalGrammar(""));
    grammarParserParses('start: "a"',      literalGrammar("a"));
    grammarParserParses('start: "abc"',    literalGrammar("abc"));

    grammarParserParses('start: "abcd"\n', literalGrammar("abcd"));
  });

  /* Canonical doubleQuotedCharacter is "a". */
  test("parses doubleQuotedCharacter", function() {
    grammarParserParses('start: "a"',       literalGrammar("a"));
    grammarParserParses('start: "\\n"',     literalGrammar("\n"));
    grammarParserParses('start: "\\0"',     literalGrammar("\0"));
    grammarParserParses('start: "\\x00"',   literalGrammar("\x00"));
    grammarParserParses('start: "\\u0120"', literalGrammar("\u0120"));
    grammarParserParses('start: "\\\n"',    literalGrammar("\n"));
  });

  /* Canonical simpleDoubleQuotedCharacter is "a". */
  test("parses simpleDoubleQuotedCharacter", function() {
    grammarParserParses('start: "a"',  literalGrammar("a"));
    grammarParserParses('start: "\'"', literalGrammar("'"));
    grammarParserDoesNotParse('start: """');
    grammarParserDoesNotParse('start: "\\"');
    grammarParserDoesNotParse('start: "\n"');
    grammarParserDoesNotParse('start: "\r"');
    grammarParserDoesNotParse('start: "\u2028"');
    grammarParserDoesNotParse('start: "\u2029"');
  });

  /* Canonical singleQuotedLiteral is "'abcd'". */
  test("parses singleQuotedLiteral", function() {
    grammarParserParses("start: ''",       literalGrammar(""));
    grammarParserParses("start: 'a'",      literalGrammar("a"));
    grammarParserParses("start: 'abc'",    literalGrammar("abc"));

    grammarParserParses("start: 'abcd'\n", literalGrammar("abcd"));
  });

  /* Canonical singleQuotedCharacter is "a". */
  test("parses singleQuotedCharacter", function() {
    grammarParserParses("start: 'a'",       literalGrammar("a"));
    grammarParserParses("start: '\\n'",     literalGrammar("\n"));
    grammarParserParses("start: '\\0'",     literalGrammar("\0"));
    grammarParserParses("start: '\\x00'",   literalGrammar("\x00"));
    grammarParserParses("start: '\\u0120'", literalGrammar("\u0120"));
    grammarParserParses("start: '\\\n'",    literalGrammar("\n"));
  });

  /* Canonical simpleSingleQuotedCharacter is "a". */
  test("parses simpleSingleQuotedCharacter", function() {
    grammarParserParses("start: 'a'",  literalGrammar("a"));
    grammarParserParses("start: '\"'", literalGrammar("\""));
    grammarParserDoesNotParse("start: '''");
    grammarParserDoesNotParse("start: '\\'");
    grammarParserDoesNotParse("start: '\n'");
    grammarParserDoesNotParse("start: '\r'");
    grammarParserDoesNotParse("start: '\u2028'");
    grammarParserDoesNotParse("start: '\u2029'");
  });

  /* Canonical class is "[a-d]". */
  test("parses class", function() {
    grammarParserParses("start: []",          classGrammar(""));
    grammarParserParses("start: [a-d]",       classGrammar("a-d"));
    grammarParserParses("start: [^a-d]",      classGrammar("^a-d"));
    grammarParserParses("start: [a]",         classGrammar("a"));
    grammarParserParses("start: [a-de-hi-l]", classGrammar("a-de-hi-l"));

    grammarParserParses("start: [a-d]\n", classGrammar("a-d"));
  });

  /* Canonical classCharacterRange is "a-d". */
  test("parses classCharacterRange", function() {
    grammarParserParses("start: [a-d]", classGrammar("a-d"));
    grammarParserParses("start: [a-a]", classGrammar("a-a"));
    grammarParserDoesNotParse("start: [b-a]");
  });

  /* Canonical classCharacter is "a". */
  test("parses classCharacter", function() {
    grammarParserParses("start: [a]", classGrammar("a"));
  });

  /* Canonical bracketDelimitedCharacter is "a". */
  test("parses bracketDelimitedCharacter", function() {
    grammarParserParses("start: [a]",       classGrammar("a"));
    grammarParserParses("start: [\\n]",     classGrammar("\\n"));
    grammarParserParses("start: [\\0]",     classGrammar("\\0"));
    grammarParserParses("start: [\\x00]",   classGrammar("\\0"));
    grammarParserParses("start: [\\u0120]", classGrammar("\u0120"));
    grammarParserParses("start: [\\\n]",    classGrammar("\\n"));
  });

  /* Canonical simpleBracketDelimiedCharacter is "a". */
  test("parses simpleBracketDelimitedCharacter", function() {
    grammarParserParses("start: [a]",  classGrammar("a"));
    grammarParserParses("start: [[]",  classGrammar("["));
    grammarParserDoesNotParse("start: []]");
    grammarParserDoesNotParse("start: [\\]");
    grammarParserDoesNotParse("start: [\n]");
    grammarParserDoesNotParse("start: [\r]");
    grammarParserDoesNotParse("start: [\u2028]");
    grammarParserDoesNotParse("start: [\u2029]");
  });

  /* Canonical simpleEscapeSequence is "\\n". */
  test("parses simpleEscapeSequence", function() {
    grammarParserParses('start: "\\\'"', literalGrammar("'"));
    grammarParserParses('start: "\\""',  literalGrammar("\""));
    grammarParserParses('start: "\\\\"', literalGrammar("\\"));
    grammarParserParses('start: "\\b"',  literalGrammar("\b"));
    grammarParserParses('start: "\\f"',  literalGrammar("\f"));
    grammarParserParses('start: "\\n"',  literalGrammar("\n"));
    grammarParserParses('start: "\\r"',  literalGrammar("\r"));
    grammarParserParses('start: "\\t"',  literalGrammar("\t"));
    /* IE does not recognize "\v". */
    grammarParserParses('start: "\\v"',  literalGrammar("\x0B"));

    grammarParserParses('start: "\\a"',  literalGrammar("a"));
  });

  /* Canonical zeroEscapeSequence is "\\0". */
  test("parses zeroEscapeSequence", function() {
    grammarParserParses('start: "\\0"', literalGrammar("\0"));
    grammarParserDoesNotParse('start: "\\00"');
    grammarParserDoesNotParse('start: "\\09"');
  });

  /* Canonical hexEscapeSequence is "\\x00". */
  test("parses hexEscapeSequence", function() {
    grammarParserParses('start: "\\x00"',  literalGrammar("\x00"));
    grammarParserParses('start: "\\x09"',  literalGrammar("\x09"));
    grammarParserParses('start: "\\x0a"',  literalGrammar("\x0a"));
    grammarParserParses('start: "\\x0f"',  literalGrammar("\x0f"));
    grammarParserParses('start: "\\x0A"',  literalGrammar("\x0A"));
    grammarParserParses('start: "\\x0F"',  literalGrammar("\x0F"));
    grammarParserDoesNotParse('start: "\\x0"');
    grammarParserParses('start: "\\x000"', literalGrammar("\x000"));
  });

  /* Canonical unicodeEscapeSequence is "\\u0120". */
  test("parses unicodeEscapeSequence", function() {
    grammarParserParses('start: "\\u0120"',  literalGrammar("\u0120"));
    grammarParserParses('start: "\\u0129"',  literalGrammar("\u0129"));
    grammarParserParses('start: "\\u012a"',  literalGrammar("\u012a"));
    grammarParserParses('start: "\\u012f"',  literalGrammar("\u012f"));
    grammarParserParses('start: "\\u012A"',  literalGrammar("\u012A"));
    grammarParserParses('start: "\\u012F"',  literalGrammar("\u012F"));
    grammarParserDoesNotParse('start: "\\u012"');
    grammarParserParses('start: "\\u01234"', literalGrammar("\u01234"));
  });

  /* Canonical eolEscapeSequence is "\\\n". */
  test("parses eolEscapeSequence", function() {
    grammarParserParses('start: "\\\n"',     literalGrammar("\n"));
    grammarParserParses('start: "\\\r\n"',   literalGrammar("\r\n"));
    grammarParserParses('start: "\\\r"',     literalGrammar("\r"));
    grammarParserParses('start: "\\\u2028"', literalGrammar("\u2028"));
    grammarParserParses('start: "\\\u2029"', literalGrammar("\u2029"));
  });

  /* Canonical __ is "\n". */
  test("parses __", function() {
    grammarParserParses('start:"abcd"',              simpleGrammar);
    grammarParserParses('start: "abcd"',             simpleGrammar);
    grammarParserParses('start:\n"abcd"',            simpleGrammar);
    grammarParserParses('start:/* comment */"abcd"', simpleGrammar);
    grammarParserParses('start:   "abcd"',           simpleGrammar);
  });

  /* Trivial character class rules are not tested. */

  /* Canonical comment is "\/* comment *\/". */
  test("parses comment", function() {
    grammarParserParses('start:// comment\n"abcd"',  simpleGrammar);
    grammarParserParses('start:/* comment */"abcd"', simpleGrammar);
  });
  /* Canonical singleLineComment is "// comment". */
  test("parses singleLineComment", function() {
    grammarParserParses('start://\n"abcd"',    simpleGrammar);
    grammarParserParses('start://a\n"abcd"',   simpleGrammar);
    grammarParserParses('start://aaa\n"abcd"', simpleGrammar);
    grammarParserParses('start: "abcd"//',     simpleGrammar);
  });

  /* Canonical multiLineComment is "\/* comment *\/". */
  test("parses multiLineComment", function() {
    grammarParserParses('start:/**/"abcd"',    simpleGrammar);
    grammarParserParses('start:/*a*/"abcd"',   simpleGrammar);
    grammarParserParses('start:/*aaa*/"abcd"', simpleGrammar);
    grammarParserParses('start:/*\n*/"abcd"',  simpleGrammar);
    grammarParserParses('start:/***/"abcd"',   simpleGrammar);
    grammarParserParses('start:/*a/*/"abcd"',  simpleGrammar);

    grammarParserDoesNotParse('start:/*"abcd"');
    grammarParserDoesNotParse('start:/*/"abcd"');
    grammarParserDoesNotParse('start:/*/**/*/"abcd"');
  });

  /* Canonical eol is "\n". */
  test("parses eol", function() {
    grammarParserParses('start:\n"abcd"',     simpleGrammar);
    grammarParserParses('start:\r\n"abcd"',   simpleGrammar);
    grammarParserParses('start:\r"abcd"',     simpleGrammar);
    grammarParserParses('start:\u2028"abcd"', simpleGrammar);
    grammarParserParses('start:\u2029"abcd"', simpleGrammar);
  });

  /* Canonical eolChar is "\n". */
  test("parses eolChar", function() {
    grammarParserParses('start:\n"abcd"',     simpleGrammar);
    grammarParserParses('start:\r"abcd"',     simpleGrammar);
    grammarParserParses('start:\u2028"abcd"', simpleGrammar);
    grammarParserParses('start:\u2029"abcd"', simpleGrammar);
  });

  /* Canonical whitespace is " ". */
  test("parses whitespace", function() {
    grammarParserParses('start:\t"abcd"',     simpleGrammar);
    /* IE does not recognize "\v". */
    grammarParserParses('start:\x0B"abcd"',   simpleGrammar);
    grammarParserParses('start:\f"abcd"',     simpleGrammar);
    grammarParserParses('start: "abcd"',      simpleGrammar);
    grammarParserParses('start:\u00A0"abcd"', simpleGrammar);
    grammarParserParses('start:\uFEFF"abcd"', simpleGrammar);
    grammarParserParses('start:\u1680"abcd"', simpleGrammar);
    grammarParserParses('start:\u180E"abcd"', simpleGrammar);
    grammarParserParses('start:\u2000"abcd"', simpleGrammar);
    grammarParserParses('start:\u2001"abcd"', simpleGrammar);
    grammarParserParses('start:\u2002"abcd"', simpleGrammar);
    grammarParserParses('start:\u2003"abcd"', simpleGrammar);
    grammarParserParses('start:\u2004"abcd"', simpleGrammar);
    grammarParserParses('start:\u2005"abcd"', simpleGrammar);
    grammarParserParses('start:\u2006"abcd"', simpleGrammar);
    grammarParserParses('start:\u2007"abcd"', simpleGrammar);
    grammarParserParses('start:\u2008"abcd"', simpleGrammar);
    grammarParserParses('start:\u2009"abcd"', simpleGrammar);
    grammarParserParses('start:\u200A"abcd"', simpleGrammar);
    grammarParserParses('start:\u202F"abcd"', simpleGrammar);
    grammarParserParses('start:\u205F"abcd"', simpleGrammar);
    grammarParserParses('start:\u3000"abcd"', simpleGrammar);
  });
}

})();
