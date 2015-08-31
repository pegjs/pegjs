describe("compiler pass |reportDuplicateRules|", function() {
  var pass = PEG.compiler.passes.check.reportDuplicateRules;

  it("reports duplicate rules", function(){
    expect(pass).toReportError([
      'start = "a"',
      'start = "a"'
    ].join('\n'), {
      message: "Duplicate rule \"start\" detected in grammer."
    });
  });
});
