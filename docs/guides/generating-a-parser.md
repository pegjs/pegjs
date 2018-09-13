## Generating a Parser

PEG.js generates a parser from grammar that describes expected input and can specify what the parser returns (using semantic actions on matched parts of the input). The generated parser itself is a JavaScript object with a simple API.

### Command Line

To generate a parser from your grammar, use the `pegjs` command:

```console
$ pegjs arithmetics.pegjs
```

This writes parser source code into a file with the same name as the grammar file but with “.js” extension. You can also specify the output file explicitly:

```console
$ pegjs -o arithmetics-parser.js arithmetics.pegjs
```

If you omit both input and output files, the standard input and output are used (REPL mode).

By default, the generated parser is in the Node.js module format. You can override this using the `--format` option.

You can tweak the generated parser with [several options](./command-line.md).

### Module

To generate a parser using the module, take a look at the section about the method `peg.generate()` described in the [JavaScript API documentation](./javascript-api.md). This method is the API alternative to the command line tool as it does everything for it, the command line tool just takes care of validating and handling input, output and options.
