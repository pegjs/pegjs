/* global peg */

"use strict";

describe("compiler pass |reportMissingRules|", function() {
  var pass = peg.compiler.passes.check.reportMissingRules;

  it("reports missing rules", function() {
    expect(pass).toReportError('start = missing', {
      message:  'Rule "missing" is not defined.',
      location: {
        start: { offset:  8, line: 1, column:  9 },
        end:   { offset: 15, line: 1, column: 16 }
      }
    });
  });
});
