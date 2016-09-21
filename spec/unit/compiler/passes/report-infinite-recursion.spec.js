"use strict";

let peg = require("../../../../lib/peg");

describe("compiler pass |reportInfiniteRecursion|", function() {
  let pass = peg.compiler.passes.check.reportInfiniteRecursion;

  it("reports direct left recursion", function() {
    expect(pass).toReportError("start = start", {
      message:  "Possible infinite loop when parsing (left recursion: start -> start).",
      location: {
        start: { offset:  8, line: 1, column:  9 },
        end:   { offset: 13, line: 1, column: 14 }
      }
    });
  });

  it("reports indirect left recursion", function() {
    expect(pass).toReportError([
      "start = stop",
      "stop  = start"
    ].join("\n"), {
      message:  "Possible infinite loop when parsing (left recursion: start -> stop -> start).",
      location: {
        start: { offset: 21, line: 2, column:  9 },
        end:   { offset: 26, line: 2, column: 14 }
      }
    });
  });

  describe("in sequences", function() {
    it("reports left recursion if all preceding elements match empty string", function() {
      expect(pass).toReportError("start = '' '' '' start");
    });

    it("doesn't report left recursion if some preceding element doesn't match empty string", function() {
      expect(pass).not.toReportError("start = 'a' '' '' start");
      expect(pass).not.toReportError("start = '' 'a' '' start");
      expect(pass).not.toReportError("start = '' '' 'a' start");
    });

    // Regression test for #359.
    it("reports left recursion when rule reference is wrapped in an expression", function() {
      expect(pass).toReportError("start = '' start?");
    });

    it("computes expressions that always consume input on success correctly", function() {
      expect(pass).toReportError([
        "start = a start",
        "a 'a' = ''"
      ].join("\n"));
      expect(pass).not.toReportError([
        "start = a start",
        "a 'a' = 'a'"
      ].join("\n"));

      expect(pass).toReportError("start = ('' / 'a' / 'b') start");
      expect(pass).toReportError("start = ('a' / '' / 'b') start");
      expect(pass).toReportError("start = ('a' / 'b' / '') start");
      expect(pass).not.toReportError("start = ('a' / 'b' / 'c') start");

      expect(pass).toReportError("start = ('' { }) start");
      expect(pass).not.toReportError("start = ('a' { }) start");

      expect(pass).toReportError("start = ('' '' '') start");
      expect(pass).not.toReportError("start = ('a' '' '') start");
      expect(pass).not.toReportError("start = ('' 'a' '') start");
      expect(pass).not.toReportError("start = ('' '' 'a') start");

      expect(pass).toReportError("start = a:'' start");
      expect(pass).not.toReportError("start = a:'a' start");

      expect(pass).toReportError("start = $'' start");
      expect(pass).not.toReportError("start = $'a' start");

      expect(pass).toReportError("start = &'' start");
      expect(pass).toReportError("start = &'a' start");

      expect(pass).toReportError("start = !'' start");
      expect(pass).toReportError("start = !'a' start");

      expect(pass).toReportError("start = ''? start");
      expect(pass).toReportError("start = 'a'? start");

      expect(pass).toReportError("start = ''* start");
      expect(pass).toReportError("start = 'a'* start");

      expect(pass).toReportError("start = ''+ start");
      expect(pass).not.toReportError("start = 'a'+ start");

      expect(pass).toReportError("start = ('') start");
      expect(pass).not.toReportError("start = ('a') start");

      expect(pass).toReportError("start = &{ } start");

      expect(pass).toReportError("start = !{ } start");

      expect(pass).toReportError([
        "start = a start",
        "a = ''"
      ].join("\n"));
      expect(pass).not.toReportError([
        "start = a start",
        "a = 'a'"
      ].join("\n"));

      expect(pass).toReportError("start = '' start");
      expect(pass).not.toReportError("start = 'a' start");

      expect(pass).not.toReportError("start = [a-d] start");

      expect(pass).not.toReportError("start = . start");
    });
  });
});
