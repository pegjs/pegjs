describe("compiler pass |reportLeftRecursion|", function() {
  var pass = PEG.compiler.passes.check.reportLeftRecursion;

  it("reports direct left recursion", function() {
    expect(pass).toReportError('start = start', {
      message: 'Left recursion detected for rule \"start\".'
    });
  });

  it("reports indirect left recursion", function() {
    expect(pass).toReportError([
      'start = stop',
      'stop  = start'
    ].join("\n"), {
      message: 'Left recursion detected for rule \"start\".'
    });
  });

  describe("in sequences", function() {
    it("reports left recursion if all preceding elements match empty string", function() {
      expect(pass).toReportError('start = "" "" "" start');
    });

    it("doesn't report left recursion if some preceding element doesn't match empty string", function() {
      expect(pass).not.toReportError('start = "a" "" "" start');
      expect(pass).not.toReportError('start = "" "a" "" start');
      expect(pass).not.toReportError('start = "" "" "a" start');
    });

    it("computes empty string matching correctly", function() {
      expect(pass).toReportError('start = ("" / "a" / "b") start');
      expect(pass).toReportError('start = ("a" / "" / "b") start');
      expect(pass).toReportError('start = ("a" / "b" / "") start');
      expect(pass).not.toReportError('start = ("a" / "b" / "c") start');

      expect(pass).toReportError('start = ("" { }) start');
      expect(pass).not.toReportError('start = ("a" { }) start');

      expect(pass).toReportError('start = ("" "" "") start');
      expect(pass).not.toReportError('start = ("a" "" "") start');
      expect(pass).not.toReportError('start = ("" "a" "") start');
      expect(pass).not.toReportError('start = ("" "" "a") start');

      expect(pass).toReportError('start = a:"" start');
      expect(pass).not.toReportError('start = a:"a" start');

      expect(pass).toReportError('start = $"" start');
      expect(pass).not.toReportError('start = $"a" start');

      expect(pass).toReportError('start = &"" start');
      expect(pass).toReportError('start = &"a" start');

      expect(pass).toReportError('start = !"" start');
      expect(pass).toReportError('start = !"a" start');

      expect(pass).toReportError('start = ""? start');
      expect(pass).toReportError('start = "a"? start');

      expect(pass).toReportError('start = ""* start');
      expect(pass).toReportError('start = "a"* start');

      expect(pass).toReportError('start = ""+ start');
      expect(pass).not.toReportError('start = "a"+ start');

      expect(pass).toReportError('start = &{ } start');

      expect(pass).toReportError('start = !{ } start');

      expect(pass).toReportError([
        'start = a start',
        'a = ""'
      ].join('\n'));
      expect(pass).not.toReportError([
        'start = a start',
        'a = "a"'
      ].join('\n'));

      expect(pass).toReportError('start = "" start');
      expect(pass).not.toReportError('start = "a" start');

      expect(pass).not.toReportError('start = [a-d] start');

      expect(pass).not.toReportError('start = "." start');
    });
  });
});
