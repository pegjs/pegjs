/* eslint no-console: 0 */
/* global console */

"use strict";

let peg = require("../../lib/peg");

describe("generated parser API", function() {
  describe("parse", function() {
    it("parses input", function() {
      let parser = peg.generate('start = "a"');

      expect(parser.parse("a")).toBe("a");
    });

    it("throws an exception on syntax error", function() {
      let parser = peg.generate('start = "a"');

      expect(function() { parser.parse("b"); }).toThrow();
    });

    describe("start rule", function() {
      let parser = peg.generate([
            'a = "x" { return "a"; }',
            'b = "x" { return "b"; }',
            'c = "x" { return "c"; }'
          ].join("\n"), { allowedStartRules: ["b", "c"] });

      describe("when |startRule| is not set", function() {
        it("starts parsing from the first allowed rule", function() {
          expect(parser.parse("x")).toBe("b");
        });
      });

      describe("when |startRule| is set to an allowed rule", function() {
        it("starts parsing from specified rule", function() {
          expect(parser.parse("x", { startRule: "b" })).toBe("b");
          expect(parser.parse("x", { startRule: "c" })).toBe("c");
        });
      });

      describe("when |startRule| is set to a disallowed start rule", function() {
        it("throws an exception", function() {
          expect(
            function() { parser.parse("x", { startRule: "a" }); }
          ).toThrow();
        });
      });
    });

    describe("tracing", function() {
      let parser = peg.generate([
            'start = a / b',
            'a = "a"',
            'b = "b"'
          ].join("\n"), { trace: true });

      describe("default tracer", function() {
        it("traces using console.log (if console is defined)", function() {
          if (typeof console === "object") {
            spyOn(console, "log");
          }

          parser.parse("b");

          if (typeof console === "object") {
            expect(console.log).toHaveBeenCalledWith("1:1-1:1 rule.enter start");
            expect(console.log).toHaveBeenCalledWith("1:1-1:1 rule.enter   a");
            expect(console.log).toHaveBeenCalledWith("1:1-1:1 rule.fail    a");
            expect(console.log).toHaveBeenCalledWith("1:1-1:1 rule.enter   b");
            expect(console.log).toHaveBeenCalledWith("1:1-1:2 rule.match   b");
            expect(console.log).toHaveBeenCalledWith("1:1-1:2 rule.match start");
          }
        });
      });

      describe("custom tracers", function() {
        describe("trace", function() {
          it("receives tracing events", function() {
            let tracer = jasmine.createSpyObj("tracer", ["trace"]);

            parser.parse("b", { tracer: tracer });

            expect(tracer.trace).toHaveBeenCalledWith({
              type:     "rule.enter",
              rule:     "start",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end:   { offset: 0, line: 1, column: 1 }
              }
            });
            expect(tracer.trace).toHaveBeenCalledWith({
              type:     "rule.enter",
              rule:     "a",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end:   { offset: 0, line: 1, column: 1 }
              }
            });
            expect(tracer.trace).toHaveBeenCalledWith({
              type:     "rule.fail",
              rule:     "a",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end:   { offset: 0, line: 1, column: 1 }
              }
            });
            expect(tracer.trace).toHaveBeenCalledWith({
              type:     "rule.enter",
              rule:     "b",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end:   { offset: 0, line: 1, column: 1 }
              }
            });
            expect(tracer.trace).toHaveBeenCalledWith({
              type:     "rule.match",
              rule:     "b",
              result:   "b",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end:   { offset: 1, line: 1, column: 2 }
              }
            });
            expect(tracer.trace).toHaveBeenCalledWith({
              type:     "rule.match",
              rule:     "start",
              result:   "b",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end:   { offset: 1, line: 1, column: 2 }
              }
            });
          });
        });
      });
    });

    it("accepts custom options", function() {
      let parser = peg.generate('start = "a"');

      parser.parse("a", { foo: 42 });
    });
  });
});
