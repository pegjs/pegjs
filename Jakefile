var sys = require("sys");
var fs  = require("fs");

/* Relative paths are here because of use in |require|. */
var SRC_DIR = "./src";
var LIB_DIR = "./lib";
var BIN_DIR = "./bin";

var PEGJS = BIN_DIR + "/pegjs";

var PEGJS_SRC_FILE = SRC_DIR + "/peg.js";
var PEGJS_OUT_FILE = LIB_DIR + "/peg.js";

var PARSER_SRC_FILE = SRC_DIR + "/parser.pegjs";
var PARSER_OUT_FILE = SRC_DIR + "/parser.js";

var PEGJS_VERSION = fs.readFileSync("VERSION", "utf8").trim();

function exitFailure() {
  process.exit(1);
}

function abort(message) {
  sys.error(message);
  exitFailure();
}

desc("Generate the grammar parser");
task("parser", [], function() {
  var PEG = require(PEGJS_OUT_FILE);
  var input = fs.readFileSync(PARSER_SRC_FILE, "utf8");

  try {
    var parser = PEG.buildParser(input);
  } catch (e) {
    if (e.line !== undefined && e.column !== undefined) {
      abort(e.line + ":" + e.column + ": " + e.message);
    } else {
      abort(e.message);
    }
  }

  fs.writeFileSync(PARSER_OUT_FILE, "PEG.parser = " + parser.toSource() + ";\n");
});

desc("Build the peg.js file");
task("build", [], function() {
  function preprocess(file) {
    var input = fs.readFileSync(file, "utf8").trim();
    return input.split("\n").map(function(line) {
      var matches = /^\s*\/\/\s*@include\s*"([^"]*)"\s*$/.exec(line);
      if (matches !== null) {
        var includedFile = SRC_DIR + "/" + matches[1];

        try {
          fs.statSync(includedFile);
        } catch (e) {
          abort("Included file \"" + includedFile + "\" does not exist.");
        }

        return preprocess(includedFile);
      } else {
        return line;
      }
    }).join("\n").replace("@VERSION", PEGJS_VERSION);
  }

  fs.writeFileSync(PEGJS_OUT_FILE, preprocess(PEGJS_SRC_FILE), "utf8");
  try {
    fs.statSync(LIB_DIR);
  } catch (e) {
    fs.mkdirSync(LIB_DIR, 0755);
  }
});

task("default", ["build"], function() {});
