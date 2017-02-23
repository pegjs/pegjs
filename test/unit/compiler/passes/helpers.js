"use strict";

let parser = require("../../../../lib/parser");

module.exports = function(chai, utils) {
  let Assertion = chai.Assertion;

  Assertion.addMethod("changeAST", function(grammar, props, options) {
    options = options !== undefined ? options : {};

    function matchProps(value, props) {
      function isArray(value) {
        return Object.prototype.toString.apply(value) === "[object Array]";
      }

      function isObject(value) {
        return value !== null && typeof value === "object";
      }

      if (isArray(props)) {
        if (!isArray(value)) { return false; }

        if (value.length !== props.length) { return false; }
        for (let i = 0; i < props.length; i++) {
          if (!matchProps(value[i], props[i])) { return false; }
        }

        return true;
      } else if (isObject(props)) {
        if (!isObject(value)) { return false; }

        let keys = Object.keys(props);
        for (let i = 0; i < keys.length; i++) {
          let key = keys[i];

          if (!(key in value)) { return false; }

          if (!matchProps(value[key], props[key])) { return false; }
        }

        return true;
      } else {
        return value === props;
      }
    }

    let ast = parser.parse(grammar);

    utils.flag(this, "object")(ast, options);

    this.assert(
      matchProps(ast, props),
      "expected #{this} to change the AST to match #{exp}",
      "expected #{this} to not change the AST to match #{exp}",
      props,
      ast
    );
  });

  Assertion.addMethod("reportError", function(grammar, props) {
    let ast = parser.parse(grammar);

    let passed, result;

    try {
      utils.flag(this, "object")(ast);
      passed = true;
    } catch (e) {
      result = e;
      passed = false;
    }

    this.assert(
      !passed,
      "expected #{this} to report an error but it didn't",
      "expected #{this} to not report an error but #{act} was reported",
      null,
      result
    );

    if (!passed && props !== undefined) {
      Object.keys(props).forEach(key => {
        new Assertion(result).to.have.property(key)
          .that.is.deep.equal(props[key]);
      });
    }
  });
};
