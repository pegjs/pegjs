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

To generate a parser, you can use the [online generator](http://pegjs.majda.cz/online) or the command line. For the second option, you need to have Java installed. Than you can generate the parser using the `bin/pegjs` script on Unix or `bin/pegjs.bat` batch file on Windows:

    $ bin/pegjs arithmeticsParser examples/arithmetics.pegjs

This command will create the parser from the `examples/arithmetics.pegjs` file and put in into the `examples/arithmetics.js` file. The generated parser will be available in the `arithmeticsParser` global variable. The generator has several useful options&mdash;to learn more about them, use `--help`.

### Using the Generated Parser

To use the parser in a web page, follow the following example:

    <!DOCTYPE html>
    <head>
      <title>Arithmetics Parser Example</title>
      <script src="examples/arithmetics.js"></script> <!-- Include the parser. -->
      <script>
        function calculate(expression) {
          /* Use the parser to compute a value of an arithmetic expression. */
          var result;
          try {
            result = arithmeticsParser.parse(document.getElementById("expression").value);
          } catch (e) {
            result = e.message;
          }
          document.getElementById("result").innerText = result;
        }
      </script>
    </head>
    <body>
      <input type="text" id="expression" value="2*(3+4)">
      <input type="button" id="calculate" value="Calculate" onclick="calculate();">
      <div id="result"></div>
    </body>

The `parse` method of the generated parser will return either the result of the parsing (dependent on the actions you specified in the grammar) or throw `PEG.Parser.SyntaxError` exception if the input contains a syntax error. The exception has properties `message`, `line` and `column`, which contain details about the error.

Grammar
-------
For detailed description of the grammar see the [online documentation](http://pegjs.majda.cz/documentation#grammar).

Compatibility
-------------

Both the parser generator and generated parsers should run well in IE6+ and recent versions of Firefox, Chrome, Safari and Opera, as well as Rhino JavaScript engine.
