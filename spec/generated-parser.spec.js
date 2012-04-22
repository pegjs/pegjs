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

  describe("initializer code", function() {
    varyAll(function(options) {
      it("runs before the parsing begins", function() {
        var parser = PEG.buildParser([
              '{ var result = 42; }',
              'start  = "a" { return result }'
            ].join("\n"), options);

        expect(parser).toParse("a", 42);
      });
    });
  });

  describe("rule matching", function() {
    varyAll(function(options) {
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
  });

  describe("choice matching", function() {
    varyAll(function(options) {
      it("matches correctly", function() {
        var parser = PEG.buildParser('start = "a" / "b" / "c"', options);

        expect(parser).toParse("a", "a");
        expect(parser).toParse("b", "b");
        expect(parser).toParse("c", "c");
        expect(parser).toFailToParse("d");
      });
    });
  });

  describe("sequence matching", function() {
    varyAll(function(options) {
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

      it("can use variables defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ var v = 42 }',
              'start = "a" &{ return v === 42; }'
            ].join("\n"), options);

        expect(parser).toParse("a", ["a", ""]);
      });

      it("can use functions defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ function f() { return 42; } }',
              'start = "a" &{ return f() === 42; }'
            ].join("\n"), options);

        expect(parser).toParse("a", ["a", ""]);
      });
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

      it("can use variables defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ var v = 42 }',
              'start = "a" !{ return v !== 42; }'
            ].join("\n"), options);

        expect(parser).toParse("a", ["a", ""]);
      });

      it("can use functions defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ function f() { return 42; } }',
              'start = "a" !{ return f() !== 42; }'
            ].join("\n"), options);

        expect(parser).toParse("a", ["a", ""]);
      });
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

      it("can use variables defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ var v = 42 }',
              'start = "a" { return v; }'
            ].join("\n"), options);

        expect(parser).toParse("a", 42);
      });

      it("can use functions defined in the initializer", function() {
        var parser = PEG.buildParser([
              '{ function f() { return 42; } }',
              'start = "a" { return f(); }'
            ].join("\n"), options);

        expect(parser).toParse("a", 42);
      });

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

  /*
   * Following examples are from Wikipedia, see
   * http://en.wikipedia.org/w/index.php?title=Parsing_expression_grammar&oldid=335106938.
   */
  describe("complex examples", function() {
    varyAll(function(options) {
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
              'A = a:"a" A:A? b:"b" { return a + A + b; }',
              'B = b:"b" B:B? c:"c" { return b + B + c; }'
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
