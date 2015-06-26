/*
 * PEG.js 0.8.0
 *
 * http://pegjs.org/
 *
 * Copyright (c) 2010-2013 David Majda
 * Licensed under the MIT license.
 */
var PEG = (function(undefined) {
  "use strict";
  var modules = {
    define: function(name, factory) {
      var dir    = name.replace(/(^|\/)[^/]+$/, "$1"),
          module = { exports: {} };

      function require(path) {
        var name   = dir + path,
            regexp = /[^\/]+\/\.\.\/|\.\//;

        /* Can't use /.../g because we can move backwards in the string. */
        while (regexp.test(name)) {
          name = name.replace(regexp, "");
        }

        if (!modules[name]) {
          throw new Error("Module not found: " + name);
        }

        return modules[name];
      }

      function readSource(path) {
        return require(path).code;
      }

      factory(module, require, readSource);
      this[name] = module.exports;
    }
  };

/*$MODULES*/

  return modules.peg;
})();
