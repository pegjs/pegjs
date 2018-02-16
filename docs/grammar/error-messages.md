### Error Messages

When parsing input with a generated parser, there are times when the parser will throw an error (on failure or when you call [expected()](./action-execution-environment.md) from one of the action blocks) with a message that contains a comma separated list of expressions that where expected or found. This is usually fine, but sometimes it is preferred to have a more human-readable name.

You can annotate your grammar rules with human-readable names that will be used in the error messages. For example, this:

```pegjs
integer "integer" = $[0-9]+
```

will produce an error message like:

> Expected integer but "a" found.

when parsing a non-number, referencing the human-readable name "integer."

Without the human-readable name, PEG.js instead uses a description of the expression that failed to match:

> Expected [0-9] but "a" found.

Aside from the text content of messages, human-readable names also have a subtler effect on *where* errors are reported. PEG.js prefers to match named rules completely or not at all, but not partially. Unnamed rules, on the other hand, can produce an error in the middle of their subexpressions.

For example, for this rule matching a comma-separated list of integers:

```pegjs
seq = integer ("," integer)*
```

an input like `1,2,a` produces this error message:

> Expected integer but "a" found.

But if we add a human-readable name to the `seq` production:

```pegjs
seq "list of numbers"
    = integer ("," integer)*
```

then PEG.js prefers an error message that implies a smaller attempted parse tree:

> Expected end of input but "," found.
