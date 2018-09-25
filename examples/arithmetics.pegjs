// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

Expression
  = head:Term tail:(_ @("+" / "-") _ @Term)* {
      return tail.reduce(function(result, element) {
        if (element[0] === "+") return result + element[1];
        if (element[0] === "-") return result - element[1];
      }, head);
    }

Term
  = head:Factor tail:(_ @("*" / "/") _ @Factor)* {
      return tail.reduce(function(result, element) {
        if (element[0] === "*") return result * element[1];
        if (element[0] === "/") return result / element[1];
      }, head);
    }

Factor
  = "(" _ @Expression _ ")"
  / Integer

Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*
