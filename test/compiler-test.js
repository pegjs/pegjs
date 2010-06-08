(function() {

var global = this;

/* ===== Helpers ===== */

global.throws = function(block, exceptionType, exceptionProperties) {
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

    for (var property in exceptionProperties) {
      strictEqual(exception[property], exceptionProperties[property]);
    }
  }
};

global.parses = function(parser, input, expected) {
  deepEqual(parser.parse(input), expected);
};

global.doesNotParse = function(parser, input) {
  throws(function() { parser.parse(input); }, parser.SyntaxError);
};

global.doesNotParseWithMessage = function(parser, input, message) {
  throws(
    function() { parser.parse(input); },
    parser.SyntaxError,
    { message: message }
  );
};

global.doesNotParseWithPos = function(parser, input, line, column) {
  var exception = throws(
    function() { parser.parse(input); },
    parser.SyntaxError,
    {
      line:   line,
      column: column
    }
  );
};

/* ===== PEG.ArrayUtils ===== */

module("PEG.ArrayUtils");

test("range", function() {
  deepEqual(PEG.ArrayUtils.range(-1), []);
  deepEqual(PEG.ArrayUtils.range(0), []);
  deepEqual(PEG.ArrayUtils.range(1), [0]);
  deepEqual(PEG.ArrayUtils.range(2), [0, 1]);
  deepEqual(PEG.ArrayUtils.range(3), [0, 1, 2]);

  deepEqual(PEG.ArrayUtils.range(0, -1), []);
  deepEqual(PEG.ArrayUtils.range(0, 0), []);
  deepEqual(PEG.ArrayUtils.range(0, 1), [0]);
  deepEqual(PEG.ArrayUtils.range(0, 2), [0, 1]);
  deepEqual(PEG.ArrayUtils.range(0, 3), [0, 1, 2]);
  deepEqual(PEG.ArrayUtils.range(-3, 0), [-3, -2, -1]);
});

test("contains", function() {
  ok(!PEG.ArrayUtils.contains([], 42));

  ok(PEG.ArrayUtils.contains([1, 2, 3], 1));
  ok(PEG.ArrayUtils.contains([1, 2, 3], 2));
  ok(PEG.ArrayUtils.contains([1, 2, 3], 3));
  ok(!PEG.ArrayUtils.contains([1, 2, 3], 42));
  ok(!PEG.ArrayUtils.contains([1, 2, 3], "2")); // Does it use |===|?
});

test("each", function() {
  var sum;
  function increment(x) { sum += x; }

  sum = 0;
  PEG.ArrayUtils.each([], increment);
  strictEqual(sum, 0);

  sum = 0;
  PEG.ArrayUtils.each([1, 2, 3], increment);
  strictEqual(sum, 6);
});

test("map", function() {
  function square(x) { return x * x; }

  deepEqual(PEG.ArrayUtils.map([], square), []);
  deepEqual(PEG.ArrayUtils.map([1, 2, 3], square), [1, 4, 9]);
});

/* ===== PEG.StringUtils ===== */

module("PEG.StringUtils");

test("quote", function() {
  strictEqual(PEG.StringUtils.quote(""), '""');
  strictEqual(PEG.StringUtils.quote("abcd"), '"abcd"');
  strictEqual(
    PEG.StringUtils.quote("\"\\\r\u2028\u2029\n\"\\\r\u2028\u2029\n"),
    '"\\\"\\\\\\r\\u2028\\u2029\\n\\\"\\\\\\r\\u2028\\u2029\\n"'
  );
});

/* ===== PEG.RegExpUtils ===== */

module("PEG.RegExpUtils");

test("quoteForClass", function() {
  strictEqual(PEG.RegExpUtils.quoteForClass(""), '');
  strictEqual(PEG.RegExpUtils.quoteForClass("abcd"), 'abcd');
  strictEqual(
    PEG.RegExpUtils.quoteForClass("\\\0/]-\r\u2028\u2029\n\\\0/]-\r\u2028\u2029\n"),
    '\\\\\\0\\/\\]\\-\\r\\u2028\\u2029\\n\\\\\\0\\/\\]\\-\\r\\u2028\\u2029\\n'
  );
});

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

  throws(
    function() { PEG.Compiler.formatCode("foo", "${bar}"); },
    Error,
    { message: "Undefined variable: \"bar\"." }
  );
});

test("formatCode filters variables", function() {
  strictEqual(
    PEG.Compiler.formatCode("foo", "${bar|string}", { bar: "baz" }),
    "foo\n\"baz\""
  );

  throws(
    function() { PEG.Compiler.formatCode("foo", "${bar|eeek}", { bar: "baz" }); },
    Error,
    { message: "Unrecognized filter: \"eeek\"." }
  );
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

test("resetUniqueIdentifierCounters", function() {
  var ida1 = PEG.Compiler.generateUniqueIdentifier("a");
  var ida2 = PEG.Compiler.generateUniqueIdentifier("a");
  var idb1 = PEG.Compiler.generateUniqueIdentifier("b");
  var idb2 = PEG.Compiler.generateUniqueIdentifier("b");

  PEG.Compiler.resetUniqueIdentifierCounters();

  strictEqual(PEG.Compiler.generateUniqueIdentifier("a"), ida1);
  strictEqual(PEG.Compiler.generateUniqueIdentifier("a"), ida2);
  strictEqual(PEG.Compiler.generateUniqueIdentifier("b"), idb1);
  strictEqual(PEG.Compiler.generateUniqueIdentifier("b"), idb2);
});

/* ===== PEG ===== */

module("PEG");

test("buildParser reports syntax errors in the grammar", function() {
  throws(
    function() { PEG.buildParser(''); },
    PEG.grammarParser.SyntaxError
  );
});

test("buildParser reports missing start rule", function() {
  throws(
    function() { PEG.buildParser('notStart = "abcd"'); },
    PEG.GrammarError,
    { message: "Missing \"start\" rule." }
  );
});

test("buildParser reports missing referenced rules", function() {
  var grammars = [
    'start = missing',
    'start = missing / "a" / "b"',
    'start = "a" / "b" / missing',
    'start = missing "a" "b"',
    'start = "a" "b" missing',
    'start = label:missing',
    'start = &missing',
    'start = !missing',
    'start = missing?',
    'start = missing*',
    'start = missing+',
    'start = missing { }'
  ];

  PEG.ArrayUtils.each(grammars, function(grammar) {
    throws(
      function() { PEG.buildParser(grammar); },
      PEG.GrammarError,
      { message: "Referenced rule \"missing\" does not exist." }
    );
  });
});

test("buildParser reports left recursion", function() {
  var grammars = [
    /* Direct */
    'start = start',
    'start = start / "a" / "b"',
    'start = "a" / "b" / start',
    'start = start "a" "b"',
    'start = label:start',
    'start = &start',
    'start = !start',
    'start = start?',
    'start = start*',
    'start = start+',
    'start = start { }',

    /* Indirect */
    'start = stop; stop = start'
  ];

  PEG.ArrayUtils.each(grammars, function(grammar) {
    throws(
      function() { PEG.buildParser(grammar); },
      PEG.GrammarError,
      { message: "Left recursion detected for rule \"start\"." }
    );
  });
});

test("buildParser allows custom start rule", function() {
  var parser = PEG.buildParser('s = "abcd"', "s");
  parses(parser, "abcd", "abcd");
});

/* ===== Generated Parser ===== */

module("Generated Parser");

test("choices", function() {
  var parser = PEG.buildParser('start = "a" / "b" / "c"');
  parses(parser, "a", "a");
  parses(parser, "b", "b");
  parses(parser, "c", "c");
  doesNotParse(parser, "");
  doesNotParse(parser, "ab");
  doesNotParse(parser, "d");
});

test("sequences", function() {
  var emptySequenceParser = PEG.buildParser('start = ');
  parses(emptySequenceParser, "", []);
  doesNotParse(emptySequenceParser, "abc");

  var nonEmptySequenceParser = PEG.buildParser('start = "a" "b" "c"');
  parses(nonEmptySequenceParser, "abc", ["a", "b", "c"]);
  doesNotParse(nonEmptySequenceParser, "");
  doesNotParse(nonEmptySequenceParser, "ab");
  doesNotParse(nonEmptySequenceParser, "abcd");
  doesNotParse(nonEmptySequenceParser, "efg");

  /*
   * Test that the parsing position returns after unsuccessful parsing of a
   * sequence.
   */
  var posTestParser = PEG.buildParser('start = ("a" "b") / "a"');
  parses(posTestParser, "a", "a");
});

test("labels", function() {
  var parser = PEG.buildParser('start = label:"a"');
  parses(parser, "a", "a");
  doesNotParse(parser, "b");
});

test("and predicate", function() {
  var parser = PEG.buildParser('start = "a" &"b" "b"');
  parses(parser, "ab", ["a", "", "b"]);
  doesNotParse(parser, "ac");

  /*
   * Test that the parsing position returns after successful parsing of a
   * predicate is not needed, it is implicit in the tests above.
   */
});

test("not predicate", function() {
  var parser = PEG.buildParser('start = "a" !"b"');
  parses(parser, "a", ["a", ""]);
  doesNotParse(parser, "ab");

  /*
   * Test that the parsing position returns after successful parsing of a
   * predicate.
   */
  var posTestParser = PEG.buildParser('start = "a" !"b" "c"');
  parses(posTestParser, "ac", ["a", "", "c"]);
});

test("optional expressions", function() {
  var parser = PEG.buildParser('start = "a"?');
  parses(parser, "", "");
  parses(parser, "a", "a");
});

test("zero or more expressions", function() {
  var parser = PEG.buildParser('start = "a"*');
  parses(parser, "", []);
  parses(parser, "a", ["a"]);
  parses(parser, "aaa", ["a", "a", "a"]);
});

test("one or more expressions", function() {
  var parser = PEG.buildParser('start = "a"+');
  doesNotParse(parser, "");
  parses(parser, "a", ["a"]);
  parses(parser, "aaa", ["a", "a", "a"]);
});

test("actions", function() {
  var singleElementUnlabeledParser = PEG.buildParser(
    'start = "a" { return arguments.length; }'
  );
  parses(singleElementUnlabeledParser, "a", 0);

  var singleElementLabeledParser = PEG.buildParser(
    'start = a:"a" { return [arguments.length, a]; }'
  );
  parses(singleElementLabeledParser, "a", [1, "a"]);

  var multiElementUnlabeledParser = PEG.buildParser(
    'start = "a" "b" "c" { return arguments.length; }'
  );
  parses(multiElementUnlabeledParser, "abc", 0);

  var multiElementLabeledParser = PEG.buildParser(
    'start = a:"a" "b" c:"c" { return [arguments.length, a, c]; }'
  );
  parses(multiElementLabeledParser, "abc", [2, "a", "c"]);

  var innerElementsUnlabeledParser = PEG.buildParser(
    'start = "a" ("b" "c" "d" { return arguments.length; }) "e"'
  );
  parses(innerElementsUnlabeledParser, "abcde", ["a", 0, "e"]);

  var innerElementsLabeledParser = PEG.buildParser(
    'start = "a" (b:"b" "c" d:"d" { return [arguments.length, b, d]; }) "e"'
  );
  parses(innerElementsLabeledParser, "abcde", ["a", [2, "b", "d"], "e"]);

  /* Test that the action is not called when its expression does not match. */
  var notAMatchParser = PEG.buildParser(
    'start = "a" { ok(false, "action got called when it should not be"); }'
  );
  doesNotParse(notAMatchParser, "b");
});

test("initializer", function() {
  var variableDefinitionParser = PEG.buildParser(
    '{ a = 42; }; start = "a" { return a; }'
  );
  parses(variableDefinitionParser, "a", 42);

  var functionDefinitionparser = PEG.buildParser(
    '{ function f() { return 42; } }; start = "a" { return f(); }'
  );
  parses(variableDefinitionParser, "a", 42);
});

test("rule references", function() {
  var parser = PEG.buildParser([
    'start   = static / dynamic',
    'static  = "C" / "C++" / "Java" / "C#"',
    'dynamic = "Ruby" / "Python" / "JavaScript"'
  ].join("\n"));
  parses(parser, "Java", "Java");
  parses(parser, "Python", "Python");
});

test("literals", function() {
  var parser = PEG.buildParser('start = "abcd"');
  parses(parser, "abcd", "abcd");
  doesNotParse(parser, "");
  doesNotParse(parser, "abc");
  doesNotParse(parser, "abcde");
  doesNotParse(parser, "efgh");

  /*
   * Test that the parsing position moves forward after successful parsing of
   * a literal.
   */
  var posTestParser = PEG.buildParser('start = "a" "b"');
  parses(posTestParser, "ab", ["a", "b"]);
});

test("anys", function() {
  var parser = PEG.buildParser('start = .');
  parses(parser, "a", "a");
  doesNotParse(parser, "");
  doesNotParse(parser, "ab");

  /*
   * Test that the parsing position moves forward after successful parsing of
   * an any.
   */
  var posTestParser = PEG.buildParser('start = . .');
  parses(posTestParser, "ab", ["a", "b"]);
});

test("classes", function() {
  var emptyClassParser = PEG.buildParser('start = []');
  doesNotParse(emptyClassParser, "");
  doesNotParse(emptyClassParser, "a");
  doesNotParse(emptyClassParser, "ab");

  var nonEmptyClassParser = PEG.buildParser('start = [ab-d]');
  parses(nonEmptyClassParser, "a", "a");
  parses(nonEmptyClassParser, "b", "b");
  parses(nonEmptyClassParser, "c", "c");
  parses(nonEmptyClassParser, "d", "d");
  doesNotParse(nonEmptyClassParser, "");
  doesNotParse(nonEmptyClassParser, "ab");

  var invertedEmptyClassParser = PEG.buildParser('start = [^]');
  doesNotParse(invertedEmptyClassParser, "");
  parses(invertedEmptyClassParser, "a", "a");
  doesNotParse(invertedEmptyClassParser, "ab");

  var invertedNonEmptyClassParser = PEG.buildParser('start = [^ab-d]');
  doesNotParse(invertedNonEmptyClassParser, "a", "a");
  doesNotParse(invertedNonEmptyClassParser, "b", "b");
  doesNotParse(invertedNonEmptyClassParser, "c", "c");
  doesNotParse(invertedNonEmptyClassParser, "d", "d");
  doesNotParse(invertedNonEmptyClassParser, "");
  doesNotParse(invertedNonEmptyClassParser, "ab");

  /*
   * Test that the parsing position moves forward after successful parsing of
   * a class.
   */
  var posTestParser = PEG.buildParser('start = [ab-d] [ab-d]');
  parses(posTestParser, "ab", ["a", "b"]);
});

test("cache", function() {
  /*
   * Should trigger a codepath where the cache is used (for the "a" rule).
   */
  var parser = PEG.buildParser([
    'start = (a b) / (a c)',
    'a     = "a"',
    'b     = "b"',
    'c     = "c"'
  ].join("\n"));
  parses(parser, "ac", ["a", "c"]);
});

test("indempotence", function() {
  var parser1 = PEG.buildParser('start = "abcd"');
  var parser2 = PEG.buildParser('start = "abcd"');

  strictEqual(parser1.toSource(), parser2.toSource());
});

test("error messages", function() {
  var literalParser = PEG.buildParser('start = "abcd"');
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

  var classParser = PEG.buildParser('start = [a-d]');
  doesNotParseWithMessage(
    classParser,
    "",
    'Expected [a-d] but end of input found.'
  );
  var negativeClassParser = PEG.buildParser('start = [^a-d]');
  doesNotParseWithMessage(
    negativeClassParser,
    "",
    'Expected [^a-d] but end of input found.'
  );

  var anyParser = PEG.buildParser('start = .');
  doesNotParseWithMessage(
    anyParser,
    "",
    'Expected any character but end of input found.'
  );

  var namedRuleWithLiteralParser = PEG.buildParser('start "digit" = [0-9]');
  doesNotParseWithMessage(
    namedRuleWithLiteralParser,
    "a",
    'Expected digit but "a" found.'
  );

  var namedRuleWithAnyParser = PEG.buildParser('start "whatever" = .');
  doesNotParseWithMessage(
    namedRuleWithAnyParser,
    "",
    'Expected whatever but end of input found.'
  );

  var namedRuleWithNamedRuleParser = PEG.buildParser([
    'start "digits" = digit+',
    'digit "digit"  = [0-9]'
  ].join("\n"));
  doesNotParseWithMessage(
    namedRuleWithNamedRuleParser,
    "",
    'Expected digits but end of input found.'
  );

  var choiceParser1 = PEG.buildParser('start = "a" / "b" / "c"');
  doesNotParseWithMessage(
    choiceParser1,
    "def",
    'Expected "a", "b" or "c" but "d" found.'
  );

  var choiceParser2 = PEG.buildParser('start = "a" "b" "c" / "a"');
  doesNotParseWithMessage(
    choiceParser2,
    "abd",
    'Expected "c" but "d" found.'
  );

  var notPredicateParser = PEG.buildParser('start = !"a" "b"');
  doesNotParseWithMessage(
    notPredicateParser,
    "c",
    'Expected "b" but "c" found.'
  );

  var andPredicateParser = PEG.buildParser('start = &"a" [a-b]');
  doesNotParseWithMessage(
    andPredicateParser,
    "c",
    'Expected end of input but "c" found.'
  );

  var emptyParser = PEG.buildParser('start = ');
  doesNotParseWithMessage(
    emptyParser,
    "something",
    'Expected end of input but "s" found.'
  );

  var duplicateErrorParser = PEG.buildParser('start = "a" / "a"');
  doesNotParseWithMessage(
    duplicateErrorParser,
    "",
    'Expected "a" but end of input found.'
  );

  var unsortedErrorsParser = PEG.buildParser('start = "b" / "a"');
  doesNotParseWithMessage(
    unsortedErrorsParser,
    "",
    'Expected "a" or "b" but end of input found.'
  );
});

test("error positions", function() {
  var parser = PEG.buildParser([
    'start  = line (("\\r" / "\\n" / "\\u2028" / "\\u2029")+ line)*',
    'line   = digits (" "+ digits)*',
    'digits = digits:[0-9]+ { return digits.join(""); }'
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
    'Value   = digits:[0-9]+     { return parseInt(digits.join("")); }',
    '        / "(" expr:Expr ")" { return expr; }',
    'Product = head:Value tail:(("*" / "/") Value)* {',
    '            var result = head;',
    '            for (var i = 0; i < tail.length; i++) {',
    '              if (tail[i][0] == "*") { result *= tail[i][1]; }',
    '              if (tail[i][0] == "/") { result /= tail[i][1]; }',
    '            }',
    '            return result;',
    '          }',
    'Sum     = head:Product tail:(("+" / "-") Product)* {',
    '            var result = head;',
    '            for (var i = 0; i < tail.length; i++) {',
    '              if (tail[i][0] == "+") { result += tail[i][1]; }',
    '              if (tail[i][0] == "-") { result -= tail[i][1]; }',
    '            }',
    '            return result;',
    '          }',
    'Expr    = Sum'
  ].join("\n"), "Expr");

  /* Test "value" rule. */
  parses(parser, "0", 0);
  parses(parser, "123", 123);
  parses(parser, "(42+43)", 42+43);

  /* Test "product" rule. */
  parses(parser, "42", 42);
  parses(parser, "42*43", 42*43);
  parses(parser, "42*43*44*45", 42*43*44*45);
  parses(parser, "42/43", 42/43);
  parses(parser, "42/43/44/45", 42/43/44/45);

  /* Test "sum" rule. */
  parses(parser, "42*43", 42*43);
  parses(parser, "42*43+44*45", 42*43+44*45);
  parses(parser, "42*43+44*45+46*47+48*49", 42*43+44*45+46*47+48*49);
  parses(parser, "42*43-44*45", 42*43-44*45);
  parses(parser, "42*43-44*45-46*47-48*49", 42*43-44*45-46*47-48*49);

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
    'S = &(A "c") a:"a"+ B:B !("a" / "b" / "c") { return a.join("") + B; }',
    'A = a:"a" A:A? b:"b" { return a + A + b; }',
    'B = b:"b" B:B? c:"c" { return b + B + c; }',
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
    'Begin = "(*"',
    'End   = "*)"',
    'C     = begin:Begin ns:N* end:End { return begin + ns.join("") + end; }',
    'N     = C',
    '      / !Begin !End z:Z { return z; }',
    'Z     = .'
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

})();
