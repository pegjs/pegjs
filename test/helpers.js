(function(global) {

global.throws = function(block, exceptionType, exceptionProperties) {
  var exception = null;
  try {
    block();
  } catch (e) {
    exception = e;
  }

  ok(
    exception !== null,
    exception !== null ? "okay: thrown something" : "failed, nothing thrown"
  );
  if (exception !== null) {
    ok(
      exception instanceof exceptionType,
      exception instanceof exceptionType
        ? "okay: thrown " + exceptionType.name
        : "failed, thrown " + exception.name + " instead of " + exceptionType.name
    );

    for (var property in exceptionProperties) {
      strictEqual(exception[property], exceptionProperties[property]);
    }
  }
};

global.parses = function(parser, input, expected) {
  deepEqual(parser.parse(input), expected);
};

global.doesNotParse = function(parser, input) {
  throws(function() { parser.parse(input); }, parser.SyntaxError);
};

global.doesNotParseWithMessage = function(parser, input, message) {
  throws(
    function() { parser.parse(input); },
    parser.SyntaxError,
    { message: message }
  );
};

global.doesNotParseWithPos = function(parser, input, line, column) {
  var exception = throws(
    function() { parser.parse(input); },
    parser.SyntaxError,
    {
      line:   line,
      column: column
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
