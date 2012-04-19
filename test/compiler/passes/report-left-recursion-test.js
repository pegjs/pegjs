(function() {

module("PEG.compiler.passes.reportLeftRecursion");

test("reports left recursion", function() {
  function testGrammar(grammar) {
    raises(
      function() {
        var ast = PEG.parser.parse(grammar);
        PEG.compiler.passes.reportLeftRecursion(ast);
      },
      function(e) {
        return e instanceof PEG.GrammarError
          && e.message === "Left recursion detected for rule \"start\".";
      }
    );
  }

  var grammars = [
    /* Direct */
    'start = start',
    'start = start / "a" / "b"',
    'start = "a" / "b" / start',
    'start = start "a" "b"',
    'start = label:start',
    'start = &start',
    'start = !start',
    'start = start?',
    'start = start*',
    'start = start+',
    'start = start { }',

    /* Indirect */
    'start = stop; stop = start'
  ];

  for (var i = 0; i < grammars.length; i++) { testGrammar(grammars[i]); }
});

})();
