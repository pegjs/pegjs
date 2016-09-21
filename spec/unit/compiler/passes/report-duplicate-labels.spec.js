"use strict";

let peg = require("../../../../lib/peg");

describe("compiler pass |reportDuplicateLabels|", function() {
  let pass = peg.compiler.passes.check.reportDuplicateLabels;

  describe("in a sequence", function() {
    it("reports labels duplicate with labels of preceding elements", function() {
      expect(pass).toReportError("start = a:'a' a:'a'", {
        message:  "Label \"a\" is already defined at line 1, column 9.",
        location: {
          start: { offset: 14, line: 1, column: 15 },
          end:   { offset: 19, line: 1, column: 20 }
        }
      });
    });

    it("doesn't report labels duplicate with labels in subexpressions", function() {
      expect(pass).not.toReportError("start = ('a' / a:'a' / 'a') a:'a'");
      expect(pass).not.toReportError("start = (a:'a' { }) a:'a'");
      expect(pass).not.toReportError("start = ('a' a:'a' 'a') a:'a'");
      expect(pass).not.toReportError("start = b:(a:'a') a:'a'");
      expect(pass).not.toReportError("start = $(a:'a') a:'a'");
      expect(pass).not.toReportError("start = &(a:'a') a:'a'");
      expect(pass).not.toReportError("start = !(a:'a') a:'a'");
      expect(pass).not.toReportError("start = (a:'a')? a:'a'");
      expect(pass).not.toReportError("start = (a:'a')* a:'a'");
      expect(pass).not.toReportError("start = (a:'a')+ a:'a'");
      expect(pass).not.toReportError("start = (a:'a') a:'a'");
    });
  });

  describe("in a choice", function() {
    it("doesn't report labels duplicate with labels of preceding alternatives", function() {
      expect(pass).not.toReportError("start = a:'a' / a:'a'");
    });
  });

  describe("in outer sequence", function() {
    it("reports labels duplicate with labels of preceding elements", function() {
      expect(pass).toReportError("start = a:'a' (a:'a')", {
        message:  "Label \"a\" is already defined at line 1, column 9.",
        location: {
          start: { offset: 15, line: 1, column: 16 },
          end:   { offset: 20, line: 1, column: 21 }
        }
      });
    });

    it("doesn't report labels duplicate with the label of the current element", function() {
      expect(pass).not.toReportError("start = a:(a:'a')");
    });

    it("doesn't report labels duplicate with labels of following elements", function() {
      expect(pass).not.toReportError("start = (a:'a') a:'a'");
    });
  });
});
