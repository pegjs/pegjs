describe("generated parser", function() {
  function vary(names, block) {
    var values = {
          trackLineAndColumn: [false, true],
          cache:              [false, true]
        };

    function varyStep(names, options) {
      var clonedOptions = {}, key, name, i;

      if (names.length === 0) {
        /*
         * We have to clone the options so that the block can save them safely
         * (e.g. by capturing in a closure) without the risk that they will be
         * changed later.
         */
        for (key in options) {
          clonedOptions[key] = options[key];
        }

        describe(
          "with options " + jasmine.pp(clonedOptions),
          function() { block(clonedOptions); }
        );
      } else {
        name = names[0];
        for (i = 0; i < values[name].length; i++) {
          options[name] = values[name][i];
          varyStep(names.slice(1), options);
        }
      }
    }

    varyStep(names, {});
  }

  function varyAll(block) {
    vary(["cache", "trackLineAndColumn"], block);
  }

  beforeEach(function() {
    this.addMatchers({
      toParse: function(input, expected) {
        var result;

        try {
          result = this.actual.parse(input);

          this.message = function() {
            return "Expected " + jasmine.pp(input) + " "
                 + (this.isNot ? "not " : "")
                 + "to parse as " + jasmine.pp(expected) + ", "
                 + "but it parsed as " + jasmine.pp(result) + ".";
          };

          return this.env.equals_(result, expected);
        } catch (e) {
          this.message = function() {
            return "Expected " + jasmine.pp(input) + " "
                 + "to parse as " + jasmine.pp(expected) + ", "
                 + "but it failed to parse with message "
                 + jasmine.pp(e.message) + ".";
          };

          return false;
        }
      },

      toFailToParse: function(input) {
        var result;

        try {
          result = this.actual.parse(input);

          this.message = function() {
            return "Expected " + jasmine.pp(input) + " to fail to parse, "
                 + "but it parsed as " + jasmine.pp(result) + ".";
          };

          return false;
        } catch (e) {
          this.message = function() {
            return "Expected " + jasmine.pp(input) + " to parse, "
                 + "but it failed with message "
                 + jasmine.pp(e.message) + ".";
          };

          return true;
        }
      }
    });
  });

  describe("labeled matching", function() {
    varyAll(function(options) {
      it("delegates to the expression", function() {
        var parser = PEG.buildParser('start = a:"a"', options);

        expect(parser).toParse("a", "a");
        expect(parser).toFailToParse("b");
      });
    });
  });

  describe("simple and matching", function() {
    varyAll(function(options) {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = &"a" "a"', options);

        expect(parser).toParse("a", ["", "a"]);
        expect(parser).toFailToParse("b");
      });

      it("does not advance position on success", function() {
        var parser = PEG.buildParser('start = &"a" "a"', options);

        expect(parser).toParse("a", ["", "a"]);
      });
    });
  });

  describe("simple not matching", function() {
    varyAll(function(options) {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = !"a" "b"', options);

        expect(parser).toParse("b", ["", "b"]);
        expect(parser).toFailToParse("a");
      });

      it("does not advance position on failure", function() {
        var parser = PEG.buildParser('start = !"a" / "a"', options);

        expect(parser).toParse("a", "a");
      });
    });
  });

  describe("semantic and code", function() {
    varyAll(function(options) {
      it("causes successful match by returning |true|", function() {
        var parser = PEG.buildParser('start = &{ return true; }', options);

        expect(parser).toParse("", "");
      });

      it("causes match failure by returning |false|", function() {
        var parser = PEG.buildParser('start = &{ return false; }', options);

        expect(parser).toFailToParse("");
      });

      it("can use label variables", function() {
        var parser = PEG.buildParser(
              'start = a:"a" &{ return a === "a"; }',
              options
            );

        expect(parser).toParse("a", ["a", ""]);
      });

      it("can use the |offset| variable to get the current parse position", function() {
        var parser = PEG.buildParser(
              'start = "a" &{ return offset === 1; }',
              options
            );

        expect(parser).toParse("a", ["a", ""]);
      });

      if (options.trackLineAndColumn) {
        it("can use the |line| and |column| variables to get the current line and column", function() {
          var parser = PEG.buildParser([
                '{ var result; }',
                'start  = line (nl+ line)* { return result; }',
                'line   = thing (" "+ thing)*',
                'thing  = digit / mark',
                'digit  = [0-9]',
                'mark   = &{ result = [line, column]; return true; } "x"',
                'nl     = ("\\r" / "\\n" / "\\u2028" / "\\u2029")'
              ].join("\n"), options);

          expect(parser).toParse("1\n2\n\n3\n\n\n4 5 x", [7, 5]);

          /* Non-Unix newlines */
          expect(parser).toParse("1\rx",   [2, 1]); // Old Mac
          expect(parser).toParse("1\r\nx", [2, 1]); // Windows
          expect(parser).toParse("1\n\rx", [3, 1]); // mismatched

          /* Strange newlines */
          expect(parser).toParse("1\u2028x", [2, 1]); // line separator
          expect(parser).toParse("1\u2029x", [2, 1]); // paragraph separator
        });
      }
    });
  });

  describe("semantic not code", function() {
    varyAll(function(options) {
      it("causes successful match by returning |false|", function() {
        var parser = PEG.buildParser('start = !{ return false; }', options);

        expect(parser).toParse("", "");
      });

      it("causes match failure by returning |true|", function() {
        var parser = PEG.buildParser('start = !{ return true; }', options);

        expect(parser).toFailToParse();
      });

      it("can use label variables", function() {
        var parser = PEG.buildParser(
              'start = a:"a" !{ return a !== "a"; }',
              options
            );

        expect(parser).toParse("a", ["a", ""]);
      });

      it("can use the |offset| variable to get the current parse position", function() {
        var parser = PEG.buildParser(
              'start = "a" !{ return offset !== 1; }',
              options
            );

        expect(parser).toParse("a", ["a", ""]);
      });

      if (options.trackLineAndColumn) {
        it("can use the |line| and |column| variables to get the current line and column", function() {
          var parser = PEG.buildParser([
                '{ var result; }',
                'start  = line (nl+ line)* { return result; }',
                'line   = thing (" "+ thing)*',
                'thing  = digit / mark',
                'digit  = [0-9]',
                'mark   = !{ result = [line, column]; return false; } "x"',
                'nl     = ("\\r" / "\\n" / "\\u2028" / "\\u2029")'
              ].join("\n"), options);

          expect(parser).toParse("1\n2\n\n3\n\n\n4 5 x", [7, 5]);

          /* Non-Unix newlines */
          expect(parser).toParse("1\rx",   [2, 1]); // Old Mac
          expect(parser).toParse("1\r\nx", [2, 1]); // Windows
          expect(parser).toParse("1\n\rx", [3, 1]); // mismatched

          /* Strange newlines */
          expect(parser).toParse("1\u2028x", [2, 1]); // line separator
          expect(parser).toParse("1\u2029x", [2, 1]); // paragraph separator
        });
      }
    });
  });

  describe("optional matching", function() {
    varyAll(function(options) {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = "a"?', options);

        expect(parser).toParse("",  "");
        expect(parser).toParse("a", "a");
      });
    });
  });

  describe("zero or more matching", function() {
    varyAll(function(options) {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = "a"*', options);

        expect(parser).toParse("",    []);
        expect(parser).toParse("a",   ["a"]);
        expect(parser).toParse("aaa", ["a", "a", "a"]);
      });
    });
  });

  describe("one or more matching", function() {
    varyAll(function(options) {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = "a"+', options);

        expect(parser).toFailToParse("");
        expect(parser).toParse("a",   ["a"]);
        expect(parser).toParse("aaa", ["a", "a", "a"]);
      });
    });
  });

  describe("action code", function() {
    varyAll(function(options) {
      it("tranforms the expression result by returnung a non-|null| value", function() {
        var parser = PEG.buildParser('start = "a" { return 42; }', options);

        expect(parser).toParse("a", 42);
      });

      it("causes match failure by returning |null|", function() {
        var parser = PEG.buildParser('start = "a" { return null; }', options);

        expect(parser).toFailToParse("a");
      });

      it("is not called when the expression does not match", function() {
        var parser = PEG.buildParser(
              'start = "a" { throw "Boom!"; } / "b"',
              options
            );

        expect(parser).toParse("b", "b");
      });

      it("can use label variables", function() {
        var parser = PEG.buildParser('start = a:"a" { return a; }', options);

        expect(parser).toParse("a", "a");
      });

      it("can use the |offset| variable to get the current parse position", function() {
        var parser = PEG.buildParser(
              'start = "a" ("b" { return offset; })',
              options
            );

        expect(parser).toParse("ab", ["a", 1]);
      });

      if (options.trackLineAndColumn) {
        it("can use the |line| and |column| variables to get the current line and column", function() {
          var parser = PEG.buildParser([
                '{ var result; }',
                'start  = line (nl+ line)* { return result; }',
                'line   = thing (" "+ thing)*',
                'thing  = digit / mark',
                'digit  = [0-9]',
                'mark   = "x" { result = [line, column]; }',
                'nl     = ("\\r" / "\\n" / "\\u2028" / "\\u2029")'
              ].join("\n"), options);

          expect(parser).toParse("1\n2\n\n3\n\n\n4 5 x", [7, 5]);

          /* Non-Unix newlines */
          expect(parser).toParse("1\rx",   [2, 1]); // Old Mac
          expect(parser).toParse("1\r\nx", [2, 1]); // Windows
          expect(parser).toParse("1\n\rx", [3, 1]); // mismatched

          /* Strange newlines */
          expect(parser).toParse("1\u2028x", [2, 1]); // line separator
          expect(parser).toParse("1\u2029x", [2, 1]); // paragraph separator
        });
      }

      it("does not advance position when the expression matches but the action returns |null|", function() {
        var parser = PEG.buildParser(
              'start = "a" { return null; } / "a"',
              options
            );

        expect(parser).toParse("a", "a");
      });
    });
  });

  describe("rule reference matching", function() {
    varyAll(function(options) {
      it("follows rule references", function() {
        var parser = PEG.buildParser([
              'start   = static / dynamic',
              'static  = "C" / "C++" / "Java" / "C#"',
              'dynamic = "Ruby" / "Python" / "JavaScript"'
            ].join("\n"), options);

        expect(parser).toParse("Java",   "Java");
        expect(parser).toParse("Python", "Python");
      });
    });
  });

  describe("literal matching", function() {
    varyAll(function(options) {
      it("matches empty literal correctly", function() {
        var parser = PEG.buildParser('start = ""', options);

        expect(parser).toParse("", "");
      });

      it("matches one-character literal correctly", function() {
        var parser = PEG.buildParser('start = "a"', options);

        expect(parser).toParse("a", "a");
        expect(parser).toFailToParse("b");
      });

      it("matches multiple-character literal correctly", function() {
        var parser = PEG.buildParser('start = "abcd"', options);

        expect(parser).toParse("abcd", "abcd");
        expect(parser).toFailToParse("ebcd");
        expect(parser).toFailToParse("afcd");
        expect(parser).toFailToParse("abgd");
        expect(parser).toFailToParse("abch");
      });

      it("is case sensitive without the \"i\" flag", function() {
        var parser = PEG.buildParser('start = "a"', options);

        expect(parser).toParse("a", "a");
        expect(parser).toFailToParse("A");
      });

      it("is case insensitive with the \"i\" flag", function() {
        var parser = PEG.buildParser('start = "a"i', options);

        expect(parser).toParse("a", "a");
        expect(parser).toParse("A", "A");
      });

      it("advances position on success", function() {
        var parser = PEG.buildParser('start = "a" .', options);

        expect(parser).toParse("ab", ["a", "b"]);
      });
    });
  });

  describe("any matching", function() {
    varyAll(function(options) {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = .', options);

        expect(parser).toParse("a", "a");
      });

      it("advances position on success", function() {
        var parser = PEG.buildParser('start = . .', options);

        expect(parser).toParse("ab", ["a", "b"]);
      });
    });
  });

  describe("class matching", function() {
    varyAll(function(options) {
      it("matches empty class correctly", function() {
        var parser = PEG.buildParser('start = []', options);

        expect(parser).toFailToParse("a");
      });

      it("matches class with a character list correctly", function() {
        var parser = PEG.buildParser('start = [abc]', options);

        expect(parser).toParse("a", "a");
        expect(parser).toParse("b", "b");
        expect(parser).toParse("c", "c");
        expect(parser).toFailToParse("d");
      });

      it("matches class with a range correctly", function() {
        var parser = PEG.buildParser('start = [a-c]', options);

        expect(parser).toParse("a", "a");
        expect(parser).toParse("b", "b");
        expect(parser).toParse("c", "c");
        expect(parser).toFailToParse("d");
      });

      it("matches inverted class correctly", function() {
        var parser = PEG.buildParser('start = [^a]', options);

        expect(parser).toFailToParse("a");
        expect(parser).toParse("b", "b");
      });

      it("is case sensitive without the \"i\" flag", function() {
        var parser = PEG.buildParser('start = [a]', options);

        expect(parser).toParse("a", "a");
        expect(parser).toFailToParse("A");
      });

      it("is case insensitive with the \"i\" flag", function() {
        var parser = PEG.buildParser('start = [a]i', options);

        expect(parser).toParse("a", "a");
        expect(parser).toParse("A", "A");
      });

      it("advances position on success", function() {
        var parser = PEG.buildParser('start = [a] .', options);

        expect(parser).toParse("ab", ["a", "b"]);
      });
    });
  });
});
