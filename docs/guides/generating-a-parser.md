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

You can tweak the generated parser with several options:

  * `-a`, `--allowed-start-rules` — comma-separated list of rules the parser will be allowed to start parsing from (default: the first rule in the grammar)
  * `--cache` — makes the parser cache results, avoiding exponential parsing time in pathological cases but making the parser slower
  * `-d`, `--dependency` — makes the parser require a specified dependency (can be specified multiple times)
  * `-e`, `--export-var` — name of a global variable into which the parser object is assigned to when no module loader is detected
  * `--extra-options` — additional options (in JSON format) to pass to `peg.generate`
  * `-c`, `--config`, `--extra-options-file` — file with additional options (in JSON or JavaScript) to pass to `peg.generate`
  * `-f`, `--format` — format of the generated parser: `amd`, `bare`, `commonjs`, `es`, `globals`, `umd` (default: `commonjs`)
  * `-O`, `--optimize` — selects between optimizing the generated parser for parsing speed (`speed`) or code size (`size`) (default: `speed`)
  * `-p`, `--plugin` — makes PEG.js use a specified plugin (can be specified multiple times)
  * `--trace` — makes the parser trace its progress

**NOTE:** On the command line, unless it's a repeatable option, any option on the right side will take priority over either the same option mentioned before or it's counter part:

- `pegjs -f es -f bare` will set `options.format` to `bare`
- `pegjs --no-trace --trace` will set `options.trace` to `true`
- `pegjs -a start,Rule -a Rule,Template` will set `options.allowedStartRules` to `[ "start", "Rule", "Template" ]`

### Module

To generate a parser using the module, take a look at the section about the method `peg.generate()` described in the [JavaScript API documentation](./javascript-api.md). This method is the API alternative to the command line tool as it does everything for it, the command line tool just takes care of validating and handling input, output and options.
