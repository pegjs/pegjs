"use strict";

const { spawn } = require( "child_process" );
const { series, src, task } = require( "gulp" );
const eslint = require( "gulp-eslint" );
const mocha = require( "gulp-mocha" );
const del = require( "del" );
const pump = require( "pump" );

function node( args, cb ) {

    spawn( "node", args.split( " " ), { stdio: "inherit" } )

        .on( "error", cb )
        .on( "close", code => {

            if ( ! code ) cb();

        } );

}

// Run ESLint on all JavaScript files.
task( "lint", () => pump(

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
    eslint.failAfterError()

) );

// Run tests.
task( "test", () => pump(

    src( "test/spec/**/*.spec.js", { read: false } ),
    mocha()

) );

// Run benchmarks.
task( "benchmark", cb => {

    node( "test/benchmark/run", cb );

} );

// Generate the grammar parser.
task( "build:parser", cb => {

    node( "packages/pegjs/bin/peg -c src/pegjs.config.js", cb );

} );

// Delete the generated files.
task( "clean", () =>
    del( [ "packages/pegjs/dist", "website/js/*-bundle.js", "examples/*.js" ] )
);

// Default task.
task( "default", series( "lint", "test" ) );
