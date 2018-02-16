### Balanced Braces

Code fragments such as actions and predicates must have balanced curly braces, because PEG.js doesn't parse the contents. It only looks at balanced braces to find the end of the code fragment.

If your code fragment needs an unbalanced brace in a string literal, you can balance it in a comment. For example:

```pegjs
brace = [{}] {
  return text() === "{" ? 1 : -1;
  // } for balance
}
```
