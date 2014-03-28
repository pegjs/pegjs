/*
 * PEG.js Grammar
 * ==============
 *
 * PEG.js grammar syntax is designed to be simple, expressive, and similar to
 * JavaScript where possible. This means that many rules, especially in the
 * lexical part, are based on the grammar from ECMA-262, 5.1 Edition [1]. Some
 * are directly taken or adapted from the JavaScript example grammar (see
 * examples/javascript.pegjs).
 *
 * [1] http://www.ecma-international.org/publications/standards/Ecma-262.htm
 */

{
  function extractOptional(optional, index) {
    return optional ? optional[index] : null;
  }

  function extractList(list, index) {
    var result = new Array(list.length), i;

    for (i = 0; i < list.length; i++) {
      result[i] = list[i][index];
    }

    return result;
  }

  function buildList(first, rest, index) {
    return [first].concat(extractList(rest, index));
  }
}

Grammar
  = __ initializer:(Initializer __)? rules:(Rule __)+ {
      return {
        type:        "grammar",
        initializer: extractOptional(initializer, 0),
        rules:       extractList(rules, 0)
      };
    }

Initializer
  = code:Action (__ ";")? {
      return {
        type: "initializer",
        code: code
      };
    }

Rule
  = name:Identifier __
    displayName:(StringLiteral __)?
    "=" __
    expression:Expression (__ ";")? {
      return {
        type:        "rule",
        name:        name,
        expression:  displayName !== null
          ? {
              type:       "named",
              name:       displayName[0],
              expression: expression
            }
          : expression
      };
    }

Expression
  = Choice

Choice
  = first:Sequence rest:(__ "/" __ Sequence)* {
      return rest.length > 0
        ? { type: "choice", alternatives: buildList(first, rest, 3) }
        : first;
    }

Sequence
  = first:Labeled rest:(__ Labeled)* __ code:Action {
      var expression = rest.length > 0
        ? { type: "sequence", elements: buildList(first, rest, 1) }
        : first;
      return {
        type:       "action",
        expression: expression,
        code:       code
      };
    }
  / first:Labeled rest:(__ Labeled)* {
      return rest.length > 0
        ? { type: "sequence", elements: buildList(first, rest, 1) }
        : first;
    }

Labeled
  = label:Identifier __ ":" __ expression:Prefixed {
      return {
        type:       "labeled",
        label:      label,
        expression: expression
      };
    }
  / Prefixed

Prefixed
  = "$" __ expression:Suffixed {
      return {
        type:       "text",
        expression: expression
      };
    }
  / "&" __ code:Action {
      return {
        type: "semantic_and",
        code: code
      };
    }
  / "&" __ expression:Suffixed {
      return {
        type:       "simple_and",
        expression: expression
      };
    }
  / "!" __ code:Action {
      return {
        type: "semantic_not",
        code: code
      };
    }
  / "!" __ expression:Suffixed {
      return {
        type:       "simple_not",
        expression: expression
      };
    }
  / Suffixed

Suffixed
  = expression:Primary __ "?" {
      return {
        type:       "optional",
        expression: expression
      };
    }
  / expression:Primary __ "*" {
      return {
        type:       "zero_or_more",
        expression: expression
      };
    }
  / expression:Primary __ "+" {
      return {
        type:       "one_or_more",
        expression: expression
      };
    }
  / Primary

Primary
  = name:Identifier !(__ (StringLiteral __)? "=") {
      return {
        type: "rule_ref",
        name: name
      };
    }
  / LiteralMatcher
  / CharacterClassMatcher
  / "." { return { type: "any" }; }
  / "(" __ expression:Expression __ ")" { return expression; }

/* "Lexical" elements */

SourceCharacter
  = .

WhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF"
  / Zs

LineTerminator
  = [\n\r\u2028\u2029]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

Comment "comment"
  = MultiLineComment
  / SingleLineComment

MultiLineComment
  = "/*" (!"*/" SourceCharacter)* "*/"

SingleLineComment
  = "//" (!LineTerminator SourceCharacter)*

Action "action"
  = braced:Braced __ { return braced.substr(1, braced.length - 2); }

Braced
  = $("{" (Braced / NonBraceCharacters)* "}")

NonBraceCharacters
  = NonBraceCharacter+

NonBraceCharacter
  = [^{}]

Identifier "identifier"
  = $((Letter / "_") (Letter / DecimalDigit / "_")*)

Letter
  = LowerCaseLetter
  / UpperCaseLetter

LowerCaseLetter
  = [a-z]

UpperCaseLetter
  = [A-Z]

LiteralMatcher "literal"
  = value:StringLiteral ignoreCase:"i"? {
      return { type: "literal", value: value, ignoreCase: ignoreCase !== null };
    }

StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' { return chars.join(""); }
  / "'" chars:SingleStringCharacter* "'" { return chars.join(""); }

DoubleStringCharacter
  = !('"' / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

SingleStringCharacter
  = !("'" / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

CharacterClassMatcher "character class"
  = "["
    inverted:"^"?
    parts:(ClassCharacterRange / ClassCharacter)*
    "]"
    ignoreCase:"i"?
    {
      return {
        type:       "class",
        parts:      parts,
        inverted:   inverted !== null,
        ignoreCase: ignoreCase !== null,
        rawText:    text()
      };
    }

ClassCharacterRange
  = begin:ClassCharacter "-" end:ClassCharacter {
      if (begin.charCodeAt(0) > end.charCodeAt(0)) {
        error(
          "Invalid character range: " + text() + "."
        );
      }

      return [begin, end];
    }

ClassCharacter
  = !("]" / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

LineContinuation
  = "\\" LineTerminatorSequence { return ""; }

EscapeSequence
  = CharacterEscapeSequence
  / "0" !DecimalDigit { return "\0"; }
  / HexEscapeSequence
  / UnicodeEscapeSequence

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

SingleEscapeCharacter
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b";   }
  / "f"  { return "\f";   }
  / "n"  { return "\n";   }
  / "r"  { return "\r";   }
  / "t"  { return "\t";   }
  / "v"  { return "\x0B"; }   // IE does not recognize "\v".

NonEscapeCharacter
  = !(EscapeCharacter / LineTerminator) SourceCharacter { return text(); }

EscapeCharacter
  = SingleEscapeCharacter
  / DecimalDigit
  / "x"
  / "u"

HexEscapeSequence
  = "x" digits:$(HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }

UnicodeEscapeSequence
  = "u" digits:$(HexDigit HexDigit HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }

DecimalDigit
  = [0-9]

HexDigit
  = [0-9a-f]i

/*
 * Unicode Character Categories
 *
 * Extracted from the following Unicode Character Database file:
 *
 *   http://www.unicode.org/Public/6.3.0/ucd/extracted/DerivedGeneralCategory.txt
 *
 * Unix magic used:
 *
 *   grep "; $CATEGORY" DerivedGeneralCategory.txt |   # Filter characters
 *     cut -f1 -d " " |                                # Extract code points
 *     grep -v '[0-9a-fA-F]\{5\}' |                    # Exclude non-BMP characters
 *     sed -e 's/\.\./-/' |                            # Adjust formatting
 *     sed -e 's/\([0-9a-fA-F]\{4\}\)/\\u\1/g' |       # Adjust formatting
 *     tr -d '\n'                                      # Join lines
 *
 * ECMA-262 allows using Unicode 3.0 or later, version 6.3.0 was the latest one
 * at the time of writing.
 *
 * Non-BMP characters are completely ignored to avoid surrogate pair handling
 * (detecting surrogate pairs isn't possible with a simple character class and
 * other methods would degrade performance). I don't consider it a big deal as
 * even parsers in JavaScript engines of common browsers seem to ignore them.
 */

// Separator, Space
Zs = [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]

/* Skipped */

__
  = (WhiteSpace / LineTerminatorSequence / Comment)*
