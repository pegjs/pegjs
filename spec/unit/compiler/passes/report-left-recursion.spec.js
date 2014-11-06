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
    it("reports left recursion only for the first element", function() {
      expect(pass).toReportError('start = start "a" "b"', {
        message: 'Left recursion detected for rule \"start\".'
      });

      expect(pass).not.toReportError('start = "a" start "b"');
      expect(pass).not.toReportError('start = "a" "b" start');
    });
  });

  describe("in templates", function() {
    it("reports left recursion for template argument", function() {
      expect(pass).toReportError('start<A> = start<A> "a" "b"', {
        message: 'Left recursion detected for rule "start".'
      });
      expect(pass).toReportError([
        'start = template<start> "a"',
        'template<A> = A "b"',
      ].join('\n'), {
        // message: 'Left recursion detected for rule "start" (through template parameter "A" of rule "template").'
        message: 'Left recursion detected for rule "start".'
      });

      expect(pass).not.toReportError([
        'start = template<start> "a"',
        'template<A> = "b" A',
      ].join('\n'));
      expect(pass).not.toReportError([
        'start = template<"b" start> "a"',
        'template<A> = A "b"',
      ].join('\n'));
    });
  });
});
