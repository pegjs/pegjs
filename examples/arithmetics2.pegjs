/*
 * Classic example grammar, which recognizes simple arithmetic expressions like
 * "2-1-1" or "4/2/2" where left recursion is needed.
 * "1/2 * (cos(0) + 1) + 2 * sin(pi/2) / 2 * cos(π+pi)".
 * The parser generated from this grammar then computes their value.
 *
 * Based on arithmetics.pegjs by David Majda (https://github.com/dmajda/pegjs),
 * Rewrited by Pavel Lang (https://github.com/langpavel)
 */

start
  = additive


additive
  = left:multiplicative _ tail:([+-] multiplicative)* {
      tail.forEach(function(value) {
        // value[0] is sign
        // value[1] is multiplicative rule result (our value)
        left += (value[0] == '-') ? -value[1] : value[1];
      });
      return left;
    }


multiplicative
  = left:unary _ tail:([*/%] unary)* {
      tail.forEach(function(value) {
        // value[0] is sign
        // value[2] is multiplicative rule result (our value)
        switch(value[0]) {
          case "*":
            left *= value[1];
            break;
          case "/":
            left /= value[1];
            break;
          case "%":
            left %= value[1];
            break;
        }
      });
      return left;
    }


unary
  = sign:[+-]? _ val:primary _ {
      return sign == '-' ? -val : val;
    }


primary
  = integer
  / constant
  / func
  / "(" additive:additive ")" { return additive; }


func "function call"
  = fn:("sin"i / "cos"i) _ "(" val:additive ")" {
      return Math[fn].call(null, val);
    }


constant "constant"
  = ("pi"i / "π") { return Math.PI; }


integer "integer"
  = digits:[0-9]+ { return parseInt(digits.join(""), 10); }


_ "whitespace"
  = [ \n\r]*

