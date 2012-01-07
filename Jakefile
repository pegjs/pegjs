var util         = require("util");
var fs           = require("fs");
var path         = require("path");
var childProcess = require("child_process");

var PEGJS_VERSION = fs.readFileSync("VERSION", "utf8").trim();

/* Relative paths are here because of use in |require|. */
var SRC_DIR       = "./src";
var TEST_DIR      = "./test";
var BENCHMARK_DIR = "./benchmark";
var LIB_DIR       = "./lib";
var BIN_DIR       = "./bin";
var EXAMPLES_DIR  = "./examples";
var DIST_DIR      = "./dist";
var DIST_WEB_DIR  = "./dist/web";
var DIST_NODE_DIR = "./dist/node";

var SRC_FILES  = fs.readdirSync(SRC_DIR).filter(function(file) {
  return /\.js$/.test(file);
}).map(function(file) {
  return SRC_DIR + "/" + file;
});

var TEST_FILES = fs.readdirSync(TEST_DIR).filter(function(file) {
  return /-test\.js$/.test(file);
}).map(function(file) {
  return TEST_DIR + "/" + file;
});
var TEST_HELPERS_FILE = TEST_DIR + "/helpers.js";
var TEST_RUN_FILE     = TEST_DIR + "/run";

var BENCHMARK_BENCHMARKS_FILE = BENCHMARK_DIR + "/benchmarks.js";
var BENCHMARK_RUNNER_FILE     = BENCHMARK_DIR + "/runner.js";
var BENCHMARK_INDEX_FILE      = BENCHMARK_DIR + "/index.js";
var BENCHMARK_RUN_FILE        = BENCHMARK_DIR + "/run";

var PEGJS = BIN_DIR + "/pegjs";

var PEGJS_SRC_FILE = SRC_DIR + "/peg.js";
var PEGJS_OUT_FILE = LIB_DIR + "/peg.js";

var PEGJS_DIST_FILE     = DIST_WEB_DIR + "/peg-" + PEGJS_VERSION + ".js"
var PEGJS_DIST_MIN_FILE = DIST_WEB_DIR + "/peg-" + PEGJS_VERSION + ".min.js"

var PARSER_SRC_FILE = SRC_DIR + "/parser.pegjs";
var PARSER_OUT_FILE = SRC_DIR + "/parser.js";

var JAKEFILE = "./Jakefile";

function exitFailure() {
  process.exit(1);
}

function abort(message) {
  util.error(message);
  exitFailure();
}

function mkdirUnlessExists(dir) {
  try {
    fs.statSync(dir);
  } catch (e) {
    fs.mkdirSync(dir, 0755);
  }
}

function copyFile(src, dest) {
  fs.writeFileSync(dest, fs.readFileSync(src));
}

function copyDir(src, dest) {
  mkdirUnlessExists(dest);

  fs.readdirSync(src).every(function(file) {
    var srcFile  = src  + "/" + file;
    var destFile = dest + "/" + file;

    var stats = fs.statSync(srcFile);
    if (stats.isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      copyFile(srcFile, destFile);
      fs.chmodSync(destFile, stats.mode);
    }

    return true;
  });
}

function dirExists(dir) {
  try {
    var stats = fs.statSync(file);
  } catch (e) {
    return false;
  }

  return stats.isDirectory();
}

function removeDir(dir) {
  fs.readdirSync(dir).every(function(file) {
    var file = dir  + "/" + file;

    var stats = fs.statSync(file);
    if (stats.isDirectory()) {
      removeDir(file);
    } else {
      fs.unlinkSync(file);
    }

    return true;
  });

  fs.rmdirSync(dir);
}

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
  }).join("\n").replace(/@VERSION/g, PEGJS_VERSION);
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
  mkdirUnlessExists(LIB_DIR);
  fs.writeFileSync(PEGJS_OUT_FILE, preprocess(PEGJS_SRC_FILE), "utf8");
});

desc("Remove built peg.js file (created by \"build\")");
task("clean", [], function() {
  if (dirExists(LIB_DIR)) {
    removeDir(LIB_DIR);
  }
});

desc("Prepare the distribution files");
task("dist", ["build"], function() {
  mkdirUnlessExists(DIST_DIR);

  /* Web */

  mkdirUnlessExists(DIST_WEB_DIR);

  copyFile(PEGJS_OUT_FILE, PEGJS_DIST_FILE);

  var process = childProcess.spawn(
    "uglifyjs",
    ["--ascii", "-o", PEGJS_DIST_MIN_FILE, PEGJS_OUT_FILE],
    { customFds: [0, 1, 2] }
  );
  process.on("exit", function() { complete(); });

  /* Node.js */

  mkdirUnlessExists(DIST_NODE_DIR);

  copyDir(LIB_DIR,      DIST_NODE_DIR + "/lib");
  copyDir(BIN_DIR,      DIST_NODE_DIR + "/bin");
  copyDir(EXAMPLES_DIR, DIST_NODE_DIR + "/examples");

  copyFile("CHANGELOG", DIST_NODE_DIR + "/CHANGELOG");
  copyFile("LICENSE",   DIST_NODE_DIR + "/LICENSE");
  copyFile("README.md", DIST_NODE_DIR + "/README.md");
  copyFile("VERSION",   DIST_NODE_DIR + "/VERSION");

  fs.writeFileSync(DIST_NODE_DIR + "/package.json", preprocess("package.json"), "utf8");
}, true);

desc("Remove the distribution files (created by \"dist\")");
task("distclean", [], function() {
  if (dirExists(DIST_DIR)) {
    removeDir(DIST_DIR);
  }
});

desc("Run the test suite");
task("test", ["build"], function() {
  var process = childProcess.spawn("test/run", [], { customFds: [0, 1, 2] });
  process.on("exit", function() { complete(); });
}, true);

desc("Run the benchmark suite");
task("benchmark", ["build"], function(runCount) {
  var process = childProcess.spawn(
    "benchmark/run",
    runCount !== undefined ? [runCount] : [],
    { customFds: [0, 1, 2] }
  );
  process.on("exit", function() { complete(); });
}, true);

desc("Run JSHint");
task("hint", ["build"], function() {
  var process = childProcess.spawn(
    "jshint",
    SRC_FILES.concat(TEST_FILES).concat([
      TEST_HELPERS_FILE,
      TEST_RUN_FILE,
      BENCHMARK_BENCHMARKS_FILE,
      BENCHMARK_RUNNER_FILE,
      BENCHMARK_INDEX_FILE,
      BENCHMARK_RUN_FILE,
      PEGJS,
      JAKEFILE
    ]),
    { customFds: [0, 1, 2] }
  );
  process.on("exit", function() { complete(); });
}, true);

task("default", ["build"], function() {});
