/* global beforeEach, describe, expect, it, jasmine, PEG */

"use strict";

describe("generated parser behavior", function() {
  function varyOptimizationOptions(block) {
    function clone(object) {
      var result = {}, key;

      for (key in object) {
        if (object.hasOwnProperty(key)) {
          result[key] = object[key];
        }
      }

      return result;
    }

    var optionsVariants = [
          { cache: false, optimize: "speed" },
          { cache: false, optimize: "size"  },
          { cache: true,  optimize: "speed" },
          { cache: true,  optimize: "size"  },
        ],
        i;

    for (i = 0; i < optionsVariants.length; i++) {
      describe(
        "with options " + jasmine.pp(optionsVariants[i]),
        function() { block(clone(optionsVariants[i])); }
      );
    }
  }

  beforeEach(function() {
    this.addMatchers({
      toParse: function(input) {
        var options  = arguments.length > 2 ? arguments[1] : {},
            expected = arguments[arguments.length - 1],
            result;

        try {
          result = this.actual.parse(input, options);

          if (arguments.length > 1) {
            this.message = function() {
              return "Expected " + jasmine.pp(input) + " "
                   + "with options " + jasmine.pp(options) + " "
                   + (this.isNot ? "not " : "")
                   + "to parse as " + jasmine.pp(expected) + ", "
                   + "but it parsed as " + jasmine.pp(result) + ".";
            };

            return this.env.equals_(result, expected);
          } else {
            return true;
          }
        } catch (e) {
          this.message = function() {
            return "Expected " + jasmine.pp(input) + " "
                 + "with options " + jasmine.pp(options) + " "
                 + "to parse" + (arguments.length > 1 ? " as " + jasmine.pp(expected) : "") + ", "
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
                        : undefined,
            result;

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
                    this.message = function() {
                      return "Expected " + jasmine.pp(input) + " "
                           + "with options " + jasmine.pp(options) + " "
                           + "to fail to parse"
                           + (details ? " with details " + jasmine.pp(details) : "") + ", "
                           + "but " + jasmine.pp(key) + " "
                           + "is " + jasmine.pp(e[key]) + ".";
                    };

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

  varyOptimizationOptions(function(options) {
    describe("initializer", function() {
      it("executes the code before parsing starts", function() {
        var parser = PEG.buildParser([
              '{ var result = 42; }',
              'start = "a" { return result; }'
            ].join("\n"), options);

        expect(parser).toParse("a", 42);
      });

      describe("available variables and functions", function() {
        it("|parser| contains the parser object", function() {
          var parser = PEG.buildParser([
                '{ var result = parser; }',
                'start = "a" { return result; }'
              ].join("\n"), options);

          expect(parser).toParse("a", parser);
        });

        it("|options| contains options", function() {
          var parser = PEG.buildParser([
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
          var parser = PEG.buildParser([
                '{ var n = 0; }',
                'start = (a "b") / (a "c") { return n; }',
                'a = "a" { n++; }'
              ].join("\n"), options);

          expect(parser).toParse("ac", 1);
        });
      } else {
        it("doesn't cache rule match results", function() {
          var parser = PEG.buildParser([
                '{ var n = 0; }',
                'start = (a "b") / (a "c") { return n; }',
                'a = "a" { n++; }'
              ].join("\n"), options);

          expect(parser).toParse("ac", 2);
        });
      }

      describe("when the expression matches", function() {
        it("returns its match result", function() {
          var parser = PEG.buildParser('start = "a"');

          expect(parser).toParse("a", "a");
        });
      });

      describe("when the expression doesn't match", function() {
        describe("without display name", function() {
          it("reports match failure and doesn't record any expectation", function() {
            var parser = PEG.buildParser('start = "a"');

            expect(parser).toFailToParse("b", {
              expected: [{ type: "literal", value: "a", description: '"a"' }]
            });
          });
        });

        describe("with display name", function() {
          it("reports match failure and records an expectation of type \"other\"", function() {
            var parser = PEG.buildParser('start "start" = "a"');

            expect(parser).toFailToParse("b", {
              expected: [{ type: "other", description: "start" }]
            });
          });

          it("discards any expectations recorded when matching the expression", function() {
            var parser = PEG.buildParser('start "start" = "a"');

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
          var parser = PEG.buildParser('start = ""', options);

          expect(parser).toParse("");
        });

        it("matches one-character literals", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toParse("a");
          expect(parser).toFailToParse("b");
        });

        it("matches multi-character literals", function() {
          var parser = PEG.buildParser('start = "abcd"', options);

          expect(parser).toParse("abcd");
          expect(parser).toFailToParse("efgh");
        });

        it("is case sensitive without the \"i\" flag", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toParse("a");
          expect(parser).toFailToParse("A");
        });

        it("is case insensitive with the \"i\" flag", function() {
          var parser = PEG.buildParser('start = "a"i', options);

          expect(parser).toParse("a");
          expect(parser).toParse("A");
        });
      });

      describe("when it matches", function() {
        it("returns the matched text", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toParse("a", "a");
        });

        it("advances parse position past the matched text", function() {
          var parser = PEG.buildParser('start = "a" .', options);

          expect(parser).toParse("ab");
        });
      });

      describe("when it doesn't match", function() {
        it("reports match failure and records an expectation of type \"literal\"", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("b", {
            expected: [{ type: "literal", value: "a", description: '"a"' }]
          });
        });
      });
    });

    describe("character class", function() {
      describe("matching", function() {
        it("matches empty classes", function() {
          var parser = PEG.buildParser('start = []', options);

          expect(parser).toFailToParse("a");
        });

        it("matches classes with a character list", function() {
          var parser = PEG.buildParser('start = [abc]', options);

          expect(parser).toParse("a");
          expect(parser).toParse("b");
          expect(parser).toParse("c");
          expect(parser).toFailToParse("d");
        });

        it("matches classes with a character range", function() {
          var parser = PEG.buildParser('start = [a-c]', options);

          expect(parser).toParse("a");
          expect(parser).toParse("b");
          expect(parser).toParse("c");
          expect(parser).toFailToParse("d");
        });

        it("matches inverted classes", function() {
          var parser = PEG.buildParser('start = [^a]', options);

          expect(parser).toFailToParse("a");
          expect(parser).toParse("b");
        });

        it("is case sensitive without the \"i\" flag", function() {
          var parser = PEG.buildParser('start = [a]', options);

          expect(parser).toParse("a");
          expect(parser).toFailToParse("A");
        });

        it("is case insensitive with the \"i\" flag", function() {
          var parser = PEG.buildParser('start = [a]i', options);

          expect(parser).toParse("a");
          expect(parser).toParse("A");
        });
      });

      describe("when it matches", function() {
        it("returns the matched character", function() {
          var parser = PEG.buildParser('start = [a]', options);

          expect(parser).toParse("a", "a");
        });

        it("advances parse position past the matched character", function() {
          var parser = PEG.buildParser('start = [a] .', options);

          expect(parser).toParse("ab");
        });
      });

      describe("when it doesn't match", function() {
        it("reports match failure and records an expectation of type \"class\"", function() {
          var parser = PEG.buildParser('start = [a]', options);

          expect(parser).toFailToParse("b", {
            expected: [{ type: "class", value: "[a]", description: "[a]" }]
          });
        });
      });
    });

    describe("dot", function() {
      describe("matching", function() {
        it("matches any character", function() {
          var parser = PEG.buildParser('start = .', options);

          expect(parser).toParse("a");
          expect(parser).toParse("b");
          expect(parser).toParse("c");
        });
      });

      describe("when it matches", function() {
        it("returns the matched character", function() {
          var parser = PEG.buildParser('start = .', options);

          expect(parser).toParse("a", "a");
        });

        it("advances parse position past the matched character", function() {
          var parser = PEG.buildParser('start = . .', options);

          expect(parser).toParse("ab");
        });
      });

      describe("when it doesn't match", function() {
        it("reports match failure and records an expectation of type \"any\"", function() {
          var parser = PEG.buildParser('start = .', options);

          expect(parser).toFailToParse("", {
            expected: [{ type: "any", description: "any character" }]
          });
        });
      });
    });

    describe("rule reference", function() {
      describe("when referenced rule's expression matches", function() {
        it("returns its result", function() {
          var parser = PEG.buildParser([
                'start = a',
                'a = "a"',
              ].join("\n"), options);

          expect(parser).toParse("a", "a");
        });
      });

      describe("when referenced rule's expression doesn't match", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser([
                'start = a',
                'a = "a"',
              ].join("\n"), options);

          expect(parser).toFailToParse("b");
        });
      });
    });

    describe("positive semantic predicate", function() {
      describe("when the code returns a truthy value", function() {
        it("returns |undefined|", function() {
          var parser = PEG.buildParser('start = &{ return true; }', options);

          expect(parser).toParse("", undefined);
        });
      });

      describe("when the code returns a falsey value", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = &{ return false; }', options);

          expect(parser).toFailToParse("");
        });
      });

      describe("label variables", function() {
        it("can access label variables from preceding labeled elements in a sequence", function() {
          var parser = PEG.buildParser(
                'start = a:"a" b:"b" c:"c" &{ return a === "a" && b === "b" && c === "c"; }',
                options
              );

          expect(parser).toParse("abc");
        });

        it("can access label variables from preceding labeled elements in an outside sequence (group)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" &{ return a === "a" && b === "b" && c === "c"; })',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", ["d", undefined]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (optional)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" &{ return a === "a" && b === "b" && c === "c"; })?',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", ["d", undefined]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (zero or more)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" &{ return a === "a" && b === "b" && c === "c"; })*',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", [["d", undefined]]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (one or more)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" &{ return a === "a" && b === "b" && c === "c"; })+',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", [["d", undefined]]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (text)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" $("d" &{ return a === "a" && b === "b" && c === "c"; })',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", "d"]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (positive simple predicate)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" &("d" &{ return a === "a" && b === "b" && c === "c"; }) "d"',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", undefined, "d"]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (negative simple predicate)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" !("d" &{ return a === "a" && b === "b" && c === "c"; }) "e"',
            options
          );

          expect(parser).toParse("abce", ["a", "b", "c", undefined, "e"]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (label)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" d:("d" &{ return a === "a" && b === "b" && c === "c"; })',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", ["d", undefined]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (sequence)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" "e" "f" &{ return a === "a" && b === "b" && c === "c"; })',
            options
          );

          expect(parser).toParse("abcdef", ["a", "b", "c", ["d", "e", "f", undefined]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (action)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" (d:("d" &{ return a === "a" && b === "b" && c === "c"; }) { return d; })',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", ["d", undefined]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (choice)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" / "e" / "f" &{ return a === "a" && b === "b" && c === "c"; })',
            options
          );

          expect(parser).toParse("abcf", ["a", "b", "c", ["f", undefined]]);
        });
      });

      describe("initializer variables & functions", function() {
        it("can access variables defined in the initializer", function() {
          var parser = PEG.buildParser([
                '{ var v = 42 }',
                'start = &{ return v === 42; }'
              ].join("\n"), options);

          expect(parser).toParse("");
        });

        it("can access functions defined in the initializer", function() {
          var parser = PEG.buildParser([
                '{ function f() { return 42; } }',
                'start = &{ return f() === 42; }'
              ].join("\n"), options);

          expect(parser).toParse("");
        });
      });

      describe("available variables & functions", function() {
        it("|parser| contains the parser object", function() {
          var parser = PEG.buildParser([
                '{ var result; }',
                'start = &{ result = parser; return true; } { return result; }'
              ].join("\n"), options);

          expect(parser).toParse("", parser);
        });

        it("|options| contains options", function() {
          var parser = PEG.buildParser([
                '{ var result; }',
                'start = &{ result = options; return true; } { return result; }'
              ].join("\n"), options);

          expect(parser).toParse("", { a: 42 }, { a: 42 });
        });

        it("|location| returns current location info", function() {
          var parser = PEG.buildParser([
                '{ var result; }',
                'start  = line (nl+ line)* { return result; }',
                'line   = thing (" "+ thing)*',
                'thing  = digit / mark',
                'digit  = [0-9]',
                'mark   = &{ result = location(); return true; } "x"',
                'nl     = [\\r"\\n\\u2028\\u2029]'
              ].join("\n"), options);

          expect(parser).toParse("1\n2\n\n3\n\n\n4 5 x", {
            start: { offset: 13, line: 7, column: 5 },
            end:   { offset: 13, line: 7, column: 5 },
          });

          /* Non-Unix newlines */
          expect(parser).toParse("1\rx", {     // Old Mac
            start: { offset: 2, line: 2, column: 1 },
            end:   { offset: 2, line: 2, column: 1 },
          });
          expect(parser).toParse("1\r\nx", {   // Windows
            start: { offset: 3, line: 2, column: 1 },
            end:   { offset: 3, line: 2, column: 1 },
          });
          expect(parser).toParse("1\n\rx", {   // mismatched
            start: { offset: 3, line: 3, column: 1 },
            end:   { offset: 3, line: 3, column: 1 },
          });

          /* Strange newlines */
          expect(parser).toParse("1\u2028x", {   // line separator
            start: { offset: 2, line: 2, column: 1 },
            end:   { offset: 2, line: 2, column: 1 },
          });
          expect(parser).toParse("1\u2029x", {   // paragraph separator
            start: { offset: 2, line: 2, column: 1 },
            end:   { offset: 2, line: 2, column: 1 },
          });
        });
      });
    });

    describe("negative semantic predicate", function() {
      describe("when the code returns a falsey value", function() {
        it("returns |undefined|", function() {
          var parser = PEG.buildParser('start = !{ return false; }', options);

          expect(parser).toParse("", undefined);
        });
      });

      describe("when the code returns a truthy value", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = !{ return true; }', options);

          expect(parser).toFailToParse("");
        });
      });

      describe("label variables", function() {
        it("can access label variables from preceding labeled elements in a sequence", function() {
          var parser = PEG.buildParser(
                'start = a:"a" b:"b" c:"c" !{ return a !== "a" || b !== "b" || c !== "c"; }',
                options
              );

          expect(parser).toParse("abc");
        });

        it("can access label variables from preceding labeled elements in an outside sequence (optional)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" !{ return a !== "a" || b !== "b" || c !== "c"; })?',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", ["d", undefined]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (zero or more)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" !{ return a !== "a" || b !== "b" || c !== "c"; })*',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", [["d", undefined]]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (one or more)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" !{ return a !== "a" || b !== "b" || c !== "c"; })+',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", [["d", undefined]]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (text)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" $("d" !{ return a !== "a" || b !== "b" || c !== "c"; })',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", "d"]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (positive simple predicate)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" &("d" !{ return a !== "a" || b !== "b" || c !== "c"; }) "d"',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", undefined, "d"]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (negative simple predicate)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" !("d" !{ return a !== "a" || b !== "b" || c !== "c"; }) "e"',
            options
          );

          expect(parser).toParse("abce", ["a", "b", "c", undefined, "e"]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (label)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" d:("d" !{ return a !== "a" || b !== "b" || c !== "c"; })',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", ["d", undefined]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (sequence)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" "e" "f" !{ return a !== "a" || b !== "b" || c !== "c"; })',
            options
          );

          expect(parser).toParse("abcdef", ["a", "b", "c", ["d", "e", "f", undefined]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (action)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" (d:("d" !{ return a !== "a" || b !== "b" || c !== "c"; }) { return d; })',
            options
          );

          expect(parser).toParse("abcd", ["a", "b", "c", ["d", undefined]]);
        });

        it("can access label variables from preceding labeled elements in an outside sequence (choice)", function() {
          var parser = PEG.buildParser(
            'start = a:"a" b:"b" c:"c" ("d" / "e" / "f" !{ return a !== "a" || b !== "b" || c !== "c"; })',
            options
          );

          expect(parser).toParse("abcf", ["a", "b", "c", ["f", undefined]]);
        });
      });

      describe("initializer variables & functions", function() {
        it("can access variables defined in the initializer", function() {
          var parser = PEG.buildParser([
                '{ var v = 42 }',
                'start = !{ return v !== 42; }'
              ].join("\n"), options);

          expect(parser).toParse("");
        });

        it("can access functions defined in the initializer", function() {
          var parser = PEG.buildParser([
                '{ function f() { return 42; } }',
                'start = !{ return f() !== 42; }'
              ].join("\n"), options);

          expect(parser).toParse("");
        });
      });

      describe("available variables & functions", function() {
        it("|parser| contains the parser object", function() {
          var parser = PEG.buildParser([
                '{ var result; }',
                'start = !{ result = parser; return false; } { return result; }'
              ].join("\n"), options);

          expect(parser).toParse("", parser);
        });

        it("|options| contains options", function() {
          var parser = PEG.buildParser([
                '{ var result; }',
                'start = !{ result = options; return false; } { return result; }'
              ].join("\n"), options);

          expect(parser).toParse("", { a: 42 }, { a: 42 });
        });

        it("|location| returns current location info", function() {
          var parser = PEG.buildParser([
                '{ var result; }',
                'start  = line (nl+ line)* { return result; }',
                'line   = thing (" "+ thing)*',
                'thing  = digit / mark',
                'digit  = [0-9]',
                'mark   = !{ result = location(); return false; } "x"',
                'nl     = [\\r"\\n\\u2028\\u2029]'
              ].join("\n"), options);

          expect(parser).toParse("1\n2\n\n3\n\n\n4 5 x", {
            start: { offset: 13, line: 7, column: 5 },
            end:   { offset: 13, line: 7, column: 5 },
          });

          /* Non-Unix newlines */
          expect(parser).toParse("1\rx", {     // Old Mac
            start: { offset: 2, line: 2, column: 1 },
            end:   { offset: 2, line: 2, column: 1 },
          });
          expect(parser).toParse("1\r\nx", {   // Windows
            start: { offset: 3, line: 2, column: 1 },
            end:   { offset: 3, line: 2, column: 1 },
          });
          expect(parser).toParse("1\n\rx", {   // mismatched
            start: { offset: 3, line: 3, column: 1 },
            end:   { offset: 3, line: 3, column: 1 },
          });

          /* Strange newlines */
          expect(parser).toParse("1\u2028x", {   // line separator
            start: { offset: 2, line: 2, column: 1 },
            end:   { offset: 2, line: 2, column: 1 },
          });
          expect(parser).toParse("1\u2029x", {   // paragraph separator
            start: { offset: 2, line: 2, column: 1 },
            end:   { offset: 2, line: 2, column: 1 },
          });
        });
      });
    });

    describe("group", function() {
      describe("when the expression matches", function() {
        it("returns its match result", function() {
          var parser = PEG.buildParser('start = ("a")', options);

          expect(parser).toParse("a", "a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = ("a")', options);

          expect(parser).toFailToParse("b");
        });
      });
    });

    describe("optional", function() {
      describe("when the expression matches", function() {
        it("returns its match result", function() {
          var parser = PEG.buildParser('start = "a"?', options);

          expect(parser).toParse("a", "a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("returns |null|", function() {
          var parser = PEG.buildParser('start = "a"?', options);

          expect(parser).toParse("", null);
        });
      });
    });

    describe("zero or more", function() {
      describe("when the expression matches zero or more times", function() {
        it("returns an array of its match results", function() {
          var parser = PEG.buildParser('start = "a"*', options);

          expect(parser).toParse("",    []);
          expect(parser).toParse("a",   ["a"]);
          expect(parser).toParse("aaa", ["a", "a", "a"]);
        });
      });
    });

    describe("one or more", function() {
      describe("when the expression matches one or more times", function() {
        it("returns an array of its match results", function() {
          var parser = PEG.buildParser('start = "a"+', options);

          expect(parser).toParse("a",   ["a"]);
          expect(parser).toParse("aaa", ["a", "a", "a"]);
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = "a"+', options);

          expect(parser).toFailToParse("");
        });
      });
    });

    describe("text", function() {
      describe("when the expression matches", function() {
        it("returns the matched text", function() {
          var parser = PEG.buildParser('start = $("a" "b" "c")', options);

          expect(parser).toParse("abc", "abc");
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = $("a")', options);

          expect(parser).toFailToParse("b");
        });
      });
    });

    describe("positive simple predicate", function() {
      describe("when the expression matches", function() {
        it("returns |undefined|", function() {
          var parser = PEG.buildParser('start = &"a" "a"', options);

          expect(parser).toParse("a", [undefined, "a"]);
        });

        it("resets parse position", function() {
          var parser = PEG.buildParser('start = &"a" "a"', options);

          expect(parser).toParse("a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = &"a"', options);

          expect(parser).toFailToParse("b");
        });

        it("discards any expectations recorded when matching the expression", function() {
          var parser = PEG.buildParser('start = "a" / &"b" / "c"', options);

          expect(parser).toFailToParse("d", {
            expected: [
              { type: "literal", value: "a", description: '"a"' },
              { type: "literal", value: "c", description: '"c"' }
            ]
          });
        });
      });
    });

    describe("negative simple predicate", function() {
      describe("when the expression matches", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = !"a"', options);

          expect(parser).toFailToParse("a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("returns |undefined|", function() {
          var parser = PEG.buildParser('start = !"a" "b"', options);

          expect(parser).toParse("b", [undefined, "b"]);
        });

        it("resets parse position", function() {
          var parser = PEG.buildParser('start = !"a" "b"', options);

          expect(parser).toParse("b");
        });

        it("discards any expectations recorded when matching the expression", function() {
          var parser = PEG.buildParser('start = "a" / !"b" / "c"', options);

          expect(parser).toFailToParse("b", {
            expected: [
              { type: "literal", value: "a", description: '"a"' },
              { type: "literal", value: "c", description: '"c"' }
            ]
          });
        });
      });
    });

    describe("label", function() {
      describe("when the expression matches", function() {
        it("returns its match result", function() {
          var parser = PEG.buildParser('start = a:"a"', options);

          expect(parser).toParse("a", "a");
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = a:"a"', options);

          expect(parser).toFailToParse("b");
        });
      });
    });

    describe("sequence", function() {
      describe("when all expressions match", function() {
        it("returns an array of their match results", function() {
          var parser = PEG.buildParser('start = "a" "b" "c"', options);

          expect(parser).toParse("abc", ["a", "b", "c"]);
        });
      });

      describe("when any expression doesn't match", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = "a" "b" "c"', options);

          expect(parser).toFailToParse("dbc");
          expect(parser).toFailToParse("adc");
          expect(parser).toFailToParse("abd");
        });

        it("resets parse position", function() {
          var parser = PEG.buildParser('start = "a" "b" / "a"', options);

          expect(parser).toParse("a", "a");
        });
      });
    });

    describe("action", function() {
      describe("when the expression matches", function() {
        it("returns the value returned by the code", function() {
          var parser = PEG.buildParser('start = "a" { return 42; }', options);

          expect(parser).toParse("a", 42);
        });

        describe("label variables", function() {
          it("can access label variables from a labeled expression", function() {
            var parser = PEG.buildParser('start = a:"a" { return a; }', options);

            expect(parser).toParse("a", "a");
          });

          it("can access label variables from a sequence with labeled elements", function() {
            var parser = PEG.buildParser(
                  'start = a:"a" b:"b" c:"c" { return [a, b, c]; }',
                  options
                );

            expect(parser).toParse("abc", ["a", "b", "c"]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (group)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" ("d" { return [a, b, c]; })',
              options
            );

            expect(parser).toParse("abcd", ["a", "b", "c", ["a", "b", "c"]]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (optional)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" ("d" { return [a, b, c]; })?',
              options
            );

            expect(parser).toParse("abcd", ["a", "b", "c", ["a", "b", "c"]]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (zero or more)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" ("d" { return [a, b, c]; })*',
              options
            );

            expect(parser).toParse("abcd", ["a", "b", "c", [["a", "b", "c"]]]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (one or more)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" ("d" { return [a, b, c]; })+',
              options
            );

            expect(parser).toParse("abcd", ["a", "b", "c", [["a", "b", "c"]]]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (text)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" $("d" { return [a, b, c]; })',
              options
            );

            expect(parser).toParse("abcd", ["a", "b", "c", "d"]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (positive simple predicate)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" &("d" { return [a, b, c]; }) "d"',
              options
            );

            expect(parser).toParse("abcd", ["a", "b", "c", undefined, "d"]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (negative simple predicate)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" !("d" { return [a, b, c]; }) "e"',
              options
            );

            expect(parser).toParse("abce", ["a", "b", "c", undefined, "e"]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (label)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" d:("d" { return [a, b, c]; })',
              options
            );

            expect(parser).toParse("abcd", ["a", "b", "c", ["a", "b", "c"]]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (sequence)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" ("d" "e" ("f" { return [a, b, c]; }))',
              options
            );

            expect(parser).toParse("abcdef", ["a", "b", "c", ["d", "e", ["a", "b", "c"]]]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (action)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" (d:("d" { return [a, b, c]; }) { return d; })',
              options
            );

            expect(parser).toParse("abcd", ["a", "b", "c", ["a", "b", "c"]]);
          });

          it("can access label variables from preceding labeled elements in an outside sequence (choice)", function() {
            var parser = PEG.buildParser(
              'start = a:"a" b:"b" c:"c" ("d" / "e" / "f" { return [a, b, c]; })',
              options
            );

            expect(parser).toParse("abcf", ["a", "b", "c", ["a", "b", "c"]]);
          });
        });

        describe("initializer variables & functions", function() {
          it("can access variables defined in the initializer", function() {
            var parser = PEG.buildParser([
                  '{ var v = 42 }',
                  'start = "a" { return v; }'
                ].join("\n"), options);

            expect(parser).toParse("a", 42);
          });

          it("can access functions defined in the initializer", function() {
            var parser = PEG.buildParser([
                  '{ function f() { return 42; } }',
                  'start = "a" { return f(); }'
                ].join("\n"), options);

            expect(parser).toParse("a", 42);
          });
        });

        describe("available variables & functions", function() {
          it("|parser| contains the parser object", function() {
            var parser = PEG.buildParser(
                  'start = "a" { return parser; }',
                  options
                );

            expect(parser).toParse("a", parser);
          });

          it("|options| contains options", function() {
            var parser = PEG.buildParser(
                  'start = "a" { return options; }',
                  options
                );

            expect(parser).toParse("a", { a: 42 }, { a: 42 });
          });

          it("|text| returns text matched by the expression", function() {
            var parser = PEG.buildParser(
                  'start = "a" { return text(); }',
                  options
                );

            expect(parser).toParse("a", "a");
          });

          it("|location| returns location info of the expression", function() {
            var parser = PEG.buildParser([
                  '{ var result; }',
                  'start  = line (nl+ line)* { return result; }',
                  'line   = thing (" "+ thing)*',
                  'thing  = digit / mark',
                  'digit  = [0-9]',
                  'mark   = "x" { result = location(); }',
                  'nl     = [\\r\\n\\u2028\\u2029]'
                ].join("\n"), options);

            expect(parser).toParse("1\n2\n\n3\n\n\n4 5 x", {
              start: { offset: 13, line: 7, column: 5 },
              end:   { offset: 14, line: 7, column: 6 },
            });

            /* Non-Unix newlines */
            expect(parser).toParse("1\rx", {     // Old Mac
              start: { offset: 2, line: 2, column: 1 },
              end:   { offset: 3, line: 2, column: 2 },
            });
            expect(parser).toParse("1\r\nx", {   // Windows
              start: { offset: 3, line: 2, column: 1 },
              end:   { offset: 4, line: 2, column: 2 },
            });
            expect(parser).toParse("1\n\rx", {   // mismatched
              start: { offset: 3, line: 3, column: 1 },
              end:   { offset: 4, line: 3, column: 2 },
            });

            /* Strange newlines */
            expect(parser).toParse("1\u2028x", {   // line separator
              start: { offset: 2, line: 2, column: 1 },
              end:   { offset: 3, line: 2, column: 2 },
            });
            expect(parser).toParse("1\u2029x", {   // paragraph separator
              start: { offset: 2, line: 2, column: 1 },
              end:   { offset: 3, line: 2, column: 2 },
            });
          });

          it("|expected| terminates parsing and throws an exception", function() {
            var parser = PEG.buildParser(
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

          it("|error| terminates parsing and throws an exception", function() {
            var parser = PEG.buildParser(
                  'start = "a" { error("a"); }',
                  options
                );

            expect(parser).toFailToParse("a", {
              message:  "a",
              expected: null,
              found:    "a",
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end:   { offset: 1, line: 1, column: 2 }
              }
            });
          });
        });
      });

      describe("when the expression doesn't match", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = "a" { return 42; }', options);

          expect(parser).toFailToParse("b");
        });

        it("doesn't execute the code", function() {
          var parser = PEG.buildParser(
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
          var parser = PEG.buildParser('start = "a" / "b" / "c"', options);

          expect(parser).toParse("a", "a");
          expect(parser).toParse("b", "b");
          expect(parser).toParse("c", "c");
        });
      });

      describe("when all expressions don't match", function() {
        it("reports match failure", function() {
          var parser = PEG.buildParser('start = "a" / "b" / "c"', options);

          expect(parser).toFailToParse("d");
        });
      });
    });

    describe("error reporting", function() {
      describe("behavior", function() {
        it("reports only the rightmost error", function() {
          var parser = PEG.buildParser('start = "a" "b" / "a" "c" "d"', options);

          expect(parser).toFailToParse("ace", {
            expected: [{ type: "literal", value: "d", description: '"d"' }]
          });
        });
      });

      describe("expectations reporting", function() {
        it("reports expectations correctly with no alternative", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("ab", {
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
           * See https://github.com/pegjs/pegjs/pull/146.
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
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("ab", {
            message: 'Expected end of input but "b" found.'
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
        it("reports position correctly at the end of input", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("", {
            location: {
              start: { offset: 0, line: 1, column: 1 },
              end:   { offset: 0, line: 1, column: 1 }
            }
          });
        });

        it("reports position correctly in the middle of input", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("b", {
            location: {
              start: { offset: 0, line: 1, column: 1 },
              end:   { offset: 1, line: 1, column: 2 }
            }
          });
        });

        it("reports position correctly with trailing input", function() {
          var parser = PEG.buildParser('start = "a"', options);

          expect(parser).toFailToParse("aa", {
            location: {
              start: { offset: 1, line: 1, column: 2 },
              end:   { offset: 2, line: 1, column: 3 }
            }
          });
        });

        it("reports position correctly in complex cases", function() {
          var parser = PEG.buildParser([
                'start  = line (nl+ line)*',
                'line   = digit (" "+ digit)*',
                'digit  = [0-9]',
                'nl     = [\\r\\n\\u2028\\u2029]'
              ].join("\n"), options);

          expect(parser).toFailToParse("1\n2\n\n3\n\n\n4 5 x", {
            location: {
              start: { offset: 13, line: 7, column: 5 },
              end:   { offset: 14, line: 7, column: 6 }
            }
          });

          /* Non-Unix newlines */
          expect(parser).toFailToParse("1\rx", {     // Old Mac
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
          expect(parser).toFailToParse("1\n\rx", {   // mismatched
            location: {
              start: { offset: 3, line: 3, column: 1 },
              end:   { offset: 4, line: 3, column: 2 }
            }
          });

          /* Strange newlines */
          expect(parser).toFailToParse("1\u2028x", {   // line separator
            location: {
              start: { offset: 2, line: 2, column: 1 },
              end:   { offset: 3, line: 2, column: 2 }
            }
          });
          expect(parser).toFailToParse("1\u2029x", {   // paragraph separator
            location: {
              start: { offset: 2, line: 2, column: 1 },
              end:   { offset: 3, line: 2, column: 2 }
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
        var parser = PEG.buildParser([
              'Expr    = Sum',
              'Sum     = first:Product rest:(("+" / "-") Product)* {',
              '            var result = first, i;',
              '            for (i = 0; i < rest.length; i++) {',
              '              if (rest[i][0] == "+") { result += rest[i][1]; }',
              '              if (rest[i][0] == "-") { result -= rest[i][1]; }',
              '            }',
              '            return result;',
              '          }',
              'Product = first:Value rest:(("*" / "/") Value)* {',
              '            var result = first, i;',
              '            for (i = 0; i < rest.length; i++) {',
              '              if (rest[i][0] == "*") { result *= rest[i][1]; }',
              '              if (rest[i][0] == "/") { result /= rest[i][1]; }',
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
