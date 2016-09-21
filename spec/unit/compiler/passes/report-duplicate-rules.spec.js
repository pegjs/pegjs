"use strict";

let peg = require("../../../../lib/peg");

describe("compiler pass |reportDuplicateRules|", function() {
  let pass = peg.compiler.passes.check.reportDuplicateRules;

  it("reports duplicate rules", function() {
    expect(pass).toReportError([
      "start = 'a'",
      "start = 'b'"
    ].join("\n"), {
      message:  "Rule \"start\" is already defined at line 1, column 1.",
      location: {
        start: { offset: 12, line: 2, column:  1 },
        end:   { offset: 23, line: 2, column: 12 }
      }
    });
  });
});
