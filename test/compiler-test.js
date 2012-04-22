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

})();
