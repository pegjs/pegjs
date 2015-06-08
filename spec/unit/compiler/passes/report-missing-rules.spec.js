/* global describe, expect, it, PEG */

"use strict";

describe("compiler pass |reportMissingRules|", function() {
  var pass = PEG.compiler.passes.check.reportMissingRules;

  it("reports missing rules", function() {
    expect(pass).toReportError('start = missing', {
      message:  'Referenced rule "missing" does not exist.',
      location: {
        start: { offset:  8, line: 1, column:  9 },
        end:   { offset: 15, line: 1, column: 16 }
      }
    });
  });
});
