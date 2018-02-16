### Action Execution Environment

Actions and predicates have these variables and functions available to them.

* All variables and functions defined in the initializer at the beginning of the grammar are available.

* Labels from preceding expressions are available as local variables, which will have the match result of the labelled expressions.

  A label is only available after its labelled expression is matched:

  ```pegjs
  rule = A:('a' B:'b' { /* B is available, A is not */ } )
  ```

  A label in a sub-expression is only valid within the sub-expression:

  ```pegjs
  rule = A:'a' (B: 'b') (C: 'b' { /* A and C are available, B is not */ })
  ```

* `options` is a variable that contains the parser options.

* `error(message, where)` will report an error and throw an exception. `where` is optional; the default is the value of `location()`.

* `expected(message, where)` is similar to `error`, but reports: Expected _message_ but "_other_" found

* `location()` returns an object like this:

  ```js
  {
    start: { offset: 23, line: 5, column: 6 },
    end: { offset: 25, line: 5, column: 8 }
  }
  ```

  For actions, `start` refers to the position at the beginning of the preceding expression, and `end` refers to the position after the end of the preceding expression.

  For predicates, `start` and `end` are the same, the location where the predicate is evaluated.

  `offset` is a 0-based character index within the source text.
  `line` and `column` are 1-based indices.

  Note that `line` and `column` are somewhat expensive to compute, so if you need location frequently, you might want to use `offset()` or `range()` instead.

* `offset()` returns the start offset.

* `range()` returns an array containing the start and end offsets, such as `[23, 25]`.

* `text()` returns the source text between `start` and `end` (which will be "" for predicates).
