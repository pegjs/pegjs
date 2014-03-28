{
  var utils = require("./utils");
}

Grammar
  = __ initializer:Initializer? rules:Rule+ {
      return {
        type:        "grammar",
        initializer: initializer,
        rules:       rules
      };
    }

Initializer
  = code:Action Semicolon? {
      return {
        type: "initializer",
        code: code
      };
    }

Rule
  = name:Identifier displayName:String? Equals expression:Expression Semicolon? {
      return {
        type:        "rule",
        name:        name,
        expression:  displayName !== null
          ? {
              type:       "named",
              name:       displayName,
              expression: expression
            }
          : expression
      };
    }

Expression
  = Choice

Choice
  = head:Sequence tail:(Slash Sequence)* {
      if (tail.length > 0) {
        var alternatives = [head].concat(utils.map(
            tail,
            function(element) { return element[1]; }
        ));
        return {
          type:         "choice",
          alternatives: alternatives
        };
      } else {
        return head;
      }
    }

Sequence
  = elements:Labeled+ code:Action {
      var expression = elements.length !== 1
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
  / elements:Labeled+ {
      return elements.length !== 1
        ? {
            type:     "sequence",
            elements: elements
          }
        : elements[0];
    }

Labeled
  = label:Identifier Colon expression:Prefixed {
      return {
        type:       "labeled",
        label:      label,
        expression: expression
      };
    }
  / Prefixed

Prefixed
  = Dollar expression:Suffixed {
      return {
        type:       "text",
        expression: expression
      };
    }
  / And code:Action {
      return {
        type: "semantic_and",
        code: code
      };
    }
  / And expression:Suffixed {
      return {
        type:       "simple_and",
        expression: expression
      };
    }
  / Not code:Action {
      return {
        type: "semantic_not",
        code: code
      };
    }
  / Not expression:Suffixed {
      return {
        type:       "simple_not",
        expression: expression
      };
    }
  / Suffixed

Suffixed
  = expression:Primary Question {
      return {
        type:       "optional",
        expression: expression
      };
    }
  / expression:Primary Star {
      return {
        type:       "zero_or_more",
        expression: expression
      };
    }
  / expression:Primary Plus {
      return {
        type:       "one_or_more",
        expression: expression
      };
    }
  / Primary

Primary
  = name:Identifier !(String? Equals) {
      return {
        type: "rule_ref",
        name: name
      };
    }
  / Literal
  / Class
  / Dot { return { type: "any" }; }
  / Lparen expression:Expression Rparen { return expression; }

/* "Lexical" elements */

Action "action"
  = braced:Braced __ { return braced.substr(1, braced.length - 2); }

Braced
  = $("{" (Braced / NonBraceCharacters)* "}")

NonBraceCharacters
  = NonBraceCharacter+

NonBraceCharacter
  = [^{}]

Equals    = "=" __ { return "="; }
Colon     = ":" __ { return ":"; }
Semicolon = ";" __ { return ";"; }
Slash     = "/" __ { return "/"; }
And       = "&" __ { return "&"; }
Not       = "!" __ { return "!"; }
Dollar    = "$" __ { return "$"; }
Question  = "?" __ { return "?"; }
Star      = "*" __ { return "*"; }
Plus      = "+" __ { return "+"; }
Lparen    = "(" __ { return "("; }
Rparen    = ")" __ { return ")"; }
Dot       = "." __ { return "."; }

/*
 * Modeled after ECMA-262, 5th ed., 7.6, but much simplified:
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
 *
 * Contrary to ECMA 262, the "$" character is not valid because it serves other
 * purpose in the grammar.
 */
Identifier "identifier"
  = chars:$((Letter / "_") (Letter / Digit / "_")*) __ { return chars; }

/*
 * Modeled after ECMA-262, 5th ed., 7.8.4. (syntax & semantics, rules only
 * vaguely).
 */
Literal "literal"
  = value:(DoubleQuotedString / SingleQuotedString) flags:"i"? __ {
      return {
        type:       "literal",
        value:      value,
        ignoreCase: flags === "i"
      };
    }

String "string"
  = string:(DoubleQuotedString / SingleQuotedString) __ { return string; }

DoubleQuotedString
  = '"' chars:DoubleQuotedCharacter* '"' { return chars.join(""); }

DoubleQuotedCharacter
  = SimpleDoubleQuotedCharacter
  / SimpleEscapeSequence
  / ZeroEscapeSequence
  / HexEscapeSequence
  / UnicodeEscapeSequence
  / EOLEscapeSequence

SimpleDoubleQuotedCharacter
  = !('"' / "\\" / EOLChar) char_:. { return char_; }

SingleQuotedString
  = "'" chars:SingleQuotedCharacter* "'" { return chars.join(""); }

SingleQuotedCharacter
  = SimpleSingleQuotedCharacter
  / SimpleEscapeSequence
  / ZeroEscapeSequence
  / HexEscapeSequence
  / UnicodeEscapeSequence
  / EOLEscapeSequence

SimpleSingleQuotedCharacter
  = !("'" / "\\" / EOLChar) char_:. { return char_; }

Class "character class"
  = class_:(
      "[" inverted:"^"? parts:(ClassCharacterRange / ClassCharacter)* "]" flags:"i"? {
        return {
          type:       "class",
          parts:      parts,
          rawText:    text().replace(/\s+$/, ""),
          inverted:   inverted === "^",
          ignoreCase: flags === "i"
        };
      }
    )
    __
    { return class_; }

ClassCharacterRange
  = begin:ClassCharacter "-" end:ClassCharacter {
      if (begin.charCodeAt(0) > end.charCodeAt(0)) {
        error("Invalid character range: " + text() + ".");
      }

      return [begin, end];
    }

ClassCharacter
  = BracketDelimitedCharacter

BracketDelimitedCharacter
  = SimpleBracketDelimitedCharacter
  / SimpleEscapeSequence
  / ZeroEscapeSequence
  / HexEscapeSequence
  / UnicodeEscapeSequence
  / EOLEscapeSequence

SimpleBracketDelimitedCharacter
  = !("]" / "\\" / EOLChar) char_:. { return char_; }

SimpleEscapeSequence
  = "\\" !(Digit / "x" / "u" / EOLChar) char_:. {
      return char_
        .replace("b", "\b")
        .replace("f", "\f")
        .replace("n", "\n")
        .replace("r", "\r")
        .replace("t", "\t")
        .replace("v", "\x0B"); // IE does not recognize "\v".
    }

ZeroEscapeSequence
  = "\\0" !Digit { return "\x00"; }

HexEscapeSequence
  = "\\x" digits:$(HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }

UnicodeEscapeSequence
  = "\\u" digits:$(HexDigit HexDigit HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }

EOLEscapeSequence
  = "\\" eol:EOL { return ""; }

Digit
  = [0-9]

HexDigit
  = [0-9a-fA-F]

Letter
  = LowerCaseLetter
  / UpperCaseLetter

LowerCaseLetter
  = [a-z]

UpperCaseLetter
  = [A-Z]

__ = (Whitespace / EOL / Comment)*

/* Modeled after ECMA-262, 5th ed., 7.4. */
Comment "comment"
  = SingleLineComment
  / MultiLineComment

SingleLineComment
  = "//" (!EOLChar .)*

MultiLineComment
  = "/*" (!"*/" .)* "*/"

/* Modeled after ECMA-262, 5th ed., 7.3. */
EOL "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

EOLChar
  = [\n\r\u2028\u2029]

/* Modeled after ECMA-262, 5th ed., 7.2. */
Whitespace "whitespace"
  = [ \t\v\f\u00A0\uFEFF\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]
