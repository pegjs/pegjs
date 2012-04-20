(function() {

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
  };
}

function nodeWithCodeConstructor(type) {
  return function(code) {
    return {
      type: type,
      code: code
    };
  };
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
}

function ruleRef(name) {
  return {
    type: "rule_ref",
    name: name
  };
}

function literal(value, ignoreCase) {
  return {
    type:       "literal",
    value:      value,
    ignoreCase: ignoreCase
  };
}

function any() {
  return { type: "any" };
}

function klass(inverted, ignoreCase, parts, rawText) {
  return {
    type:       "class",
    inverted:   inverted,
    ignoreCase: ignoreCase,
    parts:      parts,
    rawText:    rawText
  };
}

var literalAbcd  = literal("abcd", false);
var literalEfgh  = literal("efgh", false);
var literalIjkl  = literal("ijkl", false);

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
    rules:       [rule("start", null, expression)],
    startRule:   "start"
  };
}

var simpleGrammar = oneRuleGrammar(literal("abcd", false));

function identifierGrammar(identifier) {
  return oneRuleGrammar(ruleRef(identifier));
}

var literal_ = literal;
function literalGrammar(literal) {
  return oneRuleGrammar(literal_(literal, false));
}

function classGrammar(inverted, parts, rawText) {
  return oneRuleGrammar(klass(inverted, false, parts, rawText));
}

var anyGrammar = oneRuleGrammar(any());

var action_ = action;
function actionGrammar(action) {
  return oneRuleGrammar(action_(literal("a", false), action));
}

var initializerGrammar = {
  type:        "grammar",
  initializer: initializer(" code "),
  rules:       [rule("a", null, literalAbcd)],
  startRule:   "a"
};

var namedRuleGrammar = {
  type:        "grammar",
  initializer: null,
  rules:       [rule("start", "abcd", literalAbcd)],
  startRule:   "start"
};

/* Canonical grammar is "a: \"abcd\"; b: \"efgh\"; c: \"ijkl\";". */
test("parses grammar", function() {
  parserParses(
    'a = "abcd"',
    {
      type:        "grammar",
      initializer: null,
      rules:       [rule("a", null, literalAbcd)],
      startRule:   "a"
    }
  );
  parserParses('{ code }; a = "abcd"', initializerGrammar);
  parserParses(
    'a = "abcd"; b = "efgh"; c = "ijkl"',
    {
      type:        "grammar",
      initializer: null,
      rules: [
        rule("a", null, literalAbcd),
        rule("b", null, literalEfgh),
        rule("c", null, literalIjkl)
      ],
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
      rules:       [rule("start", "start rule", choiceLiterals)],
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
  parserParses('start = "abcd"i', oneRuleGrammar(literal("abcd", true)));

  parserParses('start = "abcd"\n', literalGrammar("abcd"));
});

/* Canonical string is "\"abcd\"". */
test("parses string", function() {
  parserParses('start "abcd" = "abcd"',   namedRuleGrammar);
  parserParses('start \'abcd\' = "abcd"', namedRuleGrammar);

  parserParses('start "abcd"\n= "abcd"',  namedRuleGrammar);
});

/* Canonical doubleQuotedString is "\"abcd\"". */
test("parses doubleQuotedString", function() {
  parserParses('start = ""',       literalGrammar(""));
  parserParses('start = "a"',      literalGrammar("a"));
  parserParses('start = "abc"',    literalGrammar("abc"));
});

/* Canonical doubleQuotedCharacter is "a". */
test("parses doubleQuotedCharacter", function() {
  parserParses('start = "a"',       literalGrammar("a"));
  parserParses('start = "\\n"',     literalGrammar("\n"));
  parserParses('start = "\\0"',     literalGrammar("\x00"));
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

/* Canonical singleQuotedString is "'abcd'". */
test("parses singleQuotedString", function() {
  parserParses("start = ''",       literalGrammar(""));
  parserParses("start = 'a'",      literalGrammar("a"));
  parserParses("start = 'abc'",    literalGrammar("abc"));
});

})();
