"use strict";

let generateBytecode = require("./passes/generate-bytecode");
let generateJS = require("./passes/generate-js");
let removeProxyRules = require("./passes/remove-proxy-rules");
let reportDuplicateLabels = require("./passes/report-duplicate-labels");
let reportDuplicateRules = require("./passes/report-duplicate-rules");
let reportInfiniteRecursion = require("./passes/report-infinite-recursion");
let reportInfiniteRepetition = require("./passes/report-infinite-repetition");
let reportUndefinedRules = require("./passes/report-undefined-rules");
let visitor = require("./visitor");

function processOptions(options, defaults) {
  let processedOptions = {};

  Object.keys(options).forEach(name => {
    processedOptions[name] = options[name];
  });

  Object.keys(defaults).forEach(name => {
    if (!Object.prototype.hasOwnProperty.call(processedOptions, name)) {
      processedOptions[name] = defaults[name];
    }
  });

  return processedOptions;
}

let compiler = {
  // AST node visitor builder. Useful mainly for plugins which manipulate the
  // AST.
  visitor: visitor,

  // Compiler passes.
  //
  // Each pass is a function that is passed the AST. It can perform checks on it
  // or modify it as needed. If the pass encounters a semantic error, it throws
  // |peg.GrammarError|.
  passes: {
    check: {
      reportUndefinedRules: reportUndefinedRules,
      reportDuplicateRules: reportDuplicateRules,
      reportDuplicateLabels: reportDuplicateLabels,
      reportInfiniteRecursion: reportInfiniteRecursion,
      reportInfiniteRepetition: reportInfiniteRepetition
    },
    transform: {
      removeProxyRules: removeProxyRules
    },
    generate: {
      generateBytecode: generateBytecode,
      generateJS: generateJS
    }
  },

  // Generates a parser from a specified grammar AST. Throws |peg.GrammarError|
  // if the AST contains a semantic error. Note that not all errors are detected
  // during the generation and some may protrude to the generated parser and
  // cause its malfunction.
  compile(ast, passes, options={}) {

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
      case "parser":
        return eval(ast.code);

      case "source":
        return ast.code;

      default:
        throw new Error(`Invalid output format: ${options.output}.`);
    }
  }
};

module.exports = compiler;
