"use strict";

let babelify = require("babelify");
let browserify = require("browserify");
let buffer = require("vinyl-buffer");
let del = require("del");
let eslint = require("gulp-eslint");
let gulp = require("gulp");
let header = require("gulp-header");
let mocha = require("gulp-mocha");
let rename = require("gulp-rename");
let runSequence = require("run-sequence");
let source = require("vinyl-source-stream");
let spawn = require("child_process").spawn;
let uglify = require("gulp-uglify");

function execFile(args) {
  return spawn("node", args.split(" "), { stdio: "inherit" });
}

// Run ESLint on all JavaScript files.
gulp.task("lint", () =>
  gulp.src([
    "lib/**/*.js",
    "!lib/parser.js",
    "test/benchmark/**/*.js",
    "test/benchmark/run",
    "test/impact",
    "test/spec/**/*.js",
    "test/server/run",
    "bin/*.js",
    "gulpfile.js"
  ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
);

// Run tests.
gulp.task("test", () =>
  gulp.src("test/spec/**/*.spec.js", { read: false })
    .pipe(mocha())
);

// Run benchmarks.
gulp.task("benchmark", () => execFile("test/benchmark/run"));

// Create the browser build.
gulp.task("browser:build", () => {
  const HEADER = [
    "//",
    "// PEG.js v" + require("./package").version,
    "// https://pegjs.org/",
    "//",
    "// Copyright (c) 2010-2016 David Majda",
    "// Copyright (c) 2017+ Futago-za Ryuu",
    "//",
    "// Licensed under the MIT License.",
    "//",
    ""
  ]
    .map(line => `${line}\n`)
    .join("");

  return browserify("lib/peg.js", { standalone: "peg" })
    .transform(babelify, { presets: "es2015", compact: false })
    .bundle()
    .pipe(source("peg.js"))
    .pipe(header(HEADER))
    .pipe(gulp.dest("browser"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(header(HEADER))
    .pipe(gulp.dest("browser"));
});

// Delete the browser build.
gulp.task("browser:clean", () => del("browser"));

// Generate the grammar parser.
gulp.task("parser", () =>
  execFile("bin/peg src/parser.pegjs -o lib/parser.js")
);

// Default task.
gulp.task("default", cb =>
  runSequence("lint", "test", cb)
);
