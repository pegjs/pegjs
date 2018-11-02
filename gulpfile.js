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
        "test/**/*.js",
        "tools/**/*.js",
        "src/*.js",
        "rollup.config.js",
        "gulpfile.js",
        "server.js",
    ] ),
    eslint( { dotfiles: true } ),
    eslint.format(),
    eslint.failAfterError(),

] );

// Generate the grammar parser.
task( "build:parser", () =>

    run( "node packages/pegjs/bin/peg -c src/pegjs.config.js" )

);

// Delete the generated files.
task( "clean", () =>
    del( [ "packages/pegjs/dist", "website/js/*-bundle.js", "examples/*.js" ] )
);
