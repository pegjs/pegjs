## Command Line

The CLI `pegjs` can be used from terminals to generate a parser from the given grammar, without accessing the PEG.js API.

It's usage signature is: `pegjs [options] [<input_file>] [--]`

### Configuration file

If you provide a configuration file (via `-c` or `--config`) then you can use all the options used by the [PEG.js API](./javascript-api.md), as well as:

* `input` — The grammar used as the input file
* `output` — Output's generated parser to the provided destination

> 1. Will throw if neither are strings, or the input has already been provided
> 2. the `output` option for the compiler is not usable from the config

### Input File

Only one grammar is accepted as the given input file, otherwise the CLI aborts with an error.

### Options and their values

Usually CLI options are passed like so

    pegjs grammar.pegjs -o parser.js -c pegjs.config.js

With the PEG.js CLI, you can also use the assignment operator, so the above can be used like so:

    pegjs grammar.pegjs -o=parser.js -c=pegjs.config.js

### Command Line Options

When using the CLI `pegjs`, you can pass the following options:

* `-a`, `--allowed-start-rules` — comma-separated list of rules the parser will be allowed to start parsing from (default: the first rule in the grammar)
* `--cache` — makes the parser cache results, avoiding exponential parsing time in pathological cases but making the parser slower
* `-c`, `--config` — file with additional options (in JSON or JavaScript) to pass to `peg.generate`
* `-d`, `--dependency` — makes the parser require a specified dependency (can be specified multiple times)
* `-e`, `--export-var` — name of a global variable into which the parser object is assigned to when no module loader is detected
* `--extra-options` — additional options (in JSON format) to pass to `peg.generate`
* `--extra-options-file` — same as `--config` (was the only cli option for config files before PEG.js v0.11)
* `-f`, `--format` — format of the generated parser: `amd`, `bare`, `commonjs`, `es`, `globals`, `umd` (default: `commonjs`)
* `--no-cache` — opposite of `--cache` (default behavior)
* `--no-trace` — opposite of `--trace` (default behavior)
* `-O`, `--optimize` — selects between optimizing the generated parser for parsing speed (`speed`) or code size (`size`) (default: `speed`)
* `-o`, `--output` — Output file
* `-p`, `--plugin` — makes PEG.js use a specified plugin (can be specified multiple times)
* `--trace` — makes the parser trace its progress

The following options only print to the console before exiting:

* `-h`, `--help` — Print help and exit
* `-v`, `--version` — Print version information and exit

### Repeatable and non-repeatable options

Repeatable options on the cli are handled by pushing the values into a list (which is used as the value for the option):

- `pegjs -a start,Rule -a Rule,Template` will set `options.allowedStartRules` to `[ "start", "Rule", "Template" ]`

Unless it's a repeatable option, any option on the right side will take priority over either the same option mentioned before or it's counter part:

- `pegjs -f es -f bare` will set `options.format` to `bare`
- `pegjs --no-trace --trace` will set `options.trace` to `true`

### Extra options

Need to pass a custom set of arguments to your plugin? The PEG.js CLI will pass all arguments after `--` to `options["--"]`, which is passed to all plugins.

> NOTE: You will need to use your own argument parser, as the PEG.js CLI does not process these arguments.
