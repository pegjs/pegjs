describe("compiler pass |reportLeftRecursion|", function() {
  var pass = PEG.compiler.passes.check.reportLeftRecursion;

  it("reports direct left recursion", function() {
    expect(pass).toReportError('start = start', {
      message: 'Line 1, column 9: Left recursion detected for rule \"start\".'
    });
  });

  it("reports indirect left recursion", function() {
    expect(pass).toReportError([
      'start = stop',
      'stop  = start'
    ].join("\n"), {
      message: 'Line 2, column 9: Left recursion detected for rule \"start\".'
    });
  });

  describe("in sequences", function() {
    it("reports left recursion only for the first element", function() {
      expect(pass).toReportError('start = start "a" "b"', {
        message: 'Line 1, column 9: Left recursion detected for rule \"start\".'
      });

      expect(pass).not.toReportError('start = "a" start "b"');
      expect(pass).not.toReportError('start = "a" "b" start');
    });
  });
});
