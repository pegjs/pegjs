describe("compiler pass |reportMissingRules|", function() {
  var pass = PEG.compiler.passes.check.reportMissingRules;

  it("reports missing rules", function() {
    expect(pass).toReportError('start = missing', {
      message: 'Referenced rule "missing" does not exist.'
    });
  });

  it("not report imported rules as missing", function() {
    expect(pass).not.toReportError('start = #imported');
    expect(pass).not.toReportError('start = #imported:rule');
  });
});
