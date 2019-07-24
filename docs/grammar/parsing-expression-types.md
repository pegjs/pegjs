### Parsing Expression Types

There are several types of parsing expressions, some of them containing subexpressions and thus forming a recursive structure:

  * ["literal"](#literalliteral)
  * [. (dot character)](#-dot-character)
  * [[characters]](#characters)
  * [rule](#rule)
  * [( expression )](#-expression-)
  * [expression *](#expression-)
  * [expression +](#expression--1)
  * [expression ?](#expression--2)
  * [& expression](#-expression)
  * [! expression](#-expression-1)
  * [& { predicate }](#--predicate-)
  * [! { predicate }](#--predicate--1)
  * [$ expression](#-expression-2)
  * [label : expression](#label--expression)
  * [expression<sub>1</sub> expression<sub>2</sub> ... expression<sub>n</sub>](#expression1-expression2---expressionn)
  * [expression { action }](#expression--action-)
  * [expression<sub>1</sub> / expression<sub>2</sub> / ... / expression<sub>n</sub>](#expression1--expression2----expressionn)
  * [expression<sub>1</sub> @expression<sub>2</sub> ... expression<sub>n</sub>](#expression1-expression2---expressionn-1)

#### "*literal*"<br>'*literal*'

Match exact literal string and return it. The string syntax is the same as in JavaScript.

Appending `i` right after the literal makes the match case-insensitive.

#### . *(dot character)*

Match exactly one character and return it as a string.

#### [*characters*]

Match one character from a set and return it as a string. The characters in the list can be escaped in exactly the same way they are escaped in JavaScript strings. The list of characters can also contain ranges (e.g. `[a-f]` means “any character between (and including) _a_ and _f_, all lowercase letters”).

Preceding the characters with `^` inverts the matched set (e.g. `[^a-z]` means “all character but lowercase letters”).

Appending `i` right after the right bracket makes the match case-insensitive.

#### *rule*

Match a parsing expression of a rule recursively and return its match result.

#### ( *expression* )

Match a subexpression and return its match result.

#### *expression* \*

Match zero or more repetitions of the expression and return their match results in an array. The matching is greedy, i.e. the parser tries to match the expression as many times as possible. Unlike in regular expressions, [there is no backtracking](./backtracking.md).

#### *expression* +

Match one or more repetitions of the expression and return their match results in an array. The matching is greedy, i.e. the parser tries to match the expression as many times as possible. Unlike in regular expressions, [there is no backtracking](./backtracking.md).

#### *expression* ?

Try to match the expression. If the match succeeds, return its match result, otherwise return `null`. Unlike in regular expressions, [there is no backtracking](./backtracking.md).

#### & *expression*

Try to match the expression. If the match succeeds, just return `undefined` and do not consume any input, otherwise consider the match failed.

#### ! *expression*

Try to match the expression. If the match does not succeed, just return `undefined` and do not consume any input, otherwise consider the match failed (the expression was matched, when it shouldn't have).

#### & { *predicate* }

This is a positive assertion. No input is consumed.

The predicate should be JavaScript code, and it's executed as a function. Curly braces in the predicate must be [balanced](./balanced-braces.md).

The predicate should `return` a boolean value. If the result is _truthy_, the match result is `undefined`, otherwise the match is considered failed.

The predicate has access to all variables and functions in the [Action Execution Environment](./action-execution-environment.md).

#### ! { *predicate* }

This is a negative assertion. No input is consumed.

The predicate should be JavaScript code, and it's executed as a function. Curly braces in the predicate must be [balanced](./balanced-braces.md).

The predicate should `return` a boolean value. If the result is _falsy_, the match result is `undefined`, otherwise the match is considered failed.

The predicate has access to all variables and functions in the [Action Execution Environment](./action-execution-environment.md).

#### $ *expression*

Try to match the expression. If the match succeeds, return the matched text instead of the match result.

#### *label* : *expression*

Match the expression and remember its match result under given label. The label must be a JavaScript identifier.

Labeled expressions are useful together with actions, where saved match results can be accessed by action's JavaScript code.

#### *expression<sub>1</sub>* *expression<sub>2</sub>* ...  *expression<sub>n</sub>*

Match a sequence of expressions and return their match results in an array.

#### *expression* { *action* }

If the expression matches successfully, run the action, otherwise consider the match failed.

The action should be JavaScript code, and it's executed as a function. Curly braces in the action must be [balanced](./balanced-braces.md).

The action should `return` some value, which will be used as the match result of the expression.

The action has access to all variables and functions in the [Action Execution Environment](./action-execution-environment.md).

#### *expression<sub>1</sub>* / *expression<sub>2</sub>* / ... / *expression<sub>n</sub>*

Try to match the first expression, if it does not succeed, try the second one, etc. Return the match result of the first successfully matched expression. If no expression matches, consider the match failed.

#### *expression<sub>1</sub>* @*expression<sub>2</sub>* ...  *expression<sub>n</sub>*

Only returns the expression(s) following `@` 

> WARNING: You cannot use this on predicate's, and cannot use it alongside an action.

```js
start = MultiPluck
      / SinglePluck

SinglePluck = "0"? @integer
MultiPluck = @integer "." @integer

integer = $[0-9]+
```

When `SinglePluck` finds `011`, it returns `"11"`

When `MultiPluck` finds `0.11`, it returns `["0", "11"]`
