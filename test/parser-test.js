(function(global) {

/* ===== Helpers ===== */

global.parserParses = function(input, expected) {
  global.parses(PEG.parser, input, expected);
};

global.parserDoesNotParse = function(input) {
  global.doesNotParse(PEG.parser, input);
}

global.parserDoesNotParseWithMessage = function(input, message) {
  global.doesNotParseWithMessage(PEG.parser, input, message);
}

/* ===== PEG.parser ===== */

module("PEG.parser");

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
  parserParses(
    'a = "abcd"',
    {
      type:        "grammar",
      initializer: null,
      rules:       { a: rule("a", null, literalAbcd) },
      startRule:   "a"
    }
  );
  parserParses('{ code }; a = "abcd"', initializerGrammar);
  parserParses(
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
  parserParses('{ code }a = "abcd"', initializerGrammar);
  parserParses('{ code };a = "abcd"', initializerGrammar);
});

/* Canonical rule is "a: \"abcd\"". */
test("parses rule", function() {
  parserParses(
    'start = "abcd" / "efgh" / "ijkl"',
    oneRuleGrammar(choiceLiterals)
  );
  parserParses(
    'start "start rule" = "abcd" / "efgh" / "ijkl"',
    {
      type:        "grammar",
      initializer: null,
      rules:       { start: rule("start", "start rule", choiceLiterals) },
      startRule:   "start"
    }
  );
  parserParses(
    'start = "abcd" / "efgh" / "ijkl";',
    oneRuleGrammar(choiceLiterals)
  );
});

/* Canonical expression is "\"abcd\" / \"efgh\" / \"ijkl\"". */
test("parses expression", function() {
  parserParses(
    'start = "abcd" / "efgh" / "ijkl"',
    oneRuleGrammar(choiceLiterals)
  );
});

/* Canonical choice is "\"abcd\" / \"efgh\" / \"ijkl\"". */
test("parses choice", function() {
  parserParses(
    'start = "abcd" "efgh" "ijkl"',
    oneRuleGrammar(sequenceLiterals)
  );
  parserParses(
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
  parserParses(
    'start = { code }',
    oneRuleGrammar(action(sequenceEmpty, " code "))
  );
  parserParses(
    'start = a:"abcd" { code }',
    oneRuleGrammar(action(labeledAbcd, " code "))
  );
  parserParses(
    'start = a:"abcd" e:"efgh" i:"ijkl" { code }',
    oneRuleGrammar(action(sequenceLabeleds, " code "))
  );

  parserParses('start = ',         oneRuleGrammar(sequenceEmpty));
  parserParses('start = a:"abcd"', oneRuleGrammar(labeledAbcd));
  parserParses(
    'start = a:"abcd" e:"efgh" i:"ijkl"',
    oneRuleGrammar(sequenceLabeleds)
  );
});

/* Canonical labeled is "label:\"abcd\"". */
test("parses labeled", function() {
  parserParses(
    'start = label:!"abcd"',
    oneRuleGrammar(labeled("label", simpleNot(literalAbcd)))
  );
  parserParses('start = !"abcd"', oneRuleGrammar(simpleNot(literalAbcd)));
});

/* Canonical prefixed is "!\"abcd\"". */
test("parses prefixed", function() {
  parserParses('start = &{ code }', oneRuleGrammar(semanticAnd(" code ")));
  parserParses('start = &"abcd"?',  oneRuleGrammar(simpleAnd(optionalLiteral)));
  parserParses('start = !{ code }', oneRuleGrammar(semanticNot(" code ")));
  parserParses('start = !"abcd"?',  oneRuleGrammar(simpleNot(optionalLiteral)));
  parserParses('start = "abcd"?',   oneRuleGrammar(optionalLiteral));
});

/* Canonical suffixed is "\"abcd\"?". */
test("parses suffixed", function() {
  parserParses('start = "abcd"?', oneRuleGrammar(optionalLiteral));
  parserParses('start = "abcd"*', oneRuleGrammar(zeroOrMore(literalAbcd)));
  parserParses('start = "abcd"+', oneRuleGrammar(oneOrMore(literalAbcd)));
  parserParses('start = "abcd"',  literalGrammar("abcd"));
});

/* Canonical primary is "\"abcd\"". */
test("parses primary", function() {
  parserParses('start = a',        identifierGrammar("a"));
  parserParses('start = "abcd"',   literalGrammar("abcd"));
  parserParses('start = .',        anyGrammar);
  parserParses('start = [a-d]',    classGrammar(false, [["a", "d"]], "[a-d]"));
  parserParses('start = ("abcd")', literalGrammar("abcd"));
});

/* Canonical action is "{ code }". */
test("parses action", function() {
  parserParses('start = "a" { code }', actionGrammar(" code "));
});

/* Canonical braced is "{ code }". */
test("parses braced", function() {
  parserParses('start = "a" {}',    actionGrammar(""));
  parserParses('start = "a" {a}',   actionGrammar("a"));
  parserParses('start = "a" {{a}}', actionGrammar("{a}"));
  parserParses('start = "a" {aaa}', actionGrammar("aaa"));
});

/* Trivial character rules are not tested. */

/* Canonical identifier is "a". */
test("parses identifier", function() {
  parserParses('start = a',    identifierGrammar("a"));
  parserParses('start = z',    identifierGrammar("z"));
  parserParses('start = A',    identifierGrammar("A"));
  parserParses('start = Z',    identifierGrammar("Z"));
  parserParses('start = _',    identifierGrammar("_"));
  parserParses('start = $',    identifierGrammar("$"));
  parserParses('start = aa',   identifierGrammar("aa"));
  parserParses('start = az',   identifierGrammar("az"));
  parserParses('start = aA',   identifierGrammar("aA"));
  parserParses('start = aZ',   identifierGrammar("aZ"));
  parserParses('start = a0',   identifierGrammar("a0"));
  parserParses('start = a9',   identifierGrammar("a9"));
  parserParses('start = a_',   identifierGrammar("a_"));
  parserParses('start = a$',   identifierGrammar("a$"));
  parserParses('start = abcd', identifierGrammar("abcd"));

  parserParses('start = a\n',  identifierGrammar("a"));
});

/* Canonical literal is "\"abcd\"". */
test("parses literal", function() {
  parserParses('start = "abcd"', literalGrammar("abcd"));
  parserParses("start = 'abcd'", literalGrammar("abcd"));
});

/* Canonical doubleQuotedLiteral is "\"abcd\"". */
test("parses doubleQuotedLiteral", function() {
  parserParses('start = ""',       literalGrammar(""));
  parserParses('start = "a"',      literalGrammar("a"));
  parserParses('start = "abc"',    literalGrammar("abc"));

  parserParses('start = "abcd"\n', literalGrammar("abcd"));
});

/* Canonical doubleQuotedCharacter is "a". */
test("parses doubleQuotedCharacter", function() {
  parserParses('start = "a"',       literalGrammar("a"));
  parserParses('start = "\\n"',     literalGrammar("\n"));
  parserParses('start = "\\0"',     literalGrammar("\0"));
  parserParses('start = "\\x00"',   literalGrammar("\x00"));
  parserParses('start = "\\u0120"', literalGrammar("\u0120"));
  parserParses('start = "\\\n"',    literalGrammar("\n"));
});

/* Canonical simpleDoubleQuotedCharacter is "a". */
test("parses simpleDoubleQuotedCharacter", function() {
  parserParses('start = "a"',  literalGrammar("a"));
  parserParses('start = "\'"', literalGrammar("'"));
  parserDoesNotParse('start = """');
  parserDoesNotParse('start = "\\"');
  parserDoesNotParse('start = "\n"');
  parserDoesNotParse('start = "\r"');
  parserDoesNotParse('start = "\u2028"');
  parserDoesNotParse('start = "\u2029"');
});

/* Canonical singleQuotedLiteral is "'abcd'". */
test("parses singleQuotedLiteral", function() {
  parserParses("start = ''",       literalGrammar(""));
  parserParses("start = 'a'",      literalGrammar("a"));
  parserParses("start = 'abc'",    literalGrammar("abc"));

  parserParses("start = 'abcd'\n", literalGrammar("abcd"));
});

/* Canonical singleQuotedCharacter is "a". */
test("parses singleQuotedCharacter", function() {
  parserParses("start = 'a'",       literalGrammar("a"));
  parserParses("start = '\\n'",     literalGrammar("\n"));
  parserParses("start = '\\0'",     literalGrammar("\0"));
  parserParses("start = '\\x00'",   literalGrammar("\x00"));
  parserParses("start = '\\u0120'", literalGrammar("\u0120"));
  parserParses("start = '\\\n'",    literalGrammar("\n"));
});

/* Canonical simpleSingleQuotedCharacter is "a". */
test("parses simpleSingleQuotedCharacter", function() {
  parserParses("start = 'a'",  literalGrammar("a"));
  parserParses("start = '\"'", literalGrammar("\""));
  parserDoesNotParse("start = '''");
  parserDoesNotParse("start = '\\'");
  parserDoesNotParse("start = '\n'");
  parserDoesNotParse("start = '\r'");
  parserDoesNotParse("start = '\u2028'");
  parserDoesNotParse("start = '\u2029'");
});

/* Canonical class is "[a-d]". */
test("parses class", function() {
  parserParses("start = []",     classGrammar(false, [],           "[]"));
  parserParses("start = [a-d]",  classGrammar(false, [["a", "d"]], "[a-d]"));
  parserParses("start = [^a-d]", classGrammar(true,  [["a", "d"]], "[^a-d]"));
  parserParses("start = [a]",    classGrammar(false, ["a"],        "[a]"));
  parserParses(
    "start = [a-de-hi-l]",
    classGrammar(false, [["a", "d"], ["e", "h"], ["i", "l"]], "[a-de-hi-l]")
  );

  parserParses("start = [a-d]\n", classGrammar(false, [["a", "d"]], "[a-d]"));
});

/* Canonical classCharacterRange is "a-d". */
test("parses classCharacterRange", function() {
  parserParses("start = [a-d]", classGrammar(false, [["a", "d"]], "[a-d]"));
  parserParses("start = [a-a]", classGrammar(false, [["a", "a"]], "[a-a]"));
  parserDoesNotParse("start = [b-a]");
  parserDoesNotParseWithMessage(
    "start = [b-a]",
    "Invalid character range: b-a."
  );
});

/* Canonical classCharacter is "a". */
test("parses classCharacter", function() {
  parserParses("start = [a]", classGrammar(false, ["a"], "[a]"));
});

/* Canonical bracketDelimitedCharacter is "a". */
test("parses bracketDelimitedCharacter", function() {
  parserParses("start = [a]",       classGrammar(false, ["a"], "[a]"));
  parserParses("start = [\\n]",     classGrammar(false, ["\n"], "[\\n]"));
  parserParses("start = [\\0]",     classGrammar(false, ["\0"], "[\\0]"));
  parserParses("start = [\\x00]",   classGrammar(false, ["\0"], "[\\0]"));
  parserParses("start = [\\u0120]", classGrammar(false, ["\u0120"], "[\u0120]"));
  parserParses("start = [\\\n]",    classGrammar(false, ["\n"], "[\\n]"));
});

/* Canonical simpleBracketDelimiedCharacter is "a". */
test("parses simpleBracketDelimitedCharacter", function() {
  parserParses("start = [a]",  classGrammar(false, ["a"], "[a]"));
  parserParses("start = [[]",  classGrammar(false, ["["], "[[]"));
  parserDoesNotParse("start = []]");
  parserDoesNotParse("start = [\\]");
  parserDoesNotParse("start = [\n]");
  parserDoesNotParse("start = [\r]");
  parserDoesNotParse("start = [\u2028]");
  parserDoesNotParse("start = [\u2029]");
});

/* Canonical simpleEscapeSequence is "\\n". */
test("parses simpleEscapeSequence", function() {
  parserParses('start = "\\\'"', literalGrammar("'"));
  parserParses('start = "\\""',  literalGrammar("\""));
  parserParses('start = "\\\\"', literalGrammar("\\"));
  parserParses('start = "\\b"',  literalGrammar("\b"));
  parserParses('start = "\\f"',  literalGrammar("\f"));
  parserParses('start = "\\n"',  literalGrammar("\n"));
  parserParses('start = "\\r"',  literalGrammar("\r"));
  parserParses('start = "\\t"',  literalGrammar("\t"));
  /* IE does not recognize "\v". */
  parserParses('start = "\\v"',  literalGrammar("\x0B"));

  parserParses('start = "\\a"',  literalGrammar("a"));
});

/* Canonical zeroEscapeSequence is "\\0". */
test("parses zeroEscapeSequence", function() {
  parserParses('start = "\\0"', literalGrammar("\0"));
  parserDoesNotParse('start = "\\00"');
  parserDoesNotParse('start = "\\09"');
});

/* Canonical hexEscapeSequence is "\\x00". */
test("parses hexEscapeSequence", function() {
  parserParses('start = "\\x00"',  literalGrammar("\x00"));
  parserParses('start = "\\x09"',  literalGrammar("\x09"));
  parserParses('start = "\\x0a"',  literalGrammar("\x0a"));
  parserParses('start = "\\x0f"',  literalGrammar("\x0f"));
  parserParses('start = "\\x0A"',  literalGrammar("\x0A"));
  parserParses('start = "\\x0F"',  literalGrammar("\x0F"));
  parserDoesNotParse('start = "\\x0"');
  parserParses('start = "\\x000"', literalGrammar("\x000"));
});

/* Canonical unicodeEscapeSequence is "\\u0120". */
test("parses unicodeEscapeSequence", function() {
  parserParses('start = "\\u0120"',  literalGrammar("\u0120"));
  parserParses('start = "\\u0129"',  literalGrammar("\u0129"));
  parserParses('start = "\\u012a"',  literalGrammar("\u012a"));
  parserParses('start = "\\u012f"',  literalGrammar("\u012f"));
  parserParses('start = "\\u012A"',  literalGrammar("\u012A"));
  parserParses('start = "\\u012F"',  literalGrammar("\u012F"));
  parserDoesNotParse('start = "\\u012"');
  parserParses('start = "\\u01234"', literalGrammar("\u01234"));
});

/* Canonical eolEscapeSequence is "\\\n". */
test("parses eolEscapeSequence", function() {
  parserParses('start = "\\\n"',     literalGrammar("\n"));
  parserParses('start = "\\\r\n"',   literalGrammar("\r\n"));
  parserParses('start = "\\\r"',     literalGrammar("\r"));
  parserParses('start = "\\\u2028"', literalGrammar("\u2028"));
  parserParses('start = "\\\u2029"', literalGrammar("\u2029"));
});

/* Canonical __ is "\n". */
test("parses __", function() {
  parserParses('start ="abcd"',              simpleGrammar);
  parserParses('start = "abcd"',             simpleGrammar);
  parserParses('start =\n"abcd"',            simpleGrammar);
  parserParses('start =/* comment */"abcd"', simpleGrammar);
  parserParses('start =   "abcd"',           simpleGrammar);
});

/* Trivial character class rules are not tested. */

/* Canonical comment is "\/* comment *\/". */
test("parses comment", function() {
  parserParses('start =// comment\n"abcd"',  simpleGrammar);
  parserParses('start =/* comment */"abcd"', simpleGrammar);
});
/* Canonical singleLineComment is "// comment". */
test("parses singleLineComment", function() {
  parserParses('start =//\n"abcd"',    simpleGrammar);
  parserParses('start =//a\n"abcd"',   simpleGrammar);
  parserParses('start =//aaa\n"abcd"', simpleGrammar);
  parserParses('start = "abcd"//',     simpleGrammar);
});

/* Canonical multiLineComment is "\/* comment *\/". */
test("parses multiLineComment", function() {
  parserParses('start =/**/"abcd"',    simpleGrammar);
  parserParses('start =/*a*/"abcd"',   simpleGrammar);
  parserParses('start =/*aaa*/"abcd"', simpleGrammar);
  parserParses('start =/*\n*/"abcd"',  simpleGrammar);
  parserParses('start =/***/"abcd"',   simpleGrammar);
  parserParses('start =/*a/*/"abcd"',  simpleGrammar);

  parserDoesNotParse('start =/*"abcd"');
  parserDoesNotParse('start =/*/"abcd"');
  parserDoesNotParse('start =/*/**/*/"abcd"');
});

/* Canonical eol is "\n". */
test("parses eol", function() {
  parserParses('start =\n"abcd"',     simpleGrammar);
  parserParses('start =\r\n"abcd"',   simpleGrammar);
  parserParses('start =\r"abcd"',     simpleGrammar);
  parserParses('start =\u2028"abcd"', simpleGrammar);
  parserParses('start =\u2029"abcd"', simpleGrammar);
});

/* Canonical eolChar is "\n". */
test("parses eolChar", function() {
  parserParses('start =\n"abcd"',     simpleGrammar);
  parserParses('start =\r"abcd"',     simpleGrammar);
  parserParses('start =\u2028"abcd"', simpleGrammar);
  parserParses('start =\u2029"abcd"', simpleGrammar);
});

/* Canonical whitespace is " ". */
test("parses whitespace", function() {
  parserParses('start =\t"abcd"',     simpleGrammar);
  /* IE does not recognize "\v". */
  parserParses('start =\x0B"abcd"',   simpleGrammar);
  parserParses('start =\f"abcd"',     simpleGrammar);
  parserParses('start = "abcd"',      simpleGrammar);
  parserParses('start =\u00A0"abcd"', simpleGrammar);
  parserParses('start =\uFEFF"abcd"', simpleGrammar);
  parserParses('start =\u1680"abcd"', simpleGrammar);
  parserParses('start =\u180E"abcd"', simpleGrammar);
  parserParses('start =\u2000"abcd"', simpleGrammar);
  parserParses('start =\u2001"abcd"', simpleGrammar);
  parserParses('start =\u2002"abcd"', simpleGrammar);
  parserParses('start =\u2003"abcd"', simpleGrammar);
  parserParses('start =\u2004"abcd"', simpleGrammar);
  parserParses('start =\u2005"abcd"', simpleGrammar);
  parserParses('start =\u2006"abcd"', simpleGrammar);
  parserParses('start =\u2007"abcd"', simpleGrammar);
  parserParses('start =\u2008"abcd"', simpleGrammar);
  parserParses('start =\u2009"abcd"', simpleGrammar);
  parserParses('start =\u200A"abcd"', simpleGrammar);
  parserParses('start =\u202F"abcd"', simpleGrammar);
  parserParses('start =\u205F"abcd"', simpleGrammar);
  parserParses('start =\u3000"abcd"', simpleGrammar);
});

})(this);
