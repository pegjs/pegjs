(function() {

var global = this;

/* ===== Helpers ===== */

global.grammarParserParses = function(input, expected) {
  global.parses(PEG.grammarParser, input, expected);
};

global.grammarParserDoesNotParse = function(input) {
  global.doesNotParse(PEG.grammarParser, input);
}

global.grammarParserDoesNotParseWithMessage = function(input, message) {
  global.doesNotParseWithMessage(PEG.grammarParser, input, message);
}

/* ===== Grammar Parser ===== */

module("Grammar Parser");

function initializer(code) {
  return {
    type: "initializer",
    code: code
  };
}

function rule(name, displayName, expression) {
  return {
    type:        "rule",
    name:        name,
    displayName: displayName,
    expression:  expression
  };
}

function choice(alternatives) {
  return {
    type:        "choice",
    alternatives: alternatives
  };
}

function sequence(elements) {
  return {
    type:     "sequence",
    elements: elements
  };
}

function labeled(label, expression) {
  return {
    type:       "labeled",
    label:      label,
    expression: expression
  };
}

function nodeWithExpressionConstructor(type) {
  return function(expression) {
    return {
      type:       type,
      expression: expression
    };
  }
}

function nodeWithCodeConstructor(type) {
  return function(code) {
    return {
      type: type,
      code: code
    };
  }
}

var simpleAnd = nodeWithExpressionConstructor("simple_and");
var simpleNot = nodeWithExpressionConstructor("simple_not");

var semanticAnd = nodeWithCodeConstructor("semantic_and");
var semanticNot = nodeWithCodeConstructor("semantic_not");

var optional     = nodeWithExpressionConstructor("optional");
var zeroOrMore   = nodeWithExpressionConstructor("zero_or_more");
var oneOrMore    = nodeWithExpressionConstructor("one_or_more");

function action(expression, code) {
  return {
    type:       "action",
    expression: expression,
    code:       code
  };
};

function ruleRef(name) {
  return {
    type: "rule_ref",
    name: name
  };
}

function literal(value) {
  return {
    type:  "literal",
    value: value
  };
}

function any() {
  return { type: "any" };
}

function klass(inverted, parts, rawText) {
  return {
    type:     "class",
    inverted: inverted,
    parts:    parts,
    rawText:  rawText
  };
}

var literalAbcd  = literal("abcd");
var literalEfgh  = literal("efgh");
var literalIjkl  = literal("ijkl");

var optionalLiteral = optional(literalAbcd);

var labeledAbcd = labeled("a", literalAbcd);
var labeledEfgh = labeled("e", literalEfgh);
var labeledIjkl = labeled("i", literalIjkl);

var sequenceEmpty    = sequence([]);
var sequenceLabeleds = sequence([labeledAbcd, labeledEfgh, labeledIjkl]);
var sequenceLiterals = sequence([literalAbcd, literalEfgh, literalIjkl]);

var choiceLiterals = choice([literalAbcd, literalEfgh, literalIjkl]);

function oneRuleGrammar(expression) {
  return {
    type:        "grammar",
    initializer: null,
    rules:       { start: rule("start", null, expression) },
    startRule:   "start"
  };
}

var simpleGrammar = oneRuleGrammar(literal("abcd"));

function identifierGrammar(identifier) {
  return oneRuleGrammar(ruleRef(identifier));
}

var literal_ = literal
function literalGrammar(literal) {
  return oneRuleGrammar(literal_(literal));
}

function classGrammar(inverted, parts, rawText) {
  return oneRuleGrammar(klass(inverted, parts, rawText));
}

var anyGrammar = oneRuleGrammar(any());

var action_ = action;
function actionGrammar(action) {
  return oneRuleGrammar(action_(literal("a"), action));
}

var initializerGrammar = {
  type:        "grammar",
  initializer: initializer(" code "),
  rules: {
    a: rule("a", null, literalAbcd),
  },
  startRule:   "a"
};

/* Canonical grammar is "a: \"abcd\"; b: \"efgh\"; c: \"ijkl\";". */
test("parses grammar", function() {
  grammarParserParses(
    'a = "abcd"',
    {
      type:        "grammar",
      initializer: null,
      rules:       { a: rule("a", null, literalAbcd) },
      startRule:   "a"
    }
  );
  grammarParserParses('{ code }; a = "abcd"', initializerGrammar);
  grammarParserParses(
    'a = "abcd"; b = "efgh"; c = "ijkl"',
    {
      type:        "grammar",
      initializer: null,
      rules: {
        a: rule("a", null, literalAbcd),
        b: rule("b", null, literalEfgh),
        c: rule("c", null, literalIjkl)
      },
      startRule:   "a"
    }
  );
});

/* Canonical initializer is "{ code }". */
test("parses initializer", function() {
  grammarParserParses('{ code }a = "abcd"', initializerGrammar);
  grammarParserParses('{ code };a = "abcd"', initializerGrammar);
});

/* Canonical rule is "a: \"abcd\"". */
test("parses rule", function() {
  grammarParserParses(
    'start = "abcd" / "efgh" / "ijkl"',
    oneRuleGrammar(choiceLiterals)
  );
  grammarParserParses(
    'start "start rule" = "abcd" / "efgh" / "ijkl"',
    {
      type:        "grammar",
      initializer: null,
      rules:       { start: rule("start", "start rule", choiceLiterals) },
      startRule:   "start"
    }
  );
  grammarParserParses(
    'start = "abcd" / "efgh" / "ijkl";',
    oneRuleGrammar(choiceLiterals)
  );
});

/* Canonical expression is "\"abcd\" / \"efgh\" / \"ijkl\"". */
test("parses expression", function() {
  grammarParserParses(
    'start = "abcd" / "efgh" / "ijkl"',
    oneRuleGrammar(choiceLiterals)
  );
});

/* Canonical choice is "\"abcd\" / \"efgh\" / \"ijkl\"". */
test("parses choice", function() {
  grammarParserParses(
    'start = "abcd" "efgh" "ijkl"',
    oneRuleGrammar(sequenceLiterals)
  );
  grammarParserParses(
    'start = "abcd" "efgh" "ijkl" / "abcd" "efgh" "ijkl" / "abcd" "efgh" "ijkl"',
    oneRuleGrammar(choice([
      sequenceLiterals,
      sequenceLiterals,
      sequenceLiterals
    ]))
  );
});

/* Canonical sequence is "\"abcd\" \"efgh\" \"ijkl\"". */
test("parses sequence", function() {
  grammarParserParses(
    'start = { code }',
    oneRuleGrammar(action(sequenceEmpty, " code "))
  );
  grammarParserParses(
    'start = a:"abcd" { code }',
    oneRuleGrammar(action(labeledAbcd, " code "))
  );
  grammarParserParses(
    'start = a:"abcd" e:"efgh" i:"ijkl" { code }',
    oneRuleGrammar(action(sequenceLabeleds, " code "))
  );

  grammarParserParses('start = ',         oneRuleGrammar(sequenceEmpty));
  grammarParserParses('start = a:"abcd"', oneRuleGrammar(labeledAbcd));
  grammarParserParses(
    'start = a:"abcd" e:"efgh" i:"ijkl"',
    oneRuleGrammar(sequenceLabeleds)
  );
});

/* Canonical labeled is "label:\"abcd\"". */
test("parses labeled", function() {
  grammarParserParses(
    'start = label:!"abcd"',
    oneRuleGrammar(labeled("label", simpleNot(literalAbcd)))
  );
  grammarParserParses(
    'start = !"abcd"',
    oneRuleGrammar(simpleNot(literalAbcd))
  );
});

/* Canonical prefixed is "!\"abcd\"". */
test("parses prefixed", function() {
  grammarParserParses('start = &{ code }', oneRuleGrammar(semanticAnd(" code ")));
  grammarParserParses('start = &"abcd"?',  oneRuleGrammar(simpleAnd(optionalLiteral)));
  grammarParserParses('start = !{ code }', oneRuleGrammar(semanticNot(" code ")));
  grammarParserParses('start = !"abcd"?',  oneRuleGrammar(simpleNot(optionalLiteral)));
  grammarParserParses('start = "abcd"?',   oneRuleGrammar(optionalLiteral));
});

/* Canonical suffixed is "\"abcd\"?". */
test("parses suffixed", function() {
  grammarParserParses('start = "abcd"?', oneRuleGrammar(optionalLiteral));
  grammarParserParses('start = "abcd"*', oneRuleGrammar(zeroOrMore(literalAbcd)));
  grammarParserParses('start = "abcd"+', oneRuleGrammar(oneOrMore(literalAbcd)));
  grammarParserParses('start = "abcd"',  literalGrammar("abcd"));
});

/* Canonical primary is "\"abcd\"". */
test("parses primary", function() {
  grammarParserParses('start = a',        identifierGrammar("a"));
  grammarParserParses('start = "abcd"',   literalGrammar("abcd"));
  grammarParserParses('start = .',        anyGrammar);
  grammarParserParses('start = [a-d]',    classGrammar(false, [["a", "d"]], "[a-d]"));
  grammarParserParses('start = ("abcd")', literalGrammar("abcd"));
});

/* Canonical action is "{ code }". */
test("parses action", function() {
  grammarParserParses('start = "a" { code }', actionGrammar(" code "));
});

/* Canonical braced is "{ code }". */
test("parses braced", function() {
  grammarParserParses('start = "a" {}',    actionGrammar(""));
  grammarParserParses('start = "a" {a}',   actionGrammar("a"));
  grammarParserParses('start = "a" {{a}}', actionGrammar("{a}"));
  grammarParserParses('start = "a" {aaa}', actionGrammar("aaa"));
});

/* Trivial character rules are not tested. */

/* Canonical identifier is "a". */
test("parses identifier", function() {
  grammarParserParses('start = a',    identifierGrammar("a"));
  grammarParserParses('start = z',    identifierGrammar("z"));
  grammarParserParses('start = A',    identifierGrammar("A"));
  grammarParserParses('start = Z',    identifierGrammar("Z"));
  grammarParserParses('start = _',    identifierGrammar("_"));
  grammarParserParses('start = $',    identifierGrammar("$"));
  grammarParserParses('start = aa',   identifierGrammar("aa"));
  grammarParserParses('start = az',   identifierGrammar("az"));
  grammarParserParses('start = aA',   identifierGrammar("aA"));
  grammarParserParses('start = aZ',   identifierGrammar("aZ"));
  grammarParserParses('start = a0',   identifierGrammar("a0"));
  grammarParserParses('start = a9',   identifierGrammar("a9"));
  grammarParserParses('start = a_',   identifierGrammar("a_"));
  grammarParserParses('start = a$',   identifierGrammar("a$"));
  grammarParserParses('start = abcd', identifierGrammar("abcd"));

  grammarParserParses('start = a\n',  identifierGrammar("a"));
});

/* Canonical literal is "\"abcd\"". */
test("parses literal", function() {
  grammarParserParses('start = "abcd"', literalGrammar("abcd"));
  grammarParserParses("start = 'abcd'", literalGrammar("abcd"));
});

/* Canonical doubleQuotedLiteral is "\"abcd\"". */
test("parses doubleQuotedLiteral", function() {
  grammarParserParses('start = ""',       literalGrammar(""));
  grammarParserParses('start = "a"',      literalGrammar("a"));
  grammarParserParses('start = "abc"',    literalGrammar("abc"));

  grammarParserParses('start = "abcd"\n', literalGrammar("abcd"));
});

/* Canonical doubleQuotedCharacter is "a". */
test("parses doubleQuotedCharacter", function() {
  grammarParserParses('start = "a"',       literalGrammar("a"));
  grammarParserParses('start = "\\n"',     literalGrammar("\n"));
  grammarParserParses('start = "\\0"',     literalGrammar("\0"));
  grammarParserParses('start = "\\x00"',   literalGrammar("\x00"));
  grammarParserParses('start = "\\u0120"', literalGrammar("\u0120"));
  grammarParserParses('start = "\\\n"',    literalGrammar("\n"));
});

/* Canonical simpleDoubleQuotedCharacter is "a". */
test("parses simpleDoubleQuotedCharacter", function() {
  grammarParserParses('start = "a"',  literalGrammar("a"));
  grammarParserParses('start = "\'"', literalGrammar("'"));
  grammarParserDoesNotParse('start = """');
  grammarParserDoesNotParse('start = "\\"');
  grammarParserDoesNotParse('start = "\n"');
  grammarParserDoesNotParse('start = "\r"');
  grammarParserDoesNotParse('start = "\u2028"');
  grammarParserDoesNotParse('start = "\u2029"');
});

/* Canonical singleQuotedLiteral is "'abcd'". */
test("parses singleQuotedLiteral", function() {
  grammarParserParses("start = ''",       literalGrammar(""));
  grammarParserParses("start = 'a'",      literalGrammar("a"));
  grammarParserParses("start = 'abc'",    literalGrammar("abc"));

  grammarParserParses("start = 'abcd'\n", literalGrammar("abcd"));
});

/* Canonical singleQuotedCharacter is "a". */
test("parses singleQuotedCharacter", function() {
  grammarParserParses("start = 'a'",       literalGrammar("a"));
  grammarParserParses("start = '\\n'",     literalGrammar("\n"));
  grammarParserParses("start = '\\0'",     literalGrammar("\0"));
  grammarParserParses("start = '\\x00'",   literalGrammar("\x00"));
  grammarParserParses("start = '\\u0120'", literalGrammar("\u0120"));
  grammarParserParses("start = '\\\n'",    literalGrammar("\n"));
});

/* Canonical simpleSingleQuotedCharacter is "a". */
test("parses simpleSingleQuotedCharacter", function() {
  grammarParserParses("start = 'a'",  literalGrammar("a"));
  grammarParserParses("start = '\"'", literalGrammar("\""));
  grammarParserDoesNotParse("start = '''");
  grammarParserDoesNotParse("start = '\\'");
  grammarParserDoesNotParse("start = '\n'");
  grammarParserDoesNotParse("start = '\r'");
  grammarParserDoesNotParse("start = '\u2028'");
  grammarParserDoesNotParse("start = '\u2029'");
});

/* Canonical class is "[a-d]". */
test("parses class", function() {
  grammarParserParses("start = []",     classGrammar(false, [],           "[]"));
  grammarParserParses("start = [a-d]",  classGrammar(false, [["a", "d"]], "[a-d]"));
  grammarParserParses("start = [^a-d]", classGrammar(true,  [["a", "d"]], "[^a-d]"));
  grammarParserParses("start = [a]",    classGrammar(false, ["a"],        "[a]"));
  grammarParserParses(
    "start = [a-de-hi-l]",
    classGrammar(false, [["a", "d"], ["e", "h"], ["i", "l"]], "[a-de-hi-l]")
  );

  grammarParserParses("start = [a-d]\n", classGrammar(false, [["a", "d"]], "[a-d]"));
});

/* Canonical classCharacterRange is "a-d". */
test("parses classCharacterRange", function() {
  grammarParserParses("start = [a-d]", classGrammar(false, [["a", "d"]], "[a-d]"));
  grammarParserParses("start = [a-a]", classGrammar(false, [["a", "a"]], "[a-a]"));
  grammarParserDoesNotParse("start = [b-a]");
  grammarParserDoesNotParseWithMessage(
    "start = [b-a]",
    "Invalid character range: b-a."
  );
});

/* Canonical classCharacter is "a". */
test("parses classCharacter", function() {
  grammarParserParses("start = [a]", classGrammar(false, ["a"], "[a]"));
});

/* Canonical bracketDelimitedCharacter is "a". */
test("parses bracketDelimitedCharacter", function() {
  grammarParserParses("start = [a]",       classGrammar(false, ["a"], "[a]"));
  grammarParserParses("start = [\\n]",     classGrammar(false, ["\n"], "[\\n]"));
  grammarParserParses("start = [\\0]",     classGrammar(false, ["\0"], "[\\0]"));
  grammarParserParses("start = [\\x00]",   classGrammar(false, ["\0"], "[\\0]"));
  grammarParserParses("start = [\\u0120]", classGrammar(false, ["\u0120"], "[\u0120]"));
  grammarParserParses("start = [\\\n]",    classGrammar(false, ["\n"], "[\\n]"));
});

/* Canonical simpleBracketDelimiedCharacter is "a". */
test("parses simpleBracketDelimitedCharacter", function() {
  grammarParserParses("start = [a]",  classGrammar(false, ["a"], "[a]"));
  grammarParserParses("start = [[]",  classGrammar(false, ["["], "[[]"));
  grammarParserDoesNotParse("start = []]");
  grammarParserDoesNotParse("start = [\\]");
  grammarParserDoesNotParse("start = [\n]");
  grammarParserDoesNotParse("start = [\r]");
  grammarParserDoesNotParse("start = [\u2028]");
  grammarParserDoesNotParse("start = [\u2029]");
});

/* Canonical simpleEscapeSequence is "\\n". */
test("parses simpleEscapeSequence", function() {
  grammarParserParses('start = "\\\'"', literalGrammar("'"));
  grammarParserParses('start = "\\""',  literalGrammar("\""));
  grammarParserParses('start = "\\\\"', literalGrammar("\\"));
  grammarParserParses('start = "\\b"',  literalGrammar("\b"));
  grammarParserParses('start = "\\f"',  literalGrammar("\f"));
  grammarParserParses('start = "\\n"',  literalGrammar("\n"));
  grammarParserParses('start = "\\r"',  literalGrammar("\r"));
  grammarParserParses('start = "\\t"',  literalGrammar("\t"));
  /* IE does not recognize "\v". */
  grammarParserParses('start = "\\v"',  literalGrammar("\x0B"));

  grammarParserParses('start = "\\a"',  literalGrammar("a"));
});

/* Canonical zeroEscapeSequence is "\\0". */
test("parses zeroEscapeSequence", function() {
  grammarParserParses('start = "\\0"', literalGrammar("\0"));
  grammarParserDoesNotParse('start = "\\00"');
  grammarParserDoesNotParse('start = "\\09"');
});

/* Canonical hexEscapeSequence is "\\x00". */
test("parses hexEscapeSequence", function() {
  grammarParserParses('start = "\\x00"',  literalGrammar("\x00"));
  grammarParserParses('start = "\\x09"',  literalGrammar("\x09"));
  grammarParserParses('start = "\\x0a"',  literalGrammar("\x0a"));
  grammarParserParses('start = "\\x0f"',  literalGrammar("\x0f"));
  grammarParserParses('start = "\\x0A"',  literalGrammar("\x0A"));
  grammarParserParses('start = "\\x0F"',  literalGrammar("\x0F"));
  grammarParserDoesNotParse('start = "\\x0"');
  grammarParserParses('start = "\\x000"', literalGrammar("\x000"));
});

/* Canonical unicodeEscapeSequence is "\\u0120". */
test("parses unicodeEscapeSequence", function() {
  grammarParserParses('start = "\\u0120"',  literalGrammar("\u0120"));
  grammarParserParses('start = "\\u0129"',  literalGrammar("\u0129"));
  grammarParserParses('start = "\\u012a"',  literalGrammar("\u012a"));
  grammarParserParses('start = "\\u012f"',  literalGrammar("\u012f"));
  grammarParserParses('start = "\\u012A"',  literalGrammar("\u012A"));
  grammarParserParses('start = "\\u012F"',  literalGrammar("\u012F"));
  grammarParserDoesNotParse('start = "\\u012"');
  grammarParserParses('start = "\\u01234"', literalGrammar("\u01234"));
});

/* Canonical eolEscapeSequence is "\\\n". */
test("parses eolEscapeSequence", function() {
  grammarParserParses('start = "\\\n"',     literalGrammar("\n"));
  grammarParserParses('start = "\\\r\n"',   literalGrammar("\r\n"));
  grammarParserParses('start = "\\\r"',     literalGrammar("\r"));
  grammarParserParses('start = "\\\u2028"', literalGrammar("\u2028"));
  grammarParserParses('start = "\\\u2029"', literalGrammar("\u2029"));
});

/* Canonical __ is "\n". */
test("parses __", function() {
  grammarParserParses('start ="abcd"',              simpleGrammar);
  grammarParserParses('start = "abcd"',             simpleGrammar);
  grammarParserParses('start =\n"abcd"',            simpleGrammar);
  grammarParserParses('start =/* comment */"abcd"', simpleGrammar);
  grammarParserParses('start =   "abcd"',           simpleGrammar);
});

/* Trivial character class rules are not tested. */

/* Canonical comment is "\/* comment *\/". */
test("parses comment", function() {
  grammarParserParses('start =// comment\n"abcd"',  simpleGrammar);
  grammarParserParses('start =/* comment */"abcd"', simpleGrammar);
});
/* Canonical singleLineComment is "// comment". */
test("parses singleLineComment", function() {
  grammarParserParses('start =//\n"abcd"',    simpleGrammar);
  grammarParserParses('start =//a\n"abcd"',   simpleGrammar);
  grammarParserParses('start =//aaa\n"abcd"', simpleGrammar);
  grammarParserParses('start = "abcd"//',     simpleGrammar);
});

/* Canonical multiLineComment is "\/* comment *\/". */
test("parses multiLineComment", function() {
  grammarParserParses('start =/**/"abcd"',    simpleGrammar);
  grammarParserParses('start =/*a*/"abcd"',   simpleGrammar);
  grammarParserParses('start =/*aaa*/"abcd"', simpleGrammar);
  grammarParserParses('start =/*\n*/"abcd"',  simpleGrammar);
  grammarParserParses('start =/***/"abcd"',   simpleGrammar);
  grammarParserParses('start =/*a/*/"abcd"',  simpleGrammar);

  grammarParserDoesNotParse('start =/*"abcd"');
  grammarParserDoesNotParse('start =/*/"abcd"');
  grammarParserDoesNotParse('start =/*/**/*/"abcd"');
});

/* Canonical eol is "\n". */
test("parses eol", function() {
  grammarParserParses('start =\n"abcd"',     simpleGrammar);
  grammarParserParses('start =\r\n"abcd"',   simpleGrammar);
  grammarParserParses('start =\r"abcd"',     simpleGrammar);
  grammarParserParses('start =\u2028"abcd"', simpleGrammar);
  grammarParserParses('start =\u2029"abcd"', simpleGrammar);
});

/* Canonical eolChar is "\n". */
test("parses eolChar", function() {
  grammarParserParses('start =\n"abcd"',     simpleGrammar);
  grammarParserParses('start =\r"abcd"',     simpleGrammar);
  grammarParserParses('start =\u2028"abcd"', simpleGrammar);
  grammarParserParses('start =\u2029"abcd"', simpleGrammar);
});

/* Canonical whitespace is " ". */
test("parses whitespace", function() {
  grammarParserParses('start =\t"abcd"',     simpleGrammar);
  /* IE does not recognize "\v". */
  grammarParserParses('start =\x0B"abcd"',   simpleGrammar);
  grammarParserParses('start =\f"abcd"',     simpleGrammar);
  grammarParserParses('start = "abcd"',      simpleGrammar);
  grammarParserParses('start =\u00A0"abcd"', simpleGrammar);
  grammarParserParses('start =\uFEFF"abcd"', simpleGrammar);
  grammarParserParses('start =\u1680"abcd"', simpleGrammar);
  grammarParserParses('start =\u180E"abcd"', simpleGrammar);
  grammarParserParses('start =\u2000"abcd"', simpleGrammar);
  grammarParserParses('start =\u2001"abcd"', simpleGrammar);
  grammarParserParses('start =\u2002"abcd"', simpleGrammar);
  grammarParserParses('start =\u2003"abcd"', simpleGrammar);
  grammarParserParses('start =\u2004"abcd"', simpleGrammar);
  grammarParserParses('start =\u2005"abcd"', simpleGrammar);
  grammarParserParses('start =\u2006"abcd"', simpleGrammar);
  grammarParserParses('start =\u2007"abcd"', simpleGrammar);
  grammarParserParses('start =\u2008"abcd"', simpleGrammar);
  grammarParserParses('start =\u2009"abcd"', simpleGrammar);
  grammarParserParses('start =\u200A"abcd"', simpleGrammar);
  grammarParserParses('start =\u202F"abcd"', simpleGrammar);
  grammarParserParses('start =\u205F"abcd"', simpleGrammar);
  grammarParserParses('start =\u3000"abcd"', simpleGrammar);
});

})();
