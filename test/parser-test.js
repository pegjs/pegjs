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

})();
