(function() {

module("PEG.compiler.passes.reportMissingRules");

test("reports missing referenced rules", function() {
  function testGrammar(grammar) {
    raises(
      function() {
        var ast = PEG.parser.parse(grammar);
        PEG.compiler.passes.reportMissingRules(ast);
      },
      function(e) {
        return e instanceof PEG.GrammarError
          && e.message === "Referenced rule \"missing\" does not exist.";
      }
    );
  }

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

  for (var i = 0; i < grammars.length; i++) { testGrammar(grammars[i]); }
});

})();
