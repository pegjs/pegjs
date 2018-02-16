### Case-insensitivity

Appending `i` right after either [a literal](./parsing-expression-types.md#literalliteral) or a [a character set](./parsing-expression-types.md#characters) makes the match case-insensitive. The rules shown in the following example all produce the same result:

```pegjs
// without `i`
a1 = "a" / "b" / "c" / "A" / "B" / "C"
b1 = [a-cA-C]

// with `i`
a2 = "a"i / "b"i / "c"i
b2 = [a-c]i
```
