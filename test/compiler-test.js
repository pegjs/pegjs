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

testWithVaryingTrackLineAndColumn("choices", function(options) {
  var parser = PEG.buildParser('start = "a" / "b" / "c"', options);
  parses(parser, "a", "a");
  parses(parser, "b", "b");
  parses(parser, "c", "c");
  doesNotParse(parser, "");
  doesNotParse(parser, "ab");
  doesNotParse(parser, "d");
});

testWithVaryingTrackLineAndColumn("sequences", function(options) {
  var emptySequenceParser = PEG.buildParser('start = ', options);
  parses(emptySequenceParser, "", []);
  doesNotParse(emptySequenceParser, "abc");

  var nonEmptySequenceParser = PEG.buildParser('start = "a" "b" "c"', options);
  parses(nonEmptySequenceParser, "abc", ["a", "b", "c"]);
  doesNotParse(nonEmptySequenceParser, "");
  doesNotParse(nonEmptySequenceParser, "ab");
  doesNotParse(nonEmptySequenceParser, "abcd");
  doesNotParse(nonEmptySequenceParser, "efg");

  /*
   * Test that the parsing position returns after unsuccessful parsing of a
   * sequence.
   */
  var posTestParser = PEG.buildParser('start = ("a" "b") / "a"', options);
  parses(posTestParser, "a", "a");
});

testWithVaryingTrackLineAndColumn("labels", function(options) {
  var parser = PEG.buildParser('start = label:"a"', options);
  parses(parser, "a", "a");
  doesNotParse(parser, "b");
});

testWithVaryingTrackLineAndColumn("simple and", function(options) {
  var parser = PEG.buildParser('start = "a" &"b" "b"', options);
  parses(parser, "ab", ["a", "", "b"]);
  doesNotParse(parser, "ac");

  /*
   * Test that the parsing position returns after successful parsing of a
   * predicate is not needed, it is implicit in the tests above.
   */
});

testWithVaryingTrackLineAndColumn("simple not", function(options) {
  var parser = PEG.buildParser('start = "a" !"b"', options);
  parses(parser, "a", ["a", ""]);
  doesNotParse(parser, "ab");

  /*
   * Test that the parsing position returns after successful parsing of a
   * predicate.
   */
  var posTestParser = PEG.buildParser('start = "a" !"b" "c"');
  parses(posTestParser, "ac", ["a", "", "c"]);
});

test("semantic and (with trackLineAndColumn: false)", function() {
  var options = { trackLineAndColumn: false };

  var acceptingParser = PEG.buildParser(
    'start = "a" &{ return true; } "b"',
    options
  );
  parses(acceptingParser, "ab", ["a", "", "b"]);

  var rejectingParser = PEG.buildParser(
    'start = "a" &{ return false; } "b"',
    options
  );
  doesNotParse(rejectingParser, "ab");

  var singleElementUnlabeledParser = PEG.buildParser(
    'start = "a" &{ return arguments.length === 1 && offset === 1; }',
    options
  );
  parses(singleElementUnlabeledParser, "a", ["a", ""]);

  var singleElementLabeledParser = PEG.buildParser([
    'start = a:"a" &{',
    '          return arguments.length === 2',
    '            && offset === 1',
    '            && a === "a";',
    '        }'
  ].join("\n"), options);
  parses(singleElementLabeledParser, "a", ["a", ""]);

  var multiElementUnlabeledParser = PEG.buildParser(
    'start = "a" "b" "c" &{ return arguments.length === 1 && offset === 3; }',
    options
  );
  parses(multiElementUnlabeledParser, "abc", ["a", "b", "c", ""]);

  var multiElementLabeledParser = PEG.buildParser([
    'start = a:"a" "b" c:"c" &{',
    '          return arguments.length === 3',
    '            && offset === 3',
    '            && a === "a"',
    '            && c === "c";',
    '        }'
  ].join("\n"), options);
  parses(multiElementLabeledParser, "abc", ["a", "b", "c", ""]);

  var innerElementsUnlabeledParser = PEG.buildParser([
    'start = "a"',
    '        ("b" "c" "d" &{ return arguments.length === 1 && offset === 4; })',
    '        "e"'
  ].join("\n"), options);
  parses(innerElementsUnlabeledParser, "abcde", ["a", ["b", "c", "d", ""], "e"]);

  var innerElementsLabeledParser = PEG.buildParser([
    'start = "a"',
    '        (',
    '          b:"b" "c" d:"d" &{',
    '            return arguments.length === 3',
    '              && offset === 4',
    '              && b === "b"',
    '              && d === "d";',
    '          }',
    '        )',
    '        "e"'
  ].join("\n"), options);
  parses(innerElementsLabeledParser, "abcde", ["a", ["b", "c", "d", ""], "e"]);
});

test("semantic and (with trackLineAndColumn: true)", function() {
  var options = { trackLineAndColumn: true };

  var acceptingParser = PEG.buildParser(
    'start = "a" &{ return true; } "b"',
    options
  );
  parses(acceptingParser, "ab", ["a", "", "b"]);

  var rejectingParser = PEG.buildParser(
    'start = "a" &{ return false; } "b"',
    options
  );
  doesNotParse(rejectingParser, "ab");

  var singleElementUnlabeledParser = PEG.buildParser([
    'start = "a" &{',
    '          return arguments.length === 3',
    '            && offset === 1',
    '            && line === 1',
    '            && column === 2;',
    '        }'
  ].join("\n"), options);
  parses(singleElementUnlabeledParser, "a", ["a", ""]);

  var singleElementLabeledParser = PEG.buildParser([
    'start = a:"a" &{',
    '          return arguments.length === 4',
    '            && offset === 1',
    '            && line === 1',
    '            && column === 2',
    '            && a === "a";',
    '        }'
  ].join("\n"), options);
  parses(singleElementLabeledParser, "a", ["a", ""]);

  var multiElementUnlabeledParser = PEG.buildParser([
    'start = "a" "b" "c" &{',
    '          return arguments.length === 3',
    '            && offset === 3',
    '            && line === 1',
    '            && column === 4;',
    '        }'
  ].join("\n"), options);
  parses(multiElementUnlabeledParser, "abc", ["a", "b", "c", ""]);

  var multiElementLabeledParser = PEG.buildParser([
    'start = a:"a" "b" c:"c" &{',
    '          return arguments.length === 5',
    '            && offset === 3',
    '            && line === 1',
    '            && column === 4',
    '            && a === "a"',
    '            && c === "c";',
    '        }'
  ].join("\n"), options);
  parses(multiElementLabeledParser, "abc", ["a", "b", "c", ""]);

  var innerElementsUnlabeledParser = PEG.buildParser([
    'start = "a"',
    '        (',
    '          "b" "c" "d" &{',
    '            return arguments.length === 3',
    '              && offset === 4',
    '              && line === 1',
    '              && column === 5;',
    '           }',
    '        )',
    '        "e"'
  ].join("\n"), options);
  parses(innerElementsUnlabeledParser, "abcde", ["a", ["b", "c", "d", ""], "e"]);

  var innerElementsLabeledParser = PEG.buildParser([
    'start = "a"',
    '        (',
    '          b:"b" "c" d:"d" &{',
    '            return arguments.length === 5',
    '              && offset === 4',
    '              && line === 1',
    '              && column === 5',
    '              && b === "b"',
    '              && d === "d";',
    '          }',
    '        )',
    '        "e"'
  ].join("\n"), options);
  parses(innerElementsLabeledParser, "abcde", ["a", ["b", "c", "d", ""], "e"]);

  var digitsParser = PEG.buildParser([
    '{ var result; }',
    'start  = line (nl+ line)* { return result; }',
    'line   = thing (" "+ thing)*',
    'thing  = digit / mark',
    'digit  = [0-9]',
    'mark   = &{ result = [line, column]; return true; } "x"',
    'nl     = ("\\r" / "\\n" / "\\u2028" / "\\u2029")'
  ].join("\n"), options);

  parses(digitsParser, "1\n2\n\n3\n\n\n4 5 x", [7, 5]);

  /* Non-Unix newlines */
  parses(digitsParser, "1\rx", [2, 1]);   // Old Mac
  parses(digitsParser, "1\r\nx", [2, 1]); // Windows
  parses(digitsParser, "1\n\rx", [3, 1]); // mismatched

  /* Strange newlines */
  parses(digitsParser, "1\u2028x", [2, 1]); // line separator
  parses(digitsParser, "1\u2029x", [2, 1]); // paragraph separator
});

test("semantic not (with trackLineAndColumn: false)", function() {
  var options = { trackLineAndColumn: false };

  var acceptingParser = PEG.buildParser(
    'start = "a" !{ return false; } "b"',
    options
  );
  parses(acceptingParser, "ab", ["a", "", "b"]);

  var rejectingParser = PEG.buildParser(
    'start = "a" !{ return true; } "b"',
    options
  );
  doesNotParse(rejectingParser, "ab");

  var singleElementUnlabeledParser = PEG.buildParser(
    'start = "a" !{ return arguments.length !== 1 || offset !== 1; }',
    options
  );
  parses(singleElementUnlabeledParser, "a", ["a", ""]);

  var singleElementLabeledParser = PEG.buildParser([
    'start = a:"a" !{',
    '          return arguments.length !== 2',
    '            || offset !== 1',
    '            || a !== "a";',
    '        }'
  ].join("\n"), options);
  parses(singleElementLabeledParser, "a", ["a", ""]);

  var multiElementUnlabeledParser = PEG.buildParser(
    'start = "a" "b" "c" !{ return arguments.length !== 1 || offset !== 3; }',
    options
  );
  parses(multiElementUnlabeledParser, "abc", ["a", "b", "c", ""]);

  var multiElementLabeledParser = PEG.buildParser([
    'start = a:"a" "b" c:"c" !{',
    '          return arguments.length !== 3',
    '            || offset !== 3',
    '            || a !== "a"',
    '            || c !== "c";',
    '        }'
  ].join("\n"), options);
  parses(multiElementLabeledParser, "abc", ["a", "b", "c", ""]);

  var innerElementsUnlabeledParser = PEG.buildParser([
    'start = "a"',
    '        ("b" "c" "d" !{ return arguments.length !== 1 || offset !== 4; })',
    '        "e"'
  ].join("\n"), options);
  parses(innerElementsUnlabeledParser, "abcde", ["a", ["b", "c", "d", ""], "e"]);

  var innerElementsLabeledParser = PEG.buildParser([
    'start = "a"',
    '        (',
    '          b:"b" "c" d:"d" !{',
    '            return arguments.length !== 3',
    '              || offset !== 4',
    '              || b !== "b"',
    '              || d !== "d";',
    '          }',
    '        )',
    '        "e"'
  ].join("\n"), options);
  parses(innerElementsLabeledParser, "abcde", ["a", ["b", "c", "d", ""], "e"]);
});

test("semantic not (with trackLineAndColumn: true)", function() {
  var options = { trackLineAndColumn: true };

  var acceptingParser = PEG.buildParser(
    'start = "a" !{ return false; } "b"',
    options
  );
  parses(acceptingParser, "ab", ["a", "", "b"]);

  var rejectingParser = PEG.buildParser(
    'start = "a" !{ return true; } "b"',
    options
  );
  doesNotParse(rejectingParser, "ab");

  var singleElementUnlabeledParser = PEG.buildParser([
    'start = "a" !{',
    '          return arguments.length !== 3',
    '            || offset !== 1',
    '            || line !== 1',
    '            || column !== 2;',
    '        }'
  ].join("\n"), options);
  parses(singleElementUnlabeledParser, "a", ["a", ""]);

  var singleElementLabeledParser = PEG.buildParser([
    'start = a:"a" !{',
    '          return arguments.length !== 4',
    '            || offset !== 1',
    '            || line !== 1',
    '            || column !== 2',
    '            || a !== "a";',
    '        }'
  ].join("\n"), options);
  parses(singleElementLabeledParser, "a", ["a", ""]);

  var multiElementUnlabeledParser = PEG.buildParser([
    'start = "a" "b" "c" !{',
    '          return arguments.length !== 3',
    '            || offset !== 3',
    '            || line !== 1',
    '            || column !== 4;',
    '        }'
  ].join("\n"), options);
  parses(multiElementUnlabeledParser, "abc", ["a", "b", "c", ""]);

  var multiElementLabeledParser = PEG.buildParser([
    'start = a:"a" "b" c:"c" !{',
    '          return arguments.length !== 5',
    '            || offset !== 3',
    '            || line !== 1',
    '            || column !== 4',
    '            || a !== "a"',
    '            || c !== "c";',
    '        }'
  ].join("\n"), options);
  parses(multiElementLabeledParser, "abc", ["a", "b", "c", ""]);

  var innerElementsUnlabeledParser = PEG.buildParser([
    'start = "a"',
    '        (',
    '          "b" "c" "d" !{',
    '            return arguments.length !== 3',
    '              || offset !== 4',
    '              || line !== 1',
    '              || column !== 5;',
    '           }',
    '        )',
    '        "e"'
  ].join("\n"), options);
  parses(innerElementsUnlabeledParser, "abcde", ["a", ["b", "c", "d", ""], "e"]);

  var innerElementsLabeledParser = PEG.buildParser([
    'start = "a"',
    '        (',
    '          b:"b" "c" d:"d" !{',
    '            return arguments.length !== 5',
    '              || offset !== 4',
    '              || line !== 1',
    '              || column !== 5',
    '              || b !== "b"',
    '              || d !== "d";',
    '          }',
    '        )',
    '        "e"'
  ].join("\n"), options);
  parses(innerElementsLabeledParser, "abcde", ["a", ["b", "c", "d", ""], "e"]);

  var digitsParser = PEG.buildParser([
    '{ var result; }',
    'start  = line (nl+ line)* { return result; }',
    'line   = thing (" "+ thing)*',
    'thing  = digit / mark',
    'digit  = [0-9]',
    'mark   = !{ result = [line, column]; return false; } "x"',
    'nl     = ("\\r" / "\\n" / "\\u2028" / "\\u2029")'
  ].join("\n"), options);

  parses(digitsParser, "1\n2\n\n3\n\n\n4 5 x", [7, 5]);

  /* Non-Unix newlines */
  parses(digitsParser, "1\rx", [2, 1]);   // Old Mac
  parses(digitsParser, "1\r\nx", [2, 1]); // Windows
  parses(digitsParser, "1\n\rx", [3, 1]); // mismatched

  /* Strange newlines */
  parses(digitsParser, "1\u2028x", [2, 1]); // line separator
  parses(digitsParser, "1\u2029x", [2, 1]); // paragraph separator
});

testWithVaryingTrackLineAndColumn("optional expressions", function(options) {
  var parser = PEG.buildParser('start = "a"?', options);
  parses(parser, "", "");
  parses(parser, "a", "a");
});

testWithVaryingTrackLineAndColumn("zero or more expressions", function(options) {
  var parser = PEG.buildParser('start = "a"*', options);
  parses(parser, "", []);
  parses(parser, "a", ["a"]);
  parses(parser, "aaa", ["a", "a", "a"]);
});

testWithVaryingTrackLineAndColumn("one or more expressions", function(options) {
  var parser = PEG.buildParser('start = "a"+', options);
  doesNotParse(parser, "");
  parses(parser, "a", ["a"]);
  parses(parser, "aaa", ["a", "a", "a"]);
});

testWithVaryingTrackLineAndColumn("initializer", function(options) {
  var variableInActionParser = PEG.buildParser(
    '{ a = 42; }; start = "a" { return a; }',
    options
  );
  parses(variableInActionParser, "a", 42);

  var functionInActionParser = PEG.buildParser(
    '{ function f() { return 42; } }; start = "a" { return f(); }',
    options
  );
  parses(functionInActionParser, "a", 42);

  var variableInSemanticAndParser = PEG.buildParser(
    '{ a = 42; }; start = "a" &{ return a === 42; }',
    options
  );
  parses(variableInSemanticAndParser, "a", ["a", ""]);

  var functionInSemanticAndParser = PEG.buildParser(
    '{ function f() { return 42; } }; start = "a" &{ return f() === 42; }',
    options
  );
  parses(functionInSemanticAndParser, "a", ["a", ""]);

  var variableInSemanticNotParser = PEG.buildParser(
    '{ a = 42; }; start = "a" !{ return a !== 42; }',
    options
  );
  parses(variableInSemanticNotParser, "a", ["a", ""]);

  var functionInSemanticNotParser = PEG.buildParser(
    '{ function f() { return 42; } }; start = "a" !{ return f() !== 42; }',
    options
  );
  parses(functionInSemanticNotParser, "a", ["a", ""]);
});

testWithVaryingTrackLineAndColumn("cache", function(options) {
  var grammar = [
    '{ var n = 0; }',
    'start = (a "b") / (a "c") { return n; }',
    'a     = "a" { n++; }'
  ].join("\n");

  /* Without cache */

  parses(PEG.buildParser(grammar, options), "ac", 2);

  options.cache = false;
  parses(PEG.buildParser(grammar, options), "ac", 2);

  /* With cache */

  options.cache = true;
  parses(PEG.buildParser(grammar, options), "ac", 1);
});

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
