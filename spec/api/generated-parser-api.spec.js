describe("generated parser API", function() {
  describe("parse", function() {
    it("parses input", function() {
      var parser = PEG.buildParser('start = "a"');

      expect(parser.parse("a")).toBe("a");
    });

    it("throws an exception on syntax error", function() {
      var parser = PEG.buildParser('start = "a"');

      expect(function() { parser.parse("b"); }).toThrow();
    });

    describe("start rule", function() {
      var parser = PEG.buildParser([
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
        it("starts parsing from the specified rule", function() {
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

    it("accepts custom options", function() {
      var parser = PEG.buildParser('start = "a"');

      parser.parse("a", { foo: 42 });
    });
  });
});
