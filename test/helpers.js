parses = function(parser, input, expected) {
  deepEqual(parser.parse(input), expected);
};

parsesWithStartRule = function(parser, input, startRule, expected) {
  deepEqual(parser.parse(input, startRule), expected);
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

doesNotParseWithDetails = function(parser, input, expected, found, message) {
  raises(
    function() { parser.parse(input); },
    function(e) {
      var i;

      if (!(e instanceof parser.SyntaxError))    { return false; }
      if (e.expected.length !== expected.length) { return false; }
      for (i = 0; i < e.expected.length; i++) {
        if (e.expected[i] !== expected[i])       { return false; }
      }
      if (e.found !== found)                     { return false; }
      if (e.message !== message)                 { return false; }

      return true;
    }
  );
};

doesNotParseWithPos = function(parser, input, offset, line, column) {
  raises(
    function() { parser.parse(input); },
    function(e) {
      return e instanceof parser.SyntaxError
        && e.offset === offset
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
