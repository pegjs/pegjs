## Grammar Syntax and Semantics

The grammar syntax is similar to JavaScript in that it is not line-oriented and ignores whitespace between tokens. You can also use JavaScript-style line comments (`// ...`) and block comments (`/* ... */`).

Let's look at an example grammar that recognizes simple arithmetic expressions like `2*(3+4)`. A parser generated from this grammar computes their values.

```pegjs
start
  = additive

additive
  = left:multiplicative "+" right:additive { return left + right; }
  / multiplicative

multiplicative
  = left:primary "*" right:multiplicative { return left * right; }
  / primary

primary
  = integer
  / "(" additive:additive ")" { return additive; }

integer "integer"
  = digits:[0-9]+ { return parseInt(digits.join(""), 10); }
```

On the top level, the grammar consists of *rules* (in our example, there are five of them). Each rule has a *name* (e.g. `integer`) that identifies the rule, and a *parsing expression* (e.g. `digits:[0-9]+ { return parseInt(digits.join(""), 10); }`) that defines a pattern to match against the input text and possibly contains some JavaScript code that determines what happens when the pattern matches successfully. A rule can also contain a *human-readable name* that is used in error messages (in our example, only the `integer` rule has a human-readable name). The parsing starts at the first rule, which is also called the *start rule*.

A rule name must be a JavaScript identifier. It is followed by an equality sign (“=”) and a parsing expression. If the rule has a human-readable name, it is written as a JavaScript string between the name and separating equality sign. Rules need to be separated only by whitespace (their beginning is easily recognizable), but a semicolon (“;”) after the parsing expression is allowed.

The first rule can be preceded by an *initializer* - a piece of JavaScript code in curly braces (“{” and “}”). This code is executed before the generated parser starts parsing. All variables and functions defined in the initializer are accessible in rule actions and semantic predicates. The code inside the initializer can access options passed to the parser using the `options` variable. Curly braces in the initializer code must be [balanced](./balanced-braces.md).

Let's look at the example grammar from above using a simple initializer:

```pegjs
{
  function makeInteger(o) {
    return parseInt(o.join(""), 10);
  }
}

start
  = additive

additive
  = left:multiplicative "+" right:additive { return left + right; }
  / multiplicative

multiplicative
  = left:primary "*" right:multiplicative { return left * right; }
  / primary

primary
  = integer
  / "(" additive:additive ")" { return additive; }

integer "integer"
  = digits:[0-9]+ { return makeInteger(digits); }
```

The parsing expressions of the rules are used to match the input text to the grammar. There are various types of expressions — matching characters or character classes, indicating optional parts and repetition, etc. Expressions can also contain references to other rules. For a more detailed description, check out the [Parsing Expression Types](./parsing-expression-types.md) document.

If an expression successfully matches a part of the text when running the generated parser, it produces a *match result*, which is a JavaScript value. For example:

  * An expression matching a literal string produces a JavaScript string containing matched text.
  * An expression matching repeated occurrence of some subexpression produces a JavaScript array with all the matches.

The match results propagate through the rules when the rule names are used in expressions, up to the start rule. The generated parser returns start rule's match result when parsing is successful.

One special case of parser expression is a *parser action* - a piece of JavaScript code inside curly braces (“{” and “}”) that takes match results of some of the preceding expressions and returns a JavaScript value. This value is considered a match result of the preceding expression (in other words, the parser action is a match result transformer).

In our arithmetic's example, there are many parser actions. Consider the action in expression `digits:[0-9]+ { return parseInt(digits.join(""), 10); }`. It takes the match result of the expression [0-9]+, which is an array of strings containing digits, as its parameter. It joins the digits together to form a number and converts it to a JavaScript `number` object.
