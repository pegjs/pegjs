"use strict";

let chai = require("chai");
let peg = require("../../lib/peg");

let expect = chai.expect;

describe("plugin API", function() {
  describe("use", function() {
    let grammar = "start = 'a'";

    it("is called for each plugin", function() {
      let pluginsUsed = [false, false, false];
      let plugins = [
        { use() { pluginsUsed[0] = true; } },
        { use() { pluginsUsed[1] = true; } },
        { use() { pluginsUsed[2] = true; } }
      ];

      peg.generate(grammar, { plugins: plugins });

      expect(pluginsUsed).to.deep.equal([true, true, true]);
    });

    it("receives configuration", function() {
      let plugin = {
        use(config) {
          expect(config).to.be.an("object");

          expect(config.parser).to.be.an("object");
          expect(config.parser.parse("start = 'a'")).to.be.an("object");

          expect(config.passes).to.be.an("object");

          expect(config.passes.check).to.be.an("array");
          config.passes.check.forEach(pass => {
            expect(pass).to.be.a("function");
          });

          expect(config.passes.transform).to.be.an("array");
          config.passes.transform.forEach(pass => {
            expect(pass).to.be.a("function");
          });

          expect(config.passes.generate).to.be.an("array");
          config.passes.generate.forEach(pass => {
            expect(pass).to.be.a("function");
          });
        }
      };

      peg.generate(grammar, { plugins: [plugin] });
    });

    it("receives options", function() {
      let plugin = {
        use(config, options) {
          expect(options).to.equal(generateOptions);
        }
      };
      let generateOptions = { plugins: [plugin], foo: 42 };

      peg.generate(grammar, generateOptions);
    });

    it("can replace parser", function() {
      let plugin = {
        use(config) {
          let parser = peg.generate([
            "start = .* {",
            "  return {",
            "    type: 'grammar',",
            "    rules: [",
            "      {",
            "        type: 'rule',",
            "        name: 'start',",
            "        expression: { type: 'literal',  value: text(), ignoreCase: false }",
            "      }",
            "    ]",
            "  };",
            "}"
          ].join("\n"));

          config.parser = parser;
        }
      };
      let parser = peg.generate("a", { plugins: [plugin] });

      expect(parser.parse("a")).to.equal("a");
    });

    it("can change compiler passes", function() {
      let plugin = {
        use(config) {
          function pass(ast) {
            ast.code = "({ parse: function() { return 42; } })";
          }

          config.passes.generate = [pass];
        }
      };
      let parser = peg.generate(grammar, { plugins: [plugin] });

      expect(parser.parse("a")).to.equal(42);
    });

    it("can change options", function() {
      let grammar = [
        "a = 'x'",
        "b = 'x'",
        "c = 'x'"
      ].join("\n");
      let plugin = {
        use(config, options) {
          options.allowedStartRules = ["b", "c"];
        }
      };
      let parser = peg.generate(grammar, {
        allowedStartRules: ["a"],
        plugins: [plugin]
      });

      expect(() => { parser.parse("x", { startRule: "a" }); }).to.throw();
      expect(parser.parse("x", { startRule: "b" })).to.equal("x");
      expect(parser.parse("x", { startRule: "c" })).to.equal("x");
    });
  });
});
