describe("compiler pass |reportLeftRecursion|", function() {
  var pass = PEG.compiler.passes.check.reportLeftRecursion;

  it("reports direct left recursion", function() {
    var tests = [
      'start = start;',
      'start = start "a";',
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
      'start = stop; stop = start "a";',
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

  it("not reports left recursion, if some rules in possible recursion path not exist", function() {
    var tests = [
      'start = nonexist start;',
      'start = nonexist start "a";',
      'start = nonexist start {};',
      'start = nonexist "a"? start;',
      'start = nonexist "a"* start;',
      'start = nonexist !"a" start;',
      'start = nonexist &"a" start;',
      'start = nonexist !{} start;',
      'start = nonexist &{} start;',
      'start = nonexist "" start;',
      'start = nonexist [] start;'
    ];
    for (var i = 0; i < tests.length; ++i) {
      expect(pass).not.toReportError(tests[i]);
    }
  });

  describe("in sequences", function() {
    it("not report left recursion when preceding elements consume input", function() {
      var tests = [
        'start = "a" start "b"',
        'start = "a" "b" start',
        'start = "a"+ start',
        'start = ["a"] start',
        'start = $"a" start',
        'start = . start',
        'start = stop; stop = "a" start',
        'start = (. {}) start',
        'start = (!{} .) start',
        'start = (&{} .) start',
      ];
      for (var i = 0; i < tests.length; ++i) {
        expect(pass).not.toReportError(tests[i]);
      }
    });
  });
});
