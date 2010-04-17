PEG.js: Parser Generator for JavaScript
=======================================

<http://pegjs.majda.cz/>

PEG.js is a parser generator for JavaScript based on the [parsing expression grammar](http://en.wikipedia.org/wiki/Parsing_expression_grammar) formalism. It is designed to be used either from your browser or from the command line (using [Rhino](http://www.mozilla.org/rhino/) JavaScript interpreter).

Features
--------

  * Usable [from your browser](http://pegjs.majda.cz/online) or [from a command-line](http://pegjs.majda.cz/documentation#generating-a-parser)
  * Simple and expressive [grammar syntax](http://pegjs.majda.cz/documentation#grammar)
  * No separate lexical analysis step—both lexical and syntactical analysis are handled by one tool
  * Handles wide class of grammars (strict superset of LL(k) and LR(k))
  * Precise and human-friendly error reporting

Usage
-----

To use PEG.js, you need to generate a parser from your grammar and then use the generated parser in your project.

### Generating a Parser

A parser can be generated either [online](http://pegjs.majda.cz/online) in your browser or using the command line. Let's look at the second option. You need to follow these steps:

  1. Install Java. This is necessary to run [Rhino](http://www.mozilla.org/rhino/) (which is bundled with PEG.js).

  2. Generate the parser using `bin/pegjs` script on Unix or `bin/pegjs.bat` batch file on Windows.

For example, to generate a parser from an example grammar in the `examples/arithmetics.pegjs` file on Unix, run:

    $ bin/pegjs arithmeticsParser examples/arithmetics.pegjs

This command will create the parser in the `examples/arithmetics.js` file and will make it available in the `arithmeticsParser` global variable.

The `bin/pegjs` command has several options that influence the generator&mdash;to learn more about them, use the `--help` option.

**Note:** In the future, I will probably use [Narwhal](http://narwhaljs.org/) for the command-line version.

### Using the Generated Parser

Let's assume that you want to use the parser in a web page. To do this, you need to:

  1. Include the generated parser into your page:

         <!-- Replace "example/arithmetics.js" with your parser file -->
         <script src="example/arithmetics.js"></script>

     This creates a variable with the parser object in the global scope (you can choose name of the variable when generating the parser).

  2. Use the parser, i.e. call the `parse` method on the parser variable:

         <script>
           // Replace "arithmeticsParser" with your parser variable
           document.write(arithmeticsParser.parse("2*(3+4)"));
         </script>

     The `parse` method of the generated parser will return either the result of the parsing (dependent on the actions you specified in the grammar) or throw `PEG.Parser.SyntaxError` exception if the input contains a syntax error. The exception has properties `message`, `line` and `column`, which contain details about the error.

Grammar
-------
For detailed description of the grammar see the [online documentation](http://pegjs.majda.cz/documentation#grammar).

Compatibility
-------------

Both the parser generator and generated parsers should run well in IE6+ and recent versions of Firefox, Chrome, Safari and Opera, as well as Rhino JavaScript engine.
