var utils        = require("./utils"),
    GrammarError = require("./grammar-error");

module.exports = {
  /*
   * Compiler passes.
   *
   * Each pass is a function that is passed the AST. It can perform checks on it
   * or modify it as needed. If the pass encounters a semantic error, it throws
   * |PEG.GrammarError|.
   */
  passes: {
    check: {
      reportUnusedRules:     require("./compiler/passes/report-unused-rules"),
      reportOverridingRules: require("./compiler/passes/report-overriding-rules"),
      reportMissingRules:    require("./compiler/passes/report-missing-rules"),
      reportLeftRecursion:   require("./compiler/passes/report-left-recursion")
    },
    transform: {
      removeProxyRules:      require("./compiler/passes/remove-proxy-rules")
    },
    generate: {
      generateBytecode:      require("./compiler/passes/generate-bytecode"),
      generateJavascript:    require("./compiler/passes/generate-javascript")
    }
  },

  /*
   * Generates a parser from a specified grammar AST. Throws |PEG.GrammarError|
   * if the AST contains a semantic error. Note that not all errors are detected
   * during the generation and some may protrude to the generated parser and
   * cause its malfunction.
   */
  compile: function(ast, passes) {
    var options = arguments.length > 2 ? utils.clone(arguments[2]) : {},
        stage,
        problems = [],
        errors = 0,
        collector = {
          emitFatalError: function() {
            throw utils.construct(GrammarError, arguments);
          },
          emitError: function() {
            ++errors;
            problems.push(['error'].concat(Array.prototype.slice.call(arguments, 0)));
          },
          emitWarning: function() {
            problems.push(['warning'].concat(Array.prototype.slice.call(arguments, 0)));
          },
          emitInfo: function() {
            problems.push(['info'].concat(Array.prototype.slice.call(arguments, 0)));
          },
        };

    /*
     * Extracted into a function just to silence JSHint complaining about
     * creating functions in a loop.
     */
    function runPass(pass) {
      pass(ast, options);
    }
    function chain(f1, f2) {
      return function() {
        f1.apply(null, arguments);
        f2.apply(null, arguments);
      }
    }

    utils.defaults(options, {
      allowedStartRules:  [ast.rules[0].name],
      cache:              false,
      optimize:           "speed",
      output:             "parser"
    });
    var userCollector = options.collector;
    if (userCollector) {
      for (var f in userCollector) {
        if (userCollector.hasOwnProperty(f) && collector.hasOwnProperty(f)) {
          userCollector[f] = chain(userCollector[f], collector[f]);
        }
      }
    } else {
      options.collector = collector;
    }

    for (stage in passes) {
      if (passes.hasOwnProperty(stage)) {
        // Clear array.
        problems.length = 0;
        errors = 0;
        utils.each(passes[stage], runPass);
        // Collect all errors by stage
        if (errors !== 0) {
          throw new GrammarError("Stage "+stage+" contains errors.", problems);
        }
      }
    }
    switch (options.output) {
      case "parser": return eval(ast.code);
      case "source": return ast.code;
    }
  }
};
