/* global beforeEach, jasmine, PEG */

"use strict";

beforeEach(function() {
  this.addMatchers({
    toChangeAST: function(grammar) {
      function matchDetails(value, details) {
        function isArray(value) {
          return Object.prototype.toString.apply(value) === "[object Array]";
        }

        function isObject(value) {
          return value !== null && typeof value === "object";
        }

        var i, key;

        if (isArray(details)) {
          if (!isArray(value)) { return false; }

          if (value.length !== details.length) { return false; }
          for (i = 0; i < details.length; i++) {
            if (!matchDetails(value[i], details[i])) { return false; }
          }

          return true;
        } else if (isObject(details)) {
          if (!isObject(value)) { return false; }

          for (key in details) {
            if (details.hasOwnProperty(key)) {
              if (!(key in value)) { return false; }

              if (!matchDetails(value[key], details[key])) { return false; }
            }
          }

          return true;
        } else {
          return value === details;
        }
      }

      var options = arguments.length > 2 ? arguments[1] : {},
          details = arguments[arguments.length - 1],
          ast     = PEG.parser.parse(grammar);

      this.actual(ast, options);

      this.message = function() {
        return "Expected the pass "
             + "with options " + jasmine.pp(options) + " "
             + (this.isNot ? "not " : "")
             + "to change the AST " + jasmine.pp(ast) + " "
             + "to match " + jasmine.pp(details) + ", "
             + "but it " + (this.isNot ? "did" : "didn't") + ".";
      };

      return matchDetails(ast, details);
    },

    toReportError: function(grammar, details) {
      var ast = PEG.parser.parse(grammar);

      try {
        this.actual(ast);

        this.message = function() {
          return "Expected the pass to report an error "
               + (details ? "with details " + jasmine.pp(details) + " ": "")
               + "for grammar " + jasmine.pp(grammar) + ", "
               + "but it didn't.";
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
            return "Expected the pass not to report an error "
                 + "for grammar " + jasmine.pp(grammar) + ", "
                 + "but it did.";
          };
        } else {
          if (details) {
            for (key in details) {
              if (details.hasOwnProperty(key)) {
                if (!this.env.equals_(e[key], details[key])) {
                  this.message = function() {
                    return "Expected the pass to report an error "
                         + "with details " + jasmine.pp(details) + " "
                         + "for grammar " + jasmine.pp(grammar) + ", "
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
