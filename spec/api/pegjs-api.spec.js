describe("PEG.js API", function() {
  beforeEach(function() {
    this.addMatchers({
      toEqualAST: function(ast) {
        function matchDetails(value, details) {
          function isArray(value) {
            return Object.prototype.toString.apply(value) === "[object Array]";
          }

          function isObject(value) {
            return value !== null && typeof value === "object";
          }

          var i, key;

          if (isArray(details)) {
            if (!isArray(value)) { return false; }

            if (value.length !== details.length) { return false; }
            for (i = 0; i < details.length; i++) {
              if (!matchDetails(value[i], details[i])) { return false; }
            }

            return true;
          } else if (isObject(details)) {
            if (!isObject(value)) { return false; }

            for (key in details) {
              if (details.hasOwnProperty(key)) {
                if (!(key in value)) { return false; }

                if (!matchDetails(value[key], details[key])) { return false; }
              }
            }

            return true;
          } else {
            return value === details;
          }
        }

        this.message = function() {
          return "Expected AST "
               + jasmine.pp(this.actual) + " "
               + (this.isNot ? "not " : "")
               + "to match " + jasmine.pp(ast) + ", "
               + "but it " + (this.isNot ? "did" : "didn't") + ".";
        };

        return matchDetails(this.actual, ast);
      },

      toHasKeys: function(keys) {
        for (var k in this.actual) {
          if (keys.indexOf(k) < 0) {
            return this.isNot;
          }
        }
        return !this.isNot;
      }
    });
  });

  describe("buildParser", function() {
    it("builds parsers", function() {
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
          it("the generated parser can start only from the first rule", function() {
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
          it("the generated parser can start only from specified rules", function() {
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
          it("the generated parser can start only from the first rule", function() {
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
          it("the generated parser can start only from specified rules", function() {
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
        it("the generated parser doesn't cache intermediate parse results", function() {
          var parser = PEG.buildParser(grammar);

          expect(parser.parse("ac")).toBe(2);
        });
      });

      describe("when |cache| is set to |false|", function() {
        it("the generated parser doesn't cache intermediate parse results", function() {
          var parser = PEG.buildParser(grammar, { cache: false });

          expect(parser.parse("ac")).toBe(2);
        });
      });

      describe("when |cache| is set to |true|", function() {
        it("the generated parser caches intermediate parse results", function() {
          var parser = PEG.buildParser(grammar, { cache: true });

          expect(parser.parse("ac")).toBe(1);
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
        it("defaults to \"parser\"", function() {
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

      describe("when |output| is set to |\"ast\"|", function() {
        it("returns generated parser AST", function() {
          var ast = PEG.buildParser(grammar, { output: "ast" });

          expect(typeof ast).toBe("object");
          expect(ast).toEqualAST(PEG.parser.parse(grammar));
        });
      });

      describe("when |output| is set to array of outputs", function() {
        it('returns object with keys of array', function() {
          var result = PEG.buildParser(grammar, { output: ["parser", "source", "ast"] });

          expect(result).toHasKeys(['parser', 'source', 'ast']);

          expect(typeof(result.parser)).toBe("object");
          expect(result.parser.parse("a")).toBe("a");

          expect(typeof(result.source)).toBe("string");
          expect(eval(result.source).parse("a")).toBe("a");

          expect(typeof(result.ast)).toBe("object");
          expect(result.ast).toEqualAST(PEG.parser.parse(grammar));
        });
      });
    });

    /* The |plugins| option is tested in plugin API specs. */

    it("accepts custom options", function() {
      PEG.buildParser('start = "a"', { foo: 42 });
    });
  });
});
