start          : _ additive { return $2; }

additive       : multiplicative plus  additive { return $1 + $3; }
               / multiplicative minus additive { return $1 - $3; }
               / multiplicative

multiplicative : primary times  multiplicative { return $1 * $3; }
               / primary divide multiplicative { return $1 / $3; }
               / primary

primary        : integer
               / lparen additive rparen { return $2 }

integer        "integer"
               : [0-9]+ _ { return parseInt($1.join("")); }

plus           : "+" _ { return $1; }
minus          : "-" _ { return $1; }
times          : "*" _ { return $1; }
divide         : "/" _ { return $1; }
lparen         : "(" _
rparen         : ")" _

_              "whitespace"
               : [ \t\n\r]*
