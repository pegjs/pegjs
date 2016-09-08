"use strict";

var peg = require("../../lib/peg");

describe("plugin API", function() {
  beforeEach(function() {
    this.addMatchers({
      toBeObject: function() {
        this.message = function() {
          return "Expected " + jasmine.pp(this.actual) + " "
               + (this.isNot ? "not " : "")
               + "to be an object.";
        };

        return this.actual !== null && typeof this.actual === "object";
      },

      toBeArray: function() {
        this.message = function() {
          return "Expected " + jasmine.pp(this.actual) + " "
               + (this.isNot ? "not " : "")
               + "to be an array.";
        };

        return Object.prototype.toString.apply(this.actual) === "[object Array]";
      },

      toBeFunction: function() {
        this.message = function() {
          return "Expected " + jasmine.pp(this.actual) + " "
               + (this.isNot ? "not " : "")
               + "to be a function.";
        };

        return typeof this.actual === "function";
      }
    });
  });

  describe("use", function() {
    var grammar = 'start = "a"';

    it("is called for each plugin", function() {
      var pluginsUsed = [false, false, false],
          plugins     = [
            { use: function() { pluginsUsed[0] = true; } },
            { use: function() { pluginsUsed[1] = true; } },
            { use: function() { pluginsUsed[2] = true; } }
          ];

      peg.generate(grammar, { plugins: plugins });

      expect(pluginsUsed).toEqual([true, true, true]);
    });

    it("receives configuration", function() {
      var plugin = {
            use: function(config) {
              expect(config).toBeObject();

              expect(config.parser).toBeObject();
              expect(config.parser.parse('start = "a"')).toBeObject();

              expect(config.passes).toBeObject();

              expect(config.passes.check).toBeArray();
              config.passes.check.forEach(function(pass) {
                expect(pass).toBeFunction();
              });

              expect(config.passes.transform).toBeArray();
              config.passes.transform.forEach(function(pass) {
                expect(pass).toBeFunction();
              });

              expect(config.passes.generate).toBeArray();
              config.passes.generate.forEach(function(pass) {
                expect(pass).toBeFunction();
              });
            }
          };

      peg.generate(grammar, { plugins: [plugin] });
    });

    it("receives options", function() {
      var plugin             = {
            use: function(config, options) {
              expect(options).toEqual(generateOptions);
            }
          },
          generateOptions = { plugins: [plugin], foo: 42 };

      peg.generate(grammar, generateOptions);
    });

    it("can replace parser", function() {
      var plugin = {
            use: function(config) {
              var parser = peg.generate([
                    'start = .* {',
                    '  return {',
                    '    type:  "grammar",',
                    '    rules: [',
                    '      {',
                    '        type:       "rule",',
                    '        name:       "start",',
                    '        expression: { type: "literal",  value: text(), ignoreCase: false }',
                    '      }',
                    '    ]',
                    '  };',
                    '}'
                  ].join("\n"));

              config.parser = parser;
            }
          },
          parser = peg.generate('a', { plugins: [plugin] });

      expect(parser.parse("a")).toBe("a");
    });

    it("can change compiler passes", function() {
      var plugin = {
            use: function(config) {
              var pass = function(ast) {
                    ast.code = '({ parse: function() { return 42; } })';
                  };

              config.passes.generate = [pass];
            }
          },
          parser = peg.generate(grammar, { plugins: [plugin] });

      expect(parser.parse("a")).toBe(42);
    });

    it("can change options", function() {
      var grammar = [
            'a = "x"',
            'b = "x"',
            'c = "x"'
          ].join("\n"),
          plugin  = {
            use: function(config, options) {
              options.allowedStartRules = ["b", "c"];
            }
          },
          parser  = peg.generate(grammar, {
            allowedStartRules: ["a"],
            plugins:           [plugin]
          });

      expect(function() { parser.parse("x", { startRule: "a" }); }).toThrow();
      expect(parser.parse("x", { startRule: "b" })).toBe("x");
      expect(parser.parse("x", { startRule: "c" })).toBe("x");
    });
  });
});
