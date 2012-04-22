(function() {

module("PEG.compiler");

function testWithVaryingTrackLineAndColumn(name, callback) {
  test(
    name + " (with trackLineAndColumn: false) ",
    function() { callback({ trackLineAndColumn: false }); }
  );
  test(
    name + " (with trackLineAndColumn: true) ",
    function() { callback({ trackLineAndColumn: true }); }
  );
}

testWithVaryingTrackLineAndColumn("indempotence", function(options) {
  var parser1 = PEG.buildParser('start = "abcd"', options);
  var parser2 = PEG.buildParser('start = "abcd"', options);

  strictEqual(parser1.toSource(), parser2.toSource());
});

testWithVaryingTrackLineAndColumn("error details", function(options) {
  var literalParser = PEG.buildParser('start = "abcd"', options);
  doesNotParseWithDetails(
    literalParser,
    "",
    ["\"abcd\""],
    null,
    'Expected "abcd" but end of input found.'
  );
  doesNotParseWithDetails(
    literalParser,
    "efgh",
    ["\"abcd\""],
    "e",
    'Expected "abcd" but "e" found.'
  );
  doesNotParseWithDetails(
    literalParser,
    "abcde",
    [],
    "e",
    'Expected end of input but "e" found.'
  );

  var classParser = PEG.buildParser('start = [a-d]', options);
  doesNotParseWithDetails(
    classParser,
    "",
    ["[a-d]"],
    null,
    'Expected [a-d] but end of input found.'
  );
  var negativeClassParser = PEG.buildParser('start = [^a-d]', options);
  doesNotParseWithDetails(
    negativeClassParser,
    "",
    ["[^a-d]"],
    null,
    'Expected [^a-d] but end of input found.'
  );

  var anyParser = PEG.buildParser('start = .', options);
  doesNotParseWithDetails(
    anyParser,
    "",
    ["any character"],
    null,
    'Expected any character but end of input found.'
  );

  var namedRuleWithLiteralParser = PEG.buildParser(
    'start "digit" = [0-9]',
    options
  );
  doesNotParseWithDetails(
    namedRuleWithLiteralParser,
    "a",
    ["digit"],
    "a",
    'Expected digit but "a" found.'
  );

  var namedRuleWithAnyParser = PEG.buildParser('start "whatever" = .', options);
  doesNotParseWithDetails(
    namedRuleWithAnyParser,
    "",
    ["whatever"],
    null,
    'Expected whatever but end of input found.'
  );

  var namedRuleWithNamedRuleParser = PEG.buildParser([
    'start "digits" = digit+',
    'digit "digit"  = [0-9]'
  ].join("\n"), options);
  doesNotParseWithDetails(
    namedRuleWithNamedRuleParser,
    "",
    ["digits"],
    null,
    'Expected digits but end of input found.'
  );

  var choiceParser1 = PEG.buildParser('start = "a" / "b" / "c"', options);
  doesNotParseWithDetails(
    choiceParser1,
    "def",
    ["\"a\"", "\"b\"", "\"c\""],
    "d",
    'Expected "a", "b" or "c" but "d" found.'
  );

  var choiceParser2 = PEG.buildParser('start = "a" "b" "c" / "a"', options);
  doesNotParseWithDetails(
    choiceParser2,
    "abd",
    ["\"c\""],
    "d",
    'Expected "c" but "d" found.'
  );

  var simpleNotParser = PEG.buildParser('start = !"a" "b"', options);
  doesNotParseWithDetails(
    simpleNotParser,
    "c",
    ["\"b\""],
    "c",
    'Expected "b" but "c" found.'
  );

  var simpleAndParser = PEG.buildParser('start = &"a" [a-b]', options);
  doesNotParseWithDetails(
    simpleAndParser,
    "c",
    [],
    "c",
    'Expected end of input but "c" found.'
  );

  var emptyParser = PEG.buildParser('start = ', options);
  doesNotParseWithDetails(
    emptyParser,
    "something",
    [],
    "s",
    'Expected end of input but "s" found.'
  );

  var duplicateErrorParser = PEG.buildParser('start = "a" / "a"', options);
  doesNotParseWithDetails(
    duplicateErrorParser,
    "",
    ["\"a\""],
    null,
    'Expected "a" but end of input found.'
  );

  var unsortedErrorsParser = PEG.buildParser('start = "b" / "a"', options);
  doesNotParseWithDetails(
    unsortedErrorsParser,
    "",
    ["\"a\"", "\"b\""],
    null,
    'Expected "a" or "b" but end of input found.'
  );
});

testWithVaryingTrackLineAndColumn("error positions", function(options) {
  var simpleParser = PEG.buildParser('start = "a"', options);

  /* Regular match failure */
  doesNotParseWithPos(simpleParser, "b", 0, 1, 1);

  /* Trailing input */
  doesNotParseWithPos(simpleParser, "ab", 1, 1, 2);

  var digitsParser = PEG.buildParser([
    'start  = line (("\\r" / "\\n" / "\\u2028" / "\\u2029")+ line)*',
    'line   = digits (" "+ digits)*',
    'digits = digits:[0-9]+ { return digits.join(""); }'
  ].join("\n"), options);

  doesNotParseWithPos(digitsParser, "1\n2\n\n3\n\n\n4 5 x", 13, 7, 5);

  /* Non-Unix newlines */
  doesNotParseWithPos(digitsParser, "1\rx", 2, 2, 1);   // Old Mac
  doesNotParseWithPos(digitsParser, "1\r\nx", 3, 2, 1); // Windows
  doesNotParseWithPos(digitsParser, "1\n\rx", 3, 3, 1); // mismatched

  /* Strange newlines */
  doesNotParseWithPos(digitsParser, "1\u2028x", 2, 2, 1); // line separator
  doesNotParseWithPos(digitsParser, "1\u2029x", 2, 2, 1); // paragraph separator
});

testWithVaryingTrackLineAndColumn("start rule", function(options) {
  var parser = PEG.buildParser([
    'a = .* { return "alpha"; }',
    'b = .* { return "beta"; }'
  ].join("\n"), options);

  /* Default start rule = the first one */
  parses(parser, "whatever", "alpha");

  /* Explicit specification of the start rule */
  parsesWithStartRule(parser, "whatever", "a", "alpha");
  parsesWithStartRule(parser, "whatever", "b", "beta");

  /* Invalid rule name */
  raises(
    function() { parser.parse("whatever", "c"); },
    function(e) {
      return e instanceof Error && e.message === "Invalid rule name: \"c\".";
    }
  );
});

/*
 * Following examples are from Wikipedia, see
 * http://en.wikipedia.org/w/index.php?title=Parsing_expression_grammar&oldid=335106938.
 */

testWithVaryingTrackLineAndColumn("arithmetics", function(options) {
  /*
   * Value   ← [0-9]+ / '(' Expr ')'
   * Product ← Value (('*' / '/') Value)*
   * Sum     ← Product (('+' / '-') Product)*
   * Expr    ← Sum
   */
  var parser = PEG.buildParser([
    'Expr    = Sum',
    'Sum     = head:Product tail:(("+" / "-") Product)* {',
    '            var result = head;',
    '            for (var i = 0; i < tail.length; i++) {',
    '              if (tail[i][0] == "+") { result += tail[i][1]; }',
    '              if (tail[i][0] == "-") { result -= tail[i][1]; }',
    '            }',
    '            return result;',
    '          }',
    'Product = head:Value tail:(("*" / "/") Value)* {',
    '            var result = head;',
    '            for (var i = 0; i < tail.length; i++) {',
    '              if (tail[i][0] == "*") { result *= tail[i][1]; }',
    '              if (tail[i][0] == "/") { result /= tail[i][1]; }',
    '            }',
    '            return result;',
    '          }',
    'Value   = digits:[0-9]+     { return parseInt(digits.join("")); }',
    '        / "(" expr:Expr ")" { return expr; }'
  ].join("\n"), options);

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

testWithVaryingTrackLineAndColumn("non-context-free language", function(options) {
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
    'B = b:"b" B:B? c:"c" { return b + B + c; }'
  ].join("\n"), options);

  parses(parser, "abc", "abc");
  parses(parser, "aaabbbccc", "aaabbbccc");
  doesNotParse(parser, "aabbbccc");
  doesNotParse(parser, "aaaabbbccc");
  doesNotParse(parser, "aaabbccc");
  doesNotParse(parser, "aaabbbbccc");
  doesNotParse(parser, "aaabbbcc");
  doesNotParse(parser, "aaabbbcccc");
});

testWithVaryingTrackLineAndColumn("nested comments", function(options) {
  /*
   * Begin ← "(*"
   * End ← "*)"
   * C ← Begin N* End
   * N ← C / (!Begin !End Z)
   * Z ← any single character
   */
  var parser = PEG.buildParser([
    'C     = begin:Begin ns:N* end:End { return begin + ns.join("") + end; }',
    'N     = C',
    '      / !Begin !End z:Z { return z; }',
    'Z     = .',
    'Begin = "(*"',
    'End   = "*)"'
  ].join("\n"), options);

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
