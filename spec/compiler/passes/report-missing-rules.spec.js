describe("compiler pass |reportMissingRules|", function() {
  var pass = PEG.compiler.passes.check.reportMissingRules;

  beforeEach(function() {
    this.addMatchers({
      toReportMissingRuleIn: function(grammar) {
        var ast = PEG.parser.parse(grammar);

        try {
          this.actual(ast);

          this.message = function() {
            return "Expected the pass to report a missing rule for grammar "
                 + jasmine.pp(grammar) + ", "
                 + "but it didn't.";
          };

          return false;
        } catch (e) {
          if (this.isNot) {
            this.message = function() {
              return "Expected the pass not to report a missing rule for grammar "
                   + jasmine.pp(grammar) + ", "
                   + "but it did.";
            };
          } else {
            this.message = function() {
              return "Expected the pass to report a missing rule for grammar "
                   + jasmine.pp(grammar) + ", "
                   + "but it reported an error with message "
                   + jasmine.pp(e.message) + ".";
            };
          }

          return e.message === 'Referenced rule "missing" does not exist.';
        }
      }
    });
  });

  it("reports missing rule referenced from a rule", function() {
    expect(pass).toReportMissingRuleIn('start = missing');
  });

  it("reports missing rule referenced from a named", function() {
    expect(pass).toReportMissingRuleIn('start "start" = missing');
  });

  it("reports missing rule referenced from a choice", function() {
    expect(pass).toReportMissingRuleIn('start = missing / "a" / "b"');
    expect(pass).toReportMissingRuleIn('start = "a" / "b" / missing');
  });

  it("reports missing rule referenced from an action", function() {
    expect(pass).toReportMissingRuleIn('start = missing { }');
  });

  it("reports missing rule referenced from a sequence", function() {
    expect(pass).toReportMissingRuleIn('start = missing "a" "b"');
    expect(pass).toReportMissingRuleIn('start = "a" "b" missing');
  });

  it("reports missing rule referenced from a labeled", function() {
    expect(pass).toReportMissingRuleIn('start = label:missing');
  });

  it("reports missing rule referenced from a text", function() {
    expect(pass).toReportMissingRuleIn('start = $missing');
  });

  it("reports missing rule referenced from a simple and", function() {
    expect(pass).toReportMissingRuleIn('start = &missing');
  });

  it("reports missing rule referenced from a simple not", function() {
    expect(pass).toReportMissingRuleIn('start = &missing');
  });

  it("reports missing rule referenced from an optional", function() {
    expect(pass).toReportMissingRuleIn('start = missing?');
  });

  it("reports missing rule referenced from a zero or more", function() {
    expect(pass).toReportMissingRuleIn('start = missing*');
  });

  it("reports missing rule referenced from a one or more", function() {
    expect(pass).toReportMissingRuleIn('start = missing+');
  });
});
