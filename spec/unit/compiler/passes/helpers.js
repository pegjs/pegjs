"use strict";

let peg = require("../../../../lib/peg");

beforeEach(function() {
  this.addMatchers({
    toChangeAST(grammar, details, options) {
      options = options !== undefined ? options : {};

      function matchDetails(value, details) {
        function isArray(value) {
          return Object.prototype.toString.apply(value) === "[object Array]";
        }

        function isObject(value) {
          return value !== null && typeof value === "object";
        }

        if (isArray(details)) {
          if (!isArray(value)) { return false; }

          if (value.length !== details.length) { return false; }
          for (let i = 0; i < details.length; i++) {
            if (!matchDetails(value[i], details[i])) { return false; }
          }

          return true;
        } else if (isObject(details)) {
          if (!isObject(value)) { return false; }

          let keys = Object.keys(details);
          for (let i = 0; i < keys.length; i++) {
            let key = keys[i];

            if (!(key in value)) { return false; }

            if (!matchDetails(value[key], details[key])) { return false; }
          }

          return true;
        } else {
          return value === details;
        }
      }

      let ast = peg.parser.parse(grammar);

      this.actual(ast, options);

      this.message = () =>
        "Expected the pass "
          + "with options " + jasmine.pp(options) + " "
          + (this.isNot ? "not " : "")
          + "to change the AST " + jasmine.pp(ast) + " "
          + "to match " + jasmine.pp(details) + ", "
          + "but it " + (this.isNot ? "did" : "didn't") + ".";

      return matchDetails(ast, details);
    },

    toReportError(grammar, details) {
      let ast = peg.parser.parse(grammar);

      try {
        this.actual(ast);
      } catch (e) {
        if (this.isNot) {
          this.message = () =>
            "Expected the pass not to report an error "
              + "for grammar " + jasmine.pp(grammar) + ", "
              + "but it did.";
        } else {
          if (details) {
            let keys = Object.keys(details);
            for (let i = 0; i < keys.length; i++) {
              let key = keys[i];

              if (!this.env.equals_(e[key], details[key])) {
                this.message = () =>
                  "Expected the pass to report an error "
                    + "with details " + jasmine.pp(details) + " "
                    + "for grammar " + jasmine.pp(grammar) + ", "
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
        "Expected the pass to report an error "
          + (details ? "with details " + jasmine.pp(details) + " " : "")
          + "for grammar " + jasmine.pp(grammar) + ", "
          + "but it didn't.";

      return false;
    }
  });
});
