/*
 * Classic example grammar, which recognizes simple arithmetic expressions like
 * "2*(3+4)". The parser generated from this grammar then computes their value.
 */

start             : additive

additive          : multiplicative "+" additive { return $1 + $3; }
                  / multiplicative

multiplicative    : primary "*" multiplicative { return $1 * $3; }
                  / primary

primary           : integer
                  / "(" additive ")" { return $2; }

integer "integer" : [0-9]+ { return parseInt($1.join(""), 10); }
