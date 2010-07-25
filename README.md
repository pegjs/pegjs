PEG.js: Parser Generator for JavaScript
=======================================

<http://pegjs.majda.cz/>

PEG.js is a parser generator for JavaScript based on the [parsing expression grammar](http://en.wikipedia.org/wiki/Parsing_expression_grammar) formalism. It enables you to easily build fast parsers which process complex data or computer languages. You can use it as an underlying tool when writing various data processors, transformers, interpreters, or compilers.

Features
--------

  * Usable [from your browser](http://pegjs.majda.cz/online), from JavaScript code, or [from a command-line](http://pegjs.majda.cz/documentation#generating-a-parser)
  * Simple and expressive [grammar syntax](http://pegjs.majda.cz/documentation#grammar)
  * No separate lexical analysis step — both lexical and syntactical analysis are handled by one tool
  * Handles wide class of grammars (superset of LL(*k*) and LR(*k*))
  * Precise and human-friendly error reporting

Building
--------

To build PEG.js, simply run the `rake` command:

    $ rake

Of course, you need to have [Rake](http://rake.rubyforge.org/) installed. The command creates PEG.js library in `lib/peg.js` by processing files in the `src` directory.

Usage
-----

Using PEG.js is easy:

    var parser = PEG.buildParser("start = ('a' / 'b')+");
    parser.parse("abba"); // returns ["a", "b", "b", "a"]
    parser.parse("abcd"); // throws an exception with details about the error

Basically, you need to generate a parser from your grammar and then use it to parse the input.

### Generating a Parser

There are three ways how to generate the parser:

  1. Using the [online generator](http://pegjs.majda.cz/online)
  2. Using the `PEG.buildParser` function from JavaScript code
  3. Using the command line

The [online generator](http://pegjs.majda.cz/online) is easiest to use — you just enter your grammar and download the generated parser code. The parser object will be available in a global variable you specify (`parser` by default).

To generate the parser from JavaScript code, include the `lib/compiler.js` file and use the `PEG.buildParser` function. This function accepts a string with a grammar and either returns the built parser object or throws an exception if the grammar is invalid.

To generate the parser from a command line, you need to have Java installed (so that [Rhino](http://www.mozilla.org/rhino/) — which is included in PEG.js — can run). Use the `bin/pegjs` script on Unix or `bin/pegjs.bat` batch file on Windows:

    $ bin/pegjs arithmeticsParser examples/arithmetics.pegjs

This command will create the parser from the `examples/arithmetics.pegjs` file and put in into the `examples/arithmetics.js` file. The parser object will be available in the `arithmeticsParser` global variable. To learn more about the generator usage, use  the `--help` option.

### Using the Generated Parser

To use the generated parser, include the generated file (unless you built the parser straight from the JavaScript code using `PEG.buildParser`) and use the `parse` method on the parser object. This method accepts an input string and either returns the parse result (dependent on the actions you specified in the grammar) or throws `PEG.grammarParser.SyntaxError` exception if the input contains a syntax error. The exception has properties `message`, `line` and `column`, which contain details about the error.

The parser object also has the `toSource` method that returns its textual representation.

Grammar
-------
For detailed description of the grammar see the [online documentation](http://pegjs.majda.cz/documentation#grammar).

Compatibility
-------------

Both the parser generator and generated parsers should run well in the following environments:

  * IE6+
  * Firefox
  * Chrome
  * Safari
  * Opera
  * Rhino
