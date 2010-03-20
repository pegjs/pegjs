grammar: __ rule+ {
  var result = {};
  PEG.ArrayUtils.each($2, function(rule) { result[rule.getName()] = rule; });
  return result;
}

rule: identifier (literal / "") colon expression {
  return new PEG.Grammar.Rule($1, $2 !== "" ? $2 : null, $4);
}

expression: choice

choice: sequence (slash sequence)* {
  return $2.length > 0
    ? new PEG.Grammar.Choice([$1].concat(PEG.ArrayUtils.map(
        $2,
        function(element) { return element[1]; }
      )))
    : $1;
}

sequence
  : prefixed* action {
      return new PEG.Grammar.Action(
        $1.length != 1 ? new PEG.Grammar.Sequence($1) : $1[0],
        $2
      );
    }
  / prefixed* { return $1.length != 1 ? new PEG.Grammar.Sequence($1) : $1[0]; }

prefixed
  : and suffixed {
      return new PEG.Grammar.NotPredicate(new PEG.Grammar.NotPredicate($2));
    }
  / not suffixed { return new PEG.Grammar.NotPredicate($2); }
  / suffixed

suffixed
  : primary question {
      return new PEG.Grammar.Choice([$1, new PEG.Grammar.Literal("")]);
    }
  / primary star { return new PEG.Grammar.ZeroOrMore($1); }
  / primary plus {
      return new PEG.Grammar.Action(
        new PEG.Grammar.Sequence([$1, new PEG.Grammar.ZeroOrMore($1)]),
        function(first, rest) { return [first].concat(rest); }
      );
    }
  / primary

primary
  : identifier !(( literal / "") colon) { return new PEG.Grammar.RuleRef($1); }
  / literal                             { return new PEG.Grammar.Literal($1); }
  / dot                                 { return new PEG.Grammar.Any();       }
  / class                               { return new PEG.Grammar.Class($1);   }
  / lparen expression rparen            { return $2; }

/* "Lexical" elements */

action "action": braced __ { return $1.substr(1, $1.length - 2); }

braced: "{" (braced / nonBraceCharacter)* "}" { return $1 + $2.join("") + $3; }

nonBraceCharacters: nonBraceCharacter+ { return $1.join(""); }

nonBraceCharacter: !("{" / "}") . { return $2; }

colon:    ":" __ { return $1; }
slash:    "/" __ { return $1; }
and:      "&" __ { return $1; }
not:      "!" __ { return $1; }
question: "?" __ { return $1; }
star:     "*" __ { return $1; }
plus:     "+" __ { return $1; }
lparen:   "(" __ { return $1; }
rparen:   ")" __ { return $1; }
dot:      "." __ { return $1; }

/*
 * Modelled after ECMA-262, 5th ed., 7.6, but much simplified:
 *
 * * no Unicode escape sequences
 *
 * * "Unicode combining marks" and "Unicode connection punctuation" can't be
 *   part of the identifier
 *
 * * only [a-zA-Z] is considered a "Unicode letter"
 *
 * * only [0-9] is considered a "Unicode digit"
 *
 * The simplifications were made just to make the implementation little bit
 * easier, there is no "philosophical" reason behind them.
 */
identifier "identifier": (letter / "_" / "$") (letter / digit / "_" / "$")* __ {
  return $1 + $2.join("");
}

/*
 * Modelled after ECMA-262, 5th ed., 7.8.4. (syntax & semantics, rules only
 * vaguely).
 */
literal "literal": (doubleQuotedLiteral / singleQuotedLiteral) __ { return $1; }

doubleQuotedLiteral: '"' doubleQuotedCharacter* '"' { return $2.join(""); }

doubleQuotedCharacter
  : simpleDoubleQuotedCharacter
  / simpleEscapeSequence
  / zeroEscapeSequence
  / hexEscapeSequence
  / unicodeEscapeSequence
  / eolEscapeSequence

simpleDoubleQuotedCharacter: !('"' / "\\" / eolChar) . { return $2; }

singleQuotedLiteral: "'" singleQuotedCharacter* "'" { return $2.join(""); }

singleQuotedCharacter
  : simpleSingleQuotedCharacter
  / simpleEscapeSequence
  / zeroEscapeSequence
  / hexEscapeSequence
  / unicodeEscapeSequence
  / eolEscapeSequence

simpleSingleQuotedCharacter: !("'" / "\\" / eolChar) . { return $2; }

class "character class": "[" (classCharacterRange / classCharacter)* "]" __ {
  return $2.join("");
}

classCharacterRange: bracketDelimitedCharacter "-" bracketDelimitedCharacter {
  if ($1.charCodeAt(0) > $3.charCodeAt(0)) {
    throw new PEG.Parser.SyntaxError(
      "Invalid character range: "
        + PEG.RegExpUtils.quoteForClass($1)
        + "-"
        + PEG.RegExpUtils.quoteForClass($3)
        + "."
    );
  }

  return PEG.RegExpUtils.quoteForClass($1)
    + "-"
    + PEG.RegExpUtils.quoteForClass($3);
}

classCharacter: bracketDelimitedCharacter {
  return PEG.RegExpUtils.quoteForClass($1);
}

bracketDelimitedCharacter
  : simpleBracketDelimitedCharacter
  / simpleEscapeSequence
  / zeroEscapeSequence
  / hexEscapeSequence
  / unicodeEscapeSequence
  / eolEscapeSequence

simpleBracketDelimitedCharacter: !("]" / "\\" / eolChar) . { return $2; }

simpleEscapeSequence: "\\" !(digit / "x" / "u" / eolChar) . {
  return $3
    .replace("b", "\b")
    .replace("f", "\f")
    .replace("n", "\n")
    .replace("r", "\r")
    .replace("t", "\t")
    .replace("v", "\v")
}

zeroEscapeSequence: "\\0" !digit { return "\0"; }

hexEscapeSequence: "\\x" hexDigit hexDigit {
  return String.fromCharCode(parseInt("0x" + $2 + $3));
}

unicodeEscapeSequence: "\\u" hexDigit hexDigit hexDigit hexDigit {
  return String.fromCharCode(parseInt("0x" + $2 + $3 + $4 + $5));
}

eolEscapeSequence: "\\" eol { return $2; }

digit: [0-9]

hexDigit: [0-9a-fA-F]

letter: lowerCaseLetter / upperCaseLetter

lowerCaseLetter: [a-z]

upperCaseLetter: [A-Z]

__: (whitespace / eol / comment)*

/* Modelled after ECMA-262, 5th ed., 7.4. */
comment "comment": singleLineComment / multiLineComment

singleLineComment: "//" (!eolChar .)*

multiLineComment: "/*" (!"*/" .)* "*/"

/* Modelled after ECMA-262, 5th ed., 7.3. */
eol "end of line": "\n" / "\r\n" / "\r" / "\u2028" / "\u2029"

eolChar: [\n\r\u2028\u2029]

/*
 * Modelled after ECMA-262, 5th ed., 7.2. \uFEFF should be between the
 * characters too, but it causes infinite loop in Rhino.
 */
whitespace "whitespace": [ \t\v\f\xA0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]
