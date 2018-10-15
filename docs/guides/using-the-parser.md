## Using the Parser

> parser { DefaultTracer?, SyntaxError, parse(input[, options]) }

Using the generated parser is simple; just call its `parse` method and pass an input string as a parameter. The method will return a parse result (the exact value depends on the grammar used to generate the parser) or throw an exception if the input is invalid. The exception will contain `location`, `expected`, `found`,  and `message` properties with more details about the error.

```js
parser.parse("abba"); // returns ["a", "b", "b", "a"]

parser.parse("abcd"); // throws an exception
```

You can tweak parser behavior by passing a second parameter with an `options` object to the `parse` method. The following options are supported:

* `filename` — the name of the source passed to the generated parser; will be used by the `location()` helper
* `startRule` — name of the rule to start parsing from (depends on the rules the grammar supports as starting rules)
* `tracer` — tracer to use (only if the parser was generated with `"trace": true` option passed to the compiler)

Parsers can also support their own custom options on the `options` object passed to them.
