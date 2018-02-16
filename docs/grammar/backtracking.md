### Backtracking

Unlike in regular expressions, there is no backtracking in PEG.js expressions.

For example, using the input "hi!":

```pegjs

// This will fail
HI = "hi" / "hi!"

// This will pass
HI = "hi!" / "hi"

// This will also pass
HI = w:"hi" !"!" { return w } / "hi!"

```

For more information on backtracking in PEG.js, [checkout this excellent answer on Stack Overflow](https://stackoverflow.com/a/24809596/1518408).
