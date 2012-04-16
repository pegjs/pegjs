(function(global) {

var extensions = {
  parses: function(parser, input, expected) {
    QUnit.deepEqual(parser.parse(input), expected);
  },

  parsesWithStartRule: function(parser, input, startRule, expected) {
    QUnit.deepEqual(parser.parse(input, startRule), expected);
  },

  doesNotParse: function(parser, input) {
    QUnit.raises(function() { parser.parse(input); }, parser.SyntaxError);
  },

  doesNotParseWithMessage: function(parser, input, message) {
    QUnit.raises(
      function() { parser.parse(input); },
      function(e) {
        return e instanceof parser.SyntaxError && e.message === message;
      }
    );
  },

  doesNotParseWithDetails: function(parser, input, expected, found, message) {
    QUnit.raises(
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
  },

  doesNotParseWithPos: function(parser, input, offset, line, column) {
    QUnit.raises(
      function() { parser.parse(input); },
      function(e) {
        return e instanceof parser.SyntaxError
          && e.offset === offset
          && e.line === line
          && e.column === column;
      }
    );
  },

  parserParses: function(input, expected) {
    QUnit.parses(PEG.parser, input, expected);
  },

  parserDoesNotParse: function(input) {
    QUnit.doesNotParse(PEG.parser, input);
  },

  parserDoesNotParseWithMessage: function(input, message) {
    QUnit.doesNotParseWithMessage(PEG.parser, input, message);
  }
};

QUnit.extend(QUnit,  extensions);
QUnit.extend(global, extensions);

})(this);
