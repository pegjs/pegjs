describe("compiler pass |reportUnusedRules|", function() {
  var pass = PEG.compiler.passes.check.reportUnusedRules;

  beforeEach(function() {
    this.addMatchers({
      toReportUnusedRuleIn: function(grammar, options) {
        var ast = PEG.parser.parse(grammar, options || { });

        try {
          this.actual(ast);

          this.message = function() {
            return "Expected the pass to report an unused rule for grammar "
                 + jasmine.pp(grammar) + ", "
                 + "but it didn't.";
          };

          return false;
        } catch (e) {
          if (this.isNot) {
            this.message = function() {
              return "Expected the pass not to report an unused rule for grammar "
                   + jasmine.pp(grammar) + ", "
                   + "but it did.";
            };
          } else {
            this.message = function() {
              return "Expected the pass to report an unused rule for grammar "
                   + jasmine.pp(grammar) + ", "
                   + "but it reported an error with message "
                   + jasmine.pp(e.message) + ".";
            };
          }

          return e.message === 'Rule "unused" is not referenced.';
        }
      }
    });
  });

  it("reports rule not referenced anywhere", function() {
    expect(pass).toReportUnusedRuleIn([
      'start = .',
      'unused = .'
    ].join("\n"));
  });

  it("does not report rule referenced somewhere", function() {
    expect(pass).not.toReportUnusedRuleIn('start = .');
    expect(pass).not.toReportUnusedRuleIn([
      'start = used',
      'used = .'
    ].join("\n"));
  });

  it("does not report allowed start rule", function() {
    expect(pass).not.toReportUnusedRuleIn([
      'a = "x"',
      'b = a'
    ].join("\n"), { allowedStartRules: [ "b" ] });
  });
});
