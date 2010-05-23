/* JSON parser based on the grammar described at http://json.org/. */

/* ===== Syntactical Elements ===== */

start = _ object { return $2; }

object
  = "{" _ "}" _         { return {}; }
  / "{" _ members "}" _ { return $3; }

members = pair ("," _ pair)* {
  var result = {};
  result[$1[0]] = $1[1];
  for (var i = 0; i < $2.length; i++) {
    result[$2[i][2][0]] = $2[i][2][1];
  }
  return result;
}

pair = string ":" _ value { return [$1, $4]; }

array
  = "[" _ "]" _          { return []; }
  / "[" _ elements "]" _ { return $3; }

elements = value ("," _ value)* {
  var result = [$1];
  for (var i = 0; i < $2.length; i++) {
    result.push($2[i][2]);
  }
  return result;
}

value
  = string
  / number
  / object
  / array
  / "true" _  { return true;   }
  / "false" _ { return false;  }
  // FIXME: We can't return null here because that would mean parse failure.
  / "null" _  { return "null"; }

/* ===== Lexical Elements ===== */

string "string"
  = '"' '"' _       { return ""; }
  / '"' chars '"' _ { return $2; }

chars = char+ { return $1.join(""); }

char
  // In the original JSON grammar: "any-Unicode-character-except-"-or-\-or-control-character"
  = [^"\\\0-\x1F\x7f]
  / '\\"'  { return '"';  }
  / "\\\\" { return "\\"; }
  / "\\/"  { return "/";  }
  / "\\b"  { return "\b"; }
  / "\\f"  { return "\f"; }
  / "\\n"  { return "\n"; }
  / "\\r"  { return "\r"; }
  / "\\t"  { return "\t"; }
  / "\\u" hexDigit hexDigit hexDigit hexDigit {
      return String.fromCharCode(parseInt("0x" + $2 + $3 + $4 + $5));
    }

number "number"
  = int frac exp _ { return parseFloat($1 + $2 + $3); }
  / int frac _     { return parseFloat($1 + $2);      }
  / int exp _      { return parseFloat($1 + $2);      }
  / int _          { return parseFloat($1);           }

int
  = digit19 digits     { return $1 + $2;      }
  / digit
  / "-" digit19 digits { return $1 + $2 + $3; }
  / "-" digit          { return $1 + $2;      }

frac = "." digits { return $1 + $2; }

exp = e digits { return $1 + $2; }

digits = digit+ { return $1.join(""); }

e = [eE] [+-]? { return $1 + $2; }

/*
 * The following rules are not present in the original JSON gramar, but they are
 * assumed to exist implicitly.
 *
 * FIXME: Define them according to ECMA-262, 5th ed.
 */

digit = [0-9]

digit19 = [1-9]

hexDigit = [0-9a-fA-F]

/* ===== Whitespace ===== */

_ "whitespace" = whitespace*

// Whitespace is undefined in the original JSON grammar, so I assume a simple
// conventional definition consistent with ECMA-262, 5th ed.
whitespace = [ \t\n\r]
