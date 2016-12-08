"use strict";

let chai = require("chai");
let peg = require("../../lib/peg");

let expect = chai.expect;

describe("PEG.js grammar parser", function() {
  let literalAbcd       = { type: "literal",      value: "abcd", ignoreCase: false };
  let literalEfgh       = { type: "literal",      value: "efgh", ignoreCase: false };
  let literalIjkl       = { type: "literal",      value: "ijkl", ignoreCase: false };
  let literalMnop       = { type: "literal",      value: "mnop", ignoreCase: false };
  let semanticAnd       = { type: "semantic_and", code: " code " };
  let semanticNot       = { type: "semantic_not", code: " code " };
  let optional          = { type: "optional",     expression: literalAbcd };
  let zeroOrMore        = { type: "zero_or_more", expression: literalAbcd };
  let oneOrMore         = { type: "one_or_more",  expression: literalAbcd };
  let textOptional      = { type: "text",         expression: optional    };
  let simpleNotAbcd     = { type: "simple_not",   expression: literalAbcd };
  let simpleAndOptional = { type: "simple_and",   expression: optional    };
  let simpleNotOptional = { type: "simple_not",   expression: optional    };
  let labeledAbcd       = { type: "labeled",      label: "a", expression: literalAbcd   };
  let labeledEfgh       = { type: "labeled",      label: "b", expression: literalEfgh   };
  let labeledIjkl       = { type: "labeled",      label: "c", expression: literalIjkl   };
  let labeledMnop       = { type: "labeled",      label: "d", expression: literalMnop   };
  let labeledSimpleNot  = { type: "labeled",      label: "a", expression: simpleNotAbcd };
  let sequence          = {
    type: "sequence",
    elements: [literalAbcd, literalEfgh, literalIjkl]
  };
  let sequence2         = {
    type: "sequence",
    elements: [labeledAbcd, labeledEfgh]
  };
  let sequence4         = {
    type: "sequence",
    elements: [labeledAbcd, labeledEfgh, labeledIjkl, labeledMnop]
  };
  let groupLabeled      = { type: "group",  expression: labeledAbcd };
  let groupSequence     = { type: "group",  expression: sequence    };
  let actionAbcd        = { type: "action", expression: literalAbcd, code: " code " };
  let actionEfgh        = { type: "action", expression: literalEfgh, code: " code " };
  let actionIjkl        = { type: "action", expression: literalIjkl, code: " code " };
  let actionMnop        = { type: "action", expression: literalMnop, code: " code " };
  let actionSequence    = { type: "action", expression: sequence,    code: " code " };
  let choice            = {
    type: "choice",
    alternatives: [literalAbcd, literalEfgh, literalIjkl]
  };
  let choice2           = {
    type: "choice",
    alternatives: [actionAbcd, actionEfgh]
  };
  let choice4           = {
    type: "choice",
    alternatives: [actionAbcd, actionEfgh, actionIjkl, actionMnop]
  };
  let named             = { type: "named",       name: "start rule", expression: literalAbcd };
  let ruleA             = { type: "rule",        name: "a",          expression: literalAbcd };
  let ruleB             = { type: "rule",        name: "b",          expression: literalEfgh };
  let ruleC             = { type: "rule",        name: "c",          expression: literalIjkl };
  let ruleStart         = { type: "rule",        name: "start",      expression: literalAbcd };
  let initializer       = { type: "initializer", code: " code " };

  function oneRuleGrammar(expression) {
    return {
      type: "grammar",
      initializer: null,
      rules: [{ type: "rule", name: "start", expression: expression }]
    };
  }

  function actionGrammar(code) {
    return oneRuleGrammar(
      { type: "action", expression: literalAbcd, code: code }
    );
  }

  function literalGrammar(value, ignoreCase) {
    return oneRuleGrammar(
      { type: "literal", value: value, ignoreCase: ignoreCase }
    );
  }

  function classGrammar(parts, inverted, ignoreCase) {
    return oneRuleGrammar({
      type: "class",
      parts: parts,
      inverted: inverted,
      ignoreCase: ignoreCase
    });
  }

  function anyGrammar() {
    return oneRuleGrammar({ type: "any" });
  }

  function ruleRefGrammar(name) {
    return oneRuleGrammar({ type: "rule_ref", name: name });
  }

  let trivialGrammar = literalGrammar("abcd", false);
  let twoRuleGrammar = {
    type: "grammar",
    initializer: null,
    rules: [ruleA, ruleB]
  };

  let stripLocation = (function() {
    function buildVisitor(functions) {
      return function(node) {
        return functions[node.type].apply(null, arguments);
      };
    }

    function stripLeaf(node) {
      delete node.location;
    }

    function stripExpression(node) {
      delete node.location;

      strip(node.expression);
    }

    function stripChildren(property) {
      return function(node) {
        delete node.location;

        node[property].forEach(strip);
      };
    }

    let strip = buildVisitor({
      grammar(node) {
        delete node.location;

        if (node.initializer) {
          strip(node.initializer);
        }
        node.rules.forEach(strip);
      },

      initializer: stripLeaf,
      rule: stripExpression,
      named: stripExpression,
      choice: stripChildren("alternatives"),
      action: stripExpression,
      sequence: stripChildren("elements"),
      labeled: stripExpression,
      text: stripExpression,
      simple_and: stripExpression,
      simple_not: stripExpression,
      optional: stripExpression,
      zero_or_more: stripExpression,
      one_or_more: stripExpression,
      group: stripExpression,
      semantic_and: stripLeaf,
      semantic_not: stripLeaf,
      rule_ref: stripLeaf,
      literal: stripLeaf,
      class: stripLeaf,
      any: stripLeaf
    });

    return strip;
  })();

  function helpers(chai, utils) {
    let Assertion = chai.Assertion;

    Assertion.addMethod("parseAs", function(expected) {
      let result = peg.parser.parse(utils.flag(this, "object"));

      stripLocation(result);

      this.assert(
        utils.eql(result, expected),
        "expected #{this} to parse as #{exp} but got #{act}",
        "expected #{this} to not parse as #{exp}",
        expected,
        result,
        !utils.flag(this, "negate")
      );
    });

    Assertion.addMethod("failToParse", function(props) {
      let passed, result;

      try {
        result = peg.parser.parse(utils.flag(this, "object"));
        passed = true;
      } catch (e) {
        result = e;
        passed = false;
      }

      if (passed) {
        stripLocation(result);
      }

      this.assert(
        !passed,
        "expected #{this} to fail to parse but got #{act}",
        "expected #{this} to not fail to parse but it failed with #{act}",
        null,
        result
      );

      if (!passed && props !== undefined) {
        Object.keys(props).forEach(key => {
          new Assertion(result).to.have.property(key)
            .that.is.deep.equal(props[key]);
        });
      }
    });
  }

  // Helper activation needs to put inside a |beforeEach| block because the
  // helpers conflict with the ones in
  // spec/behavior/generated-parser-behavior.spec.js.
  beforeEach(function() {
    chai.use(helpers);
  });

  // Canonical Grammar is "a = 'abcd'; b = 'efgh'; c = 'ijkl';".
  it("parses Grammar", function() {
    expect("\na = 'abcd';\n").to.parseAs(
      { type: "grammar", initializer: null, rules: [ruleA] }
    );
    expect("\na = 'abcd';\nb = 'efgh';\nc = 'ijkl';\n").to.parseAs(
      { type: "grammar", initializer: null, rules: [ruleA, ruleB, ruleC] }
    );
    expect("\n{ code };\na = 'abcd';\n").to.parseAs(
      { type: "grammar", initializer: initializer, rules: [ruleA] }
    );
  });

  // Canonical Initializer is "{ code }".
  it("parses Initializer", function() {
    expect("{ code };start = 'abcd'").to.parseAs(
      { type: "grammar", initializer: initializer, rules: [ruleStart] }
    );
  });

  // Canonical Rule is "a = 'abcd';".
  it("parses Rule", function() {
    expect("start\n=\n'abcd';").to.parseAs(
      oneRuleGrammar(literalAbcd)
    );
    expect("start\n'start rule'\n=\n'abcd';").to.parseAs(
      oneRuleGrammar(named)
    );
  });

  // Canonical Expression is "'abcd'".
  it("parses Expression", function() {
    expect("start = 'abcd' / 'efgh' / 'ijkl'").to.parseAs(
      oneRuleGrammar(choice)
    );
  });

  // Canonical ChoiceExpression is "'abcd' / 'efgh' / 'ijkl'".
  it("parses ChoiceExpression", function() {
    expect("start = 'abcd' { code }").to.parseAs(
      oneRuleGrammar(actionAbcd)
    );
    expect("start = 'abcd' { code }\n/\n'efgh' { code }").to.parseAs(
      oneRuleGrammar(choice2)
    );
    expect(
      "start = 'abcd' { code }\n/\n'efgh' { code }\n/\n'ijkl' { code }\n/\n'mnop' { code }"
    ).to.parseAs(
      oneRuleGrammar(choice4)
    );
  });

  // Canonical ActionExpression is "'abcd' { code }".
  it("parses ActionExpression", function() {
    expect("start = 'abcd' 'efgh' 'ijkl'").to.parseAs(
      oneRuleGrammar(sequence)
    );
    expect("start = 'abcd' 'efgh' 'ijkl'\n{ code }").to.parseAs(
      oneRuleGrammar(actionSequence)
    );
  });

  // Canonical SequenceExpression is "'abcd' 'efgh' 'ijkl'".
  it("parses SequenceExpression", function() {
    expect("start = a:'abcd'").to.parseAs(
      oneRuleGrammar(labeledAbcd)
    );
    expect("start = a:'abcd'\nb:'efgh'").to.parseAs(
      oneRuleGrammar(sequence2)
    );
    expect("start = a:'abcd'\nb:'efgh'\nc:'ijkl'\nd:'mnop'").to.parseAs(
      oneRuleGrammar(sequence4)
    );
  });

  // Canonical LabeledExpression is "a:'abcd'".
  it("parses LabeledExpression", function() {
    expect("start = a\n:\n!'abcd'").to.parseAs(oneRuleGrammar(labeledSimpleNot));
    expect("start = !'abcd'").to.parseAs(oneRuleGrammar(simpleNotAbcd));
  });

  // Canonical PrefixedExpression is "!'abcd'".
  it("parses PrefixedExpression", function() {
    expect("start = !\n'abcd'?").to.parseAs(oneRuleGrammar(simpleNotOptional));
    expect("start = 'abcd'?").to.parseAs(oneRuleGrammar(optional));
  });

  // Canonical PrefixedOperator is "!".
  it("parses PrefixedOperator", function() {
    expect("start = $'abcd'?").to.parseAs(oneRuleGrammar(textOptional));
    expect("start = &'abcd'?").to.parseAs(oneRuleGrammar(simpleAndOptional));
    expect("start = !'abcd'?").to.parseAs(oneRuleGrammar(simpleNotOptional));
  });

  // Canonical SuffixedExpression is "'abcd'?".
  it("parses SuffixedExpression", function() {
    expect("start = 'abcd'\n?").to.parseAs(oneRuleGrammar(optional));
    expect("start = 'abcd'").to.parseAs(oneRuleGrammar(literalAbcd));
  });

  // Canonical SuffixedOperator is "?".
  it("parses SuffixedOperator", function() {
    expect("start = 'abcd'?").to.parseAs(oneRuleGrammar(optional));
    expect("start = 'abcd'*").to.parseAs(oneRuleGrammar(zeroOrMore));
    expect("start = 'abcd'+").to.parseAs(oneRuleGrammar(oneOrMore));
  });

  // Canonical PrimaryExpression is "'abcd'".
  it("parses PrimaryExpression", function() {
    expect("start = 'abcd'").to.parseAs(trivialGrammar);
    expect("start = [a-d]").to.parseAs(classGrammar([["a", "d"]], false, false));
    expect("start = .").to.parseAs(anyGrammar());
    expect("start = a").to.parseAs(ruleRefGrammar("a"));
    expect("start = &{ code }").to.parseAs(oneRuleGrammar(semanticAnd));

    expect("start = (\na:'abcd'\n)").to.parseAs(oneRuleGrammar(groupLabeled));
    expect("start = (\n'abcd' 'efgh' 'ijkl'\n)").to.parseAs(oneRuleGrammar(groupSequence));
    expect("start = (\n'abcd'\n)").to.parseAs(trivialGrammar);
  });

  // Canonical RuleReferenceExpression is "a".
  it("parses RuleReferenceExpression", function() {
    expect("start = a").to.parseAs(ruleRefGrammar("a"));

    expect("start = a\n=").to.failToParse();
    expect("start = a\n'abcd'\n=").to.failToParse();
  });

  // Canonical SemanticPredicateExpression is "!{ code }".
  it("parses SemanticPredicateExpression", function() {
    expect("start = !\n{ code }").to.parseAs(oneRuleGrammar(semanticNot));
  });

  // Canonical SemanticPredicateOperator is "!".
  it("parses SemanticPredicateOperator", function() {
    expect("start = &{ code }").to.parseAs(oneRuleGrammar(semanticAnd));
    expect("start = !{ code }").to.parseAs(oneRuleGrammar(semanticNot));
  });

  // The SourceCharacter rule is not tested.

  // Canonical WhiteSpace is " ".
  it("parses WhiteSpace", function() {
    expect("start =\t'abcd'").to.parseAs(trivialGrammar);
    expect("start =\v'abcd'").to.parseAs(trivialGrammar);
    expect("start =\f'abcd'").to.parseAs(trivialGrammar);
    expect("start = 'abcd'").to.parseAs(trivialGrammar);
    expect("start =\u00A0'abcd'").to.parseAs(trivialGrammar);
    expect("start =\uFEFF'abcd'").to.parseAs(trivialGrammar);
    expect("start =\u1680'abcd'").to.parseAs(trivialGrammar);
  });

  // Canonical LineTerminator is "\n".
  it("parses LineTerminator", function() {
    expect("start = '\n'").to.failToParse();
    expect("start = '\r'").to.failToParse();
    expect("start = '\u2028'").to.failToParse();
    expect("start = '\u2029'").to.failToParse();
  });

  // Canonical LineTerminatorSequence is "\r\n".
  it("parses LineTerminatorSequence", function() {
    expect("start =\n'abcd'").to.parseAs(trivialGrammar);
    expect("start =\r\n'abcd'").to.parseAs(trivialGrammar);
    expect("start =\r'abcd'").to.parseAs(trivialGrammar);
    expect("start =\u2028'abcd'").to.parseAs(trivialGrammar);
    expect("start =\u2029'abcd'").to.parseAs(trivialGrammar);
  });

  // Canonical Comment is "/* comment */".
  it("parses Comment", function() {
    expect("start =// comment\n'abcd'").to.parseAs(trivialGrammar);
    expect("start =/* comment */'abcd'").to.parseAs(trivialGrammar);
  });

  // Canonical MultiLineComment is "/* comment */".
  it("parses MultiLineComment", function() {
    expect("start =/**/'abcd'").to.parseAs(trivialGrammar);
    expect("start =/*a*/'abcd'").to.parseAs(trivialGrammar);
    expect("start =/*abc*/'abcd'").to.parseAs(trivialGrammar);

    expect("start =/**/*/'abcd'").to.failToParse();
  });

  // Canonical MultiLineCommentNoLineTerminator is "/* comment */".
  it("parses MultiLineCommentNoLineTerminator", function() {
    expect("a = 'abcd'/**/\r\nb = 'efgh'").to.parseAs(twoRuleGrammar);
    expect("a = 'abcd'/*a*/\r\nb = 'efgh'").to.parseAs(twoRuleGrammar);
    expect("a = 'abcd'/*abc*/\r\nb = 'efgh'").to.parseAs(twoRuleGrammar);

    expect("a = 'abcd'/**/*/\r\nb = 'efgh'").to.failToParse();
    expect("a = 'abcd'/*\n*/\r\nb = 'efgh'").to.failToParse();
  });

  // Canonical SingleLineComment is "// comment".
  it("parses SingleLineComment", function() {
    expect("start =//\n'abcd'").to.parseAs(trivialGrammar);
    expect("start =//a\n'abcd'").to.parseAs(trivialGrammar);
    expect("start =//abc\n'abcd'").to.parseAs(trivialGrammar);

    expect("start =//\n@\n'abcd'").to.failToParse();
  });

  // Canonical Identifier is "a".
  it("parses Identifier", function() {
    expect("start = a:'abcd'").to.parseAs(oneRuleGrammar(labeledAbcd));
  });

  // Canonical IdentifierName is "a".
  it("parses IdentifierName", function() {
    expect("start = a").to.parseAs(ruleRefGrammar("a"));
    expect("start = ab").to.parseAs(ruleRefGrammar("ab"));
    expect("start = abcd").to.parseAs(ruleRefGrammar("abcd"));
  });

  // Canonical IdentifierStart is "a".
  it("parses IdentifierStart", function() {
    expect("start = a").to.parseAs(ruleRefGrammar("a"));
    expect("start = $").to.parseAs(ruleRefGrammar("$"));
    expect("start = _").to.parseAs(ruleRefGrammar("_"));
    expect("start = \\u0061").to.parseAs(ruleRefGrammar("a"));
  });

  // Canonical IdentifierPart is "a".
  it("parses IdentifierPart", function() {
    expect("start = aa").to.parseAs(ruleRefGrammar("aa"));
    expect("start = a\u0300").to.parseAs(ruleRefGrammar("a\u0300"));
    expect("start = a0").to.parseAs(ruleRefGrammar("a0"));
    expect("start = a\u203F").to.parseAs(ruleRefGrammar("a\u203F"));
    expect("start = a\u200C").to.parseAs(ruleRefGrammar("a\u200C"));
    expect("start = a\u200D").to.parseAs(ruleRefGrammar("a\u200D"));
  });

  // Unicode rules and reserved word rules are not tested.

  // Canonical LiteralMatcher is "'abcd'".
  it("parses LiteralMatcher", function() {
    expect("start = 'abcd'").to.parseAs(literalGrammar("abcd", false));
    expect("start = 'abcd'i").to.parseAs(literalGrammar("abcd", true));
  });

  // Canonical StringLiteral is "'abcd'".
  it("parses StringLiteral", function() {
    expect("start = \"\"").to.parseAs(literalGrammar("",    false));
    expect("start = \"a\"").to.parseAs(literalGrammar("a",   false));
    expect("start = \"abc\"").to.parseAs(literalGrammar("abc", false));

    expect("start = ''").to.parseAs(literalGrammar("",    false));
    expect("start = 'a'").to.parseAs(literalGrammar("a",   false));
    expect("start = 'abc'").to.parseAs(literalGrammar("abc", false));
  });

  // Canonical DoubleStringCharacter is "a".
  it("parses DoubleStringCharacter", function() {
    expect("start = \"a\"").to.parseAs(literalGrammar("a",  false));
    expect("start = \"\\n\"").to.parseAs(literalGrammar("\n", false));
    expect("start = \"\\\n\"").to.parseAs(literalGrammar("",   false));

    expect("start = \"\"\"").to.failToParse();
    expect("start = \"\\\"").to.failToParse();
    expect("start = \"\n\"").to.failToParse();
  });

  // Canonical SingleStringCharacter is "a".
  it("parses SingleStringCharacter", function() {
    expect("start = 'a'").to.parseAs(literalGrammar("a",  false));
    expect("start = '\\n'").to.parseAs(literalGrammar("\n", false));
    expect("start = '\\\n'").to.parseAs(literalGrammar("",   false));

    expect("start = '''").to.failToParse();
    expect("start = '\\'").to.failToParse();
    expect("start = '\n'").to.failToParse();
  });

  // Canonical CharacterClassMatcher is "[a-d]".
  it("parses CharacterClassMatcher", function() {
    expect("start = []").to.parseAs(
      classGrammar([], false, false)
    );
    expect("start = [a-d]").to.parseAs(
      classGrammar([["a", "d"]], false, false)
    );
    expect("start = [a]").to.parseAs(
      classGrammar(["a"], false, false)
    );
    expect("start = [a-de-hi-l]").to.parseAs(
      classGrammar(
        [["a", "d"], ["e", "h"], ["i", "l"]],
        false,
        false
      )
    );
    expect("start = [^a-d]").to.parseAs(
      classGrammar([["a", "d"]], true, false)
    );
    expect("start = [a-d]i").to.parseAs(
      classGrammar([["a", "d"]], false, true)
    );

    expect("start = [\\\n]").to.parseAs(
      classGrammar([], false, false)
    );
  });

  // Canonical ClassCharacterRange is "a-d".
  it("parses ClassCharacterRange", function() {
    expect("start = [a-d]").to.parseAs(classGrammar([["a", "d"]], false, false));

    expect("start = [a-a]").to.parseAs(classGrammar([["a", "a"]], false, false));
    expect("start = [b-a]").to.failToParse({
      message: "Invalid character range: b-a."
    });
  });

  // Canonical ClassCharacter is "a".
  it("parses ClassCharacter", function() {
    expect("start = [a]").to.parseAs(classGrammar(["a"],  false, false));
    expect("start = [\\n]").to.parseAs(classGrammar(["\n"], false, false));
    expect("start = [\\\n]").to.parseAs(classGrammar([],     false, false));

    expect("start = []]").to.failToParse();
    expect("start = [\\]").to.failToParse();
    expect("start = [\n]").to.failToParse();
  });

  // Canonical LineContinuation is "\\\n".
  it("parses LineContinuation", function() {
    expect("start = '\\\r\n'").to.parseAs(literalGrammar("", false));
  });

  // Canonical EscapeSequence is "n".
  it("parses EscapeSequence", function() {
    expect("start = '\\n'").to.parseAs(literalGrammar("\n",     false));
    expect("start = '\\0'").to.parseAs(literalGrammar("\x00",   false));
    expect("start = '\\xFF'").to.parseAs(literalGrammar("\xFF",   false));
    expect("start = '\\uFFFF'").to.parseAs(literalGrammar("\uFFFF", false));

    expect("start = '\\09'").to.failToParse();
  });

  // Canonical CharacterEscapeSequence is "n".
  it("parses CharacterEscapeSequence", function() {
    expect("start = '\\n'").to.parseAs(literalGrammar("\n", false));
    expect("start = '\\a'").to.parseAs(literalGrammar("a",  false));
  });

  // Canonical SingleEscapeCharacter is "n".
  it("parses SingleEscapeCharacter", function() {
    expect("start = '\\''").to.parseAs(literalGrammar("'",  false));
    expect("start = '\\\"'").to.parseAs(literalGrammar("\"", false));
    expect("start = '\\\\'").to.parseAs(literalGrammar("\\", false));
    expect("start = '\\b'").to.parseAs(literalGrammar("\b", false));
    expect("start = '\\f'").to.parseAs(literalGrammar("\f", false));
    expect("start = '\\n'").to.parseAs(literalGrammar("\n", false));
    expect("start = '\\r'").to.parseAs(literalGrammar("\r", false));
    expect("start = '\\t'").to.parseAs(literalGrammar("\t", false));
    expect("start = '\\v'").to.parseAs(literalGrammar("\v", false));
  });

  // Canonical NonEscapeCharacter is "a".
  it("parses NonEscapeCharacter", function() {
    expect("start = '\\a'").to.parseAs(literalGrammar("a", false));

    // The negative predicate is impossible to test with PEG.js grammar
    // structure.
  });

  // The EscapeCharacter rule is impossible to test with PEG.js grammar
  // structure.

  // Canonical HexEscapeSequence is "xFF".
  it("parses HexEscapeSequence", function() {
    expect("start = '\\xFF'").to.parseAs(literalGrammar("\xFF", false));
  });

  // Canonical UnicodeEscapeSequence is "uFFFF".
  it("parses UnicodeEscapeSequence", function() {
    expect("start = '\\uFFFF'").to.parseAs(literalGrammar("\uFFFF", false));
  });

  // Digit rules are not tested.

  // Canonical AnyMatcher is ".".
  it("parses AnyMatcher", function() {
    expect("start = .").to.parseAs(anyGrammar());
  });

  // Canonical CodeBlock is "{ code }".
  it("parses CodeBlock", function() {
    expect("start = 'abcd' { code }").to.parseAs(actionGrammar(" code "));
  });

  // Canonical Code is " code ".
  it("parses Code", function() {
    expect("start = 'abcd' {a}").to.parseAs(actionGrammar("a"));
    expect("start = 'abcd' {abc}").to.parseAs(actionGrammar("abc"));
    expect("start = 'abcd' {{a}}").to.parseAs(actionGrammar("{a}"));
    expect("start = 'abcd' {{a}{b}{c}}").to.parseAs(actionGrammar("{a}{b}{c}"));

    expect("start = 'abcd' {{}").to.failToParse();
    expect("start = 'abcd' {}}").to.failToParse();
  });

  // Unicode character category rules and token rules are not tested.

  // Canonical __ is "\n".
  it("parses __", function() {
    expect("start ='abcd'").to.parseAs(trivialGrammar);
    expect("start = 'abcd'").to.parseAs(trivialGrammar);
    expect("start =\r\n'abcd'").to.parseAs(trivialGrammar);
    expect("start =/* comment */'abcd'").to.parseAs(trivialGrammar);
    expect("start =   'abcd'").to.parseAs(trivialGrammar);
  });

  // Canonical _ is " ".
  it("parses _", function() {
    expect("a = 'abcd'\r\nb = 'efgh'").to.parseAs(twoRuleGrammar);
    expect("a = 'abcd' \r\nb = 'efgh'").to.parseAs(twoRuleGrammar);
    expect("a = 'abcd'/* comment */\r\nb = 'efgh'").to.parseAs(twoRuleGrammar);
    expect("a = 'abcd'   \r\nb = 'efgh'").to.parseAs(twoRuleGrammar);
  });

  // Canonical EOS is ";".
  it("parses EOS", function() {
    expect("a = 'abcd'\n;b = 'efgh'").to.parseAs(twoRuleGrammar);
    expect("a = 'abcd' \r\nb = 'efgh'").to.parseAs(twoRuleGrammar);
    expect("a = 'abcd' // comment\r\nb = 'efgh'").to.parseAs(twoRuleGrammar);
    expect("a = 'abcd'\nb = 'efgh'").to.parseAs(twoRuleGrammar);
  });

  // Canonical EOF is the end of input.
  it("parses EOF", function() {
    expect("start = 'abcd'\n").to.parseAs(trivialGrammar);
  });
});
