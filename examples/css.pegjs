/*
 * CSS parser based on the grammar described at http://www.w3.org/TR/CSS2/grammar.html.
 *
 * The parser builds a tree representing the parsed CSS, composed of basic
 * JavaScript values, arrays and objects (basically JSON). It can be easily
 * used by various CSS processors, transformers, etc.
 *
 * Note that the parser does not handle errors in CSS according to the
 * specification -- many errors which it should recover from (e.g. malformed
 * declarations or unexpected end of stylesheet) are simply fatal. This is a
 * result of straightforward rewrite of the CSS grammar to PEG.js and it should
 * be fixed sometimes.
 */

/* ===== Syntactical Elements ===== */

start: stylesheet comment* { return $1; }

stylesheet:
  (CHARSET_SYM STRING ";")? (S / CDO / CDC)*
  (import (CDO S* / CDC S*)*)*
  ((ruleset / media / page) (CDO S* / CDC S*)*)*
  {
    var imports = [];
    for (var i = 0; i < $3.length; i++) {
      imports.push($3[i][0]);
    }

    var rules = [];
    for (i = 0; i < $4.length; i++) {
      rules.push($4[i][0]);
    }

    return {
      type:    "stylesheet",
      charset: $1 !== "" ? $1[1] : null,
      imports: imports,
      rules:   rules
    };
  }

import: IMPORT_SYM S* (STRING / URI) S* media_list? ";" S* {
  return {
    type:  "import_rule",
    href:  $3,
    media: $5 !== "" ? $5 : []
  };
}

media: MEDIA_SYM S* media_list "{" S* ruleset* "}" S* {
  return {
    type:  "media_rule",
    media: $3,
    rules: $6
  };
}

media_list: medium ("," S* medium)* {
  var result = [$1];
  for (var i = 0; i < $2.length; i++) {
    result.push($2[i][2]);
  }
  return result;
}

medium: IDENT S* { return $1; }

page: PAGE_SYM S* pseudo_page? "{" S* declaration? (";" S* declaration?)* "}" S* {
  var declarations = $6 !== "" ? [$6] : [];
  for (var i = 0; i < $7.length; i++) {
    if ($7[i][2] !== "") {
      declarations.push($7[i][2]);
    }
  }

  return {
    type:         "page_rule",
    qualifier:    $3 !== "" ? $3 : null,
    declarations: declarations
  };
}

pseudo_page: ":" IDENT S* { return $2; }

operator
  : "/" S* { return $1; }
  / "," S* { return $1; }

combinator
  : "+" S* { return $1; }
  / ">" S* { return $1; }

unary_operator: "+" / "-"

property: IDENT S* { return $1; }

ruleset: selector ("," S* selector)* "{" S* declaration? (";" S* declaration?)* "}" S* {
  var selectors = [$1];
  for (var i = 0; i < $2.length; i++) {
    selectors.push($2[i][2]);
  }

  var declarations = $5 !== "" ? [$5] : [];
  for (i = 0; i < $6.length; i++) {
    if ($6[i][2] !== "") {
      declarations.push($6[i][2]);
    }
  }

  return {
    type:         "ruleset",
    selectors:    selectors,
    declarations: declarations
  };
}

selector
  : simple_selector S* combinator selector {
      return {
        type:       "selector",
        combinator: $3,
        left:       $1,
        right:      $4
      };
    }
  / simple_selector S* selector {
      return {
        type:       "selector",
        combinator: " ",
        left:       $1,
        right:      $3
      };
    }
  / simple_selector S* { return $1; }

simple_selector
  : element_name
    (
        HASH { return { type: "ID selector", id: $1.substr(1) }; }
      / class
      / attrib
      / pseudo
    )* {
      return {
        type:       "simple_selector",
        element:    $1,
        qualifiers: $2
      };
    }
  / (
        HASH { return { type: "ID selector", id: $1.substr(1) }; }
      / class
      / attrib
      / pseudo
    )+ {
      return {
        type:       "simple_selector",
        element:    "*",
        qualifiers: $1
      };
    }

class: "." IDENT { return { type: "class_selector", "class": $2 }; }

element_name: IDENT / '*'

attrib: "[" S* IDENT S* (('=' / INCLUDES / DASHMATCH) S* (IDENT / STRING) S*)? "]" {
  return {
    type:      "attribute_selector",
    attribute: $3,
    operator:  $5 !== "" ? $5[0] : null,
    value:     $5 !== "" ? $5[2] : null
  };
}

pseudo:
  ":"
  (
      FUNCTION S* (IDENT S*)? ")" {
        return {
          type:   "function",
          name:   $1,
          params: $3 !== "" ? [$3[0]] : []
        };
      }
    / IDENT
  )
  {
    /*
     * The returned object has somewhat vague property names and values because
     * the rule matches both pseudo-classes and pseudo-elements (they look the
     * same at the syntactic level).
     */
    return {
      type:  "pseudo_selector",
      value: $2
    };
  }

declaration: property ":" S* expr prio? {
  return {
    type:       "declaration",
    property:   $1,
    expression: $4,
    important:  $5 !== "" ? true : false
  };
}

prio: IMPORTANT_SYM S*

expr: term (operator? term)* {
  var result = $1;
  for (var i = 0; i < $2.length; i++) {
    result = {
      type:     "expression",
      operator: $2[i][0],
      left:     result,
      right:    $2[i][1]
    };
  }
  return result;
}

term
  : unary_operator?
    (
        EMS S*
      / EXS S*
      / LENGTH S*
      / ANGLE S*
      / TIME S*
      / FREQ S*
      / PERCENTAGE S*
      / NUMBER S*
    )         { return { type: "value",  value: $1 + $2[0] }; }
  / URI S*    { return { type: "uri",    value: $1         }; }
  / function
  / hexcolor
  / STRING S* { return { type: "string", value: $1         }; }
  / IDENT S*  { return { type: "ident",  value: $1         }; }

function: FUNCTION S* expr ")" S* {
  return {
    type:   "function",
    name:   $1,
    params: $3
  };
}

hexcolor: HASH S* { return { type: "hexcolor", value: $1}; }

/* ===== Lexical Elements ===== */

/* Macros */

h:        [0-9a-fA-F]
nonascii: [\x80-\xFF]
unicode:  "\\" h h? h? h? h? h? ("\r\n" / [ \t\r\n\f])? {
            return String.fromCharCode(parseInt("0x" + $2 + $3 + $4 + $5 + $6 + $7));
          }
escape:   unicode / "\\" [^\r\n\f0-9a-fA-F] { return $2; }
nmstart:  [_a-zA-Z]     / nonascii / escape
nmchar:   [_a-zA-Z0-9-] / nonascii / escape
integer:  [0-9]+            { return parseInt($1.join("")); }
float:    [0-9]* "." [0-9]+ { return parseFloat($1.join("") + $2 + $3.join("")); }
string1:  '"' ([^\n\r\f\\"] / "\\" nl { return $2 } / escape)* '"' { return $2.join(""); }
string2:  "'" ([^\n\r\f\\'] / "\\" nl { return $2 } / escape)* "'" { return $2.join(""); }

comment: "/*" [^*]* "*"+ ([^/*] [^*]* "*"+)* "/"
ident:   "-"? nmstart nmchar*              { return $1 + $2 + $3.join(""); }
name:    nmchar+                           { return $1.join(""); }
num:     float / integer
string:  string1 / string2
url:     ([!#$%&*-~] / nonascii / escape)* { return $1.join(""); }
s:       [ \t\r\n\f]+
w:       s?
nl:      "\n" / "\r\n" / "\r" / "\f"

A
  : [aA]
  / "\\" "0"? "0"? "0"? "0"? "41" ("\r\n" / [ \t\r\n\f])? { return "A"; }
  / "\\" "0"? "0"? "0"? "0"? "61" ("\r\n" / [ \t\r\n\f])? { return "a"; }
C
  : [cC]
  / "\\" "0"? "0"? "0"? "0"? "43" ("\r\n" / [ \t\r\n\f])? { return "C"; }
  / "\\" "0"? "0"? "0"? "0"? "63" ("\r\n" / [ \t\r\n\f])? { return "c"; }
D
  : [dD]
  / "\\" "0"? "0"? "0"? "0"? "44" ("\r\n" / [ \t\r\n\f])? { return "D"; }
  / "\\" "0"? "0"? "0"? "0"? "64" ("\r\n" / [ \t\r\n\f])? { return "d"; }
E
  : [eE]
  / "\\" "0"? "0"? "0"? "0"? "45" ("\r\n" / [ \t\r\n\f])? { return "E"; }
  / "\\" "0"? "0"? "0"? "0"? "65" ("\r\n" / [ \t\r\n\f])? { return "e"; }
G
  : [gG]
  / "\\" "0"? "0"? "0"? "0"? "47" ("\r\n" / [ \t\r\n\f])? { return "G"; }
  / "\\" "0"? "0"? "0"? "0"? "67" ("\r\n" / [ \t\r\n\f])? { return "g"; }
  / "\\" [gG] { return $2; }
H
  : [hH]
  / "\\" "0"? "0"? "0"? "0"? "48" ("\r\n" / [ \t\r\n\f])? { return "H"; }
  / "\\" "0"? "0"? "0"? "0"? "68" ("\r\n" / [ \t\r\n\f])? { return "h"; }
  / "\\" [hH] { return $2; }
I
  : [iI]
  / "\\" "0"? "0"? "0"? "0"? "49" ("\r\n" / [ \t\r\n\f])? { return "I"; }
  / "\\" "0"? "0"? "0"? "0"? "69" ("\r\n" / [ \t\r\n\f])? { return "i"; }
  / "\\" [iI] { return $2; }

K
  : [kK]
  / "\\" "0"? "0"? "0"? "0"? "4" [bB] ("\r\n" / [ \t\r\n\f])? { return "K"; }
  / "\\" "0"? "0"? "0"? "0"? "6" [bB] ("\r\n" / [ \t\r\n\f])? { return "k"; }
  / "\\" [kK] { return $2; }
L
  : [lL]
  / "\\" "0"? "0"? "0"? "0"? "4" [cC] ("\r\n" / [ \t\r\n\f])? { return "L"; }
  / "\\" "0"? "0"? "0"? "0"? "6" [cC] ("\r\n" / [ \t\r\n\f])? { return "l"; }
  / "\\" [lL] { return $2; }
M
  : [mM]
  / "\\" "0"? "0"? "0"? "0"? "4" [dD] ("\r\n" / [ \t\r\n\f])? { return "M"; }
  / "\\" "0"? "0"? "0"? "0"? "6" [dD] ("\r\n" / [ \t\r\n\f])? { return "m"; }
  / "\\" [mM] { return $2; }
N
  : [nN]
  / "\\" "0"? "0"? "0"? "0"? "4" [eE] ("\r\n" / [ \t\r\n\f])? { return "N"; }
  / "\\" "0"? "0"? "0"? "0"? "6" [eE] ("\r\n" / [ \t\r\n\f])? { return "n"; }
  / "\\" [nN] { return $2; }
O
  : [oO]
  / "\\" "0"? "0"? "0"? "0"? "4" [fF] ("\r\n" / [ \t\r\n\f])? { return "O"; }
  / "\\" "0"? "0"? "0"? "0"? "6" [fF] ("\r\n" / [ \t\r\n\f])? { return "o"; }
  / "\\" [oO] { return $2; }
P
  : [pP]
  / "\\" "0"? "0"? "0"? "0"? "50" ("\r\n" / [ \t\r\n\f])? { return "P"; }
  / "\\" "0"? "0"? "0"? "0"? "70" ("\r\n" / [ \t\r\n\f])? { return "p"; }
  / "\\" [pP] { return $2; }
R
  : [rR]
  / "\\" "0"? "0"? "0"? "0"? "52" ("\r\n" / [ \t\r\n\f])? { return "R"; }
  / "\\" "0"? "0"? "0"? "0"? "72" ("\r\n" / [ \t\r\n\f])? { return "r"; }
  / "\\" [rR] { return $2; }
S_
  : [sS]
  / "\\" "0"? "0"? "0"? "0"? "53" ("\r\n" / [ \t\r\n\f])? { return "S"; }
  / "\\" "0"? "0"? "0"? "0"? "73" ("\r\n" / [ \t\r\n\f])? { return "s"; }
  / "\\" [sS] { return $2; }
T
  : [tT]
  / "\\" "0"? "0"? "0"? "0"? "54" ("\r\n" / [ \t\r\n\f])? { return "T"; }
  / "\\" "0"? "0"? "0"? "0"? "74" ("\r\n" / [ \t\r\n\f])? { return "t"; }
  / "\\" [tT] { return $2; }
U
  : [uU]
  / "\\" "0"? "0"? "0"? "0"? "55" ("\r\n" / [ \t\r\n\f])? { return "U"; }
  / "\\" "0"? "0"? "0"? "0"? "75" ("\r\n" / [ \t\r\n\f])? { return "u"; }
  / "\\" [uU] { return $2; }
X
  : [xX]
  / "\\" "0"? "0"? "0"? "0"? "58" ("\r\n" / [ \t\r\n\f])? { return "X"; }
  / "\\" "0"? "0"? "0"? "0"? "78" ("\r\n" / [ \t\r\n\f])? { return "x"; }
  / "\\" [xX] { return $2; }
Z
  : [zZ]
  / "\\" "0"? "0"? "0"? "0"? "5" [aA] ("\r\n" / [ \t\r\n\f])? { return "Z"; }
  / "\\" "0"? "0"? "0"? "0"? "7" [aA] ("\r\n" / [ \t\r\n\f])? { return "z"; }
  / "\\" [zZ] { return $2; }

/* Tokens */

S             "whitespace" : comment* s

CDO           "<!--"       : comment* "<!--"
CDC           "-->"        : comment* "-->"
INCLUDES      "~="         : comment* "~="
DASHMATCH     "|="         : comment* "|="

STRING        "string"     : comment* string   { return $2; }

IDENT         "identifier" : comment* ident    { return $2; }

HASH          "hash"       : comment* "#" name { return $2 + $3; }

IMPORT_SYM    "@import"    : comment* "@" I M P O R T
PAGE_SYM      "@page"      : comment* "@" P A G E
MEDIA_SYM     "@media"     : comment* "@" M E D I A
CHARSET_SYM   "@charset"   : comment* "@charset "
/* Note: We replace "w" with "s" here to avoid infinite recursion. */
IMPORTANT_SYM "!important" : comment* "!" (s / comment)* I M P O R T A N T { return "!important"; }

EMS           "length"     : comment* num E M            { return $2 + $3 + $4;     }
EXS           "length"     : comment* num E X            { return $2 + $3 + $4;     }
LENGTH        "length"     : comment* num (P X / C M / M M / I N / P T / P C) { return $2 + $3.join(""); }
ANGLE         "angle"      : comment* num (D E G / R A D / G R A D)           { return $2 + $3.join(""); }
TIME          "time"       : comment* num (M S_ { return $1 + $2; } / S_)     { return $2 + $3;          }
FREQ          "frequency"  : comment* num (H Z / K H Z)  { return $2 + $3.join(""); }
DIMENSION     "dimension"  : comment* num ident          { return $2 + $3;          }
PERCENTAGE    "percentage" : comment* num "%"            { return $2 + $3;          }
NUMBER        "number"     : comment* num                { return $2;               }

URI           "uri"        : comment* U R L "(" w (string / url) w ")" { return $7; }

FUNCTION      "function"   : comment* ident "(" { return $2; }
