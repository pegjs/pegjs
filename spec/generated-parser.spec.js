describe("generated parser", function() {
  function vary(names, block) {
    var values = {
          cache:    [false, true],
          optimize: ["speed", "size"]
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
          if (options.hasOwnProperty(key)) {
            clonedOptions[key] = options[key];
          }
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
    vary(["cache", "optimize"], block);
  }

  beforeEach(function() {
    this.addMatchers({
      toParse: function(input) {
        var options  = arguments.length > 2 ? arguments[1] : {},
            expected = arguments[arguments.length - 1],
            result;

        try {
          result = this.actual.parse(input, options);

          this.message = function() {
            return "Expected " + jasmine.pp(input) + " "
                 + "with options " + jasmine.pp(options) + " "
                 + (this.isNot ? "not " : "")
                 + "to parse as " + jasmine.pp(expected) + ", "
                 + "but it parsed as " + jasmine.pp(result) + ".";
          };

          return this.env.equals_(result, expected);
        } catch (e) {
          this.message = function() {
            return "Expected " + jasmine.pp(input) + " "
                 + "with options " + jasmine.pp(options) + " "
                 + "to parse as " + jasmine.pp(expected) + ", "
                 + "but it failed to parse with message "
                 + jasmine.pp(e.message) + ".";
          };

          return false;
        }
      },

      toFailToParse: function(input) {
        var options = arguments.length > 2 ? arguments[1] : {},
            details = arguments.length > 1
                        ? arguments[arguments.length - 1]
                        : undefined;

        /*
         * Extracted into a function just to silence JSHint complaining about
         * creating functions in a loop.
         */
        function buildKeyMessage(key, value) {
          return function() {
            return "Expected " + jasmine.pp(input) + " "
                 + "with options " + jasmine.pp(options) + " "
                 + "to fail to parse"
                 + (details ? " with details " + jasmine.pp(details) : "") + ", "
                 + "but " + jasmine.pp(key) + " "
                 + "is " + jasmine.pp(value) + ".";
          };
        }

        var result;

        try {
          result = this.actual.parse(input, options);

          this.message = function() {
            return "Expected " + jasmine.pp(input) + " "
                 + "with options " + jasmine.pp(options) + " "
                 + "to fail to parse"
                 + (details ? " with details " + jasmine.pp(details) : "") + ", "
                 + "but it parsed as " + jasmine.pp(result) + ".";
          };

          return false;
        } catch (e) {
          /*
           * Should be at the top level but then JSHint complains about bad for
           * in variable.
           */
          var key;

          if (this.isNot) {
            this.message = function() {
              return "Expected " + jasmine.pp(input)
                   + "with options " + jasmine.pp(options) + " "
                   + "to parse, "
                   + "but it failed with message "
                   + jasmine.pp(e.message) + ".";
            };
          } else {
            if (details) {
              for (key in details) {
                if (details.hasOwnProperty(key)) {
                  if (!this.env.equals_(e[key], details[key])) {
                    this.message = buildKeyMessage(key, e[key]);

                    return false;
                  }
                }
              }
            }
          }

          return true;
        }
      }
    });
  });

  describe("parse", function() {
    var parser = PEG.buildParser([
          'a = "x" { return "a"; }',
          'b = "x" { return "b"; }',
          'c = "x" { return "c"; }'
        ].join("\n"), { allowedStartRules: ["b", "c"] });

    describe("start rule", function() {
      describe("without the |startRule| option", function() {
        it("uses the first allowed rule", function() {
          expect(parser).toParse("x", "b");
        });
      });

      describe("when the |startRule| option specifies allowed rule", function() {
        it("uses the specified rule", function() {
          expect(parser).toParse("x", { startRule: "b" }, "b");
          expect(parser).toParse("x", { startRule: "c" }, "c");
        });
      });

      describe("when the |startRule| option specifies disallowed rule", function() {
        it("throws exception", function() {
          expect(parser).toFailToParse("x", { startRule: "a" }, {
            message: "Can't start parsing from rule \"a\"."
          });
        });
      });
    });
  });

  describe("parse", function() {
    var parser = PEG.buildParser([
          'a = "ab" { return "ab"; }',
          '  / "b" { return "b"; }'
        ].join("\n"));

    describe("start offset", function() {
      describe("without the |startOffset| option", function() {
        it("starts at the beginning", function() {
          expect(parser).toParse("ab", "ab");
        });
      });

      describe("when the |startOffset| option specifies a position", function() {
        it("starts at the offset", function() {
          expect(parser).toParse("ab", { startOffset: 1 }, "b");
        });
      });
    });
  });

  varyAll(function(options) {
    describe("initializer code", function() {
      it("runs before the parsing begins", function() {
        var parser = PEG.buildParser([
              '{ var result = 42; }',
              'start = "a" { return result; }'
            ].join("\n"), options);

        expect(parser).toParse("a", 42);
      });

      it("can use the |text| function", function() {
        var parser = PEG.buildParser([
              '{ var result = text(); }',
              'start = "a" { return result; }'
            ].join("\n"), options);

        expect(parser).toParse("a", "");
      });

      it("can use the |offset| function to get the current parse position", function() {
        var parser = PEG.buildParser([
              '{ var result = offset(); }',
              'start = "a" { return result; }'
            ].join("\n"), options);

        expect(parser).toParse("a", 0);
      });

      it("can use the |line| and |column| functions to get the current line and column", function() {
        var parser = PEG.buildParser([
              '{ var result = [line(), column()]; }',
              'start = "a" { return result; }'
            ].join("\n"), options);

        expect(parser).toParse("a", [1, 1]);
      });

      it("can use options passed to the parser", function() {
        var parser = PEG.buildParser([
              '{ var result = options; }',
              'start = "a" { return result; }'
            ].join("\n"), options);

        expect(parser).toParse("a", { a: 42 }, { a: 42 });
      });
    });

    describe("rule matching", function() {
      var grammar = [
            '{ var n = 0; }',
            'start = (a "b") / (a "c") { return n; }',
            'a     = "a" { n++; }'
          ].join("\n");

      if (options.cache) {
        it("caches rule match results", function() {
          var parser = PEG.buildParser(grammar, options);

          expect(parser).toParse("ac", 1);
        });
      } else {
        it("does not cache rule match results", function() {
          var parser = PEG.buildParser(grammar, options);

          expect(parser).toParse("ac", 2);
        });
      }
    });

    describe("named matching", function() {
      var parser = PEG.buildParser('start "start" = "a"');

      it("delegates to the expression", function() {
        expect(parser).toParse("a", "a");
        expect(parser).toFailToParse("b");
      });

      it("overwrites expected string on failure", function() {
        expect(parser).toFailToParse("b", {
          expected: [{ type: "other", description: "start" }]
        });
      });
    });

    describe("choice matching", function() {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = "a" / "b" / "c"', options);

        expect(parser).toParse("a", "a");
        expect(parser).toParse("b", "b");
        expect(parser).toParse("c", "c");
        expect(parser).toFailToParse("d");
      });
    });

    describe("action code", function() {
      it("tranforms the expression result by returnung a value", function() {
        var parser = PEG.buildParser('start = "a" { return 42; }', options);

        expect(parser).toParse("a", 42);
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

      it("can use the |text| function to get the text matched by the expression", function() {
        var parser = PEG.buildParser(
              'start = "a" "b" "c" { return text(); }',
              options
            );

        expect(parser).toParse("abc", "abc");
      });

      it("can use the |offset| function to get the current parse position", function() {
        var parser = PEG.buildParser(
              'start = "a" ("b" { return offset(); })',
              options
            );

        expect(parser).toParse("ab", ["a", 1]);
      });

      it("can use the |line| and |column| functions to get the current line and column", function() {
        var parser = PEG.buildParser([
              '{ var result; }',
              'start  = line (nl+ line)* { return result; }',
              'line   = thing (" "+ thing)*',
              'thing  = digit / mark',
              'digit  = [0-9]',
              'mark   = "x" { result = [line(), column()]; }',
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

      it("can use variables defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ var v = 42 }',
              'start = "a" { return v; }'
            ].join("\n"), options);

        expect(parser).toParse("a", 42);
      });

      it("can use the |expected| function to trigger an error", function() {
        var parser = PEG.buildParser(
              'start = "a" { expected("a"); }',
              options
            );

        expect(parser).toFailToParse("a", {
          message:  'Expected a but "a" found.',
          expected: [{ type: "other", description: "a" }],
          found:    "a",
          offset:   0,
          line:     1,
          column:   1
        });
      });

      it("can use the |error| function to trigger an error", function() {
        var parser = PEG.buildParser(
              'start = "a" { error("a"); }',
              options
            );

        expect(parser).toFailToParse("a", {
          message:  "a",
          expected: null,
          found:    "a",
          offset:   0,
          line:     1,
          column:   1
        });
      });

      it("can use functions defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ function f() { return 42; } }',
              'start = "a" { return f(); }'
            ].join("\n"), options);

        expect(parser).toParse("a", 42);
      });

      it("can use options passed to the parser", function() {
        var parser = PEG.buildParser(
              'start = "a" { return options; }',
              options
            );

        expect(parser).toParse("a", { a: 42 }, { a: 42 });
      });
    });

    describe("sequence matching", function() {
      it("matches empty sequence correctly", function() {
        var parser = PEG.buildParser('start = ', options);

        expect(parser).toParse("", []);
      });

      it("matches non-empty sequence correctly", function() {
        var parser = PEG.buildParser('start = "a" "b" "c"', options);

        expect(parser).toParse("abc", ["a", "b", "c"]);
      });

      it("does not advance position on failure", function() {
        var parser = PEG.buildParser('start = "a" "b" / "a"', options);

        expect(parser).toParse("a", "a");
      });
    });

    describe("labeled matching", function() {
      it("delegates to the expression", function() {
        var parser = PEG.buildParser('start = a:"a"', options);

        expect(parser).toParse("a", "a");
        expect(parser).toFailToParse("b");
      });
    });

    describe("text matching", function() {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = $("a" "b" "c")', options);

        expect(parser).toParse("abc", "abc");
      });
    });

    describe("simple and matching", function() {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = &"a" "a"', options);

        expect(parser).toParse("a", [undefined, "a"]);
        expect(parser).toFailToParse("b");
      });

      it("does not advance position on success", function() {
        var parser = PEG.buildParser('start = &"a" "a"', options);

        expect(parser).toParse("a", [undefined, "a"]);
      });

      it("does not influence expected strings on failure", function() {
        var parser = PEG.buildParser('start = &"a"', options);

        expect(parser).toFailToParse("b", { expected: [] });
      });
    });

    describe("simple not matching", function() {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = !"a" "b"', options);

        expect(parser).toParse("b", [undefined, "b"]);
        expect(parser).toFailToParse("a");
      });

      it("does not advance position on failure", function() {
        var parser = PEG.buildParser('start = !"a" / "a"', options);

        expect(parser).toParse("a", "a");
      });

      it("does not influence expected strings on failure", function() {
        var parser = PEG.buildParser('start = !"a"', options);

        expect(parser).toFailToParse("a", { expected: [] });
      });
    });

    describe("semantic and code", function() {
      it("causes successful match by returning |true|", function() {
        var parser = PEG.buildParser('start = &{ return true; }', options);

        expect(parser).toParse("", undefined);
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

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use the |text| function", function() {
        var parser = PEG.buildParser(
              'start = "a" &{ return text() === ""; }',
              options
            );

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use the |offset| function to get the current parse position", function() {
        var parser = PEG.buildParser(
              'start = "a" &{ return offset() === 1; }',
              options
            );

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use the |line| and |column| functions to get the current line and column", function() {
        var parser = PEG.buildParser([
              '{ var result; }',
              'start  = line (nl+ line)* { return result; }',
              'line   = thing (" "+ thing)*',
              'thing  = digit / mark',
              'digit  = [0-9]',
              'mark   = &{ result = [line(), column()]; return true; } "x"',
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

      it("can use variables defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ var v = 42 }',
              'start = "a" &{ return v === 42; }'
            ].join("\n"), options);

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use functions defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ function f() { return 42; } }',
              'start = "a" &{ return f() === 42; }'
            ].join("\n"), options);

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use options passed to the parser", function() {
        var parser = PEG.buildParser([
              '{ var result; }',
              'start = "a" &{ result = options; return true; } { return result; }'
            ].join("\n"), options);

        expect(parser).toParse("a", { a: 42 }, { a: 42 });
      });
    });

    describe("semantic not code", function() {
      it("causes successful match by returning |false|", function() {
        var parser = PEG.buildParser('start = !{ return false; }', options);

        expect(parser).toParse("", undefined);
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

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use the |text| function", function() {
        var parser = PEG.buildParser(
              'start = "a" !{ return text() !== ""; }',
              options
            );

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use the |offset| function to get the current parse position", function() {
        var parser = PEG.buildParser(
              'start = "a" !{ return offset() !== 1; }',
              options
            );

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use the |line| and |column| functions to get the current line and column", function() {
        var parser = PEG.buildParser([
              '{ var result; }',
              'start  = line (nl+ line)* { return result; }',
              'line   = thing (" "+ thing)*',
              'thing  = digit / mark',
              'digit  = [0-9]',
              'mark   = !{ result = [line(), column()]; return false; } "x"',
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

      it("can use variables defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ var v = 42 }',
              'start = "a" !{ return v !== 42; }'
            ].join("\n"), options);

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use functions defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ function f() { return 42; } }',
              'start = "a" !{ return f() !== 42; }'
            ].join("\n"), options);

        expect(parser).toParse("a", ["a", undefined]);
      });

      it("can use options passed to the parser", function() {
        var parser = PEG.buildParser([
              '{ var result; }',
              'start = "a" !{ result = options; return false; } { return result; }'
            ].join("\n"), options);

        expect(parser).toParse("a", { a: 42 }, { a: 42 });
      });
    });

    describe("optional matching", function() {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = "a"?', options);

        expect(parser).toParse("",  null);
        expect(parser).toParse("a", "a");
      });
    });

    describe("zero or more matching", function() {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = "a"*', options);

        expect(parser).toParse("",    []);
        expect(parser).toParse("a",   ["a"]);
        expect(parser).toParse("aaa", ["a", "a", "a"]);
      });
    });

    describe("one or more matching", function() {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = "a"+', options);

        expect(parser).toFailToParse("");
        expect(parser).toParse("a",   ["a"]);
        expect(parser).toParse("aaa", ["a", "a", "a"]);
      });
    });

    describe("rule reference matching", function() {
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

    describe("literal matching", function() {
      it("matches empty literal correctly", function() {
        var parser = PEG.buildParser('start = ""', options);

        expect(parser).toParse("", "");
      });

      it("matches one-character literal correctly", function() {
        var parser = PEG.buildParser('start = "a"', options);

        expect(parser).toParse("a", "a");
        expect(parser).toFailToParse("b");
      });

      it("matches multi-character literal correctly", function() {
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

      it("sets expectation correctly on failure", function() {
        var parser = PEG.buildParser('start = "a"', options);

        expect(parser).toFailToParse("b", {
          expected: [{ type: "literal", value: "a", description: '"a"' }]
        });
      });
    });

    describe("class matching", function() {
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

      it("sets expectation correctly on failure", function() {
        var parser = PEG.buildParser('start = [a]', options);

        expect(parser).toFailToParse("b", {
          expected: [{ type: "class", value: "[a]", description: "[a]" }]
        });
      });
    });

    describe("any matching", function() {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = .', options);

        expect(parser).toParse("a", "a");
      });

      it("advances position on success", function() {
        var parser = PEG.buildParser('start = . .', options);

        expect(parser).toParse("ab", ["a", "b"]);
      });

      it("sets expectation correctly on failure", function() {
        var parser = PEG.buildParser('start = .', options);

        expect(parser).toFailToParse("", {
          expected: [{ type: "any", description: "any character" }]
        });
      });
    });

    describe("error reporting", function() {
      describe("behavior", function() {
        it("reports only the rightmost error", function() {
          var parser = PEG.buildParser('start = "a" "b" / "a" "c" "d"', options);

          expect(parser).toFailToParse("ace", {
            offset:   2,
            expected: [{ type: "literal", value: "d", description: '"d"' }]
          });
        });
      });

      describe("expectations reporting", function() {
        it("reports expectations correctly with no alternative", function() {
          var parser = PEG.buildParser('start = ', options);

          expect(parser).toFailToParse("a", {
            expected: [{ type: "end", description: "end of input" }]
          });
        });

        it("reports expectations correctly with one alternative", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("b", {
            expected: [{ type: "literal", value: "a", description: '"a"' }]
          });
        });

        it("reports expectations correctly with multiple alternatives", function() {
          var parser = PEG.buildParser('start = "a" / "b" / "c"', options);

          expect(parser).toFailToParse("d", {
            expected: [
              { type: "literal", value: "a", description: '"a"' },
              { type: "literal", value: "b", description: '"b"' },
              { type: "literal", value: "c", description: '"c"' }
            ]
          });
        });

        it("removes duplicates from expectations", function() {
          /*
           * There was a bug in the code that manifested only with three
           * duplicates. This is why the following test uses three choices
           * instead of seemingly sufficient two.
           *
           * See https://github.com/dmajda/pegjs/pull/146.
           */
          var parser = PEG.buildParser('start = "a" / "a" / "a"', options);

          expect(parser).toFailToParse("b", {
            expected: [{ type: "literal", value: "a", description: '"a"' }]
          });
        });

        it("sorts expectations", function() {
          var parser = PEG.buildParser('start = "c" / "b" / "a"', options);

          expect(parser).toFailToParse("d", {
            expected: [
              { type: "literal", value: "a", description: '"a"' },
              { type: "literal", value: "b", description: '"b"' },
              { type: "literal", value: "c", description: '"c"' }
            ]
          });
        });
      });

      describe("found string reporting", function() {
        it("reports found string correctly at the end of input", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("", { found: null });
        });

        it("reports found string correctly in the middle of input", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("b", { found: "b" });
        });
      });

      describe("message building", function() {
        it("builds message correctly with no alternative", function() {
          var parser = PEG.buildParser('start = ', options);

          expect(parser).toFailToParse("a", {
            message: 'Expected end of input but "a" found.'
          });
        });

        it("builds message correctly with one alternative", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("b", {
            message: 'Expected "a" but "b" found.'
          });
        });

        it("builds message correctly with multiple alternatives", function() {
          var parser = PEG.buildParser('start = "a" / "b" / "c"', options);

          expect(parser).toFailToParse("d", {
            message: 'Expected "a", "b" or "c" but "d" found.'
          });
        });

        it("builds message correctly at the end of input", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("", {
            message: 'Expected "a" but end of input found.'
          });
        });

        it("builds message correctly in the middle of input", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("b", {
            message: 'Expected "a" but "b" found.'
          });
        });
      });

      describe("position reporting", function() {
        it("reports position correctly with invalid input", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("b", { offset: 0, line: 1, column: 1 });
        });

        it("reports position correctly with trailing input", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("aa", { offset: 1, line: 1, column: 2});
        });

        it("reports position correctly in complex cases", function() {
          var parser = PEG.buildParser([
                'start  = line (nl+ line)*',
                'line   = digit (" "+ digit)*',
                'digit  = [0-9]',
                'nl     = ("\\r" / "\\n" / "\\u2028" / "\\u2029")'
              ].join("\n"), options);

          expect(parser).toFailToParse("1\n2\n\n3\n\n\n4 5 x", {
            offset: 13,
            line:   7,
            column: 5
          });

          /* Non-Unix newlines */
          expect(parser).toFailToParse("1\rx", {   // Old Mac
            offset: 2,
            line:   2,
            column: 1
          });
          expect(parser).toFailToParse("1\r\nx", { // Windows
            offset: 3,
            line:   2,
            column: 1
          });
          expect(parser).toFailToParse("1\n\rx", { // mismatched
            offset: 3,
            line:   3,
            column: 1
          });

          /* Strange newlines */
          expect(parser).toFailToParse("1\u2028x", { // line separator
            offset: 2,
            line:   2,
            column: 1
          });
          expect(parser).toFailToParse("1\u2029x", { // paragraph separator
            offset: 2,
            line:   2,
            column: 1
          });
        });
      });
    });

    describe("allowed start rules", function() {
      var grammar = [
            'a = "x"',
            'b = "x"',
            'c = "x"'
          ].join("\n");

      describe("without the |allowedStartRules| option", function() {
        var parser = PEG.buildParser(grammar);

        it("allows the first rule", function() {
          expect(parser).toParse("x", { startRule: "a" }, "x");
        });

        it("does not allow any other rules", function() {
          expect(parser).toFailToParse("x", { startRule: "b" }, { });
          expect(parser).toFailToParse("x", { startRule: "c" }, { });
        });
      });

      describe("with the |allowedStartRules| option", function() {
        var parser = PEG.buildParser(grammar, { allowedStartRules: ["b", "c"] });

        it("allows the specified rules", function() {
          expect(parser).toParse("x", { startRule: "b" }, "x");
          expect(parser).toParse("x", { startRule: "c" }, "x");
        });

        it("does not allow any other rules", function() {
          expect(parser).toFailToParse("x", { startRule: "a" }, { });
        });
      });
    });

    describe("output", function() {
      var grammar = 'start = "a"';

      describe("without the |output| option", function() {
        it("returns a parser object", function() {
          var parser = PEG.buildParser(grammar);

          expect(typeof parser).toBe("object");
          expect(parser).toParse("a", "a");
        });
      });

      describe("when the |output| option is set to \"parser\"", function() {
        it("returns a parser object", function() {
          var parser = PEG.buildParser(grammar, { output: "parser" });

          expect(typeof parser).toBe("object");
          expect(parser).toParse("a", "a");
        });
      });

      describe("when the |output| option is set to \"source\"", function() {
        it("returns a parser source code", function() {
          var source = PEG.buildParser(grammar, { output: "source" });

          expect(typeof source).toBe("string");
          expect(eval(source)).toParse("a", "a");
        });
      });
    });

    /*
     * Following examples are from Wikipedia, see
     * http://en.wikipedia.org/w/index.php?title=Parsing_expression_grammar&oldid=335106938.
     */
    describe("complex examples", function() {
      it("handles arithmetics example correctly", function() {
        /*
         * Value   ← [0-9]+ / '(' Expr ')'
         * Product ← Value (('*' / '/') Value)*
         * Sum     ← Product (('+' / '-') Product)*
         * Expr    ← Sum
         */
        var parser = PEG.buildParser([
              'Expr    = Sum',
              'Sum     = head:Product tail:(("+" / "-") Product)* {',
              '            var result = head, i;',
              '            for (i = 0; i < tail.length; i++) {',
              '              if (tail[i][0] == "+") { result += tail[i][1]; }',
              '              if (tail[i][0] == "-") { result -= tail[i][1]; }',
              '            }',
              '            return result;',
              '          }',
              'Product = head:Value tail:(("*" / "/") Value)* {',
              '            var result = head, i;',
              '            for (i = 0; i < tail.length; i++) {',
              '              if (tail[i][0] == "*") { result *= tail[i][1]; }',
              '              if (tail[i][0] == "/") { result /= tail[i][1]; }',
              '            }',
              '            return result;',
              '          }',
              'Value   = digits:[0-9]+     { return parseInt(digits.join(""), 10); }',
              '        / "(" expr:Expr ")" { return expr; }'
            ].join("\n"), options);

        /* The "value" rule */
        expect(parser).toParse("0",       0);
        expect(parser).toParse("123",     123);
        expect(parser).toParse("(42+43)", 42+43);

        /* The "product" rule */
        expect(parser).toParse("42",          42);
        expect(parser).toParse("42*43",       42*43);
        expect(parser).toParse("42*43*44*45", 42*43*44*45);
        expect(parser).toParse("42/43",       42/43);
        expect(parser).toParse("42/43/44/45", 42/43/44/45);

        /* The "sum" rule */
        expect(parser).toParse("42*43",                   42*43);
        expect(parser).toParse("42*43+44*45",             42*43+44*45);
        expect(parser).toParse("42*43+44*45+46*47+48*49", 42*43+44*45+46*47+48*49);
        expect(parser).toParse("42*43-44*45",             42*43-44*45);
        expect(parser).toParse("42*43-44*45-46*47-48*49", 42*43-44*45-46*47-48*49);

        /* The "expr" rule */
        expect(parser).toParse("42+43", 42+43);

        /* Complex test */
        expect(parser).toParse("(1+2)*(3+4)", (1+2)*(3+4));
      });

      it("handles non-context-free language correctly", function() {
        /* The following parsing expression grammar describes the classic
         * non-context-free language { a^n b^n c^n : n >= 1 }:
         *
         * S ← &(A c) a+ B !(a/b/c)
         * A ← a A? b
         * B ← b B? c
         */
        var parser = PEG.buildParser([
              'S = &(A "c") a:"a"+ B:B !("a" / "b" / "c") { return a.join("") + B; }',
              'A = a:"a" A:A? b:"b" { return [a, A, b].join(""); }',
              'B = b:"b" B:B? c:"c" { return [b, B, c].join(""); }'
            ].join("\n"), options);

        expect(parser).toParse("abc",       "abc");
        expect(parser).toParse("aaabbbccc", "aaabbbccc");
        expect(parser).toFailToParse("aabbbccc");
        expect(parser).toFailToParse("aaaabbbccc");
        expect(parser).toFailToParse("aaabbccc");
        expect(parser).toFailToParse("aaabbbbccc");
        expect(parser).toFailToParse("aaabbbcc");
        expect(parser).toFailToParse("aaabbbcccc");
      });

      it("handles nested comments example correctly", function() {
        /*
         * Begin ← "(*"
         * End ← "*)"
         * C ← Begin N* End
         * N ← C / (!Begin !End Z)
         * Z ← any single character
         */
        var parser = PEG.buildParser([
              'C     = begin:Begin ns:N* end:End { return begin + ns.join("") + end; }',
              'N     = C',
              '      / !Begin !End z:Z { return z; }',
              'Z     = .',
              'Begin = "(*"',
              'End   = "*)"'
            ].join("\n"), options);

        expect(parser).toParse("(**)",     "(**)");
        expect(parser).toParse("(*abc*)",  "(*abc*)");
        expect(parser).toParse("(*(**)*)", "(*(**)*)");
        expect(parser).toParse(
          "(*abc(*def*)ghi(*(*(*jkl*)*)*)mno*)",
          "(*abc(*def*)ghi(*(*(*jkl*)*)*)mno*)"
        );
      });
    });
  });
});
