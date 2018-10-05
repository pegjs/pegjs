"use strict";

const { run } = require( "@futagoza/child-process" );
const { series, src, task } = require( "@futagoza/gulpx" );
const eslint = require( "gulp-eslint" );
const del = require( "del" );

// Run ESLint on all JavaScript files.
task( "lint", () => [

    src( [
        "**/.*rc.js",
        "packages/**/*.js",
        "test/benchmark/**/*.js",
        "test/benchmark/run",
        "test/impact",
        "test/spec/**/*.js",
        "src/*.js",
        "rollup.config.js",
        "gulpfile.js",
        "server.js",
    ] ),
    eslint( { dotfiles: true } ),
    eslint.format(),
    eslint.failAfterError(),

] );

// Run tests.
task( "test", () =>

    run( "node node_modules/mocha/bin/mocha test/spec/**/*.spec.js" )

);

// Run benchmarks.
task( "benchmark", () =>

    run( "node test/benchmark/run" )

);

// Generate the grammar parser.
task( "build:parser", () =>

    run( "node packages/pegjs/bin/peg -c src/pegjs.config.js" )

);

// Delete the generated files.
task( "clean", () =>
    del( [ "packages/pegjs/dist", "website/js/*-bundle.js", "examples/*.js" ] )
);

// Default task.
task( "default", series( "lint", "test" ) );
