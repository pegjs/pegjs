"use strict";

module.exports = `
Usage: pegjs [options] [<input_file>] [--]

Options:

-a, --allowed-start-rules <rules>  Comma-separated list of rules the generated
                                   parser will be allowed to start parsing from
                                   (default: first rule in the grammar)
                                   (note: repeatable option)

    --cache                        Make generated parser cache results

-c, --config <file>                Aliases for "--extra-options-file"

-d, --dependency <dependency>      Use specified dependency
                                   (note: repeatable option)

-e, --export-var <variable>        Name of a global variable into which the
                                   parser object is assigned to when no
                                   module loader is detected

    --extra-options <options>      A string with additional options (in JSON
                                   format) to pass to peg.generate
                                   (note: repeatable option)

    --extra-options-file <file>    File with additional options (in JSON
                                   format) to pass to peg.generate
                                   (note: repeatable option)

-f, --format <format>              Format of the generated parser:
                                   amd, bare, commonjs, es, globals, umd
                                   (default: commonjs)

-h, --help                         Print help and exit

    --no-cache                     Generated parser doesn't cache results
                                   (default behavior)

    --no-trace                     Disable tracing in generated parser
                                   (default behavior)

-O, --optimize <goal>              Select optimization for speed or size
                                   (default: speed)

-o, --output <file>                Output file

-p, --plugin <plugin>              Use a specified plugin
                                   (note: repeatable option)

    --trace                        Enable tracing in generated parser

-v, --version                      Print version information and exit
`;
