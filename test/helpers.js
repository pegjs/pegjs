(function(global) {

global.parses = function(parser, input, expected) {
  deepEqual(parser.parse(input), expected);
};

global.doesNotParse = function(parser, input) {
  raises(function() { parser.parse(input); }, parser.SyntaxError);
};

global.doesNotParseWithMessage = function(parser, input, message) {
  raises(
    function() { parser.parse(input); },
    function(e) {
      return e instanceof parser.SyntaxError && e.message === message;
    }
  );
};

global.doesNotParseWithPos = function(parser, input, line, column) {
  raises(
    function() { parser.parse(input); },
    function(e) {
      return e instanceof parser.SyntaxError
        && e.line === line
        && e.column === column;
    }
  );
};

global.parserParses = function(input, expected) {
  global.parses(PEG.parser, input, expected);
};

global.parserDoesNotParse = function(input) {
  global.doesNotParse(PEG.parser, input);
}

global.parserDoesNotParseWithMessage = function(input, message) {
  global.doesNotParseWithMessage(PEG.parser, input, message);
}

})(this);
