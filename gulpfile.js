var child_process = require("child_process");
var concat = require("gulp-concat");
var del = require("del");
var fs = require("fs");
var gulp = require("gulp");
var insert = require("gulp-insert");
var jasmine = require("jasmine-node");
var jshint = require("gulp-jshint");
var path = require("path");
var pegjs = require("./gulp-pegjs");
var rename = require("gulp-rename");
var stylish = require("jshint-stylish");
var uglify = require("gulp-uglify");

// ===== Variables =====

var VERSION_FILE = "VERSION";
var PEGJS_VERSION = fs.readFileSync(VERSION_FILE).toString().trim();

// ===== Modules =====

// Order matters -- dependencies must be listed before modules dependent on them.
var MODULES = [
  "utils/arrays",
  "utils/objects",
  "utils/classes",
  "grammar-error",
  "parser",
  "compiler/asts",
  "compiler/visitor",
  "compiler/opcodes",
  "compiler/javascript",
  "compiler/passes/generate-bytecode",
  "compiler/passes/generate-javascript",
  "compiler/passes/remove-proxy-rules",
  "compiler/passes/report-left-recursion",
  "compiler/passes/report-missing-rules",
  "compiler",
  "peg"
];

// ===== Directories =====

var SRC_DIR              = "src";
var LIB_DIR              = "lib";
var BIN_DIR              = "bin";
var BROWSER_DIR          = "browser";
var SPEC_DIR             = "spec";
var BENCHMARK_DIR        = "benchmark";

// ===== Files =====

var PARSER_SRC_FILE = path.join(SRC_DIR, "parser.pegjs");

var BROWSER_FILE_DEV = "peg-" + PEGJS_VERSION + ".js";
var BROWSER_FILE_MIN = "peg-" + PEGJS_VERSION + ".min.js";

var GULPFILE = "gulpfile.js";

// ===== Executables =====

var PEGJS         = path.join(BIN_DIR, "pegjs");
var BENCHMARK_RUN = path.join(BENCHMARK_DIR, "run");

// ===== Tasks =====

// Generate the grammar parser
gulp.task("parser", function() {
  return gulp.src(PARSER_SRC_FILE)
    .pipe(pegjs())
    .pipe(gulp.dest(LIB_DIR));
});

// Build the browser version of the library
gulp.task("browser", function() {
  // The following code is inspired by CoffeeScript's Cakefile.
  var header = [
    '/*',
    ' * PEG.js ' + PEGJS_VERSION,
    ' *',
    ' * http://pegjs.org/',
    ' *',
    ' * Copyright (c) 2010-2013 David Majda',
    ' * Licensed under the MIT license.',
    ' */',
    'var PEG = (function(undefined) {',
    '  var modules = {',
    '    define: function(name, factory) {',
    '      var dir    = name.replace(/(^|\\/)[^/]+$/, "$1"),',
    '          module = { exports: {} };',
    '',
    '      function require(path) {',
    '        var name   = dir + path,',
    '            regexp = /[^\\/]+\\/\\.\\.\\/|\\.\\//;',
    '',
    "        /* Can't use /.../g because we can move backwards in the string. */",
    '        while (regexp.test(name)) {',
    '          name = name.replace(regexp, "");',
    '        }',
    '',
    '        return modules[name];',
    '      }',
    '',
    '      factory(module, require);',
    '      this[name] = module.exports;',
    '    }',
    '  };',
    '',
    ''].join("\n");

  // find all files to concatenate
  var modules = [];
  for (var i = 0; i < MODULES.length; ++i) {
    modules.push(path.join(LIB_DIR, MODULES[i]) + ".js");
  }

  return gulp.src(modules)

    // indent files
    .pipe(insert.transform(function(contents) {
      return contents.trim().replace(/^/mg, "    ");
    }))
    
    // add module definition header to every file
    .pipe(insert.prepend(function(file) {
      var module = path.relative(path.resolve(LIB_DIR), file.path);
      module = module.replace(/\\/g, "/").replace(/\.js$/, "");
      return '  modules.define("' + module + '", function(module, require) {\n';
    }))

    // finish module definition
    .pipe(insert.append('\n  });\n'))
    
    // concatenate all files
    .pipe(concat(BROWSER_FILE_DEV))
    
    // add header and suffix
    .pipe(insert.wrap(header, '\n  return modules["peg"]\n})();\n'))
    
    // write non-minified bundle
    .pipe(gulp.dest(BROWSER_DIR))

    // create minified bundle
    .pipe(rename(BROWSER_FILE_MIN))
    .pipe(uglify({
      preserveComments: function(node, comment) {
        // keep all comments containing "Copyright"
        return comment.value.indexOf("Copyright") >= 0;
      }
    }))

    // write minified bundle
    .pipe(gulp.dest(BROWSER_DIR));
});

// Remove browser version of the library (created by "browser" task)
gulp.task("browserclean", function(done) {
  del([BROWSER_DIR], done);
});

// Run the spec suite
gulp.task("spec", function(done) {
  var onComplete = function(runner, log) {
    done(runner.results().failedCount);
  };

  jasmine.loadHelpersInFolder(SPEC_DIR, /helpers?\.js$/i);
  jasmine.executeSpecsInFolder({
    specFolders: [SPEC_DIR],
    onComplete: onComplete,
    isVerbose: true,
    showColors: true,
    includeStackTrace: true
  });
});

// Run the benchmark suite
gulp.task("benchmark", function(done) {
  var cmd = BENCHMARK_RUN;
  var args = [];
  if (process.platform === "win32") {
    args.push(cmd);
    cmd = "node";
  }
  child_process
    .spawn(cmd, args, { stdio: "inherit" })
    .on("close", done);
});

// Run JSHint on the source
gulp.task("hint", function() {
  return gulp.src([
      path.join(LIB_DIR, "**", "*.js"),
      path.join(SPEC_DIR, "**", "*.js"),
      "!" + path.join(SPEC_DIR, "vendor", "**", "*.js"),
      path.join(BENCHMARK_DIR, "*.js"),
      BENCHMARK_RUN,
      PEGJS,
      GULPFILE
    ])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter("fail"));
});

// Remove all build artifacts
gulp.task("clean",  ["browserclean"]);

// Default task
gulp.task("default", ["browser"]);
