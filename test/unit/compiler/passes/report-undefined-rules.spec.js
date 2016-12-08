"use strict";

let chai = require("chai");
let helpers = require("./helpers");
let peg = require("../../../../lib/peg");

chai.use(helpers);

let expect = chai.expect;

describe("compiler pass |reportUndefinedRules|", function() {
  let pass = peg.compiler.passes.check.reportUndefinedRules;

  it("reports undefined rules", function() {
    expect(pass).to.reportError("start = undefined", {
      message: "Rule \"undefined\" is not defined.",
      location: {
        start: { offset: 8, line: 1, column: 9 },
        end: { offset: 17, line: 1, column: 18 }
      }
    });
  });
});
