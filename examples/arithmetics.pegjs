/*
 * Simple Arithmetics Grammar
 * ==========================
 *
 * Accepts expressions like "2 * (3 + 4)" and computes their value.
 */

Expression
  = first:Term rest:(_ ("+" / "-") _ Term)* {
      var result = first, i;

      for (i = 0; i < rest.length; i++) {
        if (rest[i][1] === "+") { result += rest[i][3]; }
        if (rest[i][1] === "-") { result -= rest[i][3]; }
      }

      return result;
    }

Term
  = first:Factor rest:(_ ("*" / "/") _ Factor)* {
      var result = first, i;

      for (i = 0; i < rest.length; i++) {
        if (rest[i][1] === "*") { result *= rest[i][3]; }
        if (rest[i][1] === "/") { result /= rest[i][3]; }
      }

      return result;
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / Integer

Integer "integer"
  = [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*
