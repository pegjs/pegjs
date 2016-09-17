/* eslint no-console: 0 */
/* global console */

"use strict";

let peg = require("../../lib/peg");

describe("generated parser behavior", function() {
  function varyOptimizationOptions(block) {
    function clone(object) {
      let result = {};

      Object.keys(object).forEach(key => {
        result[key] = object[key];
      });

      return result;
    }

    let optionsVariants = [
          { cache: false, optimize: "speed", trace: false },
          { cache: false, optimize: "speed", trace: true  },
          { cache: false, optimize: "size",  trace: false },
          { cache: false, optimize: "size",  trace: true  },
          { cache: true,  optimize: "speed", trace: false },
          { cache: true,  optimize: "speed", trace: true  },
          { cache: true,  optimize: "size",  trace: false },
          { cache: true,  optimize: "size",  trace: true  }
        ];

    optionsVariants.forEach(variant => {
      describe(
        "with options " + jasmine.pp(variant),
        function() { block(clone(variant)); }
      );
    });
  }

  beforeEach(function() {
    this.addMatchers({
      toParse: function(input, expected, options) {
        options = options !== undefined ? options : {};

        let result;

        try {
          result = this.actual.parse(input, options);
        } catch (e) {
          this.message = () =>
            "Expected " + jasmine.pp(input) + " "
              + "with options " + jasmine.pp(options) + " "
              + "to parse" + (expected !== undefined ? " as " + jasmine.pp(expected) : "") + ", "
              + "but it failed to parse with message "
              + jasmine.pp(e.message) + ".";

          return false;
        }

        if (expected !== undefined) {
          this.message = () =>
            "Expected " + jasmine.pp(input) + " "
              + "with options " + jasmine.pp(options) + " "
              + (this.isNot ? "not " : "")
              + "to parse as " + jasmine.pp(expected) + ", "
              + "but it parsed as " + jasmine.pp(result) + ".";

          return this.env.equals_(result, expected);
        } else {
          return true;
        }
      },

      toFailToParse: function(input, details, options) {
        options = options !== undefined ? options : {};

        let result;

        try {
          result = this.actual.parse(input, options);
        } catch (e) {
          if (this.isNot) {
            this.message = () =>
              "Expected " + jasmine.pp(input)
                + "with options " + jasmine.pp(options) + " "
                + "to parse, "
                + "but it failed with message "
                + jasmine.pp(e.message) + ".";
          } else {
            if (details) {
              let keys = Object.keys(details);
              for (let i = 0; i < keys.length; i++) {
                let key = keys[i];

                if (!this.env.equals_(e[key], details[key])) {
                  this.message = () =>
                    "Expected " + jasmine.pp(input) + " "
                      + "with options " + jasmine.pp(options) + " "
                      + "to fail to parse"
                      + (details ? " with details " + jasmine.pp(details) : "") + ", "
                      + "but " + jasmine.pp(key) + " "
                      + "is " + jasmine.pp(e[key]) + ".";

                  return false;
                }
              }
            }
          }

          return true;
        }

        this.message = () =>
          "Expected " + jasmine.pp(input) + " "
            + "with options " + jasmine.pp(options) + " "
            + "to fail to parse"
            + (details ? " with details " + jasmine.pp(details) : "") + ", "
            + "but it parsed as " + jasmine.pp(result) + ".";

        return false;
      }
    });

    /*
     * Stub out |console.log| so that the default tracer doesn't clutter
     * test output.
     */
    if (typeof console === "object") {
      spyOn(console, "log");
    }
  });

  varyOptimizationOptions(function(options) {
    describe("initializer", function() {
      it("executes the code before parsing starts", function() {
        let parser = peg.generate([
              '{ var result = 42; }',
              'start = "a" { return result; }'
            ].join("\n"), options);

        expect(parser).toParse("a", 42);
      });

      describe("available variables and functions", function() {
        it("|options| contains options", function() {
          let parser = peg.generate([
                '{ var result = options; }',
                'start = "a" { return result; }'
              ].join("\n"), options);

          expect(parser).toParse("a", { a: 42 }, { a: 42 });
        });
      });
    });

    describe("rule", function() {
      if (options.cache) {
        it("caches rule match results", function() {
          let parser = peg.generate([
                '{ var n = 0; }',
                'start = (a "b") / (a "c") { return n; }',
                'a = "a" { n++; }'
              ].join("\n"), options);

          expect(parser).toParse("ac", 1);
        });
      } else {
        it("doesn't cache rule match results", function() {
          let parser = peg.generate([
                '{ var n = 0; }',
                'start = (a "b") / (a "c") { return n; }',
                'a = "a" { n++; }'
              ].join("\n"), options);

          expect(parser).toParse("ac", 2);
        });
      }

      describe("when the expression matches", function() {
        it("returns its match result", function() {
          let parser = peg.generate('start = "a"');

          expect(parser).toParse("a", "a");
        });
      });

      describe("when the expression doesn't match", function() {
        describe("without display name", function() {
          it("reports match failure and doesn't record any expectation", function() {
            let parser = peg.generate('start = "a"');

            expect(parser).toFailToParse("b", {
              expected: [{ type: "literal", text: "a", ignoreCase: false }]
            });
          });
        });

        describe("with display name", function() {
          it("reports match failure and records an expectation of type \"other\"", function() {
            let parser = peg.generate('start "start" = "a"');

            expect(parser).toFailToParse("b", {
              expected: [{ type: "other", description: "start" }]
            });
          });

          it("discards any expectations recorded when matching the expression", function() {
            let parser = peg.generate('start "start" = "a"');

            expect(parser).toFailToParse("b", {
              expected: [{ type: "other", description: "start" }]
            });
          });
        });
      });
    });

    describe("literal", function() {
      describe("matching", function() {
        it("matches empty literals", function() {
          let parser = peg.generate('start = ""', options);

          expect(parser).toParse("");
        });

        it("matches one-character literals", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toParse("a");
          expect(parser).toFailToParse("b");
        });

        it("matches multi-character literals", function() {
          let parser = peg.generate('start = "abcd"', options);

          expect(parser).toParse("abcd");
          expect(parser).toFailToParse("efgh");
        });

        it("is case sensitive without the \"i\" flag", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toParse("a");
          expect(parser).toFailToParse("A");
        });

        it("is case insensitive with the \"i\" flag", function() {
          let parser = peg.generate('start = "a"i', options);

          expect(parser).toParse("a");
          expect(parser).toParse("A");
        });
      });

      describe("when it matches", function() {
        it("returns the matched text", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toParse("a", "a");
        });

        it("consumes the matched text", function() {
          let parser = peg.generate('start = "a" .', options);

          expect(parser).toParse("ab");
        });
      });

      describe("when it doesn't match", function() {
        it("reports match failure and records an expectation of type \"literal\"", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("b", {
            expected: [{ type: "literal", text: "a", ignoreCase: false }]
          });
        });
      });
    });

    describe("character class", function() {
      describe("matching", function() {
        it("matches empty classes", function() {
          let parser = peg.generate('start = []', options);

          expect(parser).toFailToParse("a");
        });

        it("matches classes with a character list", function() {
          let parser = peg.generate('start = [abc]', options);

          expect(parser).toParse("a");
          expect(parser).toParse("b");
          expect(parser).toParse("c");
          expect(parser).toFailToParse("d");
        });

        it("matches classes with a character range", function() {
          let parser = peg.generate('start = [a-c]', options);

          expect(parser).toParse("a");
          expect(parser).toParse("b");
          expect(parser).toParse("c");
          expect(parser).toFailToParse("d");
        });

        it("matches inverted classes", function() {
          let parser = peg.generate('start = [^a]', options);

          expect(parser).toFailToParse("a");
          expect(parser).toParse("b");
        });

        it("is case sensitive without the \"i\" flag", function() {
          let parser = peg.generate('start = [a]', options);

          expect(parser).toParse("a");
          expect(parser).toFailToParse("A");
        });

        it("is case insensitive with the \"i\" flag", function() {
          let parser = peg.generate('start = [a]i', options);

          expect(parser).toParse("a");
          expect(parser).toParse("A");
        });
      });

      describe("when it matches", function() {
        it("returns the matched character", function() {
          let parser = peg.generate('start = [a]', options);

          expect(parser).toParse("a", "a");
        });

        it("consumes the matched character", function() {
          let parser = peg.generate('start = [a] .', options);

          expect(parser).toParse("ab");
        });
      });

      describe("when it doesn't match", function() {
        it("reports match failure and records an expectation of type \"class\"", function() {
          let parser = peg.generate('start = [a]', options);

          expect(parser).toFailToParse("b", {
            expected: [{ type: "class", parts: ["a"], inverted: false, ignoreCase: false }]
          });
        });
      });
    });

    describe("dot", function() {
      describe("matching", function() {
        it("matches any character", function() {
          let parser = peg.generate('start = .', options);

          expect(parser).toParse("a");
          expect(parser).toParse("b");
          expect(parser).toParse("c");
        });
      });

      describe("when it matches", function() {
        it("returns the matched character", function() {
          let parser = peg.generate('start = .', options);

          expect(parser).toParse("a", "a");
        });

        it("consumes the matched character", function() {
          let parser = peg.generate('start = . .', options);

          expect(parser).toParse("ab");
        });
      });

      describe("when it doesn't match", function() {
        it("reports match failure and records an expectation of type \"any\"", function() {
          let parser = peg.generate('start = .', options);

          expect(parser).toFailToParse("", {
            expected: [{ type: "any" }]
          });
        });
      });
    });

    describe("rule reference", function() {
      describe("when referenced rule's expression matches", function() {
        it("returns its result", function() {
          let parser = peg.generate([
                'start = a',
                'a = "a"'
              ].join("\n"), options);

          expect(parser).toParse("a", "a");
        });
      });

      describe("when referenced rule's expression doesn't match", function() {
        it("reports match failure", function() {
          let parser = peg.generate([
                'start = a',
                'a = "a"'
              ].join("\n"), options);

          expect(parser).toFailToParse("b");
        });
      });
    });

    describe("positive semantic predicate", function() {
      describe("when the code returns a truthy value", function() {
        it("returns |undefined|", function() {
          /*
           * The |""| is needed so that the parser doesn't return just
           * |undefined| which we can't compare against in |toParse| due to the
           * way optional parameters work.
           */
          let parser = peg.generate('start = &{ return true; } ""', options);

          expect(parser).toParse("", [undefined, ""]);
        });
      });

      describe("when the code returns a falsey value", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = &{ return false; }', options);

          expect(parser).toFailToParse("");
        });
      });

      describe("label variables", function() {
        describe("in containing sequence", function() {
          it("can access variables defined by preceding labeled elements", function() {
            let parser = peg.generate(
                  'start = a:"a" &{ return a === "a"; }',
                  options
                );

            expect(parser).toParse("a");
          });

          it("cannot access variable defined by labeled predicate element", function() {
            let parser = peg.generate(
                  'start = "a" b:&{ return b === undefined; } "c"',
                  options
                );

            expect(parser).toFailToParse("ac");
          });

          it("cannot access variables defined by following labeled elements", function() {
            let parser = peg.generate(
                  'start = &{ return a === "a"; } a:"a"',
                  options
                );

            expect(parser).toFailToParse("a");
          });

          it("cannot access variables defined by subexpressions", function() {
            let testcases = [
                  {
                    grammar: 'start = (a:"a") &{ return a === "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = (a:"a")? &{ return a === "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = (a:"a")* &{ return a === "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = (a:"a")+ &{ return a === "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = $(a:"a") &{ return a === "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = &(a:"a") "a" &{ return a === "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = !(a:"a") "b" &{ return a === "a"; }',
                    input:   "b"
                  },
                  {
                    grammar: 'start = b:(a:"a") &{ return a === "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = ("a" b:"b" "c") &{ return b === "b"; }',
                    input:   "abc"
                  },
                  {
                    grammar: 'start = (a:"a" { return a; }) &{ return a === "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = ("a" / b:"b" / "c") &{ return b === "b"; }',
                    input:   "b"
                  }
                ];
            let parser;

            testcases.forEach(testcase => {
              parser = peg.generate(testcase.grammar, options);
              expect(parser).toFailToParse(testcase.input);
            });
          });
        });

        describe("in outer sequence", function() {
          it("can access variables defined by preceding labeled elements", function() {
            let parser = peg.generate(
                  'start = a:"a" ("b" &{ return a === "a"; })',
                  options
                );

            expect(parser).toParse("ab");
          });

          it("cannot access variable defined by labeled predicate element", function() {
            let parser = peg.generate(
                  'start = "a" b:("b" &{ return b === undefined; }) "c"',
                  options
                );

            expect(parser).toFailToParse("abc");
          });

          it("cannot access variables defined by following labeled elements", function() {
            let parser = peg.generate(
                  'start = ("a" &{ return b === "b"; }) b:"b"',
                  options
                );

            expect(parser).toFailToParse("ab");
          });
        });
      });

      describe("initializer variables & functions", function() {
        it("can access variables defined in the initializer", function() {
          let parser = peg.generate([
                '{ var v = 42 }',
                'start = &{ return v === 42; }'
              ].join("\n"), options);

          expect(parser).toParse("");
        });

        it("can access functions defined in the initializer", function() {
          let parser = peg.generate([
                '{ function f() { return 42; } }',
                'start = &{ return f() === 42; }'
              ].join("\n"), options);

          expect(parser).toParse("");
        });
      });

      describe("available variables & functions", function() {
        it("|options| contains options", function() {
          let parser = peg.generate([
                '{ var result; }',
                'start = &{ result = options; return true; } { return result; }'
              ].join("\n"), options);

          expect(parser).toParse("", { a: 42 }, { a: 42 });
        });

        it("|location| returns current location info", function() {
          let parser = peg.generate([
                '{ var result; }',
                'start  = line (nl+ line)* { return result; }',
                'line   = thing (" "+ thing)*',
                'thing  = digit / mark',
                'digit  = [0-9]',
                'mark   = &{ result = location(); return true; } "x"',
                'nl     = "\\r"? "\\n"'
              ].join("\n"), options);

          expect(parser).toParse("1\n2\n\n3\n\n\n4 5 x", {
            start: { offset: 13, line: 7, column: 5 },
            end:   { offset: 13, line: 7, column: 5 }
          });

          /* Newline representations */
          expect(parser).toParse("1\nx", {     // Unix
            start: { offset: 2, line: 2, column: 1 },
            end:   { offset: 2, line: 2, column: 1 }
          });
          expect(parser).toParse("1\r\nx", {   // Windows
            start: { offset: 3, line: 2, column: 1 },
            end:   { offset: 3, line: 2, column: 1 }
          });
        });
      });
    });

    describe("negative semantic predicate", function() {
      describe("when the code returns a falsey value", function() {
        it("returns |undefined|", function() {
          /*
           * The |""| is needed so that the parser doesn't return just
           * |undefined| which we can't compare against in |toParse| due to the
           * way optional parameters work.
           */
          let parser = peg.generate('start = !{ return false; } ""', options);

          expect(parser).toParse("", [undefined, ""]);
        });
      });

      describe("when the code returns a truthy value", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = !{ return true; }', options);

          expect(parser).toFailToParse("");
        });
      });

      describe("label variables", function() {
        describe("in containing sequence", function() {
          it("can access variables defined by preceding labeled elements", function() {
            let parser = peg.generate(
                  'start = a:"a" !{ return a !== "a"; }',
                  options
                );

            expect(parser).toParse("a");
          });

          it("cannot access variable defined by labeled predicate element", function() {
            let parser = peg.generate(
                  'start = "a" b:!{ return b !== undefined; } "c"',
                  options
                );

            expect(parser).toFailToParse("ac");
          });

          it("cannot access variables defined by following labeled elements", function() {
            let parser = peg.generate(
                  'start = !{ return a !== "a"; } a:"a"',
                  options
                );

            expect(parser).toFailToParse("a");
          });

          it("cannot access variables defined by subexpressions", function() {
            let testcases = [
                  {
                    grammar: 'start = (a:"a") !{ return a !== "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = (a:"a")? !{ return a !== "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = (a:"a")* !{ return a !== "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = (a:"a")+ !{ return a !== "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = $(a:"a") !{ return a !== "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = &(a:"a") "a" !{ return a !== "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = !(a:"a") "b" !{ return a !== "a"; }',
                    input:   "b"
                  },
                  {
                    grammar: 'start = b:(a:"a") !{ return a !== "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = ("a" b:"b" "c") !{ return b !== "b"; }',
                    input:   "abc"
                  },
                  {
                    grammar: 'start = (a:"a" { return a; }) !{ return a !== "a"; }',
                    input:   "a"
                  },
                  {
                    grammar: 'start = ("a" / b:"b" / "c") !{ return b !== "b"; }',
                    input:   "b"
                  }
                ];
            let parser;

            testcases.forEach(testcase => {
              parser = peg.generate(testcase.grammar, options);
              expect(parser).toFailToParse(testcase.input);
            });
          });
        });

        describe("in outer sequence", function() {
          it("can access variables defined by preceding labeled elements", function() {
            let parser = peg.generate(
                  'start = a:"a" ("b" !{ return a !== "a"; })',
                  options
                );

            expect(parser).toParse("ab");
          });

          it("cannot access variable defined by labeled predicate element", function() {
            let parser = peg.generate(
                  'start = "a" b:("b" !{ return b !== undefined; }) "c"',
                  options
                );

            expect(parser).toFailToParse("abc");
          });

          it("cannot access variables defined by following labeled elements", function() {
            let parser = peg.generate(
                  'start = ("a" !{ return b !== "b"; }) b:"b"',
                  options
                );

            expect(parser).toFailToParse("ab");
          });
        });
      });

      describe("initializer variables & functions", function() {
        it("can access variables defined in the initializer", function() {
          let parser = peg.generate([
                '{ var v = 42 }',
                'start = !{ return v !== 42; }'
              ].join("\n"), options);

          expect(parser).toParse("");
        });

        it("can access functions defined in the initializer", function() {
          let parser = peg.generate([
                '{ function f() { return 42; } }',
                'start = !{ return f() !== 42; }'
              ].join("\n"), options);

          expect(parser).toParse("");
        });
      });

      describe("available variables & functions", function() {
        it("|options| contains options", function() {
          let parser = peg.generate([
                '{ var result; }',
                'start = !{ result = options; return false; } { return result; }'
              ].join("\n"), options);

          expect(parser).toParse("", { a: 42 }, { a: 42 });
        });

        it("|location| returns current location info", function() {
          let parser = peg.generate([
                '{ var result; }',
                'start  = line (nl+ line)* { return result; }',
                'line   = thing (" "+ thing)*',
                'thing  = digit / mark',
                'digit  = [0-9]',
                'mark   = !{ result = location(); return false; } "x"',
                'nl     = "\\r"? "\\n"'
              ].join("\n"), options);

          expect(parser).toParse("1\n2\n\n3\n\n\n4 5 x", {
            start: { offset: 13, line: 7, column: 5 },
            end:   { offset: 13, line: 7, column: 5 }
          });

          /* Newline representations */
          expect(parser).toParse("1\nx", {     // Unix
            start: { offset: 2, line: 2, column: 1 },
            end:   { offset: 2, line: 2, column: 1 }
          });
          expect(parser).toParse("1\r\nx", {   // Windows
            start: { offset: 3, line: 2, column: 1 },
            end:   { offset: 3, line: 2, column: 1 }
          });
        });
      });
    });

    describe("group", function() {
      describe("when the expression matches", function() {
        it("returns its match result", function() {
          let parser = peg.generate('start = ("a")', options);

          expect(parser).toParse("a", "a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = ("a")', options);

          expect(parser).toFailToParse("b");
        });
      });
    });

    describe("optional", function() {
      describe("when the expression matches", function() {
        it("returns its match result", function() {
          let parser = peg.generate('start = "a"?', options);

          expect(parser).toParse("a", "a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("returns |null|", function() {
          let parser = peg.generate('start = "a"?', options);

          expect(parser).toParse("", null);
        });
      });
    });

    describe("zero or more", function() {
      describe("when the expression matches zero or more times", function() {
        it("returns an array of its match results", function() {
          let parser = peg.generate('start = "a"*', options);

          expect(parser).toParse("",    []);
          expect(parser).toParse("a",   ["a"]);
          expect(parser).toParse("aaa", ["a", "a", "a"]);
        });
      });
    });

    describe("one or more", function() {
      describe("when the expression matches one or more times", function() {
        it("returns an array of its match results", function() {
          let parser = peg.generate('start = "a"+', options);

          expect(parser).toParse("a",   ["a"]);
          expect(parser).toParse("aaa", ["a", "a", "a"]);
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = "a"+', options);

          expect(parser).toFailToParse("");
        });
      });
    });

    describe("text", function() {
      describe("when the expression matches", function() {
        it("returns the matched text", function() {
          let parser = peg.generate('start = $("a" "b" "c")', options);

          expect(parser).toParse("abc", "abc");
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = $("a")', options);

          expect(parser).toFailToParse("b");
        });
      });
    });

    describe("positive simple predicate", function() {
      describe("when the expression matches", function() {
        it("returns |undefined|", function() {
          let parser = peg.generate('start = &"a" "a"', options);

          expect(parser).toParse("a", [undefined, "a"]);
        });

        it("resets parse position", function() {
          let parser = peg.generate('start = &"a" "a"', options);

          expect(parser).toParse("a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = &"a"', options);

          expect(parser).toFailToParse("b");
        });

        it("discards any expectations recorded when matching the expression", function() {
          let parser = peg.generate('start = "a" / &"b" / "c"', options);

          expect(parser).toFailToParse("d", {
            expected: [
              { type: "literal", text: "a", ignoreCase: false },
              { type: "literal", text: "c", ignoreCase: false }
            ]
          });
        });
      });
    });

    describe("negative simple predicate", function() {
      describe("when the expression matches", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = !"a"', options);

          expect(parser).toFailToParse("a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("returns |undefined|", function() {
          let parser = peg.generate('start = !"a" "b"', options);

          expect(parser).toParse("b", [undefined, "b"]);
        });

        it("resets parse position", function() {
          let parser = peg.generate('start = !"a" "b"', options);

          expect(parser).toParse("b");
        });

        it("discards any expectations recorded when matching the expression", function() {
          let parser = peg.generate('start = "a" / !"b" / "c"', options);

          expect(parser).toFailToParse("b", {
            expected: [
              { type: "literal", text: "a", ignoreCase: false },
              { type: "literal", text: "c", ignoreCase: false }
            ]
          });
        });
      });
    });

    describe("label", function() {
      describe("when the expression matches", function() {
        it("returns its match result", function() {
          let parser = peg.generate('start = a:"a"', options);

          expect(parser).toParse("a", "a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = a:"a"', options);

          expect(parser).toFailToParse("b");
        });
      });
    });

    describe("sequence", function() {
      describe("when all expressions match", function() {
        it("returns an array of their match results", function() {
          let parser = peg.generate('start = "a" "b" "c"', options);

          expect(parser).toParse("abc", ["a", "b", "c"]);
        });
      });

      describe("when any expression doesn't match", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = "a" "b" "c"', options);

          expect(parser).toFailToParse("dbc");
          expect(parser).toFailToParse("adc");
          expect(parser).toFailToParse("abd");
        });

        it("resets parse position", function() {
          let parser = peg.generate('start = "a" "b" / "a"', options);

          expect(parser).toParse("a", "a");
        });
      });
    });

    describe("action", function() {
      describe("when the expression matches", function() {
        it("returns the value returned by the code", function() {
          let parser = peg.generate('start = "a" { return 42; }', options);

          expect(parser).toParse("a", 42);
        });

        describe("label variables", function() {
          describe("in the expression", function() {
            it("can access variable defined by labeled expression", function() {
              let parser = peg.generate('start = a:"a" { return a; }', options);

              expect(parser).toParse("a", "a");
            });

            it("can access variables defined by labeled sequence elements", function() {
              let parser = peg.generate(
                    'start = a:"a" b:"b" c:"c" { return [a, b, c]; }',
                    options
                  );

              expect(parser).toParse("abc", ["a", "b", "c"]);
            });

            it("cannot access variables defined by subexpressions", function() {
              let testcases = [
                    {
                      grammar: 'start = (a:"a") { return a; }',
                      input:   "a"
                    },
                    {
                      grammar: 'start = (a:"a")? { return a; }',
                      input:   "a"
                    },
                    {
                      grammar: 'start = (a:"a")* { return a; }',
                      input:   "a"
                    },
                    {
                      grammar: 'start = (a:"a")+ { return a; }',
                      input:   "a"
                    },
                    {
                      grammar: 'start = $(a:"a") { return a; }',
                      input:   "a"
                    },
                    {
                      grammar: 'start = &(a:"a") "a" { return a; }',
                      input:   "a"
                    },
                    {
                      grammar: 'start = !(a:"a") "b" { return a; }',
                      input:   "b"
                    },
                    {
                      grammar: 'start = b:(a:"a") { return a; }',
                      input:   "a"
                    },
                    {
                      grammar: 'start = ("a" b:"b" "c") { return b; }',
                      input:   "abc"
                    },
                    {
                      grammar: 'start = (a:"a" { return a; }) { return a; }',
                      input:   "a"
                    },
                    {
                      grammar: 'start = ("a" / b:"b" / "c") { return b; }',
                      input:   "b"
                    }
                  ];
              let parser;

              testcases.forEach(testcase => {
                parser = peg.generate(testcase.grammar, options);
                expect(parser).toFailToParse(testcase.input);
              });
            });
          });

          describe("in outer sequence", function() {
            it("can access variables defined by preceding labeled elements", function() {
              let parser = peg.generate(
                    'start = a:"a" ("b" { return a; })',
                    options
                  );

              expect(parser).toParse("ab", ["a", "a"]);
            });

            it("cannot access variable defined by labeled action element", function() {
              let parser = peg.generate(
                    'start = "a" b:("b" { return b; }) c:"c"',
                    options
                  );

              expect(parser).toFailToParse("abc");
            });

            it("cannot access variables defined by following labeled elements", function() {
              let parser = peg.generate(
                    'start = ("a" { return b; }) b:"b"',
                    options
                  );

              expect(parser).toFailToParse("ab");
            });
          });
        });

        describe("initializer variables & functions", function() {
          it("can access variables defined in the initializer", function() {
            let parser = peg.generate([
                  '{ var v = 42 }',
                  'start = "a" { return v; }'
                ].join("\n"), options);

            expect(parser).toParse("a", 42);
          });

          it("can access functions defined in the initializer", function() {
            let parser = peg.generate([
                  '{ function f() { return 42; } }',
                  'start = "a" { return f(); }'
                ].join("\n"), options);

            expect(parser).toParse("a", 42);
          });
        });

        describe("available variables & functions", function() {
          it("|options| contains options", function() {
            let parser = peg.generate(
                  'start = "a" { return options; }',
                  options
                );

            expect(parser).toParse("a", { a: 42 }, { a: 42 });
          });

          it("|text| returns text matched by the expression", function() {
            let parser = peg.generate(
                  'start = "a" { return text(); }',
                  options
                );

            expect(parser).toParse("a", "a");
          });

          it("|location| returns location info of the expression", function() {
            let parser = peg.generate([
                  '{ var result; }',
                  'start  = line (nl+ line)* { return result; }',
                  'line   = thing (" "+ thing)*',
                  'thing  = digit / mark',
                  'digit  = [0-9]',
                  'mark   = "x" { result = location(); }',
                  'nl     = "\\r"? "\\n"'
                ].join("\n"), options);

            expect(parser).toParse("1\n2\n\n3\n\n\n4 5 x", {
              start: { offset: 13, line: 7, column: 5 },
              end:   { offset: 14, line: 7, column: 6 }
            });

            /* Newline representations */
            expect(parser).toParse("1\nx", {     // Unix
              start: { offset: 2, line: 2, column: 1 },
              end:   { offset: 3, line: 2, column: 2 }
            });
            expect(parser).toParse("1\r\nx", {   // Windows
              start: { offset: 3, line: 2, column: 1 },
              end:   { offset: 4, line: 2, column: 2 }
            });
          });

          describe("|expected|", function() {
            it("terminates parsing and throws an exception", function() {
              let parser = peg.generate(
                    'start = "a" { expected("a"); }',
                    options
                  );

              expect(parser).toFailToParse("a", {
                message:  'Expected a but "a" found.',
                expected: [{ type: "other", description: "a" }],
                found:    "a",
                location: {
                  start: { offset: 0, line: 1, column: 1 },
                  end:   { offset: 1, line: 1, column: 2 }
                }
              });
            });

            it("allows to set custom location info", function() {
              let parser = peg.generate([
                    'start = "a" {',
                    '  expected("a", {',
                    '    start: { offset: 1, line: 1, column: 2 },',
                    '    end:   { offset: 2, line: 1, column: 3 }',
                    '  });',
                    '}'
                  ].join("\n"), options);

              expect(parser).toFailToParse("a", {
                message:  'Expected a but "a" found.',
                expected: [{ type: "other", description: "a" }],
                found:    "a",
                location: {
                  start: { offset: 1, line: 1, column: 2 },
                  end:   { offset: 2, line: 1, column: 3 }
                }
              });
            });
          });

          describe("|error|", function() {
            it("terminates parsing and throws an exception", function() {
              let parser = peg.generate(
                    'start = "a" { error("a"); }',
                    options
                  );

              expect(parser).toFailToParse("a", {
                message:  "a",
                found:    null,
                expected: null,
                location: {
                  start: { offset: 0, line: 1, column: 1 },
                  end:   { offset: 1, line: 1, column: 2 }
                }
              });
            });

            it("allows to set custom location info", function() {
              let parser = peg.generate([
                    'start = "a" {',
                    '  error("a", {',
                    '    start: { offset: 1, line: 1, column: 2 },',
                    '    end:   { offset: 2, line: 1, column: 3 }',
                    '  });',
                    '}'
                  ].join("\n"), options);

              expect(parser).toFailToParse("a", {
                message:  "a",
                expected: null,
                found:    null,
                location: {
                  start: { offset: 1, line: 1, column: 2 },
                  end:   { offset: 2, line: 1, column: 3 }
                }
              });
            });
          });
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = "a" { return 42; }', options);

          expect(parser).toFailToParse("b");
        });

        it("doesn't execute the code", function() {
          let parser = peg.generate(
                'start = "a" { throw "Boom!"; } / "b"',
                options
              );

          expect(parser).toParse("b");
        });
      });
    });

    describe("choice", function() {
      describe("when any expression matches", function() {
        it("returns its match result", function() {
          let parser = peg.generate('start = "a" / "b" / "c"', options);

          expect(parser).toParse("a", "a");
          expect(parser).toParse("b", "b");
          expect(parser).toParse("c", "c");
        });
      });

      describe("when all expressions don't match", function() {
        it("reports match failure", function() {
          let parser = peg.generate('start = "a" / "b" / "c"', options);

          expect(parser).toFailToParse("d");
        });
      });
    });

    describe("error reporting", function() {
      describe("behavior", function() {
        it("reports only the rightmost error", function() {
          let parser = peg.generate('start = "a" "b" / "a" "c" "d"', options);

          expect(parser).toFailToParse("ace", {
            expected: [{ type: "literal", text: "d", ignoreCase: false }]
          });
        });
      });

      describe("expectations reporting", function() {
        it("reports expectations correctly with no alternative", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("ab", {
            expected: [{ type: "end" }]
          });
        });

        it("reports expectations correctly with one alternative", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("b", {
            expected: [{ type: "literal", text: "a", ignoreCase: false }]
          });
        });

        it("reports expectations correctly with multiple alternatives", function() {
          let parser = peg.generate('start = "a" / "b" / "c"', options);

          expect(parser).toFailToParse("d", {
            expected: [
              { type: "literal", text: "a", ignoreCase: false },
              { type: "literal", text: "b", ignoreCase: false },
              { type: "literal", text: "c", ignoreCase: false }
            ]
          });
        });
      });

      describe("found string reporting", function() {
        it("reports found string correctly at the end of input", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("", { found: null });
        });

        it("reports found string correctly in the middle of input", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("b", { found: "b" });
        });
      });

      describe("message building", function() {
        it("builds message correctly with no alternative", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("ab", {
            message: 'Expected end of input but "b" found.'
          });
        });

        it("builds message correctly with one alternative", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("b", {
            message: 'Expected "a" but "b" found.'
          });
        });

        it("builds message correctly with multiple alternatives", function() {
          let parser = peg.generate('start = "a" / "b" / "c"', options);

          expect(parser).toFailToParse("d", {
            message: 'Expected "a", "b", or "c" but "d" found.'
          });
        });

        it("builds message correctly at the end of input", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("", {
            message: 'Expected "a" but end of input found.'
          });
        });

        it("builds message correctly in the middle of input", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("b", {
            message: 'Expected "a" but "b" found.'
          });
        });

        it("removes duplicates from expectations", function() {
          let parser = peg.generate('start = "a" / "a"', options);

          expect(parser).toFailToParse("b", {
            message: 'Expected "a" but "b" found.'
          });
        });

        it("sorts expectations", function() {
          let parser = peg.generate('start = "c" / "b" / "a"', options);

          expect(parser).toFailToParse("d", {
            message: 'Expected "a", "b", or "c" but "d" found.'
          });
        });

      });

      describe("position reporting", function() {
        it("reports position correctly at the end of input", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("", {
            location: {
              start: { offset: 0, line: 1, column: 1 },
              end:   { offset: 0, line: 1, column: 1 }
            }
          });
        });

        it("reports position correctly in the middle of input", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("b", {
            location: {
              start: { offset: 0, line: 1, column: 1 },
              end:   { offset: 1, line: 1, column: 2 }
            }
          });
        });

        it("reports position correctly with trailing input", function() {
          let parser = peg.generate('start = "a"', options);

          expect(parser).toFailToParse("aa", {
            location: {
              start: { offset: 1, line: 1, column: 2 },
              end:   { offset: 2, line: 1, column: 3 }
            }
          });
        });

        it("reports position correctly in complex cases", function() {
          let parser = peg.generate([
                'start  = line (nl+ line)*',
                'line   = digit (" "+ digit)*',
                'digit  = [0-9]',
                'nl     = "\\r"? "\\n"'
              ].join("\n"), options);

          expect(parser).toFailToParse("1\n2\n\n3\n\n\n4 5 x", {
            location: {
              start: { offset: 13, line: 7, column: 5 },
              end:   { offset: 14, line: 7, column: 6 }
            }
          });

          /* Newline representations */
          expect(parser).toFailToParse("1\nx", {     // Old Mac
            location: {
              start: { offset: 2, line: 2, column: 1 },
              end:   { offset: 3, line: 2, column: 2 }
            }
          });
          expect(parser).toFailToParse("1\r\nx", {   // Windows
            location: {
              start: { offset: 3, line: 2, column: 1 },
              end:   { offset: 4, line: 2, column: 2 }
            }
          });
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
        let parser = peg.generate([
              'Expr    = Sum',
              'Sum     = head:Product tail:(("+" / "-") Product)* {',
              '            return tail.reduce(function(result, element) {',
              '              if (element[0] === "+") { return result + element[1]; }',
              '              if (element[0] === "-") { return result - element[1]; }',
              '            }, head);',
              '          }',
              'Product = head:Value tail:(("*" / "/") Value)* {',
              '            return tail.reduce(function(result, element) {',
              '              if (element[0] === "*") { return result * element[1]; }',
              '              if (element[0] === "/") { return result / element[1]; }',
              '            }, head);',
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
        let parser = peg.generate([
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
        let parser = peg.generate([
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
