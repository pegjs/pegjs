describe("compiler pass |reportMissingRules|", function() {
  var pass = PEG.compiler.passes.check.reportMissingRules;

  it("reports missing rules", function() {
    expect(pass).toReportError('start = missing', {
      message: 'Referenced rule "missing" does not exist.'
    });
    expect(pass).toReportError('start<nonmissing> = missing', {
      message: 'Referenced rule "missing" does not exist.'
    });
  });

  it("not reports missing rules for template params", function() {
    expect(pass).not.toReportError('start<nonmissing> = nonmissing');
  });
});
