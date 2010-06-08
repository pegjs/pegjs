grammar
  = __ initializer:initializer? rules:rule+ {
      var rulesConverted = {};
      PEG.ArrayUtils.each(rules, function(rule) { rulesConverted[rule.name] = rule; });

      return {
        type:        "grammar",
        initializer: initializer !== "" ? initializer : null,
        rules:       rulesConverted,
        startRule:   rules[0].name
      }
    }

initializer
  = code:action semicolon? {
      return {
        type: "initializer",
        code: code
      };
    }

rule
  = name:identifier displayName:(literal / "") equals expression:expression semicolon? {
      return {
        type:        "rule",
        name:        name,
        displayName: displayName !== "" ? displayName : null,
        expression:  expression
      };
    }

expression
  = choice

choice
  = head:sequence tail:(slash sequence)* {
      if (tail.length > 0) {
        var alternatives = [head].concat(PEG.ArrayUtils.map(
            tail,
            function(element) { return element[1]; }
        ));
        return {
          type:         "choice",
          alternatives: alternatives
        }
      } else {
        return head;
      }
    }

sequence
  = elements:labeled* code:action {
      var expression = elements.length != 1
        ? {
            type:     "sequence",
            elements: elements
          }
        : elements[0];
      return {
        type:       "action",
        expression: expression,
        code:       code
      };
    }
  / elements:labeled* {
      return elements.length != 1
        ? {
            type:     "sequence",
            elements: elements
          }
        : elements[0];
    }

labeled
  = label:identifier colon expression:prefixed {
      return {
        type:       "labeled",
        label:      label,
        expression: expression
      };
    }
  / prefixed

prefixed
  = and code:action {
      return {
        type: "semantic_and",
        code: code
      };
    }
  / and expression:suffixed {
      return {
        type:       "simple_and",
        expression: expression
      };
    }
  / not code:action {
      return {
        type: "semantic_not",
        code: code
      };
    }
  / not expression:suffixed {
      return {
        type:       "simple_not",
        expression: expression
      };
    }
  / suffixed

suffixed
  = expression:primary question {
      return {
        type:       "optional",
        expression: expression
      };
    }
  / expression:primary star {
      return {
        type:       "zero_or_more",
        expression: expression
      };
    }
  / expression:primary plus {
      return {
        type:       "one_or_more",
        expression: expression
      };
    }
  / primary

primary
  = name:identifier !(( literal / "") equals) {
      return {
        type: "rule_ref",
        name: name
      };
    }
  / value:literal {
      return {
        type:  "literal",
        value: value
      };
    }
  / dot { return { type: "any" }; }
  / class
  / lparen expression:expression rparen { return expression; }

/* "Lexical" elements */

action "action"
  = braced:braced __ { return braced.substr(1, braced.length - 2); }

braced
  = "{" parts:(braced / nonBraceCharacter)* "}" {
      return "{" + parts.join("") + "}";
    }

nonBraceCharacters
  = chars:nonBraceCharacter+ { return chars.join(""); }

nonBraceCharacter
  = [^{}]

equals    = "=" __ { return "="; }
colon     = ":" __ { return ":"; }
semicolon = ";" __ { return ";"; }
slash     = "/" __ { return "/"; }
and       = "&" __ { return "&"; }
not       = "!" __ { return "!"; }
question  = "?" __ { return "?"; }
star      = "*" __ { return "*"; }
plus      = "+" __ { return "+"; }
lparen    = "(" __ { return "("; }
rparen    = ")" __ { return ")"; }
dot       = "." __ { return "."; }

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
identifier "identifier"
  = head:(letter / "_" / "$") tail:(letter / digit / "_" / "$")* __ {
      return head + tail.join("");
    }

/*
 * Modelled after ECMA-262, 5th ed., 7.8.4. (syntax & semantics, rules only
 * vaguely).
 */
literal "literal"
  = literal:(doubleQuotedLiteral / singleQuotedLiteral) __ { return literal; }

doubleQuotedLiteral
  = '"' chars:doubleQuotedCharacter* '"' { return chars.join(""); }

doubleQuotedCharacter
  = simpleDoubleQuotedCharacter
  / simpleEscapeSequence
  / zeroEscapeSequence
  / hexEscapeSequence
  / unicodeEscapeSequence
  / eolEscapeSequence

simpleDoubleQuotedCharacter
  = !('"' / "\\" / eolChar) char_:. { return char_; }

singleQuotedLiteral
  = "'" chars:singleQuotedCharacter* "'" { return chars.join(""); }

singleQuotedCharacter
  = simpleSingleQuotedCharacter
  / simpleEscapeSequence
  / zeroEscapeSequence
  / hexEscapeSequence
  / unicodeEscapeSequence
  / eolEscapeSequence

simpleSingleQuotedCharacter
  = !("'" / "\\" / eolChar) char_:. { return char_; }

class "character class"
  = "[" inverted:"^"? parts:(classCharacterRange / classCharacter)* "]" __ {
      partsConverted = PEG.ArrayUtils.map(parts, function(part) {
        return part.data;
      });
      rawText = "["
        + inverted
        + PEG.ArrayUtils.map(parts, function(part) {
            return part.rawText;
          }).join("")
        + "]";

      return {
        type:     "class",
        inverted: inverted === "^",
        parts:    partsConverted,
        // FIXME: Get the raw text from the input directly.
        rawText:  rawText
      };
    }

classCharacterRange
  = begin:classCharacter "-" end:classCharacter {
      if (begin.data.charCodeAt(0) > end.data.charCodeAt(0)) {
        throw new this.SyntaxError(
          "Invalid character range: " + begin.rawText + "-" + end.rawText + "."
        );
      }

      return {
        data:    [begin.data, end.data],
        // FIXME: Get the raw text from the input directly.
        rawText: begin.rawText + "-" + end.rawText
      }
    }

classCharacter
  = char_:bracketDelimitedCharacter {
      return {
        data:    char_,
        // FIXME: Get the raw text from the input directly.
        rawText: PEG.RegExpUtils.quoteForClass(char_)
      };
    }

bracketDelimitedCharacter
  = simpleBracketDelimitedCharacter
  / simpleEscapeSequence
  / zeroEscapeSequence
  / hexEscapeSequence
  / unicodeEscapeSequence
  / eolEscapeSequence

simpleBracketDelimitedCharacter
  = !("]" / "\\" / eolChar) char_:. { return char_; }

simpleEscapeSequence
  = "\\" !(digit / "x" / "u" / eolChar) char_:. {
      return char_
        .replace("b", "\b")
        .replace("f", "\f")
        .replace("n", "\n")
        .replace("r", "\r")
        .replace("t", "\t")
        .replace("v", "\x0B") // IE does not recognize "\v".
    }

zeroEscapeSequence
  = "\\0" !digit { return "\0"; }

hexEscapeSequence
  = "\\x" h1:hexDigit h2:hexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2));
    }

unicodeEscapeSequence
  = "\\u" h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));
    }

eolEscapeSequence
  = "\\" eol:eol { return eol; }

digit
  = [0-9]

hexDigit
  = [0-9a-fA-F]

letter
  = lowerCaseLetter
  / upperCaseLetter

lowerCaseLetter
  = [a-z]

upperCaseLetter
  = [A-Z]

__ = (whitespace / eol / comment)*

/* Modelled after ECMA-262, 5th ed., 7.4. */
comment "comment"
  = singleLineComment
  / multiLineComment

singleLineComment
  = "//" (!eolChar .)*

multiLineComment
  = "/*" (!"*/" .)* "*/"

/* Modelled after ECMA-262, 5th ed., 7.3. */
eol "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

eolChar
  = [\n\r\u2028\u2029]

/* Modelled after ECMA-262, 5th ed., 7.2. */
whitespace "whitespace"
  = [ \t\v\f\u00A0\uFEFF\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]
