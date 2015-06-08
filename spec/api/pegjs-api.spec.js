/* global describe, expect, it, PEG, spyOn */

"use strict";

describe("PEG.js API", function() {
  describe("buildParser", function() {
    it("builds a parser", function() {
      var parser = PEG.buildParser('start = "a"');

      expect(typeof parser).toBe("object");
      expect(parser.parse("a")).toBe("a");
    });

    it("throws an exception on syntax error", function() {
      expect(function() { PEG.buildParser('start = @'); }).toThrow();
    });

    it("throws an exception on semantic error", function() {
      expect(function() { PEG.buildParser('start = missing'); }).toThrow();
    });

    describe("allowed start rules", function() {
      var grammar = [
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
            var parser = PEG.buildParser(grammar, { optimize: "speed" });

            expect(parser.parse("x", { startRule: "a" })).toBe("x");
            expect(
              function() { parser.parse("x", { startRule: "b" }); }
            ).toThrow();
            expect(
              function() { parser.parse("x", { startRule: "c" }); }
            ).toThrow();
          });
        });

        describe("when |allowedStartRules| is set", function() {
          it("generated parser can start only from specified rules", function() {
            var parser = PEG.buildParser(grammar, {
              optimize:          "speed",
              allowedStartRules: ["b", "c"]
            });

            expect(
              function() { parser.parse("x", { startRule: "a" }); }
            ).toThrow();
            expect(parser.parse("x", { startRule: "b" })).toBe("x");
            expect(parser.parse("x", { startRule: "c" })).toBe("x");
          });
        });
      });

      describe("when optimizing for code size", function() {
        describe("when |allowedStartRules| is not set", function() {
          it("generated parser can start only from the first rule", function() {
            var parser = PEG.buildParser(grammar, { optimize: "size" });

            expect(parser.parse("x", { startRule: "a" })).toBe("x");
            expect(
              function() { parser.parse("x", { startRule: "b" }); }
            ).toThrow();
            expect(
              function() { parser.parse("x", { startRule: "c" }); }
            ).toThrow();
          });
        });

        describe("when |allowedStartRules| is set", function() {
          it("generated parser can start only from specified rules", function() {
            var parser = PEG.buildParser(grammar, {
              optimize:          "size",
              allowedStartRules: ["b", "c"]
            });

            expect(
              function() { parser.parse("x", { startRule: "a" }); }
            ).toThrow();
            expect(parser.parse("x", { startRule: "b" })).toBe("x");
            expect(parser.parse("x", { startRule: "c" })).toBe("x");
          });
        });
      });
    });

    describe("intermediate results caching", function() {
      var grammar = [
            '{ var n = 0; }',
            'start = (a "b") / (a "c") { return n; }',
            'a     = "a" { n++; }'
          ].join("\n");

      describe("when |cache| is not set", function() {
        it("generated parser doesn't cache intermediate parse results", function() {
          var parser = PEG.buildParser(grammar);

          expect(parser.parse("ac")).toBe(2);
        });
      });

      describe("when |cache| is set to |false|", function() {
        it("generated parser doesn't cache intermediate parse results", function() {
          var parser = PEG.buildParser(grammar, { cache: false });

          expect(parser.parse("ac")).toBe(2);
        });
      });

      describe("when |cache| is set to |true|", function() {
        it("generated parser caches intermediate parse results", function() {
          var parser = PEG.buildParser(grammar, { cache: true });

          expect(parser.parse("ac")).toBe(1);
        });
      });
    });

    describe("tracing", function() {
      var grammar = 'start = "a"';

      describe("when |trace| is not set", function() {
        it("generated parser doesn't trace", function() {
          var parser = PEG.buildParser(grammar);

          spyOn(console, "log");

          parser.parse("a");

          expect(console.log).not.toHaveBeenCalled();
        });
      });

      describe("when |trace| is set to |false|", function() {
        it("generated parser doesn't trace", function() {
          var parser = PEG.buildParser(grammar, { trace: false });

          spyOn(console, "log");

          parser.parse("a");

          expect(console.log).not.toHaveBeenCalled();
        });
      });

      describe("when |trace| is set to |true|", function() {
        it("generated parser traces", function() {
          var parser = PEG.buildParser(grammar, { trace: true });

          spyOn(console, "log");

          parser.parse("a");

          expect(console.log).toHaveBeenCalledWith("1:1-1:1 rule.enter start");
          expect(console.log).toHaveBeenCalledWith("1:1-1:2 rule.match start");
        });
      });
    });

    /*
     * The |optimize| option isn't tested because there is no meaningful way to
     * write the specs without turning this into a performance test.
     */

    describe("output", function() {
      var grammar = 'start = "a"';

      describe("when |output| is not set", function() {
        it("returns generated parser object", function() {
          var parser = PEG.buildParser(grammar);

          expect(typeof parser).toBe("object");
          expect(parser.parse("a")).toBe("a");
        });
      });

      describe("when |output| is set to |\"parser\"|", function() {
        it("returns generated parser object", function() {
          var parser = PEG.buildParser(grammar, { output: "parser" });

          expect(typeof parser).toBe("object");
          expect(parser.parse("a")).toBe("a");
        });
      });

      describe("when |output| is set to |\"source\"|", function() {
        it("returns generated parser source code", function() {
          var source = PEG.buildParser(grammar, { output: "source" });

          expect(typeof source).toBe("string");
          expect(eval(source).parse("a")).toBe("a");
        });
      });
    });

    /* The |plugins| option is tested in plugin API specs. */

    it("accepts custom options", function() {
      PEG.buildParser('start = "a"', { foo: 42 });
    });
  });
});
