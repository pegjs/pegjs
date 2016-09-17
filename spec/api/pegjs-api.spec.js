"use strict";

let peg = require("../../lib/peg");

describe("PEG.js API", function() {
  describe("generate", function() {
    it("generates a parser", function() {
      let parser = peg.generate('start = "a"');

      expect(typeof parser).toBe("object");
      expect(parser.parse("a")).toBe("a");
    });

    it("throws an exception on syntax error", function() {
      expect(() => { peg.generate('start = @'); }).toThrow();
    });

    it("throws an exception on semantic error", function() {
      expect(() => { peg.generate('start = undefined'); }).toThrow();
    });

    describe("allowed start rules", function() {
      let grammar = [
            'a = "x"',
            'b = "x"',
            'c = "x"'
          ].join("\n");

      /*
       * The |allowedStartRules| option is implemented separately for each
       * optimization mode, so we need to test it in both.
       */

      describe("when optimizing for parsing speed", function() {
        describe("when |allowedStartRules| is not set", function() {
          it("generated parser can start only from the first rule", function() {
            let parser = peg.generate(grammar, { optimize: "speed" });

            expect(parser.parse("x", { startRule: "a" })).toBe("x");
            expect(() => { parser.parse("x", { startRule: "b" }); }).toThrow();
            expect(() => { parser.parse("x", { startRule: "c" }); }).toThrow();
          });
        });

        describe("when |allowedStartRules| is set", function() {
          it("generated parser can start only from specified rules", function() {
            let parser = peg.generate(grammar, {
              optimize:          "speed",
              allowedStartRules: ["b", "c"]
            });

            expect(() => { parser.parse("x", { startRule: "a" }); }).toThrow();
            expect(parser.parse("x", { startRule: "b" })).toBe("x");
            expect(parser.parse("x", { startRule: "c" })).toBe("x");
          });
        });
      });

      describe("when optimizing for code size", function() {
        describe("when |allowedStartRules| is not set", function() {
          it("generated parser can start only from the first rule", function() {
            let parser = peg.generate(grammar, { optimize: "size" });

            expect(parser.parse("x", { startRule: "a" })).toBe("x");
            expect(() => { parser.parse("x", { startRule: "b" }); }).toThrow();
            expect(() => { parser.parse("x", { startRule: "c" }); }).toThrow();
          });
        });

        describe("when |allowedStartRules| is set", function() {
          it("generated parser can start only from specified rules", function() {
            let parser = peg.generate(grammar, {
              optimize:          "size",
              allowedStartRules: ["b", "c"]
            });

            expect(() => { parser.parse("x", { startRule: "a" }); }).toThrow();
            expect(parser.parse("x", { startRule: "b" })).toBe("x");
            expect(parser.parse("x", { startRule: "c" })).toBe("x");
          });
        });
      });
    });

    describe("intermediate results caching", function() {
      let grammar = [
            '{ var n = 0; }',
            'start = (a "b") / (a "c") { return n; }',
            'a     = "a" { n++; }'
          ].join("\n");

      describe("when |cache| is not set", function() {
        it("generated parser doesn't cache intermediate parse results", function() {
          let parser = peg.generate(grammar);

          expect(parser.parse("ac")).toBe(2);
        });
      });

      describe("when |cache| is set to |false|", function() {
        it("generated parser doesn't cache intermediate parse results", function() {
          let parser = peg.generate(grammar, { cache: false });

          expect(parser.parse("ac")).toBe(2);
        });
      });

      describe("when |cache| is set to |true|", function() {
        it("generated parser caches intermediate parse results", function() {
          let parser = peg.generate(grammar, { cache: true });

          expect(parser.parse("ac")).toBe(1);
        });
      });
    });

    describe("tracing", function() {
      let grammar = 'start = "a"';

      describe("when |trace| is not set", function() {
        it("generated parser doesn't trace", function() {
          let parser = peg.generate(grammar);
          let tracer = jasmine.createSpyObj("tracer", ["trace"]);

          parser.parse("a", { tracer: tracer });

          expect(tracer.trace).not.toHaveBeenCalled();
        });
      });

      describe("when |trace| is set to |false|", function() {
        it("generated parser doesn't trace", function() {
          let parser = peg.generate(grammar, { trace: false });
          let tracer = jasmine.createSpyObj("tracer", ["trace"]);

          parser.parse("a", { tracer: tracer });

          expect(tracer.trace).not.toHaveBeenCalled();
        });
      });

      describe("when |trace| is set to |true|", function() {
        it("generated parser traces", function() {
          let parser = peg.generate(grammar, { trace: true });
          let tracer = jasmine.createSpyObj("tracer", ["trace"]);

          parser.parse("a", { tracer: tracer });

          expect(tracer.trace).toHaveBeenCalled();
        });
      });
    });

    /*
     * The |optimize| option isn't tested because there is no meaningful way to
     * write the specs without turning this into a performance test.
     */

    describe("output", function() {
      let grammar = 'start = "a"';

      describe("when |output| is not set", function() {
        it("returns generated parser object", function() {
          let parser = peg.generate(grammar);

          expect(typeof parser).toBe("object");
          expect(parser.parse("a")).toBe("a");
        });
      });

      describe("when |output| is set to |\"parser\"|", function() {
        it("returns generated parser object", function() {
          let parser = peg.generate(grammar, { output: "parser" });

          expect(typeof parser).toBe("object");
          expect(parser.parse("a")).toBe("a");
        });
      });

      describe("when |output| is set to |\"source\"|", function() {
        it("returns generated parser source code", function() {
          let source = peg.generate(grammar, { output: "source" });

          expect(typeof source).toBe("string");
          expect(eval(source).parse("a")).toBe("a");
        });
      });
    });

    /*
     * The |format|, |exportVars|, and |dependencies| options are not tested
     * becasue there is no meaningful way to thest their effects without turning
     * this into an integration test.
     */

    /* The |plugins| option is tested in plugin API specs. */

    it("accepts custom options", function() {
      peg.generate('start = "a"', { foo: 42 });
    });
  });
});
