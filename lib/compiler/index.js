"use strict";

function processOptions(options, defaults) {
  let processedOptions = {};

  Object.keys(options).forEach(name => {
    processedOptions[name] = options[name];
  });

  Object.keys(defaults).forEach(name => {
    if (!processedOptions.hasOwnProperty(name)) {
      processedOptions[name] = defaults[name];
    }
  });

  return processedOptions;
}

let compiler = {
  // AST node visitor builder. Useful mainly for plugins which manipulate the
  // AST.
  visitor: require("./visitor"),

  // Compiler passes.
  //
  // Each pass is a function that is passed the AST. It can perform checks on it
  // or modify it as needed. If the pass encounters a semantic error, it throws
  // |peg.GrammarError|.
  passes: {
    check: {
      reportUndefinedRules: require("./passes/report-undefined-rules"),
      reportDuplicateRules: require("./passes/report-duplicate-rules"),
      reportDuplicateLabels: require("./passes/report-duplicate-labels"),
      reportInfiniteRecursion: require("./passes/report-infinite-recursion"),
      reportInfiniteRepetition: require("./passes/report-infinite-repetition")
    },
    transform: {
      removeProxyRules: require("./passes/remove-proxy-rules")
    },
    generate: {
      generateBytecode: require("./passes/generate-bytecode"),
      generateJS: require("./passes/generate-js")
    }
  },

  // Generates a parser from a specified grammar AST. Throws |peg.GrammarError|
  // if the AST contains a semantic error. Note that not all errors are detected
  // during the generation and some may protrude to the generated parser and
  // cause its malfunction.
  compile: function(ast, passes, options) {
    options = options !== undefined ? options : {};

    options = processOptions(options, {
      allowedStartRules: [ast.rules[0].name],
      cache: false,
      dependencies: {},
      exportVar: null,
      format: "bare",
      optimize: "speed",
      output: "parser",
      trace: false
    });

    Object.keys(passes).forEach(stage => {
      passes[stage].forEach(p => { p(ast, options); });
    });

    switch (options.output) {
      case "parser": return eval(ast.code);
      case "source": return ast.code;
    }
  }
};

module.exports = compiler;
