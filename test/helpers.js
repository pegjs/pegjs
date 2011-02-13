parses = function(parser, input, expected) {
  deepEqual(parser.parse(input), expected);
};

doesNotParse = function(parser, input) {
  raises(function() { parser.parse(input); }, parser.SyntaxError);
};

doesNotParseWithMessage = function(parser, input, message) {
  raises(
    function() { parser.parse(input); },
    function(e) {
      return e instanceof parser.SyntaxError && e.message === message;
    }
  );
};

doesNotParseWithPos = function(parser, input, line, column) {
  raises(
    function() { parser.parse(input); },
    function(e) {
      return e instanceof parser.SyntaxError
        && e.line === line
        && e.column === column;
    }
  );
};

parserParses = function(input, expected) {
  parses(PEG.parser, input, expected);
};

parserDoesNotParse = function(input) {
  doesNotParse(PEG.parser, input);
};

parserDoesNotParseWithMessage = function(input, message) {
  doesNotParseWithMessage(PEG.parser, input, message);
};
