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
