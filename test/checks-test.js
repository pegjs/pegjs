(function() {

module("PEG.compiler.checks");

test("reports missing referenced rules", function() {
  var grammars = [
    'start = missing',
    'start = missing / "a" / "b"',
    'start = "a" / "b" / missing',
    'start = missing "a" "b"',
    'start = "a" "b" missing',
    'start = label:missing',
    'start = &missing',
    'start = !missing',
    'start = missing?',
    'start = missing*',
    'start = missing+',
    'start = missing { }'
  ];

  for (var i = 0; i < grammars.length; i++) {
    raises(
      function() {
        var ast = PEG.parser.parse(grammars[i]);
        PEG.compiler.checks.missingReferencedRules(ast);
      },
      function(e) {
        return e instanceof PEG.GrammarError
          && e.message === "Referenced rule \"missing\" does not exist.";
      }
    );
  }
});

test("reports left recursion", function() {
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

  for (var i = 0; i < grammars.length; i++) {
    raises(
      function() {
        var ast = PEG.parser.parse(grammars[i]);
        PEG.compiler.checks.leftRecursion(ast);
      },
      function(e) {
        return e instanceof PEG.GrammarError
          && e.message === "Left recursion detected for rule \"start\".";
      }
    );
  }
});

})();
