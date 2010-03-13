(function() {

var global = this;

/* ===== Helpers ===== */

global.throws = function(block, exceptionType) {
  var exception = null;
  try {
    block();
  } catch (e) {
    exception = e;
  }

  ok(
    exception !== null,
    exception !== null ? "okay: thrown something" : "failed, nothing thrown"
  );
  if (exception !== null) {
    ok(
      exception instanceof exceptionType,
      exception instanceof exceptionType
        ? "okay: thrown " + exceptionType.name
        : "failed, thrown " + exception.name + " instead of " + exceptionType.name
    );
  }

  return exception;
};

global.parses = function(parser, input, expected) {
  deepEqual(parser.parse(input), expected);
};

global.doesNotParse = function(parser, input) {
  throws(function() { parser.parse(input); }, PEG.Parser.SyntaxError);
};

global.doesNotParseWithMessage = function(parser, input, message) {
  var exception = throws(
    function() { parser.parse(input); },
    PEG.Parser.SyntaxError
  );
  if (exception) {
    strictEqual(exception.message, message);
  }
};

global.doesNotParseWithPos = function(parser, input, line, column) {
  var exception = throws(
    function() { parser.parse(input); },
    PEG.Parser.SyntaxError
  );
  if (exception) {
    strictEqual(exception.line, line);
    strictEqual(exception.column, column);
  }
};

global.grammarParserParses = function(input, expected) {
  global.parses(PEG.grammarParser, input, expected);
};

global.grammarParserDoesNotParse = function(input) {
  global.doesNotParse(PEG.grammarParser, input);
}

/* ===== PEG.Compiler ===== */

module("PEG.Compiler");

test("formatCode joins parts", function() {
  strictEqual(PEG.Compiler.formatCode("foo", "bar"), "foo\nbar");
});

test("formatCode interpolates variables", function() {
  strictEqual(
    PEG.Compiler.formatCode("foo", "${bar}", { bar: "baz" }),
    "foo\nbaz"
  );

  throws(function() {
    PEG.Compiler.formatCode("foo", "${bar}");
  }, Error);
});

test("formatCode filters variables", function() {
  strictEqual(
    PEG.Compiler.formatCode("foo", "${bar|string}", { bar: "baz" }),
    "foo\n\"baz\""
  );

  throws(function() {
    PEG.Compiler.formatCode("foo", "${bar|eeek}", { bar: "baz" });
  }, Error);
});

test("formatCode indents multiline parts", function() {
  strictEqual(
    PEG.Compiler.formatCode("foo", "${bar}", { bar: "  baz\nqux" }),
    "foo\n  baz\n  qux"
  );
});

test("generateUniqueIdentifier", function() {
  notStrictEqual(
    PEG.Compiler.generateUniqueIdentifier("prefix"),
    PEG.Compiler.generateUniqueIdentifier("prefix")
  );
});

/* ===== PEG ===== */

module("PEG");

test("buildParser reports invalid grammar object", function() {
  throws(function() { PEG.buildParser(42); }, PEG.Grammar.GrammarError);
});

test("buildParser reports missing start rule", function() {
  throws(function() { PEG.buildParser({}); }, PEG.Grammar.GrammarError);
});

test("buildParser allows custom start rule", function() {
  var parser = PEG.buildParser('s: "abcd"', "s");
  parses(parser, "abcd", "abcd");
});

/* ===== Generated Parser ===== */

module("Generated Parser");

test("literals", function() {
  var parser = PEG.buildParser('start: "abcd"');
  parses(parser, "abcd", "abcd");
  doesNotParse(parser, "");
  doesNotParse(parser, "abc");
  doesNotParse(parser, "abcde");
  doesNotParse(parser, "efgh");

  /*
   * Test that the parsing position moves forward after successful parsing of
   * a literal.
   */
  var posTestParser = PEG.buildParser('start: "a" "b"');
  parses(posTestParser, "ab", ["a", "b"]);
});

test("anys", function() {
  var parser = PEG.buildParser('start: .');
  parses(parser, "a", "a");
  doesNotParse(parser, "");
  doesNotParse(parser, "ab");

  /*
   * Test that the parsing position moves forward after successful parsing of
   * an any.
   */
  var posTestParser = PEG.buildParser('start: . .');
  parses(posTestParser, "ab", ["a", "b"]);
});

test("classes", function() {
  var emptyClassParser = PEG.buildParser('start: []');
  doesNotParse(emptyClassParser, "");
  doesNotParse(emptyClassParser, "a");
  doesNotParse(emptyClassParser, "ab");

  var nonEmptyClassParser = PEG.buildParser('start: [ab-d]');
  parses(nonEmptyClassParser, "a", "a");
  parses(nonEmptyClassParser, "b", "b");
  parses(nonEmptyClassParser, "c", "c");
  parses(nonEmptyClassParser, "d", "d");
  doesNotParse(nonEmptyClassParser, "");
  doesNotParse(nonEmptyClassParser, "ab");

  /*
   * Test that the parsing position moves forward after successful parsing of
   * a class.
   */
  var posTestParser = PEG.buildParser('start: [ab-d] [ab-d]');
  parses(posTestParser, "ab", ["a", "b"]);
});

test("sequences", function() {
  var emptySequenceParser = PEG.buildParser('start: ');
  parses(emptySequenceParser, "", []);
  doesNotParse(emptySequenceParser, "abc");

  var nonEmptySequenceParser = PEG.buildParser('start: "a" "b" "c"');
  parses(nonEmptySequenceParser, "abc", ["a", "b", "c"]);
  doesNotParse(nonEmptySequenceParser, "");
  doesNotParse(nonEmptySequenceParser, "ab");
  doesNotParse(nonEmptySequenceParser, "abcd");
  doesNotParse(nonEmptySequenceParser, "efg");

  /*
   * Test that the parsing position returns after unsuccessful parsing of a
   * sequence.
   */
  var posTestParser = PEG.buildParser('start: ("a" "b") / "a"');
  parses(posTestParser, "a", "a");
});

test("choices", function() {
  var parser = PEG.buildParser('start: "a" / "b" / "c"');
  parses(parser, "a", "a");
  parses(parser, "b", "b");
  parses(parser, "c", "c");
  doesNotParse(parser, "");
  doesNotParse(parser, "ab");
  doesNotParse(parser, "d");
});

test("optional expressions", function() {
  var parser = PEG.buildParser('start: "a"?');
  parses(parser, "", "");
  parses(parser, "a", "a");
});

test("zero or more expressions", function() {
  var parser = PEG.buildParser('start: "a"*');
  parses(parser, "", []);
  parses(parser, "a", ["a"]);
  parses(parser, "aaa", ["a", "a", "a"]);
});

test("one or more expressions", function() {
  var parser = PEG.buildParser('start: "a"+');
  doesNotParse(parser, "");
  parses(parser, "a", ["a"]);
  parses(parser, "aaa", ["a", "a", "a"]);
});

test("and predicate", function() {
  var parser = PEG.buildParser('start: "a" &"b" "b"');
  parses(parser, "ab", ["a", "", "b"]);
  doesNotParse(parser, "ac");

  /*
   * Test that the parsing position returns after successful parsing of a
   * predicate is not needed, it is implicit in the tests above.
   */
});

test("not predicate", function() {
  var parser = PEG.buildParser('start: "a" !"b"');
  parses(parser, "a", ["a", ""]);
  doesNotParse(parser, "ab");

  /*
   * Test that the parsing position returns after successful parsing of a
   * predicate.
   */
  var posTestParser = PEG.buildParser('start: "a" !"b" "c"');
  parses(posTestParser, "ac", ["a", "", "c"]);
});

test("rule references", function() {
  var parser = PEG.buildParser([
    'start:   static / dynamic',
    'static:  "C" / "C++" / "Java" / "C#"',
    'dynamic: "Ruby" / "Python" / "JavaScript"'
  ].join("\n"));
  parses(parser, "Java", "Java");
  parses(parser, "Python", "Python");
});

test("actions", function() {
  var singleMatchParser = PEG.buildParser(
    'start: "a" { return Array.prototype.slice.call(arguments).join("").toUpperCase(); }'
  );
  parses(singleMatchParser, "a", "A");

  var multiMatchParser = PEG.buildParser(
    'start: "a" "b" "c" { return Array.prototype.slice.call(arguments).join("").toUpperCase(); }'
  );
  parses(multiMatchParser, "abc", "ABC");

  var innerMatchParser = PEG.buildParser(
    'start: "a" ("b" "c" "d" { return Array.prototype.slice.call(arguments).join("").toUpperCase(); }) "e"'
  );
  parses(innerMatchParser, "abcde", ["a", "BCD", "e"]);

  /* Test that the action is not called when its expression does not match. */
  var notAMatchParser = PEG.buildParser(
    'start: "a" { ok(false, "action got called when it should not be"); }'
  );
  doesNotParse(notAMatchParser, "b");

  var variablesParser = PEG.buildParser([
    'start: "a" "b" "c" "d" "e" "f" "g" "h" "i" "j" {',
    '         return [$1, $2, $3, $4, $5, $6, $7, $8, $9, $10].join("").toUpperCase();',
    '       }'
  ].join("\n"));
  parses(variablesParser, "abcdefghij", "ABCDEFGHIJ");
});

test("cache", function() {
  /*
   * Should trigger a codepath where the cache is used (for the "a" rule).
   */
  var parser = PEG.buildParser([
    'start: (a b) / (a c)',
    'a:     "a"',
    'b:     "b"',
    'c:     "c"'
  ].join("\n"));
  parses(parser, "ac", ["a", "c"]);
});

test("indempotence", function() {
  var parser1 = PEG.buildParser('start: "abcd"');
  var parser2 = PEG.buildParser('start: "abcd"');

  strictEqual(parser1.toSource(), parser2.toSource());
});

test("error messages", function() {
  var literalParser = PEG.buildParser('start: "abcd"');
  doesNotParseWithMessage(
    literalParser,
    "",
    'Expected "abcd" but end of input found.'
  );
  doesNotParseWithMessage(
    literalParser,
    "efgh",
    'Expected "abcd" but "e" found.'
  );
  doesNotParseWithMessage(
    literalParser,
    "abcde",
    'Expected end of input but "e" found.'
  );

  var anyParser = PEG.buildParser('start: .');
  doesNotParseWithMessage(
    anyParser,
    "",
    'Expected any character but end of input found.'
  );

  var namedRuleWithLiteralParser = PEG.buildParser('start "digit": [0-9]');
  doesNotParseWithMessage(
    namedRuleWithLiteralParser,
    "a",
    'Expected digit but "a" found.'
  );

  var namedRuleWithAnyParser = PEG.buildParser('start "whatever": .');
  doesNotParseWithMessage(
    namedRuleWithAnyParser,
    "",
    'Expected whatever but end of input found.'
  );

  var namedRuleWithNamedRuleParser = PEG.buildParser([
    'start "digits": digit+',
    'digit "digit":  [0-9]'
  ].join("\n"));
  doesNotParseWithMessage(
    namedRuleWithNamedRuleParser,
    "",
    'Expected digits but end of input found.'
  );

  var choiceParser1 = PEG.buildParser('start: "a" / "b" / "c"');
  doesNotParseWithMessage(
    choiceParser1,
    "def",
    'Expected "a", "b" or "c" but "d" found.'
  );

  var choiceParser2 = PEG.buildParser('start: "a" "b" "c" / "a"');
  doesNotParseWithMessage(
    choiceParser2,
    "abd",
    'Expected "c" but "d" found.'
  );

  var notPredicateParser = PEG.buildParser('start: !"a" "b"');
  doesNotParseWithMessage(
    notPredicateParser,
    "c",
    'Expected "b" but "c" found.'
  );

  var andPredicateParser = PEG.buildParser('start: &"a" [a-b]');
  doesNotParseWithMessage(
    andPredicateParser,
    "c",
    'Expected end of input but "c" found.'
  );

  var emptyParser = PEG.buildParser('start: ');
  doesNotParseWithMessage(
    emptyParser,
    "something",
    'Expected end of input but "s" found.'
  );
});

test("error positions", function() {
  var parser = PEG.buildParser([
    'start: line (("\\r" / "\\n" / "\\u2028" / "\\u2029")+ line)*',
    'line:  digit (" "+   digit)*',
    'digit: [0-9]+ { return $1.join(""); }'
  ].join("\n"));

  doesNotParseWithPos(parser, "a", 1, 1);
  doesNotParseWithPos(parser, "1\n2\n\n3\n\n\n4 5 x", 7, 5);

  /* Non-Unix newlines */
  doesNotParseWithPos(parser, "1\rx", 2, 1);   // Old Mac
  doesNotParseWithPos(parser, "1\r\nx", 2, 1); // Windows
  doesNotParseWithPos(parser, "1\n\rx", 3, 1); // mismatched

  /* Strange newlines */
  doesNotParseWithPos(parser, "1\u2028x", 2, 1); // line separator
  doesNotParseWithPos(parser, "1\u2029x", 2, 1); // paragraph separator
});

/*
 * Following examples are from Wikipedia, see
 * http://en.wikipedia.org/w/index.php?title=Parsing_expression_grammar&oldid=335106938.
 */

test("arithmetics", function() {
  /*
   * Value   ← [0-9]+ / '(' Expr ')'
   * Product ← Value (('*' / '/') Value)*
   * Sum     ← Product (('+' / '-') Product)*
   * Expr    ← Sum
   */
  var parser = PEG.buildParser([
    'Value   : [0-9]+       { return parseInt($1.join("")); }',
    '        / "(" Expr ")" { return $2; }',
    'Product : Value (("*" / "/") Value)* {',
    '            var result = $1;',
    '            for (var i = 0; i < $2.length; i++) {',
    '              if ($2[i][0] == "*") { result *= $2[i][1]; }',
    '              if ($2[i][0] == "/") { result /= $2[i][1]; }',
    '            }',
    '            return result;',
    '          }',
    'Sum     : Product (("+" / "-") Product)* {',
    '            var result = $1;',
    '            for (var i = 0; i < $2.length; i++) {',
    '              if ($2[i][0] == "+") { result += $2[i][1]; }',
    '              if ($2[i][0] == "-") { result -= $2[i][1]; }',
    '            }',
    '            return result;',
    '          }',
    'Expr    : Sum'
  ].join("\n"), "Expr");

  /* Test "value" rule. */
  parses(parser, "0", 0);
  parses(parser, "123", 123);
  parses(parser, "(42+43)", 42+43);

  /* Test "product" rule. */
  parses(parser, "42*43", 42*43);
  parses(parser, "42*43*44*45", 42*43*44*45);

  /* Test "sum" rule. */
  parses(parser, "42*43+44*45", 42*43+44*45);
  parses(parser, "42*43+44*45+46*47+48*49", 42*43+44*45+46*47+48*49);

  /* Test "expr" rule. */
  parses(parser, "42+43", 42+43);

  /* Complex test */
  parses(parser, "(1+2)*(3+4)",(1+2)*(3+4));
});

test("non-context-free language", function() {
  /* The following parsing expression grammar describes the classic
   * non-context-free language { a^n b^n c^n : n >= 1 }:
   *
   * S ← &(A c) a+ B !(a/b/c)
   * A ← a A? b
   * B ← b B? c
   */
  var parser = PEG.buildParser([
    'S: &(A "c") "a"+ B !("a" / "b" / "c") { return $2.join("") + $3; }',
    'A: "a" A? "b" { return $1 + $2 + $3; }',
    'B: "b" B? "c" { return $1 + $2 + $3; }',
  ].join("\n"), "S");

  parses(parser, "abc", "abc");
  parses(parser, "aaabbbccc", "aaabbbccc");
  doesNotParse(parser, "aabbbccc");
  doesNotParse(parser, "aaaabbbccc");
  doesNotParse(parser, "aaabbccc");
  doesNotParse(parser, "aaabbbbccc");
  doesNotParse(parser, "aaabbbcc");
  doesNotParse(parser, "aaabbbcccc");
});

test("nested comments", function() {
  /*
   * Begin ← "(*"
   * End ← "*)"
   * C ← Begin N* End
   * N ← C / (!Begin !End Z)
   * Z ← any single character
   */
  var parser = PEG.buildParser([
    'Begin : "(*"',
    'End   : "*)"',
    'C     : Begin N* End { return $1 + $2.join("") + $3; }',
    'N     : C',
    '      / (!Begin !End Z) { return $3; }',
    'Z     : .'
  ].join("\n"), "C");

  parses(parser, "(**)", "(**)");
  parses(parser, "(*abc*)", "(*abc*)");
  parses(parser, "(*(**)*)", "(*(**)*)");
  parses(
    parser,
    "(*abc(*def*)ghi(*(*(*jkl*)*)*)mno*)",
    "(*abc(*def*)ghi(*(*(*jkl*)*)*)mno*)"
  );
});

/* ===== Grammar Parser ===== */

module("Grammar Parser");

with (PEG.Grammar) {
  var literalEmpty = new Literal("");
  var literalAbcd  = new Literal("abcd");
  var literalEfgh  = new Literal("efgh");
  var literalIjkl  = new Literal("ijkl");

  var choice = new Choice([literalAbcd, literalEmpty]);

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
    return oneRuleGrammar(new PEG.Grammar.Choice(
      PEG.ArrayUtils.map(
        chars.split(""),
        function(char) { return new PEG.Grammar.Literal(char); }
      )
    ));
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
    grammarParserParses(
      'start: &"abcd"?',
      oneRuleGrammar(new NotPredicate(new NotPredicate(choice)))
    );
    grammarParserParses('start: !"abcd"?', oneRuleGrammar(new NotPredicate(choice)));
    grammarParserParses('start: "abcd"?',  oneRuleGrammar(choice));
  });

  /* Canonical suffixed is "\"abcd\"?". */
  test("parses suffixed", function() {
    grammarParserParses('start: "abcd"?', oneRuleGrammar(choice));
    grammarParserParses('start: "abcd"*', oneRuleGrammar(new ZeroOrMore(literalAbcd)));
    grammarParserParses(
      'start: "abcd"+',
      oneRuleGrammar(new Action(
        new Sequence([literalAbcd, new ZeroOrMore(literalAbcd)]),
        function(first, rest) { return [first].concat(rest); }
      ))
    );
    grammarParserParses('start: "abcd"', literalGrammar("abcd"));
  });

  /* Canonical primary is "\"abcd\"". */
  test("parses primary", function() {
    grammarParserParses('start: a',        identifierGrammar("a"));
    grammarParserParses('start: "abcd"',   literalGrammar("abcd"));
    grammarParserParses('start: .',        anyGrammar);
    grammarParserParses('start: [a-d]',    classGrammar("abcd"));
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
  test("parses classCharacterRange", function() {
    grammarParserParses("start: []",          classGrammar(""));
    grammarParserParses("start: [a-d]",       classGrammar("abcd"));
    grammarParserParses("start: [a]",         classGrammar("a"));
    grammarParserParses("start: [a-de-hi-l]", classGrammar("abcdefghijkl"));

    grammarParserParses("start: [a-d]\n", classGrammar("abcd"));
  });

  /* Canonical classCharacterRange is "a-d". */
  test("parses classCharacterRange", function() {
    grammarParserParses("start: [a-d]", classGrammar("abcd"));
    grammarParserParses("start: [a-a]", classGrammar("a"));
    grammarParserDoesNotParse("start: [b-a]");
  });

  /* Canonical classCharacter is "a". */
  test("parses classCharacter", function() {
    grammarParserParses("start: [a]", classGrammar("a"));
  });

  /* Canonical bracketDelimitedCharacter is "a". */
  test("parses bracketDelimitedCharacter", function() {
    grammarParserParses("start: [a]",       classGrammar("a"));
    grammarParserParses("start: [\\n]",     classGrammar("\n"));
    grammarParserParses("start: [\\0]",     classGrammar("\0"));
    grammarParserParses("start: [\\x00]",   classGrammar("\x00"));
    grammarParserParses("start: [\\u0120]", classGrammar("\u0120"));
    grammarParserParses("start: [\\\n]",    classGrammar("\n"));
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
    grammarParserParses('start: "\\v"',  literalGrammar("\v"));

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
    grammarParserParses('start:\v"abcd"',     simpleGrammar);
    grammarParserParses('start:\f"abcd"',     simpleGrammar);
    grammarParserParses('start: "abcd"',      simpleGrammar);
    grammarParserParses('start:\xA0"abcd"',   simpleGrammar);
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
