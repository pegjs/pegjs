/* global peg */

"use strict";

describe("compiler pass |reportDuplicateRules|", function() {
  var pass = peg.compiler.passes.check.reportDuplicateRules;

  it("reports duplicate rules", function() {
    expect(pass).toReportError([
      'start = "a"',
      'start = "b"'
    ].join('\n'), {
      message:  'Rule "start" is already defined.',
      location: {
        start: { offset: 12, line: 2, column:  1 },
        end:   { offset: 23, line: 2, column: 12 }
      }
    });
  });
});
