/*
 * Compiler passes.
 *
 * Each pass is a function that is passed the AST. It can perform checks on it
 * or modify it as needed. If the pass encounters a semantic error, it throws
 * |PEG.GrammarError|.
 */
module.exports = {
  reportMissingRules:  require("./passes/report-missing-rules"),
  reportLeftRecursion: require("./passes/report-left-recursion"),
  removeProxyRules:    require("./passes/remove-proxy-rules"),
  generateBytecode:    require("./passes/generate-bytecode"),
  generateJavascript:  require("./passes/generate-javascript")
};
