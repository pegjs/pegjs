/* global describe, expect, it, PEG */

"use strict";

describe("compiler pass |reportLeftRecursion|", function() {
  var pass = PEG.compiler.passes.check.reportLeftRecursion;

  it("reports direct left recursion", function() {
    expect(pass).toReportError('start = start', {
      message:  'Left recursion detected for rule \"start\".',
      location: {
        start: { offset:  8, line: 1, column:  9 },
        end:   { offset: 13, line: 1, column: 14 }
      }
    });
  });

  it("reports indirect left recursion", function() {
    expect(pass).toReportError([
      'start = stop',
      'stop  = start'
    ].join("\n"), {
      message:  'Left recursion detected for rule \"start\".',
      location: {
        start: { offset: 21, line: 2, column:  9 },
        end:   { offset: 26, line: 2, column: 14 }
      }
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
