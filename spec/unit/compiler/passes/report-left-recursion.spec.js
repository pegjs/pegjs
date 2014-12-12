describe("compiler pass |reportLeftRecursion|", function() {
  var pass = PEG.compiler.passes.check.reportLeftRecursion;

  it("reports direct left recursion", function() {
    var tests = [
      'start = start;',
      'start = start {};',
      'start = "a"? start;',
      'start = "a"* start;',
      'start = !"a" start;',
      'start = &"a" start;',
      'start = !{} start;',
      'start = &{} start;',
      'start = "" start;',
      'start = [] start;'
    ];
    for (var i = 0; i < tests.length; ++i) {
      expect(pass).toReportError(tests[i], {
        message: 'Left recursion detected: start->start'
      });
    }
  });

  it("reports indirect left recursion", function() {
    var tests = [
      'start = stop; stop = start;',
      'start = stop; stop = start {};',
      'start = stop; stop = "a"? start;',
      'start = stop; stop = "a"* start;',
      'start = stop; stop = !"a" start;',
      'start = stop; stop = &"a" start;',
      'start = stop; stop = !{} start;',
      'start = stop; stop = &{} start;',
      'start = stop; stop = "" start;',
      'start = stop; stop = [] start;'
    ];
    for (var i = 0; i < tests.length; ++i) {
      expect(pass).toReportError(tests[i], {
        message: 'Left recursion detected: start->stop->start'
      });
    }
  });
  it("not report reports indirect left recursion", function() {
  });

  describe("in sequences", function() {
    it("reports left recursion only for the first element", function() {
      expect(pass).toReportError('start = start "a" "b"', {
        message: 'Left recursion detected: start->start'
      });

      expect(pass).not.toReportError('start = "a" start "b"');
      expect(pass).not.toReportError('start = "a" "b" start');
      expect(pass).not.toReportError('start = "a"+ start');
    });
  });
});
