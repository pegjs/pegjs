describe("compiler pass |reportDuplicateLabels|", function() {
  var pass = PEG.compiler.passes.check.reportDuplicateLabels;
  var msg = 'Duplicate label "a" detected for rule "start".';

  it("reports duplicate labels", function() {
    expect(pass).toReportError("start = a:'some' a:'thing'", {
      message: msg
    });
  });

  it("reports duplicate labels inside expressions", function() {
    expect(pass).toReportError("start = (a:'some')* a:'thing'", {
      message: msg
    });

    expect(pass).toReportError("start = a:'some' / a:'thing'", {
      message: msg
    });

    expect(pass).toReportError("start = ('some' / a:'other')+ / a:'thing'", {
      message: msg
    });
  });

  it("allows unique labels", function() {
    expect(pass).not.toReportError("start = a:'some' b:'thing'");
  });

  it("allows identical labels on different rules", function() {
    expect(pass).not.toReportError([
      "start = a:'some' thing",
      "thing = a:'thing'"
    ].join('\n'));
  });
});
